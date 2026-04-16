'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, UserPlus, Radio, FileCheck, Download, FileSpreadsheet, FileBox, FileArchive } from 'lucide-react'
import { StatusModal } from '@/components/StatusModal'

export default function AdminDokumenLanding() {
  const router = useRouter()
  const [modal, setModal] = useState<{isOpen: boolean, status: 'loading' | 'success' | 'error', message: string}>({
    isOpen: false, status: 'success', message: ''
  })

  const cards = [
    {
      title: 'PENDAFTARAN PEGAWAI',
      icon: UserPlus,
      href: '/admin/dokumen/pendaftaran',
      buttonText: 'Pendaftaran'
    },
    {
      title: 'FORM BROADCAST ADMIN',
      icon: Radio,
      href: '/admin/dokumen/broadcast',
      buttonText: 'Broadcast'
    },
    {
      title: 'DOKUMEN PRESENSI PEGAWAI',
      icon: FileCheck,
      href: '/admin/dokumen/presensi',
      buttonText: 'Berita Acara'
    }
  ]

  const templates = [
    { title: 'Template Surat Tugas', type: 'PDF', size: '156 KB', icon: FileText, color: 'bg-red-50 text-red-600', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
    { title: 'Form Pendaftaran Baru', type: 'EXCEL', size: '2.4 MB', icon: FileSpreadsheet, color: 'bg-green-50 text-green-600', url: '#' },
    { title: 'Berita Acara Harian', type: 'DOCX', size: '480 KB', icon: FileBox, color: 'bg-blue-50 text-blue-600', url: '#' },
    { title: 'Panduan Admin System', type: 'PDF', size: '4.2 MB', icon: FileArchive, color: 'bg-orange-50 text-orange-600', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
  ]

  const handleDownload = (tpl: any) => {
    if (tpl.url === '#') {
       setModal({ isOpen: true, status: 'error', message: `File "${tpl.title}" belum tersedia di server. Harap hubungi administrator.` })
       return
    }
    setModal({ isOpen: true, status: 'loading', message: `Menyiapkan unduhan ${tpl.title}...` })
    
    setTimeout(() => {
      window.open(tpl.url, '_blank')
      setModal({ isOpen: true, status: 'success', message: `File ${tpl.title} berhasil diunduh.` })
    }, 1200)
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-auto py-6 md:h-24 md:py-0 bg-[#E62020] w-full flex items-center px-6 md:px-10 pr-16 md:pr-10 shrink-0">
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="text-white shrink-0">
            <FileText className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide leading-tight">Dokumen Presence</h2>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 md:p-10 flex flex-col items-center overflow-y-auto scrollbar-hide">
        {/* Top Navigation - Satu Baris Horizontal */}
        <div className="w-full flex justify-start md:justify-end overflow-x-auto scrollbar-hide mb-10 py-2">
           <div className="flex flex-nowrap gap-2">
              <button onClick={() => router.push('/admin/dokumen/pendaftaran')} className="shrink-0 bg-white text-zinc-600 border border-brand-red px-5 md:px-8 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all hover:bg-red-50">Pendaftaran</button>
              <button onClick={() => router.push('/admin/dokumen/broadcast')} className="shrink-0 bg-white text-zinc-600 border border-brand-red px-5 md:px-8 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all hover:bg-red-50">Broadcast</button>
              <button onClick={() => router.push('/admin/dokumen/presensi')} className="shrink-0 bg-white text-zinc-600 border border-brand-red px-5 md:px-8 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all hover:bg-red-50">Dokumen Presensi</button>
           </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          {cards.map((card, idx) => (
            <div 
              key={idx}
              onClick={() => router.push(card.href)}
              className="group relative bg-[#8B0000] rounded-[32px] overflow-hidden aspect-[3/4] shadow-2xl transition hover:-translate-y-2 cursor-pointer border border-white/10"
            >
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 2px, transparent 2px)', backgroundSize: '20px 20px' }}></div>
              <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
                 <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mb-6 border border-white/20">
                    <card.icon size={44} className="text-white" />
                 </div>
                 <h3 className="text-white font-extrabold text-xl lg:text-2xl leading-tight mb-8">
                    {card.title}
                 </h3>
                 <button className="bg-white text-[#8B0000] px-10 py-2.5 rounded-full font-extrabold text-sm shadow-xl active:scale-95 transition">
                    {card.buttonText}
                 </button>
              </div>
            </div>
          ))}
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
