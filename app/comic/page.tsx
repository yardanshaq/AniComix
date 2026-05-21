import { Suspense } from 'react';
import ComicListView from '@/components/ComicListView';
import { SkeletonGrid } from '@/components/Skeleton';

const TABS = [
  { id: 'all',      label: 'All' },
  { id: 'popular',  label: 'Populer' },
  { id: 'latest',   label: 'Terbaru' },
  { id: 'trending', label: 'Trending' },
  { id: 'manga',    label: 'Manga' },
  { id: 'manhwa',   label: 'Manhwa' },
  { id: 'manhua',   label: 'Manhua' }
];

export default function ComicPage() {
  return (
    <Suspense fallback={<div className="page-wrap"><SkeletonGrid count={12} /></div>}>
      <ComicListView
        title="Comic"
        subtitle="Baca manga, manhwa, dan manhua favoritmu — dalam dark mode yang nyaman."
        tabs={TABS}
        defaultTab="all"
        pageSlug="/comic"
      />
    </Suspense>
  );
}
