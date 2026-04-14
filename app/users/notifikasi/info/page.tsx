'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, Train, Loader2 } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'

export default function InfoKaryawanPage() {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<'ALL' | 'PS' | 'ANN'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBroadcasts = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('broadcasts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (!error) {
        const mapped = (data || []).map(item => ({
          id: item.id,
          title: item.title,
          date: new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
          category: item.target_audience === 'ANN' ? 'ANN' : item.target_audience === 'PS' ? 'PS' : 'ALL',
          banner: item.popup_banner_url
        }))
        setBroadcasts(mapped)
      }
      setLoading(false)
    }
    fetchBroadcasts()
  }, [])

  const filteredInfo = broadcasts.filter(item => {
     // Filter by Tab
     if (activeTab !== 'ALL' && item.category !== activeTab) {
       return false
     }
     // Filter by Search
     if (searchQuery.trim() !== '') {
       return item.title.toLowerCase().includes(searchQuery.toLowerCase())
     }
     return true
  })

  return (
    <div className="bg-zinc-50 min-h-screen pb-32">
      {/* Header Area */}
      <div className="bg-brand-red pt-12 pb-12 w-full relative">
        <div className="max-w-4xl mx-auto flex items-center px-4 w-full justify-center space-x-2">
           <Bell className="text-white" size={30} />
           <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Notifikasi</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
         <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="text-sm font-bold text-zinc-800">Info Berkala</h2>
            <span className="text-xs font-bold text-brand-red opacity-0">Lihat Semua</span>
         </div>

         {/* Search Input */}
         <div className="relative mb-8">
            <div className="absolute top-1/2 -translate-y-1/2 left-4 pointer-events-none">
              <Search size={16} className="text-zinc-400" />
            </div>
            <input 
              type="text" 
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-zinc-300 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red text-sm"
            />
         </div>

         {/* Filter Tabs */}
         <div className="flex space-x-3 mb-6">
            <button 
              onClick={() => setActiveTab('ALL')}
              className={`px-6 py-1.5 rounded-full text-xs font-bold border transition ${activeTab === 'ALL' ? 'bg-brand-red text-white border-brand-red' : 'bg-white text-zinc-600 border-zinc-300'}`}
            >
              ALL
            </button>
            <button 
              onClick={() => setActiveTab('PS')}
              className={`px-6 py-1.5 rounded-full text-xs font-bold border transition ${activeTab === 'PS' ? 'bg-brand-red text-white border-brand-red' : 'bg-white text-zinc-600 border-zinc-300'}`}
            >
              PS
            </button>
            <button 
              onClick={() => setActiveTab('ANN')}
              className={`px-6 py-1.5 rounded-full text-xs font-bold border transition ${activeTab === 'ANN' ? 'bg-brand-red text-white border-brand-red' : 'bg-white text-zinc-600 border-zinc-300'}`}
            >
              ANN
            </button>
         </div>

         {/* Notifications List */}
         <div className="space-y-3">
            {loading ? (
               <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <Loader2 className="animate-spin text-brand-red" size={32} />
                  <p className="text-sm font-bold text-zinc-400">Memuat informasi...</p>
               </div>
            ) : filteredInfo.map(item => (
              <div 
                key={item.id}
                onClick={() => router.push(`/users/notifikasi/info/${item.id}`)}
                className="bg-white border border-brand-red/40 rounded-xl p-4 flex space-x-4 cursor-pointer hover:bg-red-50/30 transition-colors shadow-sm"
              >
                 <div className="shrink-0 pt-1">
                   <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2 border-brand-red/10 bg-zinc-100 shadow-sm">
                     {item.banner ? (
                       <img src={item.banner} alt="Broadcast" className="w-full h-full object-cover" />
                     ) : (
                       <div className="bg-gradient-to-br from-[#E62020] to-[#8B0000] w-full h-full flex items-center justify-center">
                         <div className="bg-white/10 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                            <Train size={20} className="text-white" strokeWidth={2.5} />
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
                 <div className="flex flex-col">
                    <p className="text-xs sm:text-sm font-bold text-zinc-800 leading-tight mb-2 line-clamp-2">
                      {item.title}
                    </p>
                    <span className="text-[9px] sm:text-[10px] text-zinc-400 font-medium">
                      {item.date}
                    </span>
                 </div>
              </div>
            ))}
            
            {filteredInfo.length === 0 && (
               <div className="text-center py-10 text-sm text-zinc-400">
                 Tidak ada informasi yang sesuai.
               </div>
            )}
         </div>
      </div>

      <BottomNav />
    </div>
  )
}
