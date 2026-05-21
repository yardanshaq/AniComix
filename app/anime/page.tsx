'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getAnimeOngoing, getAnimeComplete, getAnimeUnlimited, getAnimeSearch, getAnimeByGenre
} from '@/lib/api';
import { normalizeAnimeCard, debounce, pickList, deepFindArrays } from '@/lib/helpers';
import { AnimeCard, EmptyState, ErrorState } from '@/components/Card';
import { SkeletonGrid } from '@/components/Skeleton';
import type { NormalizedAnime } from '@/lib/types';

const TABS = [
  { id: 'ongoing',   label: 'Ongoing' },
  { id: 'completed', label: 'Completed' },
  { id: 'all',       label: 'All (A-Z)' }
];

function AnimeListInner() {
  const router = useRouter();
  const search = useSearchParams();
  const tab = search.get('tab') || 'ongoing';
  const q = search.get('q') || '';
  const genre = search.get('genre') || '';
  const page = parseInt(search.get('page') || '1', 10);

  const [items, setItems] = useState<NormalizedAnime[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState(q);

  const buildHref = useCallback((patch: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    const merged: Record<string, string | number | undefined> = { tab, q, genre, page, ...patch };
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '' && v !== 1) sp.set(k, String(v));
    });
    const qs = sp.toString();
    return `/anime${qs ? `?${qs}` : ''}`;
  }, [tab, q, genre, page]);

  const load = useCallback(() => {
    setItems(null);
    setError(null);
    (async () => {
      try {
        let res: unknown;
        if (q) res = await getAnimeSearch(q);
        else if (genre) res = await getAnimeByGenre(genre);
        else if (tab === 'completed') res = await getAnimeComplete(page);
        else if (tab === 'all') res = await getAnimeUnlimited();
        else res = await getAnimeOngoing(page);

        const d = (res as { data?: Record<string, unknown> })?.data || (res as Record<string, unknown>) || {};
        let list: unknown[] = (d.animeList as unknown[]) || [];

        if (!list.length && Array.isArray(d.list)) {
          // unlimited may return groups
          list = (d.list as Array<{ animeList?: unknown[] }>).flatMap(g => g.animeList || []);
        }
        if (!list.length) list = pickList(d, ['animeList', 'anime', 'list', 'results']);
        if (!list.length) list = (deepFindArrays(d)[0] as unknown[]) || [];

        const normalized = list.map(x => normalizeAnimeCard(x as never)).filter(i => i.slug);
        setItems(normalized);
      } catch (e) {
        setError((e as Error).message || 'Gagal memuat anime');
        setItems([]);
      }
    })();
  }, [tab, q, genre, page]);

  useEffect(() => { load(); }, [load]);

  const doSearch = useMemo(
    () => debounce((v: string) => {
      const sp = new URLSearchParams();
      if (v.trim()) sp.set('q', v.trim());
      else sp.set('tab', tab);
      router.push(`/anime?${sp.toString()}`);
    }, 300),
    [router, tab]
  );

  return (
    <div className="page-wrap">
      <h1 className="page-title">Anime</h1>
      <p className="page-subtitle">Tonton anime favoritmu dengan kualitas terbaik dan tanpa iklan mengganggu.</p>

      <div className="tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab ${t.id === tab && !q && !genre ? 'active' : ''}`}
            onClick={() => router.push(`/anime?tab=${t.id}`)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <div className="filter-search">
          <i className="fas fa-magnifying-glass" />
          <input
            type="text"
            placeholder="Cari judul anime..."
            value={searchValue}
            onChange={e => { setSearchValue(e.target.value); doSearch(e.target.value); }}
          />
        </div>
      </div>

      {items === null ? <SkeletonGrid count={12} /> :
        error ? <ErrorState message={error} onRetry={load} /> :
        !items.length ? <EmptyState message={q ? `Tidak ada hasil untuk "${q}"` : 'Tidak ada data'} /> :
        <div className="card-grid">{items.map(i => <AnimeCard key={i.slug} item={i} />)}</div>}
    </div>
  );
}

export default function AnimeListPage() {
  return (
    <Suspense fallback={<div className="page-wrap"><SkeletonGrid count={12} /></div>}>
      <AnimeListInner />
    </Suspense>
  );
}
