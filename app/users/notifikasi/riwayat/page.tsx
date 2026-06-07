'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'

export default function RiwayatPage() {
  const router = useRouter()
  const supabase = createClient()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Fetch notifications with type APPROVAL_UPDATE for this user
          const { data: notificationsData, error: notifError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'APPROVAL_UPDATE')
            .order('created_at', { ascending: false })

          if (notifError) throw notifError

          // Fetch corresponding approval requests for this user
          const { data: approvalData, error: approvalError } = await supabase
            .from('approval_requests')
            .select('*')
            .eq('user_id', user.id)

          if (approvalError) throw approvalError

          // Map notifications to approval requests using reference_id
          const mapped = (notificationsData || []).map(notif => {
            const req = (approvalData || []).find(r => r.id === notif.reference_id)
            if (!req) return null
            return {
              id: req.id,
              type: req.type,
              status: req.status,
              created_at: notif.created_at, // Use notification created date
              notification_id: notif.id,
              is_read: notif.is_read
            }
          }).filter(Boolean)

          setRequests(mapped)
        }
      } catch (err) {
        console.error('Error fetching riwayat data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRequests()
  }, [])

  return (
    <div className="bg-white min-h-screen pb-32">
      {/* Header Area */}
      <div className="bg-brand-red pt-12 pb-12 w-full relative">
        <div className="max-w-4xl mx-auto flex items-center px-4 w-full justify-center space-x-2">
           <Bell className="text-white" size={30} />
           <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Notifikasi</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
         <h2 className="text-sm font-bold text-zinc-800 mb-4 px-2">Info Riwayat Pengajuan</h2>

         {/* History List */}
         <div className="space-y-3">
            {loading ? (
               <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
               </div>
            ) : requests.length === 0 ? (
               <p className="text-center py-10 text-sm text-zinc-400">Belum ada riwayat pengajuan.</p>
            ) : (
              requests.map((item) => (
                <div 
                  key={item.notification_id}
                  onClick={() => {
                    const routeMap: Record<string, string> = {
                      'DINAS_LUAR': '/users/dokumen/dinas-luar',
                      'IZIN': '/users/dokumen/izin',
                      'UBAH_JADWAL': '/users/dokumen/ubah-jadwal'
                    }
                    if (routeMap[item.type]) {
                      router.push(`${routeMap[item.type]}?id=${item.id}&notificationId=${item.notification_id}`)
                    }
                  }}
                  className={`bg-white border ${!item.is_read ? 'border-brand-red/80 bg-red-50/10' : 'border-brand-red/40'} rounded-xl p-4 flex flex-col cursor-pointer hover:bg-zinc-50 shadow-sm transition relative`}
                >
                   {!item.is_read && (
                      <div className="absolute top-4 right-4 flex items-center space-x-1 bg-brand-red/10 px-2 py-0.5 rounded-full">
                         <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse"></span>
                         <span className="text-[8px] font-bold text-brand-red uppercase tracking-wider">Baru</span>
                      </div>
                   )}
                   <h3 className={`text-sm font-bold text-zinc-900 mb-1`}>
                      Status Pengajuan {item.type.replace('_', ' ').toLowerCase()}...
                   </h3>
                   <span className={`text-[11px] font-bold mb-1 ${item.status === 'Disetujui' ? 'text-green-600' : item.status === 'Proses' ? 'text-orange-500' : 'text-brand-red'}`}>
                      {item.status} {item.status === 'Disetujui' && ' (Klik untuk Cetak)'}
                   </span>
                   <p className="text-[10px] text-zinc-400 font-medium">
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                   </p>
                </div>
              ))
            )}
         </div>
      </div>

      <BottomNav />
    </div>
  )
}
