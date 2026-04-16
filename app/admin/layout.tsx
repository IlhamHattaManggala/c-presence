'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Home, FileText, Bell, BarChart2, CheckSquare, Settings, LogOut, Database, AlertCircle, X, Menu } from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false)

  const navItems = [
    { label: 'Beranda', href: '/admin/dashboard', icon: Home },
    { label: 'Dokumen', href: '/admin/dokumen', icon: FileText },
    { label: 'Notifikasi', href: '/admin/notifikasi', icon: Bell },
    { label: 'Statistika', href: '/admin/statistika', icon: BarChart2 },
    { label: 'Persetujuan', href: '/admin/persetujuan', icon: CheckSquare },
    { label: 'Master Data', href: '/admin/master-data', icon: Database },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ]

  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/register'

  if (isAuthPage) {
    return <div className="h-screen bg-white">{children}</div>
  }

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden font-sans relative">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#E62020] to-[#990000] text-white flex flex-col shadow-xl shrink-0 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 flex flex-col items-center justify-center border-b border-white/10 mb-6">
           <button 
             onClick={() => setIsSidebarOpen(false)}
             className="lg:hidden absolute top-4 right-4 text-white hover:bg-white/10 p-2 rounded-full"
           >
             <X size={20} />
           </button>
           <div className="relative w-40 h-24">
              <Image 
                src="/images/logo splash.png" 
                alt="C Presence Logo" 
                fill
                sizes="160px"
                className="object-contain"
                priority
              />
           </div>
           <h1 className="text-xl font-bold tracking-wider">C Presence</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-white/20 font-bold shadow-inner' 
                    : 'hover:bg-white/10 font-medium opacity-90 hover:opacity-100'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 mb-4 border-t border-white/10">
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-all font-medium opacity-90 hover:opacity-100 text-left"
          >
            <LogOut size={20} />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
        {/* Floating Mobile Toggle (Only on Mobile) */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden fixed top-6 right-6 z-40 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-2.5 rounded-xl border border-white/20 shadow-lg transition-all active:scale-90"
          >
            <Menu size={24} />
          </button>
        )}

        <main className="flex-1 overflow-hidden relative">
          {children}
        </main>
      </div>
      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsLogoutModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-[#E62020] rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-zinc-800 mb-2">Konfirmasi Keluar</h3>
              <p className="text-zinc-500 mb-8 leading-relaxed">Apakah Anda yakin ingin keluar dari sistem? Anda harus login kembali untuk mengakses panel admin.</p>
              
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={async () => {
                    const { createClient } = await import('@/lib/supabase/client')
                    const supabase = createClient()
                    await supabase.auth.signOut()
                    setIsLogoutModalOpen(false)
                    router.push('/admin/login')
                  }}
                  className="w-full bg-[#E62020] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all active:scale-95"
                >
                  Ya, Keluar Sekarang
                </button>
                <button 
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="w-full bg-zinc-100 text-zinc-600 py-3.5 rounded-xl font-bold hover:bg-zinc-200 transition-all active:scale-95"
                >
                  Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

