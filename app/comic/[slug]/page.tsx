'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getComicDetail } from '@/lib/api';
import { debounce, normalizeComicCard, POSTER_PLACEHOLDER } from '@/lib/helpers';
import { ComicCard, EmptyState, ErrorState } from '@/components/Card';
import { Spinner } from '@/components/Skeleton';

interface Params { slug: string }

interface Chapter {
  slug: string;
  endpoint?: string;
  chapter?: string;
  title?: string;
  number?: string;
  date?: string;
  uploaded?: string;
  updated?: string;
}

export default function ComicDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = use(params);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [asc, setAsc] = useState(false);
  const [filter, setFilter] = useState('');

  const load = useCallback(() => {
    setData(null); setError(null);
    getComicDetail(slug)
      .then(res => {
        const d = (res as { data?: Record<string, unknown> })?.data || (res as Record<string, unknown>) || {};
        setData(d);
      })
      .catch(e => setError((e as Error).message || 'Gagal memuat detail komik'));
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const doFilter = useMemo(() => debounce((v: string) => setFilter(v), 200), []);

  if (error) return <div className="page-wrap"><ErrorState message={error} onRetry={load} /></div>;
  if (!data) return <Spinner />;

  const d = data;
  const title = (d.title || d.title_indonesian || slug) as string;
  const poster = (d.image || d.thumbnail || d.poster || POSTER_PLACEHOLDER) as string;
  const synopsis = (d.synopsis || d.synopsis_full || d.summary || d.description || 'Sinopsis belum tersedia.') as string;
  const meta = (d.metadata as Record<string, unknown>) || {};
  const author = (meta.author || d.author || '') as string;
  const artist = (meta.artist || d.artist || '') as string;
  const status = (meta.status || d.status || '') as string;
  const type = (meta.type || d.type || meta.tipe || '') as string;
  const score = (meta.score || meta.rating || d.score || '') as string;
  const released = (meta.released || meta.year || '') as string;
  const titleIndonesian = (d.title_indonesian as string) || '';

  const genres = ((d.genres as unknown[]) || []).map(g =>
    typeof g === 'string' ? g : ((g as { name?: string; title?: string })?.name || (g as { name?: string; title?: string })?.title || '')
  );

  const chapters = ((d.chapters || d.chapter_list || []) as Chapter[]).map((c, idx) => ({
    c, idx,
    slug: c.slug || c.endpoint || '',
    title: c.chapter || c.title || `Chapter ${c.number || (idx + 1)}`,
    date: c.date || c.uploaded || c.updated || ''
  })).filter(x => x.slug);

  const filtered = filter
    ? chapters.filter(x => x.title.toLowerCase().includes(filter.toLowerCase()))
    : chapters;
  const sortedChapters = [...filtered].sort((a, b) => asc ? a.idx - b.idx : b.idx - a.idx);

  const firstChapter = chapters.length
    ? [...chapters].sort((a, b) => b.idx - a.idx)[0]
    : null;

  const similar = ((d.similar_manga || d.recommendations || []) as unknown[]);

  return (
    <>
      <section className="detail-hero">
        <div className="detail-banner" style={{ backgroundImage: `url('${poster}')` }} />
        <div className="detail-content">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="detail-poster"
            src={poster}
            alt={title}
            onError={e => { (e.target as HTMLImageElement).src = POSTER_PLACEHOLDER; }}
          />
          <div className="detail-info">
            <h1>{title}</h1>
            {titleIndonesian && titleIndonesian !== title && (
              <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: 14 }}>{titleIndonesian}</p>
            )}
            <div className="detail-meta">
              {type && <span className="detail-meta-item"><i className="fas fa-book" /> {type}</span>}
              {status && <span className="detail-meta-item"><i className="fas fa-circle-check" /> {status}</span>}
              {score && <span className="detail-meta-item"><i className="fas fa-star" style={{ color: '#fbbf24' }} /> {score}</span>}
              {author && <span className="detail-meta-item"><i className="fas fa-feather" /> {author}</span>}
              {artist && <span className="detail-meta-item"><i className="fas fa-paintbrush" /> {artist}</span>}
              {released && <span className="detail-meta-item"><i className="fas fa-calendar" /> {released}</span>}
            </div>
            {genres.length > 0 && (
              <div className="detail-genres">
                {genres.map((g, i) => <span key={i} className="detail-genre">{g}</span>)}
              </div>
            )}
            <p className="detail-synopsis">{synopsis}</p>
            {firstChapter && (
              <div className="detail-actions">
                <Link className="btn-primary" href={`/read/${encodeURIComponent(firstChapter.slug)}?comic=${encodeURIComponent(slug)}`}>
                  <i className="fas fa-book-open" /> Baca Chapter 1
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="episodes-section">
        <div className="episodes-header">
          <h2 className="section-title"><span className="accent-bar" /> Daftar Chapter</h2>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="filter-search" style={{ minWidth: 200 }}>
              <i className="fas fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Cari chapter..."
                onChange={e => doFilter(e.target.value)}
              />
            </div>
            <button className="btn-secondary" onClick={() => setAsc(v => !v)}>
              <i className="fas fa-sort" /> {asc ? 'Oldest first' : 'Newest first'}
            </button>
          </div>
        </div>

        {!sortedChapters.length ? <EmptyState message="Tidak ada chapter" /> : (
          <div className="episodes-list">
            {sortedChapters.map(x => (
              <Link
                key={x.slug}
                className="episode-card"
                href={`/read/${encodeURIComponent(x.slug)}?comic=${encodeURIComponent(slug)}`}
              >
                <div className="episode-num">{String(x.idx + 1)}</div>
                <div className="episode-info">
                  <div className="episode-title">{x.title}</div>
                  {x.date && <div className="episode-date">{x.date}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}

        {similar.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 className="section-title"><span className="accent-bar" /> Mungkin Kamu Suka</h2>
            <div style={{ marginTop: 16 }}>
              <div className="card-grid">
                {similar
                  .map(s => normalizeComicCard(s as never))
                  .filter(s => s.slug)
                  .slice(0, 8)
                  .map(s => <ComicCard key={s.slug} item={s} />)}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
