export default function GrainOverlay() {
  return (
    <>
      <svg className="hidden" aria-hidden="true">
        <defs>
          <filter id="sm-grain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="4"
              stitchTiles="stitch"
            />
          </filter>
        </defs>
      </svg>
      <div
        aria-hidden="true"
        className="grain-overlay fixed pointer-events-none z-[998]"
        style={{
          inset: '-50%',
          width: '200%',
          height: '200%',
          filter: 'url(#sm-grain)',
          opacity: 0.04,
        }}
      />
    </>
  );
}
