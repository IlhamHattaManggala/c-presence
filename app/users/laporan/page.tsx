'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Helper component for the individual attendance card
const AttendanceCard = ({ 
  date, day, status, percentage, colorTheme, masuk, pulang, jadwalMasuk, jadwalPulang, themeClasses 
}: any) => {
  return (
    <div className={`p-1.5 rounded-xl flex gap-1.5 shadow-sm transform transition hover:scale-[1.02] ${themeClasses.bg}`}>
      {/* Date Block */}
      <div className="bg-white w-12 sm:w-16 rounded-l-lg flex flex-col items-center justify-center font-bold text-xl text-zinc-800">
        {date}
      </div>

      {/* Middle Block */}
      <div className="bg-white flex-1 rounded-md p-2 flex flex-col relative">
        <div className="flex justify-between items-center border-b border-dashed border-zinc-300 pb-1 mb-1">
          <span className="text-[10px] sm:text-xs text-zinc-500">{day}</span>
          {percentage && <span className="text-[10px] sm:text-xs text-zinc-500">{percentage}</span>}
        </div>
        <span className="text-zinc-800 text-sm sm:text-base mb-1">{status}</span>
      </div>

      {/* Right Block */}
      <div className="bg-white w-[110px] sm:w-[130px] rounded-r-lg p-1 flex flex-col justify-between">
        <div className="flex justify-between px-1">
          <span className="text-[8px] sm:text-[9px] text-zinc-500 font-medium">MASUK</span>
          <span className="text-[8px] sm:text-[9px] text-zinc-500 font-medium">PULANG</span>
        </div>
        
        <div className="flex justify-between gap-1 my-1">
          {/* Masuk Badge */}
          <div className={`flex-1 rounded-[4px] py-1 flex items-center justify-center text-[10px] sm:text-xs font-bold leading-none ${masuk === '--:--' ? 'bg-white text-zinc-400 border border-zinc-200' : themeClasses.badgeMasuk || 'bg-white border text-zinc-700'}`}>
            {masuk}
          </div>
          {/* Pulang Badge */}
          <div className={`flex-1 rounded-[4px] py-1 flex items-center justify-center text-[10px] sm:text-xs font-bold leading-none ${pulang === '--:--' ? themeClasses.badgeEmpty : themeClasses.badgePulang || 'bg-white border text-zinc-700'}`}>
            {pulang}
          </div>
        </div>

        <div className="flex justify-between items-center px-1">
          <span className="text-[8px] sm:text-[9px] text-zinc-400">{jadwalMasuk}</span>
          <span className="text-[7px] sm:text-[8px] text-zinc-400 font-semibold tracking-tighter">JADWAL</span>
          <span className="text-[8px] sm:text-[9px] text-zinc-400">{jadwalPulang}</span>
        </div>
      </div>
    </div>
  )
}

