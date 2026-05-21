export function SkeletonCard() {
  return (
    <div className="card">
      <div className="card-img-wrap skeleton" />
      <div className="card-body">
        <div className="skeleton skeleton-text" style={{ width: '80%' }} />
        <div className="skeleton skeleton-text" style={{ width: '50%' }} />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="card-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonRow({ count = 8 }: { count?: number }) {
  return (
    <div className="row-scroll">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div
      className="skeleton"
      style={{
        width: '100%',
        height: '60vh',
        minHeight: 400,
        borderRadius: '0 0 var(--radius-lg) var(--radius-lg)'
      }}
    />
  );
}

export function Spinner() {
  return (
    <div className="loader-center">
      <div className="spinner" />
    </div>
  );
}
