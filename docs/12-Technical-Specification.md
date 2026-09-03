# 12. Technical Specification

## Overview

Dokumen ini menjelaskan implementasi teknis prototype **Masjid Archive** sesuai Task 05, berdasarkan [13. Data Model](./13-Data-Model.md) dan wireframe yang sudah disetujui. Stack ditentukan oleh mentor PKL — fokus prototype: sederhana, konsisten, mudah divibecoding.

## Tech Stack

| Layer                       | Tools                                                                                                             | Catatan                                                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend Framework          | Next.js (App Router)                                                                                              | Server Components untuk fetching data, Client Components untuk form interaktif                                                                                       |
| UI Components               | shadcn/ui                                                                                                         | Button, Input, Card, Table, Form, Dialog, Toast — reuse, jangan bikin komponen custom kalau shadcn sudah punya                                                       |
| Styling                     | Tailwind CSS                                                                                                      | Ikuti token dari [11. Design Guidelines](./11-Design-Guidelines.md)                                                                                                  |
| Icons                       | Lucide Icons                                                                                                      | Ganti Material Symbols di wireframe dengan padanan Lucide (mis. `archive`, `upload`, `search`, `image`)                                                              |
| Database                    | SQLite (file lokal, `dev.db`)                                                                                     | Cukup untuk prototype, tidak perlu server DB terpisah                                                                                                                |
| ORM                         | Prisma                                                                                                            | Schema mengikuti [13. Data Model](./13-Data-Model.md)                                                                                                                |
| File Storage (foto laporan) | Local filesystem (`/public/uploads/reports/`)                                                                     | DB hanya menyimpan path/URL file, bukan binary — cukup untuk prototype; migrasi ke cloud storage (S3-compatible) didokumentasikan terpisah jika lanjut ke production |
| Auth                        | Session cookie sederhana (mis. `iron-session`) diverifikasi terhadap 1 kredensial bersama di environment variable | Bukan per-user login — lihat [Auth Model](#auth-model)                                                                                                               |

## Auth Model

- Satu kredensial bersama untuk seluruh pengurus DKM (`AUTH_USERNAME`, `AUTH_PASSWORD` di `.env`).
- Login memverifikasi kredensial → set session cookie (HTTP-only) → redirect ke halaman Arsip Laporan.
- Identitas individu (Bendahara 1/2/Pengurus) **tidak** dipakai untuk otentikasi, tapi dipakai sebagai pilihan **"Diunggah oleh"** saat mengisi form Unggah Laporan → mengisi field `uploaded_by` di tabel `Report`.
- Semua halaman selain `/login` dilindungi middleware yang mengecek session cookie; jika tidak ada, redirect ke `/login`.

## Prisma Schema (ringkas)

```prisma
model User {
  id       String   @id @default(cuid())
  name     String
  role     String   // "Bendahara 1" | "Bendahara 2" | "Pengurus"
  reports  Report[]
}

model Report {
  id            String   @id @default(cuid())
  reportDate    DateTime
  photoUrl      String
  year          Int
  month         Int
  weekOfMonth   Int
  uploadedAt    DateTime @default(now())
  uploadedById  String
  uploadedBy    User     @relation(fields: [uploadedById], references: [id])
}
```

- `year`, `month`, `weekOfMonth` dihitung di server (bukan input manual) saat `reportDate` diterima, sesuai Database Rules di Data Model.

## Folder Structure (ringkas)

```
app/
  (auth)/login/page.tsx
  (main)/laporan/page.tsx        # Arsip Laporan
  (main)/laporan/[id]/page.tsx   # Detail Laporan
  (main)/unggah/page.tsx         # Unggah Laporan
  (main)/cari/page.tsx           # Cari Arsip
  api/
    auth/login/route.ts
    auth/logout/route.ts
    reports/route.ts             # GET (list/group/search), POST (create)
    reports/[id]/route.ts        # GET detail
    users/route.ts               # GET daftar pengurus (dropdown "Diunggah oleh")
lib/
  prisma.ts
  session.ts
  derive-period.ts               # helper hitung year/month/weekOfMonth dari reportDate
components/
  ui/                            # shadcn/ui components
  report-card.tsx
  upload-form.tsx
  search-filters.tsx
prisma/
  schema.prisma
public/
  uploads/reports/
```

## Non-Functional Notes

- **Responsive**: wajib desktop + mobile (sesuai wireframe — sidebar desktop, bottom nav mobile).
- **Validasi upload**: foto wajib (format jpg/png, maks ukuran tertentu — tentukan saat implementasi, mis. 5MB), `reportDate` wajib, `uploadedBy` wajib dipilih.
- **Error handling upload**: tampilkan banner error inline (sesuai wireframe "Unggah Gagal") jika upload gagal (koneksi/validasi).
- **Empty & not-found states**: harus ditangani di UI sesuai wireframe (`Arsip Laporan Kosong`, `Hasil Pencarian Tidak Ditemukan`).
- **Data realistis**: gunakan data dummy laporan mingguan (tanggal Jumat berurutan) saat seed database, bukan lorem ipsum.

## Environment Variables

```
DATABASE_URL="file:./dev.db"
AUTH_USERNAME=
AUTH_PASSWORD=
SESSION_SECRET=
```
