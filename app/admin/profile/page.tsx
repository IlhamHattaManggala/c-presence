'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { User, Camera, ChevronLeft, X, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatusModal } from '@/components/StatusModal'

export default function AdminProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [adminData, setAdminData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    nik: '',
    position: '',
    password: ''
  })
  const [modal, setModal] = useState<{ isOpen: boolean, status: 'success' | 'error' | 'loading', message: string }>({
    isOpen: false,
    status: 'loading',
    message: ''
  })

  useEffect(() => {
    const getAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setAdminData(profile)
          setEditForm({
            full_name: profile.full_name || '',
            email: profile.email || '',
            nik: profile.nik || '',
            position: profile.position || '',
            password: ''
          })
        }
      }
      setLoading(false)
    }
    getAdmin()
  }, [])

  const profileData = {
    nama: adminData?.full_name || 'Admin Commuter',
    email: adminData?.email || 'admin@kci.id',
    nik: adminData?.nik || '-',
    unit: adminData?.position || 'System Administrator'
  }

  const handleSave = async () => {
    try {
      setSaveLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update Auth if Email or Password changed
      if (editForm.email !== adminData.email || (editForm.password && editForm.password.trim().length > 0)) {
        const authUpdates: any = {}
        if (editForm.email !== adminData.email) authUpdates.email = editForm.email
        if (editForm.password && editForm.password.trim().length > 0) authUpdates.password = editForm.password
        
        const { error: authError } = await supabase.auth.updateUser(authUpdates)
        if (authError) throw authError
      }

      // Update Database
      const { error: dbError } = await supabase
        .from('users')
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          nik: editForm.nik,
          position: editForm.position
        })
        .eq('id', user.id)

      if (dbError) throw dbError

      setAdminData({ ...adminData, ...editForm })
      setIsEditModalOpen(false)
      setModal({ isOpen: true, status: 'success', message: 'Profil berhasil diperbarui!' })
    } catch (err: any) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal menyimpan: ' + err.message })
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white relative">
      {/* Header */}
      <div className="h-28 bg-[#E62020] w-full flex items-center px-10 shrink-0">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.back()}
            className="text-white hover:bg-white/10 p-2 rounded-full transition-colors mr-2"
          >
            <ChevronLeft size={28} />
          </button>
          <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center text-white">
            <User size={28} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Profile Admin PT. Kereta Commuter Indonesia
          </h2>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center">
        <div className="w-full max-w-5xl bg-white rounded-3xl shadow-lg border border-zinc-100 p-10 flex flex-col items-center">
          
          {/* Profile Picture Section */}
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-400 overflow-hidden border-4 border-white shadow-md">
              <User size={64} fill="currentColor" />
            </div>
            <button className="absolute bottom-0 right-0 w-10 h-10 bg-slate-700 rounded-full border-4 border-white flex items-center justify-center text-white shadow-lg hover:bg-slate-800 transition">
              <Camera size={18} />
            </button>
          </div>

          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-zinc-800">{profileData.nama}</h3>
            <p className="text-zinc-500 font-medium">{profileData.email}</p>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="mt-2 text-brand-red text-sm font-bold hover:underline"
            >
              Edit Profil
            </button>
          </div>

          {/* Form Details */}
          <div className="w-full space-y-8 max-w-3xl mx-auto">
            <div className="border-b border-zinc-100 pb-5 flex justify-between items-center">
               <span className="text-sm font-medium text-zinc-400">Nama</span>
               <span className="text-sm font-bold text-zinc-700">{profileData.nama}</span>
            </div>
            
            <div className="border-b border-zinc-100 pb-5 flex justify-between items-center">
               <span className="text-sm font-medium text-zinc-400">Email</span>
               <span className="text-sm font-bold text-zinc-700">{profileData.email}</span>
            </div>

            <div className="border-b border-zinc-100 pb-5 flex justify-between items-center">
               <span className="text-sm font-medium text-zinc-400">Password</span>
               <span className="text-sm font-bold text-zinc-700">************</span>
            </div>

            <div className="border-b border-zinc-100 pb-5 flex justify-between items-center">
               <span className="text-sm font-medium text-zinc-400">ID/NIK</span>
               <span className="text-sm font-bold text-zinc-700">{profileData.nik}</span>
            </div>

            <div className="border-b border-zinc-100 pb-5 flex justify-between items-center">
               <span className="text-sm font-medium text-zinc-400">Unit Kerja</span>
               <span className="text-sm font-bold text-zinc-700">{profileData.unit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
            onClick={() => setIsEditModalOpen(false)}
          ></div>
          <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="bg-brand-red p-6 flex justify-between items-center">
               <h3 className="text-lg font-bold text-white">Edit Informasi Profil</h3>
               <button 
                 onClick={() => setIsEditModalOpen(false)}
                 className="text-white/80 hover:text-white transition"
               >
                 <X size={24} />
               </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-8 space-y-5">
               <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3 text-sm font-medium text-zinc-800 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition"
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Email Perusahaan</label>
                  <input 
                    type="email" 
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3 text-sm font-medium text-zinc-800 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition"
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">ID / NIK</label>
                    <input 
                      type="text" 
                      value={editForm.nik}
                      onChange={(e) => setEditForm({...editForm, nik: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3 text-sm font-medium text-zinc-800 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Password Baru</label>
                    <input 
                      type="password" 
                      placeholder="Min. 8 Karakter"
                      value={editForm.password}
                      onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                      autoComplete="new-password"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3 text-sm font-medium text-zinc-800 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition"
                    />
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Unit Kerja</label>
                  <select 
                    value={editForm.position}
                    onChange={(e) => setEditForm({...editForm, position: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-3 text-sm font-medium text-zinc-800 focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition appearance-none"
                  >
                     <option value="System Administrator">System Administrator</option>
                     <option value="Announcer Senior">Announcer Senior</option>
                     <option value="Passenger Service Station Office">Passenger Service Station Office</option>
                  </select>
               </div>
            </div>

            {/* Modal Footer */}
            <div className="p-8 pt-0 flex space-x-3">
               <button 
                 onClick={() => setIsEditModalOpen(false)}
                 className="flex-1 py-3.5 rounded-2xl border border-zinc-200 text-zinc-600 font-bold hover:bg-zinc-50 transition"
               >
                 Batal
               </button>
               <button 
                 onClick={handleSave}
                 disabled={saveLoading}
                 className="flex-[2] py-3.5 rounded-2xl bg-brand-red text-white font-bold hover:bg-red-700 transition shadow-lg shadow-brand-red/20 flex items-center justify-center space-x-2 disabled:opacity-50"
               >
                 <Save size={18} />
                 <span>{saveLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
               </button>
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
