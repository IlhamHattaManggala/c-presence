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
      <div className="h-24 bg-[#E62020] w-full flex items-center px-10 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="text-white">
            <FileText size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Dokumen Presence</h2>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-10 flex flex-col items-center overflow-y-auto">
        {/* Top Navigation */}
        <div className="w-full max-w-6xl flex justify-end space-x-3 mb-10">
          <button onClick={() => router.push('/admin/dokumen/pendaftaran')} className="bg-white text-zinc-600 border border-brand-red px-8 py-2 rounded-lg text-xs font-bold transition-all hover:bg-red-50">Pendaftaran</button>
          <button onClick={() => router.push('/admin/dokumen/broadcast')} className="bg-white text-zinc-600 border border-brand-red px-8 py-2 rounded-lg text-xs font-bold transition-all hover:bg-red-50">Broadcast</button>
          <button onClick={() => router.push('/admin/dokumen/presensi')} className="bg-white text-zinc-600 border border-brand-red px-8 py-2 rounded-lg text-xs font-bold transition-all hover:bg-red-50">Dokumen Presensi</button>
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

        {/* Templates Section */}
        <div className="w-full max-w-6xl mt-20 mb-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="flex items-center justify-between mb-8">
            <div>
               <h3 className="text-2xl font-black text-zinc-800 tracking-tight">Template Dokumen</h3>
               <p className="text-zinc-500 font-medium italic">Unduh file master untuk kelengkapan administrasi</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map((tpl, idx) => (
              <div key={idx} className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${tpl.color}`}>
                   <tpl.icon size={28} />
                </div>
                <h4 className="font-bold text-zinc-800 text-lg leading-tight mb-2">{tpl.title}</h4>
                <div className="flex items-center space-x-3 text-xs font-bold text-zinc-400 mb-6 uppercase tracking-widest">
                   <span>{tpl.type}</span>
                   <span>•</span>
                   <span>{tpl.size}</span>
                </div>
                <button 
                   onClick={(e) => { e.stopPropagation(); handleDownload(tpl); }}
                   className="w-full py-3 bg-zinc-50 group-hover:bg-[#E62020] group-hover:text-white rounded-xl flex items-center justify-center space-x-2 transition-all font-bold text-sm text-zinc-600"
                >
                   <Download size={16} />
                   <span>Download</span>
                </button>
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
