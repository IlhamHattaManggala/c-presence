'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Search, Edit3, Eye, Trash2, X, Download, FileSpreadsheet, ChevronRight, Send, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatusModal } from '@/components/StatusModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { bulkImportEmployees } from '@/app/actions/user-actions'
import * as XLSX from 'xlsx'

export default function PendaftaranPegawaiPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSopModalOpen, setIsSopModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'DATA' | 'RIWAYAT'>('DATA')
  const [employees, setEmployees] = useState<any[]>([])
  const [stations, setStations] = useState<any[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [editFormData, setEditFormData] = useState<any>({
    nik: '', full_name: '', position: '', station_id: '', shift_code: '', note: ''
  })
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{isOpen: boolean, status: 'loading' | 'success' | 'error', message: string}>({
    isOpen: false, status: 'success', message: ''
  })
  const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null})
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchEmployees()
    fetchStations()
  }, [])

  const fetchStations = async () => {
    const { data } = await supabase.from('stations').select('id, name').order('name')
    if (data) setStations(data)
  }

  const fetchEmployees = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('*, stations(name)')
      .eq('role', 'user')
      .order('full_name', { ascending: true })

    if (error) {
       console.error('Error fetching employees:', error)
    } else {
       setEmployees(data || [])
    }
    setLoading(false)
  }

  const handleDelete = (id: string) => {
    setConfirmDelete({ isOpen: true, id })
  }

  const executeDelete = async () => {
    if (!confirmDelete.id) return
    const idToDel = confirmDelete.id
    setConfirmDelete({ isOpen: false, id: null })

    setModal({ isOpen: true, status: 'loading', message: 'Menghapus data pegawai...' })
    const { error } = await supabase.from('users').delete().eq('id', idToDel)
    if (error) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal menghapus: ' + error.message })
    } else {
      setModal({ isOpen: true, status: 'success', message: 'Pegawai berhasil dihapus' })
      fetchEmployees()
    }
  }

  const handleEditClick = (employee: any) => {
    setSelectedEmployee(employee)
    setEditFormData({
      nik: employee.nik || '',
      full_name: employee.full_name || '',
      position: employee.position || '',
      station_id: employee.station_id || '',
      shift_code: employee.shift_code || '',
      note: ''
    })
    setActiveTab('DATA')
    setIsEditModalOpen(true)
    fetchLogs(employee.id)
  }

  const fetchLogs = async (employeeId: string) => {
    setLoadingLogs(true)
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('target_id', employeeId)
      .order('created_at', { ascending: false })
    
    if (data) setLogs(data)
    setLoadingLogs(false)
  }

  const handleClearHistory = async () => {
    if (!selectedEmployee) return
    if (!window.confirm("Yakin ingin membersihkan riwayat perubahan pegawai ini?")) return
    
    const { error } = await supabase
       .from('audit_logs')
       .delete()
       .eq('target_id', selectedEmployee.id)
       
    if (!error) {
       fetchLogs(selectedEmployee.id)
    } else {
       console.error("Gagal membersihkan riwayat", error)
    }
  }

  const submitEdit = async () => {
    if (!selectedEmployee) return
    
    setModal({ isOpen: true, status: 'loading', message: 'Menyimpan perubahan...' })
    setIsEditModalOpen(false)

    const updateData = {
      nik: editFormData.nik,
      full_name: editFormData.full_name,
      position: editFormData.position,
      station_id: editFormData.station_id || null,
      shift_code: editFormData.shift_code
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', selectedEmployee.id)

    if (error) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal memperbarui data: ' + error.message })
    } else {
      // Create Audit Log
      const changes: string[] = []
      if (selectedEmployee.nik !== editFormData.nik) changes.push(`NIK: ${selectedEmployee.nik} -> ${editFormData.nik}`)
      if (selectedEmployee.full_name !== editFormData.full_name) changes.push(`Nama: ${selectedEmployee.full_name} -> ${editFormData.full_name}`)
      if (selectedEmployee.position !== editFormData.position) changes.push(`Posisi/Jabatan: ${selectedEmployee.position} -> ${editFormData.position}`)
      if (selectedEmployee.shift_code !== editFormData.shift_code) changes.push(`Kode Dinas: ${selectedEmployee.shift_code || '-'} -> ${editFormData.shift_code || '-'}`)
      if (selectedEmployee.station_id !== editFormData.station_id) {
         const oldStation = stations.find(s => s.id === selectedEmployee.station_id)?.name || '-'
         const newStation = stations.find(s => s.id === editFormData.station_id)?.name || '-'
         changes.push(`Stasiun: ${oldStation} -> ${newStation}`)
      }
      if (editFormData.note && editFormData.note.trim() !== '') {
         changes.push(`Catatan: ${editFormData.note.trim()}`)
      }

      const { data: userData } = await supabase.auth.getUser()
      if (changes.length > 0 && userData?.user?.id) {
        await supabase.from('audit_logs').insert([{
           actor_id: userData.user.id,
           target_id: selectedEmployee.id,
           action: 'update_employee',
           description: changes.join('\n')
        }])
      }

      setModal({ isOpen: true, status: 'success', message: 'Data pegawai berhasil diperbarui!' })
      fetchEmployees()
    }
  }

  const handleSendInvite = (employee: any) => {
    const phoneNumber = employee.phone_number?.replace(/\D/g, '') || ''
    const message = `Halo ${employee.full_name},\n\nAkun C-Presence kamu telah didaftarkan. Silakan login menggunakan:\nEmail: ${employee.email}\nPassword: (Gunakan password yang sudah ditentukan admin)\n\nTerima kasih.`
    const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(waUrl, '_blank')
  }

  const handleDownloadTemplate = () => {
    // Path langsung ke file di folder public
    const templateUrl = '/file/Format Excel Pendaftaran Pegawai.xlsx'
    
    // Buat link temporary untuk trigger download
    const link = document.createElement('a')
    link.href = templateUrl
    link.download = 'Format Excel Pendaftaran Pegawai.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setModal({ isOpen: true, status: 'success', message: 'Template berhasil diunduh!' })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setModal({ isOpen: true, status: 'loading', message: 'Membaca file excel...' })

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json: any[] = XLSX.utils.sheet_to_json(worksheet)

        if (json.length === 0) {
          setModal({ isOpen: true, status: 'error', message: 'File excel kosong atau format tidak sesuai' })
          return
        }

        setModal({ isOpen: true, status: 'loading', message: `Sedang memproses ${json.length} data pegawai...` })

        // 1. Ambil data stasiun untuk mapping nama -> id
        const { data: stations } = await supabase.from('stations').select('id, name')
        const stationMap = new Map(stations?.map(s => [String(s.name).toLowerCase().trim(), s.id]))

        // 2. Mapping data dari Excel ke struktur Database
        const mappedData = json.map((item: any) => {
           const stationName = String(item['Stasiun'] || '').toLowerCase().trim()
           return {
              email: item['Email'] || '',
              nik: String(item['NIK'] || item['ID/NIK'] || ''),
              full_name: item['Nama'] || item['Nama Lengkap'] || '',
              position: item['Posisi'] || item['Jabatan'] || '',
              phone_number: String(item['Nomor Hp'] || item['Phone'] || ''),
              station_id: stationMap.get(stationName) || null,
              shift_code: String(item['Kode Dinas'] || item['Kode Dinasan'] || '').toUpperCase(),
              role: 'user'
           }
        })

        // 3. Masukkan via Server Action (Auth + DB)
        const res = await bulkImportEmployees(mappedData)
        
        if (!res.success) {
           throw new Error(res.error || 'Terjadi kesalahan sistem')
        }

        // Narrowing type for TypeScript
        if ('totalSuccess' in res) {
           if (res.failed > 0) {
              setModal({ 
                isOpen: true, 
                status: 'error', 
                message: `Proses selesai dengan beberapa error:\nBerhasil: ${res.totalSuccess}\nGagal: ${res.failed}\n\nDetail: ${res.errors.slice(0, 3).join(', ')}${res.errors.length > 3 ? '...' : ''}` 
              })
           } else {
              setModal({ isOpen: true, status: 'success', message: `Berhasil mendaftarkan ${res.totalSuccess} pegawai baru!` })
           }
        }
        
        fetchEmployees()
        
        // Reset input file
        if (fileInputRef.current) fileInputRef.current.value = ''
        
      } catch (err: any) {
        console.error('Import error:', err)
        setModal({ isOpen: true, status: 'error', message: 'Gagal mengimpor data: ' + err.message })
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-auto py-6 md:h-24 md:py-0 bg-[#E62020] w-full flex items-center px-6 md:px-10 pr-16 md:pr-10 shrink-0">
        <div className="flex items-center space-x-3 md:space-x-4">
          <button onClick={() => router.back()} className="text-white p-1.5 md:p-2 hover:bg-white/10 rounded-full transition shrink-0">
             <FileText className="w-8 h-8 md:w-10 md:h-10" />
          </button>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-wide leading-tight">Dokumen Presence Pendaftaran Pegawai</h2>
            <p className="text-white text-xs md:text-sm font-bold opacity-90">PT KAI Commuter</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Sub Navigation Buttons - Satu Baris Horizontal */}
          <div className="w-full flex justify-start md:justify-end overflow-x-auto scrollbar-hide mb-6 py-2">
             <div className="flex flex-nowrap gap-2">
                <button 
                  onClick={() => router.push('/admin/dokumen/pendaftaran')}
                  className="shrink-0 bg-brand-red text-white px-5 md:px-8 py-2 rounded-lg text-[10px] md:text-xs font-bold shadow-md shadow-brand-red/20 transition-all hover:bg-red-700"
                >
                  Pendaftaran
                </button>
                <button 
                  onClick={() => router.push('/admin/dokumen/broadcast')}
                  className="shrink-0 bg-white text-zinc-600 border border-brand-red px-5 md:px-8 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all hover:bg-red-50"
                >
                  Broadcast
                </button>
                <button 
                  onClick={() => router.push('/admin/dokumen/presensi')}
                  className="shrink-0 bg-white text-zinc-600 border border-brand-red px-5 md:px-8 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all hover:bg-red-50"
                >
                  Dokumen Presensi
                </button>
             </div>
          </div>

          <div className="flex justify-center md:justify-end mb-8 md:mb-10">
             <button 
               onClick={() => setIsSopModalOpen(true)}
               className="flex items-center space-x-2 border-2 border-[#B71C1C] px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 transition group"
             >
                <Plus size={16} className="text-[#B71C1C] group-hover:scale-110 transition shrink-0" />
                <span className="text-[11px] md:text-[13px] font-bold text-[#B71C1C]">Edit Dokumen SOP</span>
             </button>
          </div>

          {/* Upload Section */}
          <div className="flex flex-col items-center">
             <h3 className="text-lg font-bold text-zinc-800 mb-6">Upload File Excel Pegawai</h3>
             <input 
               type="file" 
               ref={fileInputRef}
               onChange={handleFileUpload}
               accept=".xlsx, .xls"
               className="hidden"
             />
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="w-full max-w-xl h-48 border-4 border-dashed border-zinc-200 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 transition-all group"
             >
                <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-red-50 group-hover:text-brand-red transition">
                   <Plus size={40} />
                </div>
             </div>
              <button 
                onClick={handleDownloadTemplate}
                className="mt-4 flex items-center space-x-2 text-brand-red font-bold text-sm hover:underline"
              >
                 <FileSpreadsheet size={16} />
                 <span>Format Excel Dokumen</span>
              </button>
          </div>

          {/* Table / Card List Section */}
          <div className="space-y-4">
             {/* Desktop Table View */}
             <div className="hidden md:block bg-white border border-zinc-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse min-w-[1200px]">
                      <thead className="bg-[#B71C1C] text-white">
                         <tr className="divide-x divide-zinc-700/50">
                            <th className="px-2 py-5 text-sm font-bold w-12 text-center">No</th>
                            <th className="px-4 py-5 text-sm font-bold text-center">Email</th>
                            <th className="px-4 py-5 text-sm font-bold w-32 text-center">ID/NIK</th>
                            <th className="px-4 py-5 text-sm font-bold w-48 text-center">Nama</th>
                            <th className="px-4 py-5 text-sm font-bold w-48 text-center">Posisi</th>
                            <th className="px-4 py-5 text-sm font-bold w-40 text-center">Nomor Hp</th>
                            <th className="px-4 py-5 text-sm font-bold w-32 text-center">Stasiun</th>
                            <th className="px-4 py-5 text-sm font-bold w-32 text-center">Kode Dinasan</th>
                            <th className="px-2 py-5 text-sm font-bold w-24 text-center">Aksi</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-300">
                         {loading ? (
                            <tr>
                               <td colSpan={9} className="py-20 text-center">
                                  <div className="flex flex-col items-center justify-center space-y-4">
                                     <div className="w-10 h-10 border-4 border-[#B71C1C] border-t-transparent rounded-full animate-spin"></div>
                                     <p className="text-zinc-500 font-medium text-sm">Memuat data pegawai...</p>
                                  </div>
                               </td>
                            </tr>
                         ) : employees.length === 0 ? (
                            <tr>
                               <td colSpan={9} className="py-20 text-center text-zinc-500 font-medium italic text-sm">
                                  Belum ada data pegawai.
                               </td>
                            </tr>
                         ) : (
                            employees.map((row, idx) => (
                               <tr key={row.id} className="divide-x divide-zinc-300 hover:bg-zinc-50 transition text-zinc-600">
                                  <td className="px-2 py-4 text-center font-medium text-zinc-500">{idx + 1}</td>
                                  <td className="px-4 py-4 text-sm truncate">{row.email}</td>
                                  <td className="px-4 py-4 text-sm">{row.nik}</td>
                                  <td className="px-4 py-4 text-sm font-bold text-zinc-800">{row.full_name}</td>
                                  <td className="px-4 py-4 text-sm">{row.position}</td>
                                  <td className="px-4 py-4 text-sm">{row.phone_number}</td>
                                  <td className="px-4 py-4 text-sm">{row.stations?.name || '-'}</td>
                                  <td className="px-4 py-4 text-center text-sm font-bold">{row.shift_code || '-'}</td>
                                  <td className="px-2 py-4">
                                     <div className="flex items-center justify-center space-x-4">
                                        <button onClick={() => handleEditClick(row)} className="text-orange-400 hover:scale-110 transition"><Edit3 size={18}/></button>
                                        
                                        <button onClick={() => handleSendInvite(row)} className="text-[#8B0000] hover:scale-110 transition"><Send size={16} className="rotate-[-10deg]" /></button>
                                     </div>
                                  </td>
                               </tr>
                            ))
                         )}
                      </tbody>
                   </table>
                </div>
             </div>

             {/* Mobile Card View */}
             <div className="md:hidden space-y-4">
                {loading ? (
                   <div className="py-12 flex flex-col items-center justify-center space-y-4">
                      <div className="w-10 h-10 border-4 border-[#B71C1C] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Memuat Data...</p>
                   </div>
                ) : employees.length === 0 ? (
                   <div className="py-12 text-center text-zinc-400 font-bold text-xs uppercase italic tracking-wider">
                      Belum ada data pegawai.
                   </div>
                ) : (
                   employees.map((row, idx) => (
                      <div key={row.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-all">
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <span className="text-[10px] font-bold text-zinc-400 mb-1 block uppercase tracking-tighter">Pegawai #{idx + 1}</span>
                               <h4 className="font-extrabold text-zinc-800 text-base leading-tight uppercase">{row.full_name}</h4>
                               <p className="text-brand-red font-bold text-[11px] uppercase">{row.position}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                               <button onClick={() => handleEditClick(row)} className="p-2 bg-orange-50 text-orange-500 rounded-lg"><Edit3 size={16}/></button>
                               
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-y-3 pt-4 border-t border-zinc-50">
                            <div>
                               <p className="text-[9px] font-bold text-zinc-400 uppercase">NIK / ID</p>
                               <p className="text-xs font-bold text-zinc-700">{row.nik}</p>
                            </div>
                            <div>
                               <p className="text-[9px] font-bold text-zinc-400 uppercase">Stasiun</p>
                               <p className="text-xs font-bold text-zinc-700">{row.stations?.name || '-'}</p>
                            </div>
                            <div>
                               <p className="text-[9px] font-bold text-zinc-400 uppercase">Kode Dinas</p>
                               <p className="text-xs font-black text-brand-red uppercase">{row.shift_code || '-'}</p>
                            </div>
                            <div className="flex justify-end items-end">
                               <button 
                                 onClick={() => handleSendInvite(row)}
                                 className="flex items-center space-x-1.5 text-brand-red font-bold text-[10px] bg-red-50 px-3 py-1.5 rounded-full"
                               >
                                  <Send size={10} className="rotate-[-10deg]"/>
                                  <span>KIRIM</span>
                               </button>
                            </div>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>
      </div>
   </div>

      {/* Edit Pegawai Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[10px] shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-zinc-800">Edit Data Pegawai</h3>
               <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition">
                  <X size={20} className="border-2 border-zinc-400 rounded-full p-0.5" />
               </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-200 mb-8 font-medium">
               <button 
                 onClick={() => setActiveTab('DATA')}
                 className={`px-4 py-2 text-base transition-all ${activeTab === 'DATA' ? 'text-zinc-900 border-b-2 border-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-500'}`}
               >
                 Data Pegawai
               </button>
               <button 
                 onClick={() => setActiveTab('RIWAYAT')}
                 className={`px-4 py-2 text-base transition-all ${activeTab === 'RIWAYAT' ? 'text-zinc-900 border-b-2 border-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-500'}`}
               >
                 Riwayat Perubahan
               </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[75vh] scrollbar-hide py-2">
               {activeTab === 'DATA' && (
                 <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                       {/* Row 1 */}
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">ID / UUID Database</label>
                          <input type="text" value={selectedEmployee?.id || ''} disabled className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-bold text-zinc-500 bg-zinc-100 cursor-not-allowed focus:outline-none" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">NIK (Nomor Induk Karyawan)</label>
                          <input type="text" value={editFormData.nik || ''} onChange={e => setEditFormData({...editFormData, nik: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red bg-white" placeholder="Masukkan NIK" />
                       </div>

                       {/* Row 2 */}
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">Nama Lengkap</label>
                          <input type="text" value={editFormData.full_name || ''} onChange={e => setEditFormData({...editFormData, full_name: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red bg-white" placeholder="Masukkan Nama" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">Posisi / Jabatan</label>
                          <input type="text" value={editFormData.position || ''} onChange={e => setEditFormData({...editFormData, position: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red bg-white" placeholder="Masukkan Posisi" />
                       </div>

                       {/* Row 3 */}
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">Stasiun Penempatan</label>
                          <select value={editFormData.station_id || ''} onChange={e => setEditFormData({...editFormData, station_id: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red bg-white">
                             <option value="">Pilih Stasiun</option>
                             {stations.map(st => (
                               <option key={st.id} value={st.id}>{st.name}</option>
                             ))}
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">Kode Dinasan (Shift)</label>
                          <input type="text" value={editFormData.shift_code || ''} onChange={e => setEditFormData({...editFormData, shift_code: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red bg-white uppercase" placeholder="Contoh: DP3" />
                       </div>

                       {/* Full Width */}
                       <div className="col-span-1 md:col-span-2 space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">Catatan Administratif</label>
                          <textarea 
                             className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-[13px] font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red min-h-[60px] resize-none bg-white"
                             placeholder="Tambahkan catatan jika ada kesalahan atau pembaruan."
                             value={editFormData.note || ''}
                             onChange={e => setEditFormData({...editFormData, note: e.target.value})}
                          ></textarea>
                       </div>
                    </div>

                    {/* Change Status / Log Part */}
                    <div className="space-y-3 mt-6 border-t border-zinc-200 pt-6">
                       <div className="flex items-start space-x-3 text-[13px] text-blue-600 font-medium lowercase">
                          <div className="mt-1 w-4 h-4 rounded-sm border border-blue-600 bg-blue-600 flex items-center justify-center">
                             <Check size={12} className="text-white" />
                          </div>
                          <span>Di Update Oleh User <span className="capitalize">Pada 1 April 2025, 10.10 WIB</span></span>
                       </div>

                       <div className="p-4 bg-orange-100/60 border border-orange-200 rounded-lg space-y-2">
                          <div className="flex items-start space-x-3 text-[13px] text-orange-400 font-medium">
                             <div className="mt-1 w-4 h-4 rounded-sm border border-orange-400 bg-orange-400 flex items-center justify-center">
                                <Check size={12} className="text-white" />
                             </div>
                             <span>Di Update Oleh Admin <span className="text-zinc-500 capitalize">Pada 1 April 2025, 14.30 WIB</span></span>
                          </div>
                          <div className="pl-7 text-[13px] text-zinc-600 italic">
                             Nama : Adhmad Fauzi {"->"} Achmad Fauzi
                          </div>
                       </div>
                    </div>
                 </div>
               )}


               {activeTab === 'RIWAYAT' && (
                 <div className="space-y-6 py-2">
                    {loadingLogs ? (
                       <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div></div>
                    ) : logs.length === 0 ? (
                       <div className="py-12 text-center text-zinc-500 font-medium italic text-sm">Belum ada riwayat perubahan data.</div>
                    ) : (
                       logs.map((log) => {
                          const date = new Date(log.created_at).toLocaleString('id-ID', {
                             day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) + ' WIB'
                          const isAdmin = log.actor_id !== selectedEmployee?.id

                          if (isAdmin) {
                             return (
                                <div key={log.id} className="space-y-3">
                                   <div className="flex items-center space-x-2 text-sm font-bold text-orange-400">
                                      <div className="w-4 h-4 rounded-sm bg-orange-400 flex items-center justify-center">
                                         <Check size={12} className="text-white" />
                                      </div>
                                      <span>{date}</span>
                                   </div>
                                   <div className="p-4 bg-orange-100/60 border border-orange-200 rounded-lg">
                                      <p className="text-sm font-bold text-orange-400 mb-1">Diedit Oleh Admin :</p>
                                      <p className="text-sm font-bold text-zinc-600 whitespace-pre-wrap">{log.description}</p>
                                   </div>
                                </div>
                             )
                          } else {
                             return (
                                <div key={log.id} className="space-y-3">
                                   <div className="flex items-center space-x-2 text-sm font-bold text-zinc-800">
                                      <div className="w-5 h-5 rounded-sm bg-[#5271FF] flex items-center justify-center text-white text-[10px] font-bold">
                                         U
                                      </div>
                                      <span>{date}</span>
                                   </div>
                                   <div className="p-4 bg-[#DCE4FF] border border-[#B8C9FF] rounded-lg">
                                      <p className="text-sm font-bold text-[#5271FF] mb-3">Diupdate Oleh Pengguna</p>
                                      <p className="text-sm font-bold text-zinc-800 whitespace-pre-wrap">{log.description}</p>
                                   </div>
                                </div>
                             )
                          }
                       })
                    )}

                    {/* Checkbox and Action Button */}
                    <div className="flex justify-between items-center pt-4 border-t border-zinc-200">
                       <label className="flex items-center space-x-3 cursor-pointer group">
                          <input type="checkbox" className="w-4 h-4 text-brand-red bg-zinc-100 border-zinc-300 rounded focus:ring-brand-red focus:ring-2" />
                          <span className="text-xs font-bold text-zinc-700">Tandai Semua Perubahan Sudah Diperiksa</span>
                       </label>
                       <button onClick={handleClearHistory} disabled={logs.length === 0} className="bg-[#E0E4EC] disabled:opacity-50 text-zinc-700 px-6 py-2 rounded-md font-bold text-xs hover:bg-zinc-300 transition shadow-sm">
                          Bersihkan Riwayat
                       </button>
                    </div>
                 </div>
               )}
            </div>

            {/* Modal Footer */}
            <div className="mt-8 flex justify-end space-x-4">
               <button onClick={() => setIsEditModalOpen(false)} className="w-36 py-2 rounded-[4px] bg-[#E0E4EC] text-zinc-700 font-bold hover:bg-zinc-300 transition text-sm">Batal</button>
               <button onClick={activeTab === 'DATA' ? submitEdit : () => setIsEditModalOpen(false)} className={`w-64 py-2 rounded-[4px] text-white font-bold transition text-sm shadow-md bg-[#003FE1] hover:bg-blue-700`}>
                  {activeTab === 'DATA' ? 'Simpan Perubahan' : 'Tutup'}
               </button>
            </div>
          </div>
        </div>
      )}



      {/* Edit Dokumen SOP Modal */}
      {isSopModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSopModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-3xl rounded-[32px] shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
             
             {/* Modal Header */}
             <div className="mb-4">
                <h3 className="text-xl font-bold text-black mb-4">Edit Dokumen SOP</h3>
                <div className="h-[1px] bg-zinc-200 w-full mb-6"></div>
             </div>

             <div className="space-y-6">
                {/* Field: Nama Dokumen */}
                <div className="space-y-2">
                   <label className="block text-sm font-bold text-zinc-900">Nama Dokumen</label>
                   <input 
                     type="text" 
                     placeholder="Masukkan nama dokumen"
                     className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-zinc-400 bg-white shadow-sm"
                   />
                   <p className="text-blue-500 text-xs italic">* Gunakan nama file yang jelas dan mudah dikenali</p>
                </div>

                {/* Field: File Saat Ini */}
                <div className="space-y-2">
                   <label className="block text-sm font-bold text-zinc-900">File Saat Ini :</label>
                   <div className="flex items-center justify-between border border-zinc-200 rounded-xl p-3 max-w-sm bg-zinc-50/50">
                      <div className="flex items-center space-x-3">
                         <div className="w-8 h-10 bg-[#E62020] rounded flex items-center justify-center text-[8px] font-extrabold text-white">
                            PDF
                         </div>
                         <span className="font-bold text-zinc-800 text-xs truncate max-w-[150px]">SOP.KCI.086 - Passenger Service</span>
                      </div>
                      <button className="bg-[#CFD8EB] text-[#2255CC] px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition">
                         Download
                      </button>
                   </div>
                </div>

                {/* Field: Upload File Baru */}
                <div className="space-y-2">
                   <label className="block text-sm font-bold text-zinc-900">Upload File Baru</label>
                   <div className="w-full border-2 border-zinc-200 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3 border-dashed bg-zinc-50/20">
                      <div className="text-[#003BDD]">
                         <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                         </svg>
                      </div>
                      <div className="text-center">
                         <p className="text-base font-bold text-zinc-800">Drag & Drop File di sini</p>
                         <p className="text-zinc-400 text-xs font-medium">atau</p>
                      </div>
                      <button className="bg-[#003BDD] text-white px-8 py-2 rounded-lg font-bold text-xs shadow-md hover:bg-blue-800 transition">
                         Pilih File
                      </button>
                   </div>
                </div>
             </div>

             {/* Modal Footer */}
             <div className="mt-10 flex justify-between items-center">
                <button 
                onClick={() => setIsSopModalOpen(true)}
                className="border border-brand-red bg-red-50 text-brand-red px-4 py-1.5 rounded-lg flex items-center space-x-2 font-bold text-[11px] hover:bg-red-100 transition"
              >
                <Plus size={14} />
                <span>Edit Dokumen SOP</span>
              </button>
                <div className="flex items-center space-x-3">
                   <button 
                     onClick={() => setIsSopModalOpen(false)}
                     className="px-8 py-2.5 border border-zinc-300 rounded-lg font-bold text-sm text-zinc-700 hover:bg-zinc-50 transition"
                   >
                     Batal
                   </button>
                   <button 
                     onClick={() => setIsSopModalOpen(false)}
                     className="bg-[#003BDD] text-white px-6 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center space-x-2 shadow-md hover:bg-blue-800 group transition"
                   >
                      <span>Simpan Perubahan</span>
                      <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                   </button>
                </div>
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
        title="Hapus Pegawai"
        message="Apakah Anda yakin ingin menghapus pegawai ini? Data yang dihapus tidak dapat dikembalikan."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </div>
  )
}

