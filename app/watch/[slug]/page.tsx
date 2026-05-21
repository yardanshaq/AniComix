'use client';

import { Suspense, use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAnimeEpisode, getAnimeDetail, getAnimeServer } from '@/lib/api';
import { getEpisodeId } from '@/lib/helpers';
import { EmptyState, ErrorState } from '@/components/Card';
import { Spinner } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

interface Params { slug: string }

interface ServerEntry { serverId: string; title: string }
interface QualityGroup { title: string; serverList: ServerEntry[] }
interface DownloadLink { url?: string; link?: string; title?: string; provider?: string }
interface DownloadGroup {
  title?: string; quality?: string; size?: string;
  urls?: DownloadLink[]; servers?: DownloadLink[];
}

function WatchInner({ slug }: { slug: string }) {
  const search = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const animeFromQuery = search.get('anime') || '';

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState('');
  const [serverLoading, setServerLoading] = useState(false);
  const [activeServerId, setActiveServerId] = useState('');
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [sidebarEps, setSidebarEps] = useState<Array<{ slug: string; title: string; epNum: string; active: boolean }> | null>(null);

  const load = useCallback(() => {
    setData(null); setError(null);
    getAnimeEpisode(slug)
      .then(res => {
        const d = (res as { data?: Record<string, unknown> })?.data || (res as Record<string, unknown>) || {};
        setData(d);
        setIframeUrl((d.defaultStreamingUrl as string) || '');
      })
      .catch(e => setError((e as Error).message || 'Gagal memuat episode'));
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const animeId = (data?.animeId as string) || animeFromQuery;

  useEffect(() => {
    if (!animeId) return;
    getAnimeDetail(animeId).then(res => {
      const d = (res as { data?: Record<string, unknown> })?.data || (res as Record<string, unknown>) || {};
      const eps = ((d.episodeList || d.episodes || []) as Array<Record<string, unknown>>);
      const list = eps.map((ep, i) => ({
        slug: getEpisodeId(ep as never),
        title: (ep.title as string) || `Episode ${(ep.eps as string | number) || (i + 1)}`,
        epNum: String((ep.eps as string | number) || (i + 1)),
        active: false
      })).filter(x => x.slug).reverse();
      list.forEach(x => { if (x.slug === slug) x.active = true; });
      setSidebarEps(list);
    }).catch(() => setSidebarEps([]));
  }, [animeId, slug]);

  const onServerClick = async (sid: string) => {
    setActiveServerId(sid);
    setServerLoading(true);
    try {
      const sres = await getAnimeServer(sid);
      const url = (sres as { data?: { url?: string } })?.data?.url || '';
      if (!url) throw new Error('Server tidak tersedia');
      setIframeUrl(url);
    } catch {
      setIframeUrl('');
      showToast('Gagal memuat server. Coba server lain.', { type: 'error' });
    } finally {
      setServerLoading(false);
    }
  };

  const fullscreen = () => {
    const iframe = document.getElementById('player-iframe') as HTMLIFrameElement | null;
    if (!iframe) return;
    if (iframe.requestFullscreen) iframe.requestFullscreen();
  };

  if (error) return <div className="page-wrap"><ErrorState message={error} onRetry={load} /></div>;
  if (!data) return <Spinner />;

  const title = (data.title as string) || `Episode ${slug}`;
  const releaseTime = data.releaseTime as string;
  const qualities = ((data.server as { qualities?: QualityGroup[] })?.qualities || []) as QualityGroup[];
  const downloads = ((data.downloadUrl as { qualities?: DownloadGroup[] })?.qualities || []) as DownloadGroup[];
  const prev = data.hasPrevEpisode ? data.prevEpisode : null;
  const next = data.hasNextEpisode ? data.nextEpisode : null;

  return (
    <div className="watch-wrap">
      <div>
        <div className="player-wrap" id="player-wrap">
          {serverLoading ? <div className="loader-center"><div className="spinner" /></div> :
            iframeUrl ? (
              <iframe
                id="player-iframe"
                src={iframeUrl}
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-presentation"
              />
            ) : (
              <div className="player-fallback">
                <i className="fas fa-circle-exclamation" />
                <h3>Video tidak tersedia di server ini.</h3>
                <p>Coba pilih server lain di bawah.</p>
              </div>
            )}
        </div>

        <div className="watch-controls">
          {qualities.map((q, qi) => (
            <div key={qi} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13, marginRight: 4 }}>{q.title}:</span>
              {(q.serverList || []).map(s => (
                <button
                  key={s.serverId}
                  className={`quality-btn server-btn ${activeServerId === s.serverId ? 'active' : ''}`}
                  onClick={() => onServerClick(s.serverId)}
                >
                  {s.title}
                </button>
              ))}
            </div>
          ))}
          <button className="quality-btn" onClick={fullscreen}>
            <i className="fas fa-expand" /> Fullscreen
          </button>
        </div>

        <h2 style={{ marginTop: 24 }}>{title}</h2>
        {releaseTime && <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{releaseTime}</p>}

        <div className="episode-nav">
          <button
            className="episode-nav-btn"
            disabled={!prev}
            onClick={() => {
              const p = getEpisodeId(prev as never);
              if (p) router.push(`/watch/${encodeURIComponent(p)}?anime=${encodeURIComponent(animeId)}`);
            }}
          >
            <i className="fas fa-chevron-left" /> Previous Episode
          </button>
          <button
            className="episode-nav-btn"
            disabled={!next}
            onClick={() => {
              const n = getEpisodeId(next as never);
              if (n) router.push(`/watch/${encodeURIComponent(n)}?anime=${encodeURIComponent(animeId)}`);
            }}
          >
            Next Episode <i className="fas fa-chevron-right" />
          </button>
        </div>

        {downloads.length > 0 && (
          <div className="download-section">
            <button className="download-toggle" onClick={() => setDownloadOpen(v => !v)}>
              <span><i className="fas fa-download" /> Download Episode</span>
              <i
                className="fas fa-chevron-down"
                style={{ transform: downloadOpen ? 'rotate(180deg)' : '' }}
              />
            </button>
            <div className={`download-content ${downloadOpen ? 'open' : ''}`}>
              {downloads.map((group, gi) => {
                const quality = group.title || group.quality || 'Unknown';
                const list = group.urls || group.servers || [];
                return (
                  <div key={gi} className="download-quality">
                    <h5>
                      {quality}
                      {group.size && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> ({group.size})</span>}
                    </h5>
                    <div className="download-links">
                      {list.map((l, li) => {
                        const url = l.url || l.link || '';
                        const provider = l.title || l.provider || 'Link';
                        return url ? (
                          <a key={li} className="download-link" href={url} target="_blank" rel="noopener noreferrer">
                            <i className="fas fa-cloud-arrow-down" /> {provider}
                          </a>
                        ) : null;
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="comments-placeholder">
          <i className="fas fa-comments" />
          <h3>Komentar segera hadir</h3>
          <p>Sistem komentar belum aktif. Nantikan update berikutnya!</p>
        </div>
      </div>

      <aside className="episode-sidebar">
        <h4>Episode Lainnya</h4>
        {sidebarEps === null ? <Spinner /> :
          !sidebarEps.length ? <EmptyState message="Tidak ada episode" icon="fa-list" /> :
          sidebarEps.map(e => (
            <Link
              key={e.slug}
              className={`episode-card ${e.active ? 'active' : ''}`}
              href={`/watch/${encodeURIComponent(e.slug)}?anime=${encodeURIComponent(animeId)}`}
            >
              <div className="episode-num">{e.epNum}</div>
              <div className="episode-info">
                <div className="episode-title">{e.title}</div>
              </div>
            </Link>
          ))}
      </aside>
    </div>
  );
}

export default function WatchPage({ params }: { params: Promise<Params> }) {
  const { slug } = use(params);
  return (
    <Suspense fallback={<Spinner />}>
      <WatchInner slug={slug} />
    </Suspense>
  );
}
