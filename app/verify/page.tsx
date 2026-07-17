'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react'
import { verifyDocumentAction } from '@/app/actions/user-actions'

function VerifyContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

  const [loading, setLoading] = useState(true)
  const [requestData, setRequestData] = useState<any>(null)
  const [approverData, setApproverData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('ID Verifikasi tidak ditemukan atau tidak valid.')
      setLoading(false)
      return
    }

    const verifyDocument = async () => {
      try {
        const res = await verifyDocumentAction(id)
        if (!res.success) {
          setError(res.error || 'Dokumen tidak terdaftar atau tanda tangan tidak valid.')
          return
        }

        setRequestData(res.requestData)
        setApproverData(res.approverData)
      } catch (err) {
        console.error(err)
        setError('Terjadi kesalahan saat memverifikasi dokumen.')
      } finally {
        setLoading(false)
      }
    }

    verifyDocument()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-zinc-100 shadow-xl rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <Loader2 className="animate-spin text-brand-red mx-auto" size={48} />
          <h2 className="text-lg font-bold text-zinc-800">Memverifikasi Dokumen...</h2>
          <p className="text-zinc-500 text-xs font-semibold">Menghubungkan ke server PT KAI Commuter</p>
        </div>
      </div>
    )
  }

  if (error || !requestData || requestData.status !== 'Disetujui') {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-zinc-200 shadow-xl rounded-3xl p-8 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mx-auto border border-red-100">
            <ShieldAlert size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-zinc-900">Verifikasi E-Sign Gagal</h2>
            <p className="text-zinc-500 text-sm font-medium">
              {error || 'Dokumen ini belum disetujui atau status tanda tangan tidak valid.'}
            </p>
          </div>
          <div className="border-t border-zinc-100 pt-6">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              PT Kereta Commuter Indonesia
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="bg-white border border-zinc-200 shadow-xl rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6">
        
        {/* Verification Success Badge */}
        <div className="flex items-center space-x-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-emerald-800">
          <ShieldCheck size={24} className="shrink-0 text-emerald-600" />
          <div>
            <h3 className="text-sm font-bold">Tanda Tangan Digital Terverifikasi</h3>
            <p className="text-[11px] opacity-80 font-medium">Dokumen ini sah dan ditandatangani secara elektronik</p>
          </div>
        </div>

        {/* E-Signature UI Box (Sesuai Gambar User) */}
        <div className="border border-zinc-200 rounded-2xl p-6 bg-white shadow-sm flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Logo KAI Commuter */}
          <div className="shrink-0 flex items-center justify-center bg-zinc-50 rounded-xl p-3 border border-zinc-100 w-32 h-16">
            <img 
              src="/images/logos/Logo_KAI_Commuter.webp" 
              alt="KAI Commuter" 
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* E-Sign Metadata */}
          <div className="text-center sm:text-left space-y-1 font-sans text-zinc-800">
            <p className="text-xs sm:text-sm text-zinc-500">Ditandatangani secara elektronik</p>
            <p className="text-sm sm:text-base font-bold">oleh: {approverData?.name}</p>
            <p className="text-xs sm:text-sm text-zinc-600 font-medium">{approverData?.position}</p>
            <p className="text-xs sm:text-sm font-bold text-zinc-900">PT Kereta Commuter Indonesia</p>
          </div>
        </div>

        {/* Document Info Table */}
        <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100 space-y-3">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Informasi Dokumen</h4>
          <div className="grid grid-cols-3 gap-2 text-xs font-medium text-zinc-600">
            <span className="font-bold text-zinc-500 col-span-1">Jenis Surat</span>
            <span className="col-span-2 text-zinc-950 font-bold">: {requestData.type}</span>

            <span className="font-bold text-zinc-500 col-span-1">Nama Pemohon</span>
            <span className="col-span-2 text-zinc-950 font-bold">: {requestData.users?.full_name || '-'}</span>

            <span className="font-bold text-zinc-500 col-span-1">NIK Pemohon</span>
            <span className="col-span-2 text-zinc-950">: {requestData.users?.nik || '-'}</span>

            <span className="font-bold text-zinc-500 col-span-1">Tanggal Ajuan</span>
            <span className="col-span-2 text-zinc-950">
              : {requestData.tgl_permohonan || requestData.tgl_mulai_dinas || '-'}
            </span>

            <span className="font-bold text-zinc-500 col-span-1">Keterangan</span>
            <span className="col-span-2 text-zinc-950 break-words">: {requestData.alasan_penjelasan || '-'}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-zinc-100">
          <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">
            PT Kereta Commuter Indonesia © 2026
          </p>
        </div>

      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-zinc-100 shadow-xl rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <Loader2 className="animate-spin text-brand-red mx-auto" size={48} />
          <h2 className="text-lg font-bold text-zinc-800">Memuat Sistem Verifikasi...</h2>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
