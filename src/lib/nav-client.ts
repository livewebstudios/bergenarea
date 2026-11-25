// Shared header behavior for all three demos (logic only, each demo owns its markup).
// [data-nav-toggle] opens the mobile menu. [data-sub-toggle] opens a sub-menu.
// Escape and a click outside close whatever is open.
export function initNav(root: ParentNode = document) {
  const header = root.querySelector<HTMLElement>('[data-nav]');
  if (!header) return;
  const menuBtn = header.querySelector<HTMLButtonElement>('[data-nav-toggle]');
  const subs = [...header.querySelectorAll<HTMLButtonElement>('[data-sub-toggle]')];

  const closeSubs = (except?: HTMLButtonElement) => subs.forEach((b) => { if (b !== except) b.setAttribute('aria-expanded', 'false'); });
  const setMenu = (open: boolean) => {
    menuBtn?.setAttribute('aria-expanded', String(open));
    header.toggleAttribute('data-open', open);
    if (!open) closeSubs();
  };

  menuBtn?.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  subs.forEach((btn) => btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    closeSubs(btn);
    btn.setAttribute('aria-expanded', String(open));
  }));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openSub = subs.find((b) => b.getAttribute('aria-expanded') === 'true');
    if (openSub) { closeSubs(); openSub.focus(); return; }
    if (menuBtn?.getAttribute('aria-expanded') === 'true') { setMenu(false); menuBtn.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target as Node)) { closeSubs(); setMenu(false); }
  });
  header.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => a.addEventListener('click', () => setMenu(false)));
}