export default function LaporanPage() {
  const router = useRouter()
  const supabase = createClient()
  const [attendanceList, setAttendanceList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ normal: 0, telat: 0, dinas: 0, total: 0 })

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('attendance')
          .select('*, users(shift_code)')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
        
        if (data) {
          const mapped = data.map(item => {
            const dt = new Date(item.date)
            const status = item.status || 'Hadir'
            
            // Basic theme mapping
            let theme: any = { bg: 'bg-[#1DB98A]', badgeEmpty: 'bg-[#1DB98A] text-white', badgePulang: 'bg-[#1DB98A] text-white' }
            if (status === 'Telat') {
              theme = { 
                bg: 'bg-[#E53935]', 
                badgeMasuk: 'bg-[#E53935] text-white', 
                badgeEmpty: 'bg-[#E53935] text-white',
                badgePulang: 'bg-[#1DB98A] text-white'
              }
            }
            
            return {
              date: dt.getDate().toString().padStart(2, '0'),
              day: dt.toLocaleDateString('id-ID', { weekday: 'long' }),
              status: status,
              masuk: item.clock_in ? String(item.clock_in).replace(/\./g, ':').substring(0, 5) : '--:--',
              pulang: item.clock_out ? String(item.clock_out).replace(/\./g, ':').substring(0, 5) : '--:--',
              jadwalMasuk: item.users?.shift_code || '08:00',
              jadwalPulang: '17:00',
              themeClasses: theme
            }
          })
          setAttendanceList(mapped)
          
          setSummary({
            normal: mapped.filter(m => m.status === 'Hadir').length,
            telat: mapped.filter(m => m.status === 'Telat').length,
            dinas: 0,
            total: mapped.length
          })
        }
      }
      setLoading(false)
    }
    fetchHistory()
  }, [])

  return (
    <div className="bg-zinc-50 min-h-screen pb-24">
      {/* Header Area */}
      <div className="bg-brand-red pt-12 pb-24 px-6 relative">
        <div className="max-w-7xl mx-auto flex items-center space-x-3">
          <FileText className="text-white" size={28} />
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Laporan Presensi</h1>
        </div>
      </div>

      {/* Main Content Area (Pulled up over the header) */}
      <div className="px-4 relative -mt-16 z-10 max-w-7xl mx-auto">
        <div className="bg-white rounded-t-[32px] pt-6 pb-8 px-4 sm:px-6 shadow-sm min-h-screen">
          
          {/* Top Button */}
          <div className="flex justify-center mb-8">
             <button 
               onClick={() => router.push('/users/statistik')}
               className="bg-white border border-zinc-200 px-8 py-2.5 rounded-lg shadow-sm font-medium text-zinc-800 text-sm w-full max-w-sm hover:bg-zinc-50 transition"
             >
               Statistik Presensi
             </button>
          </div>

          {/* Title & Month Badge */}
          <div className="flex justify-between items-center mb-4 max-w-4xl mx-auto">
             <h2 className="text-xl sm:text-2xl font-bold text-zinc-800">Detail</h2>
             <div className="bg-[#B71C1C] text-white px-4 py-1.5 rounded-md text-sm font-medium shadow-sm">
                Januari, 2026
             </div>
          </div>

          {/* Summary Box */}
          <div className="border border-brand-red rounded-xl p-4 mb-6 max-w-4xl mx-auto bg-white">
             <h3 className="text-center font-bold text-sm text-zinc-800 mb-3 border-b border-dashed border-zinc-200 pb-2">Rekapitulasi</h3>
             <div className="flex justify-around items-center text-center">
                <div className="flex flex-col">
                   <span className="text-[#3B82F6] font-bold text-lg">{summary.normal}</span>
                   <span className="text-[10px] sm:text-xs text-zinc-700 font-medium">Normal</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[#E53935] font-bold text-lg">{summary.telat}</span>
                   <span className="text-[10px] sm:text-xs text-zinc-700 font-medium">Telat</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[#1DB98A] font-bold text-lg">{summary.dinas}</span>
                   <span className="text-[10px] sm:text-xs text-zinc-700 font-medium">Dinasan</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[#FFB300] font-bold text-lg">0</span>
                   <span className="text-[10px] sm:text-xs text-zinc-700 font-medium">Konfirmasi</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[#1DB98A] font-bold text-lg">{summary.total}</span>
                   <span className="text-[10px] sm:text-xs text-zinc-700 font-bold">Total</span>
                </div>
             </div>
          </div>

          {/* List of Attendance Cards (Responsive Grid for Desktop) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
             {loading ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
                   <Loader2 className="animate-spin text-brand-red" size={32} />
                   <p className="text-sm font-bold text-zinc-400">Memuat riwayat...</p>
                </div>
             ) : attendanceList.length === 0 ? (
                <div className="col-span-full py-20 text-center text-zinc-400 font-bold italic">
                   Belum ada data presensi.
                </div>
             ) : (
                attendanceList.map((data, idx) => (
                  <AttendanceCard key={idx} {...data} />
                ))
             )}
          </div>
          
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
