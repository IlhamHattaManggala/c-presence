# Rencana Implementasi Revisi C-Presence (KCI)

Dokumen ini berisi rencana kerja untuk mengimplementasikan 26+ poin revisi pada sistem presensi digital **C-Presence** sesuai dengan spesifikasi dalam dokumen [deskripsi UI Presence_KCI Revisi.pdf](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/deskripsi%20UI%20Presence_KCI%20Revisi.pdf).

---

## User Review Required

> [!IMPORTANT]
> **Aturan Waktu Absensi & Sinkronisasi Shift:**
> 1. Presensi masuk (*Tap In*) hanya diperbolehkan maksimal **1 jam sebelum** jam dinasan.
> 2. Presensi pulang (*Tap Out*) hanya diperbolehkan maksimal **1 jam setelah** jam dinasan.
> 3. Keterlambatan dan ketepatan waktu presensi akan dihitung berdasarkan **Jam Dinasan** yang diatur oleh masing-masing user pada profilnya, bukan lagi default stasiun atau jam 08:00.
> 4. Perubahan Kode Dinas & Jam Dinas oleh user di profilnya akan langsung memperbarui master data shift atau user details di database agar tetap sinkron.

> [!WARNING]
> **Skema Ekspor Excel & Format SLA KCI:**
> Ekspor Excel untuk Rekon SLA bulanan akan dibuat sedinamis mungkin mengikuti format kolom KCI:
> - Menyertakan kolom kehadiran per tanggal (1-31), jika libur bernilai `0`.
> - Menyertakan nilai kehadiran awal (maks 40), kehadiran akhir (maks 30), total nilai kehadiran (SLA Harian, maks 70).
> - Menyertakan kolom SLA Manual, Nilai Komplain (default 100/0), Kewajiban SLA (Hari Dinas * 100), dan Persentase SLA Akhir.

---

## Open Questions

> [!NOTE]
> **Pertanyaan Desain & Teknis:**
> 1. Apakah data shift baru yang dimasukkan user secara manual di profilnya perlu menambahkan entri baru ke tabel `shifts` (jika kodenya belum terdaftar), atau langsung disimpan ke data personal `users` saja? (Direkomendasikan: disimpan di `users` dan disinkronkan ke master data jika kodenya baru).
> 2. Untuk penandatangan dokumen persetujuan (ttd basah), apakah tanda tangan admin digenerate otomatis menggunakan tanda tangan digital/sistem, atau hanya berupa area kosong/placeholder untuk dicetak dan ditandatangani basah secara manual? (Direkomendasikan: area tanda tangan kosong/placeholder dengan nama terang sesuai gambar figma).

---

## Proposed Changes

Pengerjaan akan dibagi menjadi 5 komponen utama untuk kemudahan pelacakan.

### 1. Navigasi & UI Umum Pegawai (User)

Menambahkan tombol kembali, mengaktifkan badge notifikasi belum dibaca, dan merapikan filter notifikasi.

#### [MODIFY] [BottomNav.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/components/BottomNav.tsx)
- Menambahkan *badge* angka notifikasi belum dibaca di sebelah ikon lonceng notifikasi pada navigasi bawah (bottom nav) dengan mengambil count dari tabel `notifications` yang bernilai `is_read = false`.

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/users/notifikasi/page.tsx)
- Menambahkan tombol kembali (*back arrow*) di header atas menuju dashboard.

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/users/notifikasi/info/page.tsx)
- Menghapus tombol filter tab `PS` dan `ANN` di halaman notifikasi (menyisakan filter `ALL` atau langsung menampilkan daftar info berkala).
- Menambahkan tombol kembali (*back arrow*) di header atas.

---

### 2. Formulir & Profil Pegawai (User)

Ppembaruan form dinas luar (upload foto), ubah jadwal (input text & dropdown shift lengkap), dan profil (input kode/jam dinasan).

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/users/time-management/form/page.tsx)
- **Form Izin**: Mengubah kata "Izin Sakit" menjadi "Izin" saja.
- **Form Dinas Luar**: Menambahkan input file unggah foto bukti dokumentasi (maksimal 10MB) dan menyimpannya ke storage Supabase.
- **Form Ubah Jadwal**:
  - Kolom "Kode Dinasan Semula" diubah dari dropdown menjadi input teks biasa (`input type="text"`).
  - Kolom "Kode Dinasan Baru" diisi dengan daftar kode dinasan lengkap KCI (seperti `DP2`, `DP3`, `DS1`, `M`, `L`, dll.) beserta jam operasionalnya.

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/users/profile/page.tsx)
- Menambahkan input kolom **Kode Dinasan** dan **Jam Dinasan** (Jam Masuk - Jam Pulang) agar user bisa mengaturnya secara mandiri setiap bulan.
- Menyinkronkan perubahan ini ke database (`users` table).

---

### 3. Presensi & Laporan Kehadiran Pegawai

Mengimplementasikan logika presensi 1 jam, radius stasiun 600m, editing koordinat, dan laporan bulanan dinamis.

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/users/presence/page.tsx)
- Mengubah radius pengecekan jarak stasiun menjadi **600 meter** (sebelumnya 100m).
- Menambahkan validasi waktu presensi:
  - *Tap In* hanya diperbolehkan $\le 1$ jam sebelum Jam Dinasan masuk.
  - *Tap Out* hanya diperbolehkan $\le 1$ jam setelah Jam Dinasan pulang.
