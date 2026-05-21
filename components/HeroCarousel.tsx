'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { truncate } from '@/lib/helpers';
import type { NormalizedAnime } from '@/lib/types';

interface Props {
  items: NormalizedAnime[];
  autoMs?: number;
}

export default function HeroCarousel({ items, autoMs = 4000 }: Props) {
  const [index, setIndex] = useState(0);
  const hoverRef = useRef(false);
  const len = items.length;

  useEffect(() => {
    if (len <= 1) return;
    const t = setInterval(() => {
      if (!hoverRef.current) setIndex(i => (i + 1) % len);
    }, autoMs);
    return () => clearInterval(t);
  }, [len, autoMs]);

  if (!len) return null;
  const cur = items[index];

  return (
    <div
      className="hero-carousel"
      onMouseEnter={() => { hoverRef.current = true; }}
      onMouseLeave={() => { hoverRef.current = false; }}
    >
      {items.map((it, i) => (
        <div
          key={it.slug + i}
          className={`hero-slide ${i === index ? 'active' : ''}`}
          style={{ backgroundImage: `url('${it.poster}')` }}
        >
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1 className="hero-title">{it.title}</h1>
            <div className="hero-meta">
              {it.score && <span><i className="fas fa-star" style={{ color: '#fbbf24' }} /> {it.score}</span>}
              {it.status && <span><i className="fas fa-circle-check" /> {it.status}</span>}
              {it.episode && <span><i className="fas fa-list" /> {it.episode}</span>}
            </div>
            {it.synopsis && <p className="hero-synopsis">{truncate(it.synopsis, 220)}</p>}
            <Link href={`/anime/${encodeURIComponent(it.slug)}`} className="btn-primary">
              <i className="fas fa-play" /> Lihat Detail
            </Link>
          </div>
        </div>
      ))}
      {len > 1 && (
        <>
          <button
            className="hero-arrow hero-arrow-prev"
            onClick={() => setIndex(i => (i - 1 + len) % len)}
            aria-label="Previous"
          >
            <i className="fas fa-chevron-left" />
          </button>
          <button
            className="hero-arrow hero-arrow-next"
            onClick={() => setIndex(i => (i + 1) % len)}
            aria-label="Next"
          >
            <i className="fas fa-chevron-right" />
          </button>
          <div className="hero-dots">
            {items.map((_, i) => (
              <button
                key={i}
                className={`hero-dot ${i === index ? 'active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
