// Past events drop off in the browser without a rebuild.
// Markup contract: a container [data-upcoming] with an optional data-limit (default 2),
// items [data-expires="YYYY-MM-DDTHH:mm"] in soonest-first order, and one [data-empty] element.
import { nyWall } from './time';

export function pruneUpcoming(root: ParentNode = document, now = new Date()) {
  const wall = nyWall(now);
  root.querySelectorAll<HTMLElement>('[data-upcoming]').forEach((box) => {
    const limit = Number(box.dataset.limit || 2);
    let shown = 0;
    box.querySelectorAll<HTMLElement>('[data-expires]').forEach((item) => {
      const live = (item.dataset.expires ?? '') >= wall;
      const show = live && shown < limit;
      item.hidden = !show;
      if (show) shown++;
    });
    const empty = box.querySelector<HTMLElement>('[data-empty]');
    if (empty) empty.hidden = shown > 0;
    box.dataset.count = String(shown);
  });
}

export function watchUpcoming() {
  pruneUpcoming();
  window.setInterval(() => pruneUpcoming(), 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pruneUpcoming(); });
}
