# Desain login alternatif (disimpan, tidak dipakai)

Halaman login aktif saat ini adalah `../LoginMinimal.tsx`. Dua desain ini disimpan untuk opsi nanti:

- `LoginHero.tsx` — "Hero overlap": band merah dengan kartu menumpang di atasnya.
- `LoginSplit.tsx` — "Split screen": panel gelap di kiri, form di kanan.

Keduanya memakai props yang sama (`onSuccess`, `notice`) dan style-nya masih ada di `src/styles.css`
(bagian "Design 1" dan "Design 2"). Untuk memakainya, ganti import `LoginMinimal` di `src/App.tsx`.
