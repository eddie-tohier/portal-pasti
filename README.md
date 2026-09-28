# Portal PASTI — Login

Halaman login (desain Minimal) dan dashboard yang terhubung ke INT-Hub API.
Dua desain login alternatif (Hero overlap, Split screen) disimpan di `src/pages/alternatives/`.
Detail API: [docs/API.md](docs/API.md).

```bash
npm install
cp .env.example .env   # isi API_PROXY_TARGET dengan alamat backend INT-Hub
npm run dev
```

Buka `http://localhost:5173`.

## Dashboard (setelah login)

| Rute | Isi | Endpoint |
| --- | --- | --- |
| `#/overview` | Total lead, jumlah per status, lead yang perlu tindakan, status koneksi | `revision/show`, `auth/test`, `auth/pasti-test` |
| `#/leads` | Tabel data lead: filter status, cari Source Ref ID, paginasi, detail | `revision/show` |
| `#/batches` | Status batch PENDING / IN PROGRESS / FAILED (dijalankan manual) | `data/status` |
| `#/users` | Tambah pengguna INT-Hub | `user/add` |
