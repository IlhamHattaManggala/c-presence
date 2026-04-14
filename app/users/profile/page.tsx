'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Camera, Bell, LogOut, ChevronRight, User, Image as ImageIcon, Camera as CameraIcon } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'

import { StatusModal } from '@/components/StatusModal'

export default function UserProfile() {
  const router = useRouter()

  const [userData, setUserData] = React.useState<any>(null)
  const [editForm, setEditForm] = React.useState<any>({
    full_name: '', phone_number: '', nik: '', position: '', shift_code: '', station_id: ''
  })
  const [stations, setStations] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [modal, setModal] = React.useState<{ isOpen: boolean, status: 'success' | 'error' | 'loading', message: string }>({
    isOpen: false,
    status: 'loading',
    message: ''
  })
  const supabase = createClient()

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile, error } = await supabase
          .from('users')
          .select('*, stations(*)')
          .eq('id', user.id)
          .single()
        
        if (error) {
          setModal({ 
            isOpen: true, 
            status: 'error', 
            message: `Gagal mengambil data: ${error.message}. ${error.hint || ''}` 
          })
          console.error("Database Error:", error)
        }
        setUserData(profile)

        const { data: stationsData } = await supabase.from('stations').select('*')
        if (stationsData) setStations(stationsData)

        if (profile) {
          setEditForm({
            full_name: profile.full_name || '',
            phone_number: profile.phone_number || '',
            nik: profile.nik || '',
            position: profile.position || '',
            shift_code: profile.shift_code || '',
            station_id: profile.station_id || ''
          })
        }
      } else {
        router.push('/users/login')
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setModal({ isOpen: true, status: 'loading', message: 'Menyimpan profil...' })
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editForm.full_name,
          phone_number: editForm.phone_number,
          nik: editForm.nik,
          position: editForm.position,
          station_id: editForm.station_id || null,
          shift_code: editForm.shift_code
        })
        .eq('id', userData.id)
      
      if (error) throw error
      
      const updatedStation = stations.find(s => s.id === editForm.station_id)
      setUserData({ ...userData, ...editForm, stations: updatedStation || userData.stations })
      setModal({ isOpen: true, status: 'success', message: 'Profil berhasil diperbarui!' })
      setIsModalOpen(false)
    } catch (error: any) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal menyimpan: ' + error.message })
    }
  }

  const handleCloseModal = () => setModal({ ...modal, isOpen: false })

  const formatNIK = (nik: string) => {
    if (!nik) return '-'
    if (nik.length < 5) return nik
    const firstThree = nik.substring(0, 3)
    const lastTwo = nik.substring(nik.length - 2)
    return `${firstThree}************${lastTwo}`
  }

  const [isPhotoModalOpen, setIsPhotoModalOpen] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userData) return

    setModal({ isOpen: true, status: 'loading', message: 'Sedang mengunggah foto profil...' })
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userData.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // 1. Upload ke Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Dapatkan URL Public
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // 3. Update Tabel Users
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userData.id)

      if (updateError) throw updateError

      setUserData({ ...userData, avatar_url: publicUrl })
      setModal({ isOpen: true, status: 'success', message: 'Foto profil berhasil diperbarui!' })
    } catch (error: any) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal mengunggah foto: ' + error.message })
    } finally {
      setIsPhotoModalOpen(false)
    }
  }

  const triggerFileInput = (mode: 'album' | 'camera') => {
    if (fileInputRef.current) {
      if (mode === 'camera') {
        fileInputRef.current.setAttribute('capture', 'environment')
      } else {
        fileInputRef.current.removeAttribute('capture')
      }
      fileInputRef.current.click()
    }
  }

  const personalInfo = [
    { label: 'Email', value: userData?.email || '-' },
    { label: 'Nomor Telpon', value: userData?.phone_number || '-' },
    { label: 'Password', value: '***************' },
    { label: 'ID/NIK', value: formatNIK(userData?.nik) },
    { label: 'Posisi', value: userData?.position || '-' },
    { label: 'Stasiun', value: userData?.stations?.name || '-' },
    { label: 'Kode Dinas', value: userData?.shift_code || '-' },
  ]

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false)

  return (
    <div className="bg-zinc-50 min-h-screen pb-32">
      {/* Header */}
      <div className="bg-brand-red pt-12 pb-24 px-6 relative">
        <div className="max-w-7xl mx-auto flex items-center relative z-10">
          <button 
            onClick={() => router.back()}
            className="text-white p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft size={32} />
          </button>
          <h1 className="flex-1 text-center text-3xl font-bold text-white mr-8">Profile</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-16 relative z-20">
        {/* Profile Card */}
        <div className="bg-white rounded-[32px] p-8 shadow-xl border border-zinc-100 flex flex-col items-center text-center relative">
          <div className="relative mb-6">
            <div className="w-32 h-32 lg:w-40 lg:h-40 bg-zinc-100 rounded-full overflow-hidden border-4 border-white shadow-inner flex items-center justify-center">
              {userData?.avatar_url ? (
                <img src={userData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="text-zinc-300" size={64} fill="currentColor" />
              )}
            </div>
            <button 
              onClick={() => setIsPhotoModalOpen(true)}
              className="absolute bottom-1 right-1 w-10 h-10 bg-[#1A365D] text-white rounded-full flex items-center justify-center border-4 border-white shadow-md active:scale-90 transition-transform"
            >
               <CameraIcon size={18} />
            </button>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handlePhotoUpload} 
          />

          {/* Photo Options Modal */}
          {isPhotoModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-8 sm:items-center sm:p-0">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsPhotoModalOpen(false)}></div>
              <div className="relative bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
                <div className="p-6">
                  <h3 className="text-lg font-bold text-zinc-900 mb-6 text-left">Ganti Foto Profil</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => triggerFileInput('album')}
                      className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition-colors border border-zinc-100 group"
                    >
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 group-active:scale-90 transition-transform">
                        <ImageIcon size={24} />
                      </div>
                      <span className="text-sm font-medium text-zinc-700">Pilih Album</span>
                    </button>
                    <button 
                      onClick={() => triggerFileInput('camera')}
                      className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 transition-colors border border-zinc-100 group"
                    >
                      <div className="w-12 h-12 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center mb-3 group-active:scale-90 transition-transform">
                        <CameraIcon size={24} />
                      </div>
                      <span className="text-sm font-medium text-zinc-700">Ambil Gambar</span>
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsPhotoModalOpen(false)}
                    className="w-full mt-6 py-3 text-sm font-bold text-zinc-500 hover:text-zinc-700"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <h2 className="text-xl font-bold text-zinc-800">
            {loading ? 'Memuat...' : (userData?.full_name || 'Nama Belum Diatur')}
          </h2>
          <p className="text-zinc-500 font-medium mb-2">
            {loading ? 'Memuat...' : (userData?.email || 'Email Belum Diatur')}
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-brand-red font-bold text-sm hover:underline"
          >
            Edit Profil
          </button>
        </div>

        {/* Informasi Pribadi Section */}
        <div className="mb-8">
           <h3 className="text-lg font-bold text-zinc-900 mb-4 px-2">Informasi Pribadi</h3>
           <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden text-sm lg:text-base">
              {personalInfo.map((info, index) => (
                <div 
                  key={info.label}
                  className={`flex justify-between items-center p-4 lg:p-5 ${
                    index !== personalInfo.length - 1 ? 'border-b border-zinc-50' : ''
                  }`}
                >
                  <span className="text-zinc-400 font-medium">{info.label}</span>
                  <span className="text-zinc-800 font-semibold text-right truncate max-w-[60%] lg:max-w-none">
                    {info.value}
                  </span>
                </div>
              ))}
           </div>
        </div>

        {/* Preferensi Section */}
        <div>
           <h3 className="text-lg font-bold text-zinc-900 mb-4 px-2">Preferensi</h3>
           <div className="space-y-4">
              <button className="w-full bg-white p-4 lg:p-5 rounded-2xl shadow-sm border border-zinc-100 flex items-center group active:bg-zinc-50 transition-colors">
                 <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mr-4 text-slate-600">
                    <Bell size={24} />
                 </div>
                 <div className="flex-1 text-left">
                    <p className="font-bold text-zinc-800">Notifikasi</p>
                    <p className="text-[10px] lg:text-xs text-zinc-400">*silahkan selalu melihat informasi secara berkala</p>
                 </div>
                 <ChevronRight className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
              </button>

               <button 
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full bg-white p-4 lg:p-5 rounded-2xl shadow-sm border border-zinc-100 flex items-center group active:bg-zinc-50 transition-colors"
              >
                 <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mr-4 text-brand-red">
                    <LogOut size={24} />
                 </div>
                 <div className="flex-1 text-left">
                    <p className="font-bold text-zinc-800">Log Out</p>
                    <p className="text-[10px] lg:text-xs text-zinc-400">*Keluar dari akun anda</p>
                 </div>
                 <ChevronRight className="text-zinc-300 group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          <div className="bg-white w-full max-w-lg rounded-[32px] p-8 shadow-2xl relative z-10 animate-in slide-in-from-bottom-4 duration-300 overflow-y-auto max-h-[90vh] scrollbar-hide">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-zinc-900">Edit Profil</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <ChevronLeft className="rotate-90 lg:rotate-0" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleUpdateProfile}>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-zinc-700">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                  className="w-full h-12 bg-zinc-50 border border-zinc-100 rounded-xl px-4 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-zinc-700">Nomor Telpon</label>
                <input 
                  type="tel" 
                  value={editForm.phone_number}
                  onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})}
                  className="w-full h-12 bg-zinc-50 border border-zinc-100 rounded-xl px-4 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-zinc-700">ID / NIK</label>
                <input 
                  type="text" 
                  value={editForm.nik}
                  onChange={(e) => setEditForm({...editForm, nik: e.target.value})}
                  className="w-full h-12 bg-zinc-50 border border-zinc-100 rounded-xl px-4 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-zinc-700">Posisi</label>
                  <input 
                    type="text" 
                    value={editForm.position}
                    onChange={(e) => setEditForm({...editForm, position: e.target.value})}
                    className="w-full h-12 bg-zinc-50 border border-zinc-100 rounded-xl px-4 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-zinc-700">Stasiun</label>
                  <div className="relative">
                    <select 
                      value={editForm.station_id}
                      onChange={(e) => setEditForm({...editForm, station_id: e.target.value})}
                      className="w-full h-12 bg-zinc-50 border border-zinc-100 rounded-xl px-4 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all appearance-none"
                    >
                      <option value="">Pilih Stasiun</option>
                      {stations.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-zinc-700">Kode Dinas</label>
                <div className="relative">
                  <select 
                    value={editForm.shift_code}
                    onChange={(e) => setEditForm({...editForm, shift_code: e.target.value})}
                    className="w-full h-12 bg-zinc-50 border border-zinc-100 rounded-xl px-4 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all appearance-none"
                  >
                    <option value="">Pilih Kode Dinas</option>
                    <option value="S">S</option>
                    <option value="DS5">DS5</option>
                    <option value="M">M</option>
                    <option value="DP3">DP3</option>
                    <option value="CS">CS</option>
                    <option value="L">L</option>
                    <option value="P">P</option>
                    <option value="J">J</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-6">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-14 bg-zinc-100 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 h-14 bg-brand-red text-white font-bold rounded-2xl shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark transition-all transform active:scale-95"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center px-6 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsLogoutModalOpen(false)}
          ></div>
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 sm:p-8 shadow-xl relative z-10 animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-red-50 text-brand-red rounded-full flex items-center justify-center mb-5">
                <LogOut size={32} strokeWidth={2.5} />
             </div>
             <h3 className="text-xl font-bold text-zinc-900 mb-2">Keluar Aplikasi</h3>
             <p className="text-zinc-500 font-medium text-sm mb-8">Apakah Anda yakin ingin keluar dari akun ini? Sesi Anda akan dihentikan.</p>
             <div className="flex w-full space-x-3">
                <button 
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="flex-1 py-3.5 bg-zinc-100 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push('/users/login')
                  }}
                  className="flex-1 py-3.5 bg-brand-red text-white font-bold rounded-2xl shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark transition-transform active:scale-95"
                >
                  Ya, Keluar
                </button>
             </div>
          </div>
        </div>
      )}

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
