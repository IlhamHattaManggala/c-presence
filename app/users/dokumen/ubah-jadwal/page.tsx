'use client'

import React from 'react'
import Image from 'next/image'
import { FileText } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'

export default function SuratUbahJadwalPage() {
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
      <div className="max-w-4xl mx-auto px-6 mt-6">
         {/* KAI Logo */}
         <div className="w-full mb-8">
            <Image 
               src="/images/logo_kai.png" 
               alt="KAI Commuter" 
               width={160} 
               height={60} 
               className="object-contain" 
            />
         </div>

         {/* Form Data */}
         <div className="space-y-4">
            <div>
               <label className="block text-[13px] text-zinc-900 font-medium mb-1">Tanggal</label>
               <div className="w-full border border-brand-red rounded-md px-3 py-2 text-[13px] text-zinc-700 bg-white">01/01/2026</div>
            </div>

            <div>
               <label className="block text-[13px] text-zinc-900 font-medium mb-1">Nama</label>
               <div className="w-full border border-brand-red rounded-md px-3 py-2 text-[13px] text-zinc-700 bg-white">AMI</div>
            </div>

            <div>
               <label className="block text-[13px] text-zinc-900 font-medium mb-1">ID</label>
               <div className="w-full border border-brand-red rounded-md px-3 py-2 text-[13px] text-zinc-700 bg-white">2210512023</div>
            </div>

            <div>
               <label className="block text-[13px] text-zinc-900 font-medium mb-1">Kedudukan</label>
               <div className="w-full border border-brand-red rounded-md px-3 py-2 text-[13px] text-zinc-700 bg-white">Depok Baru</div>
            </div>

            {/* Semula Section */}
            <div className="pt-2">
               <h3 className="text-brand-red font-bold text-[13px] mb-2 uppercase">Semula :</h3>
               <label className="block text-[13px] text-zinc-900 font-medium mb-1">Kode Dinas</label>
               <div className="w-full border border-brand-red rounded-md px-3 py-2 text-[13px] text-zinc-700 bg-white mb-4">L</div>

               <label className="block text-[13px] text-zinc-900 font-medium mb-1">Jam Dinas</label>
               <div className="w-full border border-brand-red rounded-md px-3 py-2 text-[13px] text-zinc-700 bg-white mb-2">00.00 - 00.00</div>
            </div>

            {/* Menjadi Section */}
            <div className="pt-2">
               <h3 className="text-brand-red font-bold text-[13px] mb-2 uppercase">Menjadi :</h3>
               <label className="block text-[13px] text-zinc-900 font-medium mb-1">Kode Dinas</label>
               <div className="w-full border border-brand-red rounded-md px-3 py-2 text-[13px] text-zinc-700 bg-white mb-4">DS3</div>

               <label className="block text-[13px] text-zinc-900 font-medium mb-1">Penjelasan</label>
               <div className="w-full border border-brand-red rounded-md px-3 py-2 min-h-[80px] text-[13px] text-zinc-700 bg-white mb-2"></div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-start mt-8 pt-4 pb-12">
               <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-zinc-800 text-center">Mengetahui<br/></span>
                  <div className="h-16"></div>
                  <span className="text-[11px] font-bold text-zinc-800">()</span>
               </div>
               <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-zinc-800 text-center">Petugas Yang<br/></span>
                  <div className="h-16"></div>
                  <span className="text-[11px] font-bold text-zinc-800">()</span>
               </div>
            </div>

         </div>
      </div>

      <BottomNav />
    </div>
  )
}
