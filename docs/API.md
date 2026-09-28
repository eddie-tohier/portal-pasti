# Portal PASTI — API (INT-Hub)

- **Swagger UI:** http://34.160.82.207/swagger-ui/index.html
- **OpenAPI JSON:** http://34.160.82.207/v3/api-docs
- **Title:** INT-Hub API v1 — "INT-Hub backend for AHM: lead data ingestion towards Portal PASTI."
- **Auth:** `Authorization: Bearer <accessToken>` (JWT). Only the `Auth` endpoints are public.

## Endpoints

| Method | Path | Tag | Keterangan |
| --- | --- | --- | --- |
| POST | `/int/v1/auth/login` | Auth | Login email + password → `JwtResponse`. 401 salah kredensial, 403 user diblokir. Login ulang membatalkan refresh token lama. |
| POST | `/int/v1/auth/refresh` | Auth | Tukar `refreshToken` → token baru (rotasi; token lama mati). 400/401/403. |
| POST | `/int/v1/auth/logout` | Auth | Hapus refresh token. 204; 400 body tidak valid; 404 token tidak ditemukan. Access token tetap valid sampai kedaluwarsa. |
| GET | `/int/v1/auth/test` | Auth | Cek koneksi (text). |
| POST | `/int/v1/auth/pasti-test` | Auth | Tes koneksi ke Portal PASTI. |
| POST | `/int/v1/user/add` | User | Tambah user (`{email, name}`), butuh token. 409 email sudah terdaftar. |
| POST | `/int/v1/data/ingest` | Data | Ingest batch data lead. |
| POST | `/int/v1/data/ingest-test` | Data | Dry-run validasi batch. |
| GET | `/int/v1/data/status` | Data | Trigger cek status batch yang sedang diproses. |
| POST | `/int/v1/revision/show` | Data Revision | Cari data lead (paginated). |
| POST | `/int/v1/revision/upload` | Data Revision | Upload file data revisi. |
| POST | `/int/v1/revision/validate` | Data Revision | Validasi & kirim ulang data revisi. |
| POST | `/int/v1/revision/download` | Data Revision | Download data lead berdasarkan source reference ID. |

## Skema auth

```ts
UserLoginRequest    { email: string; password: string }
JwtResponse         { accessToken: string; refreshToken: string; email: string }
RefreshTokenRequest { refreshToken: string }            // required, minLength 1
ApiErrorResponse    { timestamp; status; error; message; path; fieldErrors?: { field; message }[] }
```

## Catatan integrasi

- Server **tidak mengirim header CORS** (dicek 2026-09-28). Frontend memanggil `/int/*` di origin sendiri dan
  Vite mem-proxy ke backend (`vite.config.ts`, `API_PROXY_TARGET`). Di produksi perlu reverse proxy yang sama
  atau backend mengaktifkan CORS.
- Tidak ada endpoint registrasi publik, lupa kata sandi, atau OAuth. User dibuat oleh admin lewat `/user/add`,
  jadi UI login mengarahkan ke administrator untuk kasus tersebut.
