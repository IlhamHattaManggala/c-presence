'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, ChevronLeft } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'

export default function NotifikasiMainPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  
  const [unreadInfo, setUnreadInfo] = useState(0)
  const [unreadRiwayat, setUnreadRiwayat] = useState(0)

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Fetch unread INFO notifications
        const { count: infoCount, error: infoError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
          .eq('type', 'INFO')

        if (!infoError && infoCount !== null) {
          setUnreadInfo(infoCount)
        }

        // 2. Fetch unread APPROVAL_UPDATE notifications
        const { count: riwayatCount, error: riwayatError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)
          .eq('type', 'APPROVAL_UPDATE')

        if (!riwayatError && riwayatCount !== null) {
          setUnreadRiwayat(riwayatCount)
        }
      } catch (err) {
        console.error('Error fetching unread notification counts:', err)
      }
    }

    fetchUnreadCounts()

    // Subscribe to notification updates
    const channel = supabase
      .channel('notifications-main-badge-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          fetchUnreadCounts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  return (
    <div className="bg-zinc-50 min-h-screen pb-32">
      {/* Header Area */}
      <div className="bg-brand-red pt-12 pb-12 w-full relative">
        <div className="max-w-4xl mx-auto flex items-center px-4 w-full relative">
          <button 
            onClick={() => router.push('/users/dashboard')}
            className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
          <div className="flex items-center justify-center mx-auto space-x-2">
            <Bell className="text-white" size={30} />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Notifikasi</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 mt-6">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-zinc-800">Informasi Penting</h2>
         </div>

         <div className="space-y-4">
            {/* Card 1: Informasi */}
            <div 
              onClick={() => router.push('/users/notifikasi/info')}
              className="bg-brand-red rounded-xl p-6 relative overflow-hidden shadow-lg cursor-pointer transform transition active:scale-[0.98] hover:-translate-y-1"
            >
              <div className="relative z-10 flex items-center space-x-3 text-white font-bold text-xl uppercase leading-tight">
                 <span>Informasi</span>
                 {unreadInfo > 0 && (
                   <span className="bg-white text-brand-red text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                     {unreadInfo}
                   </span>
                 )}
              </div>
              {/* Decorative Pattern Background */}
              <div className="absolute top-0 right-0 w-32 h-full opacity-30">
                 <div className="w-full h-full relative" style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 2.5px)', backgroundSize: '12px 12px' }}></div>
              </div>
            </div>

            {/* Card 2: Riwayat Pengajuan */}
            <div 
              onClick={() => router.push('/users/notifikasi/riwayat')}
              className="bg-brand-red rounded-xl p-6 relative overflow-hidden shadow-lg cursor-pointer transform transition active:scale-[0.98] hover:-translate-y-1"
            >
              <div className="relative z-10 flex items-center space-x-3 text-white font-bold text-xl uppercase leading-tight">
                 <span>Riwayat Pengajuan</span>
                 {unreadRiwayat > 0 && (
                   <span className="bg-white text-brand-red text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                     {unreadRiwayat}
                   </span>
                 )}
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
