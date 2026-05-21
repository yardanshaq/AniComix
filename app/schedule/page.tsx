'use client';

import { useCallback, useEffect, useState } from 'react';
import { getAnimeSchedule } from '@/lib/api';
import { isToday, normalizeAnimeCard } from '@/lib/helpers';
import { AnimeCard, EmptyState, ErrorState } from '@/components/Card';
import { SkeletonGrid } from '@/components/Skeleton';

interface ScheduleDay {
  day?: string;
  name?: string;
  anime_list?: unknown[];
  animeList?: unknown[];
  list?: unknown[];
  anime?: unknown[];
  items?: unknown[];
}

export default function SchedulePage() {
  const [days, setDays] = useState<ScheduleDay[] | null>(null);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setDays(null); setError(null);
    getAnimeSchedule()
      .then(res => {
        let list: ScheduleDay[] = [];
        if (Array.isArray(res)) list = res as ScheduleDay[];
        else if (Array.isArray((res as { data?: ScheduleDay[] }).data)) list = (res as { data: ScheduleDay[] }).data;
        else if (res && typeof res === 'object') {
          list = Object.entries(res as Record<string, unknown>).map(([day, l]) => ({ day, anime_list: l as unknown[] }));
        }
        setDays(list);
        const todayIdx = list.findIndex(x => isToday(x.day || x.name));
        setActive(todayIdx >= 0 ? todayIdx : 0);
      })
      .catch(e => setError((e as Error).message || 'Gagal memuat jadwal'));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <div className="page-wrap"><ErrorState message={error} onRetry={load} /></div>;
  if (!days) {
    return (
      <div className="page-wrap">
        <h1 className="page-title">Jadwal Tayang</h1>
        <p className="page-subtitle">Jadwal mingguan rilis anime baru — hari ini disorot otomatis.</p>
        <SkeletonGrid count={12} />
      </div>
    );
  }
  if (!days.length) return <div className="page-wrap"><EmptyState message="Tidak ada jadwal" /></div>;

  const cur = days[active] || {};
  const rawList = cur.anime_list || cur.animeList || cur.list || cur.anime || cur.items || [];
  const items = (rawList as unknown[])
    .map(x => ({ ...(x as Record<string, unknown>), animeId: (x as Record<string, unknown>).animeId || (x as Record<string, unknown>).slug }))
    .map(it => normalizeAnimeCard(it as never))
    .filter(i => i.slug);

  return (
    <div className="page-wrap">
      <h1 className="page-title">Jadwal Tayang</h1>
      <p className="page-subtitle">Jadwal mingguan rilis anime baru — hari ini disorot otomatis.</p>

      <div className="schedule-tabs">
        {days.map((d, i) => (
          <button
            key={i}
            className={`schedule-day-btn ${i === active ? 'active' : ''} ${isToday(d.day || d.name) ? 'today' : ''}`}
            onClick={() => setActive(i)}
          >
            {d.day || d.name}
          </button>
        ))}
      </div>

      {items.length === 0
        ? <EmptyState message="Tidak ada anime pada hari ini" icon="fa-calendar-xmark" />
        : <div className="card-grid">{items.map(i => <AnimeCard key={i.slug} item={i} />)}</div>}
    </div>
  );
}
