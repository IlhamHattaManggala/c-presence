'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { StatusModal } from '@/components/StatusModal'

export default function AdminLoginPage() {
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
    setModal({ isOpen: true, status: 'loading', message: 'Memverifikasi hak akses administrator...' })
    
    // Sign in
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setModal({ isOpen: true, status: 'error', message: 'Login Gagal: ' + authError.message })
    } else if (user) {
      // Check if user is admin
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/users/dashboard')
      }
    }
    setLoading(false)
  }

  const handleCloseModal = () => {
    setModal({ ...modal, isOpen: false })
  }

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Area (Illustration) */}
      <div className="bg-[#D32F2F] w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 min-h-[40vh]">
        <div className="w-full max-w-[500px] aspect-[1.5/1] relative">
          <Image 
            src="/images/Logo Login.png" 
            alt="Admin Login Illustration" 
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Right Area (Admin Login Form) */}
      <div className="flex-1 bg-white flex items-center justify-center p-8 lg:p-20">
        <div className="w-full max-w-[450px]">
          <h2 className="text-2xl lg:text-3xl font-bold text-black mb-2">Masuk Admin</h2>
          <p className="text-zinc-500 mb-8">Silakan masuk ke panel administrasi.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-lg font-medium text-black">Email</label>
              <input 
                type="email" 
                placeholder="admin@cpresence.com" 
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

            <div className="flex items-center space-x-3 pt-2">
              <input 
                type="checkbox" 
                id="remember-admin"
                className="w-6 h-6 border-zinc-300 rounded text-brand-red focus:ring-brand-red cursor-pointer" 
              />
              <label htmlFor="remember-admin" className="text-lg text-black font-medium cursor-pointer">
                Ingat Saya
              </label>
            </div>

            <div className="space-y-4 pt-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#B71C1C] text-white text-xl font-bold rounded-xl hover:bg-[#8B0000] transition-colors shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Memuat...' : 'Masuk'}
              </button>
            </div>

             <p className="text-center text-sm font-medium text-zinc-400 mt-12 italic">
               Registrasi administrator hanya dapat dilakukan oleh sesama admin melalui panel Master Data.
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
