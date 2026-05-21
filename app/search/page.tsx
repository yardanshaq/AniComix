'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAnimeSearch, getComicSearch } from '@/lib/api';
import { normalizeAnimeCard, normalizeComicCard, pickList, deepFindArrays } from '@/lib/helpers';
import { AnimeCard, ComicCard, EmptyState, ErrorState } from '@/components/Card';
import { SkeletonGrid } from '@/components/Skeleton';
import type { NormalizedAnime, NormalizedComic } from '@/lib/types';

function extractAnimeItems(res: unknown): unknown[] {
  const r = res as Record<string, unknown>;
  const d = (r?.data as Record<string, unknown>) || r || {};
  let items = (d.animeList || d.anime || d.list || d.results || []) as unknown[];
  if (!Array.isArray(items) || !items.length) items = pickList(d, ['animeList', 'anime', 'list', 'results', 'data']);
  if (!items.length) items = (deepFindArrays(d)[0] as unknown[]) || [];
  return Array.isArray(items) ? items : [];
}

function extractComicItems(res: unknown): unknown[] {
  const r = res as Record<string, unknown>;
  if (Array.isArray(r?.data)) return r.data as unknown[];
  const d = (r?.data as Record<string, unknown>) || r || {};
  let items = (d.comics || d.comicList || d.list || d.results || []) as unknown[];
  if (!Array.isArray(items) || !items.length) items = pickList(d, ['comics', 'comicList', 'list', 'results', 'data']);
  if (!items.length) items = (deepFindArrays(d)[0] as unknown[]) || [];
  return Array.isArray(items) ? items : [];
}

function SearchInner() {
  const search = useSearchParams();
  const q = search.get('q') || '';

  const [anime, setAnime] = useState<NormalizedAnime[] | null>(null);
  const [comic, setComic] = useState<NormalizedComic[] | null>(null);
  const [animeError, setAnimeError] = useState(false);
  const [comicError, setComicError] = useState(false);

  useEffect(() => {
    if (!q) return;
    setAnime(null); setComic(null);
    setAnimeError(false); setComicError(false);

    Promise.all([
      getAnimeSearch(q).catch(() => null),
      getComicSearch(q).catch(() => null)
    ]).then(([a, c]) => {
      if (!a) setAnimeError(true);
      else {
        const items = extractAnimeItems(a).map(i => normalizeAnimeCard(i as never)).filter(i => i.slug);
        setAnime(items);
      }
      if (!c) setComicError(true);
      else {
        const items = extractComicItems(c).map(i => normalizeComicCard(i as never)).filter(i => i.slug);
        setComic(items);
      }
    });
  }, [q]);

  if (!q) {
    return <div className="page-wrap"><EmptyState message="Masukkan kata kunci pencarian" icon="fa-magnifying-glass" /></div>;
  }

  return (
    <div className="page-wrap">
      <h1 className="page-title">Hasil untuk &quot;{q}&quot;</h1>
      <p className="page-subtitle">Menampilkan hasil dari katalog anime dan komik.</p>

      <section className="section">
        <h2 className="section-title"><span className="accent-bar" /> Anime</h2>
        <div style={{ marginTop: 16 }}>
          {anime === null && !animeError ? <SkeletonGrid count={8} /> :
            animeError ? <ErrorState message="Gagal memuat anime" /> :
            !anime || !anime.length ? <EmptyState message={`Tidak ada anime untuk "${q}"`} /> :
            <div className="card-grid">{anime.map(i => <AnimeCard key={i.slug} item={i} />)}</div>}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title"><span className="accent-bar" /> Comic</h2>
        <div style={{ marginTop: 16 }}>
          {comic === null && !comicError ? <SkeletonGrid count={8} /> :
            comicError ? <ErrorState message="Gagal memuat comic" /> :
            !comic || !comic.length ? <EmptyState message={`Tidak ada comic untuk "${q}"`} /> :
            <div className="card-grid">{comic.map(i => <ComicCard key={i.slug} item={i} />)}</div>}
        </div>
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="page-wrap"><SkeletonGrid count={12} /></div>}>
      <SearchInner />
    </Suspense>
  );
}
