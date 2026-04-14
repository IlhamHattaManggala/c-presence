'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FileCheck, Download, Calendar } from 'lucide-react'
import { StatusModal } from '@/components/StatusModal'

export default function DokumenPresensiPage() {
   const router = useRouter()
   const [modal, setModal] = useState<{isOpen: boolean, status: 'loading' | 'success' | 'error', message: string}>({
     isOpen: false, status: 'success', message: ''
   })

   const docCards = [
     { title: 'DOKUMEN KEHADIRAN', id: 'HADIR' },
     { title: 'DOKUMEN KETELAMBATAN', id: 'TELAT' },
     { title: 'DOKUMEN KETIDAKHADIRAN', id: 'TIDAK_HADIR' },
     { title: 'DOKUMEN KESELURUHAN', id: 'ALL' },
   ]

   const handleDownload = (card: any) => {
     setModal({ isOpen: true, status: 'loading', message: `Menyiapkan ${card.title} untuk diunduh...` })
     
     // Simulate download process
     setTimeout(() => {
       // Sample public PDF link
       window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')
       setModal({ isOpen: true, status: 'success', message: `${card.title} berhasil diunduh.` })
     }, 1500)
   }

   return (
     <div className="h-full flex flex-col bg-white">
       {/* Header */}
       <div className="h-24 bg-[#E62020] w-full flex items-center px-10 shrink-0">
         <div className="flex items-center space-x-4">
           <div className="text-white">
             <FileCheck size={40} />
           </div>
           <div>
             <h2 className="text-xl font-bold text-white tracking-wide leading-tight">Dokumen Presence Pegawai</h2>
             <p className="text-white font-bold opacity-90">PT KAI Commuter</p>
           </div>
         </div>
       </div>

       {/* Main Content */}
       <div className="flex-1 overflow-y-auto p-10">
           {/* Sub Navigation Buttons */}
           <div className="w-full max-w-6xl mx-auto flex justify-end space-x-3 mb-10">
              <button 
                onClick={() => router.push('/admin/dokumen/pendaftaran')}
                className="bg-white text-zinc-600 border border-brand-red px-8 py-2 rounded-lg text-xs font-bold transition-all hover:bg-red-50"
              >
                Pendaftaran
              </button>
              <button 
                onClick={() => router.push('/admin/dokumen/broadcast')}
                className="bg-white text-zinc-600 border border-brand-red px-8 py-2 rounded-lg text-xs font-bold transition-all hover:bg-red-50"
              >
                Broadcast
              </button>
              <button 
                onClick={() => router.push('/admin/dokumen/presensi')}
                className="bg-brand-red text-white px-8 py-2 rounded-lg text-xs font-bold shadow-md shadow-brand-red/20 transition-all hover:bg-red-700"
              >
                Dokumen Presensi
              </button>
           </div>

           <div className="max-w-6xl mx-auto flex flex-col items-center">
              <h3 className="text-xl font-bold text-center text-zinc-800 mb-12 max-w-2xl leading-relaxed">
                 Download Dokumen Presence Passanger Service dan Announcer<br/>PT KAI Commuter
              </h3>

              {/* Document Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full mb-20">
                 {docCards.map((card, idx) => (
                   <div 
                     key={idx}
                     onClick={() => handleDownload(card)}
                     className="relative aspect-[16/9] bg-[#B71C1C] rounded-[24px] overflow-hidden shadow-xl flex flex-col items-center justify-between group hover:-translate-y-1 transition-all cursor-pointer"
                   >
                      {/* Batik Image Overlay */}
                      <div className="absolute inset-x-0 inset-y-0 pointer-events-none overflow-hidden">
                         <img 
                           src="/images/Aksen Batik.png" 
                           alt="Batik" 
                           className="absolute top-0 left-0 h-full w-auto max-w-none object-contain object-left opacity-30"
                         />
                      </div>
                      
                      <div className="flex-1 w-full flex items-center justify-center p-8 relative z-10">
                         <h4 className="text-white font-extrabold text-2xl lg:text-3xl text-center leading-tight tracking-wider uppercase">
                            {card.title}
                         </h4>
                      </div>

                      <div className="w-full flex justify-end p-8 pt-0 relative z-10">
                         <button 
                           onClick={(e) => { e.stopPropagation(); handleDownload(card); }}
                           className="bg-[#FFE4C4] text-[#B71C1C] px-8 py-2 rounded-full font-black text-[12px] shadow-lg hover:bg-white transition-all uppercase tracking-tighter"
                         >
                            DOWNLOAD
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
       </div>
       <StatusModal 
         isOpen={modal.isOpen}
         status={modal.status}
         message={modal.message}
         onClose={() => setModal({ ...modal, isOpen: false })}
       />
     </div>
   )
}
