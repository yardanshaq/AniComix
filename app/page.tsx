'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getAnimeHome, getAnimeOngoing, getAnimeSchedule,
  getComicHome, getComicTrending
} from '@/lib/api';
import {
  normalizeAnimeCard, normalizeComicCard, isToday, pickList, deepFindArrays
} from '@/lib/helpers';
import { AnimeCard, ComicCard, EmptyState, ErrorState } from '@/components/Card';
import { SkeletonGrid, SkeletonRow, SkeletonHero } from '@/components/Skeleton';
import HeroCarousel from '@/components/HeroCarousel';
import type { NormalizedAnime, NormalizedComic } from '@/lib/types';

interface ScheduleDay {
  day?: string;
  name?: string;
  anime_list?: unknown[];
  animeList?: unknown[];
  list?: unknown[];
  anime?: unknown[];
  items?: unknown[];
}

export default function HomePage() {
  const [hero, setHero] = useState<NormalizedAnime[] | null>(null);
  const [ongoing, setOngoing] = useState<NormalizedAnime[] | null>(null);
  const [completed, setCompleted] = useState<NormalizedAnime[] | null>(null);
  const [comicLatest, setComicLatest] = useState<NormalizedComic[] | null>(null);
  const [trendingComic, setTrendingComic] = useState<NormalizedComic[] | null>(null);
  const [scheduleDays, setScheduleDays] = useState<ScheduleDay[]>([]);
  const [scheduleActive, setScheduleActive] = useState(0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([
      getAnimeHome().catch(() => null),
      getAnimeOngoing(1).catch(() => null),
      getComicHome().catch(() => null),
      getComicTrending().catch(() => null),
      getAnimeSchedule().catch(() => null)
    ]).then(([homeRes, ongoingRes, comicRes, trendingRes, scheduleRes]) => {
      const errs: Record<string, boolean> = {};

      // Hero + completed from anime home
      const homeData = (homeRes as { data?: Record<string, unknown> })?.data || (homeRes as Record<string, unknown>) || {};
      const ongoingList = (homeData?.ongoing as { animeList?: unknown[] })?.animeList || [];
      const completedList = (homeData?.completed as { animeList?: unknown[] })?.animeList || [];

      const heroItems = (ongoingList as unknown[]).map(it => normalizeAnimeCard(it as never)).filter(i => i.slug).slice(0, 8);
      setHero(heroItems);

      // Ongoing - prefer dedicated endpoint, fallback to home
      const ongoingData = (ongoingRes as { data?: { animeList?: unknown[] } })?.data;
      let ongoingItems: NormalizedAnime[] = [];
      if (ongoingData?.animeList) {
        ongoingItems = ongoingData.animeList.map(it => normalizeAnimeCard(it as never)).filter(i => i.slug);
      } else {
        ongoingItems = (ongoingList as unknown[]).map(it => normalizeAnimeCard(it as never)).filter(i => i.slug);
      }
      if (!ongoingItems.length) errs.ongoing = true;
      setOngoing(ongoingItems);

      const completedItems = (completedList as unknown[]).map(it => normalizeAnimeCard(it as never)).filter(i => i.slug);
      if (!completedItems.length) errs.completed = true;
      setCompleted(completedItems);

      // Comic latest
      const cr = comicRes as Record<string, unknown> | null;
      let comicItems: unknown[] = ((cr?.latest as unknown[]) || (cr?.popular as unknown[]) || []) as unknown[];
      if (!comicItems.length) comicItems = pickList(cr || {}, ['latest', 'popular', 'comics']);
      if (!comicItems.length) comicItems = (deepFindArrays(cr)[0] as unknown[]) || [];
      const comicLatestItems = comicItems.map(it => normalizeComicCard(it as never)).filter(i => i.slug);
      if (!comicLatestItems.length) errs.comic = true;
      setComicLatest(comicLatestItems);

      // Trending comic
      const tr = trendingRes as Record<string, unknown> | null;
      let tItems = ((tr?.trending as unknown[]) || (tr?.comics as unknown[]) || (tr?.data as unknown[]) || []) as unknown[];
      if (!Array.isArray(tItems)) tItems = [];
      const trendingItems = tItems.map(it => normalizeComicCard(it as never)).filter(i => i.slug);
      setTrendingComic(trendingItems);

      // Schedule
      const sr = scheduleRes as { data?: ScheduleDay[] } | ScheduleDay[] | null;
      let days: ScheduleDay[] = [];
      if (Array.isArray(sr)) days = sr;
      else if (Array.isArray((sr as { data?: ScheduleDay[] })?.data)) days = (sr as { data: ScheduleDay[] }).data;
      setScheduleDays(days);
      const todayIdx = days.findIndex(x => isToday(x.day || x.name));
      setScheduleActive(todayIdx >= 0 ? todayIdx : 0);

      setErrors(errs);
    });
  }, []);

  return (
    <>
      <section className="hero-section">
        {hero === null ? <SkeletonHero /> : (hero.length > 0 ? <HeroCarousel items={hero} /> : null)}
      </section>

      <div className="container">
        <section className="section">
          <div className="section-header">
            <h2 className="section-title"><span className="accent-bar" /> Ongoing Anime</h2>
            <Link href="/anime?tab=ongoing" className="section-link">Lihat semua <i className="fas fa-arrow-right" /></Link>
          </div>
          {ongoing === null ? <SkeletonRow count={8} /> :
            ongoing.length === 0 ? <EmptyState message="Belum ada anime ongoing" /> :
            <div className="row-scroll">{ongoing.slice(0, 16).map(i => <AnimeCard key={i.slug} item={i} />)}</div>}
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title"><span className="accent-bar" /> Latest Comic Updates</h2>
            <Link href="/comic" className="section-link">Lihat semua <i className="fas fa-arrow-right" /></Link>
          </div>
          {comicLatest === null ? <SkeletonRow count={8} /> :
            errors.comic ? <ErrorState message="Gagal memuat komik" /> :
            comicLatest.length === 0 ? <EmptyState message="Belum ada komik tersedia" /> :
            <div className="row-scroll">{comicLatest.slice(0, 16).map(i => <ComicCard key={i.slug} item={i} />)}</div>}
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title"><span className="accent-bar" /> Completed Anime</h2>
            <Link href="/anime?tab=completed" className="section-link">Lihat semua <i className="fas fa-arrow-right" /></Link>
          </div>
          {completed === null ? <SkeletonGrid count={12} /> :
            completed.length === 0 ? <EmptyState /> :
            <div className="card-grid">{completed.slice(0, 12).map(i => <AnimeCard key={i.slug} item={i} />)}</div>}
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title"><span className="accent-bar" /> Trending Comic</h2>
            <Link href="/comic?tab=trending" className="section-link">Lihat semua <i className="fas fa-arrow-right" /></Link>
          </div>
          {trendingComic === null ? <SkeletonRow count={8} /> :
            trendingComic.length === 0 ? <EmptyState message="Tidak ada komik trending" /> :
            <div className="row-scroll">{trendingComic.slice(0, 16).map(i => <ComicCard key={i.slug} item={i} />)}</div>}
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title"><span className="accent-bar" /> Weekly Schedule</h2>
          </div>
          {!scheduleDays.length ? <SkeletonRow count={8} /> : (
            <>
              <div className="schedule-tabs">
                {scheduleDays.map((d, i) => (
                  <button
                    key={i}
                    className={`schedule-day-btn ${i === scheduleActive ? 'active' : ''} ${isToday(d.day || d.name) ? 'today' : ''}`}
                    onClick={() => setScheduleActive(i)}
                  >
                    {d.day || d.name}
                  </button>
                ))}
              </div>
              {(() => {
                const cur = scheduleDays[scheduleActive] || {};
                const rawList = cur.anime_list || cur.animeList || cur.list || cur.anime || cur.items || [];
                const items = (rawList as unknown[])
                  .map(x => ({ ...(x as Record<string, unknown>), animeId: (x as Record<string, unknown>).animeId || (x as Record<string, unknown>).slug }))
                  .map(it => normalizeAnimeCard(it as never))
                  .filter(i => i.slug);
                if (!items.length) return <EmptyState message="Tidak ada anime pada hari ini" icon="fa-calendar-xmark" />;
                return <div className="card-grid">{items.slice(0, 24).map(i => <AnimeCard key={i.slug} item={i} />)}</div>;
              })()}
            </>
          )}
        </section>
      </div>
    </>
  );
}
