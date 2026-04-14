'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Clock, Calendar, UserRoundPen, TrainFront } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'

export default function TimeManagement() {
  const router = useRouter()

  const menus = [
    { 
       title: 'Form Ubah Jadwal', 
       icon: Calendar, 
       href: '/users/time-management/form?type=ubah-jadwal' 
    },
    { 
       title: 'Form Izin/Sakit', 
       icon: UserRoundPen, 
       href: '/users/time-management/form?type=izin' 
    },
    { 
       title: 'Form Dinas Luar', 
       icon: TrainFront, 
       href: '/users/time-management/form?type=dinas-luar' 
    },
  ]

  return (
    <div className="bg-white min-h-screen pb-32">
      {/* Header */}
      <div className="bg-brand-red pt-12 pb-10 px-6 relative">
        <div className="max-w-7xl mx-auto flex items-center relative z-10">
          <button 
            onClick={() => router.back()}
            className="text-white p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft size={32} />
          </button>
          <div className="flex items-center space-x-4 ml-2">
             <div className="w-14 h-14 bg-white/20 rounded-full border-2 border-white flex items-center justify-center">
                <Clock className="text-white" size={32} />
             </div>
             <h1 className="text-2xl lg:text-3xl font-bold text-white leading-tight">
                Manajemen<br/>Waktu
             </h1>
          </div>
        </div>
      </div>

      {/* Menu Cards */}
      <div className="max-w-3xl mx-auto px-6 mt-10 space-y-6">
        {menus.map((menu) => (
          <button
            key={menu.title}
            onClick={() => router.push(menu.href)}
            className="w-full bg-[#B71C1C] rounded-[24px] p-8 flex flex-col items-center justify-center space-y-4 shadow-lg active:scale-[0.98] hover:bg-[#8B0000] transition-all group"
          >
            <div className="text-white group-hover:scale-110 transition-transform duration-300">
               <menu.icon size={64} strokeWidth={1.5} />
            </div>
            <span className="text-white text-xl lg:text-2xl font-bold tracking-wide">
              {menu.title}
            </span>
          </button>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
