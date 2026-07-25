'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    console.log('Splash screen mounted, setting redirect timer...')
    const timer = setTimeout(() => {
      console.log('Redirecting to /users/login...')
      window.location.href = '/users/login'
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-red">
       <div className="text-white text-center">
          <div className="w-52 h-52 relative mx-auto animate-pulse">
             <Image 
                src="/images/logo splash.png" 
                alt="C Presence Logo" 
                fill
                sizes="208px"
                className="object-contain"
                priority
             />
          </div>
          <h1 className="text-3xl font-extrabold tracking-[0.2em] -mt-2">C PRESENCE</h1>
       </div>
    </div>
  )
}
