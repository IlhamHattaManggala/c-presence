'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Plus, Search, Edit3, Eye, Trash2, X, Download, FileSpreadsheet, ChevronRight, Send, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatusModal } from '@/components/StatusModal'
import { ConfirmModal } from '@/components/ConfirmModal'
import { bulkImportEmployees } from '@/app/actions/user-actions'
import * as XLSX from 'xlsx'

export default function PendaftaranPegawaiPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSopModalOpen, setIsSopModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'DATA' | 'RIWAYAT'>('DATA')
  const [employees, setEmployees] = useState<any[]>([])
  const [stations, setStations] = useState<any[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
  const [editFormData, setEditFormData] = useState<any>({
    nik: '', full_name: '', position: '', station_id: '', shift_code: '', note: ''
  })
  const [logs, setLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{isOpen: boolean, status: 'loading' | 'success' | 'error', message: string}>({
    isOpen: false, status: 'success', message: ''
  })
  const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null})
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Interactive Excel Import Preview States
  const [importPreview, setImportPreview] = useState<any[] | null>(null)
  const [editingPreviewRow, setEditingPreviewRow] = useState<any | null>(null)
  const [isEditPreviewModalOpen, setIsEditPreviewModalOpen] = useState(false)
  const [shifts, setShifts] = useState<any[]>([])
  const [confirmCancel, setConfirmCancel] = useState(false)

  // SOP State variables
  const [sops, setSops] = useState<any[]>([])
  const [selectedSopId, setSelectedSopId] = useState<string>('new')
  const [sopTitle, setSopTitle] = useState('')
  const [selectedSopFile, setSelectedSopFile] = useState<File | null>(null)
  const [sopLoading, setSopLoading] = useState(false)
  const sopFileInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isSopModalOpen) {
      fetchSops()
    }
  }, [isSopModalOpen])

  const fetchSops = async () => {
    setSopLoading(true)
    const { data, error } = await supabase
      .from('sop_documents')
      .select('*')
      .eq('category', 'SOP')
      .order('created_at', { ascending: false })
    if (!error && data && data.length > 0) {
      setSops(data)
      setSelectedSopId(data[0].id)
      setSopTitle(data[0].title || '')
    } else {
      setSops([])
      setSelectedSopId('new')
      setSopTitle('')
    }
    setSopLoading(false)
  }

  const handleSopSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sopTitle.trim()) {
      setModal({ isOpen: true, status: 'error', message: 'Harap masukkan nama dokumen.' })
      return
    }

    if (selectedSopId === 'new' && !selectedSopFile) {
      setModal({ isOpen: true, status: 'error', message: 'Harap pilih file dokumen terlebih dahulu.' })
      return
    }

    setSopLoading(true)
    setModal({ isOpen: true, status: 'loading', message: 'Menyimpan dokumen SOP...' })
    try {
      let fileUrl = ''
      
      if (selectedSopId !== 'new') {
        const activeSop = sops.find(s => s.id === selectedSopId || String(s.id) === selectedSopId)
        fileUrl = activeSop?.file_url || ''
      }

      if (selectedSopFile) {
        const fileExt = selectedSopFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `SOP/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('sop_documents')
          .upload(filePath, selectedSopFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('sop_documents')
          .getPublicUrl(filePath)
          
        fileUrl = publicUrl
      }

      if (selectedSopId === 'new') {
        const { error: dbError } = await supabase
          .from('sop_documents')
          .insert({
             title: sopTitle,
             category: 'SOP',
             file_url: fileUrl
          })
        if (dbError) throw dbError
        setModal({ isOpen: true, status: 'success', message: 'Dokumen SOP berhasil ditambahkan!' })
      } else {
        const { error: dbError } = await supabase
          .from('sop_documents')
          .update({
             title: sopTitle,
             file_url: fileUrl
          })
          .eq('id', selectedSopId)
        if (dbError) throw dbError
        setModal({ isOpen: true, status: 'success', message: 'Dokumen SOP berhasil diperbarui!' })
      }

      setIsSopModalOpen(false)
      setSelectedSopFile(null)
      setSelectedSopId('new')
      setSopTitle('')
    } catch (err: any) {
      console.error('Error saving SOP:', err)
      setModal({ isOpen: true, status: 'error', message: 'Gagal memproses SOP: ' + err.message })
    } finally {
      setSopLoading(false)
    }
  }

  const handleSopDelete = async () => {
    if (selectedSopId === 'new') return
    if (!window.confirm('Apakah Anda yakin ingin menghapus dokumen SOP ini?')) return

    setSopLoading(true)
    setModal({ isOpen: true, status: 'loading', message: 'Menghapus dokumen SOP...' })
    try {
      const { error } = await supabase
        .from('sop_documents')
        .delete()
        .eq('id', selectedSopId)

      if (error) throw error

      setModal({ isOpen: true, status: 'success', message: 'Dokumen SOP berhasil dihapus!' })
      setIsSopModalOpen(false)
      setSelectedSopFile(null)
      setSelectedSopId('new')
      setSopTitle('')
    } catch (err: any) {
      console.error('Error deleting SOP:', err)
      setModal({ isOpen: true, status: 'error', message: 'Gagal menghapus SOP: ' + err.message })
    } finally {
      setSopLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
    fetchStations()
    fetchShifts()
  }, [])

  const fetchStations = async () => {
    const { data } = await supabase.from('stations').select('id, name').order('name')
    if (data) setStations(data)
  }

  const fetchShifts = async () => {
    const { data, error } = await supabase.from('shifts').select('code, start_time, end_time').order('code')
    if (error) {
      console.error('Error fetching shifts in page:', error)
    } else {
      console.log('Fetched shifts in page:', data)
    }
    if (data) setShifts(data || [])
  }

  const fetchEmployees = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select('*, stations(name)')
      .eq('role', 'user')
      .order('full_name', { ascending: true })

    if (error) {
       console.error('Error fetching employees:', error)
    } else {
       setEmployees(data || [])
    }
    setLoading(false)
  }

  const handleDelete = (id: string) => {
    setConfirmDelete({ isOpen: true, id })
  }

  const executeDelete = async () => {
    if (!confirmDelete.id) return
    const idToDel = confirmDelete.id
    setConfirmDelete({ isOpen: false, id: null })

    setModal({ isOpen: true, status: 'loading', message: 'Menghapus data pegawai...' })
    const { error } = await supabase.from('users').delete().eq('id', idToDel)
    if (error) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal menghapus: ' + error.message })
    } else {
      setModal({ isOpen: true, status: 'success', message: 'Pegawai berhasil dihapus' })
      fetchEmployees()
    }
  }

  const handleEditClick = (employee: any) => {
    setSelectedEmployee(employee)
    setEditFormData({
      nik: employee.nik || '',
      full_name: employee.full_name || '',
      position: employee.position || '',
      station_id: employee.station_id || '',
      shift_code: employee.shift_code || '',
      note: ''
    })
    setActiveTab('DATA')
    setIsEditModalOpen(true)
    fetchLogs(employee.id)
  }

  const fetchLogs = async (employeeId: string) => {
    setLoadingLogs(true)
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('target_id', employeeId)
      .order('created_at', { ascending: false })
    
    if (data) setLogs(data)
    setLoadingLogs(false)
  }

  const handleClearHistory = async () => {
    if (!selectedEmployee) return
    if (!window.confirm("Yakin ingin membersihkan riwayat perubahan pegawai ini?")) return
    
    const { error } = await supabase
       .from('audit_logs')
       .delete()
       .eq('target_id', selectedEmployee.id)
       
    if (!error) {
       fetchLogs(selectedEmployee.id)
    } else {
       console.error("Gagal membersihkan riwayat", error)
    }
  }

  const submitEdit = async () => {
    if (!selectedEmployee) return
    
    setModal({ isOpen: true, status: 'loading', message: 'Menyimpan perubahan...' })
    setIsEditModalOpen(false)

    const updateData = {
      nik: editFormData.nik,
      full_name: editFormData.full_name,
      position: editFormData.position,
      station_id: editFormData.station_id || null,
      shift_code: editFormData.shift_code
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', selectedEmployee.id)

    if (error) {
      setModal({ isOpen: true, status: 'error', message: 'Gagal memperbarui data: ' + error.message })
    } else {
      // Create Audit Log
      const changes: string[] = []
      if (selectedEmployee.nik !== editFormData.nik) changes.push(`NIK: ${selectedEmployee.nik} -> ${editFormData.nik}`)
      if (selectedEmployee.full_name !== editFormData.full_name) changes.push(`Nama: ${selectedEmployee.full_name} -> ${editFormData.full_name}`)
      if (selectedEmployee.position !== editFormData.position) changes.push(`Posisi/Jabatan: ${selectedEmployee.position} -> ${editFormData.position}`)
      if (selectedEmployee.shift_code !== editFormData.shift_code) changes.push(`Kode Dinas: ${selectedEmployee.shift_code || '-'} -> ${editFormData.shift_code || '-'}`)
      if (selectedEmployee.station_id !== editFormData.station_id) {
         const oldStation = stations.find(s => s.id === selectedEmployee.station_id)?.name || '-'
         const newStation = stations.find(s => s.id === editFormData.station_id)?.name || '-'
         changes.push(`Stasiun: ${oldStation} -> ${newStation}`)
      }
      if (editFormData.note && editFormData.note.trim() !== '') {
         changes.push(`Catatan: ${editFormData.note.trim()}`)
      }

      const { data: userData } = await supabase.auth.getUser()
      if (changes.length > 0 && userData?.user?.id) {
        await supabase.from('audit_logs').insert([{
           actor_id: userData.user.id,
           target_id: selectedEmployee.id,
           action: 'update_employee',
           description: changes.join('\n')
        }])
      }

      setModal({ isOpen: true, status: 'success', message: 'Data pegawai berhasil diperbarui!' })
      fetchEmployees()
    }
  }

  const handleDownloadTemplate = () => {
    // Path langsung ke file di folder public
    const templateUrl = '/file/Format Excel Pendaftaran Pegawai.xlsx'
    
    // Buat link temporary untuk trigger download
    const link = document.createElement('a')
    link.href = templateUrl
    link.download = 'Format Excel Pendaftaran Pegawai.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setModal({ isOpen: true, status: 'success', message: 'Template berhasil diunduh!' })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setModal({ isOpen: true, status: 'loading', message: 'Membaca file excel...' })

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json: any[] = XLSX.utils.sheet_to_json(worksheet)

        if (json.length === 0) {
          setModal({ isOpen: true, status: 'error', message: 'File excel kosong atau format tidak sesuai' })
          return
        }

        // 1. Fetch stations data for name -> id mapping
        const { data: dbStations } = await supabase.from('stations').select('id, name')
        const stationMap = new Map(dbStations?.map(s => [String(s.name).toLowerCase().trim(), s.id]))

        // Helper function for robust fuzzy header matching
        const getExcelValue = (row: any, aliases: string[]): string => {
          for (const alias of aliases) {
            const normAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '')
            for (const key of Object.keys(row)) {
              const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '')
              if (normKey === normAlias) {
                return row[key] !== undefined && row[key] !== null ? String(row[key]).trim() : ''
              }
            }
          }
          return ''
        }

        // Password auto-generator: [nama_depan][nama_belakang][2_digit_akhir_NIK]
        const generatePassword = (name: string, nik: string): string => {
          const cleanName = String(name || '').trim()
          if (!cleanName) return 'pegawai123'
          const parts = cleanName.split(/\s+/)
          const firstName = parts[0].toLowerCase().replace(/[^a-z0-9]/g, '')
          const lastName = parts.length > 1 ? parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, '') : ''
          const nikStr = String(nik || '').trim()
          const nikSuffix = nikStr.length >= 2 ? nikStr.slice(-2) : '12'
          
          let basePassword = `${firstName}${lastName}${nikSuffix}`
          while (basePassword.length < 6) {
            basePassword += '0'
          }
          return basePassword
        }

        // 2. Map data and run inline validations
        const parsedRows = json.map((row: any, idx: number) => {
          let employee_id = getExcelValue(row, ['No', 'ID', 'No.'])
          const email = getExcelValue(row, ['Email'])
          const nik = getExcelValue(row, ['NIK', 'ID/NIK'])
          const full_name = getExcelValue(row, ['Nama', 'Nama Lengkap', 'Name'])
          let position = getExcelValue(row, ['Posisi', 'Jabatan', 'Position'])
          let station_name = getExcelValue(row, ['Stasiun', 'Station'])
          let shift_code = getExcelValue(row, ['Kode Dinas', 'Kode Dinasan', 'Shift', 'Shift Code']).toUpperCase()
          let password = getExcelValue(row, ['Password', 'Pass'])

          // Clean placeholder dropdown values from standard Excel template
          if (position.toLowerCase() === 'pilih posisi') position = ''
          if (station_name.toLowerCase() === 'pilih stasiun') station_name = ''
          if (shift_code.toLowerCase() === 'pilih kode dinas') shift_code = ''

          // Skip completely empty rows (e.g. padding rows at bottom)
          if (!email && !full_name && !nik) {
            return null
          }

          const errors: string[] = []
          const warnings: string[] = []

          if (!email) {
            errors.push('Email wajib diisi')
          } else if (!/\S+@\S+\.\S+/.test(email)) {
            errors.push('Format email tidak valid')
          }

          if (!full_name) {
            errors.push('Nama wajib diisi')
          }

          const station_id = stationMap.get(station_name.toLowerCase().trim()) || null
          if (station_name && !station_id) {
            warnings.push(`Stasiun "${station_name}" tidak terdaftar`)
          }

          // Auto-generate password if not provided
          if (!password && full_name) {
            password = generatePassword(full_name, nik)
          } else if (!password) {
            password = 'password123'
          }

          const status = errors.length > 0 ? 'error' : (warnings.length > 0 ? 'warning' : 'valid')

          return {
            id_key: `excel-row-${idx}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            employee_id: employee_id || '',
            email,
            nik,
            full_name,
            position,
            station_name,
            station_id,
            shift_code,
            password,
            status,
            errors,
            warnings
          }
        }).filter(Boolean)

        setImportPreview(parsedRows)
        setModal({ isOpen: false, status: 'success', message: '' })
        
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = ''
        
      } catch (err: any) {
        console.error('Import error:', err)
        setModal({ isOpen: true, status: 'error', message: 'Gagal membaca excel: ' + err.message })
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // Helper to re-validate an edited row in preview
  const validatePreviewRow = (row: any, stationMap: Map<string, string>) => {
    const errors: string[] = []
    const warnings: string[] = []

    if (!row.email) {
      errors.push('Email wajib diisi')
    } else if (!/\S+@\S+\.\S+/.test(row.email)) {
      errors.push('Format email tidak valid')
    }

    if (!row.full_name) {
      errors.push('Nama wajib diisi')
    }

    const station_name = String(row.station_name || '').trim()
    const station_id = stationMap.get(station_name.toLowerCase()) || null
    if (station_name && !station_id) {
      warnings.push(`Stasiun "${station_name}" tidak terdaftar`)
    }

    // Auto-generate password if empty
    let password = row.password
    if (!password && row.full_name) {
      const parts = row.full_name.trim().split(/\s+/)
      const firstName = parts[0].toLowerCase().replace(/[^a-z0-9]/g, '')
      const lastName = parts.length > 1 ? parts[parts.length - 1].toLowerCase().replace(/[^a-z0-9]/g, '') : ''
      const nikSuffix = String(row.nik || '').trim().slice(-2) || '12'
      let basePassword = `${firstName}${lastName}${nikSuffix}`
      while (basePassword.length < 6) {
        basePassword += '0'
      }
      password = basePassword
    } else if (!password) {
      password = 'password123'
    }

    const status = errors.length > 0 ? 'error' : (warnings.length > 0 ? 'warning' : 'valid')

    return {
      ...row,
      station_id,
      password,
      status,
      errors,
      warnings
    }
  }

  const handleEditPreviewClick = (row: any) => {
    setEditingPreviewRow({ ...row })
    setIsEditPreviewModalOpen(true)
  }

  const handleSavePreviewEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPreviewRow || !importPreview) return

    // 1. Fetch stations data to map names
    const { data: dbStations } = await supabase.from('stations').select('id, name')
    const stationMap = new Map(dbStations?.map(s => [String(s.name).toLowerCase().trim(), s.id]))

    const updatedRow = validatePreviewRow(editingPreviewRow, stationMap)

    setImportPreview(prev => 
      prev ? prev.map(r => r.id_key === updatedRow.id_key ? updatedRow : r) : null
    )
    setIsEditPreviewModalOpen(false)
    setEditingPreviewRow(null)
  }

  const handleDeletePreviewRow = (idKey: string) => {
    if (!importPreview) return
    const filtered = importPreview.filter(r => r.id_key !== idKey)
    setImportPreview(filtered.length > 0 ? filtered : null)
  }

  const handleCancelImport = () => {
    setConfirmCancel(true)
  }

  const handleSaveImportToDB = async () => {
    if (!importPreview) return

    const hasErrors = importPreview.some(r => r.status === 'error')
    if (hasErrors) {
      setModal({ isOpen: true, status: 'error', message: 'Harap perbaiki semua data yang error (berwarna merah) sebelum disimpan ke database.' })
      return
    }

    setModal({ isOpen: true, status: 'loading', message: `Sedang mendaftarkan ${importPreview.length} pegawai ke database...` })

    try {
      const mappedData = importPreview.map(row => ({
        email: row.email,
        nik: row.nik,
        full_name: row.full_name,
        position: row.position,
        station_id: row.station_id,
        shift_code: row.shift_code,
        password: row.password,
        role: 'user'
      }))

      const res = await bulkImportEmployees(mappedData)

      if (!res.success) {
        throw new Error(res.error || 'Gagal menyimpan data ke database')
      }

      if ('totalSuccess' in res) {
        if (res.failed > 0) {
          setModal({ 
            isOpen: true, 
            status: 'error', 
            message: `Impor selesai dengan beberapa error:\nBerhasil: ${res.totalSuccess}\nGagal: ${res.failed}\n\nDetail: ${res.errors.slice(0, 3).join(', ')}${res.errors.length > 3 ? '...' : ''}` 
          })
        } else {
          setModal({ isOpen: true, status: 'success', message: `Berhasil mendaftarkan ${res.totalSuccess} pegawai baru ke database!` })
          setImportPreview(null)
        }
      }

      fetchEmployees()
    } catch (err: any) {
      console.error('Save import error:', err)
      setModal({ isOpen: true, status: 'error', message: 'Gagal memproses pendaftaran: ' + err.message })
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="h-auto py-6 md:h-24 md:py-0 bg-[#E62020] w-full flex items-center px-6 md:px-10 pr-16 md:pr-10 shrink-0">
        <div className="flex items-center space-x-3 md:space-x-4">
          <button onClick={() => router.back()} className="text-white p-1.5 md:p-2 hover:bg-white/10 rounded-full transition shrink-0">
             <FileText className="w-8 h-8 md:w-10 md:h-10" />
          </button>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-white tracking-wide leading-tight">Dokumen Presence Pendaftaran Pegawai</h2>
            <p className="text-white text-xs md:text-sm font-bold opacity-90">PT KAI Commuter</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Sub Navigation Buttons - Satu Baris Horizontal */}
          <div className="w-full flex justify-start md:justify-end overflow-x-auto scrollbar-hide mb-6 py-2">
             <div className="flex flex-nowrap gap-2">
                <button 
                  onClick={() => router.push('/admin/dokumen/pendaftaran')}
                  className="shrink-0 bg-brand-red text-white px-5 md:px-8 py-2 rounded-lg text-[10px] md:text-xs font-bold shadow-md shadow-brand-red/20 transition-all hover:bg-red-700"
                >
                  Pendaftaran
                </button>
                <button 
                  onClick={() => router.push('/admin/dokumen/broadcast')}
                  className="shrink-0 bg-white text-zinc-600 border border-brand-red px-5 md:px-8 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all hover:bg-red-50"
                >
                  Broadcast
                </button>
                <button 
                  onClick={() => router.push('/admin/dokumen/presensi')}
                  className="shrink-0 bg-white text-zinc-600 border border-brand-red px-5 md:px-8 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-all hover:bg-red-50"
                >
                  Dokumen Presensi
                </button>
             </div>
          </div>

          <div className="flex justify-center md:justify-end mb-8 md:mb-10">
             <button 
               onClick={() => setIsSopModalOpen(true)}
               className="flex items-center space-x-2 border-2 border-[#B71C1C] px-5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 transition group"
             >
                <Plus size={16} className="text-[#B71C1C] group-hover:scale-110 transition shrink-0" />
                <span className="text-[11px] md:text-[13px] font-bold text-[#B71C1C]">Edit Dokumen SOP</span>
             </button>
          </div>

          {/* Excel Import Preview OR Upload Section */}
          {importPreview ? (
             <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-100 pb-6">
                   <div>
                      <h3 className="text-base font-extrabold text-zinc-800 uppercase tracking-wider flex items-center gap-2">
                         <span className="w-2.5 h-6 bg-[#B71C1C] rounded-sm"></span>
                         Pratinjau Data Impor Excel
                      </h3>
                      <p className="text-zinc-500 text-xs font-bold mt-1">Terdeteksi {importPreview.length} data pegawai. Harap lengkapi/perbaiki data yang bermasalah (merah/kuning) sebelum disimpan.</p>
                   </div>
                   <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                      <button 
                        onClick={handleCancelImport}
                        className="flex-1 md:flex-none border-2 border-zinc-200 hover:bg-zinc-50 text-zinc-600 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all"
                      >
                         Batalkan
                      </button>
                      <button 
                        onClick={handleSaveImportToDB}
                        disabled={importPreview.some(r => r.status === 'error')}
                        className="flex-1 md:flex-none bg-[#003FE1] hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-600/10"
                      >
                         <Check size={14} />
                         <span>Simpan ke Database</span>
                      </button>
                   </div>
                </div>

                <div className="overflow-x-auto border border-zinc-200 rounded-2xl">
                   <table className="w-full text-left border-collapse min-w-[1200px]">
                      <thead className="bg-zinc-50 text-zinc-600 border-b border-zinc-200">
                         <tr>
                            <th className="px-4 py-4 text-xs font-black uppercase text-center w-24">Status</th>
                            <th className="px-4 py-4 text-xs font-black uppercase">Email</th>
                            <th className="px-4 py-4 text-xs font-black uppercase">NIK</th>
                            <th className="px-4 py-4 text-xs font-black uppercase">Nama</th>
                            <th className="px-4 py-4 text-xs font-black uppercase">Posisi</th>
                            <th className="px-4 py-4 text-xs font-black uppercase">Stasiun</th>
                            <th className="px-4 py-4 text-xs font-black uppercase text-center w-20">Shift</th>
                            <th className="px-4 py-4 text-xs font-black uppercase">Password</th>
                            <th className="px-4 py-4 text-xs font-black uppercase text-center w-24">Aksi</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                         {importPreview.map((row) => (
                            <tr key={row.id_key} className={`text-xs hover:bg-zinc-50/50 transition-colors ${row.status === 'error' ? 'bg-red-50/30' : (row.status === 'warning' ? 'bg-yellow-50/30' : '')}`}>
                               <td className="px-4 py-3.5 text-center">
                                  {row.status === 'error' ? (
                                     <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700" title={row.errors.join(', ')}>Error</span>
                                  ) : row.status === 'warning' ? (
                                     <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700" title={row.warnings.join(', ')}>Warning</span>
                                  ) : (
                                     <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">Valid</span>
                                  )}
                               </td>
                               <td className={`px-4 py-3.5 font-semibold text-zinc-800 ${row.errors.some((e: string) => e.includes('Email')) ? 'bg-red-100/40 text-red-800' : ''}`}>
                                  {row.email || <span className="italic text-zinc-400">kosong</span>}
                               </td>
                               <td className="px-4 py-3.5 text-zinc-700 font-semibold">{row.nik || '-'}</td>
                               <td className={`px-4 py-3.5 font-bold text-zinc-950 ${row.errors.some((e: string) => e.includes('Nama')) ? 'bg-red-100/40 text-red-800' : ''}`}>
                                  {row.full_name || <span className="italic text-zinc-400">kosong</span>}
                               </td>
                               <td className="px-4 py-3.5 text-zinc-600 font-medium">{row.position || '-'}</td>
                               <td className={`px-4 py-3.5 font-semibold text-zinc-700 ${row.warnings.some((w: string) => w.includes('Stasiun')) ? 'bg-yellow-100/40 text-yellow-800' : ''}`}>
                                  {row.station_name || '-'}
                                  {row.warnings.some((w: string) => w.includes('Stasiun')) && <span className="block text-[9px] text-yellow-600 font-normal">Stasiun tidak terdaftar</span>}
                               </td>
                               <td className="px-4 py-3.5 text-center font-black text-zinc-800">{row.shift_code || '-'}</td>
                               <td className="px-4 py-3.5 font-mono text-zinc-500 font-semibold">{row.password || '-'}</td>
                               <td className="px-4 py-3.5 text-center">
                                  <div className="flex items-center justify-center space-x-3">
                                     <button 
                                       onClick={() => handleEditPreviewClick(row)}
                                       className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                                       title="Edit baris"
                                     >
                                        <Edit3 size={15} />
                                     </button>
                                     <button 
                                       onClick={() => handleDeletePreviewRow(row.id_key)}
                                       className="text-red-500 hover:text-red-700 transition-colors p-1"
                                       title="Hapus baris"
                                     >
                                        <Trash2 size={15} />
                                     </button>
                                  </div>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          ) : (
             <div className="flex flex-col items-center">
                <h3 className="text-lg font-bold text-zinc-800 mb-6">Upload File Excel Pegawai</h3>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-xl h-48 border-4 border-dashed border-zinc-200 rounded-[32px] flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-50 transition-all group"
                >
                   <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 group-hover:bg-red-50 group-hover:text-brand-red transition">
                      <Plus size={40} />
                   </div>
                </div>
                 <button 
                   onClick={handleDownloadTemplate}
                   className="mt-4 flex items-center space-x-2 text-brand-red font-bold text-sm hover:underline"
                 >
                    <FileSpreadsheet size={16} />
                    <span>Format Excel Dokumen</span>
                 </button>
             </div>
          )}

          {/* Table / Card List Section */}
          <div className="space-y-4">
             {/* Desktop Table View */}
             {loading ? (
                <div className="hidden md:block border border-zinc-200 rounded-lg overflow-hidden bg-white p-20 text-center">
                   <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-10 h-10 border-4 border-[#B71C1C] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-zinc-500 font-medium text-sm">Memuat data pegawai...</p>
                   </div>
                </div>
             ) : employees.length > 0 ? (
                <div className="hidden md:block bg-white border border-zinc-200 rounded-lg overflow-hidden">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[1200px]">
                         <thead className="bg-[#B71C1C] text-white">
                            <tr className="divide-x divide-zinc-700/50">
                               <th className="px-2 py-5 text-sm font-bold w-12 text-center">No</th>
                               <th className="px-4 py-5 text-sm font-bold text-center">Email</th>
                               <th className="px-4 py-5 text-sm font-bold w-32 text-center">NIK</th>
                               <th className="px-4 py-5 text-sm font-bold w-48 text-center">Nama</th>
                               <th className="px-4 py-5 text-sm font-bold w-48 text-center">Posisi</th>
                               <th className="px-4 py-5 text-sm font-bold w-32 text-center">Stasiun</th>
                               <th className="px-4 py-5 text-sm font-bold w-32 text-center">Kode Dinasan</th>
                               <th className="px-2 py-5 text-sm font-bold w-24 text-center">Aksi</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-zinc-300">
                            {employees.map((row, idx) => (
                               <tr key={row.id} className="divide-x divide-zinc-300 hover:bg-zinc-50 transition text-zinc-600">
                                  <td className="px-2 py-4 text-center font-medium text-zinc-500">{idx + 1}</td>
                                  <td className="px-4 py-4 text-sm truncate">{row.email}</td>
                                  <td className="px-4 py-4 text-sm">{row.nik || '-'}</td>
                                  <td className="px-4 py-4 text-sm font-bold text-zinc-800">{row.full_name}</td>
                                  <td className="px-4 py-4 text-sm">{row.position}</td>
                                  <td className="px-4 py-4 text-sm">{row.stations?.name || '-'}</td>
                                  <td className="px-4 py-4 text-center text-sm font-bold">{row.shift_code || '-'}</td>
                                  <td className="px-2 py-4">
                                     <div className="flex items-center justify-center space-x-4">
                                        <button onClick={() => handleEditClick(row)} className="text-orange-400 hover:scale-110 transition"><Edit3 size={18}/></button>
                                        <button onClick={() => handleDelete(row.id)} className="text-[#B71C1C] hover:text-red-700 hover:scale-110 transition"><Trash2 size={18} /></button>
                                     </div>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             ) : (
                <div className="hidden md:flex flex-col items-center justify-center py-20 border border-zinc-200 border-dashed rounded-2xl bg-zinc-50/50">
                   <FileSpreadsheet className="text-zinc-300 w-16 h-16 mb-4" />
                   <p className="text-zinc-500 font-bold">Belum ada data pegawai.</p>
                   <p className="text-zinc-400 text-xs mt-1">Harap upload file Excel pendaftaran pegawai di atas.</p>
                </div>
             )}
 
             {/* Mobile Card View */}
             <div className="md:hidden space-y-4">
                {loading ? (
                   <div className="py-12 flex flex-col items-center justify-center space-y-4">
                      <div className="w-10 h-10 border-4 border-[#B71C1C] border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Memuat Data...</p>
                   </div>
                ) : employees.length === 0 ? (
                   <div className="py-12 text-center text-zinc-400 font-bold text-xs uppercase italic tracking-wider">
                      Belum ada data pegawai.
                   </div>
                ) : (
                   employees.map((row, idx) => (
                      <div key={row.id} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-all">
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <span className="text-[10px] font-bold text-zinc-400 mb-1 block uppercase tracking-tighter">Pegawai #{idx + 1}</span>
                               <h4 className="font-extrabold text-zinc-800 text-base leading-tight uppercase">{row.full_name}</h4>
                               <p className="text-brand-red font-bold text-[11px] uppercase">{row.position}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                               <button onClick={() => handleEditClick(row)} className="p-2 bg-orange-50 text-orange-500 rounded-lg"><Edit3 size={16}/></button>
                               <button onClick={() => handleDelete(row.id)} className="p-2 bg-red-50 text-[#B71C1C] rounded-lg"><Trash2 size={16}/></button>
                            </div>
                         </div>
                         
                         <div className="grid grid-cols-2 gap-y-3 pt-4 border-t border-zinc-50">
                            <div>
                               <p className="text-[9px] font-bold text-zinc-400 uppercase">NIK</p>
                               <p className="text-xs font-bold text-zinc-700">{row.nik || '-'}</p>
                            </div>
                            <div>
                               <p className="text-[9px] font-bold text-zinc-400 uppercase">Stasiun</p>
                               <p className="text-xs font-bold text-zinc-700">{row.stations?.name || '-'}</p>
                            </div>
                            <div>
                               <p className="text-[9px] font-bold text-zinc-400 uppercase">Kode Dinas</p>
                               <p className="text-xs font-black text-brand-red uppercase">{row.shift_code || '-'}</p>
                            </div>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>
      </div>
   </div>

      {/* Edit Pegawai Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[10px] shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-zinc-800">Edit Data Pegawai</h3>
               <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition">
                  <X size={20} className="border-2 border-zinc-400 rounded-full p-0.5" />
               </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-200 mb-8 font-medium">
               <button 
                 onClick={() => setActiveTab('DATA')}
                 className={`px-4 py-2 text-base transition-all ${activeTab === 'DATA' ? 'text-zinc-900 border-b-2 border-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-500'}`}
               >
                 Data Pegawai
               </button>
               <button 
                 onClick={() => setActiveTab('RIWAYAT')}
                 className={`px-4 py-2 text-base transition-all ${activeTab === 'RIWAYAT' ? 'text-zinc-900 border-b-2 border-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-500'}`}
               >
                 Riwayat Perubahan
               </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[75vh] scrollbar-hide py-2">
               {activeTab === 'DATA' && (
                 <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                       {/* Row 1 */}
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">ID / UUID Database</label>
                          <input type="text" value={selectedEmployee?.id || ''} disabled className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm font-bold text-zinc-500 bg-zinc-100 cursor-not-allowed focus:outline-none" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">NIK (Nomor Induk Karyawan)</label>
                          <input type="text" value={editFormData.nik || ''} onChange={e => setEditFormData({...editFormData, nik: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red bg-white" placeholder="Masukkan NIK" />
                       </div>

                       {/* Row 2 */}
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">Nama Lengkap</label>
                          <input type="text" value={editFormData.full_name || ''} onChange={e => setEditFormData({...editFormData, full_name: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red bg-white" placeholder="Masukkan Nama" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">Posisi / Jabatan</label>
                          <input type="text" value={editFormData.position || ''} onChange={e => setEditFormData({...editFormData, position: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red bg-white" placeholder="Masukkan Posisi" />
                       </div>

                       {/* Row 3 */}
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">Stasiun Penempatan</label>
                          <select value={editFormData.station_id || ''} onChange={e => setEditFormData({...editFormData, station_id: e.target.value})} className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red bg-white">
                             <option value="">Pilih Stasiun</option>
                             {stations.map(st => (
                               <option key={st.id} value={st.id}>{st.name}</option>
                             ))}
                          </select>
                       </div>
                       <div className="space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">Kode Dinasan (Shift)</label>
                          <select 
                             value={editFormData.shift_code || ''} 
                             onChange={e => setEditFormData({...editFormData, shift_code: e.target.value})} 
                             className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red bg-white"
                          >
                             <option value="">Pilih Kode Dinas</option>
                             {shifts.map(sh => (
                               <option key={sh.code} value={sh.code}>
                                 {sh.code} {sh.start_time && sh.end_time ? `(${sh.start_time.substring(0, 5)} - ${sh.end_time.substring(0, 5)})` : ''}
                               </option>
                             ))}
                          </select>
                       </div>

                       {/* Full Width */}
                       <div className="col-span-1 md:col-span-2 space-y-1">
                          <label className="text-sm font-extrabold text-zinc-800">Catatan Administratif</label>
                          <textarea 
                             className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-[13px] font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red min-h-[60px] resize-none bg-white"
                             placeholder="Tambahkan catatan jika ada kesalahan atau pembaruan."
                             value={editFormData.note || ''}
                             onChange={e => setEditFormData({...editFormData, note: e.target.value})}
                          ></textarea>
                       </div>
                    </div>

                    {/* Change Status / Log Part */}
                    <div className="space-y-3 mt-6 border-t border-zinc-200 pt-6">
                       <div className="flex items-start space-x-3 text-[13px] text-blue-600 font-medium lowercase">
                          <div className="mt-1 w-4 h-4 rounded-sm border border-blue-600 bg-blue-600 flex items-center justify-center">
                             <Check size={12} className="text-white" />
                          </div>
                          <span>Di Update Oleh User <span className="capitalize">Pada 1 April 2025, 10.10 WIB</span></span>
                       </div>

                       <div className="p-4 bg-orange-100/60 border border-orange-200 rounded-lg space-y-2">
                          <div className="flex items-start space-x-3 text-[13px] text-orange-400 font-medium">
                             <div className="mt-1 w-4 h-4 rounded-sm border border-orange-400 bg-orange-400 flex items-center justify-center">
                                <Check size={12} className="text-white" />
                             </div>
                             <span>Di Update Oleh Admin <span className="text-zinc-500 capitalize">Pada 1 April 2025, 14.30 WIB</span></span>
                          </div>
                          <div className="pl-7 text-[13px] text-zinc-600 italic">
                             Nama : Adhmad Fauzi {"->"} Achmad Fauzi
                          </div>
                       </div>
                    </div>
                 </div>
               )}


               {activeTab === 'RIWAYAT' && (
                 <div className="space-y-6 py-2">
                    {loadingLogs ? (
                       <div className="py-12 flex justify-center"><div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div></div>
                    ) : logs.length === 0 ? (
                       <div className="py-12 text-center text-zinc-500 font-medium italic text-sm">Belum ada riwayat perubahan data.</div>
                    ) : (
                       logs.map((log) => {
                          const date = new Date(log.created_at).toLocaleString('id-ID', {
                             day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) + ' WIB'
                          const isAdmin = log.actor_id !== selectedEmployee?.id

                          if (isAdmin) {
                             return (
                                <div key={log.id} className="space-y-3">
                                   <div className="flex items-center space-x-2 text-sm font-bold text-orange-400">
                                      <div className="w-4 h-4 rounded-sm bg-orange-400 flex items-center justify-center">
                                         <Check size={12} className="text-white" />
                                      </div>
                                      <span>{date}</span>
                                   </div>
                                   <div className="p-4 bg-orange-100/60 border border-orange-200 rounded-lg">
                                      <p className="text-sm font-bold text-orange-400 mb-1">Diedit Oleh Admin :</p>
                                      <p className="text-sm font-bold text-zinc-600 whitespace-pre-wrap">{log.description}</p>
                                   </div>
                                </div>
                             )
                          } else {
                             return (
                                <div key={log.id} className="space-y-3">
                                   <div className="flex items-center space-x-2 text-sm font-bold text-zinc-800">
                                      <div className="w-5 h-5 rounded-sm bg-[#5271FF] flex items-center justify-center text-white text-[10px] font-bold">
                                         U
                                      </div>
                                      <span>{date}</span>
                                   </div>
                                   <div className="p-4 bg-[#DCE4FF] border border-[#B8C9FF] rounded-lg">
                                      <p className="text-sm font-bold text-[#5271FF] mb-3">Diupdate Oleh Pengguna</p>
                                      <p className="text-sm font-bold text-zinc-800 whitespace-pre-wrap">{log.description}</p>
                                   </div>
                                </div>
                             )
                          }
                       })
                    )}

                    {/* Checkbox and Action Button */}
                    <div className="flex justify-between items-center pt-4 border-t border-zinc-200">
                       <label className="flex items-center space-x-3 cursor-pointer group">
                          <input type="checkbox" className="w-4 h-4 text-brand-red bg-zinc-100 border-zinc-300 rounded focus:ring-brand-red focus:ring-2" />
                          <span className="text-xs font-bold text-zinc-700">Tandai Semua Perubahan Sudah Diperiksa</span>
                       </label>
                       <button onClick={handleClearHistory} disabled={logs.length === 0} className="bg-[#E0E4EC] disabled:opacity-50 text-zinc-700 px-6 py-2 rounded-md font-bold text-xs hover:bg-zinc-300 transition shadow-sm">
                          Bersihkan Riwayat
                       </button>
                    </div>
                 </div>
               )}
            </div>

            {/* Modal Footer */}
            <div className="mt-8 flex justify-end space-x-4">
               <button onClick={() => setIsEditModalOpen(false)} className="w-36 py-2 rounded-[4px] bg-[#E0E4EC] text-zinc-700 font-bold hover:bg-zinc-300 transition text-sm">Batal</button>
               <button onClick={activeTab === 'DATA' ? submitEdit : () => setIsEditModalOpen(false)} className={`w-64 py-2 rounded-[4px] text-white font-bold transition text-sm shadow-md bg-[#003FE1] hover:bg-blue-700`}>
                  {activeTab === 'DATA' ? 'Simpan Perubahan' : 'Tutup'}
               </button>
            </div>
          </div>
        </div>
      )}



      {/* Edit Dokumen SOP Modal */}
      {isSopModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsSopModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-3xl rounded-[32px] shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
             
             {/* Modal Header */}
             <div className="mb-4">
                <h3 className="text-xl font-bold text-black mb-4">Edit Dokumen SOP</h3>
                <div className="h-[1px] bg-zinc-200 w-full mb-6"></div>
             </div>

              <form onSubmit={handleSopSave} className="space-y-6">
                 {/* Field: Nama Dokumen */}
                 <div className="space-y-2">
                    <label className="block text-sm font-bold text-zinc-900">Nama Dokumen</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Masukkan nama dokumen"
                      value={sopTitle}
                      onChange={(e) => setSopTitle(e.target.value)}
                      className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-zinc-400 bg-white shadow-sm font-semibold text-black"
                    />
                    <p className="text-blue-500 text-[10px] italic">* Gunakan nama file yang jelas dan mudah dikenali</p>
                 </div>

                 {/* Field: File Saat Ini */}
                 {selectedSopId !== 'new' && (() => {
                    const activeSop = sops.find(s => s.id === selectedSopId || String(s.id) === selectedSopId);
                    if (!activeSop) return null;
                    return (
                      <div className="space-y-2">
                         <label className="block text-sm font-bold text-zinc-900">File Saat Ini :</label>
                         <div className="flex items-center justify-between border border-zinc-200 rounded-xl p-3 max-w-sm bg-zinc-50/50">
                            <div className="flex items-center space-x-3 min-w-0">
                               <div className="w-8 h-10 bg-[#E62020] rounded flex items-center justify-center text-[8px] font-extrabold text-white shrink-0">
                                  PDF
                               </div>
                               <span className="font-bold text-zinc-800 text-xs truncate max-w-[200px]" title={activeSop.title}>{activeSop.title}</span>
                            </div>
                            <a 
                              href={activeSop.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="bg-[#CFD8EB] text-[#2255CC] px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition shrink-0"
                            >
                               Download
                            </a>
                         </div>
                      </div>
                    );
                 })()}

                 {/* Field: Upload File Baru */}
                 <div className="space-y-2">
                    <label className="block text-sm font-bold text-zinc-900">
                      {selectedSopId === 'new' ? 'Upload File Dokumen' : 'Upload File Baru (Opsional)'}
                    </label>
                    <input 
                      type="file"
                      ref={sopFileInputRef}
                      onChange={(e) => setSelectedSopFile(e.target.files?.[0] || null)}
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                    />
                    <div 
                      onClick={() => sopFileInputRef.current?.click()}
                      className="w-full border-2 border-zinc-200 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3 border-dashed bg-zinc-50/20 hover:bg-zinc-50 transition cursor-pointer"
                    >
                       <div className="text-[#003BDD]">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                             <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                          </svg>
                       </div>
                       <div className="text-center">
                          {selectedSopFile ? (
                            <div>
                              <p className="text-xs font-bold text-emerald-600">{selectedSopFile.name}</p>
                              <p className="text-[9px] text-zinc-400">{(selectedSopFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            </div>
                          ) : (
                            <>
                              <p className="text-xs font-bold text-zinc-800">Pilih berkas dokumen di sini</p>
                              <p className="text-[10px] text-zinc-400">Format: PDF, DOC, DOCX (Maks 10MB)</p>
                            </>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Modal Footer */}
                 <div className="mt-8 flex justify-between items-center border-t border-zinc-100 pt-6">
                    <div>
                       {selectedSopId !== 'new' && (
                          <button 
                            type="button"
                            onClick={handleSopDelete}
                            className="bg-red-50 text-brand-red px-5 py-2.5 rounded-lg font-bold text-xs hover:bg-red-100 transition shadow-sm border border-red-200"
                          >
                            Hapus Dokumen
                          </button>
                       )}
                    </div>
                    <div className="flex items-center space-x-3">
                       <button 
                         type="button"
                         onClick={() => setIsSopModalOpen(false)}
                         className="px-6 py-2.5 border border-zinc-300 rounded-lg font-bold text-xs text-zinc-700 hover:bg-zinc-50 transition"
                       >
                         Batal
                       </button>
                       <button 
                         type="submit"
                         disabled={sopLoading}
                         className="bg-[#003BDD] text-white px-6 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center space-x-2 shadow-md hover:bg-blue-800 disabled:opacity-50 transition"
                       >
                          <span>{selectedSopId === 'new' ? 'Tambah Dokumen' : 'Simpan Perubahan'}</span>
                          <ChevronRight size={14} />
                       </button>
                    </div>
                 </div>
              </form>
          </div>
        </div>
      )}


      {/* Edit Preview Row Modal */}
      {isEditPreviewModalOpen && editingPreviewRow && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditPreviewModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden p-8 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-zinc-800">Edit Baris Pegawai Excel</h3>
               <button onClick={() => setIsEditPreviewModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition">
                  <X size={20} className="border-2 border-zinc-400 rounded-full p-0.5" />
               </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePreviewEdit} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Row 1 */}
                  <div className="space-y-1">
                     <label className="text-sm font-extrabold text-zinc-800">NIK (Nomor Induk Karyawan)</label>
                     <input 
                        type="text" 
                        value={editingPreviewRow.nik || ''} 
                        onChange={e => setEditingPreviewRow({...editingPreviewRow, nik: e.target.value})} 
                        className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red bg-white" 
                        placeholder="Masukkan NIK" 
                     />
                  </div>
                  <div className="space-y-1">
                     <label className="text-sm font-extrabold text-zinc-800">Nama Lengkap *</label>
                     <input 
                        type="text" 
                        required
                        value={editingPreviewRow.full_name || ''} 
                        onChange={e => setEditingPreviewRow({...editingPreviewRow, full_name: e.target.value})} 
                        className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red bg-white" 
                        placeholder="Masukkan Nama Lengkap" 
                     />
                  </div>
                  <div className="space-y-1">
                     <label className="text-sm font-extrabold text-zinc-800">Email *</label>
                     <input 
                        type="email" 
                        required
                        value={editingPreviewRow.email || ''} 
                        onChange={e => setEditingPreviewRow({...editingPreviewRow, email: e.target.value})} 
                        className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red bg-white" 
                        placeholder="Masukkan Email" 
                     />
                  </div>


                  <div className="space-y-1">
                     <label className="text-sm font-extrabold text-zinc-800">Posisi / Jabatan</label>
                     <input 
                        type="text" 
                        value={editingPreviewRow.position || ''} 
                        onChange={e => setEditingPreviewRow({...editingPreviewRow, position: e.target.value})} 
                        className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red bg-white" 
                        placeholder="Masukkan Posisi" 
                     />
                  </div>

                  {/* Row 4 */}
                  <div className="space-y-1">
                     <label className="text-sm font-extrabold text-zinc-800">Stasiun Penempatan</label>
                     <select 
                        value={editingPreviewRow.station_name || ''} 
                        onChange={e => setEditingPreviewRow({...editingPreviewRow, station_name: e.target.value})} 
                        className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red bg-white"
                     >
                        <option value="">Pilih Stasiun</option>
                        {stations.map(st => (
                          <option key={st.id} value={st.name}>{st.name}</option>
                        ))}
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-sm font-extrabold text-zinc-800">Kode Dinasan (Shift)</label>
                     <select 
                        value={editingPreviewRow.shift_code || ''} 
                        onChange={e => setEditingPreviewRow({...editingPreviewRow, shift_code: e.target.value})} 
                        className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red bg-white"
                     >
                        <option value="">Pilih Kode Dinas</option>
                        {shifts.map(sh => (
                          <option key={sh.code} value={sh.code}>
                            {sh.code} {sh.start_time && sh.end_time ? `(${sh.start_time.substring(0, 5)} - ${sh.end_time.substring(0, 5)})` : ''}
                          </option>
                        ))}
                     </select>
                  </div>

                  {/* Row 5 */}
                  <div className="space-y-1 col-span-1 md:col-span-2">
                     <label className="text-sm font-extrabold text-zinc-800">Password (Opsional - biarkan kosong untuk auto-generate)</label>
                     <input 
                        type="text" 
                        value={editingPreviewRow.password || ''} 
                        onChange={e => setEditingPreviewRow({...editingPreviewRow, password: e.target.value})} 
                        className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm font-bold text-black focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red bg-white" 
                        placeholder="Ketik password khusus" 
                     />
                  </div>
               </div>

               {/* Modal Footer */}
               <div className="mt-8 flex justify-end space-x-4">
                  <button 
                    type="button"
                    onClick={() => setIsEditPreviewModalOpen(false)} 
                    className="w-36 py-2 rounded-xl bg-[#E0E4EC] text-zinc-700 font-bold hover:bg-zinc-300 transition text-sm"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="w-64 py-2 rounded-xl text-white font-bold transition text-sm shadow-md bg-[#003FE1] hover:bg-blue-700"
                  >
                     Simpan Perubahan
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      <StatusModal 
        isOpen={modal.isOpen}
        status={modal.status}
        message={modal.message}
        onClose={() => setModal({ ...modal, isOpen: false })}
      />

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        title="Hapus Pegawai"
        message="Apakah Anda yakin ingin menghapus pegawai ini? Data yang dihapus tidak dapat dikembalikan."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />

      <ConfirmModal 
        isOpen={confirmCancel}
        title="Batalkan Impor"
        message="Apakah Anda yakin ingin membatalkan impor data Excel ini? Seluruh data sementara yang diunggah akan dihapus."
        onConfirm={() => {
          setImportPreview(null)
          setConfirmCancel(false)
        }}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  )
}

