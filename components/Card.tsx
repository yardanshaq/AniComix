import Link from 'next/link';
import LazyImage from './LazyImage';
import { truncate } from '@/lib/helpers';
import type { NormalizedAnime, NormalizedComic } from '@/lib/types';

export function AnimeCard({ item }: { item: NormalizedAnime }) {
  if (!item.slug) return null;
  return (
    <Link href={`/anime/${encodeURIComponent(item.slug)}`} className="card" title={item.title}>
      <div className="card-img-wrap">
        {item.score && (
          <span className="card-badge score">
            <i className="fas fa-star" /> {item.score}
          </span>
        )}
        {item.episode && <span className="card-badge episode">{item.episode}</span>}
        {!item.score && item.status && <span className="card-badge status">{item.status}</span>}
        <LazyImage src={item.poster} alt={item.title} />
        {item.synopsis && <div className="card-synopsis">{truncate(item.synopsis, 160)}</div>}
      </div>
      <div className="card-body">
        <div className="card-title">{item.title}</div>
        <div className="card-meta">
          {item.releaseDay && (
            <span><i className="fas fa-calendar-day" /> {item.releaseDay}</span>
          )}
          {item.releaseDate && (
            <span><i className="fas fa-clock" /> {item.releaseDate}</span>
          )}
          {item.type && <span><i className="fas fa-film" /> {item.type}</span>}
        </div>
      </div>
    </Link>
  );
}

export function ComicCard({ item }: { item: NormalizedComic }) {
  if (!item.slug) return null;
  return (
    <Link href={`/comic/${encodeURIComponent(item.slug)}`} className="card" title={item.title}>
      <div className="card-img-wrap">
        {item.type && <span className="card-badge status">{item.type}</span>}
        {item.chapter && <span className="card-badge episode">{item.chapter}</span>}
        <LazyImage src={item.poster} alt={item.title} />
        {item.synopsis && <div className="card-synopsis">{truncate(item.synopsis, 160)}</div>}
      </div>
      <div className="card-body">
        <div className="card-title">{item.title}</div>
        <div className="card-meta">
          {item.timeAgo && <span><i className="fas fa-clock" /> {item.timeAgo}</span>}
          {item.status && <span><i className="fas fa-circle-check" /> {item.status}</span>}
          {item.score && <span><i className="fas fa-star" /> {item.score}</span>}
        </div>
      </div>
    </Link>
  );
}

export function EmptyState({
  message = 'Tidak ada hasil ditemukan',
  icon = 'fa-box-open'
}: { message?: string; icon?: string }) {
  return (
    <div className="empty-state">
      <i className={`fas ${icon}`} />
      <h3>{message}</h3>
      <p>Coba kata kunci lain atau ganti filter.</p>
    </div>
  );
}

export function ErrorState({
  message = 'Gagal memuat data',
  onRetry
}: { message?: string; onRetry?: () => void }) {
  return (
    <div className="empty-state">
      <i className="fas fa-triangle-exclamation" style={{ color: '#ef4444' }} />
      <h3>{message}</h3>
      {onRetry && (
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={onRetry}>
          <i className="fas fa-rotate-right" /> Coba Lagi
        </button>
      )}
    </div>
  );
}
