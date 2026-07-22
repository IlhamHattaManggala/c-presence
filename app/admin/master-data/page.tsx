'use client'

import React, { useState, useEffect } from 'react'
import { Database, Plus, Trash2, Edit2, MapPin, Clock, Search, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatusModal } from '@/components/StatusModal'
import { Map, Marker } from 'pigeon-maps'
import { ConfirmModal } from '@/components/ConfirmModal'
import { deleteUserAction, createUserAction, updateUserAction } from '@/app/actions/user-actions'

type TabType = 'STASIUN' | 'SHIFT' | 'USER' | 'SOP'

export default function MasterDataPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<TabType>('STASIUN')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [sopFile, setSopFile] = useState<File | null>(null)
  const [allStations, setAllStations] = useState<any[]>([])
  const [allShifts, setAllShifts] = useState<any[]>([])
  
  const [modal, setModal] = useState<{isOpen: boolean, status: 'loading' | 'success' | 'error', message: string}>({
    isOpen: false, status: 'success', message: ''
  })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, id: any}>({isOpen: false, id: null})

  const handleSearchLocation = async () => {
    if (!searchQuery) return
    setIsSearchingLocation(true)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=id&q=${encodeURIComponent(searchQuery)}`)
      const result = await response.json()
      if (result && result.length > 0) {
        const lat = parseFloat(result[0].lat)
        const lon = parseFloat(result[0].lon)
        setFormData((prev: any) => ({ ...prev, latitude: lat, longitude: lon }))
      } else {
        setModal({ isOpen: true, status: 'error', message: 'Lokasi tidak ditemukan di peta. Coba kata kunci yang lebih spesifik.' })
      }
    } catch (e) {
      console.error('Search error:', e)
      setModal({ isOpen: true, status: 'error', message: 'Gagal menghubungi server pencarian lokasi.' })
    } finally {
      setIsSearchingLocation(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    let table = 'stations'
    let orderCol = 'id'
    let ascending = true

    if (activeTab === 'STASIUN') {
      table = 'stations'
      orderCol = 'id'
    } else if (activeTab === 'SHIFT') {
      table = 'shifts'
      orderCol = 'code'
    } else if (activeTab === 'USER') {
      table = 'users'
      orderCol = 'full_name'
    } else if (activeTab === 'SOP') {
      table = 'sop_documents'
      orderCol = 'created_at'
      ascending = false
    }

    const query = supabase.from(table).select('*')
    if (activeTab === 'SOP') {
      query.eq('category', 'SOP')
    }
    const { data: result, error } = await query.order(orderCol, { ascending })
    
    if (error) {
       console.error('Fetch error:', error.message || error)
       if (error.code === '42P01') {
          setModal({ isOpen: true, status: 'error', message: `Tabel '${table}' belum dibuat di Supabase. Silakan buat tabelnya terlebih dahulu.` })
       }
    } else {
       setData(result || [])
    }

    if (activeTab === 'USER') {
       const { data: stData } = await supabase.from('stations').select('id, name').order('name')
       if (stData) setAllStations(stData)
       const { data: shData } = await supabase.from('shifts').select('*').order('code')
       if (shData) setAllShifts(shData)
    }

    setLoading(false)
  }

  const handleDelete = (idOrCode: any) => {
    setConfirmDelete({ isOpen: true, id: idOrCode })
  }

  const executeDelete = async () => {
    if (!confirmDelete.id) return
    const idToDel = confirmDelete.id
    setConfirmDelete({ isOpen: false, id: null })

    const table = activeTab === 'STASIUN' ? 'stations' : activeTab === 'SHIFT' ? 'shifts' : activeTab === 'USER' ? 'users' : 'sop_documents'
    const pkCol = activeTab === 'STASIUN' ? 'id' : activeTab === 'SHIFT' ? 'code' : 'id'
    
    let errorMsg = ''

    if (activeTab === 'USER') {
      const res = await deleteUserAction(idToDel as string)
      if (!res.success) errorMsg = res.error || 'Terjadi kesalahan'
    } else {
      const { error } = await supabase.from(table).delete().eq(pkCol, idToDel)
      if (error) errorMsg = error.message
    }
    
    if (errorMsg) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal menghapus: ' + errorMsg })
    } else {
      setModal({ isOpen: true, status: 'success', message: 'Data berhasil dihapus!' })
      fetchData()
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setModal({ isOpen: true, status: 'loading', message: 'Menyimpan...' })
    
    const table = activeTab === 'STASIUN' ? 'stations' : activeTab === 'SHIFT' ? 'shifts' : activeTab === 'USER' ? 'users' : 'sop_documents'
    const pkCol = activeTab === 'STASIUN' ? 'id' : activeTab === 'SHIFT' ? 'code' : 'id'
    let error;

    // Filter out 'password' from payload for DB table operation
    const payload = { ...formData }
    if (activeTab === 'USER') {
       delete payload.password
    }

    if (activeTab === 'STASIUN') {
      payload.radius_meters = payload.radius_meters !== '' && payload.radius_meters !== undefined ? parseInt(payload.radius_meters) : 600;
    }

    if (activeTab === 'SOP') {
      if (!formData.title?.trim()) {
        setModal({ isOpen: true, status: 'error', message: 'Harap masukkan nama dokumen.' })
        return
      }
      if (!editingId && !sopFile) {
        setModal({ isOpen: true, status: 'error', message: 'Harap pilih file dokumen terlebih dahulu.' })
        return
      }

      let fileUrl = formData.file_url || ''
      if (sopFile) {
        const fileExt = sopFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `SOP/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('sop_documents')
          .upload(filePath, sopFile)

        if (uploadError) {
          setModal({ isOpen: true, status: 'error', message: 'Gagal mengunggah file: ' + uploadError.message })
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('sop_documents')
          .getPublicUrl(filePath)
          
        fileUrl = publicUrl
      }

      if (editingId) {
        const { error: dbError } = await supabase
          .from('sop_documents')
          .update({ title: formData.title, file_url: fileUrl })
          .eq('id', editingId)
        error = dbError
      } else {
        const { error: dbError } = await supabase
          .from('sop_documents')
          .insert({ title: formData.title, category: 'SOP', file_url: fileUrl })
        error = dbError
      }
    } else if (editingId) {
      if (activeTab === 'USER') {
        const actionResult = await updateUserAction(editingId, {
          email: formData.email,
          full_name: formData.full_name,
          nik: formData.nik,
          role: formData.role || 'user',
          position: formData.position,
          password: formData.password,
          allowed_stations: formData.allowed_stations || [],
          shift_code: formData.shift_code || null,
          dinasan_start_time: formData.dinasan_start_time || null,
          dinasan_end_time: formData.dinasan_end_time || null
        })
        if (!actionResult.success) {
          setModal({ isOpen: true, status: 'error', message: 'Gagal memperbarui Pengguna: ' + actionResult.error })
          return
        }
      } else {
        const res = await supabase.from(table).update(payload).eq(pkCol, editingId)
        error = res.error
      }
    } else {
      if (activeTab === 'USER') {
        const actionResult = await createUserAction({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          nik: formData.nik,
          role: formData.role || 'user',
          position: formData.position,
          allowed_stations: formData.allowed_stations || [],
          shift_code: formData.shift_code || null,
          dinasan_start_time: formData.dinasan_start_time || null,
          dinasan_end_time: formData.dinasan_end_time || null
        })
        if (!actionResult.success) {
          setModal({ isOpen: true, status: 'error', message: 'Gagal meregistrasi Pengguna: ' + actionResult.error })
          return
        }
      } else {
        const res = await supabase.from(table).insert([payload])
        error = res.error
      }
    }

    if (error) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal menyimpan: ' + error.message })
    } else {
      setModal({ isOpen: true, status: 'success', message: 'Data berhasil disimpan!' })
      setIsFormOpen(false)
      fetchData()
    }
  }

  const openAddForm = () => {
    setEditingId(null)
    if (activeTab === 'STASIUN') {
       setFormData({ name: '', latitude: -6.4025, longitude: 106.8197, radius_meters: 600 })
    } else if (activeTab === 'SHIFT') {
       setFormData({ code: '', description: '', start_time: '', end_time: '' })
    } else if (activeTab === 'USER') {
       setFormData({ nik: '', full_name: '', email: '', role: 'user', position: '', password: 'password123', allowed_stations: [], shift_code: '', dinasan_start_time: '', dinasan_end_time: '' })
    } else if (activeTab === 'SOP') {
       setFormData({ title: '' })
       setSopFile(null)
    }
    setSearchQuery('')
    setIsFormOpen(true)
  }

  const openEditForm = (item: any) => {
    const pkVal = activeTab === 'STASIUN' ? item.id : activeTab === 'SHIFT' ? item.code : item.id
    setEditingId(pkVal)
    setFormData(item)
    setSopFile(null)
    setSearchQuery('')
    setIsFormOpen(true)
  }

  const renderContent = () => {
    if (loading) {
       return (
         <div className="flex justify-center items-center py-32">
            <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
         </div>
       )
    }

    if (data.length === 0) {
       return (
         <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
            <Database size={48} className="text-zinc-300 mb-4" />
            <h3 className="text-xl font-bold text-zinc-800 mb-2">Belum Ada Data</h3>
            <p className="text-zinc-500 mb-6">Tambahkan data {activeTab.toLowerCase()} pertama Anda ke dalam sistem.</p>
            <button onClick={openAddForm} className="bg-brand-red text-white px-8 py-3 rounded-full font-black text-sm uppercase shadow-lg shadow-brand-red/20 hover:scale-105 transition-transform flex items-center space-x-2">
               <Plus size={18} />
               <span>Tambah Data</span>
            </button>
         </div>
       )
    }

    if (activeTab === 'STASIUN') {
      return (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in duration-500">
            {data.map((item, idx) => (
               <div key={item.id || idx} className="bg-white border border-zinc-100 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-zinc-50 to-transparent -z-10 rounded-bl-full opacity-50"></div>
                  
                  <div className="flex items-start justify-between mb-4">
                     <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600">
                        <MapPin size={24} />
                     </div>
                     <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditForm(item)} className="p-2 bg-zinc-50 text-zinc-500 rounded-xl hover:bg-brand-red/10 hover:text-brand-red transition-colors">
                           <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 bg-zinc-50 text-zinc-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors">
                           <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
                  
                  <div>
                     <h3 className="text-xl font-black text-zinc-800 mb-2">{item.name}</h3>
                     <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-100 rounded-lg py-1.5 px-3 w-fit mb-2">
                        <MapPin size={12} className="text-zinc-400" />
                        <span className="text-[10px] font-bold text-zinc-500">
                          {item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : 'Koordinat Belum Diatur'}
                        </span>
                     </div>
                     <p className="text-xs font-bold text-zinc-400">Radius: <span className="text-zinc-800 font-extrabold">{item.radius_meters || 600} meter</span></p>
                  </div>
               </div>
            ))}
         </div>
      )
    }

    if (activeTab === 'SHIFT') {
      return (
         <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm animate-in fade-in duration-500">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-brand-red text-white">
                     <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-center w-16">No</th>
                     <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">Kode Shift</th>
                     <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">Deskripsi</th>
                     <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-center">Jam Masuk</th>
                     <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-center">Jam Pulang</th>
                     <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-center w-28">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-100 font-medium text-zinc-600 text-[13px]">
                  {data.map((item, idx) => (
                     <tr key={item.code || idx} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4 text-center text-zinc-800 font-bold">{idx + 1}</td>
                        <td className="px-6 py-4 font-black text-zinc-800"><span className="px-3 py-1 bg-zinc-800 text-white rounded-lg text-xs font-mono">{item.code}</span></td>
                        <td className="px-6 py-4 text-zinc-800 font-black">{item.description || '-'}</td>
                        <td className="px-6 py-4 text-center font-bold text-zinc-700">{item.start_time ? String(item.start_time).substring(0, 5) : '00:00'}</td>
                        <td className="px-6 py-4 text-center font-bold text-zinc-700">{item.end_time ? String(item.end_time).substring(0, 5) : '00:00'}</td>
                        <td className="px-6 py-4 text-center flex justify-center space-x-2">
                           <button onClick={() => openEditForm(item)} className="p-2 bg-zinc-50 text-zinc-500 rounded-xl hover:bg-brand-red/10 hover:text-brand-red transition-colors">
                              <Edit2 size={14} />
                           </button>
                           <button onClick={() => handleDelete(item.code)} className="p-2 bg-zinc-50 text-zinc-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors">
                              <Trash2 size={14} />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      )
    }

    if (activeTab === 'USER') {
      const admins = data.filter(u => u.role === 'admin' || u.role === 'super_admin')
      const users = data.filter(u => u.role === 'user')

      const renderUserTable = (list: any[], title: string) => (
         <div className="space-y-4">
            <h3 className="text-lg font-black text-zinc-800 tracking-tight">{title}</h3>
            <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="bg-brand-red text-white">
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-center w-16">No</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider w-32">ID</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">Nama Akun</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">Email Login</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-center w-36">Role Akses</th>
                        <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-center w-28">Aksi</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-medium text-zinc-600 text-[13px]">
                     {list.length === 0 ? (
                        <tr>
                           <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 font-bold">Tidak ada data pengguna</td>
                        </tr>
                     ) : (
                        list.map((item, idx) => (
                           <tr key={item.id || idx} className="hover:bg-zinc-50 transition-colors">
                              <td className="px-6 py-4 text-center text-zinc-800 font-bold">{idx + 1}</td>
                              <td className="px-6 py-4 font-mono font-bold text-zinc-700">{item.nik || '-'}</td>
                              <td className="px-6 py-4 text-zinc-800 font-black">{item.full_name}</td>
                              <td className="px-6 py-4 text-zinc-700">{item.email}</td>
                              <td className="px-6 py-4 text-center">
                                 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                    item.role === 'admin' || item.role === 'super_admin' ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-green-600 bg-green-50 border-green-100'
                                 }`}>
                                    {item.role === 'admin' || item.role === 'super_admin' ? 'Admin' : 'User'}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-center flex justify-center space-x-2">
                                 <button onClick={() => openEditForm(item)} className="p-2 bg-zinc-50 text-zinc-500 rounded-xl hover:bg-brand-red/10 hover:text-brand-red transition-colors">
                                    <Edit2 size={14} />
                                 </button>
                                 <button onClick={() => handleDelete(item.id)} className="p-2 bg-zinc-50 text-zinc-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors">
                                    <Trash2 size={14} />
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

      return (
         <div className="space-y-10 animate-in fade-in duration-500">
            {renderUserTable(admins, "Data Pengguna Admin")}
            {renderUserTable(users, "Data Pengguna User")}
         </div>
      )
    }

    if (activeTab === 'SOP') {
      return (
         <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm animate-in fade-in duration-500">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-brand-red text-white">
                     <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-center w-16">No</th>
                     <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">Nama Dokumen</th>
                     <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">File SOP</th>
                     <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-center w-48">Tanggal Upload</th>
                     <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-center w-28">Aksi</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-100 font-medium text-zinc-600 text-[13px]">
                  {data.map((item, idx) => (
                     <tr key={item.id || idx} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4 text-center text-zinc-800 font-bold">{idx + 1}</td>
                        <td className="px-6 py-4 text-zinc-800 font-black">{item.title}</td>
                        <td className="px-6 py-4">
                           <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">
                              Unduh / Lihat PDF
                           </a>
                        </td>
                        <td className="px-6 py-4 text-center text-zinc-500 font-bold">
                           {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-6 py-4 text-center flex justify-center space-x-2">
                           <button onClick={() => handleDelete(item.id)} className="p-2 bg-zinc-50 text-zinc-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors">
                              <Trash2 size={14} />
                           </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      )
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-auto py-6 md:h-24 md:py-0 bg-gradient-to-r from-[#E62020] to-[#8B0000] w-full flex items-center justify-between px-6 md:px-10 pr-16 md:pr-10 shrink-0">
        <div className="flex items-center space-x-3 md:space-x-6">
          <div className="text-white border-2 border-white/20 p-1.5 md:p-2 rounded-lg shrink-0">
            <Database className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-white tracking-wide leading-tight">Master Data</h2>
            <p className="text-[10px] md:text-xs font-bold text-white/80 uppercase tracking-widest leading-none mt-0.5 mb-1">PT KAI Commuter</p>
            <p className="text-white/80 text-[10px] md:text-xs lg:text-sm font-medium leading-tight">Kelola Data Stasiun, Shift & Dokumen SOP</p>
          </div>
        </div>
        <button 
          onClick={openAddForm}
          className="bg-white text-brand-red hidden md:flex items-center space-x-2 px-6 py-2.5 rounded-xl font-black shadow-lg hover:bg-zinc-50 transition-colors"
        >
           <Plus size={20} />
           <span>Tambah Data</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-[#F8F9FA] scrollbar-hide">
        <div className="max-w-7xl mx-auto">
          
          {/* Sub Navigation Tabs */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-10 space-y-4 md:space-y-0">
             <div className="flex bg-white shadow-sm border border-zinc-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-hide">
                <button 
                  onClick={() => setActiveTab('STASIUN')}
                  className={`flex-shrink-0 px-4 md:px-8 py-2.5 md:py-3 text-[10px] md:text-sm font-black rounded-lg md:rounded-xl transition-all ${activeTab === 'STASIUN' ? 'bg-[#B71C1C] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  Data Stasiun
                </button>
                <button 
                  onClick={() => setActiveTab('SHIFT')}
                  className={`flex-shrink-0 px-4 md:px-8 py-2.5 md:py-3 text-[10px] md:text-sm font-black rounded-lg md:rounded-xl transition-all ${activeTab === 'SHIFT' ? 'bg-[#B71C1C] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  Data Shift
                </button>
                <button 
                  onClick={() => setActiveTab('USER')}
                  className={`flex-shrink-0 px-4 md:px-8 py-2.5 md:py-3 text-[10px] md:text-sm font-black rounded-lg md:rounded-xl transition-all ${activeTab === 'USER' ? 'bg-[#B71C1C] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  Data Pengguna
                </button>
                <button 
                  onClick={() => setActiveTab('SOP')}
                  className={`flex-shrink-0 px-4 md:px-8 py-2.5 md:py-3 text-[10px] md:text-sm font-black rounded-lg md:rounded-xl transition-all ${activeTab === 'SOP' ? 'bg-[#B71C1C] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  Dokumen SOP
                </button>
             </div>

             <div className="flex w-full md:w-auto space-x-2">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input type="text" placeholder="Cari..." className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 md:py-3.5 text-xs md:text-sm focus:outline-none focus:border-brand-red font-medium text-black shadow-sm" />
                </div>
                <button onClick={openAddForm} className="md:hidden bg-brand-red text-white p-2.5 rounded-xl shadow-lg active:scale-95 transition-transform shrink-0">
                   <Plus size={20} />
                </button>
             </div>
          </div>

          {renderContent()}

        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
          <div className={`bg-white rounded-[32px] p-8 w-full ${activeTab === 'USER' ? 'max-w-2xl' : 'max-w-md'} relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]`}>
             <h3 className="text-2xl font-black text-zinc-800 mb-6">
                {editingId ? 'Edit' : 'Tambah'} Data {activeTab === 'STASIUN' ? 'Stasiun' : activeTab === 'SHIFT' ? 'Kode Dinas' : activeTab === 'USER' ? 'Pengguna' : 'Dokumen SOP'}
             </h3>
             <form onSubmit={handleSave} className="space-y-5">
                {activeTab === 'STASIUN' && (
                   <>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Nama Stasiun</label>
                        <input 
                          required
                          type="text" 
                          value={formData.name || ''}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-5 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all font-medium"
                          placeholder="Contoh: Stasiun Bogor"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Radius Presensi (Meter)</label>
                        <input 
                          required
                          type="number" 
                          value={formData.radius_meters ?? ''}
                          onChange={e => setFormData({...formData, radius_meters: e.target.value === '' ? '' : parseInt(e.target.value)})}
                          className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-5 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all font-medium"
                          placeholder="Contoh: 600"
                        />
                     </div>
                     <div className="space-y-2">
                       <label className="text-sm font-bold text-zinc-700 block mb-1">Lokasi Stasiun Pada Peta</label>
                       <p className="text-[11px] font-medium text-zinc-400 mb-3 leading-tight">Klik pada titik area peta di bawah ini untuk menandai posisi stasiun.</p>
                       <div className="flex space-x-2 mb-3">
                          <input 
                              type="text" 
                              placeholder="Cari nama stasiun..." 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleSearchLocation(); } }}
                              className="flex-1 h-10 bg-white border border-zinc-200 rounded-lg px-3 text-[11px] font-medium text-zinc-700 focus:border-brand-red focus:outline-none"
                          />
                          <button 
                              type="button" 
                              onClick={handleSearchLocation}
                              disabled={isSearchingLocation}
                              className="h-10 bg-zinc-800 text-white rounded-lg px-4 text-xs font-bold hover:bg-zinc-700 transition"
                          >
                             {isSearchingLocation ? 'Mencari...' : 'Cari'}
                          </button>
                       </div>
                       <div className="w-full h-48 rounded-xl overflow-hidden border-2 border-zinc-200">
                          <Map 
                            height={192} 
                            center={formData.latitude ? [formData.latitude, formData.longitude] : [-6.4025, 106.8197]} 
                            zoom={12}
                            onClick={({ latLng }) => setFormData((prev: any) => ({...prev, latitude: latLng[0], longitude: latLng[1]}))}
                          >
                             {formData.latitude && formData.longitude && (
                                <Marker width={40} anchor={[formData.latitude, formData.longitude]} color="#E62020" />
                             )}
                          </Map>
                       </div>
                        <div className="grid grid-cols-2 gap-3 pt-1">
                           <div className="space-y-1">
                             <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Latitude</label>
                             <input 
                               type="number"
                               step="any"
                               required
                               value={formData.latitude !== undefined && formData.latitude !== null ? formData.latitude : ''}
                               onChange={e => setFormData({...formData, latitude: parseFloat(e.target.value) || 0})}
                               className="w-full h-10 bg-zinc-50 border border-zinc-200 rounded-lg px-3 text-xs font-mono font-medium text-zinc-800 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                               placeholder="-6.1234"
                             />
                           </div>
                           <div className="space-y-1">
                             <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Longitude</label>
                             <input 
                               type="number"
                               step="any"
                               required
                               value={formData.longitude !== undefined && formData.longitude !== null ? formData.longitude : ''}
                               onChange={e => setFormData({...formData, longitude: parseFloat(e.target.value) || 0})}
                               className="w-full h-10 bg-zinc-50 border border-zinc-200 rounded-lg px-3 text-xs font-mono font-medium text-zinc-800 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red"
                               placeholder="106.1234"
                             />
                           </div>
                        </div>
                     </div>
                   </>
                )}
                
                {activeTab === 'SHIFT' && (
                   <>
                     <div className="space-y-2">
                       <label className="text-sm font-bold text-zinc-700">Kode Shift</label>
                       <input 
                         required
                         type="text" 
                         value={formData.code || ''}
                         onChange={e => setFormData({...formData, code: e.target.value})}
                         className="w-full h-14 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all font-medium uppercase"
                         placeholder="Contoh: DS5"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-sm font-bold text-zinc-700">Deskripsi Shift</label>
                       <input 
                         type="text" 
                         value={formData.description || ''}
                         onChange={e => setFormData({...formData, description: e.target.value})}
                         className="w-full h-14 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all font-medium"
                         placeholder="Contoh: Dinas Siang"
                       />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-sm font-bold text-zinc-700">Jam Masuk</label>
                           <input 
                             type="time" 
                             value={formData.start_time || ''}
                             onChange={e => setFormData({...formData, start_time: e.target.value})}
                             className="w-full h-14 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all font-medium"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-bold text-zinc-700">Jam Pulang</label>
                           <input 
                             type="time" 
                             value={formData.end_time || ''}
                             onChange={e => setFormData({...formData, end_time: e.target.value})}
                             className="w-full h-14 bg-zinc-50 border border-zinc-200 rounded-2xl px-5 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all font-medium"
                           />
                        </div>
                     </div>
                   </>
                )}
                
                {activeTab === 'USER' && (
                   <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <label className="text-sm font-bold text-zinc-700">NIK / ID</label>
                       <input 
                         type="text" 
                         value={formData.nik || ''}
                         onChange={e => setFormData({...formData, nik: e.target.value})}
                         className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-zinc-800 focus:outline-none focus:border-brand-red transition-all font-medium"
                         placeholder="Contoh: 12345678"
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-sm font-bold text-zinc-700">Role Akses</label>
                       <select 
                         value={formData.role || 'user'}
                         onChange={e => setFormData({...formData, role: e.target.value})}
                         className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-zinc-800 focus:outline-none focus:border-brand-red transition-all font-medium bg-white"
                       >
                          <option value="user">User / Pegawai</option>
                          <option value="admin">Administrator</option>
                       </select>
                     </div>
                     
                     <div className="space-y-2 col-span-2">
                       <label className="text-sm font-bold text-zinc-700">Nama Lengkap</label>
                       <input 
                         required
                         type="text" 
                         value={formData.full_name || ''}
                         onChange={e => setFormData({...formData, full_name: e.target.value})}
                         className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-zinc-800 focus:outline-none focus:border-brand-red transition-all font-medium"
                         placeholder="Masukkan Nama Lengkap"
                       />
                     </div>
                     <div className="space-y-2 col-span-2">
                       <label className="text-sm font-bold text-zinc-700">Email Login</label>
                       <input 
                         required
                         type="email" 
                         value={formData.email || ''}
                         onChange={e => setFormData({...formData, email: e.target.value})}
                         className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-zinc-800 focus:outline-none focus:border-brand-red transition-all font-medium"
                         placeholder="user@example.com"
                       />
                     </div>
                     
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Jabatan / Posisi</label>
                        <input 
                          type="text" 
                          value={formData.position || ''}
                          onChange={e => setFormData({...formData, position: e.target.value})}
                          className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-zinc-800 focus:outline-none focus:border-brand-red transition-all font-medium"
                          placeholder="Contoh: Passenger Service"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Password</label>
                        <input 
                          required={!editingId}
                          type="password" 
                          value={formData.password || ''}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                          className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-zinc-800 focus:outline-none focus:border-brand-red transition-all font-medium"
                          placeholder="Set Password Login"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Kode Dinas</label>
                        <select 
                          value={formData.shift_code || ''}
                          onChange={e => {
                            const code = e.target.value;
                            const matched = allShifts.find(s => s.code === code);
                            setFormData({
                              ...formData,
                              shift_code: code,
                              dinasan_start_time: matched ? matched.start_time?.substring(0, 5) : '',
                              dinasan_end_time: matched ? matched.end_time?.substring(0, 5) : ''
                            });
                          }}
                          className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-zinc-800 focus:outline-none focus:border-brand-red transition-all font-medium bg-white"
                        >
                          <option value="">Pilih Kode Dinas</option>
                          {allShifts.map(s => (
                            <option key={s.code} value={s.code}>{s.code} - {s.description || ''}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-zinc-700">Jam Dinas Masuk</label>
                          <input 
                            type="time" 
                            value={formData.dinasan_start_time ? formData.dinasan_start_time.substring(0, 5) : ''}
                            onChange={e => setFormData({...formData, dinasan_start_time: e.target.value})}
                            className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-zinc-800 focus:outline-none focus:border-brand-red transition-all font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-zinc-700">Jam Dinas Pulang</label>
                          <input 
                            type="time" 
                            value={formData.dinasan_end_time ? formData.dinasan_end_time.substring(0, 5) : ''}
                            onChange={e => setFormData({...formData, dinasan_end_time: e.target.value})}
                            className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-zinc-800 focus:outline-none focus:border-brand-red transition-all font-medium"
                          />
                        </div>
                      </div>
                     
                     <div className="space-y-2 col-span-2">
                        <label className="text-sm font-bold text-zinc-700 block">Stasiun yang Diizinkan (Base Presensi)</label>
                        <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border border-zinc-200 rounded-xl p-3 bg-zinc-50">
                           {allStations.map((station, idx) => {
                              const isChecked = (formData.allowed_stations || []).includes(station.id)
                              return (
                                 <label key={station.id || idx} className="flex items-center space-x-2 text-xs font-bold text-zinc-700 cursor-pointer">
                                    <input 
                                       type="checkbox" 
                                       checked={isChecked}
                                       onChange={(e) => {
                                          const current = formData.allowed_stations || []
                                          if (e.target.checked) {
                                             setFormData({ ...formData, allowed_stations: [...current, station.id] })
                                          } else {
                                             setFormData({ ...formData, allowed_stations: current.filter((id: string) => id !== station.id) })
                                          }
                                       }}
                                       className="accent-brand-red w-4 h-4"
                                    />
                                    <span>{station.name}</span>
                                 </label>
                              )
                           })}
                        </div>
                     </div>
                   </div>
                )}

                {activeTab === 'SOP' && (
                   <>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Nama Dokumen SOP</label>
                        <input 
                          required
                          type="text" 
                          value={formData.title || ''}
                          onChange={e => setFormData({...formData, title: e.target.value})}
                          className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-5 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all font-medium"
                          placeholder="Contoh: SOP Pelayanan Penumpang"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">File Dokumen (PDF)</label>
                        <input 
                          type="file" 
                          accept=".pdf"
                          required={!editingId}
                          onChange={e => setSopFile(e.target.files?.[0] || null)}
                          className="w-full text-zinc-600 focus:outline-none py-2"
                        />
                     </div>
                   </>
                )}

                <div className="flex space-x-3 pt-4">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-4 bg-zinc-100 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-200 transition-colors">Batal</button>
                  <button type="submit" className="flex-1 py-4 bg-brand-red text-white font-bold rounded-2xl shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark transition-all">Simpan</button>
                </div>
             </form>
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
        title="Hapus Data"
        message="Apakah Anda yakin ingin menghapus data ini? Aksi ini tidak dapat dibatalkan."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </div>
  )
}
