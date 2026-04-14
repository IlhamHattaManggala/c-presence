'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FileText, Camera, Bell, User } from 'lucide-react'

export function BottomNav() {
  const pathname = usePathname()

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
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] whitespace-nowrap">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
