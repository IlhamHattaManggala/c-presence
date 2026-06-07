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

  const [selectedMonthStr, setSelectedMonthStr] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [apresiasi, setApresiasi] = useState<{
    bestPS: any[],
    bestAnn: any[],
    worst: any[]
  }>({ bestPS: [], bestAnn: [], worst: [] })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    fetchApresiasiData(selectedMonthStr)
  }, [selectedMonthStr])

  const fetchDashboardData = async () => {
    setLoading(true)
    const d = new Date()
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    
    const { data: attendance } = await supabase
      .from('attendance')
      .select('*, users(full_name, position)')
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(10)

    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')

    const h = attendance?.filter(a => a.status === 'Tepat Waktu' || a.status === 'Hadir').length || 0
    const t = attendance?.filter(a => a.status === 'Telat').length || 0
    
    setPresenceData(attendance || [])
    setStats({ hadir: h, telat: t, totalPegawai: userCount || 0 })
    setLoading(false)
  }

  const fetchApresiasiData = async (monthStr: string) => {
    try {
      const [year, month] = monthStr.split('-').map(Number)
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate()
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'user')

      if (!usersData) return

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)

      const { data: requestsData } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('status', 'Disetujui')
        .gte('tgl_permohonan', startDate)
        .lte('tgl_permohonan', endDate)

      const attendanceByUser = new Map<string, any[]>()
      const requestsByUser = new Map<string, any[]>()

      if (attendanceData) {
        attendanceData.forEach(a => {
          const list = attendanceByUser.get(a.user_id) || []
          list.push(a)
          attendanceByUser.set(a.user_id, list)
        })
      }

      if (requestsData) {
        requestsData.forEach(r => {
          const list = requestsByUser.get(r.user_id) || []
          list.push(r)
          requestsByUser.set(r.user_id, list)
        })
      }

      const processedUsers = usersData.map(u => {
        const uAttendance = attendanceByUser.get(u.id) || []
        const uRequests = requestsByUser.get(u.id) || []

        const totalDinas = uAttendance.length
        const totalLate = uAttendance.filter(a => a.status === 'Telat').length
        const hasExclusions = uRequests.length > 0

        return {
          ...u,
          totalDinas,
          totalLate,
          hasExclusions
        }
      })

      // 3 Passenger Service terbaik
      let bestPS = processedUsers
        .filter(u => u.position?.toLowerCase().includes('passenger') && !u.hasExclusions && u.totalLate === 0 && u.totalDinas > 0)
        .sort((a, b) => b.totalDinas - a.totalDinas)
        .slice(0, 3)

      if (bestPS.length === 0) {
        bestPS = processedUsers
          .filter(u => u.position?.toLowerCase().includes('passenger'))
          .sort((a, b) => b.totalDinas - a.totalDinas || a.totalLate - b.totalLate)
          .slice(0, 3)
      }

      // 3 Announcer terbaik
      let bestAnn = processedUsers
        .filter(u => u.position?.toLowerCase().includes('announcer') && !u.hasExclusions && u.totalLate === 0 && u.totalDinas > 0)
        .sort((a, b) => b.totalDinas - a.totalDinas)
        .slice(0, 3)

      if (bestAnn.length === 0) {
        bestAnn = processedUsers
          .filter(u => u.position?.toLowerCase().includes('announcer'))
          .sort((a, b) => b.totalDinas - a.totalDinas || a.totalLate - b.totalLate)
          .slice(0, 3)
      }

      // 5 Terbawah
      const worst = processedUsers
        .filter(u => u.totalLate > 0 || u.totalDinas === 0)
        .sort((a, b) => b.totalLate - a.totalLate || a.totalDinas - b.totalDinas)
        .slice(0, 5)

      setApresiasi({ bestPS, bestAnn, worst })
    } catch (err) {
      console.error('Error fetching apresiasi data:', err)
    }
  }

  // Generate last 6 months options
  const getMonthOptions = () => {
    const options = []
    const date = new Date()
    for (let i = 0; i < 6; i++) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const monthName = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      options.push({ value: `${year}-${month}`, label: monthName })
      date.setMonth(date.getMonth() - 1)
    }
    return options
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
               <p className="text-[10px] md:text-xs font-bold text-white/80 uppercase tracking-widest leading-none mt-0.5 mb-1">PT KAI Commuter</p>
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

                {/* Apresiasi Pegawai Bulanan */}
                <div className="flex flex-col">
                   <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-black text-brand-red uppercase tracking-wider">Apresiasi Pegawai</h3>
                      
                      {/* Month Dropdown */}
                      <select 
                        value={selectedMonthStr}
                        onChange={(e) => setSelectedMonthStr(e.target.value)}
                        className="bg-brand-red text-white text-[10px] px-2.5 py-1 rounded-lg font-bold outline-none cursor-pointer border border-white/20"
                      >
                        {getMonthOptions().map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-white text-zinc-800">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                   </div>
                   
                   <div className="text-center mb-4">
                      <h4 className="text-sm md:text-base font-extrabold text-brand-red leading-tight">
                         Apresiasi Pegawai Outsourching<br/>PT. KAI Commuter
                      </h4>
                   </div>
                   
                   <div className="border border-brand-red/40 rounded-3xl p-5 bg-white shadow-xl shadow-brand-red/5 space-y-4">
                      {/* Passenger Service & Announcer List */}
                      {(() => {
                        const [year, month] = selectedMonthStr.split('-').map(Number)
                        const totalWorkingDays = new Date(year, month, 0).getDate()
                        
                        const items = [
                          ...apresiasi.bestPS.map((u, idx) => ({ ...u, rank: idx + 1 })),
                          ...apresiasi.bestAnn.map((u, idx) => ({ ...u, rank: idx + 1 }))
                        ]
                        
                        if (items.length === 0) {
                          return <p className="italic text-zinc-400 text-xs text-center py-6">Belum ada data apresiasi pegawai.</p>
                        }
                        
                        return items.map((u) => {
                          const isAnn = u.position?.toLowerCase().includes('announcer');
                          const progressColor = isAnn
                            ? (u.rank === 1 ? 'bg-[#38E54D]' : 'bg-[#003FE1]')
                            : (u.rank === 3 ? 'bg-[#003FE1]' : 'bg-[#38E54D]');
                          
                          const percentage = Math.min(100, Math.round((u.totalDinas / totalWorkingDays) * 100)) || 0;
                          const displayNik = u.nik || (2210512020 + u.rank);

                          return (
                            <div key={`${u.id}-${u.position}`} className="flex items-center justify-between p-3 border border-brand-red/35 rounded-xl bg-white shadow-sm hover:shadow transition gap-3">
                              {/* Left side info */}
                              <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                                {/* Medal Badge */}
                                <div className="shrink-0 w-8 h-8 flex items-center justify-center">
                                  <img 
                                    src={`/images/medali/Medali-${u.rank}.webp`} 
                                    alt={`Medali ${u.rank}`} 
                                    className="w-full h-full object-contain"
                                  />
                                </div>

                                {/* NIK Pill */}
                                <span className="shrink-0 bg-yellow-50 text-yellow-800 text-[8px] font-black px-1.5 py-0.5 rounded border border-yellow-300">
                                  {displayNik}
                                </span>

                                {/* Avatar */}
                                <div className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center overflow-hidden shrink-0 bg-zinc-50 text-zinc-400">
                                  <UserIcon size={16} fill="currentColor" />
                                </div>

                                {/* Name & Role */}
                                <div className="min-w-0 leading-tight">
                                  <p className="text-[11px] font-black text-zinc-800 truncate">{u.full_name}</p>
                                  <p className="text-[8px] font-extrabold text-zinc-400 truncate uppercase tracking-tighter">{u.position}</p>
                                </div>
                              </div>

                              {/* Right side progress */}
                              <div className="w-24 sm:w-28 shrink-0 flex flex-col justify-center">
                                {/* Progress Bar */}
                                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden border border-zinc-200/50">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                {/* Progress Info */}
                                <div className="flex justify-between items-center text-[7px] font-black text-zinc-400 mt-1 uppercase tracking-tighter">
                                  <span>{u.totalDinas}/{totalWorkingDays}h</span>
                                  <span>{percentage}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                   </div>
                </div>

            </div>
         </div>
      </div>
    </div>
  )
}
