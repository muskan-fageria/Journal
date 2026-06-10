import React, { useState, useMemo } from 'react';

// Smooth arc path generation
const polarToCartesian = (cx, cy, r, angleInDegrees) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: cx + (r * Math.cos(angleInRadians)),
    y: cy + (r * Math.sin(angleInRadians))
  };
};

const getArcPath = (cx, cy, r, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", start.x, start.y,
    "A", r, r, 0, largeArcFlag, 0, end.x, end.y
  ].join(" ");
};

// Emotional state based on balance
const getEmotionalState = (avg) => {
  if (avg >= 8.5) return { word: 'Thriving', desc: 'All dimensions in harmony' };
  if (avg >= 7) return { word: 'Balanced', desc: 'A centered state of being' };
  if (avg >= 5.5) return { word: 'Growing', desc: 'Steady progress, keep going' };
  if (avg >= 4) return { word: 'Shifting', desc: 'A time of transition' };
  if (avg >= 2.5) return { word: 'Restoring', desc: 'Give yourself grace' };
  return { word: 'Awakening', desc: 'Every journey begins here' };
};

// Subtle segment colors for each dimension
const segmentColors = {
  mind:          { light: '#7C9A92', dark: '#8FBCB0' },
  health:        { light: '#9B7E6B', dark: '#C4A68A' },
  learning:      { light: '#7B8FA8', dark: '#9BB5D0' },
  work:          { light: '#8B8B6B', dark: '#B0B08C' },
  relationships: { light: '#A87B8F', dark: '#D09BB5' },
  finance:       { light: '#6B8B7B', dark: '#8CB0A0' },
};

