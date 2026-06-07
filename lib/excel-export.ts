import * as XLSX from 'xlsx'

/**
 * Calculates number of weekdays (Monday to Friday) in a given month.
 */
export function getWorkdaysCount(year: number, month: number): number {
  let count = 0
  const daysInMonth = new Date(year, month, 0).getDate()
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day)
    const dayOfWeek = date.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) and not Saturday (6)
      count++
    }
  }
  return count
}

interface UserData {
  id: string
  nik?: string
  full_name?: string
  position?: string
  stations?: { name?: string }
  station_name?: string
  sla_manual?: number
}

interface AttendanceData {
  user_id: string
  date: string
  is_dinas_luar?: boolean
  status?: string
  nilai_awal_dinas?: number
  nilai_akhir_dinas?: number
}

interface ApprovalRequestData {
  user_id: string
  type: string
  status: string
  tgl_mulai_dinas: string
  tgl_selesai_dinas: string
}

interface ExportSlaParams {
  users: UserData[]
  attendance: AttendanceData[]
  approvalRequests: ApprovalRequestData[]
  monthStr: string // "YYYY-MM"
}

export function generateRekonSLA({ users, attendance, approvalRequests, monthStr }: ExportSlaParams) {
  const [year, month] = monthStr.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const workdays = getWorkdaysCount(year, month)
  const kewajibanSla = workdays * 100

  // Format month name for title
  const dateObj = new Date(year, month - 1, 1)
  const monthName = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()

  // 1. Prepare Headers
  const headers = [
    'No',
    'NIK',
    'Nama Petugas',
    'Jabatan',
    'Stasiun'
  ]
  // Add 1 to 31 dates
  for (let d = 1; d <= 31; d++) {
    headers.push(String(d))
  }
  // Add summary columns
  headers.push(
    'Total Nilai Kehadiran',
    'SLA Manual',
    'Nilai Komplain',
    'Kewajiban SLA',
    'Persentase SLA'
  )

  // 2. Prepare Rows
  const rows = users.map((user, idx) => {
    const rowData: Record<string, string | number> = {
      'No': idx + 1,
      'NIK': user.nik || '-',
      'Nama Petugas': user.full_name || '-',
      'Jabatan': user.position || '-',
      'Stasiun': user.stations?.name || user.station_name || '-'
    }

    let totalSlaHarian = 0

    // Calculate SLA for day 1 to 31
    for (let d = 1; d <= 31; d++) {
      if (d > daysInMonth) {
        rowData[String(d)] = '' // Day doesn't exist in this month
        continue
      }

      const currentDateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`

      // Check if user has attendance on this day
      const dayAttendance = attendance.find(a => a.user_id === user.id && a.date === currentDateStr)

      let dayScore = 0

      if (dayAttendance) {
        if (dayAttendance.is_dinas_luar || dayAttendance.status === 'Dinas Luar') {
          dayScore = 70 // Max harian score for Dinas Luar
        } else {
          // Calculate score based on early/late values
          const awal = Number(dayAttendance.nilai_awal_dinas || 0)
          const akhir = Number(dayAttendance.nilai_akhir_dinas || 0)
          dayScore = awal + akhir
          if (dayScore === 0 && (dayAttendance.status === 'Tepat Waktu' || dayAttendance.status === 'Hadir')) {
            dayScore = 70 // Fallback to full score
          }
        }
      } else {
        // Check if there is an approved Dinas Luar request for this day
        const hasDinasLuarRequest = approvalRequests.some(r => {
          if (r.user_id !== user.id || r.type !== 'DINAS_LUAR' || r.status !== 'Disetujui') return false
          const start = new Date(r.tgl_mulai_dinas)
          const end = new Date(r.tgl_selesai_dinas)
          const curr = new Date(currentDateStr)
          // Set hours to 0 to compare dates only
          start.setHours(0,0,0,0)
          end.setHours(0,0,0,0)
          curr.setHours(0,0,0,0)
          return curr >= start && curr <= end
        })

        if (hasDinasLuarRequest) {
          dayScore = 70
        }
      }

      rowData[String(d)] = dayScore
      totalSlaHarian += dayScore
    }

    // SLA Manual (can be configured per user, defaulting to 0)
    const slaManual = Number(user.sla_manual || 0)
    const totalNilaiKehadiran = totalSlaHarian + slaManual
    const nilaiKomplain = 100 // Default compliant value
    
    // SLA Percentage: (Total Nilai Kehadiran + Nilai Komplain) / Kewajiban SLA * 100
    const persentaseSlaVal = ((totalNilaiKehadiran + nilaiKomplain) / kewajibanSla) * 100
    const persentaseSla = `${persentaseSlaVal.toFixed(2)}%`

    rowData['Total Nilai Kehadiran'] = totalNilaiKehadiran
    rowData['SLA Manual'] = slaManual
    rowData['Nilai Komplain'] = nilaiKomplain
    rowData['Kewajiban SLA'] = kewajibanSla
    rowData['Persentase SLA'] = persentaseSla

    return rowData
  })

  // 3. Build Sheet Array Format
  const sheetData = [
    [`DATA REKON SLA PASSENGER SERVICE DAN ANNOUNCER BULAN ${monthName}`],
    [], // Blank row
    headers,
    ...rows.map(row => headers.map(h => row[h]))
  ]

  // Create workbook and sheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(sheetData)

  // Merge title cells
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }
  ]

  // Adjust column widths
  const wscols = headers.map((h, i) => {
    if (i === 2) return { wch: 25 } // Nama Petugas
    if (i === 3) return { wch: 20 } // Jabatan
    if (i === 4) return { wch: 18 } // Stasiun
    if (i >= 5 && i <= 35) return { wch: 4 } // Dates 1-31
    if (i > 35) return { wch: 18 } // Summary cols
    return { wch: 6 } // No, NIK
  })
  ws['!cols'] = wscols

  XLSX.utils.book_append_sheet(wb, ws, 'Rekon SLA')

  // Generate binary Excel file
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' })
  
  // Convert to octet array for file download
  const s2ab = (s: string) => {
    const buf = new ArrayBuffer(s.length)
    const view = new Uint8Array(buf)
    for (let i = 0; i < s.length; i++) {
      view[i] = s.charCodeAt(i) & 0xFF
    }
    return buf
  }

  return s2ab(wbout)
}
