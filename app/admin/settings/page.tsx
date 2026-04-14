'use client'

import React, { useState, useEffect } from 'react'
import { Settings, Globe, Image as ImageIcon, Layout, Save, UploadCloud, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatusModal } from '@/components/StatusModal'

export default function SettingsPage() {
  const supabase = createClient()
  const [siteName, setSiteName] = useState('')
  const [description, setDescription] = useState('')
  const [logoUrl, setLogoUrl] = useState('/images/logo splash.png')
  const [faviconUrl, setFaviconUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [modal, setModal] = useState<{isOpen: boolean, status: 'loading' | 'success' | 'error', message: string}>({
    isOpen: false,
    status: 'success',
    message: ''
  })
  
  const logoInputRef = React.useRef<HTMLInputElement>(null)
  const faviconInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('settings').select('*')
    if (error) {
      console.error('Error fetching settings:', error)
    } else {
      const name = data.find(s => s.key === 'site_name')?.value || 'C Presence'
      const desc = data.find(s => s.key === 'description')?.value || 'Sistem Manajemen Kehadiran Pegawai PT KAI Commuter'
      const logo = data.find(s => s.key === 'logo_url')?.value || '/images/logo splash.png'
      const favicon = data.find(s => s.key === 'favicon_url')?.value || ''
      setSiteName(name)
      setDescription(desc)
      setLogoUrl(logo)
      setFaviconUrl(favicon)
    }
    setLoading(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsSaving(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `settings-${type}-${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('Settings').upload(fileName, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('Settings').getPublicUrl(fileName)
      
      if (type === 'logo') setLogoUrl(publicUrl)
      else setFaviconUrl(publicUrl)
    } catch (error: any) {
      setModal({ isOpen: true, status: 'error', message: `Gagal mengunggah ${type}: ${error.message}` })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    const updates = [
      { key: 'site_name', value: siteName, category: 'General' },
      { key: 'description', value: description, category: 'General' },
      { key: 'logo_url', value: logoUrl, category: 'Branding' },
      { key: 'favicon_url', value: faviconUrl, category: 'Branding' }
    ]

    let hasError = false;
    let errorMessage = '';

    for (const item of updates) {
      // Cari apakah key sudah ada
      const { data } = await supabase.from('settings').select('key').eq('key', item.key).maybeSingle()
      
      if (data) {
        // Jika ada, update
        const { error } = await supabase.from('settings').update({ value: item.value, category: item.category }).eq('key', item.key)
        if (error) { hasError = true; errorMessage = error.message; break; }
      } else {
        // Jika tidak ada, insert
        const { error } = await supabase.from('settings').insert([item])
        if (error) { hasError = true; errorMessage = error.message; break; }
      }
    }
    
    if (hasError) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal menyimpan perubahan: ' + errorMessage })
    } else {
      setModal({ isOpen: true, status: 'success', message: 'Pengaturan berhasil disimpan!' })
    }
    setIsSaving(false)
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
           <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
           <p className="font-bold text-zinc-500">Memuat Pengaturan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-24 bg-gradient-to-r from-[#E62020] to-[#8B0000] w-full flex items-center px-10 shrink-0">
        <div className="flex items-center space-x-6">
          <div className="text-white border-2 border-white/20 p-2 rounded-lg">
            <Settings size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide leading-tight">Pengaturan Sistem</h2>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-12">
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
          
          {/* General Settings */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
             <div className="bg-zinc-50 px-8 py-4 border-b border-zinc-100 flex items-center space-x-3">
                <Globe size={20} className="text-[#B71C1C]" />
                <h3 className="text-lg font-black text-zinc-800 uppercase tracking-tight">Konfigurasi Website</h3>
             </div>
             <div className="p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-sm font-black text-zinc-400 uppercase tracking-widest">Nama Website</label>
                   <input 
                     type="text" 
                     value={siteName}
                     onChange={(e) => setSiteName(e.target.value)}
                     className="w-full border-b-2 border-zinc-100 py-3 text-xl font-black text-zinc-800 focus:border-[#B71C1C] focus:outline-none transition-all"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-black text-zinc-400 uppercase tracking-widest">Meta Deskripsi (SEO)</label>
                   <textarea 
                     value={description}
                     onChange={(e) => setDescription(e.target.value)}
                     rows={3}
                     className="w-full border border-zinc-100 rounded-xl p-4 text-sm font-medium text-zinc-600 focus:border-[#B71C1C] focus:outline-none transition-all italic bg-zinc-50/50"
                   />
                </div>
             </div>
          </div>

          {/* Branding Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Logo Upload */}
             <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-zinc-50 px-8 py-4 border-b border-zinc-100 flex items-center space-x-3">
                   <ImageIcon size={20} className="text-[#B71C1C]" />
                   <h3 className="text-lg font-black text-zinc-800 uppercase tracking-tight">Logo Utama</h3>
                </div>
                <div className="p-8 flex flex-col items-center">
                   <input type="file" ref={logoInputRef} onChange={(e) => handleImageUpload(e, 'logo')} className="hidden" accept="image/*" />
                   <div 
                     onClick={() => logoInputRef.current?.click()}
                     className="w-full h-48 border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition group mb-6 overflow-hidden relative"
                   >
                      <img src={logoUrl} className="w-40 h-40 object-contain opacity-80 group-hover:scale-110 transition-transform" alt="Preview Logo" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                         <UploadCloud size={32} className="text-white" />
                      </div>
                   </div>
                   <p className="text-[10px] font-bold text-zinc-400 text-center uppercase tracking-widest mb-4">Rekomendasi: 512x512px (PNG/SVG)</p>
                   <div className="flex space-x-2">
                      <button onClick={() => logoInputRef.current?.click()} className="bg-[#B71C1C] text-white px-6 py-2 rounded-full text-xs font-black shadow-lg">Ganti Logo</button>
                      <button onClick={() => setLogoUrl('')} className="bg-zinc-100 text-zinc-400 p-2 rounded-full hover:bg-red-50 hover:text-red-600 transition"><Trash2 size={16}/></button>
                   </div>
                </div>
             </div>

             {/* Favicon Upload */}
             <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-zinc-50 px-8 py-4 border-b border-zinc-100 flex items-center space-x-3">
                   <Layout size={20} className="text-[#B71C1C]" />
                   <h3 className="text-lg font-black text-zinc-800 uppercase tracking-tight">Favicon</h3>
                </div>
                <div className="p-8 flex flex-col items-center">
                   <input type="file" ref={faviconInputRef} onChange={(e) => handleImageUpload(e, 'favicon')} className="hidden" accept="image/*" />
                   <div 
                     onClick={() => faviconInputRef.current?.click()}
                     className="w-24 h-24 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center bg-zinc-50 cursor-pointer hover:bg-zinc-100 transition mb-6 shadow-inner overflow-hidden"
                   >
                      {faviconUrl ? (
                         <img src={faviconUrl} className="w-full h-full object-contain" alt="Favicon" />
                      ) : (
                         <div className="w-12 h-12 bg-[#B71C1C] rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg">
                            C
                         </div>
                      )}
                   </div>
                   <p className="text-[10px] font-bold text-zinc-400 text-center uppercase tracking-widest mb-4">Rekomendasi: 32x32px (ICO/PNG)</p>
                   <button onClick={() => faviconInputRef.current?.click()} className="bg-[#B71C1C] text-white px-6 py-2 rounded-full text-xs font-black shadow-lg">Upload Favicon</button>
                </div>
             </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end pt-6">
             <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-[#B71C1C] to-[#8B0000] text-white px-12 py-3 rounded-xl font-black text-lg flex items-center space-x-3 shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
             >
                {isSaving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
             </button>
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
