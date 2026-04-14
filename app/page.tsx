'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Memberikan waktu sedikit agar user bisa melihat logo splash
    const timer = setTimeout(() => {
      router.push('/users/login')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-red">
       <div className="text-white text-center">
          <div className="w-52 h-52 relative mx-auto animate-pulse">
             <Image 
                src="/images/logo splash.png" 
                alt="C Presence Logo" 
                fill
                className="object-contain"
                priority
             />
          </div>
          <h1 className="text-3xl font-extrabold tracking-[0.2em] -mt-2">C PRESENCE</h1>
       </div>
    </div>
  )
}
