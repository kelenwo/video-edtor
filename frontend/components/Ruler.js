'use client';

export default function Ruler({ duration, pixelsPerSecond }) {
  const width = duration * pixelsPerSecond;
  const markers = [];

  for (let i = 0; i <= duration; i++) {
    markers.push(
      <div
        key={i}
        className="position-absolute top-0 h-100"
        style={{ left: `${i * pixelsPerSecond}px` }}
      >
        <div className="w-px h-50 bg-secondary"></div>
        <span className="text-muted position-absolute" style={{ top: '-1.25rem' }}>{i}s</span>
      </div>
    );
  }

  return (
    <div className="position-relative" style={{ width: `${width}px`, height: '24px' }}>
      {markers}
    </div>
  );
} 