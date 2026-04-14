'use client'

import React, { useState, useEffect } from 'react'
import { CheckSquare, Search, FileText, X, Check, XCircle, Clock, ChevronRight, Calendar, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatusModal } from '@/components/StatusModal'

type TabType = 'UBAH_JADWAL' | 'IZIN' | 'DINAS_LUAR'
type ViewMode = 'LIST' | 'FORM_UBAH' | 'FORM_IZIN' | 'FORM_DINAS'

export default function PersetujuanPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<TabType>('UBAH_JADWAL')
  const [viewMode, setViewMode] = useState<ViewMode>('LIST')
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 })
  const [modal, setModal] = useState<{isOpen: boolean, status: 'loading' | 'success' | 'error', message: string}>({
    isOpen: false, status: 'success', message: ''
  })

  useEffect(() => {
    fetchRequests()
  }, [activeTab])

  const fetchRequests = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('approval_requests')
      .select(`
        *, 
        users!approval_requests_user_id_fkey(
          full_name, 
          nik, 
          position, 
          stations(name)
        ),
        shifts_awal:shifts!approval_requests_shift_code_awal_fkey(start_time, end_time),
        shifts_akhir:shifts!approval_requests_shift_code_akhir_fkey(start_time, end_time)
      `)
      .eq('type', activeTab)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching requests:', error.message || error)
    } else {
      setRequests(data || [])
      
      const pending = (data || []).filter(r => r.status === 'Proses').length
      const approved = (data || []).filter(r => r.status === 'Disetujui').length
      const rejected = (data || []).filter(r => r.status === 'Tidak Disetujui').length
      setSummary({ total: data?.length || 0, approved, pending, rejected })
    }
    setLoading(false)
  }

  const handleAction = async (status: 'Disetujui' | 'Tidak Disetujui') => {
    if (!selectedRequest) return
    const { error } = await supabase
      .from('approval_requests')
      .update({ status })
      .eq('id', selectedRequest.id)
    
    if (error) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal: ' + error.message })
    } else {
      setModal({ isOpen: true, status: 'success', message: 'Permintaan berhasil ' + (status === 'Disetujui' ? 'disetujui!' : 'ditolak!') })
      fetchRequests()
    }
  }

  const handleCloseModal = () => {
    setModal({ ...modal, isOpen: false })
    if (modal.status === 'success') {
      setViewMode('LIST')
    }
  }

  const openForm = (req: any) => {
    setSelectedRequest(req)
    if (activeTab === 'UBAH_JADWAL') setViewMode('FORM_UBAH')
    else if (activeTab === 'IZIN') setViewMode('FORM_IZIN')
    else setViewMode('FORM_DINAS')
  }

  const renderList = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
       {/* Summary Cards */}
       <div className="grid grid-cols-4 gap-6">
          <div className="border border-brand-red p-6 rounded-md bg-white">
             <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-tighter">Total Request</span>
             </div>
             <div className="text-2xl font-black text-zinc-800">{summary.total}</div>
          </div>
          <div className="border border-brand-red p-6 rounded-md bg-white">
             <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-tighter">Disetujui</span>
             </div>
             <div className="text-2xl font-black text-zinc-800">{summary.approved}</div>
          </div>
          <div className="border border-brand-red p-6 rounded-md bg-white">
             <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-tighter">Proses</span>
             </div>
             <div className="text-2xl font-black text-zinc-800">{summary.pending}</div>
          </div>
          <div className="border border-brand-red p-6 rounded-md bg-white">
             <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-tighter">Tidak Disetujui</span>
             </div>
             <div className="text-2xl font-black text-zinc-800">{summary.rejected}</div>
          </div>
       </div>

       {/* Filters */}
       <div className="flex space-x-4">
          <div className="flex-1 relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
             <input type="text" placeholder="Search..." className="w-full border border-zinc-200 rounded-lg pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-red" />
          </div>
          <select className="border border-zinc-200 rounded-lg px-4 py-2.5 text-sm font-bold text-zinc-500 min-w-[200px] outline-none">
             <option>Filter Status</option>
          </select>
       </div>

       {/* Table */}
       <div className="border border-zinc-200 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left">
             <thead className="bg-[#B71C1C] text-white">
                <tr>
                   <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">ID</th>
                   <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">Nama Lengkap</th>
                   <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">Posisi / Kedudukan</th>
                   <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">Status</th>
                   <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-center">Dokumen</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-zinc-100 italic font-medium text-zinc-600 text-[13px]">
                {loading ? (
                   <tr>
                     <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                           <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
                           <p className="not-italic text-zinc-400 font-bold">Memuat data permintaan...</p>
                        </div>
                     </td>
                   </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-zinc-400 font-bold">Belum ada request untuk kategori ini.</td>
                  </tr>
                ) : (
                  requests.map((req, idx) => (
                    <tr key={req.id} className="hover:bg-zinc-50 transition-colors not-italic">
                       <td className="px-6 py-4 font-mono text-[11px] font-bold">{req.id.split('-')[0].toUpperCase()}</td>
                       <td className="px-6 py-4 font-black text-zinc-800">{req.users?.full_name}</td>
                       <td className="px-6 py-4">{req.users?.position} / {req.users?.stations?.name}</td>
                       <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                             req.status === 'Disetujui' ? 'text-green-600 bg-green-50 border-green-100' :
                             req.status === 'Tidak Disetujui' ? 'text-red-600 bg-red-50 border-red-100' :
                             'text-orange-600 bg-orange-50 border-orange-100'
                          }`}>
                             {req.status}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-center">
                          <button 
                             onClick={() => openForm(req)}
                             className="bg-[#B71C1C] text-white px-6 py-1 rounded shadow-md hover:bg-red-800 transition font-black text-[11px]"
                          >
                             File
                          </button>
                       </td>
                    </tr>
                  ))
                )}
             </tbody>
          </table>
       </div>
    </div>
  )

  const renderFormUbah = () => (
    <div className="bg-[#FFF9F5] rounded-xl border border-brand-red p-12 animate-in slide-in-from-bottom-4 duration-500">
       <h3 className="text-2xl font-black text-center text-zinc-800 mb-12 uppercase tracking-tighter">Form Ubah Jadwal</h3>
       <div className="grid grid-cols-2 gap-x-16 gap-y-8">
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">Tanggal</label>
                <div className="relative">
                   <input type="text" readOnly value={selectedRequest.tgl_permohonan || '-'} className="w-full border border-red-200 rounded px-4 py-2 bg-zinc-50 text-zinc-800 text-sm font-bold" />
                   <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-red" size={16} />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">Nama</label>
                <input type="text" readOnly value={selectedRequest.users?.full_name || '-'} className="w-full border border-red-200 rounded px-4 py-2 bg-zinc-50 text-zinc-800 text-sm font-bold" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">ID</label>
                <input type="text" readOnly value={selectedRequest.users?.nik || '-'} className="w-full border border-red-200 rounded px-4 py-2 bg-zinc-50 text-zinc-800 text-sm font-bold" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">Kedudukan</label>
                <input type="text" readOnly value={selectedRequest.users?.stations?.name || selectedRequest.kedudukan || '-'} className="w-full border border-red-200 rounded px-4 py-2 bg-zinc-100 text-zinc-800 text-sm font-bold" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">Kode Dinas</label>
                <div className="flex space-x-2 items-center">
                   <div className="bg-orange-500 text-white px-4 py-1 text-xs font-black rounded">Semula</div>
                   <input type="text" readOnly value={selectedRequest.shift_code_awal || '-'} className="flex-1 border border-red-200 rounded px-4 py-2 bg-zinc-50 text-zinc-800 font-bold" />
                </div>
             </div>
          </div>

          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">Jam Dinas</label>
                <input type="text" readOnly value={selectedRequest.shifts_awal ? `${selectedRequest.shifts_awal.start_time.substring(0, 5)} - ${selectedRequest.shifts_awal.end_time.substring(0, 5)}` : '-'} className="w-full border border-red-200 rounded px-4 py-2 bg-zinc-100 text-zinc-800 text-sm font-bold" />
             </div>
             <div className="space-y-2">
                <div className="bg-[#4CAF50] text-white px-4 py-1 text-xs font-black rounded inline-block mb-2">Menjadi</div>
                <div className="space-y-2">
                   <label className="text-sm font-black text-zinc-800 block">Kode Dinasan</label>
                   <input type="text" readOnly value={selectedRequest.shift_code_akhir || '-'} className="w-full border border-zinc-300 rounded px-4 py-2 bg-white text-zinc-800 font-black" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">Penjelasan</label>
                <textarea readOnly className="w-full border border-zinc-200 rounded px-4 py-2 bg-zinc-50 text-zinc-800 font-medium min-h-[140px]" defaultValue={selectedRequest.alasan_penjelasan || '-'}></textarea>
             </div>
          </div>
       </div>

       <div className="flex justify-end space-x-4 mt-12">
          {selectedRequest.status === 'Proses' && (
            <>
              <button onClick={() => handleAction('Disetujui')} className="bg-green-600 text-white px-8 py-2 rounded-lg font-black text-sm uppercase shadow-lg hover:bg-green-700">Setuju</button>
              <button onClick={() => handleAction('Tidak Disetujui')} className="bg-red-600 text-white px-8 py-2 rounded-lg font-black text-sm uppercase shadow-lg hover:bg-red-700">Tolak</button>
            </>
          )}
          <button onClick={() => setViewMode('LIST')} className="bg-zinc-600 text-white px-8 py-2 rounded-lg font-black text-sm uppercase shadow-lg hover:bg-zinc-700">Cancel</button>
       </div>
    </div>
  )

  const renderFormIzin = () => (
    <div className="bg-[#FFF9F5] rounded-xl border border-brand-red p-12 animate-in slide-in-from-bottom-4 duration-500">
       <h3 className="text-2xl font-black text-center text-zinc-800 mb-12 uppercase tracking-tighter">Form Izin</h3>
       <div className="grid grid-cols-2 gap-x-16 gap-y-8">
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">Tanggal</label>
                <div className="relative">
                   <input type="text" readOnly value={selectedRequest.tgl_permohonan || '-'} className="w-full border border-red-200 rounded px-4 py-2 bg-zinc-50 text-zinc-800 text-sm font-bold" />
                   <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-red" size={16} />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">Nama</label>
                <input type="text" readOnly value={selectedRequest.users?.full_name || '-'} className="w-full border border-red-200 rounded px-4 py-2 bg-zinc-50 text-zinc-800 text-sm font-bold" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">ID</label>
                <input type="text" readOnly value={selectedRequest.users?.nik || '-'} className="w-full border border-red-200 rounded px-4 py-2 bg-zinc-50 text-zinc-800 text-sm font-bold" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">Kedudukan</label>
                <input type="text" readOnly value={selectedRequest.users?.stations?.name || selectedRequest.kedudukan || '-'} className="w-full border border-red-200 rounded px-4 py-2 bg-zinc-100 text-zinc-800 text-sm font-bold" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">Kode Dinas</label>
                <div className="flex space-x-2 items-center">
                   <div className="bg-orange-500 text-white px-4 py-1 text-xs font-black rounded">Semula</div>
                   <input type="text" readOnly value={selectedRequest.shift_code_awal || '-'} className="flex-1 border border-red-200 rounded px-4 py-2 bg-zinc-50 text-zinc-800 font-bold" />
                </div>
             </div>
          </div>

          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">Jam Dinas</label>
                <input type="text" readOnly value={selectedRequest.shifts_awal ? `${selectedRequest.shifts_awal.start_time.substring(0, 5)} - ${selectedRequest.shifts_awal.end_time.substring(0, 5)}` : '-'} className="w-full border border-red-200 rounded px-4 py-2 bg-zinc-100 text-zinc-800 text-sm font-bold" />
             </div>
             <div className="space-y-2">
                <div className="bg-[#4CAF50] text-white px-4 py-1 text-xs font-black rounded inline-block mb-2">Menjadi</div>
                <div className="space-y-2">
                   <label className="text-sm font-black text-zinc-800 block">Kode Dinasan</label>
                   <input type="text" readOnly value={selectedRequest.shift_code_akhir || '-'} className="w-full border border-zinc-300 rounded px-4 py-2 bg-white text-zinc-800 font-black" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">Penjelasan</label>
                <textarea readOnly className="w-full border border-zinc-200 rounded px-4 py-2 bg-zinc-50 text-zinc-800 font-medium min-h-[140px]" defaultValue={selectedRequest.alasan_penjelasan || '-'}></textarea>
             </div>
          </div>
       </div>

       <div className="flex justify-end space-x-4 mt-12">
          {selectedRequest.status === 'Proses' && (
            <>
              <button onClick={() => handleAction('Disetujui')} className="bg-green-600 text-white px-8 py-2 rounded-lg font-black text-sm uppercase shadow-lg hover:bg-green-700">Setuju</button>
              <button onClick={() => handleAction('Tidak Disetujui')} className="bg-red-600 text-white px-8 py-2 rounded-lg font-black text-sm uppercase shadow-lg hover:bg-red-700">Tolak</button>
            </>
          )}
          <button onClick={() => setViewMode('LIST')} className="bg-zinc-600 text-white px-8 py-2 rounded-lg font-black text-sm uppercase shadow-lg hover:bg-zinc-700">Cancel</button>
       </div>
    </div>
  )

  const renderFormDinas = () => (
    <div className="bg-[#FFF9F5] rounded-xl border border-brand-red p-12 animate-in slide-in-from-bottom-4 duration-500">
       <h3 className="text-2xl font-black text-center text-zinc-800 mb-12 uppercase tracking-tighter">Form Dinas Luar</h3>
       <div className="grid grid-cols-2 gap-x-16 gap-y-8">
          <div className="space-y-6">
             <div className="flex space-x-4 items-end">
                <div className="flex-1 space-y-2">
                   <label className="text-sm font-black text-zinc-800">Tanggal</label>
                   <div className="relative">
                      <input type="text" readOnly value={selectedRequest.tgl_mulai_dinas || '-'} className="w-full border border-red-200 rounded px-4 py-2 bg-zinc-50 text-zinc-800 text-sm font-bold" />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-red" size={16} />
                   </div>
                </div>
                <span className="mb-2 text-xs font-black text-zinc-400">S.D</span>
                <div className="flex-1 space-y-2">
                   <div className="relative">
                      <input type="text" readOnly value={selectedRequest.tgl_selesai_dinas || '-'} className="w-full border border-red-200 rounded px-4 py-2 bg-zinc-50 text-zinc-800 text-sm font-bold" />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-red" size={16} />
                   </div>
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">Nama</label>
                <input type="text" readOnly value={selectedRequest.users?.full_name || '-'} className="w-full border border-red-200 rounded px-4 py-2 bg-zinc-50 text-zinc-800 text-sm font-bold" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">ID</label>
                <input type="text" readOnly value={selectedRequest.users?.nik || '-'} className="w-full border border-red-200 rounded px-4 py-2 bg-zinc-50 text-zinc-800 text-sm font-bold" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">Kedudukan</label>
                <input type="text" readOnly value={selectedRequest.users?.stations?.name || selectedRequest.kedudukan || '-'} className="w-full border border-red-200 rounded px-4 py-2 bg-zinc-100 text-zinc-800 text-sm font-bold" />
             </div>
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">Jabatan</label>
                <input type="text" readOnly value={selectedRequest.jabatan || selectedRequest.users?.position || '-'} className="w-full border border-red-200 rounded px-4 py-2 bg-zinc-50 text-zinc-800 text-sm font-bold" />
             </div>
          </div>

          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">Penjelasan</label>
                <textarea readOnly className="w-full border border-zinc-200 rounded px-4 py-2 bg-zinc-50 text-zinc-800 font-medium min-h-[100px]" defaultValue={selectedRequest.alasan_penjelasan || '-'}></textarea>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-black text-zinc-800">Dokumentasi</label>
                <div className="border border-zinc-200 rounded-md p-2 bg-zinc-50 h-44 overflow-hidden">
                   {selectedRequest.lampiran_dokumentasi_url ? (
                     <img src={selectedRequest.lampiran_dokumentasi_url} className="w-full h-full object-cover rounded shadow-inner" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xs font-bold italic">Tidak ada dokumentasi</div>
                   )}
                </div>
             </div>
          </div>
       </div>

       <div className="flex justify-end space-x-4 mt-12">
          {selectedRequest.status === 'Proses' && (
            <>
              <button onClick={() => handleAction('Disetujui')} className="bg-green-600 text-white px-8 py-2 rounded-lg font-black text-sm uppercase shadow-lg hover:bg-green-700">Setuju</button>
              <button onClick={() => handleAction('Tidak Disetujui')} className="bg-red-600 text-white px-8 py-2 rounded-lg font-black text-sm uppercase shadow-lg hover:bg-red-700">Tolak</button>
            </>
          )}
          <button onClick={() => setViewMode('LIST')} className="bg-zinc-600 text-white px-8 py-2 rounded-lg font-black text-sm uppercase shadow-lg hover:bg-zinc-700">Cancel</button>
       </div>
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-24 bg-gradient-to-r from-[#E62020] to-[#8B0000] w-full flex items-center px-10 shrink-0">
        <div className="flex items-center space-x-6">
          <div className="text-white border-2 border-white/20 p-2 rounded-lg">
            <CheckSquare size={40} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white tracking-tight leading-tight">Requests Persetujuan Presence</h2>
            {viewMode !== 'LIST' && (
              <span className="text-[14px] font-extrabold text-white/80">
                {viewMode === 'FORM_UBAH' ? 'Ubah Jadwal' : viewMode === 'FORM_IZIN' ? 'Izin' : 'Dinas Luar'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-12">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Sub Navigation Tabs */}
          <div className="flex justify-end items-center mb-8">
             <div className="flex bg-zinc-100 p-1 rounded-xl">
                <button 
                  onClick={() => { setActiveTab('UBAH_JADWAL'); setViewMode('LIST'); }}
                  className={`px-8 py-2 text-[11px] font-black rounded-lg transition-all ${activeTab === 'UBAH_JADWAL' ? 'bg-[#B71C1C] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  Ubah Jadwal
                </button>
                <button 
                  onClick={() => { setActiveTab('IZIN'); setViewMode('LIST'); }}
                  className={`px-8 py-2 text-[11px] font-black rounded-lg transition-all ${activeTab === 'IZIN' ? 'bg-[#B71C1C] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  Izin
                </button>
                <button 
                  onClick={() => { setActiveTab('DINAS_LUAR'); setViewMode('LIST'); }}
                  className={`px-8 py-2 text-[11px] font-black rounded-lg transition-all ${activeTab === 'DINAS_LUAR' ? 'bg-[#B71C1C] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  Dinas Luar
                </button>
             </div>
          </div>

          {/* Conditional View */}
          {viewMode === 'LIST' && renderList()}
          {viewMode === 'FORM_UBAH' && renderFormUbah()}
          {viewMode === 'FORM_IZIN' && renderFormIzin()}
          {viewMode === 'FORM_DINAS' && renderFormDinas()}

        </div>
      </div>
      <StatusModal 
        isOpen={modal.isOpen}
        status={modal.status}
        message={modal.message}
        onClose={handleCloseModal}
      />
    </div>
  )
}
