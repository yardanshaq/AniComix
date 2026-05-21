'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getComicUnlimited, getComicPopular, getComicLatest, getComicTrending,
  getComicSearch, getComicByGenre, getComicByType, getManhwaList
} from '@/lib/api';
import { normalizeComicCard, debounce, pickList, deepFindArrays } from '@/lib/helpers';
import { ComicCard, EmptyState, ErrorState } from './Card';
import { SkeletonGrid } from './Skeleton';
import type { NormalizedComic } from '@/lib/types';

interface Tab { id: string; label: string }

export interface ComicListProps {
  /** Title shown above the grid */
  title: string;
  subtitle: string;
  /** Tabs to render. Use empty array to hide. */
  tabs: Tab[];
  /** Default tab when no tab param present */
  defaultTab: string;
  /** Page slug used in URL building (`/comic` or `/manhwa`) */
  pageSlug: string;
  /** When set, force this comic type (overrides tab selection) */
  forceType?: 'manga' | 'manhwa' | 'manhua';
}

export default function ComicListView({
  title, subtitle, tabs, defaultTab, pageSlug, forceType
}: ComicListProps) {
  const router = useRouter();
  const search = useSearchParams();
  const tab = search.get('tab') || defaultTab;
  const q = search.get('q') || '';
  const genre = search.get('genre') || '';

  const [items, setItems] = useState<NormalizedComic[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState(q);

  const load = useCallback(() => {
    setItems(null);
    setError(null);
    (async () => {
      try {
        let res: unknown;
        if (forceType === 'manhwa') res = await getManhwaList();
        else if (forceType) res = await getComicByType(forceType);
        else if (q) res = await getComicSearch(q);
        else if (genre) res = await getComicByGenre(genre);
        else if (tab === 'popular') res = await getComicPopular();
        else if (tab === 'latest') res = await getComicLatest();
        else if (tab === 'trending') res = await getComicTrending();
        else if (tab === 'manhwa') res = await getManhwaList();
        else if (['manga', 'manhua'].includes(tab)) res = await getComicByType(tab);
        else res = await getComicUnlimited();

        const r = res as Record<string, unknown> | null;
        let list: unknown[] =
          (r?.komikList as unknown[]) ||
          (r?.results as unknown[]) ||
          (r?.comics as unknown[]) ||
          (r?.data as unknown[]) ||
          (r?.trending as unknown[]) ||
          (r?.popular as unknown[]) ||
          (r?.latest as unknown[]) ||
          [];
        if (!Array.isArray(list)) list = [];
        if (!list.length) list = pickList(r || {}, ['komikList', 'comics', 'data', 'list', 'results']);
        if (!list.length) list = (deepFindArrays(r)[0] as unknown[]) || [];

        const normalized = list.map(x => normalizeComicCard(x as never)).filter(i => i.slug);
        setItems(normalized);
      } catch (e) {
        setError((e as Error).message || 'Gagal memuat komik');
        setItems([]);
      }
    })();
  }, [tab, q, genre, forceType]);

  useEffect(() => { load(); }, [load]);

  const doSearch = useMemo(
    () => debounce((v: string) => {
      const sp = new URLSearchParams();
      if (v.trim()) sp.set('q', v.trim());
      else sp.set('tab', tab);
      router.push(`${pageSlug}?${sp.toString()}`);
    }, 300),
    [router, tab, pageSlug]
  );

  return (
    <div className="page-wrap">
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">{subtitle}</p>

      {tabs.length > 0 && (
        <div className="tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`tab ${t.id === tab && !q && !genre ? 'active' : ''}`}
              onClick={() => router.push(`${pageSlug}?tab=${t.id}`)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="filter-bar">
        <div className="filter-search">
          <i className="fas fa-magnifying-glass" />
          <input
            type="text"
            placeholder="Cari judul komik..."
            value={searchValue}
            onChange={e => { setSearchValue(e.target.value); doSearch(e.target.value); }}
          />
        </div>
      </div>

      {items === null ? <SkeletonGrid count={12} /> :
        error ? <ErrorState message={error} onRetry={load} /> :
        !items.length ? <EmptyState message={q ? `Tidak ada hasil untuk "${q}"` : 'Tidak ada data'} /> :
        <div className="card-grid">{items.map(i => <ComicCard key={i.slug} item={i} />)}</div>}
    </div>
  );
}
