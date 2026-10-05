# Indeks Diagram UML — Masjid Archive

> **Terakhir diperbarui**: 5 Oktober 2026  
> **Status**: Selaras penuh dengan skema database dan implementasi fitur V1–V6 + Perbaikan Mobile (#058)

Direktori ini berisi seluruh diagram UML yang mendokumentasikan desain sistem aplikasi **Masjid Archive** — sistem arsip dan manajemen keuangan digital DKM Masjid Al-Luqman.

Semua diagram ditulis dalam format **PlantUML** (`.puml`) dan bersifat tambahan (tidak di-push ke `main`) namun tetap disinkronkan dengan perkembangan kode agar selaras dengan implementasi aktual.

---

## Daftar Diagram

### 1. ERD (Entity Relationship Diagram)
**File**: [`erd.puml`](./erd.puml)

Menggambarkan struktur tabel database dan relasi antar entitas menggunakan notasi **Crow's Foot**. Mencerminkan skema Prisma final yang digunakan di Vercel Postgres.

**Entitas yang digambarkan**:
| Entitas | Keterangan |
|---|---|
| `User` | Akun pengurus DKM (Google OAuth via NextAuth) |
| `Report` | Laporan kas mingguan (1 laporan = 1 Jumat) |
| `Attachment` | File lampiran per laporan (image/pdf/excel) |
| `Transaction` | Baris transaksi hasil ekstraksi AI atau parser Excel |
| `Donor` | Profil donatur lintas periode (fuzzy-matched) |
| `Account` | Tabel OAuth NextAuth (onDelete: Cascade dari User) |
| `Session` | Sesi login aktif (onDelete: Cascade dari User) |
| `VerificationToken` | Token verifikasi email NextAuth (tanpa FK ke User) |

**Aturan integritas yang dicatat di ERD**:
- Relasi `Report → Attachment → Transaction`: **ON DELETE RESTRICT** (transaksi yang sudah diverifikasi tidak bisa terhapus secara implisit)
- Relasi `User → Account` dan `User → Session`: **ON DELETE CASCADE** (akun NextAuth ikut terhapus jika user dihapus)
- `Donor.normalizedName`: **UNIQUE** — kunci fuzzy matching antar periode

---

### 2. Class Diagram
**File**: [`class-diagram.puml`](./class-diagram.puml)

Menggambarkan struktur kelas OOP dengan atribut, tipe data, dan method utama dari perspektif domain model aplikasi.

**Method penting yang digambarkan**:
- `Report.reconcileBalance()` — rekonsiliasi saldo sistem vs saldo fisik buku kas
- `Attachment.triggerAiExtraction()` — memicu pipeline Gemini + fallback
- `Attachment.parseExcelDirect()` — parser deterministik spreadsheet kas
- `Transaction.unverify()` — pembatalan verifikasi (V5)
- `Donor.checkAnonymous()` — deteksi pola nama anonim ("hamba allah", "kas masjid")

---

### 3. Use Case Diagram
**File**: [`use-case-diagram.puml`](./use-case-diagram.puml)

Menggambarkan interaksi antara aktor dan use case sistem dari perspektif pengguna.

**Aktor**:
- **Publik / Jamaah** — akses tanpa login: dashboard tren, arsip, donatur & infaq anonim
- **Pengurus / Bendahara** — mewarisi hak Jamaah + unggah, ekstraksi, verifikasi, cetak/ekspor, manajemen pengguna
- **Gemini AI** — aktor eksternal untuk use case ekstraksi transaksi otomatis

---

### 4. Object Diagram
**File**: [`object-diagram.puml`](./object-diagram.puml)

Snapshot runtime yang menggambarkan contoh konkret objek pada skenario nyata: bendahara mengunggah laporan Jumat 25 September 2026 dengan 2 lampiran (foto buku kas + spreadsheet Excel), beserta 3 transaksi terverifikasi.

---

### 5. Activity Diagrams
**Direktori**: [`activity/`](./activity/)

Diagram alur kerja per fitur utama dari perspektif pengguna dan sistem:

| File | Fitur |
|---|---|
| `AD-01-Login.puml` | Alur login Google SSO via NextAuth |
| `AD-02-Upload.puml` | Alur unggah dokumen kas multi-format |
| `AD-03-Ekstraksi-AI.puml` | Pipeline ekstraksi AI: Excel parser / Gemini multimodal + fallback |
| `AD-04-Verifikasi-Rekonsiliasi.puml` | Verifikasi transaksi manual + rekonsiliasi saldo |
| `AD-05-Eksplorasi-Arsip.puml` | Pencarian dan penelusuran arsip laporan |
| `AD-06-Donatur-Anonim.puml` | Alur transparansi infaq anonim (V6 — Issue #054) |
| `AD-07-Cetak-Ekspor.puml` | Ekspor rekap kas (PDF mading A4 + spreadsheet Excel) |
| `AD-08-Manajemen-User.puml` | Manajemen pengguna dan role (Admin/Guest) |

---

### 6. Sequence Diagrams
**Direktori**: [`sequence/`](./sequence/)

Diagram interaksi terperinci antar komponen sistem (actor → frontend → API route → database) untuk setiap alur utama:

| File | Fitur |
|---|---|
| `SD-01-Login.puml` | Sequence login Google OAuth |
| `SD-02-Upload.puml` | Sequence unggah multi-file ke Supabase Storage |
| `SD-03-Ekstraksi-AI.puml` | Sequence lengkap pipeline ekstraksi: Excel parser + Gemini multimodal + auto-fallback (gemini-3.6-flash → gemini-3.5-flash, timeout 25s) |
| `SD-04-Verifikasi-Rekonsiliasi.puml` | Sequence konfirmasi transaksi + fuzzy matching donatur + rekonsiliasi saldo |
| `SD-05-Eksplorasi-Arsip.puml` | Sequence pencarian arsip dengan filter tahun/bulan |
| `SD-06-Donatur-Anonim.puml` | Sequence modal ledger infaq anonim di `/donatur` (V6 — Issue #054) |
| `SD-07-Cetak-Ekspor.puml` | Sequence ekspor rekap kas (window.print() PDF + library xlsx Excel) |
| `SD-08-Manajemen-User.puml` | Sequence update role dan hapus akun pengguna |
| `SD-09-Dashboard-Tren.puml` | Sequence dashboard tren kas publik (agregasi raw SQL + Recharts) |

---

## Cara Membuka Diagram

Gunakan salah satu dari:
1. **VS Code Extension**: [PlantUML](https://marketplace.visualstudio.com/items?itemName=jebbs.plantuml) — preview langsung di editor
2. **Online Renderer**: [plantuml.com/plantuml](https://www.plantuml.com/plantuml/uml/) — paste isi file `.puml`
3. **PlantUML CLI**: `java -jar plantuml.jar docs/diagrams/erd.puml`

---

## Catatan Sinkronisasi

Diagram ini disinkronkan secara manual setiap ada perubahan signifikan pada skema database atau alur fitur. Terakhir diverifikasi terhadap:
- `prisma/schema.prisma` (versi final — Prisma 5.22.0)
- Seluruh migration di `prisma/migrations/`
- Implementasi API routes di `app/api/`
- Dokumentasi produk di `docs/09-Feature-Specification.md` s/d `docs/15-Release-Plan.md`
