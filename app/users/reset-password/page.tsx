'use client'

import React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StatusModal } from '@/components/StatusModal'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [modal, setModal] = React.useState<{ isOpen: boolean, status: 'success' | 'error' | 'loading', message: string }>({
    isOpen: false,
    status: 'loading',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setModal({ isOpen: true, status: 'error', message: 'Password tidak cocok.' })
      return
    }

    setLoading(true)
    setModal({ isOpen: true, status: 'loading', message: 'Memperbarui kata sandi Anda...' })

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal memperbarui password: ' + error.message })
    } else {
      setModal({ 
        isOpen: true, 
        status: 'success', 
        message: 'Password berhasil diperbarui! Silakan masuk kembali.' 
      })
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
      <div className="bg-[#D32F2F] w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 min-h-[40vh]">
        <div className="w-full max-w-[500px] aspect-[1.5/1] relative">
          <Image 
            src="/images/Logo Login.png" 
            alt="Reset Password Illustration" 
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      <div className="flex-1 bg-white flex items-center justify-center p-8 lg:p-20">
        <div className="w-full max-w-[450px]">
          <h2 className="text-2xl lg:text-3xl font-bold text-black mb-2">Buat Password Baru</h2>
          <p className="text-zinc-500 mb-8">Silakan masukkan kata sandi baru Anda.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-lg font-medium text-black">Password Baru</label>
              <input 
                type="password" 
                placeholder="Masukkan Password Baru" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 border border-brand-red rounded-lg px-4 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-medium text-black">Konfirmasi Password Baru</label>
              <input 
                type="password" 
                placeholder="Ulangi Password Baru" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full h-12 border border-brand-red rounded-lg px-4 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#B71C1C] text-white text-xl font-bold rounded-xl hover:bg-[#8B0000] transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Memperbarui...' : 'Simpan Password'}
              </button>
            </div>
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
