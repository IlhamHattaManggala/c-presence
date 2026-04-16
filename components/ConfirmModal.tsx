'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title?: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({ isOpen, title = 'Konfirmasi', message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onCancel}
      ></div>
      
      <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative z-10 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="text-orange-500" size={48} />
        </div>

        <h3 className="text-xl font-bold text-zinc-900 mb-2">
          {title}
        </h3>
        <p className="text-zinc-500 font-medium leading-relaxed mb-8 text-sm">
          {message}
        </p>

        <div className="flex w-full space-x-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 transition-all active:scale-95"
          >
            Batal
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-[#B71C1C] hover:bg-[#8B0000] shadow-lg shadow-red-200 transition-all active:scale-95"
          >
            Ya, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  )
}
