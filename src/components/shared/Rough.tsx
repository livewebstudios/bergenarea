// The one wrapper for hand-drawn line work in the interface: underlines, the circle on
// today's tab, dotted paths, map strokes. Every shape goes through Ink (lib/rough.ts),
// which fixes the seed, so nothing twitches between server render, hydration and re-render.
import { Ink, type InkPath, type Pt } from '../../lib/rough';

export { Ink };
export type { InkPath, Pt };

const CLASS: Record<InkPath['c'], string> = { line: 'ink-line', fill: 'ink-fill', white: 'ink-white', hatch: 'ink-hatch', wline: 'ink-wline' };

/** Render Ink paths as SVG elements. Colors come from CSS classes, never from attributes. */
export function InkPaths({ paths, className = '' }: { paths: InkPath[]; className?: string }) {
  return (
    <>
      {paths.map((p, i) => (
        <path
          key={i}
          className={`${CLASS[p.c]} ${className}`.trim()}
          d={p.d}
          strokeWidth={p.c === 'fill' || p.c === 'white' ? undefined : p.w}
          strokeDasharray={p.dash}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </>
  );
}

interface SketchProps { className?: string; seed?: number }

/** A pen underline. Stretches to the width of whatever it sits under. */
export function Underline({ className = '', seed = 5 }: SketchProps) {
  const ink = new Ink(seed, 2.4, 1.2, 2);
  ink.curve([[2, 7], [60, 4.500], [130, 8], [198, 5]]);
  return (
    <svg className={`rough rough-underline ${className}`.trim()} viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <InkPaths paths={ink.paths} />
    </svg>
  );
}

/** A hand-drawn loop, as if someone circled a word with a pen. */
export function Circled({ className = '', seed = 9 }: SketchProps) {
  const ink = new Ink(seed, 2.200, 1.300, 2);
  ink.path('M96 8C150 2 192 12 194 30C196 50 150 57 98 57C46 58 6 50 6 31C5 12 44 5 104 6');
  return (
    <svg className={`rough rough-circled ${className}`.trim()} viewBox="0 0 200 62" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <InkPaths paths={ink.paths} />
    </svg>
  );
}

/** A hand-dotted path through points (reference C). Coordinates are the SVG's own viewBox units. */
export function Dotted({ points, viewBox, className = '', seed = 3, preserve = 'none' }: SketchProps & { points: Pt[]; viewBox: string; preserve?: string }) {
  const ink = new Ink(seed, 3, 0.800, 2);
  ink.dots(points);
  return (
    <svg className={`rough rough-dotted ${className}`.trim()} viewBox={viewBox} preserveAspectRatio={preserve} aria-hidden="true" focusable="false">
      <InkPaths paths={ink.paths} />
    </svg>
  );
}
