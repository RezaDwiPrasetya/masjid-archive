# Masjid Archive

**Web-Based Digital Archive System** — sistem arsip dokumen digital untuk menyimpan salinan laporan keuangan mingguan DKM Masjid Al-Luqman, dikelompokkan otomatis berdasarkan periode (Tahun → Bulan → Minggu).

> Menggantikan ketergantungan pada buku kas fisik yang rentan hilang/rusak dan sulit dicari — tanpa mengubah cara bendahara bekerja sehari-hari (tetap merekap manual di buku, lalu memfoto & mengunggah salinannya).

📖 Dokumentasi produk lengkap ada di [Wiki](https://github.com/RezaDwiPrasetya/masjid-archive/wiki) — mulai dari Problem Statement sampai Release Plan.

---

## Status

- Phase: Prototyping (Task 05 — Prototype Development)
- Product Owner / UX / Engineer: Reza
- Mentor PKL: PT Gothru Media Indonesia

## Tech Stack

| Layer | Tools |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| UI Components | shadcn/ui |
| Styling | Tailwind CSS |
| Icons | Lucide Icons |
| Database | SQLite |
| ORM | Prisma |

## Fitur Utama (MVP)

- **Login** — akses bersama pengurus DKM
- **Unggah Laporan** — foto + tanggal laporan mingguan
- **Arsip Laporan** — telusuri laporan terkelompok Tahun → Bulan → Minggu
- **Cari Arsip** — filter berdasarkan kata kunci, tahun, dan bulan
- **Detail Laporan** — lihat, unduh, dan bagikan foto laporan

## Getting Started

```bash
# clone repo
git clone https://github.com/RezaDwiPrasetya/masjid-archive.git
cd masjid-archive

# install dependencies
npm install

# setup environment variables
cp .env.example .env
# isi DATABASE_URL, AUTH_USERNAME, AUTH_PASSWORD, SESSION_SECRET

# setup database
npx prisma migrate dev
npx prisma db seed

# run development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Struktur Project

```
app/            # halaman & route (App Router)
components/     # shadcn/ui components + komponen shared
lib/            # prisma client, helper, validasi
prisma/         # schema.prisma & seed script
public/uploads/ # foto laporan (prototype, local storage)
docs/           # salinan dokumentasi produk dari Wiki
```

## Dokumentasi

Semua dokumen produk (Product Plan s.d. Release Plan) tersedia di dua tempat yang sinkron:
- [GitHub Wiki](https://github.com/RezaDwiPrasetya/masjid-archive/wiki) — versi utama, mudah dibaca
- `/docs` di repo ini — salinan untuk referensi AI coding agent (Copilot) saat development

## Branching Strategy

Repo ini pakai strategi **simplified Git Flow** — dua branch utama:

| Branch | Fungsi | Aturan |
|---|---|---|
| `main` | Kode yang stabil & siap didemokan/di-review mentor | Tidak boleh commit langsung; hanya menerima merge dari `develop` via Pull Request |
| `develop` | Branch kerja harian, tempat semua fitur digabung | Semua branch fitur bercabang dari sini, dan merge kembali ke sini |

**Alur kerja per fitur/task:**

1. Buat branch baru dari `develop`, dengan format:
   ```
   feature/<nama-fitur>       → misal: feature/unggah-laporan
   fix/<nama-bug>             → misal: fix/upload-error-handling
   chore/<tugas-non-fitur>    → misal: chore/setup-prisma
   ```
2. Kerjakan task (idealnya 1 branch ≈ 1 Issue di GitHub Projects, mis. `feature/issue-006-logika-backend-unggah`).
3. Commit dengan pesan yang jelas (disarankan format `<tipe>: <deskripsi singkat>`, mis. `feat: tambah validasi form unggah laporan`).
4. Push branch, buka Pull Request ke `develop`.
5. Review sendiri / oleh mentor sebelum merge.
6. Setelah beberapa fitur MVP selesai & stabil di `develop`, buka PR `develop → main` untuk rilis prototype ke tahap demo/user testing.

**Commit message convention (disarankan):**
```
feat: fitur baru
fix: perbaikan bug
chore: setup/konfigurasi non-fitur
docs: perubahan dokumentasi
refactor: perubahan kode tanpa ubah perilaku
```

## Referensi Task Board

Progress development dilacak lewat [GitHub Issues](https://github.com/RezaDwiPrasetya/masjid-archive/issues) (#001–#024) dan Project Board "Masjid Archive Roadmap" (Backlog → Todo → In Progress → Review → Done).
