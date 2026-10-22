export default function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand">
      <div className="brand-mark" aria-hidden="true">
        MM
      </div>
      {!compact && (
        <div className="brand-copy">
          <span className="brand-name">MATCHMIND</span>
          <span className="brand-sub">BROADCAST INTELLIGENCE</span>
        </div>
      )}
    </div>
  );
}
