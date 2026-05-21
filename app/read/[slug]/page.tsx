'use client';

import { Suspense, use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getComicChapter, getComicDetail } from '@/lib/api';
import { throttle } from '@/lib/helpers';
import { ErrorState } from '@/components/Card';
import { Spinner } from '@/components/Skeleton';

interface Params { slug: string }

type ReaderMode = 'vertical' | 'single' | 'double';
type BgMode = 'dark' | 'light';

function ReaderInner({ slug }: { slug: string }) {
  const router = useRouter();
  const search = useSearchParams();
  const comicSlug = search.get('comic') || '';

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<ReaderMode>('vertical');
  const [zoom, setZoom] = useState('1');
  const [bg, setBg] = useState<BgMode>('dark');
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [chapters, setChapters] = useState<Array<{ slug: string; title: string }>>([]);

  useEffect(() => {
    const sm = (localStorage.getItem('reader-mode') as ReaderMode | null) || 'vertical';
    const sz = localStorage.getItem('reader-zoom') || '1';
    const sb = (localStorage.getItem('reader-bg') as BgMode | null) || 'dark';
    setMode(sm); setZoom(sz); setBg(sb);
  }, []);

  const load = useCallback(() => {
    setData(null); setError(null);
    getComicChapter(slug)
      .then(res => {
        const d = (res as { data?: Record<string, unknown> })?.data || (res as Record<string, unknown>) || {};
        setData(d);
      })
      .catch(e => setError((e as Error).message || 'Gagal memuat chapter'));
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!comicSlug) return;
    getComicDetail(comicSlug).then(res => {
      const d = (res as { data?: Record<string, unknown> })?.data || (res as Record<string, unknown>) || {};
      const ch = ((d.chapters || d.chapter_list || []) as Array<Record<string, unknown>>)
        .map((c, i) => ({
          slug: (c.slug || c.endpoint || '') as string,
          title: (c.chapter || c.title || `Chapter ${i + 1}`) as string
        }))
        .filter(x => x.slug);
      setChapters(ch);
    }).catch(() => {});
  }, [comicSlug]);

  // Lazy load images using IntersectionObserver
  useEffect(() => {
    if (!containerRef.current || !data) return;
    const imgs = containerRef.current.querySelectorAll<HTMLImageElement>('img.lazy');
    observerRef.current?.disconnect();
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const img = e.target as HTMLImageElement;
          img.src = img.dataset.src || '';
          img.onload = () => img.classList.add('loaded');
          img.onerror = () => img.classList.add('error');
          obs.unobserve(img);
        }
      });
    }, { rootMargin: '600px' });
    imgs.forEach(i => obs.observe(i));
    observerRef.current = obs;
    return () => obs.disconnect();
  }, [data]);

  // Reading progress bar
  useEffect(() => {
    const onScroll = throttle(() => {
      const top = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? (top / h) * 100 : 0;
      setProgress(Math.min(100, pct));
    }, 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onModeChange = (m: ReaderMode) => {
    setMode(m);
    localStorage.setItem('reader-mode', m);
  };
  const onZoomChange = (z: string) => {
    setZoom(z);
    localStorage.setItem('reader-zoom', z);
  };
  const toggleBg = () => {
    const next: BgMode = bg === 'dark' ? 'light' : 'dark';
    setBg(next);
    localStorage.setItem('reader-bg', next);
  };

  if (error) return <div className="page-wrap"><ErrorState message={error} onRetry={load} /></div>;
  if (!data) return <Spinner />;

  const mangaTitle = (data.manga_title || data.mangaTitle || '') as string;
  const chapterTitle = (data.chapter_title || data.chapterTitle || `Chapter ${slug}`) as string;
  const images = (Array.isArray(data.images) ? (data.images as string[]).filter(Boolean) : []);
  const nav = (data.navigation as Record<string, unknown>) || {};
  const prev = (nav.previousChapter || nav.prev || null);
  const next = (nav.nextChapter || nav.next || null);

  const go = (target: unknown) => {
    if (!target) return;
    const ts = typeof target === 'string'
      ? target
      : ((target as { slug?: string; endpoint?: string })?.slug
        || (target as { slug?: string; endpoint?: string })?.endpoint
        || '');
    if (ts) router.push(`/read/${encodeURIComponent(ts)}?comic=${encodeURIComponent(comicSlug)}`);
  };

  if (!images.length) {
    return <div className="page-wrap"><ErrorState message="Tidak ada halaman tersedia di chapter ini." onRetry={load} /></div>;
  }

  return (
    <>
      <div className="reader-progress" style={{ width: `${progress}%` }} />

      <div className="reader-toolbar">
        <div className="reader-toolbar-inner">
          <div className="reader-toolbar-title">
            <i className="fas fa-book-open" />{' '}
            {mangaTitle ? `${mangaTitle} — ${chapterTitle}` : chapterTitle}
          </div>
          <button className="btn-secondary" disabled={!prev} onClick={() => go(prev)}>
            <i className="fas fa-chevron-left" /> Prev
          </button>
          <select
            className="filter-select"
            value={slug}
            onChange={e => {
              if (e.target.value) router.push(`/read/${encodeURIComponent(e.target.value)}?comic=${encodeURIComponent(comicSlug)}`);
            }}
          >
            <option value="">Jump to chapter...</option>
            {chapters.map(c => (
              <option key={c.slug} value={c.slug}>{c.title}</option>
            ))}
          </select>
          <button className="btn-secondary" disabled={!next} onClick={() => go(next)}>
            Next <i className="fas fa-chevron-right" />
          </button>

          <select
            className="filter-select"
            value={mode}
            onChange={e => onModeChange(e.target.value as ReaderMode)}
          >
            <option value="vertical">Vertical Scroll</option>
            <option value="single">Single Page</option>
            <option value="double">Double Page</option>
          </select>
          <select
            className="filter-select"
            value={zoom}
            onChange={e => onZoomChange(e.target.value)}
          >
            <option value="0.75">75%</option>
            <option value="1">100%</option>
            <option value="1.25">125%</option>
            <option value="1.5">150%</option>
          </select>
          <button className="icon-btn" title="Toggle reader background" onClick={toggleBg}>
            <i className="fas fa-circle-half-stroke" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`reader-container reader-mode-${mode} ${bg === 'dark' ? 'bg-dark' : 'bg-light'}`}
      >
        {images.map((url, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={i}
            className="chapter-page lazy"
            data-src={url}
            data-index={i}
            alt={`Page ${i + 1}`}
            referrerPolicy="no-referrer"
            style={{ width: `${100 * parseFloat(zoom)}%`, maxWidth: `${100 * parseFloat(zoom)}%` }}
            onClick={e => {
              const img = e.target as HTMLImageElement;
              if (img.classList.contains('error')) {
                img.classList.remove('error');
                const src = img.dataset.src || '';
                img.src = '';
                setTimeout(() => { img.src = src; }, 50);
              }
            }}
          />
        ))}
      </div>

      <div className="reader-chapter-nav">
        <button className="btn-secondary" disabled={!prev} onClick={() => go(prev)}>
          <i className="fas fa-chevron-left" /> Prev Chapter
        </button>
        <button className="btn-secondary" disabled={!next} onClick={() => go(next)}>
          Next Chapter <i className="fas fa-chevron-right" />
        </button>
      </div>
    </>
  );
}

export default function ReaderPage({ params }: { params: Promise<Params> }) {
  const { slug } = use(params);
  return (
    <Suspense fallback={<Spinner />}>
      <ReaderInner slug={slug} />
    </Suspense>
  );
}
