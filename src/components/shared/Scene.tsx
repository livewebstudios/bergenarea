// Scene: every picture on the site is built from three layers.
//   1. Wash  flat pastel shapes, always coded, recolored per demo through --scene-* tokens.
//   2. Ink   a black line drawing on white, laid over the wash with mix-blend-mode: multiply.
//            Source is an approved render from docs/renders/ when there is one, else the coded fallback.
//   3. Pin   one small hand-drawn map pin in rust. It never animates on its own.
import manifest from '../../data/ink-manifest.json';
import { SLOTS, type Slot } from '../../lib/ink/slots';
import { WASH } from '../../lib/ink/wash';
import { href } from '../../lib/href';

interface Props {
  slot: Slot;
  className?: string;
  /** false hides the pin. A tuple moves it: [x, y, scale] in the slot's own drawing units. */
  pin?: boolean | readonly [number, number, number];
  /** load at once (above the fold) instead of lazily */
  eager?: boolean;
  /** which side of the picture survives when the frame is narrower than the picture */
  anchor?: 'left' | 'center' | 'right';
}

/** The pin: a map pin with a slightly uneven outline. Tip sits at 0,0. */
export function PinShape() {
  return (
    <>
      <path className="ink-hatch" strokeWidth="2" d="M-22 5c14 4 30 4 45 0M-13 11c9 2 18 2 27 0" />
      <path className="pin-body" strokeWidth="4.500" d="M0.5 0C-9 -33 -41 -51 -40 -86A40 41 0 0 1 41 -85C40 -52 11 -35 0.500 0Z" />
      <path className="pin-hole" strokeWidth="3.500" d="M-15 -86a15 15.500 0 1 0 30.500 1a15 15.500 0 1 0 -30.500 -1Z" />
    </>
  );
}

export function Scene({ slot, className = '', pin = true, eager = false, anchor = 'center' }: Props) {
  const s = SLOTS[slot];
  const file = (manifest as Record<string, { source: string; file: string }>)[slot].file;
  const [px, py, ps] = Array.isArray(pin) ? pin : s.pin;
  const box = `0 0 ${s.w} ${s.h}`;
  return (
    <span className={`scene scene--${s.shape} scene--${slot} scene--${anchor} ${className}`.trim()}>
      <span className="scene__stage">
        <svg className="scene__wash" viewBox={box} aria-hidden="true" focusable="false">
          {WASH[slot].map((shape, i) =>
            shape.circle ? (
              <circle key={i} className={`wash-${shape.c}`} cx={shape.circle[0]} cy={shape.circle[1]} r={shape.circle[2]} />
            ) : (
              <path key={i} className={`wash-${shape.c}`} d={shape.d} />
            ),
          )}
        </svg>
        <img className="scene__ink" src={href(`ink/${file}`)} alt="" width={s.w} height={s.h} loading={eager ? 'eager' : 'lazy'} decoding="async" />
        {pin !== false && (
          <svg className="scene__pin" viewBox={box} aria-hidden="true" focusable="false">
            <g data-pin={slot} transform={`translate(${px} ${py}) scale(${ps})`}>
              <PinShape />
            </g>
          </svg>
        )}
      </span>
    </span>
  );
}

export default Scene;
