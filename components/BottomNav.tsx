'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, Camera, Bell, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function BottomNav() {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    const fetchUnreadCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false)

        if (!error && count !== null) {
          setUnreadCount(count)
        }
      } catch (err) {
        console.error('Error fetching unread count:', err)
      }
    }

    fetchUnreadCount()

    // Realtime subscription for notification updates
    const channel = supabase
      .channel('notifications-badge-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const navItems = [
    { icon: Home, label: 'Beranda', href: '/users/dashboard' },
    { icon: FileText, label: 'Laporan', href: '/users/laporan' },
    { icon: null, label: '', href: '/users/camera' }, // Placeholder for center button
    { icon: Bell, label: 'Notifikasi', href: '/users/notifikasi' },
    { icon: User, label: 'Profil', href: '/users/profile' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-brand-red z-[100] border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      <div className="flex justify-around items-center h-16 relative px-4 max-w-4xl mx-auto">
        {navItems.map((item, index) => {
          if (index === 2) {
            {/* Center Floating Camera Button */}
            return (
              <div key="center-camera" className="relative -top-6">
                <Link 
                  href="/users/presence" 
                  className="w-16 h-16 bg-[#2D3E50] border-4 border-white rounded-full flex items-center justify-center text-white shadow-xl active:scale-95 transition-transform"
                >
                  <Camera size={32} />
                </Link>
                <div className="h-4"></div>
              </div>
            )
          }

          const isActive = pathname === item.href
          const Icon = item.icon!

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center space-y-1 transition-all flex-1 ${
                isActive ? 'text-white' : 'text-white/60 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {item.label === 'Notifikasi' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center border border-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] whitespace-nowrap">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

