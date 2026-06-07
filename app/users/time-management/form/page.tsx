'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, Clock, Image as ImageIcon, Loader2 } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'
import { StatusModal } from '@/components/StatusModal'

type FormType = 'ubah-jadwal' | 'izin' | 'dinas-luar'

interface UserProfile {
  id: string
  full_name?: string
  nik?: string
  position?: string
  shift_code?: string
  stations?: { name?: string }
}

function TimeManagementFormContent() {
  const router = useRouter()
  const supabase = React.useMemo(() => createClient(), [])
  const searchParams = useSearchParams()
  const initialType = (searchParams.get('type') as FormType) || 'ubah-jadwal'
  
  const [activeForm, setActiveForm] = useState<FormType>(initialType)
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<UserProfile | null>(null)
  const [modal, setModal] = useState<{isOpen: boolean, status: 'loading' | 'success' | 'error', message: string}>({
    isOpen: false, status: 'success', message: ''
  })

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    reason: '',
    requested_shift: '',
    start_date: '',
    end_date: '',
    shift_code_awal: ''
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setModal({ isOpen: true, status: 'error', message: 'Ukuran file terlalu besar. Maksimal 10MB.' })
      return
    }
    setSelectedFile(file)
  }

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('users').select('*, stations(name)').eq('id', user.id).single()
        setUserData(profile as UserProfile)
      }
    }
    fetchUser()
  }, [supabase])

  const handleSubmit = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setModal({ isOpen: true, status: 'error', message: 'Sesi anda berakhir.' })
      setLoading(false)
      return
    }

    const typeMap: Record<FormType, string> = {
      'ubah-jadwal': 'UBAH_JADWAL',
      'izin': 'IZIN',
      'dinas-luar': 'DINAS_LUAR'
    }

    let fileUrl = null
    if (activeForm === 'dinas-luar' && selectedFile) {
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `dinas-luar/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('dinas-luar-evidence')
        .upload(filePath, selectedFile)

      if (uploadError) {
        setModal({ isOpen: true, status: 'error', message: 'Gagal mengunggah foto bukti: ' + uploadError.message })
        setLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('dinas-luar-evidence')
        .getPublicUrl(filePath)
      
      fileUrl = publicUrl
    }

    const { error } = await supabase.from('approval_requests').insert({
      user_id: user.id,
      type: typeMap[activeForm],
      status: 'Proses',
      alasan_penjelasan: formData.message || formData.reason,
      tgl_permohonan: formData.start_date || new Date().toISOString().split('T')[0],
      tgl_mulai_dinas: activeForm === 'dinas-luar' || activeForm === 'izin' ? formData.start_date : null,
      tgl_selesai_dinas: activeForm === 'dinas-luar' ? formData.end_date : null,
      shift_code_awal: activeForm === 'ubah-jadwal' ? (formData.shift_code_awal || userData?.shift_code || null) : null,
      shift_code_akhir: activeForm === 'ubah-jadwal' ? formData.requested_shift : null,
      kedudukan: userData?.stations?.name || null,
      jabatan: userData?.position || null,
      attachment_url: fileUrl
    })

    if (error) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal mengirim pengajuan: ' + error.message })
    } else {
      // Create notification for admin
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: `PENGAJUAN ${typeMap[activeForm].replace('_', ' ')}`,
        message: `${userData?.full_name} mengajukan ${typeMap[activeForm].toLowerCase().replace('_', ' ')}.`
      })
      
      setModal({ isOpen: true, status: 'success', message: 'Pengajuan berhasil dikirim!' })
    }
    setLoading(false)
  }

  const handleCloseModal = () => {
    setModal({ ...modal, isOpen: false })
    if (modal.status === 'success') {
      router.push('/users/dashboard')
    }
  }

  return (
    <div className="bg-white min-h-screen pb-32">
      {/* Header */}
      <div className="bg-brand-red pt-12 pb-6 px-6 relative">
        <div className="max-w-7xl mx-auto flex items-center relative z-10">
          <button 
            onClick={() => router.back()}
            className="text-white p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft size={32} />
          </button>
          <div className="flex flex-col ml-4">
             <h1 className="text-xl lg:text-3xl font-bold text-white leading-tight">
                Manajemen Waktu
             </h1>
             <p className="text-white/80 text-xs font-medium uppercase tracking-wider">
               {activeForm.replace('-', ' ')}
             </p>
          </div>
          <div className="ml-auto w-12 h-12 bg-white/20 rounded-full border border-white flex items-center justify-center">
             <Clock className="text-white" size={24} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 mt-6">
        {/* Radio Tabs */}
        <div className="flex flex-col space-y-3 mb-8">
           <label className="flex items-center space-x-3 cursor-pointer group">
              <input 
                type="radio" 
                name="formType" 
                checked={activeForm === 'ubah-jadwal'}
                onChange={() => setActiveForm('ubah-jadwal')}
                className="w-5 h-5 accent-brand-red cursor-pointer"
              />
              <span className={`text-sm font-bold ${activeForm === 'ubah-jadwal' ? 'text-black' : 'text-zinc-500'}`}>Form Ubah Jadwal</span>
           </label>
           <label className="flex items-center space-x-3 cursor-pointer group">
              <input 
                type="radio" 
                name="formType" 
                checked={activeForm === 'izin'}
                onChange={() => setActiveForm('izin')}
                className="w-5 h-5 accent-brand-red cursor-pointer"
              />
              <span className={`text-sm font-bold ${activeForm === 'izin' ? 'text-black' : 'text-zinc-500'}`}>Form Izin</span>
           </label>
           <label className="flex items-center space-x-3 cursor-pointer group">
              <input 
                type="radio" 
                name="formType" 
                checked={activeForm === 'dinas-luar'}
                onChange={() => setActiveForm('dinas-luar')}
                className="w-5 h-5 accent-brand-red cursor-pointer"
              />
              <span className={`text-sm font-bold ${activeForm === 'dinas-luar' ? 'text-black' : 'text-zinc-500'}`}>Form Dinas Luar</span>
           </label>
        </div>

        {/* Form Container */}
        <div className="bg-white border-[1.5px] border-brand-red rounded-[24px] p-6 shadow-sm">
           <form className="space-y-4">
              {/* Common Fields for Ubah Jadwal & Izin */}
              {(activeForm === 'ubah-jadwal' || activeForm === 'izin') && (
                <>
                  <div className="space-y-1">
                     <label className="text-sm font-bold text-zinc-800">Tanggal</label>
                     <div className="relative">
                        <input 
                          type="date" 
                          className="w-full h-11 border border-zinc-200 rounded-lg px-4 focus:outline-none text-zinc-900 bg-white" 
                          onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-sm font-bold text-zinc-800">Nama</label>
                     <input type="text" readOnly defaultValue={userData?.full_name} className="w-full h-11 border border-zinc-200 rounded-lg px-4 focus:outline-none bg-zinc-50 text-zinc-900" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-sm font-bold text-zinc-800">NIK (ID)</label>
                     <input type="text" readOnly defaultValue={userData?.nik} className="w-full h-11 border border-zinc-200 rounded-lg px-4 focus:outline-none bg-zinc-50 text-zinc-900" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-sm font-bold text-zinc-800">Kedudukan</label>
                     <input 
                       type="text" 
                       readOnly 
                       value={userData?.stations?.name || userData?.position || ''} 
                       className="w-full h-11 border border-zinc-200 rounded-lg px-4 focus:outline-none bg-zinc-50 text-zinc-900" 
                     />
                  </div>

                  {/* Section: Semula - Only for Ubah Jadwal */}
                  {activeForm === 'ubah-jadwal' && (
                    <div className="pt-2">
                       <span className="bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-wider">Semula</span>
                       <div className="mt-3 space-y-3 pl-2 border-l-2 border-orange-500/20">
                          <div className="space-y-1">
                             <label className="text-sm font-bold text-zinc-800">Kode Dinas</label>
                             <input 
                               type="text" 
                               value={formData.shift_code_awal !== undefined ? formData.shift_code_awal : (userData?.shift_code || '')} 
                               onChange={(e) => setFormData({...formData, shift_code_awal: e.target.value})}
                               placeholder="Masukkan Kode Dinas Semula"
                               className="w-full h-11 border border-zinc-200 rounded-lg px-4 focus:outline-none bg-white text-zinc-900" 
                             />
                          </div>
                       </div>
                    </div>
                  )}

                  {/* Section: Menjadi - Only for Ubah Jadwal */}
                  {activeForm === 'ubah-jadwal' && (
                    <div className="pt-2">
                       <span className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-wider">Menjadi</span>
                       <div className="mt-3 space-y-4 pl-2 border-l-2 border-emerald-500/20">
                          <div className="space-y-1">
                             <label className="text-sm font-bold text-zinc-800">Kode Dinasan Baru*</label>
                             <div className="relative">
                                <select 
                                  value={formData.requested_shift}
                                  onChange={(e) => setFormData({...formData, requested_shift: e.target.value})}
                                  className="w-full h-11 border border-brand-red/50 rounded-lg px-4 appearance-none focus:outline-none bg-white font-bold text-zinc-900"
                                >
                                   <option value="">Pilih Kode Dinas Baru</option>
                                   <option value="DP2">DP2 (06.00 - 14.00)</option>
                                   <option value="DP3">DP3 (14.00 - 22.00)</option>
                                   <option value="DS1">DS1 (07.00 - 15.00)</option>
                                   <option value="DS2">DS2 (08.00 - 16.00)</option>
                                   <option value="DS5">DS5 (13.00 - 21.00)</option>
                                   <option value="M">M (Malam - 22.00 - 06.00)</option>
                                   <option value="L">L (Libur)</option>
                                </select>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  <div className="space-y-1 pt-2">
                     <label className="text-sm font-bold text-zinc-800">Penjelasan / Alasan*</label>
                     <textarea 
                        value={formData.reason}
                        onChange={(e) => setFormData({...formData, reason: e.target.value, message: e.target.value})}
                        placeholder="Masukkan alasan pengajuan anda..." 
                        className="w-full h-24 border border-zinc-200 rounded-lg px-4 py-2 focus:outline-none resize-none text-zinc-900" 
                     />
                  </div>
                </>
              )}

              {/* Unique Fields for Dinas Luar */}
              {activeForm === 'dinas-luar' && (
                <>
                  <div className="flex space-x-3">
                     <div className="flex-1 space-y-1">
                        <label className="text-sm font-bold text-zinc-800">Tanggal Mulai</label>
                        <input 
                          type="date" 
                          className="w-full h-11 border border-zinc-200 rounded-lg px-4 focus:outline-none text-zinc-900 bg-white" 
                          onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                        />
                     </div>
                     <div className="w-10 flex items-end justify-center pb-3">
                        <span className="text-sm font-bold text-zinc-400">S/D</span>
                     </div>
                     <div className="flex-1 space-y-1">
                        <label className="text-sm font-bold text-zinc-800 opacity-0">Selesai</label>
                        <input 
                          type="date" 
                          className="w-full h-11 border border-zinc-200 rounded-lg px-4 focus:outline-none text-zinc-900 bg-white" 
                          onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                        />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-sm font-bold text-zinc-800">Nama</label>
                     <input type="text" readOnly defaultValue={userData?.full_name} className="w-full h-11 border border-zinc-200 rounded-lg px-4 focus:outline-none bg-zinc-50 text-zinc-900" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-sm font-bold text-zinc-800">ID (NIK)</label>
                     <input type="text" readOnly defaultValue={userData?.nik} className="w-full h-11 border border-zinc-200 rounded-lg px-4 focus:outline-none bg-zinc-50 text-zinc-900" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-sm font-bold text-zinc-800">Penjelasan</label>
                     <textarea 
                        value={formData.reason}
                        onChange={(e) => setFormData({...formData, reason: e.target.value, message: e.target.value})}
                        placeholder="Detail penugasan dinas luar..." 
                        className="w-full h-24 border border-zinc-200 rounded-lg px-4 py-2 focus:outline-none resize-none bg-white text-zinc-900" 
                     />
                  </div>
                  <div className="space-y-1 pt-2">
                     <label className="text-sm font-bold text-zinc-800">Foto Bukti Dokumentasi (Maks 10MB)</label>
                     <div className="relative border border-dashed border-zinc-300 rounded-lg p-4 flex flex-col items-center justify-center bg-zinc-50 hover:bg-zinc-100 transition cursor-pointer">
                        <input 
                           type="file" 
                           accept="image/*" 
                           onChange={handleFileChange}
                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        {selectedFile ? (
                           <div className="text-center">
                              <p className="text-sm font-semibold text-emerald-600">{selectedFile.name}</p>
                              <p className="text-[10px] text-zinc-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                           </div>
                        ) : (
                           <div className="text-center flex flex-col items-center space-y-1">
                              <ImageIcon className="text-zinc-400" size={28} />
                              <span className="text-xs font-bold text-zinc-600">Pilih Foto atau Ambil Gambar</span>
                              <span className="text-[10px] text-zinc-400">Format: JPG, PNG, WEBP (Maks 10MB)</span>
                           </div>
                        )}
                     </div>
                  </div>
                </>
              )}

              <button 
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="w-full h-14 bg-brand-red text-white text-xl font-bold rounded-2xl shadow-lg mt-8 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                 {loading ? <Loader2 className="animate-spin" /> : 'Selesai'}
              </button>
           </form>
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

export default function TimeManagementForm() {
  return (
    <Suspense fallback={
       <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-brand-red" size={48} />
          <p className="font-bold text-zinc-500">Memuat formulir...</p>
       </div>
    }>
       <TimeManagementFormContent />
    </Suspense>
  )
}
