# AniComix (Next.js)

Versi Next.js dari AniComix — siap deploy ke Vercel.

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- API: sankavollerei.com via Next.js edge proxy (`/api/proxy/*`)

## Routing

| URL                       | Halaman              |
|---------------------------|----------------------|
| `/`                       | Home                 |
| `/anime`                  | Daftar anime         |
| `/anime/[slug]`           | Detail anime         |
| `/watch/[slug]?anime=...` | Player episode       |
| `/comic`                  | Daftar comic         |
| `/comic/[slug]`           | Detail comic         |
| `/read/[slug]?comic=...`  | Comic reader         |
| `/schedule`               | Jadwal anime         |
| `/search?q=...`           | Hasil pencarian      |

## Development

```bash
cd anicomix-next
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Deploy ke Vercel

1. Push folder `anicomix-next/` ke GitHub (boleh sebagai repo terpisah atau subdirectory).
2. Di Vercel dashboard: **New Project** → import repo.
3. Kalau project di subdirectory, set **Root Directory** = `anicomix-next`.
4. Framework Preset: **Next.js** (auto-detected).
5. Klik **Deploy**.

Tidak perlu environment variable apapun — semua endpoint API hardcoded di [lib/api.ts](lib/api.ts) dan diproxy server-side via [app/api/proxy/[...path]/route.ts](app/api/proxy/[...path]/route.ts).

## Catatan

- **CORS solved**: semua request ke `sankavollerei.com` lewat edge route di Vercel. Browser cuma melihat request ke domain Vercel sendiri.
- **Caching**: proxy response di-cache 5 menit (`s-maxage=300, stale-while-revalidate=600`) untuk hemat bandwidth.
- **Tema**: dark/light disimpan di `localStorage` (`theme`).
- **Reader settings**: mode, zoom, background tersimpan di `localStorage` (`reader-mode`, `reader-zoom`, `reader-bg`).
