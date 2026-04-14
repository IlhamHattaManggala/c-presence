'use client'

import React, { useState, useEffect } from 'react'
import { TrendingUp, CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function StatistikaPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({ hadir: 0, telat: 0, tidakHadir: 0, totalPegawai: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    
    // Total Pegawai
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')

    // Hadir (Termasuk Telat)
    const today = new Date().toISOString().split('T')[0]
    const { data: attendanceToday } = await supabase
      .from('attendance')
      .select('status')
      .eq('date', today)

    const hadir = attendanceToday?.filter(a => a.status === 'Hadir').length || 0
    const telat = attendanceToday?.filter(a => a.status === 'Telat').length || 0
    const totalHadir = hadir + telat
    const tidakHadir = (userCount || 0) - totalHadir

    setStats({ 
      hadir, 
      telat, 
      tidakHadir: tidakHadir > 0 ? tidakHadir : 0, 
      totalPegawai: userCount || 0 
    })
    setLoading(false)
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-24 bg-gradient-to-r from-[#E62020] to-[#8B0000] w-full flex items-center px-10 shrink-0">
        <div className="flex items-center space-x-6">
          <div className="text-white border-2 border-white/20 p-2 rounded-lg">
            <TrendingUp size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide leading-tight">Statistika Presence</h2>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-12">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {/* HADIR */}
             <div className="border border-[#B71C1C] rounded-md p-6 bg-white shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center space-x-2 text-[#4CAF50] mb-2">
                   <div className="bg-[#E8F5E9] p-1 rounded-full">
                      <CheckCircle2 size={16} />
                   </div>
                   <span className="text-[13px] font-black uppercase tracking-widest">HADIR</span>
                </div>
                <div className="text-3xl font-black text-zinc-800">
                  {loading ? <Loader2 className="animate-spin text-zinc-300" /> : stats.hadir}
                </div>
             </div>

             {/* TELAT */}
             <div className="border border-[#B71C1C] rounded-md p-6 bg-white shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center space-x-2 text-[#E62020] mb-2">
                   <div className="bg-[#FFEBEE] p-1 rounded-full text-[#E62020]">
                      <AlertCircle size={16} />
                   </div>
                   <span className="text-[13px] font-black uppercase tracking-widest">TELAT</span>
                </div>
                <div className="text-3xl font-black text-zinc-800">
                  {loading ? <Loader2 className="animate-spin text-zinc-300" /> : stats.telat}
                </div>
             </div>

             {/* TIDAK HADIR */}
             <div className="border border-[#B71C1C] rounded-md p-6 bg-white shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center space-x-2 text-zinc-800 mb-2">
                   <div className="bg-zinc-100 p-1 rounded-full text-zinc-800">
                      <XCircle size={16} />
                   </div>
                   <span className="text-[13px] font-black uppercase tracking-widest">TIDAK HADIR</span>
                </div>
                <div className="text-3xl font-black text-zinc-800">
                  {loading ? <Loader2 className="animate-spin text-zinc-300" /> : stats.tidakHadir}
                </div>
             </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             
             {/* Statistik Kehadiran (Donut) */}
             <div className="border border-[#B71C1C] rounded-md p-8 bg-white shadow-sm flex flex-col items-center">
                <h3 className="w-full text-left text-brand-red font-black text-lg mb-10">Statistik Kehadiran</h3>
                
                 <div className="flex items-center space-x-12 w-full justify-center">
                    {/* Donut SVG Dynamic */}
                    <div className="relative w-48 h-48">
                       <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                          {/* Background Circle (Total - Light Grey) */}
                          <circle cx="50" cy="50" r="40" stroke="#f1f1f1" strokeWidth="12" fill="transparent" />
                          
                          {/* Circle Section 1 (Hadir - Green) */}
                          <circle 
                            cx="50" cy="50" r="40" 
                            stroke="#4CAF50" strokeWidth="12" fill="transparent" 
                            strokeDasharray="251.32" 
                            strokeDashoffset={251.32 - (251.32 * (stats.hadir / (stats.totalPegawai || 1)))} 
                          />
                          
                          {/* Circle Section 2 (Telat - Red) */}
                          <circle 
                            cx="50" cy="50" r="40" 
                            stroke="#B71C1C" strokeWidth="12" fill="transparent" 
                            strokeDasharray="251.32" 
                            strokeDashoffset={251.32 - (251.32 * (stats.telat / (stats.totalPegawai || 1)))} 
                            style={{ 
                              transform: `rotate(${(stats.hadir / (stats.totalPegawai || 1)) * 360}deg)`, 
                              transformOrigin: 'center' 
                            }} 
                          />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-lg font-black text-zinc-800 leading-none">
                            {stats.hadir + stats.telat}/{stats.totalPegawai}
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase">Total<br/>Presence</span>
                       </div>
                    </div>

                    {/* Legend */}
                    <div className="space-y-4">
                       <div className="flex items-center space-x-3">
                          <div className="w-5 h-5 rounded-full bg-[#4CAF50]"></div>
                          <div className="flex flex-col leading-tight">
                            <span className="text-sm font-bold text-zinc-600">Hadir</span>
                            <span className="text-[10px] font-black text-zinc-400">{stats.hadir} Pegawai</span>
                          </div>
                       </div>
                       <div className="flex items-center space-x-3">
                          <div className="w-5 h-5 rounded-full bg-[#E5E5E5]"></div>
                          <div className="flex flex-col leading-tight">
                            <span className="text-sm font-bold text-zinc-600">Tidak Hadir</span>
                            <span className="text-[10px] font-black text-zinc-400">{stats.tidakHadir} Pegawai</span>
                          </div>
                       </div>
                       <div className="flex items-center space-x-3">
                          <div className="w-5 h-5 rounded-full bg-[#B71C1C]"></div>
                          <div className="flex flex-col leading-tight">
                            <span className="text-sm font-bold text-zinc-600">Telat</span>
                            <span className="text-[10px] font-black text-zinc-400">{stats.telat} Pegawai</span>
                          </div>
                       </div>
                    </div>
                 </div>
             </div>

             {/* Statistik Stakat (Line Chart) */}
             <div className="border border-[#B71C1C] rounded-md p-8 bg-white shadow-sm flex flex-col">
                <h3 className="text-brand-red font-black text-lg mb-6">Statistik Stakat</h3>
                
                {/* Line Chart SVG Mockup */}
                <div className="flex-1 w-full min-h-[250px] relative mt-4">
                   <svg viewBox="0 0 400 200" className="w-full h-full">
                      {/* Grid Lines */}
                      <line x1="20" y1="180" x2="380" y2="180" stroke="#f1f1f1" strokeWidth="1" />
                      
                      {/* Red/Upper Line */}
                      <path 
                        d="M 20 100 Q 60 40 100 80 T 180 60 T 260 30 T 340 90 T 380 120" 
                        fill="transparent" 
                        stroke="#B71C1C" 
                        strokeWidth="2" 
                      />
                      {/* Green/Lower Line */}
                      <path 
                        d="M 20 150 Q 60 110 100 130 T 180 140 T 260 110 T 340 140 T 380 160" 
                        fill="transparent" 
                        stroke="#4CAF50" 
                        strokeWidth="2" 
                      />

                      {/* X-Axis Labels */}
                      <text x="60" y="195" fill="#999" fontSize="10" fontWeight="bold">Jan</text>
                      <text x="140" y="195" fill="#999" fontSize="10" fontWeight="bold">Feb</text>
                      <text x="220" y="195" fill="#999" fontSize="10" fontWeight="bold">Mar</text>
                      <text x="300" y="195" fill="#999" fontSize="10" fontWeight="bold">Apr</text>
                   </svg>
                </div>
             </div>

          </div>

        </div>
      </div>
    </div>
  )
}
