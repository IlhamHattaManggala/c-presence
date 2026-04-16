'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Radio, Search, Edit3, Eye, X, FileType, Send, Copy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatusModal } from '@/components/StatusModal'
import { ConfirmModal } from '@/components/ConfirmModal'

export default function BroadcastAdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<any>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTabModal, setActiveTabModal] = useState<'INFO' | 'KONTEN'>('INFO')
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formStartAt, setFormStartAt] = useState('')
  const [formEndAt, setFormEndAt] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formPopupActive, setFormPopupActive] = useState(false)
  const [bannerUrl, setBannerUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const bannerInputRef = React.useRef<HTMLInputElement>(null)
  const [modal, setModal] = useState<{isOpen: boolean, status: 'loading' | 'success' | 'error', message: string}>({
    isOpen: false, status: 'success', message: ''
  })
  const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null})

  useEffect(() => { fetchBroadcasts() }, [])

  const fetchBroadcasts = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('broadcasts').select('*').order('created_at', { ascending: false })
    if (error) console.error('Error fetching broadcasts:', error.message)
    else setBroadcasts(data || [])
    setLoading(false)
  }

  const openAddModal = () => {
    setEditingId(null)
    setFormTitle('')
    setFormDescription('')
    setFormStartAt('')
    setFormEndAt('')
    setFormIsActive(true)
    setFormPopupActive(false)
    setBannerUrl('')
    setActiveTabModal('INFO')
    setIsEditModalOpen(true)
  }

  const openEditModal = (broadcast: any) => {
    setEditingId(broadcast.id)
    setFormTitle(broadcast.title || '')
    setFormDescription(broadcast.content || '')
    
    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return ''
        const d = new Date(dateStr)
        if (isNaN(d.getTime())) return ''
        const offset = d.getTimezoneOffset()
        const localDate = new Date(d.getTime() - (offset * 60 * 1000))
        return localDate.toISOString().slice(0, 16)
    }

    setFormStartAt(formatDateTime(broadcast.start_at))
    setFormEndAt(formatDateTime(broadcast.end_at))
    setFormIsActive(broadcast.is_active ?? true)
    setFormPopupActive(broadcast.show_popup ?? false)
    setBannerUrl(broadcast.popup_banner_url || '')
    setActiveTabModal('INFO')
    setIsEditModalOpen(true)
  }

  const openDetailModal = (broadcast: any) => {
    setSelectedDetail(broadcast)
    setIsDetailModalOpen(true)
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `broadcast-banner-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('Settings').upload(fileName, file)
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('Settings').getPublicUrl(fileName)
      setBannerUrl(publicUrl)
    } catch (err: any) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal upload: ' + err.message })
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    if (!formTitle.trim()) {
      setModal({ isOpen: true, status: 'error', message: 'Judul tidak boleh kosong!' })
      return
    }
    setModal({ isOpen: true, status: 'loading', message: 'Menyimpan broadcast...' })
    setIsSaving(true)
    let startAtISO = null
    let endAtISO = null
    if (formStartAt) startAtISO = new Date(formStartAt).toISOString()
    if (formEndAt) endAtISO = new Date(formEndAt).toISOString()

    const payload = {
      title: formTitle,
      content: formDescription,
      start_at: startAtISO,
      end_at: endAtISO,
      is_active: formIsActive,
      show_popup: formPopupActive,
      popup_banner_url: bannerUrl || null
    }

    let error;
    if (editingId) {
      const { error: err } = await supabase.from('broadcasts').update(payload).eq('id', editingId)
      error = err
    } else {
      const { error: err } = await supabase.from('broadcasts').insert([payload])
      error = err
    }

    if (error) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal menyimpan: ' + error.message })
    } else {
      setModal({ isOpen: true, status: 'success', message: 'Broadcast berhasil disimpan!' })
      setIsEditModalOpen(false)
      fetchBroadcasts()
    }
    setIsSaving(false)
  }

  const handleDelete = (id: string) => {
    setConfirmDelete({ isOpen: true, id })
  }

  const executeDelete = async () => {
    if (!confirmDelete.id) return
    const idToDel = confirmDelete.id
    setConfirmDelete({ isOpen: false, id: null })
    
    setModal({ isOpen: true, status: 'loading', message: 'Menghapus broadcast...' })
    const { error } = await supabase.from('broadcasts').delete().eq('id', idToDel)
    if (error) {
       setModal({ isOpen: true, status: 'error', message: 'Gagal menghapus: ' + error.message })
    } else {
       setModal({ isOpen: true, status: 'success', message: 'Broadcast berhasil dihapus!' })
       fetchBroadcasts()
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-auto py-6 md:h-24 md:py-0 bg-[#E62020] w-full flex items-center px-6 md:px-10 pr-16 md:pr-10 shrink-0">
        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="text-white shrink-0"><Radio className="w-8 h-8 md:w-10 md:h-10" /></div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-wide leading-tight">Dokumen Presence Broadcast Pegawai</h2>
            <p className="text-white text-xs md:text-sm font-bold opacity-90">PT KAI Commuter</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Sub Navigation Buttons - Satu Baris Horizontal */}
          <div className="w-full flex justify-start md:justify-end overflow-x-auto scrollbar-hide mb-6 py-2">
             <div className="flex flex-nowrap gap-2">
                <button onClick={() => router.push('/admin/dokumen/pendaftaran')} className="shrink-0 bg-white text-zinc-600 border border-brand-red px-5 md:px-8 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all hover:bg-red-50">Pendaftaran</button>
                <button onClick={() => router.push('/admin/dokumen/broadcast')} className="shrink-0 bg-brand-red text-white px-5 md:px-8 py-2 rounded-lg text-[10px] md:text-xs font-bold shadow-md shadow-brand-red/20 transition-all hover:bg-red-700">Broadcast</button>
                <button onClick={() => router.push('/admin/dokumen/presensi')} className="shrink-0 bg-white text-zinc-600 border border-brand-red px-5 md:px-8 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all hover:bg-red-50">Dokumen Presensi</button>
             </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="grid grid-cols-12 gap-6 items-end mb-8">
            <div className="col-span-12 lg:col-span-4">
              <label className="block text-sm font-bold text-zinc-700 mb-3">Pencarian</label>
              <div className="flex space-x-2">
                <div className="bg-[#B71C1C] text-white p-2.5 rounded-lg flex items-center justify-center"><Search size={18} /></div>
                <input type="text" placeholder="Judul Informasi" className="flex-1 border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-red font-medium text-zinc-500" />
              </div>
            </div>
            <div className="col-span-12 lg:col-span-4">
              <label className="block text-sm font-bold text-zinc-700 mb-3">Status</label>
              <div className="flex space-x-2">
                <div className="bg-[#B71C1C] text-white p-2.5 rounded-lg flex items-center justify-center"><Search size={18} /></div>
                <select className="flex-1 border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-red font-medium text-zinc-400 bg-white">
                  <option>Semua</option>
                  <option>Aktif</option>
                  <option>Tidak Aktif</option>
                </select>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-2">
              <button className="bg-brand-red text-white w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center space-x-2 shadow-lg">
                <Search size={16} /><span>Cari</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0 text-center md:text-left">
            <h3 className="text-lg md:text-xl font-bold text-zinc-800">Informasi Pegawai</h3>
            <button onClick={openAddModal} className="bg-brand-red text-white px-6 md:px-8 py-2.5 rounded-xl font-bold text-xs md:text-sm shadow-xl hover:bg-red-700 transition">
              Tambah Informasi Pegawai
            </button>
          </div>

          {/* Table / Card List */}
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-[32px] overflow-hidden shadow-sm border border-zinc-100">
               <table className="w-full text-left border-collapse">
                 <thead className="text-zinc-500 border-b">
                   <tr>
                     <th className="px-6 py-6 text-sm font-bold w-16">No</th>
                     <th className="px-6 py-6 text-sm font-bold">Judul dan Keterangan Informasi</th>
                     <th className="px-6 py-6 text-sm font-bold">Status</th>
                     <th className="px-6 py-6 text-sm font-bold">Aksi</th>
                     <th className="px-6 py-6 text-sm font-bold"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-50 text-sm">
                   {loading ? (
                     <tr><td colSpan={5} className="py-20 text-center">
                       <div className="flex flex-col items-center justify-center space-y-4">
                         <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
                         <p className="text-zinc-500 font-medium">Memuat data broadcast...</p>
                       </div>
                     </td></tr>
                   ) : broadcasts.length === 0 ? (
                     <tr><td colSpan={5} className="py-20 text-center text-zinc-500 font-medium italic">Belum ada data broadcast.</td></tr>
                   ) : (
                     broadcasts.map((item, idx) => (
                       <tr key={item.id} className="hover:bg-zinc-50/50 transition group">
                         <td className="px-6 py-6 font-medium text-zinc-400">{idx + 1}</td>
                         <td className="px-6 py-6 text-zinc-700 font-bold tracking-tight">{item.title}</td>
                         <td className="px-6 py-6">
                           <span className={`px-4 py-1.5 rounded-lg text-[10px] font-bold ${item.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-400'}`}>
                             {item.is_active ? 'Aktif' : 'Tidak Aktif'}
                           </span>
                         </td>
                         <td className="px-6 py-6">
                           <div className="flex items-center space-x-6">
                             <button onClick={() => openDetailModal(item)} className="text-green-600 hover:scale-110 transition"><Eye size={20}/></button>
                             <button onClick={() => openEditModal(item)} className="text-orange-400 hover:scale-110 transition"><Edit3 size={20}/></button>
                             <button onClick={() => handleDelete(item.id)} className="text-[#8B0000] hover:scale-110 transition"><X size={18} /></button>
                           </div>
                         </td>
                         <td className="px-6 py-6 text-right">
                           <button className="text-zinc-300 hover:text-zinc-500 transition-colors"><Copy size={22} strokeWidth={1.5} /></button>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
               {loading ? (
                 <div className="py-12 flex flex-col items-center justify-center space-y-4">
                   <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Memuat...</p>
                 </div>
               ) : broadcasts.length === 0 ? (
                 <div className="py-12 text-center text-zinc-400 font-bold text-xs uppercase tracking-wider">Belum ada broadcast.</div>
               ) : (
                 broadcasts.map((item, idx) => (
                    <div key={item.id} className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-all">
                       <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 pr-4">
                             <span className="text-[10px] font-bold text-zinc-400 mb-1 block uppercase tracking-tighter">Informasi #{idx + 1}</span>
                             <h4 className="font-bold text-zinc-800 text-sm leading-tight line-clamp-2">{item.title}</h4>
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${item.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-400'}`}>
                             {item.is_active ? 'Aktif' : 'Off'}
                          </span>
                       </div>
                       <div className="flex justify-between items-center pt-4 border-t border-zinc-50">
                           <div className="flex items-center space-x-4">
                              <button onClick={() => openDetailModal(item)} className="text-green-600"><Eye size={18}/></button>
                              <button onClick={() => openEditModal(item)} className="text-orange-400"><Edit3 size={18}/></button>
                              <button onClick={() => handleDelete(item.id)} className="text-red-600"><X size={16} /></button>
                           </div>
                          <button className="text-zinc-300"><Copy size={18}/></button>
                       </div>
                    </div>
                 ))
               )}
            </div>
          </div>
        </div>
      </div>

      {/* Pengumuman Pegawai Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-3xl rounded-[10px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="p-3 border-b flex justify-between items-center bg-white relative z-10">
              <h3 className="flex-1 text-center text-lg font-bold text-zinc-700 tracking-tight">Pengumuman Pegawai</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-600 hover:text-black absolute right-4">
                <X size={18} className="border-2 border-zinc-400 rounded-md p-0.5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-zinc-100">
              <button
                onClick={() => setActiveTabModal('INFO')}
                className={`flex items-center space-x-2 px-6 py-2.5 text-[13px] font-bold border-b-2 transition-all ${activeTabModal === 'INFO' ? 'text-zinc-800 border-zinc-800' : 'text-zinc-400 border-transparent'}`}
              >
                <Radio size={16} /><span>INFO</span>
              </button>
              <button
                onClick={() => setActiveTabModal('KONTEN')}
                className={`flex items-center space-x-2 px-6 py-2.5 text-[13px] font-bold border-b-2 transition-all ${activeTabModal === 'KONTEN' ? 'text-zinc-800 border-zinc-800' : 'text-zinc-400 border-transparent'}`}
              >
                <FileType size={16} /><span>KONTEN</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
              {activeTabModal === 'INFO' ? (
                <div className="flex space-x-10">
                  {/* Left: Date & Status */}
                  <div className="flex-1 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-extrabold text-zinc-800">Mulai Info</label>
                      <input
                        type="datetime-local"
                        value={formStartAt}
                        onChange={e => setFormStartAt(e.target.value)}
                        className="w-full border border-red-100 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-red-300 text-zinc-700"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-extrabold text-zinc-800">Selesai Info</label>
                      <input
                        type="datetime-local"
                        value={formEndAt}
                        onChange={e => setFormEndAt(e.target.value)}
                        className="w-full border border-red-100 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-red-300 text-zinc-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-extrabold text-zinc-800 block">Status</label>
                      <div
                        onClick={() => setFormIsActive(!formIsActive)}
                        className={`flex items-center w-12 h-6 rounded-full px-1 relative cursor-pointer transition-colors ${formIsActive ? 'bg-[#003FE1]' : 'bg-zinc-300'}`}
                      >
                        <span className="text-white text-[8px] font-bold ml-1">{formIsActive ? 'Aktif' : 'Off'}</span>
                        <div className={`absolute w-5 h-5 bg-white rounded-full transition-all ${formIsActive ? 'right-0.5' : 'left-0.5'}`}></div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Banner */}
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-extrabold text-zinc-800">Popup Banner</label>
                      <div
                        onClick={() => setFormPopupActive(!formPopupActive)}
                        className={`flex items-center w-12 h-6 rounded-full px-1 relative cursor-pointer transition-colors ${formPopupActive ? 'bg-[#003FE1]' : 'bg-zinc-300'}`}
                      >
                        <span className="text-white text-[8px] font-bold ml-1">{formPopupActive ? 'Aktif' : 'Off'}</span>
                        <div className={`absolute w-5 h-5 bg-white rounded-full transition-all ${formPopupActive ? 'right-0.5' : 'left-0.5'}`}></div>
                      </div>
                    </div>
                    <div className="w-full h-40 border border-zinc-100 rounded-md bg-zinc-50 flex items-center justify-center p-3">
                      <div className="bg-white p-2 border border-zinc-50 shadow-sm rounded-md flex flex-col items-center w-full h-full">
                        <h5 className="text-[9px] font-bold text-zinc-500 mb-1">Preview Banner</h5>
                        {bannerUrl ? (
                          <img src={bannerUrl} alt="Banner" className="w-full h-24 object-contain rounded" />
                        ) : (
                          <div className="w-16 h-20 bg-red-600 rounded flex items-center justify-center text-[8px] text-white font-bold p-1 text-center leading-none shadow-lg">
                            {formTitle || 'KAI Banner'}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-zinc-400 italic">Tambah gambar Pop Up dengan ukuran (optional)</p>
                      <input
                        type="file"
                        ref={bannerInputRef}
                        onChange={handleBannerUpload}
                        className="hidden"
                        accept="image/*"
                      />
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full bg-[#91C7B1] text-zinc-800 py-2 rounded-md font-bold text-xs hover:bg-[#7FB69F] transition disabled:opacity-60"
                      >
                        {isUploading ? 'Mengupload...' : 'Upload File atau Browser'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center space-x-2 text-zinc-700">
                    <Radio size={14} /><span className="text-xs font-bold">Indonesia</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-extrabold text-zinc-800">Judul</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="Masukkan judul broadcast..."
                      className="w-full border border-zinc-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 text-zinc-700"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-extrabold text-zinc-800">Deskripsi</label>
                    <div className="border border-zinc-200 rounded-md overflow-hidden">
                      <div className="bg-[#F8F9FA] border-b border-zinc-100 p-1.5 flex items-center space-x-5 text-zinc-400">
                        <select className="bg-transparent text-[11px] font-bold text-zinc-400 outline-none"><option>Normal</option></select>
                        <div className="flex items-center space-x-3 border-l pl-3">
                          <button type="button" className="text-xs font-bold hover:text-zinc-600">B</button>
                          <button type="button" className="text-xs italic hover:text-zinc-600">I</button>
                          <button type="button" className="text-xs underline hover:text-zinc-600">U</button>
                        </div>
                      </div>
                      <textarea
                        className="w-full p-3 min-h-[140px] focus:outline-none text-[12px] leading-relaxed text-zinc-700 font-medium"
                        value={formDescription}
                        onChange={e => setFormDescription(e.target.value)}
                        placeholder="Isi konten broadcast di sini..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 pb-8 flex justify-center">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[#B71C1C] text-white w-40 py-2 rounded-lg font-bold text-sm flex items-center justify-center space-x-2 shadow-lg hover:bg-red-800 transition disabled:opacity-60"
              >
                <Send size={16} className="fill-white" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Detail Modal */}
      {isDetailModalOpen && selectedDetail && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsDetailModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="p-5 border-b bg-zinc-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-zinc-800">Detail Broadcast</h3>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                   <X size={20} className="border-2 border-transparent hover:border-zinc-300 rounded p-0.5" />
                </button>
             </div>
             <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                <div>
                   <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Judul</h4>
                   <p className="text-lg font-bold text-zinc-900">{selectedDetail.title}</p>
                </div>
                {selectedDetail.start_at && selectedDetail.end_at && (
                    <div className="flex space-x-6">
                       <div>
                          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Mulai</h4>
                          <p className="text-sm font-medium text-zinc-800">{new Date(selectedDetail.start_at).toLocaleString('id-ID')}</p>
                       </div>
                       <div>
                          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Selesai</h4>
                          <p className="text-sm font-medium text-zinc-800">{new Date(selectedDetail.end_at).toLocaleString('id-ID')}</p>
                       </div>
                    </div>
                )}
                <div>
                   <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Status</h4>
                   <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedDetail.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {selectedDetail.is_active ? 'Aktif' : 'Tidak Aktif'}
                   </span>
                </div>
                {selectedDetail.popup_banner_url && (
                   <div>
                      <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Banner (Popup)</h4>
                      <img src={selectedDetail.popup_banner_url} alt="Banner" className="w-full max-h-48 object-contain rounded border border-zinc-200" />
                   </div>
                )}
                <div>
                   <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Konten / Deskripsi</h4>
                   <div className="p-4 bg-zinc-50 rounded-lg text-sm text-zinc-700 font-medium whitespace-pre-wrap">
                      {selectedDetail.content || '-'}
                   </div>
                </div>
             </div>
             <div className="p-4 border-t flex justify-end">
                <button onClick={() => setIsDetailModalOpen(false)} className="px-6 py-2 bg-brand-red text-white font-bold rounded-lg hover:bg-red-700 transition">Tutup Detail</button>
             </div>
          </div>
        </div>
      )}

      {/* Modal Status */}
      <StatusModal 
        isOpen={modal.isOpen}
        status={modal.status}
        message={modal.message}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        title="Hapus Broadcast"
        message="Yakin ingin menghapus broadcast ini? Broadcast yang dihapus tidak bisa dikembalikan."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </div>
  )
}
