'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'

export default function InfoDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const supabase = createClient()
  const [broadcast, setBroadcast] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return
      setLoading(true)
      const { data, error } = await supabase
        .from('broadcasts')
        .select('*')
        .eq('id', id)
        .single()
      
      if (!error && data) {
        setBroadcast(data)
      }
      setLoading(false)
    }
    fetchDetail()
  }, [id])

  return (
    <div className="bg-white min-h-screen pb-32">
      {/* Header Area */}
      <div className="bg-brand-red pt-12 pb-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center">
          <button 
            onClick={() => router.back()}
            className="text-white p-1 hover:bg-white/10 rounded-full transition-colors mr-2 cursor-pointer"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-sm sm:text-base font-bold text-white">Detail Informasi Karyawan</h1>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
         {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
               <Loader2 className="animate-spin text-brand-red" size={32} />
               <p className="text-sm font-bold text-zinc-400">Memuat detail...</p>
            </div>
         ) : !broadcast ? (
            <div className="text-center py-20 text-zinc-500 font-medium">
               Informasi tidak ditemukan.
            </div>
         ) : (
           <>
              {broadcast.popup_banner_url && (
                <div className="mb-6 rounded-2xl overflow-hidden shadow-lg border border-zinc-100">
                  <img 
                    src={broadcast.popup_banner_url} 
                    alt="Banner" 
                    className="w-full h-auto object-contain max-h-[300px] bg-zinc-50" 
                  />
                </div>
              )}
              <h2 className="text-xl font-extrabold text-zinc-900 mb-1 leading-tight uppercase tracking-tight">
                {broadcast.title}
              </h2>
              <p className="text-[10px] text-zinc-400 font-bold mb-6 uppercase tracking-wider">
                {new Date(broadcast.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
              </p>
              
              <div className="prose prose-sm text-zinc-800 leading-relaxed text-[13px] sm:text-sm whitespace-pre-line antialiased">
                {broadcast.content}
              </div>
           </>
         )}
      </div>

      <BottomNav />
    </div>
  )
}