export default function LifeRing({ ratings, activeSegment, onSelectSegment }) {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const cx = 150;
  const cy = 150;
  const outerRadius = 120;
  const trackWidth = 8;
  const progressWidth = 8;
  const gapDegrees = 5;

  const dimensions = [
    { key: 'mind', label: 'Mind', startAngle: 0, endAngle: 60 },
    { key: 'health', label: 'Health', startAngle: 60, endAngle: 120 },
    { key: 'learning', label: 'Learning', startAngle: 120, endAngle: 180 },
    { key: 'work', label: 'Work', startAngle: 180, endAngle: 240 },
    { key: 'relationships', label: 'Relations', startAngle: 240, endAngle: 300 },
    { key: 'finance', label: 'Finance', startAngle: 300, endAngle: 360 },
  ];

  const ratingValues = Object.values(ratings);
  const avgBalance = ratingValues.length > 0
    ? (ratingValues.reduce((sum, val) => sum + val, 0) / ratingValues.length)
    : 0;

  const emotionalState = useMemo(() => getEmotionalState(avgBalance), [avgBalance]);

  // Check theme for color selection
  const isDark = typeof document !== 'undefined' && document.body.classList.contains('theme-primary');
  const colorMode = isDark ? 'dark' : 'light';

  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      <div className="relative" style={{ width: 300, height: 300 }}>
        <svg
          viewBox="0 0 300 300"
          className="w-full h-full overflow-visible"
          style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.06))' }}
        >
          {/* Subtle center ambient glow */}
          <defs>
            {dimensions.map(dim => (
              <linearGradient
                key={`grad-${dim.key}`}
                id={`grad-${dim.key}`}
                gradientUnits="userSpaceOnUse"
                x1={polarToCartesian(cx, cy, outerRadius, dim.startAngle + gapDegrees / 2).x}
                y1={polarToCartesian(cx, cy, outerRadius, dim.startAngle + gapDegrees / 2).y}
                x2={polarToCartesian(cx, cy, outerRadius, dim.endAngle - gapDegrees / 2).x}
                y2={polarToCartesian(cx, cy, outerRadius, dim.endAngle - gapDegrees / 2).y}
              >
                <stop offset="0%" stopColor={segmentColors[dim.key]?.[colorMode] || '#888'} stopOpacity="0.85" />
                <stop offset="100%" stopColor={segmentColors[dim.key]?.[colorMode] || '#888'} stopOpacity="1" />
              </linearGradient>
            ))}
          </defs>

          {/* Render segments */}
          {dimensions.map((dim) => {
            const isHovered = hoveredSegment === dim.key;
            const isActive = activeSegment === dim.key;
            const rating = ratings[dim.key] || 1;

            const segmentStart = dim.startAngle + gapDegrees / 2;
            const segmentEnd = dim.endAngle - gapDegrees / 2;
            const maxArc = segmentEnd - segmentStart;
            const progressEnd = segmentStart + (maxArc * (rating / 10));

            const trackPath = getArcPath(cx, cy, outerRadius, segmentStart, segmentEnd);
            const progressPath = getArcPath(cx, cy, outerRadius, segmentStart, progressEnd);

            // Label position at midpoint of segment arc, slightly outside ring
            const labelAngle = (dim.startAngle + dim.endAngle) / 2;
            const labelPos = polarToCartesian(cx, cy, outerRadius + 22, labelAngle);

            return (
              <g
                key={dim.key}
                className="cursor-pointer"
                onClick={() => onSelectSegment(dim.key)}
                onMouseEnter={() => setHoveredSegment(dim.key)}
                onMouseLeave={() => setHoveredSegment(null)}
                style={{ transition: 'opacity 0.3s ease' }}
              >
                {/* Background track */}
                <path
                  d={trackPath}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth={trackWidth}
                  strokeLinecap="round"
                  opacity={isActive ? 0.6 : 0.35}
                  style={{ transition: 'opacity 0.4s ease' }}
                />

                {/* Progress arc */}
                <path
                  d={progressPath}
                  fill="none"
                  stroke={`url(#grad-${dim.key})`}
                  strokeWidth={isActive ? progressWidth + 3 : isHovered ? progressWidth + 1 : progressWidth}
                  strokeLinecap="round"
                  opacity={isActive ? 1 : isHovered ? 0.9 : 0.65}
                  style={{ transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />

                {/* Active segment glow */}
                {isActive && (
                  <path
                    d={progressPath}
                    fill="none"
                    stroke={segmentColors[dim.key]?.[colorMode] || '#888'}
                    strokeWidth={progressWidth + 8}
                    strokeLinecap="round"
                    opacity={0.12}
                    style={{ filter: 'blur(4px)' }}
                  />
                )}

                {/* Hit area */}
                <path
                  d={trackPath}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={30}
                  className="pointer-events-auto"
                />

                {/* Segment label - outside the ring */}
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={isActive
                    ? (segmentColors[dim.key]?.[colorMode] || 'var(--text)')
                    : 'var(--text-dim)'
                  }
                  fontSize={isActive ? 9.5 : 8.5}
                  fontFamily="Inter, DM Sans, sans-serif"
                  fontWeight={isActive ? 600 : 400}
                  letterSpacing="0.06em"
                  opacity={isActive ? 1 : isHovered ? 0.8 : 0.5}
                  style={{ transition: 'all 0.3s ease', textTransform: 'uppercase' }}
                >
                  {dim.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Center emotional state */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span
            className="font-sans tracking-[0.2em] uppercase font-medium"
            style={{ fontSize: 9, color: 'var(--text-faint)', marginBottom: 6 }}
          >
            Today's Balance
          </span>
          <span
            className="font-newsreader font-semibold leading-none"
            style={{
              fontSize: 38,
              color: 'var(--text)',
              letterSpacing: '-0.02em',
              marginBottom: 4,
            }}
          >
            {emotionalState.word}
          </span>
          <span
            className="font-sans italic"
            style={{ fontSize: 10.5, color: 'var(--text-dim)', maxWidth: 140, lineHeight: 1.4 }}
          >
            {emotionalState.desc}
          </span>
        </div>
      </div>
    </div>
  );
}
