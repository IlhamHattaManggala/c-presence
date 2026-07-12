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
  clock_in?: string
  clock_out?: string
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

function buildSheetData(
  filteredUsers: UserData[],
  attendance: AttendanceData[],
  approvalRequests: ApprovalRequestData[],
  monthName: string,
  year: number,
  month: number,
  daysInMonth: number,
  workdays: number,
  kewajibanSla: number,
  title: string
) {
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

  const rows = filteredUsers.map((user, idx) => {
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
          dayScore = 100 // Max harian score for Dinas Luar
        } else {
          // Calculate score based on early/late values
          const awal = Number(dayAttendance.nilai_awal_dinas || 0)
          const akhir = Number(dayAttendance.nilai_akhir_dinas || 0)
          dayScore = awal + akhir
          if (dayScore === 0 && (dayAttendance.status === 'Tepat Waktu' || dayAttendance.status === 'Hadir')) {
            dayScore = 100 // Fallback to full score
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
          dayScore = 100
        }
      }

      rowData[String(d)] = dayScore
      totalSlaHarian += dayScore
    }

    // SLA Manual
    const slaManual = Number(user.sla_manual || 0)
    const totalNilaiKehadiran = totalSlaHarian + slaManual
    const nilaiKomplain = 100 // Default compliant value
    
    // SLA Percentage
    const persentaseSlaVal = ((totalNilaiKehadiran + nilaiKomplain) / kewajibanSla) * 100
    const persentaseSla = `${persentaseSlaVal.toFixed(2)}%`

    rowData['Total Nilai Kehadiran'] = totalNilaiKehadiran
    rowData['SLA Manual'] = slaManual
    rowData['Nilai Komplain'] = nilaiKomplain
    rowData['Kewajiban SLA'] = kewajibanSla
    rowData['Persentase SLA'] = persentaseSla

    return rowData
  })

  return [
    [title],
    [], // Blank row
    headers,
    ...rows.map(row => headers.map(h => row[h]))
  ]
}

function applyStyles(ws: any, headerLength: number) {
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: headerLength - 1 } }
  ]

  const wscols = Array.from({ length: headerLength }).map((_, i) => {
    if (i === 2) return { wch: 25 } // Nama Petugas
    if (i === 3) return { wch: 20 } // Jabatan
    if (i === 4) return { wch: 18 } // Stasiun
    if (i >= 5 && i <= 35) return { wch: 4 } // Dates 1-31
    if (i > 35) return { wch: 18 } // Summary cols
    return { wch: 6 } // No, NIK
  })
  ws['!cols'] = wscols
}

export function generateRekonSLA({ users, attendance, approvalRequests, monthStr }: ExportSlaParams) {
  const [year, month] = monthStr.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const workdays = getWorkdaysCount(year, month)
  const kewajibanSla = workdays * 100

  // Format month name for title
  const dateObj = new Date(year, month - 1, 1)
  const monthName = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()

  // Sort users helper: Passenger Service first, then Announcer
  const sortUsersByPosition = (list: UserData[]) => {
    return [...list].sort((a, b) => {
      const posA = (a.position || '').toLowerCase()
      const posB = (b.position || '').toLowerCase()
      
      const isPSA = posA.includes('passenger service') || posA.includes('ps')
      const isPSB = posB.includes('passenger service') || posB.includes('ps')
      
      const isAnnA = posA.includes('announcer') || posA.includes('ann')
      const isAnnB = posB.includes('announcer') || posB.includes('ann')
      
      if (isPSA && !isPSB) return -1
      if (!isPSA && isPSB) return 1
      if (isAnnA && !isAnnB) return -1
      if (!isAnnA && isAnnB) return 1
      
      return (a.full_name || '').localeCompare(b.full_name || '')
    })
  }

  const sortedAllUsers = sortUsersByPosition(users)
  const annUsers = sortedAllUsers.filter(u => (u.position || '').toLowerCase().includes('announcer') || (u.position || '').toLowerCase().includes('ann'))
  const psUsers = sortedAllUsers.filter(u => (u.position || '').toLowerCase().includes('passenger service') || (u.position || '').toLowerCase().includes('ps'))

  const wb = XLSX.utils.book_new()

  // Sheet 1: REKON FINGER ANN
  const annSheetData = buildSheetData(
    annUsers, attendance, approvalRequests, monthName, year, month, daysInMonth, workdays, kewajibanSla,
    `DATA REKON SLA ANNOUNCER BULAN ${monthName}`
  )
  const annWs = XLSX.utils.aoa_to_sheet(annSheetData)
  applyStyles(annWs, annSheetData[2].length)
  XLSX.utils.book_append_sheet(wb, annWs, 'REKON FINGER ANN')

  // Sheet 2: REKON FINGER PS
  const psSheetData = buildSheetData(
    psUsers, attendance, approvalRequests, monthName, year, month, daysInMonth, workdays, kewajibanSla,
    `DATA REKON SLA PASSENGER SERVICE BULAN ${monthName}`
  )
  const psWs = XLSX.utils.aoa_to_sheet(psSheetData)
  applyStyles(psWs, psSheetData[2].length)
  XLSX.utils.book_append_sheet(wb, psWs, 'REKON FINGER PS')

  // Sheet 3: REKON SLA (DATA FINGER)
  const allSheetData = buildSheetData(
    sortedAllUsers, attendance, approvalRequests, monthName, year, month, daysInMonth, workdays, kewajibanSla,
    `DATA REKON SLA PASSENGER SERVICE DAN ANNOUNCER BULAN ${monthName}`
  )
  const allWs = XLSX.utils.aoa_to_sheet(allSheetData)
  applyStyles(allWs, allSheetData[2].length)
  XLSX.utils.book_append_sheet(wb, allWs, 'REKON SLA (DATA FINGER)')

  // Generate binary Excel file
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' })
  return s2ab(wbout)
}

