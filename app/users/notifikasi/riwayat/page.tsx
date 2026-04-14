'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'

export default function RiwayatPage() {
  const router = useRouter()
  const supabase = createClient()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRequests = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('approval_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        setRequests(data || [])
      }
      setLoading(false)
    }
    fetchRequests()
  }, [])

  return (
    <div className="bg-white min-h-screen pb-32">
      {/* Header Area */}
      <div className="bg-brand-red pt-12 pb-12 w-full relative">
        <div className="max-w-4xl mx-auto flex items-center px-4 w-full justify-center space-x-2">
           <Bell className="text-white" size={30} />
           <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Notifikasi</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
         <h2 className="text-sm font-bold text-zinc-800 mb-4 px-2">Info Riwayat Pengajuan</h2>

         {/* History List */}
         <div className="space-y-3">
            {loading ? (
               <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
               </div>
            ) : requests.length === 0 ? (
               <p className="text-center py-10 text-sm text-zinc-400">Belum ada riwayat pengajuan.</p>
            ) : (
              requests.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white border border-brand-red/40 rounded-xl p-4 flex flex-col cursor-pointer hover:bg-zinc-50 shadow-sm transition"
                >
                   <h3 className="text-sm font-bold text-zinc-900 mb-1">
                      Status Pengajuan {item.type.replace('_', ' ').toLowerCase()}...
                   </h3>
                   <span className={`text-[11px] font-bold mb-1 ${item.status === 'Disetujui' ? 'text-green-600' : item.status === 'Proses' ? 'text-orange-500' : 'text-brand-red'}`}>
                      {item.status}
                   </span>
                   <p className="text-[10px] text-zinc-400 font-medium">
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                   </p>
                </div>
              ))
            )}
         </div>
      </div>

      <BottomNav />
    </div>
  )
}
