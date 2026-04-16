 'use client'
 
 import React, { useState, useRef, useEffect } from 'react'
 import Image from 'next/image'
 import { useRouter } from 'next/navigation'
 import { FileCheck, Download, Calendar, Upload, X, FileText, Loader2 } from 'lucide-react'
 import { StatusModal } from '@/components/StatusModal'
 import { createClient } from '@/lib/supabase/client'
 
 export default function DokumenPresensiPage() {
    const router = useRouter()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const [modal, setModal] = useState<{isOpen: boolean, status: 'loading' | 'success' | 'error', message: string}>({
      isOpen: false, status: 'success', message: ''
    })
 
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [uploadLoading, setUploadLoading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploadForm, setUploadForm] = useState({
       title: '',
       category: 'HADIR'
    })

    const docCards = [
      { title: 'DOKUMEN KEHADIRAN', id: 'HADIR' },
      { title: 'DOKUMEN KETELAMBATAN', id: 'TELAT' },
      { title: 'DOKUMEN KETIDAKHADIRAN', id: 'TIDAK_HADIR' },
      { title: 'DOKUMEN KESELURUHAN', id: 'ALL' },
    ]
 
    const handleDownload = async (card: any) => {
      setModal({ isOpen: true, status: 'loading', message: `Mencari dokumen ${card.title} terbaru...` })
      
      // Ambil dokumen terbaru dari database berdasarkan kategori
      const { data, error } = await supabase
        .from('sop_documents')
        .select('file_url')
        .eq('category', card.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error || !data || data.length === 0) {
        setModal({ 
          isOpen: true, 
          status: 'error', 
          message: `Gagal mengunduh: Belum ada dokumen yang diunggah untuk kategori ini.` 
        })
        return
      }

      window.open(data[0].file_url, '_blank')
      setModal({ isOpen: true, status: 'success', message: `${card.title} berhasil dibuka.` })
    }

    const handleFileUpload = async (e: React.FormEvent) => {
       e.preventDefault()
       if (!selectedFile || !uploadForm.title) return

       setUploadLoading(true)
       try {
          // 1. Upload ke Storage
          const fileExt = selectedFile.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          const filePath = `${uploadForm.category}/${fileName}`

          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('sop_documents')
            .upload(filePath, selectedFile)

          if (uploadError) throw uploadError

          // 2. Dapatkan URL Public
          const { data: { publicUrl } } = supabase.storage
            .from('sop_documents')
            .getPublicUrl(filePath)

          // 3. Simpan Metadata ke Database
          const { error: dbError } = await supabase
            .from('sop_documents')
            .insert({
               title: uploadForm.title,
               category: uploadForm.category,
               file_url: publicUrl
            })

          if (dbError) throw dbError

          setModal({ isOpen: true, status: 'success', message: 'Dokumen berhasil diunggah!' })
          setIsUploadModalOpen(false)
          setSelectedFile(null)
          setUploadForm({ title: '', category: 'HADIR' })
       } catch (error: any) {
          setModal({ isOpen: true, status: 'error', message: 'Gagal mengunggah: ' + error.message })
       } finally {
          setUploadLoading(false)
       }
    }
 
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="h-auto py-6 md:h-24 md:py-0 bg-[#E62020] w-full flex items-center px-6 md:px-10 pr-16 md:pr-10 shrink-0">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="text-white shrink-0">
              <FileCheck className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white tracking-wide leading-tight">Dokumen Presence Pegawai</h2>
              <p className="text-white text-xs md:text-sm font-bold opacity-90">PT KAI Commuter</p>
            </div>
          </div>
        </div>
 
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
            {/* Sub Navigation Buttons & Actions */}
            <div className="w-full max-w-6xl mx-auto flex flex-col items-center md:items-end justify-between mb-8 md:mb-10 space-y-6">
               
               {/* Horizontal Navigation */}
               <div className="w-full flex justify-start md:justify-end overflow-x-auto scrollbar-hide py-2">
                  <div className="flex flex-nowrap gap-2">
                     <button onClick={() => router.push('/admin/dokumen/pendaftaran')} className="shrink-0 bg-white text-zinc-600 border border-brand-red px-5 md:px-8 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all hover:bg-red-50">Pendaftaran</button>
                     <button onClick={() => router.push('/admin/dokumen/broadcast')} className="shrink-0 bg-white text-zinc-600 border border-brand-red px-5 md:px-8 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all hover:bg-red-50">Broadcast</button>
                     <button onClick={() => router.push('/admin/dokumen/presensi')} className="shrink-0 bg-brand-red text-white px-5 md:px-8 py-2 rounded-lg text-[10px] md:text-xs font-bold shadow-md shadow-brand-red/20 transition-all hover:bg-red-700">Dokumen Presensi</button>
                  </div>
               </div>

               {/* Upload Button */}
               <button 
                 onClick={() => setIsUploadModalOpen(true)}
                 className="w-full md:w-auto bg-brand-red text-white px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-brand-red/20 hover:bg-red-700 transition-all active:scale-95"
               >
                 <Upload size={18} />
                 <span>Unggah Dokumen</span>
               </button>

            </div>
 
            <div className="max-w-6xl mx-auto flex flex-col items-center">
               <h3 className="text-base md:text-xl font-bold text-center text-zinc-800 mb-8 md:mb-12 max-w-2xl leading-relaxed">
                  Download Dokumen Presence Passanger Service dan Announcer<br className="hidden md:block"/> PT KAI Commuter
               </h3>
 
               {/* Document Cards Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 w-full mb-10 md:mb-20">
                  {docCards.map((card, idx) => (
                    <div 
                      key={idx}
                      onClick={() => handleDownload(card)}
                      className="relative aspect-[16/9] bg-[#B71C1C] rounded-[24px] overflow-hidden shadow-xl flex flex-col items-center justify-between group hover:-translate-y-2 transition-all cursor-pointer border-4 border-white/10"
                    >
                       {/* Batik Image Overlay */}
                       <div className="absolute inset-x-0 inset-y-0 pointer-events-none overflow-hidden">
                          <img 
                            src="/images/Aksen Batik.png" 
                            alt="Batik" 
                            className="absolute top-0 left-0 h-full w-auto max-w-none object-contain object-left opacity-30"
                          />
                       </div>
                       
                       <div className="flex-1 w-full flex items-center justify-center p-6 md:p-8 relative z-10">
                          <h4 className="text-white font-extrabold text-lg md:text-2xl lg:text-3xl text-center leading-tight tracking-wider uppercase drop-shadow-lg">
                             {card.title}
                          </h4>
                       </div>
 
                       <div className="w-full flex justify-end p-6 md:p-8 pt-0 relative z-10">
                          <button 
                            className="bg-[#FFE4C4] text-[#B71C1C] px-6 md:px-8 py-2 md:py-2.5 rounded-full font-black text-[11px] md:text-[13px] shadow-lg group-hover:bg-white group-hover:scale-105 transition-all uppercase tracking-tighter"
                          >
                             DOWNLOAD
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
        </div>
 
        {/* Upload Modal */}
        {isUploadModalOpen && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" 
                onClick={() => !uploadLoading && setIsUploadModalOpen(false)}
              ></div>
              <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
                 <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="text-xl font-extrabold text-zinc-800">Unggah Dokumen Baru</h3>
                       <button 
                         onClick={() => setIsUploadModalOpen(false)}
                         className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition-colors"
                       >
                          <X size={20} />
                       </button>
                    </div>

                    <form onSubmit={handleFileUpload} className="space-y-5">
                       <div className="space-y-2">
                          <label className="text-sm font-bold text-zinc-700">Judul Dokumen</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Contoh: Rekap Kehadiran Maret 2024"
                            value={uploadForm.title}
                            onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                            className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                          />
                       </div>

                       <div className="space-y-2">
                          <label className="text-sm font-bold text-zinc-700">Kategori Dokumen</label>
                          <select 
                            value={uploadForm.category}
                            onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                            className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-zinc-800 focus:outline-none appearance-none cursor-pointer"
                          >
                             <option value="HADIR">Kehadiran</option>
                             <option value="TELAT">Ketelambatan</option>
                             <option value="TIDAK_HADIR">Ketidakhadiran</option>
                             <option value="ALL">Keseluruhan</option>
                          </select>
                       </div>

                       <div className="space-y-2">
                          <label className="text-sm font-bold text-zinc-700">File Dokumen (PDF)</label>
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full py-8 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center space-y-2 cursor-pointer hover:bg-zinc-50 hover:border-brand-red/30 transition-all"
                          >
                             <div className="w-12 h-12 bg-red-50 text-brand-red rounded-full flex items-center justify-center">
                                <FileText size={24} />
                             </div>
                             <p className="text-sm font-bold text-zinc-800">
                                {selectedFile ? selectedFile.name : 'Pilih file PDF'}
                             </p>
                             <p className="text-xs text-zinc-400">Klik untuk menjelajah file</p>
                          </div>
                          <input 
                            type="file"
                            hidden
                            ref={fileInputRef}
                            accept=".pdf,application/pdf"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          />
                       </div>

                       <div className="pt-4 flex space-x-3">
                          <button 
                            type="button"
                            onClick={() => setIsUploadModalOpen(false)}
                            disabled={uploadLoading}
                            className="flex-1 py-3.5 bg-zinc-100 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-50"
                          >
                            Batal
                          </button>
                          <button 
                            type="submit"
                            disabled={uploadLoading || !selectedFile || !uploadForm.title}
                            className="flex-1 py-3.5 bg-brand-red text-white font-bold rounded-2xl shadow-lg shadow-brand-red/20 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                          >
                            {uploadLoading ? (
                               <>
                                 <Loader2 size={18} className="animate-spin" />
                                 <span>Mengunggah...</span>
                               </>
                            ) : (
                               <span>Simpan Dokumen</span>
                            )}
                          </button>
                       </div>
                    </form>
                 </div>
              </div>
           </div>
        )}

        <StatusModal 
          isOpen={modal.isOpen}
          status={modal.status}
          message={modal.message}
          onClose={() => setModal({ ...modal, isOpen: false })}
        />
      </div>
    )
 }
