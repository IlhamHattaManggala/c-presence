'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { StatusModal } from '@/components/StatusModal'

export default function UserRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [loading, setLoading] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [stations, setStations] = React.useState<any[]>([])
  
  const [modal, setModal] = React.useState<{ isOpen: boolean, status: 'success' | 'error' | 'loading', message: string }>({
    isOpen: false,
    status: 'loading',
    message: ''
  })

  const [formData, setFormData] = React.useState({
    nama: '',
    email: '',
    nik: '',
    phone: '',
    password: '',
  })

  React.useEffect(() => {
    const getStations = async () => {
      const { data } = await supabase.from('stations').select('*').limit(1)
      if (data) setStations(data)
    }
    getStations()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setModal({ isOpen: true, status: 'loading', message: 'Sedang mendaftarkan akun Anda...' })

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (authError) {
      setModal({ isOpen: true, status: 'error', message: 'Registrasi Gagal: ' + authError.message })
    } else if (authData.user) {
      // Prepare user data
      const userData: any = {
        id: authData.user.id,
        full_name: formData.nama,
        email: formData.email,
        nik: formData.nik,
        phone_number: formData.phone,
        role: 'user',
        position: 'Passenger Service',
      }

      // Add station_id only if found
      if (stations.length > 0) {
        userData.station_id = stations[0].id
      }
      
      const { error: profileError } = await supabase
        .from('users')
        .insert(userData)

      if (profileError) {
        setModal({ isOpen: true, status: 'error', message: 'Gagal membuat profil: ' + profileError.message })
      } else {
        setModal({ isOpen: true, status: 'success', message: 'Registrasi Berhasil! Silakan masuk ke akun Anda.' })
      }
    }
    setLoading(false)
  }

  const handleCloseModal = () => {
    setModal({ ...modal, isOpen: false })
    if (modal.status === 'success') {
      router.push('/users/login')
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left / Top Section (Red Area) */}
      <div className="bg-[#D32F2F] w-full lg:w-1/2 flex items-center justify-center lg:items-end p-8 lg:p-12 overflow-hidden min-h-[40vh] lg:min-h-screen">
        <div className="w-full max-w-[500px] aspect-square relative translate-y-8 lg:translate-y-20">
          <Image 
            src="/images/Logo register.png" 
            alt="Register Illustration" 
            fill
            sizes="(max-width: 768px) 100vw, 500px"
            className="object-contain lg:object-bottom"
            priority
          />
        </div>
      </div>

      {/* Right / Bottom Section (Form Area) */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 lg:p-20 overflow-y-auto">
        <div className="w-full max-w-[500px]">
          <h2 className="text-2xl lg:text-3xl font-bold text-black mb-8">Buat Akun Baru</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-lg font-medium text-black">Nama</label>
              <input 
                type="text" 
                placeholder="Masukkan Nama" 
                value={formData.nama}
                onChange={(e) => setFormData({...formData, nama: e.target.value})}
                required
                className="w-full h-11 border border-brand-red rounded-lg px-4 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-lg font-medium text-black">Email</label>
              <input 
                type="email" 
                placeholder="Masukkan Email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="w-full h-11 border border-brand-red rounded-lg px-4 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-lg font-medium text-black">NIK</label>
              <input 
                type="text" 
                placeholder="Masukkan NIK" 
                value={formData.nik}
                onChange={(e) => setFormData({...formData, nik: e.target.value})}
                required
                className="w-full h-11 border border-brand-red rounded-lg px-4 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-lg font-medium text-black">Nomor Telepon</label>
              <input 
                type="tel" 
                placeholder="Masukkan Nomor Telepon" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
                className="w-full h-11 border border-brand-red rounded-lg px-4 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-lg font-medium text-black">Password</label>
              <input 
                type="password" 
                placeholder="Masukkan Password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                className="w-full h-11 border border-brand-red rounded-lg px-4 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-lg font-medium text-black">Photo Setengah Badan</label>
              <div className="flex h-11 border border-brand-red rounded-lg overflow-hidden relative">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden" 
                  accept="image/*"
                />
                <input 
                  type="text" 
                  placeholder="Masukkan Photo" 
                  value={selectedFile ? selectedFile.name : ''}
                  readOnly
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-4 text-zinc-600 text-sm italic outline-none cursor-pointer"
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#FF5252] text-white px-6 h-full font-medium hover:bg-red-600 transition-colors"
                >
                  File
                </button>
              </div>
              <p className="text-[10px] text-zinc-400 px-1 mt-1">*Photo Max 20 MB dan Berpakaian Rapih</p>
            </div>

            <div className="flex items-start space-x-3 pt-2">
              <input 
                type="checkbox" 
                id="agree"
                required
                className="w-6 h-6 mt-0.5 border-zinc-300 rounded text-brand-red focus:ring-brand-red cursor-pointer" 
              />
              <label htmlFor="agree" className="text-sm lg:text-lg text-black font-medium cursor-pointer leading-tight">
                Saya menyetujui Syarat & Ketentuan
              </label>
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#B71C1C] text-white text-xl font-bold rounded-xl hover:bg-[#8B0000] transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Mendaftarkan...' : 'Selesai'}
              </button>
            </div>

            <p className="text-center text-lg text-black mt-8">
              Sudah punya akun? <Link href="/users/login" className="text-blue-600 font-semibold hover:underline">Masuk di sini</Link>
            </p>
          </form>
        </div>
        <StatusModal 
          isOpen={modal.isOpen}
          status={modal.status}
          message={modal.message}
          onClose={handleCloseModal}
        />
      </div>
    </div>
  )
}
