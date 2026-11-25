// The notice popup the webmaster controls (/admin/notice/).
// Reads content/notice.json. Shows only when enabled, today is inside start..end in New York,
// and scope matches. Opens 800ms after load so it never blocks first paint.
// "once" is remembered per id in localStorage. If storage is blocked it shows each visit.
import { useCallback, useEffect, useId, useState, type ReactNode } from 'react';
import { Dialog } from './Dialog';
import { noticeActive, type Notice } from '../../lib/upcoming';

export type { Notice };

const key = (id: string) => `ba-notice-${id}`;
function seen(id: string): boolean {
  try { return window.localStorage.getItem(key(id)) === '1'; } catch { return false; }
}
function remember(id: string) {
  try { window.localStorage.setItem(key(id), '1'); } catch { /* storage blocked: it will show next visit */ }
}

interface Props {
  notice: Notice;
  page?: 'home' | 'other';
  className?: string;
  backdropClassName?: string;
  children: (api: { titleId: string; close: () => void; notice: Notice }) => ReactNode;
}

export function NoticeCore({ notice, page = 'home', className, backdropClassName, children }: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    let timer: number | undefined;
    if (noticeActive(notice, new Date(), page) && !(notice.frequency === 'once' && seen(notice.id))) {
      timer = window.setTimeout(() => setOpen(true), 800);
    }
    return () => window.clearTimeout(timer);
  }, [notice, page]);

  const close = useCallback(() => {
    setOpen(false);
    if (notice.frequency === 'once') remember(notice.id);
  }, [notice]);

  return (
    <Dialog open={open} onClose={close} labelledBy={titleId} className={`notice notice--${notice.style} ${className ?? ''}`.trim()} backdropClassName={backdropClassName}>
      {children({ titleId, close, notice })}
    </Dialog>
  );
}

export default NoticeCore;
