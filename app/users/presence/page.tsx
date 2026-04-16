'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, MapPin, Clock, Camera as CameraIcon, SwitchCamera, Zap, AlertCircle } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'
import { Map, Marker, Overlay } from 'pigeon-maps'
import { createClient } from '@/lib/supabase/client'

// Radius dan koordinat stasiun sekarang dinamis dari database
// Tidak ada lagi hardcode atau bypass radius

// Hitung jarak (Haversine formula dalam meter)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; 
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

import { StatusModal } from '@/components/StatusModal'

export default function PresencePage() {
  const router = useRouter()
  const supabase = createClient()
  const [userData, setUserData] = useState<any>(null)
  const [todayAttendance, setTodayAttendance] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTime, setCurrentTime] = useState('00.00')
  const [currentDate, setCurrentDate] = useState('01 Jan')
  
  const [modal, setModal] = React.useState<{ isOpen: boolean, status: 'success' | 'error' | 'loading', message: string }>({
    isOpen: false,
    status: 'loading',
    message: ''
  })

  // State untuk semua stasiun dan stasiun terdekat
  const [allStations, setAllStations] = useState<any[]>([])
  const [nearestStation, setNearestStation] = useState<any | null>(null)

  // Geolocation states
  const [userLat, setUserLat] = useState<number | null>(null)
  const [userLng, setUserLng] = useState<number | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)

  // View state
  const [viewMode, setViewMode] = useState<'map' | 'camera'>('map')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Waktu realtime
    const updateDateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }).replace(':', '.'))
      setCurrentDate(now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))
    }
    updateDateTime()
    const timer = setInterval(updateDateTime, 60000)

    // Dapatkan Lokasi Pengguna
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLat(latitude)
          setUserLng(longitude)
          setIsGettingLocation(false)
          setLocationError(null)
        },
        (error) => {
          console.warn("Peringatan geolokasi:", error.message)
          setLocationError('Gagal mengakses lokasi. Pastikan GPS aktif dan Anda memberikan izin lokasi pada browser.')
          setIsGettingLocation(false)
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }
      )

      // Fetch Attendance & Semua Stasiun
      const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single()
          if (profile) setUserData(profile)

          // Ambil semua stasiun untuk cek stasiun terdekat
          const { data: stations } = await supabase
            .from('stations')
            .select('*')
          if (stations) setAllStations(stations)

          const today = new Date().toLocaleDateString('en-CA')
          const { data: attendance } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .order('clock_in', { ascending: false })
            .limit(1)
            .maybeSingle()
          setTodayAttendance(attendance)
        }
      }
      fetchData()

      return () => {
        clearInterval(timer)
        navigator.geolocation.clearWatch(watchId)
      }
    } else {
      setLocationError('Browser Anda tidak mendukung geolokasi.')
      setIsGettingLocation(false)
      return () => clearInterval(timer)
    }
  }, [])

  // Effect: cari stasiun TERDEKAT dan cek apakah dalam radius-nya
  useEffect(() => {
    if (userLat !== null && userLng !== null && allStations.length > 0) {
      // Hitung jarak ke setiap stasiun
      let closest: any = null
      let closestDist = Infinity

      for (const station of allStations) {
        const dist = getDistance(userLat, userLng, station.latitude, station.longitude)
        if (dist < closestDist) {
          closestDist = dist
          closest = station
        }
      }

      setNearestStation(closest)
      setDistance(Math.round(closestDist))

      // Pindah ke kamera jika dalam radius stasiun terdekat
      if (closest && closestDist <= (closest.radius_meters || 100)) {
        setViewMode('camera')
      }
    }
  }, [userLat, userLng, allStations])

  const [flash, setFlash] = useState(false)

  const handlePresence = async () => {
    if (isSubmitting) return
    
    // Syarat: Data user harus ada di tabel
    if (!userData) {
      setModal({ 
        isOpen: true, 
        status: 'error', 
        message: 'Data profil Anda tidak ditemukan. Pastikan Anda sudah terdaftar di sistem dengan benar.' 
      })
      return
    }

    setIsSubmitting(true)
    setFlash(true) // Efek jepretan kamera
    setTimeout(() => setFlash(false), 150)

    setModal({ isOpen: true, status: 'loading', message: 'Sedang mencatat data presensi Anda...' })

    const now = new Date()
    const today = now.toLocaleDateString('en-CA') // Format lokal YYYY-MM-DD
    const timeOnly = now.toLocaleTimeString('en-GB') // Format HH:mm:ss

    try {
      if (todayAttendance) {
        if (todayAttendance.clock_out) {
          setModal({ isOpen: true, status: 'error', message: 'Anda sudah melakukan presensi pulang hari ini.' })
          return
        }
        
        // Clock Out
        const { error } = await supabase
          .from('attendance')
          .update({ clock_out: timeOnly })
          .eq('id', todayAttendance.id)
        
        if (error) throw error
        setModal({ isOpen: true, status: 'success', message: 'Presensi pulang berhasil dicatat!' })
      } else {
        // Clock In
        let status = 'Hadir'
        
        // 1. Dapatkan Jam Masuk dari Shift User
        if (userData.shift_code) {
          const { data: shiftData } = await supabase
            .from('shifts')
            .select('start_time')
            .eq('code', userData.shift_code)
            .single()

          if (shiftData && shiftData.start_time) {
            // Bandingkan waktu sekarang dengan start_time (format HH:mm:ss)
            const [shiftHour, shiftMin] = shiftData.start_time.split(':').map(Number)
            const nowHour = now.getHours()
            const nowMin = now.getMinutes()

            if (nowHour > shiftHour || (nowHour === shiftHour && nowMin > shiftMin)) {
              status = 'Telat'
            }
          }
        } else {
          // Fallback jika tidak ada kode shift (default jam 08:00)
          if (now.getHours() >= 8) status = 'Telat'
        }

        const { error } = await supabase
          .from('attendance')
          .insert({
            user_id: userData.id,
            date: today,
            clock_in: timeOnly,
            status: status
          })
        
        if (error) throw error

        if (status === 'Telat') {
          await supabase.from('notifications').insert({
            user_id: userData.id,
            title: 'Keterlambatan Presensi',
            message: `${userData.full_name} melakukan presensi terlambat pada jam ${now.toLocaleTimeString()}`,
            type: 'warning'
          })
        }

        setModal({ isOpen: true, status: 'success', message: `Presensi masuk berhasil! Status: ${status}` })
      }
    } catch (error: any) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal presensi: ' + error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setModal({ ...modal, isOpen: false })
    if (modal.status === 'success' || modal.message.includes('sudah melakukan presensi')) {
      router.push('/users/dashboard')
    }
  }

  // Efek untuk menyalakan kamera asli web saat masuk mode kamera
  useEffect(() => {
    if (viewMode === 'camera' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        })
        .catch(err => {
          console.warn("Error accessing camera: ", err)
        })
    }
    
    // Cleanup stream
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream
         const tracks = stream.getTracks()
         tracks.forEach(track => track.stop())
      }
    }
  }, [viewMode])

  if (viewMode === 'camera') {
    return (
      <div className="bg-black min-h-screen flex flex-col relative overflow-hidden">
        {/* Camera Header */}
        <div className="bg-brand-red pt-12 pb-4 px-6 relative z-30">
          <button 
            onClick={() => router.back()}
            className="text-white p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
        </div>

        {/* Camera Viewfinder */}
        <div className="flex-1 relative bg-zinc-900 flex items-center justify-center overflow-hidden">
           {/* Real Webcam Video */}
           <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
           />
           {/* Fallback pattern if camera fails */}
           <div className="absolute inset-0 border-2 border-dashed border-white/20 pointer-events-none rounded-sm m-4 z-10"></div>
           
           {/* Viewfinder Target Frame (Red Corners) */}
           <div className="absolute inset-x-10 inset-y-20 pointer-events-none z-10 flex flex-col justify-between">
              <div className="flex justify-between w-full h-16">
                 <div className="w-12 h-full border-t-[6px] border-l-[6px] border-[#D32F2F] rounded-tl-lg"></div>
                 <div className="w-12 h-full border-t-[6px] border-r-[6px] border-[#D32F2F] rounded-tr-lg"></div>
              </div>
              <div className="flex justify-between w-full h-16">
                 <div className="w-12 h-full border-b-[6px] border-l-[6px] border-[#D32F2F] rounded-bl-lg"></div>
                 <div className="w-12 h-full border-b-[6px] border-r-[6px] border-[#D32F2F] rounded-br-lg"></div>
              </div>
           </div>

           {/* Camera Flash Effect */}
           {flash && (
             <div className="absolute inset-0 bg-white z-[40] animate-out fade-out duration-150"></div>
           )}
        </div>

        {/* Camera Controls (Bottom Bar) */}
        <div className="bg-[#B71C1C] h-32 px-10 flex items-center justify-between pb-6 relative z-20">
           <button className="text-white hover:bg-white/10 p-3 rounded-full transition-all">
              <SwitchCamera size={28} />
           </button>
           
           <button 
             onClick={handlePresence}
             disabled={isSubmitting}
             className="w-20 h-20 bg-white rounded-full flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
           >
              <div className="w-16 h-16 rounded-full border-2 border-zinc-200 flex items-center justify-center">
                {isSubmitting && <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>}
              </div>
           </button>
           
           <button className="text-white hover:bg-white/10 p-3 rounded-full transition-all">
              <Zap size={28} />
           </button>
        <StatusModal 
          isOpen={modal.isOpen}
          status={modal.status}
          message={modal.message}
          onClose={handleCloseModal}
        />
      </div>
    </div>
    )
  }

  // Jika di luar radius, tetap tampilkan Map
  return (
    <div className="bg-white min-h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-brand-red pt-12 pb-6 px-6 relative z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center relative">
          <button 
            onClick={() => router.back()}
            className="absolute left-0 text-white p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
          <div className="flex items-center space-x-4 mx-auto">
             <div className="w-12 h-10 bg-white rounded-md flex items-center justify-center shadow-inner">
                <div className="relative w-7 h-7">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-brand-red rounded-full"></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-3 bg-brand-red rounded-t-full"></div>
                </div>
             </div>
             <h1 className="text-3xl font-bold text-white tracking-tight">C Presence</h1>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-[#E1F5FE]">
        {/* Floating Info Pills at Top */}
        <div className="absolute top-6 left-0 right-0 z-20 px-4 flex space-x-4 max-w-lg mx-auto pointer-events-none">
           <div className="flex-1 bg-white border-[1.5px] border-brand-red rounded-lg h-10 flex items-center px-3 shadow-md">
              <MapPin className="text-zinc-400 mr-2" size={18} />
              <span className="text-sm font-bold text-zinc-800">{currentDate}</span>
           </div>
           <div className="flex-1 bg-white border-[1.5px] border-brand-red rounded-lg h-10 flex items-center px-3 shadow-md">
              <Clock className="text-zinc-400 mr-2" size={18} />
              <span className="text-sm font-bold text-zinc-800">{currentTime}</span>
           </div>
        </div>

        {/* Real Dynamic Map */}
        <div className="absolute inset-0 z-10">
          {(userLat !== null && userLng !== null) ? (
            <Map 
              defaultCenter={[userLat, userLng]} 
              defaultZoom={15} 
              center={[userLat, userLng]}
            >
              {/* Marker Stasiun Terdekat - Merah */}
              {nearestStation && (
                <Marker width={40} anchor={[nearestStation.latitude, nearestStation.longitude]} color="#cc0000" />
              )}
              {nearestStation && (
                <Overlay anchor={[nearestStation.latitude, nearestStation.longitude]} offset={[40, 45]}>
                  <div className="bg-white/95 px-3 py-1 rounded shadow-md border border-brand-red whitespace-nowrap">
                    <p className="text-xs font-bold text-brand-red">{nearestStation.name}</p>
                  </div>
                </Overlay>
              )}

              {/* Marker Lokasi Pengguna - Biru (Pigeon Maps Default) */}
              <Marker width={40} anchor={[userLat, userLng]} color="#3B82F6" />
              
              <Overlay anchor={[userLat, userLng]} offset={[40, -10]}>
                 <div className="bg-blue-500 text-white px-2 py-0.5 rounded shadow text-[10px] font-bold whitespace-nowrap">
                    Lokasi Anda
                 </div>
              </Overlay>
            </Map>
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 px-6 text-center">
              {locationError ? (
                <>
                  <AlertCircle className="text-brand-red mb-3" size={40} />
                  <p className="text-zinc-700 font-bold mb-1">Gagal Memuat Peta</p>
                  <p className="text-sm text-zinc-500">{locationError}</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-zinc-600 font-medium">Mencari lokasi Anda...</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Status Bottom Overlay - Tampil jika di luar radius stasiun terdekat */}
        {!isGettingLocation && nearestStation && distance !== null && distance > (nearestStation.radius_meters || 100) && (
          <div className="absolute bottom-24 left-4 right-4 z-20 flex justify-center pointer-events-none">
              <div className="bg-white/95 backdrop-blur-md p-4 rounded-[24px] shadow-xl border border-red-100 text-center animate-in slide-in-from-bottom-5 w-full max-w-sm pointer-events-auto">
                <p className="text-[9px] font-bold text-red-600 mb-1.5 bg-red-50 py-1 px-3 rounded-full inline-block">
                   DILUAR AREA ({distance > 1000 ? (distance / 1000).toFixed(1) + ' km' : distance + ' m'})
                </p>
                <h3 className="text-base font-bold text-zinc-800 mb-1">Anda Terlalu Jauh</h3>
                <p className="text-zinc-500 text-[11px] leading-tight">Presensi hanya dapat dilakukan dalam radius {nearestStation.radius_meters || 100} meter dari {nearestStation.name}.</p>
              </div>
          </div>
        )}
      </div>

      <StatusModal 
        isOpen={modal.isOpen}
        status={modal.status}
        message={modal.message}
        onClose={handleCloseModal}
      />
      <BottomNav />
    </div>
  )
}
