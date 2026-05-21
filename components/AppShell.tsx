'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import SearchOverlay from './SearchOverlay';
import { ToastProvider } from './Toast';

export default function AppShell({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [offline, setOffline] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <ToastProvider>
      {offline && (
        <div className="offline-banner">
          <i className="fas fa-wifi" /> Kamu sedang offline. Cek koneksi internetmu.
        </div>
      )}

      <Navbar onSearchClick={() => setSearchOpen(true)} />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <main id="app" className="app-main">
        {children}
      </main>

      <Footer />

      <button
        className={`back-to-top ${showBackTop ? 'visible' : ''}`}
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <i className="fas fa-arrow-up" />
      </button>
    </ToastProvider>
  );
}
