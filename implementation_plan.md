# Rencana Implementasi Revisi C-Presence (KCI)

Dokumen ini berisi rencana detail untuk mengimplementasikan sisa poin revisi pada sistem presensi digital **C-Presence** sesuai dengan spesifikasi dokumen [deskripsi UI Presence_KCI Revisi.pdf](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/deskripsi%20UI%20Presence_KCI%20Revisi.pdf).

---

## User Review Required

> [!IMPORTANT]
> **Aturan Waktu Absensi & Perhitungan Keterlambatan:**
> 1. **Tap In (Presensi Masuk)** dibatasi maksimal **1 jam sebelum** Jam Dinasan masuk.
> 2. **Tap Out (Presensi Pulang)** dibatasi maksimal **1 jam setelah** Jam Dinasan pulang.
> 3. Perhitungan keterlambatan (late arrival) dan pulang cepat (early departure) menggunakan **Jam Dinasan** pribadi yang dikonfigurasi secara mandiri oleh user pada profilnya, bukan lagi default stasiun atau jam 08:00.
> 4. Status presensi di laporan harian akan berwarna **Biru ("Tepat Waktu")** jika tepat waktu, dan **Hijau ("Dinas Luar")** jika pengajuan dinas luar disetujui.

> [!WARNING]
> **Skema Ekspor Excel & Format SLA KCI:**
> Ekspor Excel Rekon SLA bulanan akan dibuat dengan layout kolom persis seperti template KCI:
> - Baris kehadiran per tanggal (1-31) menampilkan nilai harian (maks 70, libur = 0).
> - Menyertakan kolom **SLA Manual**, **Nilai Komplain** (default 100/0), **Kewajiban SLA** (Hari Dinas * 100), dan **Persentase SLA Akhir**.

---

## Open Questions

> [!NOTE]
> **Tanda Tangan Basah Dokumen Persetujuan:**
> Area tanda tangan di bagian bawah dokumen persetujuan (Izin, Dinas Luar, Ubah Jadwal) berupa kolom kosong/placeholder. User dapat mengunduh dokumen sebagai PDF atau mencetaknya langsung melalui browser untuk ditandatangani basah secara manual oleh pihak KAI Commuter dan Petugas.

---

## Database Schema Changes (Supabase SQL)

Sebelum pengerjaan kode, beberapa perubahan kolom pada database Supabase diperlukan:

```sql
-- 1. Tambah kolom Jam Dinasan pada tabel users
ALTER TABLE users ADD COLUMN IF NOT EXISTS dinasan_start_time TIME;
ALTER TABLE users ADD COLUMN IF NOT EXISTS dinasan_end_time TIME;

-- 2. Tambah kolom Nilai SLA & Bendera Dinas Luar pada tabel attendance
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS nilai_awal_dinas NUMERIC DEFAULT 0;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS nilai_akhir_dinas NUMERIC DEFAULT 0;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS sla_harian NUMERIC DEFAULT 0;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_dinas_luar BOOLEAN DEFAULT FALSE;

-- 3. Tambah kolom Radius Kustom pada tabel stations (jika belum ada)
ALTER TABLE stations ADD COLUMN IF NOT EXISTS radius_meters INTEGER DEFAULT 600;

-- 4. Tambah kolom attachment_url untuk bukti foto Dinas Luar pada tabel approval_requests
ALTER TABLE approval_requests ADD COLUMN IF NOT EXISTS attachment_url TEXT;
```

---

## Proposed Changes

Pengerjaan akan dibagi menjadi 5 komponen utama untuk kemudahan pelacakan.

### 1. Navigasi & UI Umum Pegawai (User)

Menambahkan tombol kembali, mengaktifkan badge notifikasi belum dibaca, dan merapikan filter notifikasi.

#### [MODIFY] [BottomNav.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/components/BottomNav.tsx)
- Menghitung jumlah notifikasi belum dibaca (`is_read = false`) dari tabel `notifications` untuk user saat ini.
- Menampilkan *badge* angka merah di sebelah ikon lonceng pada navigasi bawah (bottom nav) jika jumlahnya > 0.

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/users/notifikasi/page.tsx)
- Menambahkan tombol kembali (*back arrow* / chevron) di sebelah kiri judul header "Notifikasi" untuk kembali ke Dashboard.

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/users/notifikasi/info/page.tsx)
- Menghapus filter tab `PS` dan `ANN` di halaman notifikasi (sehingga langsung menampilkan semua informasi/ALL).
- Menambahkan tombol kembali (*back arrow*) di header atas menuju halaman notifikasi utama.

---

### 2. Formulir & Profil Pegawai (User)

Pembaruan form dinas luar (upload foto), ubah jadwal (input text & dropdown shift lengkap), dan profil (input kode/jam dinasan).

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/users/time-management/form/page.tsx)
- **Form Izin:** Menghapus kata "Sakit" pada label tab agar menjadi "Izin" saja.
- **Form Dinas Luar:** Menambahkan input file untuk mengunggah foto bukti dokumentasi (maksimal 10MB) dan menyimpannya ke Supabase storage `dinas-luar-evidence` bucket.
- **Form Ubah Jadwal:**
  - Mengubah kolom "Kode Dinasan Semula" dari static readonly menjadi input teks biasa agar user bisa mengetik sendiri.
  - Mengisi kolom "Kode Dinasan Baru" dengan dropdown daftar kode dinasan lengkap KCI (seperti `DP2`, `DP3`, `DS1`, `M`, `L`, dll.) beserta jam operasionalnya.

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/users/profile/page.tsx)
- Menambahkan input kolom **Kode Dinasan** (dropdown) dan **Jam Dinasan** (input waktu Jam Masuk dan Jam Pulang) pada form edit profil agar user bisa memperbaruinya secara mandiri setiap bulan.
- Menyimpan nilai ini ke kolom `shift_code`, `dinasan_start_time`, dan `dinasan_end_time` di database `users`.

