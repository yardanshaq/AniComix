'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getAnimeDetail } from '@/lib/api';
import { getEpisodeId, normalizeAnimeCard, POSTER_PLACEHOLDER } from '@/lib/helpers';
import { AnimeCard, EmptyState, ErrorState } from '@/components/Card';
import { Spinner } from '@/components/Skeleton';

interface Params { slug: string }

export default function AnimeDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = use(params);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [asc, setAsc] = useState(false);
  const [synopsisOpen, setSynopsisOpen] = useState(false);

  const load = useCallback(() => {
    setData(null); setError(null);
    getAnimeDetail(slug)
      .then(res => {
        const d = (res as { data?: Record<string, unknown> })?.data || (res as Record<string, unknown>) || {};
        setData(d);
      })
      .catch(e => setError((e as Error).message || 'Gagal memuat detail anime'));
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  if (error) return <div className="page-wrap"><ErrorState message={error} onRetry={load} /></div>;
  if (!data) return <Spinner />;

  const d = data;
  const title = (d.title as string) || slug;
  const poster = (d.poster || d.thumbnail || d.image || POSTER_PLACEHOLDER) as string;
  const score = (d.score || '') as string;
  const status = (d.status || '') as string;
  const type = (d.type || '') as string;
  const duration = (d.duration || '') as string;
  const aired = (d.aired || '') as string;
  const producers = (d.producers || '') as string | string[];
  const studios = (d.studios || '') as string | string[];
  const totalEps = (d.episodes || '') as string | number;
  const japanese = (d.japanese || '') as string;

  const genres = ((d.genreList || d.genres || []) as unknown[]).map(g =>
    typeof g === 'string' ? g : ((g as { title?: string; name?: string })?.title || (g as { title?: string; name?: string })?.name || '')
  );

  const episodes = ((d.episodeList || d.episodes || []) as unknown[]) || [];
  const recommendations = ((d.recommendedAnimeList || d.recommendations || d.related || []) as unknown[]) || [];

  let synopsisText = '';
  if (typeof d.synopsis === 'string') synopsisText = d.synopsis;
  else if ((d.synopsis as { paragraphs?: string[] })?.paragraphs) {
    synopsisText = (d.synopsis as { paragraphs: string[] }).paragraphs.join('\n\n');
  } else if (typeof d.description === 'string') synopsisText = d.description;
  synopsisText = synopsisText || 'Sinopsis belum tersedia.';

  const epList = (episodes as Array<Record<string, unknown>>).map((ep, idx) => ({
    ep, idx,
    slug: getEpisodeId(ep as never),
    title: (ep.title as string) || `Episode ${(ep.eps as string | number) || (idx + 1)}`,
    date: (ep.date || ep.uploaded || '') as string
  })).filter(x => x.slug);

  const sorted = [...epList].sort((a, b) => asc ? a.idx - b.idx : b.idx - a.idx);
  const firstEpisode = epList.length ? [...epList].sort((a, b) => a.idx - b.idx)[0] : null;

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
            {japanese && <p style={{ color: 'var(--text-secondary)', marginBottom: 12, fontSize: 14 }}>{japanese}</p>}
            <div className="detail-meta">
              {score && <span className="detail-meta-item"><i className="fas fa-star" style={{ color: '#fbbf24' }} /> {score}</span>}
              {status && <span className="detail-meta-item"><i className="fas fa-circle-check" /> {status}</span>}
              {type && <span className="detail-meta-item"><i className="fas fa-film" /> {type}</span>}
              {totalEps && <span className="detail-meta-item"><i className="fas fa-list" /> {String(totalEps)} eps</span>}
              {duration && <span className="detail-meta-item"><i className="fas fa-clock" /> {duration}</span>}
              {(Array.isArray(studios) ? studios.length > 0 : !!studios) && <span className="detail-meta-item"><i className="fas fa-building" /> {Array.isArray(studios) ? studios.join(', ') : String(studios)}</span>}
              {(Array.isArray(producers) ? producers.length > 0 : !!producers) && <span className="detail-meta-item"><i className="fas fa-briefcase" /> {Array.isArray(producers) ? producers.join(', ') : String(producers)}</span>}
              {aired && <span className="detail-meta-item"><i className="fas fa-calendar" /> {aired}</span>}
            </div>
            {genres.length > 0 && (
              <div className="detail-genres">
                {genres.map((g, i) => <span key={i} className="detail-genre">{g}</span>)}
              </div>
            )}
            <p className={`detail-synopsis ${synopsisOpen ? '' : 'collapsed'}`}>{synopsisText}</p>
            <button className="read-more-btn" onClick={() => setSynopsisOpen(v => !v)}>
              {synopsisOpen ? 'Tutup' : 'Baca selengkapnya'}
            </button>
            {firstEpisode && (
              <div className="detail-actions">
                <Link className="btn-primary" href={`/watch/${encodeURIComponent(firstEpisode.slug)}?anime=${encodeURIComponent(slug)}`}>
                  <i className="fas fa-play" /> Watch Episode 1
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="episodes-section">
        <div className="episodes-header">
          <h2 className="section-title"><span className="accent-bar" /> Episode List</h2>
          <button className="btn-secondary" onClick={() => setAsc(v => !v)}>
            <i className="fas fa-sort" /> {asc ? 'Oldest first' : 'Newest first'}
          </button>
        </div>
        {!sorted.length ? <EmptyState message="Belum ada episode" /> : (
          <div className="episodes-list">
            {sorted.map(s => (
              <Link
                key={s.slug}
                className="episode-card"
                href={`/watch/${encodeURIComponent(s.slug)}?anime=${encodeURIComponent(slug)}`}
              >
                <div className="episode-num">{String((s.ep as Record<string, unknown>).eps || (s.idx + 1))}</div>
                <div className="episode-info">
                  <div className="episode-title">{s.title}</div>
                  {s.date && <div className="episode-date">{s.date}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}

        {recommendations.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 className="section-title"><span className="accent-bar" /> Rekomendasi</h2>
            <div style={{ marginTop: 16 }}>
              <div className="card-grid">
                {recommendations
                  .map(r => normalizeAnimeCard(r as never))
                  .filter(r => r.slug)
                  .slice(0, 8)
                  .map(r => <AnimeCard key={r.slug} item={r} />)}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
