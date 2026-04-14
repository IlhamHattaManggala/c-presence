'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'

export default function NotifikasiMainPage() {
  const router = useRouter()

  return (
    <div className="bg-zinc-50 min-h-screen pb-32">
      {/* Header Area */}
      <div className="bg-brand-red pt-12 pb-12 w-full relative">
        <div className="max-w-4xl mx-auto flex items-center px-4 w-full justify-center space-x-2">
           <Bell className="text-white" size={30} />
           <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Notifikasi</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 mt-6">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-zinc-800">Informasi Penting</h2>
            <button 
              onClick={() => router.push('/users/notifikasi/info')}
              className="text-xs font-bold text-brand-red hover:underline"
            >
              Lihat Semua
            </button>
         </div>

         <div className="space-y-4">
            {/* Card 1 */}
            <div 
              onClick={() => router.push('/users/notifikasi/info')}
              className="bg-brand-red rounded-xl p-6 relative overflow-hidden shadow-lg cursor-pointer transform transition active:scale-[0.98] hover:-translate-y-1"
            >
              <div className="relative z-10 flex text-white font-bold text-xl uppercase w-1/2 leading-tight">
                 Informasi Karyawan
              </div>
              {/* Decorative Pattern Background */}
              <div className="absolute top-0 right-0 w-32 h-full opacity-30">
                 <div className="w-full h-full relative" style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 2.5px)', backgroundSize: '12px 12px' }}></div>
              </div>
            </div>

            {/* Card 2 */}
            <div 
              onClick={() => router.push('/users/notifikasi/riwayat')}
              className="bg-brand-red rounded-xl p-6 relative overflow-hidden shadow-lg cursor-pointer transform transition active:scale-[0.98] hover:-translate-y-1"
            >
              <div className="relative z-10 flex text-white font-bold text-xl uppercase w-1/2 leading-tight">
                 Riwayat Pengajuan
              </div>
              {/* Decorative Pattern Background */}
              <div className="absolute top-0 right-0 w-32 h-full opacity-30">
                 <div className="w-full h-full relative" style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 2.5px)', backgroundSize: '12px 12px' }}></div>
              </div>
            </div>
         </div>
      </div>

      <BottomNav />
    </div>
  )
}
