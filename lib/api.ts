// All API calls go through /api/proxy/* (Next.js edge route) to avoid CORS.

const BASE = '/api/proxy';

async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { ...init });
  if (res.status === 429) {
    const e = new Error('Terlalu banyak request. Tunggu sebentar...');
    (e as Error & { code?: string }).code = 'RATE_LIMIT';
    throw e;
  }
  if (!res.ok) {
    const e = new Error(`Gagal memuat data (${res.status}).`);
    (e as Error & { code?: string; status?: number }).code = 'API_ERROR';
    (e as Error & { code?: string; status?: number }).status = res.status;
    throw e;
  }
  return res.json() as Promise<T>;
}

// ============================
//  ANIME
// ============================
export const getAnimeHome      = () => apiFetch('/anime/home');
export const getAnimeSchedule  = () => apiFetch('/anime/schedule');
export const getAnimeOngoing   = (page = 1) => apiFetch(`/anime/ongoing-anime?page=${page}`);
export const getAnimeComplete  = (page = 1) => apiFetch(`/anime/complete-anime?page=${page}`);
export const getAnimeSearch    = (q: string) => apiFetch(`/anime/search/${encodeURIComponent(q)}`);
export const getAnimeDetail    = (id: string) => apiFetch(`/anime/anime/${id}`);
export const getAnimeEpisode   = (id: string) => apiFetch(`/anime/episode/${id}`);
export const getAnimeGenres    = () => apiFetch('/anime/genre');
export const getAnimeByGenre   = (genre: string) => apiFetch(`/anime/genre/${genre}`);
export const getAnimeUnlimited = () => apiFetch('/anime/unlimited');
export const getAnimeServer    = (serverId: string) => apiFetch(`/anime/server/${serverId}`);

// ============================
//  COMIC
// ============================
export const getComicHome     = () => apiFetch('/comic/homepage');
export const getComicUnlimited = () => apiFetch('/comic/unlimited');
export const getComicPopular  = () => apiFetch('/comic/populer');
export const getComicLatest   = () => apiFetch('/comic/terbaru');
export const getComicTrending = () => apiFetch('/comic/trending');
export const getComicSearch   = (q: string) => apiFetch(`/comic/search?q=${encodeURIComponent(q)}`);
export const getComicDetail   = (slug: string) => apiFetch(`/comic/comic/${slug}`);
export const getComicChapter  = (slug: string) => apiFetch(`/comic/chapter/${slug}`);
export const getComicByGenre  = (genre: string) => apiFetch(`/comic/genre/${genre}`);
export const getComicByType   = (type: string) => apiFetch(`/comic/type/${type}`);

// Manhwa: data terbaik dari provider BacaKomik (banyak items, cover image, type label).
export const getManhwaList    = () => apiFetch('/comic/bacakomik/only/manhwa');
