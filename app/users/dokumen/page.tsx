'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Download } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'

const DUMMY_SOP = [
  { id: 1, title: 'SOP.KCL.1318 - Kartu Disabilitas', date: '25 Des 2025' },
  { id: 2, title: 'SOP.KCL.0588 - Pin Ibu Hamil', date: '28 Des 2025' },
  { id: 3, title: 'SOP.KCL.144 - SOP Lost and Found (Revisi)', date: '02 Jan 2026' },
  { id: 4, title: 'SOP Informasi Stasiun Announcer Terbaru', date: '10 Jan 2026' },
  { id: 5, title: 'SOP.KCL.086 - Passenger Service', date: '15 Jan 2026' },
]

export default function DokumenPage() {
  const router = useRouter()

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
         {/* Submenu for Demo purpoeses: links to generated dynamic document views */}
         <div className="mb-8">
            <h2 className="text-sm font-bold text-zinc-800 mb-4 px-2">Dokumen Surat Personal</h2>
            <div className="grid grid-cols-3 gap-2 px-2">
               <button onClick={() => router.push('/users/dokumen/dinas-luar')} className="bg-red-50 text-brand-red text-[10px] font-bold py-2 rounded-lg border border-red-200">Surat Dinas L</button>
               <button onClick={() => router.push('/users/dokumen/ubah-jadwal')} className="bg-red-50 text-brand-red text-[10px] font-bold py-2 rounded-lg border border-red-200">Surat Tukar J.</button>
               <button onClick={() => router.push('/users/dokumen/izin')} className="bg-red-50 text-brand-red text-[10px] font-bold py-2 rounded-lg border border-red-200">Surat Izin</button>
            </div>
         </div>

         <h2 className="text-sm font-bold text-zinc-800 mb-4 px-2">Informasi Dokumen SOP KCI</h2>

         {/* Document List */}
         <div className="space-y-3">
            {DUMMY_SOP.map((item) => (
              <div 
                key={item.id}
                className="bg-white border border-brand-red/40 rounded-xl p-4 flex justify-between cursor-pointer hover:bg-zinc-50 shadow-sm transition"
              >
                 <div className="flex flex-col space-y-3">
                    <h3 className="text-[13px] font-bold text-zinc-900 leading-tight pr-4">{item.title}</h3>
                    <div className="bg-brand-red text-white flex items-center px-2 py-1 rounded w-max space-x-1">
                       <span className="text-[9px] font-medium">Dokumen</span>
                       <Download size={10} />
                    </div>
                 </div>
                 <span className="text-[10px] sm:text-xs text-zinc-500 font-medium whitespace-nowrap shrink-0">{item.date}</span>
              </div>
            ))}
         </div>
      </div>

      <BottomNav />
    </div>
  )
}
