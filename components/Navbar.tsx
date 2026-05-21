'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/', label: 'Home', icon: 'fa-house', match: ['/'] },
  { href: '/anime', label: 'Anime', icon: 'fa-tv', match: ['/anime', '/watch'] },
  { href: '/comic', label: 'Comic', icon: 'fa-book-open', match: ['/comic', '/read'] },
  { href: '/schedule', label: 'Schedule', icon: 'fa-calendar', match: ['/schedule'] }
];

export default function Navbar({ onSearchClick }: { onSearchClick: () => void }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('theme') as 'dark' | 'light' | null) || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  const isActive = (matches: string[]) =>
    matches.some(m => (m === '/' ? pathname === '/' : pathname.startsWith(m)));

  return (
    <header id="navbar" className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          <i className="fas fa-photo-film" />
          <span>AniComix</span>
        </Link>
        <button
          className="mobile-menu-btn"
          aria-label="Menu"
          onClick={() => setMenuOpen(v => !v)}
        >
          <i className="fas fa-bars" />
        </button>
        <nav className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className={isActive(n.match) ? 'active' : ''}
            >
              <i className={`fas ${n.icon}`} /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <button className="icon-btn" aria-label="Cari" onClick={onSearchClick}>
            <i className="fas fa-magnifying-glass" />
          </button>
          <button className="icon-btn" aria-label="Toggle theme" onClick={toggleTheme}>
            <i className={`fas ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
