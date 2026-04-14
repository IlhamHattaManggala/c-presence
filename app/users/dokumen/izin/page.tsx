import React from 'react'
import Image from 'next/image'
import { FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { StatusModal } from '@/components/StatusModal'
import { BottomNav } from '@/components/BottomNav'

export default function SuratIzinPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = React.useState(false)
  const [userData, setUserData] = React.useState<any>(null)
  
  const [modal, setModal] = React.useState<{ isOpen: boolean, status: 'success' | 'error' | 'loading', message: string }>({
    isOpen: false,
    status: 'loading',
    message: ''
  })

  const [formData, setFormData] = React.useState({
    tanggal: new Date().toISOString().split('T')[0],
    penjelasan: 'Sakit dengan keluhan batuk flu dan demam'
  })

  React.useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('users').select('*, stations(name)').eq('id', user.id).single()
        setUserData(data)
      }
    }
    getUserData()
  }, [])

  const handleSubmit = async () => {
    setLoading(true)
    setModal({ isOpen: true, status: 'loading', message: 'Sedang memproses pengajuan izin Anda...' })

    const { error } = await supabase.from('approval_requests').insert({
      user_id: userData.id,
      type: 'IZIN',
      status: 'Proses',
      alasan_penjelasan: formData.penjelasan,
      tgl_permohonan: formData.tanggal,
      tgl_mulai_dinas: formData.tanggal,
      shift_code_awal: formData.kodeDinasSemula,
      shift_code_akhir: formData.kodeDinasMenjadi,
      kedudukan: userData?.stations?.name || null,
      jabatan: userData?.position || null
    })

    if (error) {
       setModal({ isOpen: true, status: 'error', message: 'Gagal: ' + error.message })
    } else {
       // Create notification for admin
       await supabase.from('notifications').insert({
         user_id: userData.id,
         title: 'PENGAJUAN IZIN',
         message: `${userData?.full_name} mengajukan izin.`
       })

       setModal({ isOpen: true, status: 'success', message: 'Pengajuan izin berhasil dikirim! Silakan cek riwayat notifikasi secara berkala.' })
    }
    setLoading(false)
  }

  const handleCloseModal = () => {
    setModal({ ...modal, isOpen: false })
    if (modal.status === 'success') {
      router.push('/users/notifikasi/riwayat')
    }
  }

  return (
    <div className="bg-white min-h-screen pb-32">
      {/* Header Area */}
      <div className="bg-brand-red pt-12 pb-12 w-full relative">
        <div className="max-w-4xl mx-auto flex items-center px-4 w-full justify-center space-x-2">
           <FileText className="text-white" size={30} />
           <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Dokumen</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 mt-6">
         {/* KAI Logo */}
         <div className="w-full mb-8">
            <Image 
               src="/images/logo_kai.png" 
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
               <input 
                 type="date"
                 value={formData.tanggal}
                 onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                 className="w-full border border-brand-red rounded-md px-3 py-2 text-[13px] text-zinc-700 bg-white" 
               />
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
