'use client'

import React from 'react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface StatusModalProps {
  isOpen: boolean
  status: 'success' | 'error' | 'loading'
  message: string
  onClose?: () => void
}

export function StatusModal({ isOpen, status, message, onClose }: StatusModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={status !== 'loading' ? onClose : undefined}
      ></div>
      
      <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative z-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
        {status === 'success' && (
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="text-green-500" size={48} />
          </div>
        )}
        
        {status === 'error' && (
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <XCircle className="text-brand-red" size={48} />
          </div>
        )}
        
        {status === 'loading' && (
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <Loader2 className="text-blue-500 animate-spin" size={48} />
          </div>
        )}

        <h3 className="text-xl font-bold text-zinc-900 mb-2">
          {status === 'success' ? 'Berhasil!' : status === 'error' ? 'Oops!' : 'Mohon Tunggu'}
        </h3>
        <p className="text-zinc-500 font-medium leading-relaxed mb-8">
          {message}
        </p>

        {status !== 'loading' && (
          <button 
            onClick={onClose}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${
              status === 'success' ? 'bg-green-500 shadow-green-200' : 'bg-brand-red shadow-red-200'
            }`}
          >
            Tutup
          </button>
        )}
      </div>
    </div>
  )
}