- Mengubah perhitungan keterlambatan (punctuality) agar membandingkan waktu saat ini dengan **Jam Dinasan** pribadi yang diatur di profil user.

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/users/laporan/page.tsx)
- Mengubah tulisan bulan statis menjadi dropdown interaktif sehingga user bisa memilih dan melihat riwayat kehadiran bulan sebelumnya (misalnya bulan Mei).
- Menyesuaikan tampilan status di baris laporan:
  - Jika pengajuan dinas luar disetujui, tanggal tersebut akan otomatis memunculkan tombol warna hijau bertuliskan **"Dinas Luar"**.
  - Jika presensi masuk tepat waktu, status presensi berwarna biru bertuliskan **"Tepat Waktu"**.

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/users/dokumen/dinas-luar/page.tsx)
#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/users/dokumen/izin/page.tsx)
#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/users/dokumen/ubah-jadwal/page.tsx)
- Menambahkan visualisasi dokumen persetujuan lengkap dengan kolom tanda tangan basah (Mengetahui PT KAI Commuter dan Petugas Yang Bertanggung Jawab) di bawah.
- Menambahkan tombol **Download PDF** dan **Print** di bagian bawah halaman.

---

### 4. Admin UI & Master Data

Perbaikan pada web admin, formulir persetujuan, input search, registrasi admin, dan validasi Excel.

#### [MODIFY] [layout.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/admin/layout.tsx)
- Menambahkan teks subtitle **"PT KAI Commuter"** di bawah nama masing-masing fitur/halaman di sisi admin.
- Mengganti logo KAI Commuter dengan logo asli yang beresolusi baik.

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/admin/dashboard/page.tsx)
- Mengubah visualisasi statistika di beranda admin menjadi menampilkan daftar **Apresiasi Pegawai 5 Terbaik Bulanan** (3 Passenger Service dan 3 Announcer paling rajin yang tidak pernah telat, tidak termasuk yang melakukan izin/dinas luar/ubah dinasan).

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/admin/master-data/page.tsx)
- Membuka akses registrasi agar admin bisa mendaftarkan akun-akun admin baru tanpa error.
- Menyembunyikan tampilan password pada form tambah data pengguna (menggunakan dots/asterisks `type="password"`).
- Menambahkan kolom input Latitude & Longitude koordinat stasiun agar admin bisa mengeditnya secara manual.

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/admin/dokumen/pendaftaran/page.tsx)
- Mengganti tombol aksi "Kirim" menjadi ikon tempat sampah untuk langsung menghapus data pendaftaran secara langsung.
- Mengoptimalkan import data pegawai via Excel agar dapat memproses 1000-2000 data sekaligus tanpa mengalami timeout atau database error, serta mendeteksi kolom excel secara dinamis.

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/admin/dokumen/broadcast/page.tsx)
- Mengubah nama tombol "Tambah Informasi Pegawai" menjadi "Tambah Informasi Broadcast".
- Mengubah warna tombol menjadi biru tua atau hijau tua dan memindahkannya ke bawah tombol tab.
- Menyelaraskan pencarian status dan pencarian judul agar rata kanan, serta status & kolom aksi agar rata kanan seimbang.
- Memperbaiki penulisan typo: `outsourching` -> `outsourcing` dan `brodcast` -> `broadcast`.

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/admin/persetujuan/page.tsx)
- Menambahkan filter status lengkap (Disetujui, Ditolak, Proses, Belum Disetujui) beserta tombol **"Cari"**.
- Mengubah semua input teks pencarian agar memiliki warna font hitam agar mudah terbaca.

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/admin/dokumen/presensi/page.tsx)
- Mengaktifkan fitur edit file dokumen SOP dan memastikan input nama SOP menggunakan warna teks hitam.

---

### 5. Logika SLA & Laporan Excel KCI

Penghitungan skor SLA dan export data rekon SLA Excel bulanan.

#### [NEW] [sla-helper.ts](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/lib/sla-helper.ts)
- Membuat fungsi pembantu untuk menghitung Nilai Awal Dinas (skor keterlambatan masuk, maks 40) dan Nilai Akhir Dinas (skor pulang cepat, maks 30) sesuai tabel SOP.

#### [NEW] [excel-export.ts](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/lib/excel-export.ts)
- Menggunakan library `xlsx` untuk meng-generate file Excel Rekon SLA bulanan yang memiliki format persis seperti template KCI.

---

## Verification Plan

### Automated Tests
- Menjalankan linting dan build lokal:
  ```bash
  npm run lint
  npm run build
  ```

### Manual Verification
1. **Verifikasi Radius & Presensi:** 
   - Lakukan mock lokasi GPS di area stasiun dan di luar stasiun (> 600 meter) untuk memverifikasi muncul/tidaknya peta dan kamera.
   - Uji coba presensi tepat waktu dan terlambat, lalu verifikasi apakah warna di laporan presensi berubah menjadi biru (Tepat Waktu) atau merah (Telat).
2. **Pengujian Form & Dokumen:**
   - Lakukan pengisian form Dinas Luar dengan melampirkan foto berukuran hingga 10MB.
   - Cek halaman dokumen persetujuan setelah disetujui admin untuk melihat layout tanda tangan basah dan coba klik tombol Download PDF & Print.
3. **Pengujian Admin:**
   - Coba lakukan pendaftaran admin baru dan ganti password untuk melihat masking titik-titik.
   - Jalankan impor data pegawai dengan file Excel berisi > 1000 baris.
   - Klik ekspor rekon SLA bulanan dan buka file Excel yang dihasilkan untuk mencocokkan strukturnya dengan template KCI.
