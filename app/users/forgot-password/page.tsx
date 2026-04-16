'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatusModal } from '@/components/StatusModal'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [modal, setModal] = React.useState<{ isOpen: boolean, status: 'success' | 'error' | 'loading', message: string }>({
    isOpen: false,
    status: 'loading',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setModal({ isOpen: true, status: 'loading', message: 'Mengirimkan email pemulihan...' })

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/users/reset-password`,
    })

    if (error) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal: ' + error.message })
    } else {
      setModal({ 
        isOpen: true, 
        status: 'success', 
        message: 'Email pemulihan telah dikirim. Silakan cek kotak masuk email Anda.' 
      })
    }
    setLoading(false)
  }

  const handleCloseModal = () => {
    setModal({ ...modal, isOpen: false })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      <div className="bg-[#D32F2F] w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 min-h-[40vh]">
        <div className="w-full max-w-[500px] aspect-[1.5/1] relative">
          <Image 
            src="/images/Logo Login.png" 
            alt="Forgot Password Illustration" 
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      <div className="flex-1 bg-white flex items-center justify-center p-8 lg:p-20">
        <div className="w-full max-w-[450px]">
          <h2 className="text-2xl lg:text-3xl font-bold text-black mb-2">Lupa Password?</h2>
          <p className="text-zinc-500 mb-8">Masukkan email Anda untuk menerima instruksi pemulihan kata sandi.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-lg font-medium text-black">Email</label>
              <input 
                type="email" 
                placeholder="Masukkan Email Terdaftar" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                {loading ? 'Mengirim...' : 'Kirim Instruksi'}
              </button>
            </div>

            <p className="text-center text-lg text-black mt-8">
              Kembali ke <Link href="/users/login" className="text-blue-600 font-semibold hover:underline">Halaman Masuk</Link>
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
