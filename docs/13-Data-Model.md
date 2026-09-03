# 13. Data Model

## Entities

### User (Pengurus DKM)

| Field | Type                                        | Required |
| ----- | -------------------------------------------- | -------- |
| id    | identifier                                  | Yes      |
| name  | text                                        | Yes      |
| role  | text (Bendahara 1 / Bendahara 2 / Pengurus) | Yes      |

### Report (Laporan Mingguan)

| Field           | Type                                           | Required |
| --------------- | ----------------------------------------------- | -------- |
| id              | identifier                                     | Yes      |
| report_date    | date (tanggal Jumat laporan)                   | Yes      |
| photo           | file/image                                     | Yes      |
| year            | number (diturunkan otomatis dari report_date) | Yes      |
| month           | number (diturunkan otomatis dari report_date) | Yes      |
| week_of_month | number (diturunkan otomatis dari report_date) | Yes      |
| uploaded_at    | timestamp                                      | Yes      |
| uploaded_by    | reference ke User                              | Yes      |

## Relationships

```
User
 └── Report (satu user bisa mengunggah banyak laporan)
```

## Database Rules

- Satu `Report` wajib punya `photo` dan `report_date` — tidak boleh kosong
- `year`, `month`, `week_of_month` selalu diturunkan dari `report_date`, tidak diinput manual, supaya konsisten dan tidak salah kelompok

## Notes

Model ini sengaja dibuat sangat ringan (bukan pembukuan transaksi) — sesuai keputusan produk untuk hanya mengarsipkan salinan visual laporan, bukan mendigitalkan pencatatan keuangan itu sendiri.
