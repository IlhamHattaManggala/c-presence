'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FileCheck, Download, Calendar, Upload, X, FileText, Loader2, Edit2, Trash2 } from 'lucide-react'
import { StatusModal } from '@/components/StatusModal'
import { ConfirmModal } from '@/components/ConfirmModal'
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

   const [documents, setDocuments] = useState<any[]>([])
   const [editingDoc, setEditingDoc] = useState<any>(null)
   const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, id: any}>({isOpen: false, id: null})

   const [exportMonth, setExportMonth] = useState<string>(() => {
     const now = new Date()
     return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
   })
   const [exportLoading, setExportLoading] = useState(false)
   const [exportAttLoading, setExportAttLoading] = useState(false)

   const handleExportExcel = async () => {
      try {
         setExportLoading(true)
         setModal({ isOpen: true, status: 'loading', message: 'Mempersiapkan data laporan Rekon SLA...' })

         // 1. Fetch users
         const { data: users, error: usersError } = await supabase
           .from('users')
           .select('*, stations(name)')
           .eq('role', 'user')
           .order('full_name')

         if (usersError) throw usersError

         // 2. Fetch attendance for that month
         const [year, month] = exportMonth.split('-').map(Number)
         const startDate = `${year}-${String(month).padStart(2, '0')}-01`
         const lastDay = new Date(year, month, 0).getDate()
         const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

         const { data: attendance, error: attError } = await supabase
           .from('attendance')
           .select('*')
           .gte('date', startDate)
           .lte('date', endDate)

         if (attError) throw attError

         // 3. Fetch approval requests
         const { data: approvals, error: appError } = await supabase
           .from('approval_requests')
           .select('*')
           .eq('status', 'Disetujui')

         if (appError) throw appError

         // 4. Generate Excel
         const { generateRekonSLA } = await import('@/lib/excel-export')
         const excelData = generateRekonSLA({
            users: users || [],
            attendance: attendance || [],
            approvalRequests: approvals || [],
            monthStr: exportMonth
         })

         // 5. Trigger download
         const blob = new Blob([excelData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
         const url = window.URL.createObjectURL(blob)
         const a = document.createElement('a')
         a.href = url
         a.download = `DATA REKON SLA PS DAN ANNOUNCER - ${exportMonth}.xlsx`
         document.body.appendChild(a)
         a.click()
         window.URL.revokeObjectURL(url)
         document.body.removeChild(a)

         setModal({ isOpen: true, status: 'success', message: 'Laporan Rekon SLA berhasil diekspor!' })
      } catch (err: any) {
         console.error(err)
         setModal({ isOpen: true, status: 'error', message: 'Gagal mengekspor laporan: ' + err.message })
      } finally {
         setExportLoading(false)
      }
   }

   const handleExportAttendanceExcel = async () => {
      try {
         setExportAttLoading(true)
         setModal({ isOpen: true, status: 'loading', message: 'Mempersiapkan data laporan Kehadiran Pegawai...' })

         // 1. Fetch users
         const { data: users, error: usersError } = await supabase
           .from('users')
           .select('*, stations(name)')
           .eq('role', 'user')
           .order('full_name')

         if (usersError) throw usersError

         // 2. Fetch attendance for that month
         const [year, month] = exportMonth.split('-').map(Number)
         const startDate = `${year}-${String(month).padStart(2, '0')}-01`
         const lastDay = new Date(year, month, 0).getDate()
         const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`

         const { data: attendance, error: attError } = await supabase
           .from('attendance')
           .select('*')
           .gte('date', startDate)
           .lte('date', endDate)

         if (attError) throw attError

         // 3. Generate Excel
         const { generateAttendanceReport } = await import('@/lib/excel-export')
         const excelData = generateAttendanceReport({
            users: users || [],
            attendance: attendance || [],
            monthStr: exportMonth
         })

         // 4. Trigger download
         const blob = new Blob([excelData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
         const url = window.URL.createObjectURL(blob)
         const a = document.createElement('a')
         a.href = url
         a.download = `LAPORAN DETAIL KEHADIRAN PETUGAS - ${exportMonth}.xlsx`
         document.body.appendChild(a)
         a.click()
         window.URL.revokeObjectURL(url)
         document.body.removeChild(a)

         setModal({ isOpen: true, status: 'success', message: 'Laporan Kehadiran Pegawai berhasil diekspor!' })
      } catch (err: any) {
         console.error(err)
         setModal({ isOpen: true, status: 'error', message: 'Gagal mengekspor laporan: ' + err.message })
      } finally {
         setExportAttLoading(false)
      }
   }

   useEffect(() => {
      fetchDocuments()
   }, [])

   const fetchDocuments = async () => {
      const { data, error } = await supabase
        .from('sop_documents')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        console.error('Error fetching documents:', error)
      } else {
        setDocuments(data || [])
      }
   }

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

   const openUploadModal = () => {
      setEditingDoc(null)
      setUploadForm({ title: '', category: 'HADIR' })
      setSelectedFile(null)
      setIsUploadModalOpen(true)
   }

   const openEditModal = (doc: any) => {
      setEditingDoc(doc)
      setUploadForm({ title: doc.title, category: doc.category })
      setSelectedFile(null)
      setIsUploadModalOpen(true)
   }

   const handleDelete = (id: any) => {
      setConfirmDelete({ isOpen: true, id })
   }

   const executeDelete = async () => {
      if (!confirmDelete.id) return
      const idToDel = confirmDelete.id
      setConfirmDelete({ isOpen: false, id: null })
      setModal({ isOpen: true, status: 'loading', message: 'Menghapus dokumen...' })

      const { error } = await supabase.from('sop_documents').delete().eq('id', idToDel)
      if (error) {
         setModal({ isOpen: true, status: 'error', message: 'Gagal menghapus: ' + error.message })
      } else {
         setModal({ isOpen: true, status: 'success', message: 'Dokumen berhasil dihapus!' })
         fetchDocuments()
      }
   }

   const handleFileUpload = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!uploadForm.title) return
      if (!editingDoc && !selectedFile) {
         setModal({ isOpen: true, status: 'error', message: 'Harap pilih file PDF terlebih dahulu.' })
         return
      }

      setUploadLoading(true)
      try {
         let fileUrl = editingDoc?.file_url || ''

         if (selectedFile) {
            // 1. Upload ke Storage
            const fileExt = selectedFile.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `${uploadForm.category}/${fileName}`

            const { error: uploadError } = await supabase.storage
              .from('sop_documents')
              .upload(filePath, selectedFile)

            if (uploadError) throw uploadError

            // 2. Dapatkan URL Public
            const { data: { publicUrl } } = supabase.storage
              .from('sop_documents')
              .getPublicUrl(filePath)
              
            fileUrl = publicUrl
         }

         // 3. Simpan/Update Database
         if (editingDoc) {
            const { error: dbError } = await supabase
              .from('sop_documents')
              .update({
                 title: uploadForm.title,
                 category: uploadForm.category,
                 file_url: fileUrl
              })
              .eq('id', editingDoc.id)
            if (dbError) throw dbError
            setModal({ isOpen: true, status: 'success', message: 'Dokumen berhasil diperbarui!' })
         } else {
            const { error: dbError } = await supabase
              .from('sop_documents')
              .insert({
                 title: uploadForm.title,
                 category: uploadForm.category,
                 file_url: fileUrl
              })
            if (dbError) throw dbError
            setModal({ isOpen: true, status: 'success', message: 'Dokumen berhasil diunggah!' })
         }

         setIsUploadModalOpen(false)
         setSelectedFile(null)
         setEditingDoc(null)
         setUploadForm({ title: '', category: 'HADIR' })
         fetchDocuments()
      } catch (error: any) {
         setModal({ isOpen: true, status: 'error', message: 'Gagal memproses dokumen: ' + error.message })
      } finally {
         setUploadLoading(false)
      }
   }

   const getCategoryLabel = (cat: string) => {
      if (cat === 'HADIR') return 'Kehadiran'
      if (cat === 'TELAT') return 'Ketelambatan'
      if (cat === 'TIDAK_HADIR') return 'Ketidakhadiran'
      return 'Keseluruhan'
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

                {/* Upload & Export Actions */}
                <div className="w-full flex flex-col xl:flex-row items-center justify-between gap-4 border-t border-zinc-100 pt-6">
                   {/* Export Monthly Excel SLA & Attendance */}
                   <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider shrink-0">Ekspor Laporan Bulanan:</span>
                      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                         <select 
                            value={exportMonth}
                            onChange={(e) => setExportMonth(e.target.value)}
                            className="bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-700 outline-none shadow-sm cursor-pointer w-full sm:w-44"
                         >
                            {/* Generate last 12 months */}
                            {Array.from({ length: 12 }).map((_, i) => {
                               const d = new Date()
                               d.setMonth(d.getMonth() - i)
                               const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                               const label = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
                               return <option key={val} value={val}>{label}</option>
                            })}
                         </select>
                         <button 
                            onClick={handleExportExcel}
                            disabled={exportLoading}
                            className="bg-[#003FE1] hover:bg-blue-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0 w-full sm:w-auto"
                         >
                            {exportLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            <span>Ekspor Excel Rekon SLA</span>
                         </button>
                         <button 
                            onClick={handleExportAttendanceExcel}
                            disabled={exportAttLoading}
                            className="bg-[#16A34A] hover:bg-green-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-lg hover:scale-105 active:scale-95 transition-all shrink-0 w-full sm:w-auto"
                         >
                            {exportAttLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            <span>Ekspor Excel Kehadiran</span>
                         </button>
                      </div>
                   </div>

                   {/* Upload Button */}
                   <button 
                     onClick={openUploadModal}
                     className="w-full xl:w-auto bg-brand-red text-white px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-brand-red/20 hover:bg-red-700 transition-all active:scale-95 xl:ml-auto"
                   >
                     <Upload size={18} />
                     <span>Unggah Dokumen</span>
                   </button>
                </div>
             </div>

            <div className="max-w-6xl mx-auto flex flex-col items-center w-full">
               {/* Manage Documents Table */}
               <div className="w-full mt-4 space-y-6">
                  <h4 className="text-lg font-bold text-zinc-800 border-b pb-3">Daftar Dokumen Terunggah</h4>
                 <div className="bg-white rounded-2xl overflow-hidden border border-zinc-200 shadow-sm">
                    <table className="w-full text-left">
                       <thead className="bg-[#B71C1C] text-white">
                          <tr>
                             <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">No</th>
                             <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">Nama Dokumen</th>
                             <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">Kategori</th>
                             <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-center">Unduh</th>
                             <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-center">Aksi</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-zinc-100 font-medium text-zinc-650 text-[13px]">
                          {documents.length === 0 ? (
                             <tr>
                                <td colSpan={5} className="py-10 text-center text-zinc-400 font-bold italic">Belum ada dokumen terunggah.</td>
                             </tr>
                          ) : (
                             documents.map((doc, idx) => (
                                <tr key={doc.id} className="hover:bg-zinc-50 transition-colors">
                                   <td className="px-6 py-4 font-bold text-zinc-400">{idx + 1}</td>
                                   <td className="px-6 py-4 font-black text-black">{doc.title}</td>
                                   <td className="px-6 py-4 text-zinc-700">{getCategoryLabel(doc.category)}</td>
                                   <td className="px-6 py-4 text-center">
                                      <a 
                                         href={doc.file_url} 
                                         target="_blank" 
                                         rel="noopener noreferrer"
                                         className="inline-flex items-center space-x-1 text-[#003FE1] hover:underline font-bold"
                                      >
                                         <Download size={14} />
                                         <span>Download</span>
                                      </a>
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                      <div className="flex justify-center items-center space-x-3">
                                         <button 
                                            onClick={() => openEditModal(doc)}
                                            className="text-orange-500 hover:text-orange-700 p-1 rounded hover:bg-orange-50 transition"
                                         >
                                            <Edit2 size={16} />
                                         </button>
                                         <button 
                                            onClick={() => handleDelete(doc.id)}
                                            className="text-red-650 hover:text-red-800 p-1 rounded hover:bg-red-50 transition"
                                         >
                                            <Trash2 size={16} />
                                         </button>
                                      </div>
                                   </td>
                                </tr>
                             ))
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
       </div>

       {/* Upload / Edit Modal */}
       {isUploadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <div 
               className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" 
               onClick={() => !uploadLoading && setIsUploadModalOpen(false)}
             ></div>
             <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-4 duration-300">
                <div className="p-8">
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-extrabold text-zinc-800">
                         {editingDoc ? 'Edit Dokumen' : 'Unggah Dokumen Baru'}
                      </h3>
                      <button 
                        onClick={() => setIsUploadModalOpen(false)}
                        className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 transition-colors"
                      >
                         <X size={20} />
                      </button>
                   </div>

                   <form onSubmit={handleFileUpload} className="space-y-5">
                      <div className="space-y-2">
                         <label className="text-sm font-bold text-zinc-700">Nama/Judul Dokumen</label>
                         <input 
                           type="text" 
                           required
                           placeholder="Contoh: Rekap Kehadiran Maret 2024"
                           value={uploadForm.title}
                           onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                           className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-black focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all font-bold"
                         />
                      </div>

                      <div className="space-y-2">
                         <label className="text-sm font-bold text-zinc-700">Kategori Dokumen</label>
                         <select 
                           value={uploadForm.category}
                           onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                           className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-black focus:outline-none appearance-none cursor-pointer font-bold bg-white"
                         >
                            <option value="HADIR">Kehadiran</option>
                            <option value="TELAT">Ketelambatan</option>
                            <option value="TIDAK_HADIR">Ketidakhadiran</option>
                            <option value="ALL">Keseluruhan</option>
                         </select>
                      </div>

                      <div className="space-y-2">
                         <label className="text-sm font-bold text-zinc-700">File Dokumen (PDF) {editingDoc && '(Opsional untuk diganti)'}</label>
                         <div 
                           onClick={() => fileInputRef.current?.click()}
                           className="w-full py-8 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center space-y-2 cursor-pointer hover:bg-zinc-50 hover:border-brand-red/30 transition-all"
                         >
                            <div className="w-12 h-12 bg-red-50 text-brand-red rounded-full flex items-center justify-center">
                               <FileText size={24} />
                            </div>
                            <p className="text-sm font-bold text-zinc-800 text-center px-4">
                               {selectedFile ? selectedFile.name : editingDoc ? 'File tersimpan (klik untuk ganti)' : 'Pilih file PDF'}
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
                           disabled={uploadLoading || (!editingDoc && !selectedFile) || !uploadForm.title}
                           className="flex-1 py-3.5 bg-brand-red text-white font-bold rounded-2xl shadow-lg shadow-brand-red/20 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                         >
                           {uploadLoading ? (
                              <>
                                <Loader2 size={18} className="animate-spin" />
                                <span>Menyimpan...</span>
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

       <ConfirmModal 
         isOpen={confirmDelete.isOpen}
         title="Hapus Dokumen"
         message="Apakah Anda yakin ingin menghapus dokumen ini? Aksi ini tidak dapat dibatalkan."
         onConfirm={executeDelete}
         onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
       />
     </div>
   )
}