interface ExportAttendanceParams {
  users: UserData[]
  attendance: AttendanceData[]
  monthStr: string // "YYYY-MM"
}

export function generateAttendanceReport({ users, attendance, monthStr }: ExportAttendanceParams) {
  const [year, month] = monthStr.split('-').map(Number)
  const dateObj = new Date(year, month - 1, 1)
  const monthName = dateObj.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()

  // 1. Prepare Headers
  const headers = [
    'No',
    'NIK',
    'Nama Petugas',
    'Jabatan',
    'Stasiun',
    'Tanggal',
    'Jam Masuk (Tap In)',
    'Jam Pulang (Tap Out)',
    'Status',
    'Nilai Awal Dinas',
    'Nilai Akhir Dinas',
    'SLA Harian'
  ]

  // Sort users helper: Passenger Service first, then Announcer
  const sortUsersByPosition = (list: UserData[]) => {
    return [...list].sort((a, b) => {
      const posA = (a.position || '').toLowerCase()
      const posB = (b.position || '').toLowerCase()
      
      const isPSA = posA.includes('passenger service') || posA.includes('ps')
      const isPSB = posB.includes('passenger service') || posB.includes('ps')
      
      const isAnnA = posA.includes('announcer') || posA.includes('ann')
      const isAnnB = posB.includes('announcer') || posB.includes('ann')
      
      if (isPSA && !isPSB) return -1
      if (!isPSA && isPSB) return 1
      if (isAnnA && !isAnnB) return -1
      if (!isAnnA && isAnnB) return 1
      
      return (a.full_name || '').localeCompare(b.full_name || '')
    })
  }

  const sortedUsers = sortUsersByPosition(users)

  // 2. Prepare Rows (Sorted by User Position order, then Date)
  const rows: any[] = []
  let globalIdx = 1

  const sortedAttendance = [...attendance].sort((a, b) => {
    const userIdxA = sortedUsers.findIndex(u => u.id === a.user_id)
    const userIdxB = sortedUsers.findIndex(u => u.id === b.user_id)
    if (userIdxA !== userIdxB) return userIdxA - userIdxB
    return a.date.localeCompare(b.date)
  })

  sortedAttendance.forEach((att) => {
    const user = sortedUsers.find(u => u.id === att.user_id)
    if (!user) return

    const dateFormatted = new Date(att.date).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const awal = Number(att.nilai_awal_dinas || 0)
    const akhir = Number(att.nilai_akhir_dinas || 0)
    const totalSla = awal + akhir

    rows.push([
      globalIdx++,
      user.nik || '-',
      user.full_name || '-',
      user.position || '-',
      user.stations?.name || user.station_name || '-',
      dateFormatted,
      att.clock_in ? String(att.clock_in).substring(0, 5) : '--:--',
      att.clock_out ? String(att.clock_out).substring(0, 5) : '--:--',
      att.status || (att.is_dinas_luar ? 'Dinas Luar' : 'Hadir'),
      awal,
      akhir,
      totalSla
    ])
  })

  // 3. Build Sheet Array Format
  const sheetData = [
    [`LAPORAN DETAIL KEHADIRAN PETUGAS - BULAN ${monthName}`],
    [], // Blank row
    headers,
    ...rows
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
    if (i === 5) return { wch: 12 } // Tanggal
    if (i === 6 || i === 7) return { wch: 22 } // Tap In / Tap Out
    if (i >= 8) return { wch: 18 } // Status / Score
    return { wch: 6 } // No, NIK
  })
  ws['!cols'] = wscols

  XLSX.utils.book_append_sheet(wb, ws, 'Laporan Kehadiran')

  // Generate binary Excel file
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' })
  return s2ab(wbout)
}

// Convert to octet array for file download
function s2ab(s: string) {
  const buf = new ArrayBuffer(s.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < s.length; i++) {
    view[i] = s.charCodeAt(i) & 0xFF
  }
  return buf
}