---

### 3. Presensi & Laporan Kehadiran Pegawai

Mengimplementasikan logika presensi 1 jam, radius stasiun 600m, editing koordinat, dan laporan bulanan dinamis.

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/users/presence/page.tsx)
- Memastikan radius presensi menggunakan data dinamis dari database (`station.radius_meters`, fallback 600m).
- Menambahkan validasi batasan waktu presensi:
  - *Tap In* hanya diperbolehkan $\le 1$ jam sebelum `dinasan_start_time`.
  - *Tap Out* hanya diperbolehkan $\le 1$ jam setelah `dinasan_end_time`.
- Membandingkan jam absen masuk/pulang dengan `dinasan_start_time` and `dinasan_end_time` dari data user.
- Memanggil fungsi hitung skor SLA dan menyimpannya ke database (`nilai_awal_dinas`, `nilai_akhir_dinas`, `sla_harian`).

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/users/laporan/page.tsx)
- Mengubah tulisan bulan statis menjadi dropdown interaktif sehingga user bisa memilih dan melihat riwayat kehadiran bulan sebelumnya (misalnya bulan Mei).
- Menyesuaikan tampilan status di baris laporan:
  - Jika pengajuan dinas luar disetujui, tanggal tersebut akan memunculkan badge warna hijau bertuliskan **"Dinas Luar"**.
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
- Mengubah visualisasi statistika di beranda admin menjadi menampilkan daftar **Apresiasi Pegawai 5 Terbaik Bulanan** (3 Passenger Service dan 3 Announcer paling rajin yang tidak pernah telat, tidak termasuk yang melakukan izin/dinas luar/ubah dinasan) dan 5 terbawah.
- Menambahkan dropdown pilihan bulan untuk melihat riwayat apresiasi.

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/admin/master-data/page.tsx)
- Memperbaiki alur registrasi admin baru agar tidak memicu error database.
- Menyembunyikan tampilan password pada form tambah data pengguna (`type="password"`).
- Menambahkan kolom input Latitude & Longitude koordinat stasiun agar admin bisa mengeditnya secara manual.

#### [MODIFY] [page.tsx](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/app/admin/dokumen/pendaftaran/page.tsx)
- Mengganti tombol aksi "Kirim" menjadi ikon tempat sampah untuk langsung menghapus data pendaftaran secara langsung.
- Mengoptimalkan import data pegawai via Excel dengan library `xlsx` menggunakan batch insertion untuk memproses 1000-2000 data tanpa timeout, serta mendeteksi kolom secara dinamis.

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

Penghitungan skor SLA harian dan bulanan, serta pembuatan file Excel Rekon SLA.

#### [NEW] [sla-helper.ts](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/lib/sla-helper.ts)
- Membuat fungsi pembantu untuk menghitung Nilai Awal Dinas (skor keterlambatan masuk, maks 40) dan Nilai Akhir Dinas (skor pulang cepat, maks 30) sesuai tabel SOP.
- Ketentuan keterlambatan tap-in:
  - <=0 menit = 40 poin
  - 1–5 menit = 38 poin
  - 6–10 menit = 36 poin
  - 11–15 menit = 34 poin
  - 16–20 menit = 32 poin
  - >20 menit = 30 poin
- Ketentuan pulang cepat tap-out:
  - <=0 menit = 30 poin
  - 1–5 menit = 28.5 poin
  - 6–10 menit = 27 poin
  - 11–15 menit = 25.5 poin
  - 16–20 menit = 24 poin
  - >20 menit = 22.5 poin

#### [NEW] [excel-export.ts](file:///d:/Ilham%20Hatta%20Manggala/Joki%20Project/c-presence/lib/excel-export.ts)
- Menggunakan library `xlsx` untuk meng-generate file Excel Rekon SLA bulanan dengan kolom detail tanggal 1-31, SLA manual, Nilai komplain default 100, Kewajiban SLA (Hari Dinas * 100), dan Persentase SLA Akhir.

---

## Verification Plan

### Automated Tests
- Menjalankan linting dan build lokal untuk memastikan tidak ada error TypeScript:
  ```bash
  npm run lint
  npm run build
  ```

### Manual Verification
1. **Verifikasi Radius & Batasan Waktu:**
   - Lakukan mock lokasi GPS di area stasiun dan di luar stasiun (> 600 meter) untuk memverifikasi muncul/tidaknya tombol presensi.
   - Uji coba presensi tap-in $\le$ 1 jam sebelum jam dinasan, dan diluar batasan waktu untuk memastikan validasi error bekerja.
2. **Pengujian Form & Dokumen:**
   - Lakukan pengisian form Dinas Luar dengan melampirkan foto berukuran hingga 10MB.
   - Cek halaman dokumen persetujuan setelah disetujui admin untuk melihat layout tanda tangan basah dan coba klik tombol Download PDF & Print.
3. **Pengujian Admin:**
   - Coba lakukan pendaftaran admin baru dan ganti password untuk melihat masking titik-titik.
   - Jalankan impor data pegawai dengan file Excel berisi > 1000 baris.
   - Klik ekspor rekon SLA bulanan dan buka file Excel yang dihasilkan untuk mencocokkan strukturnya dengan template KCI.
