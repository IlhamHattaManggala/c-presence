'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Search, Edit3, Eye, Trash2, X, Download, FileSpreadsheet, ChevronRight, Send, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatusModal } from '@/components/StatusModal'

export default function PendaftaranPegawaiPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSopModalOpen, setIsSopModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'DATA' | 'RIWAYAT'>('DATA')
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{isOpen: boolean, status: 'loading' | 'success' | 'error', message: string}>({
    isOpen: false, status: 'success', message: ''
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

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

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pegawai ini?')) {
      setModal({ isOpen: true, status: 'loading', message: 'Menghapus data pegawai...' })
      const { error } = await supabase.from('users').delete().eq('id', id)
      if (error) {
        setModal({ isOpen: true, status: 'error', message: 'Gagal menghapus: ' + error.message })
      } else {
        setModal({ isOpen: true, status: 'success', message: 'Pegawai berhasil dihapus' })
        fetchEmployees()
      }
    }
  }

  const handleDownloadTemplate = () => {
    setModal({ isOpen: true, status: 'loading', message: 'Menyiapkan template excel...' })
    setTimeout(() => {
      window.open('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', '_blank')
      setModal({ isOpen: true, status: 'success', message: 'Template berhasil diunduh!' })
    }, 1000)
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-24 bg-[#E62020] w-full flex items-center px-10 shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="text-white p-2 hover:bg-white/10 rounded-full transition">
             <FileText size={40} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide leading-tight">Dokumen Presence Pendaftaran Pegawai</h2>
            <p className="text-white font-bold opacity-90">PT KAI Commuter</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Sub Navigation Buttons */}
          <div className="flex justify-end items-center space-x-3 mb-6">
             <div className="flex space-x-3">
                <button 
                  onClick={() => router.push('/admin/dokumen/pendaftaran')}
                  className="bg-brand-red text-white px-8 py-2 rounded-lg text-xs font-bold shadow-md shadow-brand-red/20 transition-all hover:bg-red-700"
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
                  className="bg-white text-zinc-600 border border-brand-red px-8 py-2 rounded-lg text-xs font-bold transition-all hover:bg-red-50"
                >
                  Dokumen Presensi
                </button>
             </div>
          </div>

          <div className="flex justify-end mb-8">
             <button 
               onClick={() => setIsSopModalOpen(true)}
               className="flex items-center space-x-2 border-2 border-[#B71C1C] px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 transition group"
             >
                <Plus size={18} className="text-[#B71C1C] group-hover:scale-110 transition" />
                <span className="text-[13px] font-bold text-[#B71C1C]">Edit Dokumen SOP</span>
             </button>
          </div>

          {/* Upload Section */}
          <div className="flex flex-col items-center">
             <h3 className="text-lg font-bold text-zinc-800 mb-6">Upload File Excel Pegawai</h3>
             <div className="w-full max-w-xl h-48 border-4 border-dashed border-zinc-200 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 transition-all group">
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

          {/* Table Section */}
          <div className="bg-white border border-zinc-300 rounded-lg overflow-hidden">
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
                                     <button onClick={() => { setIsEditModalOpen(true); }} className="text-orange-400 hover:scale-110 transition"><Edit3 size={18}/></button>
                                     <button onClick={() => handleDelete(row.id)} className="text-[#8B0000] hover:scale-110 transition"><Trash2 size={18} /></button>
                                     <button className="text-[#8B0000] hover:scale-110 transition"><Send size={16} className="rotate-[-10deg]" /></button>
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
                    <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                       {/* Row 1 */}
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">ID</label>
                          <input type="text" defaultValue="549500453" className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 bg-zinc-50/10" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">NIK</label>
                          <input type="text" defaultValue="549500453" className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 bg-zinc-50/10" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">Nama</label>
                          <select className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 bg-white">
                             <option>Achmad Fauzi</option>
                          </select>
                       </div>

                       {/* Row 2 */}
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">Posisi</label>
                          <select className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 bg-white">
                             <option>Passenger Service</option>
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">Jabatan</label>
                          <select className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 bg-white">
                             <option>Passenger Service</option>
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">Stasiun</label>
                          <select className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 bg-white">
                             <option>Cawang</option>
                          </select>
                       </div>

                       {/* Row 3 */}
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">Kode Dinasan</label>
                          <select className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-400 bg-white">
                             <option>DP3</option>
                          </select>
                       </div>
                       <div className="col-span-2 space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">Catatan</label>
                          <textarea 
                             className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-zinc-400 min-h-[44px] resize-none bg-zinc-50/10"
                             defaultValue="Data diperbaiki karena nama tidak sesuai KTP, silahkan cek kembali jika ada kesalahan lain."
                          ></textarea>
                       </div>
                    </div>

                    {/* Change Status / Log Part */}
                    <div className="space-y-3 mt-6">
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
                    {/* Admin Change Item */}
                    <div className="space-y-3">
                       <div className="flex items-center space-x-2 text-sm font-bold text-orange-400">
                          <div className="w-4 h-4 rounded-sm bg-orange-400 flex items-center justify-center">
                             <Check size={12} className="text-white" />
                          </div>
                          <span>1 April 2025, 14.30 WIB</span>
                       </div>
                       <div className="p-4 bg-orange-100/60 border border-orange-200 rounded-lg">
                          <p className="text-sm font-bold text-orange-400 mb-1">Diedit Oleh Admin :</p>
                          <p className="text-sm font-bold text-zinc-600">Nama Diperbaiki : <span className="text-orange-400">Adhmad Fauzi {"->"} Achmad Fauzi</span></p>
                       </div>
                    </div>

                    {/* User Input Item */}
                    <div className="space-y-3">
                       <div className="flex items-center space-x-2 text-sm font-bold text-zinc-800">
                          <div className="w-5 h-5 rounded-sm bg-[#5271FF] flex items-center justify-center text-white text-[10px] font-bold">
                             A
                          </div>
                          <span>1 April 2025, 10.10 WIB</span>
                       </div>
                       <div className="p-4 bg-[#DCE4FF] border border-[#B8C9FF] rounded-lg">
                          <p className="text-sm font-bold text-[#5271FF] mb-3">Dinput Oleh Pengguna</p>
                          <ul className="space-y-2 text-sm font-bold text-zinc-800">
                             <li className="flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full bg-[#5271FF]"></span>
                                <span>Nama : {"->"} Adhmad Fauzi</span>
                             </li>
                             <li className="flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full bg-[#5271FF]"></span>
                                <span>Posisi : {"->"} Passanger Service</span>
                             </li>
                             <li className="flex items-center space-x-2">
                                <span className="w-2 h-2 rounded-full bg-[#5271FF]"></span>
                                <span>Kode Dinas : {"->"} DP3</span>
                             </li>
                          </ul>
                       </div>
                    </div>

                    {/* Checkbox and Action Button */}
                    <div className="flex justify-between items-center pt-4">
                       <label className="flex items-center space-x-3 cursor-pointer group">
                          <div className="w-4 h-4 rounded border-2 border-zinc-400 group-hover:border-zinc-800 transition shadow-sm bg-white"></div>
                          <span className="text-xs font-bold text-zinc-700">Tandai Semua Perubahan Sudah Diperiksa</span>
                       </label>
                       <button className="bg-[#E0E4EC] text-zinc-700 px-6 py-2 rounded-md font-bold text-xs hover:bg-zinc-300 transition shadow-sm">
                          Bersihkan Riwayat
                       </button>
                    </div>
                 </div>
               )}
            </div>

            {/* Modal Footer */}
            <div className="mt-8 flex justify-end space-x-4">
               <button onClick={() => setIsEditModalOpen(false)} className="w-36 py-2 rounded-[4px] bg-[#E0E4EC] text-zinc-700 font-bold hover:bg-zinc-300 transition text-sm">Batal</button>
               <button onClick={() => setIsEditModalOpen(false)} className={`w-64 py-2 rounded-[4px] text-white font-bold transition text-sm shadow-md ${activeTab === 'DATA' ? 'bg-[#003FE1] hover:bg-blue-700' : 'bg-[#003FE1] hover:bg-blue-700'}`}>
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
    </div>
  )
}

