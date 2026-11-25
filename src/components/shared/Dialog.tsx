// A real modal dialog. role="dialog", aria-modal, labelled by its title, focus moves in and
// is trapped, Escape, the backdrop and a visible Close button all close it, focus returns to
// where it was, and the page behind does not scroll. Skins are plain class names.
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  className?: string;
  backdropClassName?: string;
  children: ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

export function Dialog({ open, onClose, labelledBy, className = '', backdropClassName = '', children }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement | null;
    document.documentElement.classList.add('dialog-open');
    const node = panel.current;
    // Focus lands on the dialog itself, so a screen reader starts with its title.
    const first = node?.querySelector<HTMLElement>('[data-autofocus]') ?? node;
    first?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !node) return;
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!items.length) { e.preventDefault(); node.focus(); return; }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === firstEl || active === node)) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && active === lastEl) { e.preventDefault(); firstEl.focus(); }
      else if (!node.contains(active)) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.documentElement.classList.remove('dialog-open');
      const back = returnTo.current;
      if (back && document.contains(back)) back.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;
  // Rendered at the end of <body>, so no section's stacking context can trap it under the sticky nav.
  return createPortal(
    <div
      className={`dialog-backdrop ${backdropClassName}`.trim()}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1} className={`dialog ${className}`.trim()}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default Dialog;
