// Demo 1 signature move: one hand-dotted line that starts at the pin in the hero, wanders
// down the page between the bands and ends on the road in the closing picture.
// Each stretch draws itself once as its section comes into view (about 700ms).
// It is a line being drawn, not a thing that moves the page.
//
// How it stays out of the way: every section holds its own stretch, painted after the
// section's ground and before its content. A stretch runs down one side gutter and only
// crosses the page inside the empty padding at the top and bottom of its section.
// Narrow screens use the CSS-only straight line down the left edge instead.
import { Ink, type Pt } from '../../lib/rough';

const NS = 'http://www.w3.org/2000/svg';
const MIN_GUTTER = 58;

export function initPath() {
  const root = document.querySelector<HTMLElement>('[data-path-root]');
  if (!root) return;
  const stops = [...root.querySelectorAll<HTMLElement>('[data-path-stop]')];
  document.documentElement.classList.add('js-path');

  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-seen'); io.unobserve(e.target); } }),
    { rootMargin: '0px 0px -15% 0px', threshold: 0.04 },
  );
  stops.forEach((s) => io.observe(s));

  const pinIn = (el: HTMLElement, box: DOMRect): Pt | null => {
    const pin = el.querySelector('[data-pin]');
    if (!pin) return null;
    const r = pin.getBoundingClientRect();
    return [r.left - box.left + r.width / 2, r.bottom - box.top - 4];
  };

  let lastWidth = -1;
  const build = () => {
    const width = root.clientWidth;
    if (width === lastWidth) return;
    lastWidth = width;
    const wrap = root.querySelector<HTMLElement>('.wrap');
    const gutter = wrap ? wrap.getBoundingClientRect().left - root.getBoundingClientRect().left : 0;
    const wide = gutter >= MIN_GUTTER;
    root.toggleAttribute('data-path-wide', wide);

    const L = gutter * 0.5;
    const R = width - gutter * 0.5;
    const mid = width / 2;
    let side = L;
    let enterX = mid;

    stops.forEach((el, i) => {
      const svg = el.querySelector<SVGSVGElement>(':scope > [data-path-svg]');
      if (!svg) return;
      svg.replaceChildren();
      if (!wide) return;
      const box = el.getBoundingClientRect();
      const w = box.width;
      const h = box.height;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      const pad = Math.min(104, h * 0.2);
      let pts: Pt[];
      if (i === 0) {
        // leave the pin and walk off the bottom of the hero picture
        const pin = pinIn(el, box);
        if (!pin) return;
        enterX = pin[0] - 64;
        pts = [pin, [pin[0] - 16, pin[1] + (h - pin[1]) * 0.45], [enterX, h]];
      } else if (i === stops.length - 1) {
        // come down through the sky and land on the road
        const pin = pinIn(el, box);
        if (!pin) return;
        pts = [[mid, 0], [mid - 48, pin[1] * 0.2], [mid + 36, pin[1] * 0.5], [pin[0] + 12, pin[1] - 70], [pin[0], pin[1] - 8]];
      } else if (i === 1) {
        side = L;
        pts = [[enterX, 0], [L + 46, pad * 0.62], [L, pad + 70], [L - 4, h * 0.55], [L, h - pad - 20], [L + w * 0.2, h - pad * 0.36], [mid, h]];
      } else {
        side = side === L ? R : L;
        const dir = side === R ? 1 : -1;
        pts = [[mid, 0], [side - dir * w * 0.2, pad * 0.36], [side, pad + 20], [side + dir * 4, h * 0.5], [side, h - pad - 20], [side - dir * w * 0.2, h - pad * 0.36], [mid, h]];
      }
      const ink = new Ink(40 + i, 3, 0.9, 5);
      ink.curve(pts);
      const d = ink.paths[0].d;
      const mask = document.createElementNS(NS, 'mask');
      mask.id = `d1-path-mask-${i}`;
      mask.setAttribute('maskUnits', 'userSpaceOnUse');
      mask.setAttribute('x', '-40');
      mask.setAttribute('y', '-40');
      mask.setAttribute('width', String(w + 80));
      mask.setAttribute('height', String(h + 80));
      const reveal = document.createElementNS(NS, 'path');
      reveal.setAttribute('d', d);
      reveal.setAttribute('pathLength', '1');
      reveal.setAttribute('class', 'd1-path__reveal');
      mask.append(reveal);
      const dots = document.createElementNS(NS, 'path');
      dots.setAttribute('d', d);
      dots.setAttribute('class', 'd1-path__dots');
      dots.setAttribute('mask', `url(#${mask.id})`);
      svg.append(mask, dots);
    });
  };

  let frame = 0;
  const schedule = (force = false) => {
    if (force) lastWidth = -1;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(build);
  };
  build();
  // Heights change when fonts, pictures and the finder list settle. Rebuild then.
  const ro = new ResizeObserver(() => schedule(true));
  stops.forEach((s) => ro.observe(s));
  window.addEventListener('load', () => schedule(true));
}
