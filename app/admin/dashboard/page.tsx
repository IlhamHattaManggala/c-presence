'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, User as UserIcon, Home, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [presenceData, setPresenceData] = useState<any[]>([])
  const [stats, setStats] = useState({ hadir: 0, telat: 0, totalPegawai: 0 })
  const [loading, setLoading] = useState(true)
  const [calendarDate, setCalendarDate] = useState(new Date())

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    
    // 1. Fetch Recent Presence
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*, users(full_name, position)')
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(10)

    // 2. Fetch User Count for Stats
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')

    // 3. Simple Stats
    const h = attendance?.filter(a => a.status === 'Hadir').length || 0
    const t = attendance?.filter(a => a.status === 'Telat').length || 0
    
    setPresenceData(attendance || [])
    setStats({ hadir: h, telat: t, totalPegawai: userCount || 0 })
    setLoading(false)
  }

  const getStatusColor = (status: string) => {
     if (status === 'Hadir') return 'bg-[#38E54D] text-white'
     if (status === 'Telat') return 'bg-[#B20600] text-white'
     return 'bg-zinc-200 text-zinc-600'
  }

  const generateDays = () => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()
    
    const days = []
    
    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrevMonth - i, currentMonth: false })
    }
    
    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true })
    }
    
    // Next month padding
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false })
    }
    
    return days
  }

  const isToday = (day: number, isCurrentMonth: boolean) => {
    const today = new Date()
    return isCurrentMonth && 
           day === today.getDate() && 
           calendarDate.getMonth() === today.getMonth() && 
           calendarDate.getFullYear() === today.getFullYear()
  }

  const changeMonth = (offset: number) => {
    const newDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + offset, 1)
    setCalendarDate(newDate)
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-white scrollbar-hide">
      {/* Header */}
      <div className="min-h-[140px] md:h-28 bg-[#E62020] w-full flex flex-col md:flex-row items-center justify-between px-6 md:px-10 pr-16 md:pr-10 py-6 md:py-0 shrink-0">
         <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="text-white hidden sm:block">
               <Home size={32} />
            </div>
            <div className="text-white flex-1 md:flex-none">
               <h2 className="text-lg md:text-2xl font-bold tracking-wide">Beranda Presence</h2>
               <p className="opacity-90 font-medium text-[10px] md:text-sm">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
               </p>
            </div>
         </div>
         <div className="flex items-center justify-between md:justify-end w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t border-white/10 md:border-t-0 space-x-6">
            <div className="flex items-center space-x-3">
                <div 
                  onClick={() => router.push('/admin/notifikasi')}
                  className="w-9 h-9 md:w-10 md:h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white cursor-pointer transition shadow-sm"
                >
                   <Bell size={18} />
                </div>
               <div 
                 onClick={() => router.push('/admin/profile')}
                 className="w-9 h-9 md:w-10 md:h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white cursor-pointer transition shadow-sm"
               >
                  <UserIcon size={18} />
               </div>
            </div>
            <div className="text-right text-white leading-tight">
               <p className="font-bold text-xs md:text-sm">Admin Commuter</p>
               <p className="text-[10px] opacity-80 font-medium">System Administrator</p>
            </div>
         </div>
      </div>

      <div className="flex-1 p-6 md:p-10">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 max-w-7xl mx-auto">
            
            {/* Left Column (Presence Progress) */}
            <div className="lg:col-span-7 flex flex-col">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-zinc-800">Presence progress</h3>
                  <button onClick={() => fetchDashboardData()} className="bg-[#E62020] text-white px-6 py-1.5 rounded-full text-xs font-bold hover:bg-red-700 transition shadow-sm">Refresh</button>
               </div>
               
               <div className="space-y-4">
                  {loading ? (
                     <div className="py-20 flex flex-col items-center justify-center space-y-4 border border-zinc-100 rounded-2xl bg-zinc-50/30">
                        <Loader2 className="animate-spin text-[#E62020]" size={32} />
                        <p className="text-sm font-bold text-zinc-400">Memuat progres hari ini...</p>
                     </div>
                  ) : presenceData.length === 0 ? (
                     <div className="py-20 flex flex-col items-center justify-center space-y-4 border border-zinc-100 rounded-2xl bg-zinc-50/30">
                        <UserIcon className="text-zinc-100" size={64} />
                        <p className="text-sm font-bold text-zinc-400 italic">Belum ada aktivitas presensi hari ini.</p>
                     </div>
                  ) : (
                     presenceData.map((person) => (
                       <div key={person.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-brand-red/30 rounded-2xl bg-white shadow-sm hover:shadow-md transition gap-4 sm:gap-0">
                          <div className="flex items-center space-x-4">
                             <div className="w-12 h-12 rounded-full border-2 border-brand-red flex items-center justify-center text-brand-red">
                                <UserIcon size={24} fill="currentColor" />
                             </div>
                             <div>
                                <p className="text-sm font-bold text-zinc-800">
                                  {person.users?.full_name}<span className="text-zinc-500 font-medium text-xs">/{person.users?.position}</span>
                                </p>
                                <p className="text-[10px] text-zinc-400">
                                   Absensi berhasil di jam {new Date(person.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                </p>
                             </div>
                          </div>
                          <div className={`px-6 py-1.5 rounded-md text-xs font-bold min-w-[100px] text-center ${getStatusColor(person.status)}`}>
                             {person.status}
                          </div>
                       </div>
                     ))
                  )}
               </div>
            </div>

            {/* Right Column (Calendar & Stats) */}
            <div className="lg:col-span-5 flex flex-col space-y-10">
               
               {/* Calendar Card */}
                <div className="bg-white border border-brand-red/20 rounded-3xl p-6 shadow-xl shadow-brand-red/5">
                   <div className="flex justify-between items-center mb-6">
                      <button onClick={() => changeMonth(-1)} className="p-1 text-zinc-400 hover:text-zinc-800"><ChevronLeft size={20} /></button>
                      <h4 className="font-bold text-zinc-800 text-sm">
                        {calendarDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                      </h4>
                      <button onClick={() => changeMonth(1)} className="p-1 text-zinc-400 hover:text-zinc-800"><ChevronRight size={20} /></button>
                   </div>
                   <div className="grid grid-cols-7 gap-1 text-center mb-4">
                      {['Su','Mo','Tu','We','Th','Fr','Sa'].map((day) => (
                        <span key={day} className="text-xs font-bold text-zinc-400">{day}</span>
                      ))}
                   </div>
                   <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center text-sm font-bold text-zinc-700">
                      {generateDays().map((item, idx) => (
                        <div key={idx} className="flex items-center justify-center p-0.5">
                           <span className={`
                              w-8 h-8 flex items-center justify-center rounded-lg transition-all
                              ${!item.currentMonth ? 'text-zinc-200' : 'text-zinc-700'}
                              ${isToday(item.day, item.currentMonth) ? 'bg-[#E62020] text-white shadow-md' : ''}
                           `}>
                              {item.day}
                           </span>
                        </div>
                      ))}
                   </div>
                </div>

               {/* Statistik Kehadiran */}
               <div>
                  <h3 className="text-lg font-bold text-[#E62020] mb-6 text-center xl:text-left">Statistik Kehadiran</h3>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
                     {/* Donut Chart */}
                     <div className="relative w-40 h-40">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                           <circle cx="50" cy="50" r="40" fill="none" stroke="#e4e4e7" strokeWidth="15" />
                           <circle cx="50" cy="50" r="40" fill="none" stroke="#4ade80" strokeWidth="15" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (stats.hadir / (stats.totalPegawai || 1)))} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-xl font-extrabold text-zinc-800">{stats.hadir + stats.telat}/{stats.totalPegawai}</span>
                           <span className="text-[10px] text-zinc-400 font-medium">Total<br/>Presence</span>
                        </div>
                     </div>
                     
                     <div className="flex flex-col space-y-4">
                        <div className="flex items-center space-x-3">
                           <div className="w-5 h-5 rounded-full bg-[#4ade80]"></div>
                           <span className="text-sm font-bold text-zinc-700">Hadir: {stats.hadir}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                           <div className="w-5 h-5 rounded-full bg-zinc-200"></div>
                           <span className="text-sm font-bold text-zinc-700">Tidak Hadir: {stats.totalPegawai - (stats.hadir + stats.telat)}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                           <div className="w-5 h-5 rounded-full bg-[#dc2626]"></div>
                           <span className="text-sm font-bold text-zinc-700">Telat: {stats.telat}</span>
                        </div>
                     </div>
                  </div>
               </div>

            </div>
         </div>
      </div>
    </div>
  )
}
