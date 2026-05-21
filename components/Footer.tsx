import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-col">
          <h3 className="footer-logo">AniComix</h3>
          <p className="footer-disclaimer">
            AniComix tidak menyimpan file video/gambar. Semua konten bersumber dari API pihak ketiga.
          </p>
        </div>
        <div className="footer-col">
          <h4>Navigasi</h4>
          <Link href="/">Home</Link>
          <Link href="/anime">Anime</Link>
          <Link href="/comic">Comic</Link>
          <Link href="/schedule">Schedule</Link>
        </div>
        <div className="footer-col">
          <h4>Social</h4>
          <div className="socials">
            <a href="#" aria-label="Twitter"><i className="fa-brands fa-twitter" /></a>
            <a href="#" aria-label="Discord"><i className="fa-brands fa-discord" /></a>
            <a href="#" aria-label="Github"><i className="fa-brands fa-github" /></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">© 2026 AniComix · Built for fans by fans</div>
    </footer>
  );
}
