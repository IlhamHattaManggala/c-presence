'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { StatusModal } from '@/components/StatusModal'

export default function AdminRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = React.useState(false)
  
  const [modal, setModal] = React.useState<{ isOpen: boolean, status: 'success' | 'error' | 'loading', message: string }>({
    isOpen: false,
    status: 'loading',
    message: ''
  })

  React.useEffect(() => {
    router.replace('/admin/login')
  }, [router])

  const [formData, setFormData] = React.useState({
    nama: '',
    email: '',
    password: '',
    nik: '',
    unit: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setModal({ isOpen: true, status: 'loading', message: 'Mendaftarkan akun administrator baru...' })

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (authError) {
      setModal({ isOpen: true, status: 'error', message: 'Registrasi Admin Gagal: ' + authError.message })
    } else if (authData.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          full_name: formData.nama,
          email: formData.email,
          nik: formData.nik,
          role: 'admin',
          position: formData.unit
        })

      if (profileError) {
        setModal({ isOpen: true, status: 'error', message: 'Gagal membuat profil admin: ' + profileError.message })
      } else {
        setModal({ isOpen: true, status: 'success', message: 'Registrasi Admin Berhasil! Silakan masuk ke panel admin.' })
      }
    }
    setLoading(false)
  }

  const handleCloseModal = () => {
    setModal({ ...modal, isOpen: false })
    if (modal.status === 'success') {
      router.push('/admin/login')
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Area (Desktop Style) */}
      <div className="bg-[#D32F2F] w-full lg:w-1/2 flex items-end justify-center overflow-hidden min-h-[40vh]">
        <div className="w-[80%] h-[90%] relative">
          <Image 
            src="/images/Logo register.png" 
            alt="Admin Register Illustration" 
            fill
            className="object-contain object-bottom"
            priority
          />
        </div>
      </div>

      {/* Right Area (Admin Form) */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 lg:p-20">
        <div className="w-full max-w-[500px]">
          <h2 className="text-2xl lg:text-3xl font-bold text-black mb-8">Buat Akun Baru</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-lg font-medium text-black">Nama</label>
              <input 
                type="text" 
                placeholder="Masukkan Nama" 
                value={formData.nama}
                onChange={(e) => setFormData({...formData, nama: e.target.value})}
                required
                className="w-full h-12 border border-brand-red rounded-lg px-4 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-medium text-black">Password</label>
              <input 
                type="password" 
                placeholder="Masukkan Password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                className="w-full h-12 border border-brand-red rounded-lg px-4 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-medium text-black">Email</label>
              <input 
                type="email" 
                placeholder="Masukkan Email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="w-full h-12 border border-brand-red rounded-lg px-4 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-medium text-black">NIK/ID</label>
              <input 
                type="text" 
                placeholder="Masukkan NIK/ID" 
                value={formData.nik}
                onChange={(e) => setFormData({...formData, nik: e.target.value})}
                required
                className="w-full h-12 border border-brand-red rounded-lg px-4 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-medium text-black">Unit Kerja</label>
              <input 
                type="text" 
                placeholder="Masukkan Unit Kerja" 
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                required
                className="w-full h-12 border border-brand-red rounded-lg px-4 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div className="flex items-start space-x-3 pt-2">
              <input 
                type="checkbox" 
                id="agree-admin"
                required
                className="w-6 h-6 mt-0.5 border-zinc-300 rounded text-brand-red focus:ring-brand-red cursor-pointer" 
              />
              <label htmlFor="agree-admin" className="text-sm lg:text-lg text-black font-medium cursor-pointer leading-tight">
                Saya menyetujui Syarat & Ketentuan
              </label>
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#B71C1C] text-white text-xl font-bold rounded-xl hover:bg-[#8B0000] transition-colors shadow-lg disabled:opacity-50"
              >
                {loading ? 'Mendaftarkan...' : 'Daftar'}
              </button>
            </div>

            <p className="text-center text-lg text-black mt-8">
              Sudah punya akun? <Link href="/admin/login" className="text-blue-600 font-semibold hover:underline">Masuk di sini</Link>
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
