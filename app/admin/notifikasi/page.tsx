'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Mail, X, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function NotifikasiAdminPage() {
  const supabase = createClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedNotif, setSelectedNotif] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        users (
          full_name,
          nik,
          position,
          stations (name)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching notifications:', error)
    } else {
      // Menyesuaikan data agar cocok dengan UI yang sudah ada
      const mapped = data.map(item => ({
        id: item.id,
        day: new Date(item.created_at).toLocaleDateString('id-ID', { weekday: 'long' }),
        nama: item.users?.full_name || 'User',
        idPegawai: item.users?.nik || '-',
        posisi: item.users?.position || '-',
        tipe: item.title,
        waktu: new Date(item.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB',
        relatif: 'Baru', // Bisa dihitung jika perlu
        stasiun: item.users?.stations?.name || '-',
        message: item.message
      }))
      setNotifications(mapped)
    }
    setLoading(false)
  }

  const openModal = (notif: any) => {
    setSelectedNotif(notif)
    setIsModalOpen(true)
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-24 bg-gradient-to-r from-[#E62020] to-[#8B0000] w-full flex items-center px-10 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="text-white p-2">
            <Bell size={40} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-wide leading-tight">Notifikasi Presence</h2>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-4xl mx-auto">
          
          <div className="flex justify-between items-center mb-8">
             <h3 className="text-lg font-bold text-brand-red">Hari ini</h3>
             <button className="text-brand-red font-bold text-sm hover:underline">Lihat semuanya</button>
          </div>

          <div className="space-y-4">
             {notifications.map((notif) => (
               <div 
                 key={notif.id}
                 onClick={() => openModal(notif)}
                 className="bg-white border border-zinc-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-start space-x-4"
               >
                  <div className="mt-1">
                     <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-red-50 group-hover:text-brand-red transition-colors">
                        <Mail size={20} />
                     </div>
                  </div>
                  
                  <div className="flex-1">
                     <div className="flex items-center space-x-2 text-zinc-300 text-[10px] font-bold mb-1">
                        <span className="bg-zinc-100 px-2 py-0.5 rounded uppercase tracking-wider">{notif.day}</span>
                     </div>
                     <h4 className="text-sm font-bold text-zinc-800 mb-1 leading-tight">
                        {notif.nama} ({notif.idPegawai}) {notif.posisi} <br/>
                        <span className="text-zinc-600">{notif.tipe}</span>
                     </h4>
                     <div className="flex items-center text-[10px] font-bold text-zinc-400">
                        <span>{notif.waktu}</span>
                        <ChevronRight size={12} className="ml-1" />
                     </div>
                  </div>

                  <div className="text-[10px] font-bold text-zinc-300 mt-1">
                     {notif.relatif}
                  </div>
               </div>
             ))}
          </div>

        </div>
      </div>

      {/* Notif Detail Modal */}
      {isModalOpen && selectedNotif && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 p-8">
              
              {/* Header Logos */}
              <div className="flex justify-between items-center mb-10 pb-4 border-b border-zinc-100">
                 <div className="flex flex-col">
                    <div className="flex items-center space-x-1">
                       <span className="text-xl font-black text-[#003FE1] italic">KAI</span>
                       <span className="text-[10px] font-bold text-red-600 uppercase mt-1">Commuter</span>
                    </div>
                 </div>
                 <div className="text-center flex-1">
                    <h5 className="text-sm font-black text-zinc-800 tracking-tighter uppercase">{selectedNotif.tipe}</h5>
                 </div>
                 <div className="flex flex-col items-center">
                    <div className="bg-[#B71C1C] p-1.5 rounded-sm text-white shadow-md">
                       <Bell size={18} />
                    </div>
                    <span className="text-[9px] font-black text-[#B71C1C] mt-1 uppercase">C Presence</span>
                 </div>
              </div>

              {/* Body Text */}
              <div className="space-y-6 text-[13px] font-bold text-zinc-800 leading-relaxed">
                 <p className="border-l-4 border-[#B71C1C] pl-3 py-1 bg-red-50/50 rounded-r-md">
                    {selectedNotif.tipe.includes('TELAT') 
                       ? 'Selamat pagi, Admin Commuter, terdapat keterlambatan pada' 
                       : 'Selamat pagi, Admin Commuter, terdapat pengajuan baru dari'}
                 </p>
                 
                 <div className="space-y-3 px-1">
                    <div className="flex border-b border-zinc-50 pb-2">
                       <span className="w-36 text-zinc-500">Nama</span>
                       <span className="w-4 text-zinc-400">:</span>
                       <span className="flex-1 font-black">{selectedNotif.nama}</span>
                    </div>
                    <div className="flex border-b border-zinc-50 pb-2">
                       <span className="w-36 text-zinc-500">ID</span>
                       <span className="w-4 text-zinc-400">:</span>
                       <span className="flex-1 font-black">{selectedNotif.idPegawai}</span>
                    </div>
                    <div className="flex border-b border-zinc-50 pb-2">
                       <span className="w-36 text-zinc-500">Petugas Stasiun</span>
                       <span className="w-4 text-zinc-400">:</span>
                       <span className="flex-1 font-black">{selectedNotif.posisi} {selectedNotif.stasiun}</span>
                    </div>
                     {selectedNotif.tipe.includes('TELAT') ? (
                       <>
                         <div className="flex border-b border-zinc-50 pb-2">
                            <span className="w-36 text-zinc-500">Hari dan Jam dinas</span>
                            <span className="w-4 text-zinc-400">:</span>
                            <span className="flex-1 font-black">{selectedNotif.jamDinas}</span>
                         </div>
                         <div className="flex border-b border-zinc-50 pb-2">
                            <span className="w-36 text-zinc-500">Telat</span>
                            <span className="w-4 text-zinc-400">:</span>
                            <span className="flex-1 font-black text-[#B71C1C]">{selectedNotif.telatMin} pada jam {selectedNotif.telatJam}</span>
                         </div>
                       </>
                     ) : (
                       <div className="flex border-b border-zinc-50 pb-2 leading-relaxed">
                          <span className="w-36 text-zinc-500">Keterangan</span>
                          <span className="w-4 text-zinc-400">:</span>
                          <span className="flex-1 font-black">{selectedNotif.message}</span>
                       </div>
                     )}
                 </div>
              </div>

              {/* Footer Button */}
              <div className="mt-10 flex justify-end">
                 <button 
                   onClick={() => setIsModalOpen(false)}
                   className="bg-[#B71C1C] text-white px-10 py-2 rounded-lg text-xs font-black shadow-lg shadow-red-200 hover:bg-red-800 transition-all hover:scale-105 active:scale-95"
                 >
                    Tutup
                 </button>
              </div>

           </div>
        </div>
      )}

    </div>
  )
}
