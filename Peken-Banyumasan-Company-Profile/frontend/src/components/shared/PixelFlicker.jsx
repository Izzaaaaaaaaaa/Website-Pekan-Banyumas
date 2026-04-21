import useReducedMotion from '../../hooks/useReducedMotion.js';

/* ------------------------------------------------------------------
   PixelFlicker — v1.7
   User feedback on v1.6 + attached reference screenshot:
   - Squares must look SQUARE (persegi) — v1.6 used preserveAspectRatio
     "none" which stretched them into rectangles on wide viewports.
   - Pattern only in BOTTOM HALF of carousel — no climb to top.
     The top half must stay completely clear (it's not just about
     the button row, it's the whole upper composition).
   - Layout follows a stepped "staircase" formation:
       bottom row dense → next row shorter → next row shorter →
       isolated punctuation pixels at the top of the band.
     Corner clusters look like descending bar graphs / stairs.
   - Bigger pixels, fewer total (~36 squares instead of 64).
   - Calmer animation because fewer pixels = naturally fewer blinks.

   Layout (1440×320 viewBox, 40×40 squares on 40-grid):
     y=280 (bottom row) — dense dempet pixels both corners + diffuse
     y=240 — stepped down, gaps introduced
     y=200 — sparser
     y=160 — punctuation only (a few isolated squares per side)
     y=120 and above — empty (top half of the 320 band)

   IMPORTANT: uses preserveAspectRatio with "xMidYEnd meet" (kept
   in SVG but the wrapper uses it correctly in BOTH Home overlay
   and static preview) — squares stay square regardless of viewport
   width.
   ------------------------------------------------------------------ */
const PIXEL_SIZE = 40;
const PIXEL_VIEWBOX = [1440, 320];

// Stepped staircase pattern: bottom-left and bottom-right clusters
// form descending-bar silhouettes; a few punctuation squares diffuse
// toward centre-bottom; top half of band stays empty.
const PIXEL_RECTS = [
  // ── BOTTOM-LEFT cluster (stepped staircase, descending) ──
  // Bottom row y=280 — dense anchor
  [0, 280], [40, 280], [80, 280], [120, 280],
  [160, 280], [200, 280], [240, 280],
  // y=240 — stepped shorter, two pockets of 2-3 pixels
  [0, 240], [40, 240], [120, 240], [160, 240], [200, 240],
  // y=200 — sparser, dua small groups
  [40, 200], [80, 200], [160, 200],
  // y=160 — punctuation (single isolated pixels)
  [0, 160], [120, 160],
  // Single accent higher up (still in bottom half of band)
  [40, 120],

  // ── DIFFUSE BOTTOM-CENTRE — sparse bottom-row pixels ──
  [320, 280], [400, 280], [520, 280],
  [880, 280], [1000, 280], [1080, 280],

  // ── BOTTOM-RIGHT cluster (mirror of left, descending-bar) ──
  // Bottom row
  [1160, 280], [1200, 280], [1240, 280],
  [1280, 280], [1320, 280], [1360, 280], [1400, 280],
  // y=240 — stepped shorter
  [1200, 240], [1240, 240], [1280, 240], [1360, 240], [1400, 240],
  // y=200 — sparser
  [1240, 200], [1320, 200], [1360, 200],
  // y=160 — punctuation
  [1280, 160], [1400, 160],
  // Single accent higher up
  [1360, 120],
];

export default function PixelFlicker({
  height,
  bgColor = 'transparent',
  style,
  fullHeight = false,
}) {
  const reduced = useReducedMotion();
  const [vw, vh] = PIXEL_VIEWBOX;
  // fullHeight: overlay covers entire carousel.
  // In both modes we use preserveAspectRatio="xMidYMax meet" so
  // squares stay SQUARE regardless of container width — the pattern
  // anchors to the bottom-centre and the viewBox width scales to fit,
  // but pixel proportions are preserved (never stretched).
  const svgStyle = fullHeight
    ? { width: '100%', height: '100%', display: 'block' }
    : { height: height || 200, width: '100%', display: 'block' };
  const containerStyle = fullHeight
    ? {
        background: bgColor,
        lineHeight: 0,
        position: 'absolute',
        inset: 0,
        ...(style || {}),
      }
    : { background: bgColor, lineHeight: 0, ...(style || {}) };

  return (
    <div style={containerStyle}>
      <svg
        className="pixel-flicker"
        viewBox={`0 0 ${vw} ${vh}`}
        preserveAspectRatio="xMidYMax meet"
        shapeRendering="crispEdges"
        fill="var(--accent)"
        style={svgStyle}
        aria-hidden="true"
      >
        {PIXEL_RECTS.map(([x, y], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width={PIXEL_SIZE}
            height={PIXEL_SIZE}
            style={
              reduced
                ? null
                : {
                    // Two interleaved delay streams for natural parallel
                    // blinks (not a single moving line). Fewer pixels
                    // means each blink is more prominent, so delays are
                    // spread wider across the 14s cycle.
                    animationDelay: `${
                      i % 2 === 0
                        ? (i * 389) % 14000
                        : (i * 647 + 4200) % 14000
                    }ms`,
                  }
            }
          />
        ))}
      </svg>
    </div>
  );
}

/* Backward-compat alias — old code referencing <PixelSkyline /> still
   works, but now renders as the flicker. The old drift is retired. */
export const PixelSkyline = PixelFlicker;
