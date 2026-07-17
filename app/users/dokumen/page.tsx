'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Download } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'

export default function DokumenPage() {
  const router = useRouter()
  const supabase = createClient()
  const [sops, setSops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchSops = async () => {
      try {
        const { data, error } = await supabase
          .from('sop_documents')
          .select('*')
          .eq('category', 'SOP')
          .order('created_at', { ascending: false })

        if (error) throw error

        setSops(data || [])
      } catch (err) {
        console.error('Error fetching SOP documents:', err)
        setSops([])
      } finally {
        setLoading(false)
      }
    }
    fetchSops()
  }, [])

  return (
    <div className="bg-white min-h-screen pb-32">
      {/* Header Area */}
      <div className="bg-brand-red pt-12 pb-12 w-full relative">
        <div className="max-w-4xl mx-auto flex items-center px-4 w-full justify-center space-x-2">
           <FileText className="text-white" size={30} />
           <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Dokumen</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 mt-6">

         <div className="mb-6 px-2">
            <h2 className="text-sm font-bold text-zinc-800 mb-3">Pencarian Dokumen SOP</h2>
            <div className="flex space-x-2">
               <input 
                  type="text" 
                  placeholder="Cari nama dokumen SOP..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-red font-medium text-black shadow-sm"
               />
               <button 
                  className="bg-brand-red text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-brand-red-dark transition active:scale-95 shrink-0"
               >
                  Cari
               </button>
            </div>
         </div>

         <h2 className="text-sm font-bold text-zinc-800 mb-4 px-2">Informasi Dokumen SOP KCI</h2>

         {/* Document List */}
         <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-zinc-400 text-xs font-semibold">Memuat dokumen SOP...</div>
            ) : sops.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
              sops.filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
                <div 
                  key={item.id}
                  onClick={() => {
                    if (item.file_url && item.file_url !== '#') {
                      window.open(item.file_url, '_blank')
                    } else {
                      alert('File PDF template contoh tidak tersedia.')
                    }
                  }}
                  className="bg-white border border-brand-red/40 rounded-xl p-4 flex justify-between cursor-pointer hover:bg-zinc-50 shadow-sm transition"
                >
                   <div className="flex flex-col space-y-3">
                      <h3 className="text-[13px] font-bold text-zinc-900 leading-tight pr-4">{item.title}</h3>
                      <div className="bg-brand-red text-white flex items-center px-2 py-1 rounded w-max space-x-1">
                         <span className="text-[9px] font-medium">Dokumen</span>
                         <Download size={10} />
                      </div>
                   </div>
                   <span className="text-[10px] sm:text-xs text-zinc-500 font-medium whitespace-nowrap shrink-0">
                     {item.created_at 
                       ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                       : item.date || '-'}
                   </span>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-zinc-400 text-xs font-bold border border-zinc-200 border-dashed rounded-xl bg-zinc-50/50">
                 Belum ada dokumen SOP yang sesuai pencarian.
              </div>
            )}
         </div>
      </div>

      <BottomNav />
    </div>
  )
}
