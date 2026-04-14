'use client'

import React, { useState, useEffect } from 'react'
import { Database, Plus, Trash2, Edit2, MapPin, Clock, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatusModal } from '@/components/StatusModal'
import { Map, Marker } from 'pigeon-maps'

type TabType = 'STASIUN' | 'SHIFT'

export default function MasterDataPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<TabType>('STASIUN')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [modal, setModal] = useState<{isOpen: boolean, status: 'loading' | 'success' | 'error', message: string}>({
    isOpen: false, status: 'success', message: ''
  })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)

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
        alert('Lokasi tidak ditemukan di peta. Coba kata kunci yang lebih spesifik.')
      }
    } catch (e) {
      console.error('Search error:', e)
    } finally {
      setIsSearchingLocation(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    const table = activeTab === 'STASIUN' ? 'stations' : 'shifts'
    const orderCol = activeTab === 'STASIUN' ? 'id' : 'code'
    const { data: result, error } = await supabase.from(table).select('*').order(orderCol, { ascending: true })
    
    if (error) {
       console.error('Fetch error:', error.message || error)
       if (error.code === '42P01') {
          setModal({ isOpen: true, status: 'error', message: `Tabel '${table}' belum dibuat di Supabase. Silakan buat tabelnya terlebih dahulu.` })
       }
    } else {
       setData(result || [])
    }
    setLoading(false)
  }

  const handleDelete = async (idOrCode: any) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return
    const table = activeTab === 'STASIUN' ? 'stations' : 'shifts'
    const pkCol = activeTab === 'STASIUN' ? 'id' : 'code'
    const { error } = await supabase.from(table).delete().eq(pkCol, idOrCode)
    
    if (error) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal menghapus: ' + error.message })
    } else {
      setModal({ isOpen: true, status: 'success', message: 'Data berhasil dihapus!' })
      fetchData()
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setModal({ isOpen: true, status: 'loading', message: 'Menyimpan...' })
    
    const table = activeTab === 'STASIUN' ? 'stations' : 'shifts'
    const pkCol = activeTab === 'STASIUN' ? 'id' : 'code'
    let error;

    if (editingId) {
      const res = await supabase.from(table).update(formData).eq(pkCol, editingId)
      error = res.error
    } else {
      const res = await supabase.from(table).insert([formData])
      error = res.error
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
    setFormData(activeTab === 'STASIUN' ? { name: '', latitude: -6.4025, longitude: 106.8197 } : { code: '', description: '', start_time: '', end_time: '' })
    setSearchQuery('')
    setIsFormOpen(true)
  }

  const openEditForm = (item: any) => {
    const pkVal = activeTab === 'STASIUN' ? item.id : item.code
    setEditingId(pkVal)
    setFormData(item)
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

    return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {data.map((item) => (
             <div key={item.id || item.code} className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-zinc-50 to-transparent -z-10 rounded-bl-full opacity-50"></div>
                
                <div className="flex items-start justify-between mb-4">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeTab === 'STASIUN' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                      {activeTab === 'STASIUN' ? <MapPin size={24} /> : <Clock size={24} />}
                   </div>
                   <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditForm(item)} className="p-2 bg-zinc-50 text-zinc-500 rounded-xl hover:bg-brand-red/10 hover:text-brand-red transition-colors">
                         <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(activeTab === 'STASIUN' ? item.id : item.code)} className="p-2 bg-zinc-50 text-zinc-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors">
                         <Trash2 size={16} />
                      </button>
                   </div>
                </div>
                
                {activeTab === 'STASIUN' ? (
                   <div>
                      <h3 className="text-xl font-black text-zinc-800 mb-2">{item.name}</h3>
                      <div className="flex items-center space-x-2 bg-zinc-50 border border-zinc-100 rounded-lg py-1.5 px-3 w-fit">
                         <MapPin size={12} className="text-zinc-400" />
                         <span className="text-[10px] font-bold text-zinc-500">
                           {item.latitude && item.longitude ? `${item.latitude}, ${item.longitude}` : 'Koordinat Belum Diatur'}
                         </span>
                      </div>
                   </div>
                ) : (
                   <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-3 py-1 bg-zinc-800 text-white rounded-lg text-xs font-black">{item.code}</span>
                        <h3 className="text-lg font-black text-zinc-800">{item.description || '-'}</h3>
                      </div>
                      <p className="text-sm font-bold text-zinc-500 flex items-center space-x-2 pt-2 border-t border-zinc-100 mt-4">
                         <Clock size={14} />
                         <span>{item.start_time ? String(item.start_time).substring(0,5) : '00:00'} - {item.end_time ? String(item.end_time).substring(0,5) : '00:00'}</span>
                      </p>
                   </div>
                )}
             </div>
          ))}
       </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-24 bg-gradient-to-r from-[#E62020] to-[#8B0000] w-full flex items-center justify-between px-10 shrink-0">
        <div className="flex items-center space-x-6">
          <div className="text-white border-2 border-white/20 p-2 rounded-lg">
            <Database size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide leading-tight">Master Data</h2>
            <p className="text-white/80 text-sm font-medium">Kelola Data Stasiun &amp; Shift (Kode Dinas)</p>
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
      <div className="flex-1 overflow-y-auto p-12 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto">
          
          {/* Sub Navigation Tabs */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 space-y-4 md:space-y-0">
             <div className="flex bg-white shadow-sm border border-zinc-100 p-1.5 rounded-2xl w-full md:w-auto">
                <button 
                  onClick={() => setActiveTab('STASIUN')}
                  className={`flex-1 md:flex-none px-10 py-3 text-sm font-black rounded-xl transition-all ${activeTab === 'STASIUN' ? 'bg-[#B71C1C] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  Data Stasiun
                </button>
                <button 
                  onClick={() => setActiveTab('SHIFT')}
                  className={`flex-1 md:flex-none px-10 py-3 text-sm font-black rounded-xl transition-all ${activeTab === 'SHIFT' ? 'bg-[#B71C1C] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  Data Kode Dinas (Shift)
                </button>
             </div>

             <div className="relative w-full md:w-72">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                 <input type="text" placeholder="Cari data..." className="w-full bg-white border border-zinc-200 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-brand-red font-medium text-zinc-700 shadow-sm" />
             </div>
          </div>

          {renderContent()}

        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsFormOpen(false)}></div>
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
             <h3 className="text-2xl font-black text-zinc-800 mb-6">
               {editingId ? 'Edit' : 'Tambah'} Data {activeTab === 'STASIUN' ? 'Stasiun' : 'Kode Dinas'}
             </h3>
             <form onSubmit={handleSave} className="space-y-5">
                {activeTab === 'STASIUN' ? (
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
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Latitude</span>
                            <div className="w-full h-9 bg-zinc-100 border border-zinc-200 rounded-lg px-3 flex items-center shadow-inner">
                              <span className="text-xs font-mono font-medium text-zinc-600">{formData.latitude || '-'}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Longitude</span>
                            <div className="w-full h-9 bg-zinc-100 border border-zinc-200 rounded-lg px-3 flex items-center shadow-inner">
                              <span className="text-xs font-mono font-medium text-zinc-600">{formData.longitude || '-'}</span>
                            </div>
                          </div>
                       </div>
                     </div>
                   </>
                ) : (
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
    </div>
  )
}
