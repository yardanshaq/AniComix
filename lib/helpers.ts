import type { AnimeItem, ComicItem, Episode, NormalizedAnime, NormalizedComic } from './types';

export const POSTER_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#6c63ff"/>
          <stop offset="100%" stop-color="#ff6b9d"/>
        </linearGradient>
      </defs>
      <rect width="200" height="300" fill="url(#g)" opacity="0.3"/>
      <rect width="200" height="300" fill="#1a1a26"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
            fill="#6c63ff" font-family="sans-serif" font-size="14" font-weight="600">
        No Image
      </text>
    </svg>
  `);

export function truncate(str: string | undefined, max = 140): string {
  if (!str) return '';
  const s = String(str).trim();
  return s.length > max ? s.slice(0, max).trim() + '...' : s;
}

export function normalizeAnimeCard(item: AnimeItem = {}): NormalizedAnime {
  const ep =
    item.episodes != null
      ? `${item.episodes} Eps`
      : (item.episode || item.current_episode || item.eps || '');
  return {
    title: (item.title || item.judul || (item as Record<string, unknown>).name as string || 'Untitled') as string,
    slug: (item.animeId || item.slug || item.endpoint || '') as string,
    poster: (item.poster || item.thumbnail || item.image || item.thumb || POSTER_PLACEHOLDER) as string,
    episode: ep as string,
    score: (item.score || item.rating || '') as string,
    status: (item.status || '') as string,
    releaseDay: (item.releaseDay || item.day || '') as string,
    releaseDate: (item.latestReleaseDate || item.lastReleaseDate || item.releaseDate || '') as string,
    genre: Array.isArray(item.genre) ? item.genre : ((item.genres || item.genreList || []) as unknown[]),
    synopsis: (item.synopsis || item.description || '') as string,
    type: (item.type || '') as string
  };
}

function extractComicSlug(link: string): string {
  if (!link) return '';
  const m = String(link).match(/\/(?:manga|detail-komik|komik)\/([^\/?#]+)/i);
  return m ? m[1] : '';
}

export function normalizeComicCard(item: ComicItem = {}): NormalizedComic {
  let slug = (item.slug || item.endpoint || '') as string;
  if (!slug && item.link) slug = extractComicSlug(item.link);
  if (!slug && item.href) slug = extractComicSlug(item.href);
  return {
    title: (item.title || item.judul || 'Untitled') as string,
    slug,
    poster: (item.thumbnail || item.image || item.poster || item.cover || POSTER_PLACEHOLDER) as string,
    chapter: (item.chapter || item.latestChapter || item.chapter_count || '') as string,
    type: (item.type || item.tipe || '') as string,
    score: (item.score || item.rating || '') as string,
    status: (item.status || '') as string,
    synopsis: (item.synopsis || item.description || '') as string,
    timeAgo: (item.time_ago || item.timeAgo || '') as string,
    genre: Array.isArray(item.genre) ? item.genre : ((item.genres || []) as unknown[])
  };
}

export function getEpisodeId(ep: Episode | string | null | undefined): string {
  if (!ep) return '';
  if (typeof ep === 'string') return ep;
  return ep.episodeId || ep.slug || ep.endpoint || '';
}

export function pickList<T = unknown>(obj: Record<string, unknown> | null | undefined, keys: string[]): T[] {
  if (!obj) return [];
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v) && v.length) return v as T[];
  }
  return [];
}

export function deepFindArrays(obj: unknown, depth = 4): unknown[][] {
  const out: unknown[][] = [];
  function walk(node: unknown, d: number) {
    if (d < 0 || !node) return;
    if (Array.isArray(node)) {
      if (node.length && typeof node[0] === 'object' && node[0] && ((node[0] as Record<string, unknown>).title || (node[0] as Record<string, unknown>).judul)) {
        out.push(node);
      }
      return;
    }
    if (typeof node === 'object') {
      for (const k in node as Record<string, unknown>) walk((node as Record<string, unknown>)[k], d - 1);
    }
  }
  walk(obj, depth);
  return out;
}

export function isToday(dayLabel: string | undefined | null): boolean {
  if (!dayLabel) return false;
  const today = new Date().getDay();
  const map: Record<string, number> = {
    minggu: 0, sunday: 0,
    senin: 1, monday: 1,
    selasa: 2, tuesday: 2,
    rabu: 3, wednesday: 3,
    kamis: 4, thursday: 4,
    jumat: 5, friday: 5, "jum'at": 5,
    sabtu: 6, saturday: 6
  };
  const key = String(dayLabel).trim().toLowerCase();
  return map[key] === today;
}

export function debounce<T extends (...args: never[]) => void>(fn: T, delay = 300): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return function (...args: Parameters<T>) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: never[]) => void>(fn: T, limit = 100): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return function (...args: Parameters<T>) {
    if (inThrottle) return;
    inThrottle = true;
    fn(...args);
    setTimeout(() => (inThrottle = false), limit);
  };
}
