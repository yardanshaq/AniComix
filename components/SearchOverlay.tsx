'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAnimeSearch, getComicSearch } from '@/lib/api';
import { debounce, normalizeAnimeCard, normalizeComicCard, pickList, deepFindArrays } from '@/lib/helpers';
import { AnimeCard, ComicCard } from './Card';
import type { NormalizedAnime, NormalizedComic } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

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

export default function SearchOverlay({ open, onClose }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [q, setQ] = useState('');
  const [animeResults, setAnimeResults] = useState<NormalizedAnime[] | null>(null);
  const [comicResults, setComicResults] = useState<NormalizedComic[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else {
      setQ('');
      setAnimeResults(null);
      setComicResults(null);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const runSearch = useRef(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setAnimeResults(null);
        setComicResults(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const [a, c] = await Promise.all([
        getAnimeSearch(query.trim()).catch(() => null),
        getComicSearch(query.trim()).catch(() => null)
      ]);
      const animeItems = a ? extractAnimeItems(a) : [];
      const comicItems = c ? extractComicItems(c) : [];
      setAnimeResults(animeItems.slice(0, 6).map(it => normalizeAnimeCard(it as never)).filter(i => i.slug));
      setComicResults(comicItems.slice(0, 6).map(it => normalizeComicCard(it as never)).filter(i => i.slug));
      setLoading(false);
    }, 300)
  ).current;

  const onChange = (v: string) => {
    setQ(v);
    runSearch(v);
  };

  const submit = () => {
    if (q.trim()) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="search-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-overlay-inner">
        <div className="search-overlay-header">
          <i className="fas fa-magnifying-glass search-icon" />
          <input
            id="search-input"
            ref={inputRef}
            type="text"
            placeholder="Cari anime atau komik..."
            value={q}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            autoComplete="off"
          />
          <button className="icon-btn" aria-label="Tutup" onClick={onClose}>
            <i className="fas fa-xmark" />
          </button>
        </div>

        <div className="search-results">
          {q.trim() && (
            <>
              <div className="search-section">
                <h3>Anime</h3>
                <div className="search-section-grid">
                  {loading && animeResults === null
                    ? <p style={{ color: 'var(--text-secondary)' }}>Mencari...</p>
                    : animeResults && animeResults.length
                      ? animeResults.map(i => <AnimeCard key={i.slug} item={i} />)
                      : <p style={{ color: 'var(--text-secondary)' }}>Tidak ada hasil.</p>}
                </div>
              </div>

              <div className="search-section">
                <h3>Comic</h3>
                <div className="search-section-grid">
                  {loading && comicResults === null
                    ? <p style={{ color: 'var(--text-secondary)' }}>Mencari...</p>
                    : comicResults && comicResults.length
                      ? comicResults.map(i => <ComicCard key={i.slug} item={i} />)
                      : <p style={{ color: 'var(--text-secondary)' }}>Tidak ada hasil.</p>}
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Link
                  className="btn-primary"
                  href={`/search?q=${encodeURIComponent(q.trim())}`}
                  onClick={onClose}
                >
                  <i className="fas fa-magnifying-glass" /> Lihat semua hasil
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
