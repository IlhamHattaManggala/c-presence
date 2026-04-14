'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, LineChart } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'

// Helper component for the Custom Bar Chart 1 (Presensi Per Bulan)
const PresensiChart = ({ presenceByMonth }: { presenceByMonth: any[] }) => {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const chartData = months.slice(0, 4).map((m, i) => {
    const data = presenceByMonth.find(p => p.month === i + 1) || { hadir: 0, tapIn: 0, tapOut: 0 }
    return { label: m, ...data }
  })
  
  const maxValue = Math.max(...chartData.map(d => Math.max(d.hadir, d.tapIn, d.tapOut, 10))) * 1.2
  const yAxisLabels = [Math.round(maxValue), Math.round(maxValue * 0.6), Math.round(maxValue * 0.5), Math.round(maxValue * 0.2), 0]

  return (
    <div className="mb-10 mt-6">
      <h2 className="text-[14px] font-bold text-zinc-800 mb-4 text-center sm:text-left px-2">Jumlah Laporan Presensi Per Bulan</h2>
      <div className="relative h-64 w-full flex pl-10 pr-2">
        <div className="absolute left-0 top-0 bottom-6 w-full flex flex-col justify-between">
          {yAxisLabels.map((val, idx) => (
            <div key={idx} className="relative w-full h-0 flex items-center">
              <span className="absolute left-0 text-[10px] sm:text-xs text-zinc-800 font-medium w-8 text-right">{val}</span>
              <div className="absolute left-9 right-2 border-t border-zinc-700" style={{ zIndex: 0 }}></div>
            </div>
          ))}
        </div>

        <div className="relative z-10 w-full h-[calc(100%-24px)] flex justify-around items-end pt-[8px]">
          {chartData.map((data, idx) => (
            <div key={idx} className="flex flex-col items-center h-full justify-end w-1/4">
              <div className="flex items-end justify-center gap-[2px] sm:gap-1.5 w-full h-full pb-0.5">
                <div className="w-[8px] sm:w-[14px] bg-[#2D3748] rounded-[1px]" style={{ height: `${(data.hadir / maxValue) * 100}%` }}></div>
                <div className="w-[8px] sm:w-[14px] bg-[#F97316] rounded-[1px]" style={{ height: `${(data.tapIn / maxValue) * 100}%` }}></div>
                <div className="w-[8px] sm:w-[14px] bg-[#22C55E] rounded-[1px]" style={{ height: `${(data.tapOut / maxValue) * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="absolute bottom-0 left-9 right-2 h-6 flex justify-around items-center">
          {chartData.map((data, idx) => (
            <span key={idx} className="text-[10px] sm:text-xs text-zinc-800 w-1/4 text-center">{data.label}</span>
          ))}
        </div>
      </div>

      <div className="flex justify-center items-center gap-4 sm:gap-6 mt-6">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-[#2D3748] rounded-[2px]"></div>
          <span className="text-xs text-[#2D3748]">Hadir</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-[#F97316] rounded-[2px]"></div>
          <span className="text-xs text-[#F97316]">Tap In</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 bg-[#22C55E] rounded-[2px]"></div>
          <span className="text-xs text-[#22C55E]">Tap Out</span>
        </div>
      </div>
    </div>
  )
}

// Helper component for the Custom Bar Chart 2 (Pengajuan)
const PengajuanChart = ({ requestsByType }: { requestsByType: any }) => {
  const chartData = [
    { label: 'Ubah Jadwal', value: requestsByType.UBAH_JADWAL || 0, color: '#B71C1C' },
    { label: 'Izin', value: requestsByType.IZIN || 0, color: '#F97316' },
    { label: 'Dinas Luar', value: requestsByType.DINAS_LUAR || 0, color: '#2D3748' },
  ]
  const maxValue = Math.max(...chartData.map(d => d.value), 10) * 1.2
  const yAxisLabels = [Math.round(maxValue), Math.round(maxValue * 0.6), Math.round(maxValue * 0.5), Math.round(maxValue * 0.2), 0]

  return (
    <div className="mb-10">
      <h2 className="text-[14px] font-bold text-zinc-800 mb-4 text-center sm:text-left px-2">Jumlah Laporan Pengajuan</h2>
      <div className="relative h-64 w-full flex pl-10 pr-2">
        <div className="absolute left-0 top-0 bottom-6 w-full flex flex-col justify-between">
          {yAxisLabels.map((val, idx) => (
            <div key={idx} className="relative w-full h-0 flex items-center">
              <span className="absolute left-0 text-[10px] sm:text-xs text-zinc-800 font-medium w-8 text-right">{val}</span>
              <div className="absolute left-9 right-2 border-t border-zinc-700" style={{ zIndex: 0 }}></div>
            </div>
          ))}
        </div>

        <div className="relative z-10 w-full h-[calc(100%-24px)] flex justify-around items-end pt-[8px]">
          {chartData.map((data, idx) => (
            <div key={idx} className="flex flex-col items-center h-full justify-end w-1/3">
              <div className="flex items-end justify-center w-full h-full pb-0.5">
                <div className="w-12 sm:w-16 rounded-[1px]" style={{ height: `${(data.value / maxValue) * 100}%`, backgroundColor: data.color }}></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="absolute bottom-0 left-9 right-2 h-6 flex justify-around items-center">
          {chartData.map((data, idx) => (
            <span key={idx} className="text-[10px] sm:text-xs text-zinc-800 w-1/3 text-center">{data.label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function StatisticsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = React.useState(true)
  const [presenceByMonth, setPresenceByMonth] = React.useState<any[]>([])
  const [requestsByType, setRequestsByType] = React.useState<any>({ UBAH_JADWAL: 0, IZIN: 0, DINAS_LUAR: 0 })

  React.useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Attendance Stats (simplified grouping in JS for demo)
        const { data: attendance } = await supabase
          .from('attendance')
          .select('date, clock_in, clock_out')
          .eq('user_id', user.id)
        
        const grouped: any = {}
        attendance?.forEach(a => {
           const month = new Date(a.date).getMonth() + 1
           if (!grouped[month]) grouped[month] = { hadir: 0, tapIn: 0, tapOut: 0 }
           grouped[month].hadir++
           if (a.clock_in) grouped[month].tapIn++
           if (a.clock_out) grouped[month].tapOut++
        })
        setPresenceByMonth(Object.keys(grouped).map(k => ({ month: parseInt(k), ...grouped[k] })))

        // Request Stats
        const { data: requests } = await supabase
          .from('approval_requests')
          .select('type')
          .eq('user_id', user.id)
        
        const reqGrouped: any = { UBAH_JADWAL: 0, IZIN: 0, DINAS_LUAR: 0 }
        requests?.forEach(r => {
           reqGrouped[r.type] = (reqGrouped[r.type] || 0) + 1
        })
        setRequestsByType(reqGrouped)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  return (
    <div className="bg-white min-h-screen pb-32">
      {/* Header Area */}
      <div className="bg-brand-red pt-12 pb-12 w-full relative">
        <div className="max-w-4xl mx-auto flex items-center px-4 w-full">
          <button 
            onClick={() => router.back()}
            className="text-white p-1 hover:bg-white/10 rounded-full transition-colors mr-2 absolute left-4 z-20"
          >
            <ChevronLeft size={28} />
          </button>
          
          <div className="w-full flex justify-center items-center space-x-2">
             <LineChart className="text-white" size={32} />
             <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Statistik Presensi</h1>
          </div>
        </div>
      </div>

      <div className="w-full relative -mt-6 z-10 bg-white rounded-t-[24px] pt-8 px-2 sm:px-6 flex-1 max-w-4xl mx-auto">
         {loading ? (
           <div className="flex justify-center py-20">
             <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
           </div>
         ) : (
           <>
             <PresensiChart presenceByMonth={presenceByMonth} />
             <PengajuanChart requestsByType={requestsByType} />
           </>
         )}
      </div>

      <BottomNav />
    </div>
  )
}
