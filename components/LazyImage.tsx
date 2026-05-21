'use client';

import { useEffect, useRef, useState } from 'react';
import { POSTER_PLACEHOLDER } from '@/lib/helpers';

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export default function LazyImage({ src, alt, className = '' }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!imgRef.current) return;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setInView(true);
            obs.disconnect();
          }
        });
      },
      { rootMargin: '300px' }
    );
    obs.observe(imgRef.current);
    return () => obs.disconnect();
  }, []);

  const finalSrc = errored ? POSTER_PLACEHOLDER : (inView ? src : '');

  return (
    <img
      ref={imgRef}
      src={finalSrc || POSTER_PLACEHOLDER}
      alt={alt}
      className={`lazy ${loaded ? 'loaded' : ''} ${className}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onLoad={() => setLoaded(true)}
      onError={() => { setErrored(true); setLoaded(true); }}
    />
  );
}
