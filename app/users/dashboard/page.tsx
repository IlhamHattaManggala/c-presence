'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { BottomNav } from '@/components/BottomNav'
import { useRouter } from 'next/navigation'
import { Clock, Download, PieChart, Settings, User, LogOut, LayoutGrid, CalendarDays, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

import { StatusModal } from '@/components/StatusModal'

export default function UserDashboard() {
  const router = useRouter()
  const supabase = createClient()
  const [userData, setUserData] = useState<any>(null)
  const [todayAttendance, setTodayAttendance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ isOpen: boolean, status: 'success' | 'error' | 'loading', message: string }>({
    isOpen: false,
    status: 'loading',
    message: ''
  })

  useEffect(() => {
    const getData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Fetch Profile
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .maybeSingle() // Gunakan maybeSingle agar tidak error jika data kosong di database
            
          if (profileError) {
            console.error("Dashboard Profile Error:", profileError)
          }

          if (!profile) {
            // Jika profil belum ada di tabel 'users' (misal: baru login Google pertama kali)
            // Ambil data dasar dari metadata auth
            setUserData({
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
              position: 'Karyawan Baru',
              role: 'user'
            })
          } else {
            setUserData(profile)
          }

          // Fetch Today's Attendance
          // Gunakan format lokal YYYY-MM-DD agar sinkron dengan waktu user
          const today = new Date().toLocaleDateString('en-CA') 
          const { data: attendance } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .order('clock_in', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          setTodayAttendance(attendance)
        }
      } catch (err) {
        console.error("Dashboard Data Fetch Error:", err)
      } finally {
        setLoading(false)
      }
    }
    getData()
  }, [])

  const handleCloseModal = () => setModal({ ...modal, isOpen: false })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/users/login')
  }
  return (
    <div className="bg-zinc-50 min-h-screen pb-32">
      {/* Header Section - Full Width on Desktop */}
      <div className="bg-brand-red pt-12 pb-24 px-6 lg:px-20 rounded-b-[40px] lg:rounded-none relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-4 lg:space-x-6">
            <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white rounded-full flex items-center justify-center border-4 border-white/20 shadow-lg">
               <User className="text-brand-red" size={32} fill="currentColor" />
            </div>
            <div className="text-white">
               <h1 className="text-xl lg:text-3xl font-bold leading-tight">
                 {loading ? 'Memuat...' : (userData?.full_name || 'User Commuter')}
               </h1>
               <p className="text-sm lg:text-base opacity-90 font-medium">
                 {userData?.position || 'Pegawai PT KAI'}
               </p>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center space-x-4">
             <button className="bg-white/10 hover:bg-white/20 p-3 rounded-full text-white transition-colors">
                <Bell size={24} />
             </button>
             <button 
                onClick={handleLogout}
                className="bg-white text-brand-red hover:bg-zinc-100 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg flex items-center space-x-2"
             >
                <LogOut size={20} />
                <span>Logout</span>
             </button>
          </div>
        </div>
        
        {/* Decorative elements for desktop */}
        <div className="absolute top-[-20%] right-[-5%] w-96 h-96 bg-white/5 rounded-full blur-3xl hidden lg:block"></div>
        <div className="absolute bottom-[-20%] left-[-5%] w-80 h-80 bg-black/5 rounded-full blur-3xl hidden lg:block"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-20">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 -mt-12">
          
          {/* Left Column: Presence Card (Span 4 on Desktop) */}
          <div className="lg:col-span-4 z-20">
            <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-[0_10px_40px_rgb(0,0,0,0.08)] border border-zinc-100 h-full flex flex-col justify-center">
               <h2 className="text-lg lg:text-xl font-bold text-zinc-800 mb-6 text-center border-b pb-4 border-zinc-50 flex items-center justify-center space-x-2">
                 <CalendarDays className="text-brand-red" size={20} />
                 <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </h2>
               <div className="grid grid-cols-3 gap-4">
                 <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-red-50 text-brand-red rounded-2xl flex items-center justify-center mb-2 shadow-sm">
                       <Clock size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-bold text-zinc-800">
                      {todayAttendance?.clock_in ? todayAttendance.clock_in.substring(0, 5) : '--.--'}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium font-sans uppercase tracking-wider">Masuk</span>
                 </div>
                 <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-red-50 text-brand-red rounded-2xl flex items-center justify-center mb-2 shadow-sm">
                       <Clock size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-sm font-bold text-zinc-800">
                      {todayAttendance?.clock_out ? todayAttendance.clock_out.substring(0, 5) : '--.--'}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium font-sans uppercase tracking-wider">Pulang</span>
                 </div>
                 <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-red-100/50 text-brand-red rounded-2xl flex items-center justify-center mb-2 shadow-sm">
                       <div className="relative">
                          <Clock size={24} strokeWidth={2.5} />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-0.5 bg-brand-red rotate-45"></div>
                       </div>
                    </div>
                    <span className="text-sm font-bold text-zinc-800">
                      {todayAttendance?.clock_in && todayAttendance?.clock_out 
                        ? (() => {
                            const parseTime = (t: string) => {
                              const cleaned = String(t).trim().replace(/\./g, ':');
                              const [h, m, s] = cleaned.split(':').map(val => parseInt(val, 10) || 0);
                              return (h * 3600) + (m * 60) + s;
                            };
                            const totalIn = parseTime(todayAttendance.clock_in);
                            const totalOut = parseTime(todayAttendance.clock_out);
                            if (isNaN(totalIn) || isNaN(totalOut)) return '--.--';
                            const diff = Math.max(0, totalOut - totalIn);
                            const hours = Math.floor(diff / 3600);
                            const minutes = Math.floor((diff % 3600) / 60);
                            return `${hours.toString().padStart(2, '0')}.${minutes.toString().padStart(2, '0')}`;
                          })()
                        : '--.--'}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-medium font-sans uppercase tracking-wider">Durasi</span>
                 </div>
              </div>
              
               <button 
                onClick={() => router.push('/users/presence')}
                className="mt-8 w-full py-4 bg-brand-red text-white rounded-2xl font-bold shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark transition-all transform active:scale-[0.98] hidden lg:block"
              >
                 {todayAttendance?.clock_in ? 'Lakukan Presensi Pulang' : 'Lakukan Presensi Sekarang'}
              </button>
            </div>
          </div>

          {/* Right Column: Banner & Menus (Span 8 on Desktop) */}
          <div className="lg:col-span-8 flex flex-col space-y-8">
            {/* Banner Section */}
            <div className="w-full h-56 lg:h-80 relative rounded-[32px] overflow-hidden shadow-2xl group">
                <Image 
                  src="/images/BerandaUser.png" 
                  alt="KAI Train" 
                  fill 
                  sizes="(max-width: 768px) 100vw, 850px"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-8 text-white">
                   <p className="text-sm font-medium opacity-80 mb-1">KAI Commuter Indonesia</p>
                   <h3 className="text-xl lg:text-2xl font-bold">Layanan Presensi Digital Terintegrasi</h3>
                </div>
            </div>

            {/* Menu Grid */}
            <div className="bg-white rounded-[32px] p-8 lg:p-10 shadow-sm border border-zinc-100 flex-1">
              <h3 className="text-lg font-bold text-zinc-800 mb-8 flex items-center space-x-2 lg:hidden">
                 <LayoutGrid size={20} className="text-brand-red" />
                 <span>Menu Layanan</span>
              </h3>
              <div className="grid grid-cols-3 gap-6 lg:gap-12 lg:grid-cols-3 items-start">
                <div 
                  onClick={() => router.push('/users/time-management')}
                  className="flex flex-col items-center group cursor-pointer"
                >
                   <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-full border-2 border-brand-red flex items-center justify-center mb-3 active:bg-zinc-50 transition-all group shadow-lg shadow-brand-red/5 hover:-translate-y-1 bg-white">
                      <div className="relative group-hover:scale-110 transition-transform flex items-center justify-center">
                         {/* Calendar Body */}
                         <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-50 to-orange-100/80 rounded-xl relative flex items-center justify-center shadow-inner border border-orange-200 mt-2">
                            {/* Calendar Binders */}
                            <div className="absolute -top-2 left-2.5 w-1.5 h-3.5 bg-zinc-700 rounded-full shadow-sm"></div>
                            <div className="absolute -top-2 right-2.5 w-1.5 h-3.5 bg-zinc-700 rounded-full shadow-sm"></div>
                            {/* Calendar Header Red Strip */}
                            <div className="w-full h-3.5 absolute top-0 bg-brand-red rounded-t-xl opacity-90 border-b border-brand-red"></div>
                            
                            {/* Calendar Grid Details */}
                            <div className="w-5 h-3 grid grid-cols-2 gap-1 mt-3">
                               <div className="w-full h-1 bg-orange-200 rounded-sm"></div>
                               <div className="w-full h-1 bg-orange-200 rounded-sm"></div>
                               <div className="w-full h-1 bg-orange-200 rounded-sm"></div>
                            </div>
                            
                            {/* Clock Overlapping */}
                            <div className="absolute -bottom-2 -right-3 w-7 h-7 lg:w-8 lg:h-8 bg-white rounded-full flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.1)] border border-orange-100">
                               <Clock size={16} className="text-brand-red" strokeWidth={3} />
                            </div>
                         </div>
                      </div>
                   </div>
                   <span className="text-xs lg:text-base font-bold text-zinc-700 text-center leading-tight">Manajemen<br className="lg:hidden"/> Waktu</span>
                </div>

                <div 
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => router.push('/users/statistik')}
                >
                   <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-full border-2 border-brand-red flex items-center justify-center mb-3 active:bg-zinc-50 transition-all cursor-pointer group shadow-lg shadow-brand-red/5 hover:-translate-y-1">
                      <div className="text-blue-500 group-hover:scale-110 transition-transform flex items-end space-x-1">
                         <div className="w-2.5 h-6 lg:h-8 bg-blue-300 rounded-sm"></div>
                         <div className="w-2.5 h-10 lg:h-12 bg-blue-500 rounded-sm"></div>
                         <div className="w-2.5 h-4 lg:h-6 bg-blue-200 rounded-sm"></div>
                      </div>
                   </div>
                   <span className="text-xs lg:text-base font-bold text-zinc-700 text-center leading-tight">Statistika</span>
                </div>

                <div 
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => router.push('/users/dokumen')}
                >
                   <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-full border-2 border-brand-red flex items-center justify-center mb-3 active:bg-zinc-50 transition-all cursor-pointer group shadow-lg shadow-brand-red/5 hover:-translate-y-1">
                      <div className="relative text-yellow-500 group-hover:scale-110 transition-transform">
                         <div className="w-10 h-8 lg:w-14 lg:h-10 bg-yellow-400 rounded-br-md rounded-bl-sm rounded-tr-sm relative shadow-inner">
                            <div className="absolute -top-1.5 left-0 w-6 h-3 bg-yellow-500 rounded-t-sm"></div>
                         </div>
                         <Download size={18} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
                      </div>
                   </div>
                   <span className="text-xs lg:text-base font-bold text-zinc-700 text-center leading-tight">Dokumen</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <StatusModal 
        isOpen={modal.isOpen}
        status={modal.status}
        message={modal.message}
        onClose={handleCloseModal}
      />
      <BottomNav />
    </div>
  )
}
