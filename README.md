# ⚽ An-Nur Mini Soccer — Website Resmi Turnamen

Website resmi untuk turnamen mini soccer **An-Nur Mini Soccer** (9–10 Oktober 2026). Dibangun dengan **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, dan **Supabase**. Siap dideploy ke **Vercel**.

---

## 🌟 Fitur Utama

### 📱 Halaman Publik (Mobile-First)
- **Beranda (`/`)**: Hero turnamen, countdown timer ke 9 Oktober 2026, status pertandingan sedang berlangsung / berikutnya, hasil terbaru, jadwal terdekat, dan navigasi cepat.
- **Jadwal Pertandingan (`/jadwal`)**: Dikelompokkan per hari dan jam. Filter berdasarkan Hari, Fase/Grup, dan Lapangan.
- **Skor Live (`/live`)**: Pembaruan otomatis setiap 5 detik (auto-refresh), kartu skor besar, titik merah animasi berdenyut (*pulsing red dot*), waktu pembaruan terakhir (*HH:MM:SS*), dan hasil pertandingan terbaru.
- **Klasemen Grup (`/klasemen`)**: Dihitung otomatis dari pertandingan yang berstatus Selesai. Tabel per grup menampilkan: Main (M), Menang (M), Seri (S), Kalah (K), Gol Masuk (GM), Gol Kemasukan (GK), Selisih Gol (SG), dan Poin (P).
- **Daftar & Detail Tim (`/tim`, `/tim/[id]`)**: Profil tim dengan logo/lencana inisial berlatar warna tim, jadwal & hasil tim, serta ringkasan posisi klasemen.
- **Informasi Acara (`/info`)**: Tanggal, lokasi, tautan Google Maps, peraturan turnamen, aturan tie-break, dan kontak panitia.
- **Navigasi Bawah (*Bottom Navigation Bar*)**: Pengalaman nyaman seperti aplikasi mobile di perangkat HP.

### 🔒 Dashboard Admin (`/admin`)
- **Login Berpassword (`/admin/login`)**: Autentikasi server-side dengan JWT sesi tersimpan di cookie `httpOnly` + `secure`, dilengkapi proteksi *rate limiting* (maksimal 5 kali percobaan gagal per menit).
- **Beranda Admin (`/admin`)**: Statistik ringkas jumlah tim, total laga, laga hari ini, dan laga live.
- **Manajemen Tim (`/admin/tim`)**: Tambah, ubah, dan hapus tim (dilengkapi validasi pencegahan hapus jika tim sudah bertanding).
- **Manajemen Jadwal (`/admin/pertandingan`)**: Atur jadwal pertandingan, lapangan, tanggal, jam *kickoff*, dan grup. Dilengkapi validasi Tim A ≠ Tim B.
- **Input Skor Cepat (`/admin/skor`)**: **Layar utama panitia di pinggir lapangan**. Tombol besar `+1` / `-1` untuk kedua tim (ramah HP, satu tangan), pengubah status alur pertandingan (`Mulai` → `Istirahat` → `Lanjut` → `Selesai`), auto-save langsung ke database.
- **Pengaturan & Reset Data (`/admin/pengaturan`)**: Ubah informasi turnamen dan fitur *Danger Zone* untuk mereset seluruh data uji coba dengan konfirmasi ganda (ketik `RESET`).

---

## 🛠️ Persiapan Database Supabase

1. Buka [Supabase Dashboard](https://database.new) dan buat project baru.
2. Buka menu **SQL Editor**.
3. Buka file [`supabase-schema.sql`](./supabase-schema.sql) di repositori ini, salin seluruh kodenya, dan jalankan (*Run*) di Supabase SQL Editor.
4. (Opsional) Di bagian bawah file `supabase-schema.sql`, aktifkan baris *INSERT* contoh untuk mengisi data dummy (8 tim dan 4 pertandingan).

---

## ⚙️ Variabel Lingkungan (*Environment Variables*)

Salin file `.env.local.example` menjadi `.env.local`:

```bash
cp .env.local.example .env.local
```

Isi nilainya sesuai kredensial Anda:

```env
# Supabase (didapat dari Project Settings -> API di Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh......
SUPABASE_SERVICE_ROLE_KEY=eyJh......

# Keamanan Admin
ADMIN_PASSWORD=kata_sandi_rahasia_admin
SESSION_SECRET=acak_string_panjang_minimal_32_karakter_untuk_jwt_key
```

---

## 🚀 Menjalankan Secara Lokal

```bash
# Instal dependensi
npm install

# Jalankan server pengembangan
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser (disarankan aktifkan *Device Toolbar* / tampilan HP untuk merasakan sensasi navigasi mobile).

Akses dashboard admin di [http://localhost:3000/admin](http://localhost:3000/admin).

---

## ☁️ Panduan Deploy ke Vercel

1. Push kode ini ke repositori GitHub / GitLab.
2. Buka [Vercel](https://vercel.com) dan impor repositori tersebut.
3. Di bagian **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD` (password login panitia)
   - `SESSION_SECRET` (rahasia enkripsi cookie)
4. Klik **Deploy**. Selesai! 🎉
