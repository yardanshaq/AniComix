// Loose types — the upstream API has inconsistent shapes, so we use defensive parsing.

export interface AnimeItem {
  animeId?: string;
  slug?: string;
  endpoint?: string;
  title?: string;
  judul?: string;
  poster?: string;
  thumbnail?: string;
  image?: string;
  thumb?: string;
  score?: string;
  rating?: string;
  status?: string;
  episodes?: number | string;
  episode?: string;
  current_episode?: string;
  eps?: string;
  releaseDay?: string;
  day?: string;
  latestReleaseDate?: string;
  lastReleaseDate?: string;
  releaseDate?: string;
  synopsis?: string;
  description?: string;
  type?: string;
  genre?: unknown;
  genres?: unknown;
  genreList?: unknown;
  [key: string]: unknown;
}

export interface ComicItem {
  slug?: string;
  endpoint?: string;
  link?: string;
  href?: string;
  title?: string;
  judul?: string;
  thumbnail?: string;
  image?: string;
  poster?: string;
  cover?: string;
  chapter?: string;
  latestChapter?: string;
  chapter_count?: string;
  type?: string;
  tipe?: string;
  score?: string;
  rating?: string;
  status?: string;
  synopsis?: string;
  description?: string;
  time_ago?: string;
  timeAgo?: string;
  genre?: unknown;
  genres?: unknown;
  [key: string]: unknown;
}

export interface NormalizedAnime {
  title: string;
  slug: string;
  poster: string;
  episode: string;
  score: string;
  status: string;
  releaseDay: string;
  releaseDate: string;
  genre: unknown[];
  synopsis: string;
  type: string;
}

export interface NormalizedComic {
  title: string;
  slug: string;
  poster: string;
  chapter: string;
  type: string;
  score: string;
  status: string;
  synopsis: string;
  timeAgo: string;
  genre: unknown[];
}

export interface Episode {
  episodeId?: string;
  slug?: string;
  endpoint?: string;
  title?: string;
  eps?: string | number;
  date?: string;
  uploaded?: string;
}
