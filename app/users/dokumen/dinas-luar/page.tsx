'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { FileText, ChevronLeft, Printer, Download } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'
import { markSpecificNotificationAsReadAction } from '@/app/actions/user-actions'
import { useRouter, useSearchParams } from 'next/navigation'
import { StatusModal } from '@/components/StatusModal'

function SuratDinasLuarContent() {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const requestId = searchParams.get('id')
  const notificationId = searchParams.get('notificationId')

  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [requestData, setRequestData] = useState<any>(null)
  
  const [modal, setModal] = useState<{ isOpen: boolean, status: 'success' | 'error' | 'loading', message: string }>({
    isOpen: false,
    status: 'loading',
    message: ''
  })
  
  const [formData, setFormData] = useState({
    tanggalMulai: new Date().toISOString().split('T')[0],
    tanggalSelesai: new Date().toISOString().split('T')[0],
    jabatan: 'Passenger Service',
    penjelasan: 'Sedang ada pelatihan di stasiun BNI City'
  })

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('users').select('*, stations(name)').eq('id', user.id).single()
        setUserData(data)
        if (data) setFormData(prev => ({ ...prev, jabatan: data.position }))
      }
    }
    getUserData()
  }, [])

  useEffect(() => {
    const markNotificationAsRead = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (notificationId) {
          await markSpecificNotificationAsReadAction(user.id, notificationId)
          return
        }

        // Fallback: Cari notifikasi yang cocok berdasarkan user_id + reference_id
        const { data: notifs } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_read', false)
          .eq('reference_id', requestId)
          .limit(1)

        if (notifs && notifs.length > 0) {
          await markSpecificNotificationAsReadAction(user.id, notifs[0].id)
        }
      } catch (err) {
        console.error('Error marking notifications as read:', err)
      }
    }

    if (requestId) markNotificationAsRead()
  }, [requestId, notificationId])

  useEffect(() => {
    if (requestId) {
      const fetchRequest = async () => {
        const { data, error } = await supabase
          .from('approval_requests')
          .select('*')
          .eq('id', requestId)
          .single()
        if (!error && data) {
          setRequestData(data)
        }
      }
      fetchRequest()
    }
  }, [requestId])

  const handleSubmit = async () => {
    setLoading(true)
    setModal({ isOpen: true, status: 'loading', message: 'Sedang memproses pengajuan dinas luar Anda...' })

    const { data: insertedData, error } = await supabase
      .from('approval_requests')
      .insert({
        user_id: userData.id,
        type: 'DINAS_LUAR',
        status: 'Proses',
        alasan_penjelasan: formData.penjelasan,
        tgl_mulai_dinas: formData.tanggalMulai,
        tgl_selesai_dinas: formData.tanggalSelesai,
        kedudukan: userData?.stations?.name || null,
        jabatan: formData.jabatan || userData?.position || null
      })
      .select('id')
      .single()

    if (error) {
       setModal({ isOpen: true, status: 'error', message: 'Gagal: ' + error.message })
    } else {
        await supabase.from('notifications').insert({
          user_id: userData.id,
          title: 'PENGAJUAN DINAS LUAR',
          message: `${userData?.full_name} mengajukan dinas luar.`,
          type: 'APPROVAL_UPDATE',
          reference_id: insertedData?.id
        })

       setModal({ isOpen: true, status: 'success', message: 'Pengajuan Dinas Luar berhasil dikirim!' })
    }
    setLoading(false)
  }

  const handleCloseModal = () => {
    setModal({ ...modal, isOpen: false })
    if (modal.status === 'success') {
      router.push('/users/notifikasi/riwayat')
    }
  }

  // Printable Document view
  if (requestId && requestData) {
    return (
      <div className="bg-white min-h-screen pb-32">
        {/* Header (Hidden when printing) */}
        <div className="bg-brand-red pt-12 pb-6 px-6 relative print:hidden">
          <div className="max-w-4xl mx-auto flex items-center relative z-10">
            <button 
              onClick={() => router.push('/users/notifikasi/riwayat')}
              className="text-white p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronLeft size={32} />
            </button>
            <div className="flex flex-col ml-4">
               <h1 className="text-xl lg:text-3xl font-bold text-white leading-tight">
                  Dokumen Persetujuan
               </h1>
               <p className="text-white/85 text-xs font-bold uppercase tracking-wider">
                  DINAS LUAR
               </p>
            </div>
          </div>
        </div>

        {/* Paper Container */}
        <div className="max-w-3xl mx-auto px-8 py-10 mt-6 border border-zinc-200 rounded-xl shadow-md bg-white print:border-none print:shadow-none print:mt-0 print:py-0 print:px-0">
          <div className="flex justify-between items-center border-b-2 border-zinc-800 pb-4 mb-6">
            <div className="flex flex-col">
              <div className="flex items-center space-x-1">
                <span className="text-3xl font-black text-[#003FE1] italic">KAI</span>
                <span className="text-xs font-bold text-red-600 uppercase mt-2">Commuter</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-bold mt-1 uppercase">PT KAI Commuter Jabodetabek</span>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-extrabold text-zinc-900 uppercase">SURAT KETERANGAN DINAS LUAR</h2>
              <span className="text-xs text-emerald-600 font-bold uppercase">STATUS: DISETUJUI</span>
            </div>
          </div>

          <div className="text-center my-8">
            <h3 className="text-base font-bold text-zinc-900 underline uppercase tracking-wide">
              SURAT PERNYATAAN DINAS LUAR PEGAWAI
            </h3>
            <span className="text-xs text-zinc-400">Nomor: SKDL/{requestData.id.substring(0, 8).toUpperCase()}/{new Date(requestData.created_at).getFullYear()}</span>
          </div>

          <div className="space-y-6 text-sm text-zinc-800 leading-relaxed font-medium">
            <p>Yang bertanda tangan di bawah ini menerangkan bahwa:</p>
            
            <div className="grid grid-cols-3 gap-y-2 border border-zinc-200 p-4 bg-zinc-50 rounded-lg max-w-xl">
              <span className="font-bold text-zinc-500">Nama Pegawai</span>
              <span className="col-span-2 text-zinc-900 font-bold">: {userData?.full_name || 'Loading...'}</span>

              <span className="font-bold text-zinc-500">ID / NIK</span>
              <span className="col-span-2 text-zinc-900 font-bold">: {userData?.nik || '-'}</span>

              <span className="font-bold text-zinc-500">Jabatan</span>
              <span className="col-span-2 text-zinc-900 font-bold">: {requestData.jabatan || userData?.position || '-'}</span>

              <span className="font-bold text-zinc-500">Stasiun / Kedudukan</span>
              <span className="col-span-2 text-zinc-900 font-bold">: {requestData.kedudukan || userData?.stations?.name || '-'}</span>
            </div>

            <p>Telah disetujui oleh Manajemen KAI Commuter untuk melaksanakan tugas <strong>Dinas Luar</strong> pada periode tanggal:</p>
            <p className="bg-emerald-50 text-emerald-700 font-bold py-2 px-4 rounded-md inline-block">
              {new Date(requestData.tgl_mulai_dinas).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              &nbsp; s.d. &nbsp;
              {new Date(requestData.tgl_selesai_dinas).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            <div className="space-y-2">
              <h4 className="font-bold text-zinc-800">Alasan / Penjelasan Penugasan:</h4>
              <p className="border border-zinc-200 p-4 rounded-md italic bg-zinc-50/50">
                "{requestData.alasan_penjelasan || '-'}"
              </p>
            </div>

            {requestData.attachment_url && (
              <div className="space-y-2 print:hidden">
                <h4 className="font-bold text-zinc-800">Bukti Dokumentasi Dinas Luar:</h4>
                <div className="w-64 h-48 border border-zinc-200 rounded-lg overflow-hidden relative">
                  <img src={requestData.attachment_url} alt="Bukti Dinas Luar" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            <p>Demikian surat pernyataan ini dibuat agar dapat dipergunakan sebagaimana mestinya.</p>
          </div>

          {/* Signature basah */}
          <div className="mt-16 grid grid-cols-2 text-center text-sm font-bold text-zinc-800">
            <div className="flex flex-col items-center">
              <span>Mengetahui,</span>
              <span>PT KAI Commuter</span>
              <div className="h-24"></div>
              <span className="border-t border-zinc-400 w-44 pt-1 font-black">Admin / Staf Stasiun</span>
            </div>
            <div className="flex flex-col items-center">
              <span>Yang Bertugas,</span>
              <div className="h-24"></div>
              <span className="border-t border-zinc-400 w-44 pt-1 font-black">{userData?.full_name}</span>
            </div>
          </div>

          {/* Print/Download triggers */}
          <div className="mt-12 flex space-x-4 justify-center print:hidden">
            <button 
              onClick={() => window.print()}
              className="bg-brand-red text-white font-bold px-6 py-3 rounded-xl shadow-lg active:scale-95 transition-all flex items-center space-x-2"
            >
              <Printer size={16} />
              <span>Print Surat</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="bg-zinc-800 text-white font-bold px-6 py-3 rounded-xl shadow-lg active:scale-95 transition-all flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen pb-32">
      {/* Header Area */}
      <div className="bg-brand-red pt-12 pb-12 w-full relative">
        <div className="max-w-4xl mx-auto flex items-center px-4 w-full relative">
          <button 
            onClick={() => router.back()}
            className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
          <div className="flex items-center justify-center mx-auto space-x-2">
            <FileText className="text-white" size={30} />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Dokumen</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 mt-6">
         {/* KAI Logo */}
         <div className="w-full mb-8">
            <Image 
               src="/images/logo splash.png" 
               alt="KAI Commuter" 
               width={160} 
               height={60} 
               className="object-contain"
            />
         </div>

         {/* Form Data */}
         <div className="space-y-4">
            <div>
               <label className="block text-[13px] text-zinc-900 font-medium mb-1">Tanggal</label>
               <div className="flex items-center space-x-3">
                 <input 
                   type="date"
                   value={formData.tanggalMulai}
                   onChange={(e) => setFormData({...formData, tanggalMulai: e.target.value})}
                   className="flex-1 border border-brand-red rounded-md px-3 py-2 text-[13px] text-zinc-700 bg-white" 
                 />
                 <span className="text-sm font-bold text-zinc-900">S.D</span>
                 <input 
                   type="date"
                   value={formData.tanggalSelesai}
                   onChange={(e) => setFormData({...formData, tanggalSelesai: e.target.value})}
                   className="flex-1 border border-brand-red rounded-md px-3 py-2 text-[13px] text-zinc-700 bg-white" 
                 />
               </div>
            </div>

            <div>
               <label className="block text-[13px] text-zinc-900 font-medium mb-1">Nama</label>
               <div className="w-full border border-brand-red rounded-md px-3 py-2 text-[13px] text-zinc-700 bg-zinc-50">{userData?.full_name || 'Loading...'}</div>
            </div>

            <div>
               <label className="block text-[13px] text-zinc-900 font-medium mb-1">ID</label>
               <div className="w-full border border-brand-red rounded-md px-3 py-2 text-[13px] text-zinc-700 bg-zinc-50">{userData?.nik || '-'}</div>
            </div>

            <div>
               <label className="block text-[13px] text-zinc-900 font-medium mb-1">Kedudukan</label>
               <div className="w-full border border-brand-red rounded-md px-3 py-2 text-[13px] text-zinc-700 bg-zinc-50">{userData?.stations?.name || '-'}</div>
            </div>

            <div>
               <label className="block text-[13px] text-zinc-900 font-medium mb-1">Jabatan</label>
               <input 
                 type="text"
                 value={formData.jabatan}
                 onChange={(e) => setFormData({...formData, jabatan: e.target.value})}
                 className="w-full border border-brand-red rounded-md px-3 py-2 text-[13px] text-zinc-700 bg-white" 
               />
            </div>

            <div>
               <label className="block text-[13px] text-zinc-900 font-medium mb-1">Penjelasan</label>
               <textarea 
                 value={formData.penjelasan}
                 onChange={(e) => setFormData({...formData, penjelasan: e.target.value})}
                 className="w-full border border-brand-red rounded-md px-3 py-2 min-h-[80px] text-[13px] text-zinc-700 bg-white mb-2" 
               />
            </div>

            <button 
              onClick={handleSubmit}
              disabled={loading || !userData}
              className="w-full bg-brand-red text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 disabled:opacity-50 transition-all"
            >
              {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
         </div>
      </div>

      <StatusModal 
        isOpen={modal.isOpen}
        status={modal.status}
        message={modal.message}
        onClose={handleCloseModal}
      />
      <BottomNav />
    </div>
  )
}

export default function SuratDinasLuarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-zinc-500">Memuat halaman dokumen...</p>
      </div>
    }>
      <SuratDinasLuarContent />
    </Suspense>
  )
}
