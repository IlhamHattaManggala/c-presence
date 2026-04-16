'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { StatusModal } from '@/components/StatusModal'

export default function UserLoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  
  const [modal, setModal] = React.useState<{ isOpen: boolean, status: 'success' | 'error' | 'loading', message: string }>({
    isOpen: false,
    status: 'loading',
    message: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setModal({ isOpen: true, status: 'loading', message: 'Sedang memverifikasi akun Anda...' })
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setModal({ isOpen: true, status: 'error', message: 'Login Gagal: ' + error.message })
    } else {
      router.push('/users/dashboard')
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/users/dashboard`,
      },
    })

    if (error) {
       setModal({ isOpen: true, status: 'error', message: 'Google Login Gagal: ' + error.message })
    }
  }

  const handleCloseModal = () => {
    setModal({ ...modal, isOpen: false })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left / Top Section (Red Area) */}
      <div className="bg-[#D32F2F] w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 min-h-[40vh] lg:min-h-screen">
        <div className="w-full max-w-[500px] aspect-[1.5/1] relative">
          <Image 
            src="/images/Logo Login.png" 
            alt="Illustration" 
            fill
            sizes="(max-width: 768px) 100vw, 500px"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Right / Bottom Section (Form Area) */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 lg:p-20">
        <div className="w-full max-w-[450px]">
          <h2 className="text-2xl lg:text-3xl font-bold text-black mb-8">Masuk ke Akun Anda</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-lg font-medium text-black">Email</label>
              <input 
                type="email" 
                placeholder="Masukkan Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 border border-brand-red rounded-lg px-4 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-lg font-medium text-black">Password</label>
              <input 
                type="password" 
                placeholder="Masukkan Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 border border-brand-red rounded-lg px-4 text-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-red"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-3">
                <input 
                  type="checkbox" 
                  id="remember"
                  className="w-6 h-6 border-zinc-300 rounded text-brand-red focus:ring-brand-red cursor-pointer" 
                />
                <label htmlFor="remember" className="text-lg text-black font-medium cursor-pointer">
                  Ingat Saya
                </label>
              </div>
              <Link href="/users/forgot-password" size="sm" className="text-brand-red font-semibold hover:underline">
                Lupa Password?
              </Link>
            </div>

            <div className="space-y-4 pt-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#B71C1C] text-white text-xl font-bold rounded-xl hover:bg-[#8B0000] transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Memuat...' : 'Masuk'}
              </button>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                className="w-full h-14 bg-white border border-brand-red text-black text-lg font-medium rounded-xl flex items-center justify-center space-x-3 hover:bg-zinc-50 transition-colors"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                <span>Sign in with Google</span>
              </button>
            </div>

            <p className="text-center text-lg text-black mt-12">
              Belum punya akun? <Link href="/users/register" className="text-blue-600 font-semibold hover:underline">Daftar di sini</Link>
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
