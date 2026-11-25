// Demo 2: the board. The Next Meeting tile is alive: it counts down, changes to
// "Happening now" when the meeting starts, and turns over once when the next one becomes
// the answer. That flip is the only motion on the page. Presentation only.
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Meeting } from '../../lib/bmlt';
import { announce, dayLabel, dayName, dayShort, placeLine, startLine, telHref, useFinder, venueLabel } from '../../lib/finder';
import { formatClock } from '../../lib/time';
import { deck, ui } from '../../content/deck';
import { Dialog } from '../shared/Dialog';
import { Scene } from '../shared/Scene';
import { Icon } from '../shared/icons/Icon';

interface Props { meetings: Meeting[]; buildNow: number }

export default function Board2({ meetings, buildNow }: Props) {
  const f = useFinder(meetings, buildNow);
  const detailId = useId();
  const nextId = useId();
  const townId = useId();

  // The answer: a meeting that is on right now (the one that started most recently), else the next one up.
  const answer = useMemo(() => {
    if (f.nowList.length) {
      const m = [...f.nowList].sort((a, b) => b.start - a.start)[0];
      return { meeting: m, happening: true, upcoming: null as (typeof f.nextList)[number] | null };
    }
    const u = f.nextList[0] ?? null;
    return u ? { meeting: u.meeting, happening: false, upcoming: u } : null;
  }, [f.nowList, f.nextList]);

  // What the tile is showing. It lags the answer by one flip.
  const [shownId, setShownId] = useState(answer?.meeting.id ?? '');
  const face = useRef<HTMLDivElement>(null);
  const mountedAt = useRef(0);
  useEffect(() => { mountedAt.current = Date.now(); }, []);
  useEffect(() => {
    const id = answer?.meeting.id ?? '';
    if (id === shownId) return;
    const el = face.current;
    const settled = mountedAt.current && Date.now() - mountedAt.current > 2500; // never animate before the list is readable
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!el || !settled || reduce || !el.animate) { setShownId(id); return; }
    let cancelled = false;
    const out = el.animate(
      [{ transform: 'perspective(1100px) rotateX(0deg)' }, { transform: 'perspective(1100px) rotateX(90deg)' }],
      { duration: 200, easing: 'ease-in', fill: 'forwards' },
    );
    out.finished.then(() => {
      if (cancelled) return;
      setShownId(id);
      out.cancel();
      el.animate(
        [{ transform: 'perspective(1100px) rotateX(-90deg)' }, { transform: 'perspective(1100px) rotateX(0deg)' }],
        { duration: 200, easing: 'ease-out' },
      );
    }).catch(() => setShownId(id));
    return () => { cancelled = true; };
  }, [answer?.meeting.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = answer && answer.meeting.id === shownId ? answer : (() => {
    const m = f.meetings.find((x) => x.id === shownId);
    return m ? { meeting: m, happening: false, upcoming: null } : answer;
  })();
  const m = shown?.meeting ?? null;
  const label = shown?.happening ? ui.happeningNow : ui.nextMeeting;
  const dayWord = m && shown && !shown.happening && shown.upcoming && shown.upcoming.daysAhead > 0 ? dayLabel(m.day, f.todayIdx) : '';
  const d = f.detail;
  // Demo 2 orders the tabs from today: Today, Tomorrow, then the days that follow.
  const tabs = [0, 1, 2, 3, 4, 5, 6].map((i) => (f.todayIdx + i) % 7);

  return (
    <>
      <div className="d2-board__grid">
        <section className="d2-next" aria-labelledby={nextId}>
          <div className="d2-tile d2-next__face" ref={face}>
            <h2 id={nextId} className="d2-next__label"><span className={`d2-next__dot${shown?.happening ? ' is-on' : ''}`} aria-hidden="true" />{label}</h2>
            {m ? (
              <>
                <p className="d2-mono d2-next__time" aria-live="off">{formatClock(m.start)}{dayWord && <span className="d2-next__day">{dayWord}</span>}</p>
                <p className="d2-display d2-next__name">{m.name}</p>
                <p className="d2-next__place">{placeLine(m)}{m.venue !== 'virtual' && m.town ? `, ${m.town}` : ''}</p>
                <p className="d2-mono d2-next__count" aria-live="off">
                  {shown?.happening ? m.timeLabel : startLine(shown?.upcoming ?? null, false)}
                </p>
                <div className="d2-next__actions">
                  {m.venue === 'virtual' && m.virtualLink
                    ? <a className="d2-btn" href={m.virtualLink} target="_blank" rel="noopener noreferrer">{ui.joinZoom}<Icon name="arrow" /></a>
                    : m.mapUrl
                      ? <a className="d2-btn" href={m.mapUrl} target="_blank" rel="noopener noreferrer">{ui.directions}<Icon name="arrow" /></a>
                      : null}
                  <button type="button" className="d2-btn d2-btn--alt" onClick={() => f.setDetail(m)} aria-haspopup="dialog">{ui.meetingDetails}</button>
                </div>
              </>
            ) : (
              <p className="d2-next__place">{ui.noMeetings}</p>
            )}
            <div className="d2-next__art"><Scene slot="chairs" pin={[965, 800, 1]} eager /></div>
          </div>
          <p className="sr-only" aria-live="polite">{m ? `${label}: ${m.name}, ${m.timeLabel}` : ''}</p>
        </section>

        <section className="d2-today" aria-labelledby={`${townId}-h`}>
          <h2 id={`${townId}-h`} className="d2-display d2-today__title">{dayLabel(f.day, f.todayIdx, f.live)}</h2>
          <div className="d2-days" role="group" aria-label={dayName(f.day)}>
            {tabs.map((i) => (
              <button key={i} type="button" className="d2-day" aria-pressed={f.day === i} onClick={() => f.setDay(i)}>
                {f.live && (i === f.todayIdx || i === (f.todayIdx + 1) % 7)
                  ? dayLabel(i, f.todayIdx)
                  : <><span aria-hidden="true">{dayShort(i)}</span><span className="sr-only">{dayName(i)}</span></>}
              </button>
            ))}
          </div>
          <div className="d2-seg" role="group" aria-label={`${ui.inPerson} / ${ui.virtual}`}>
            <button type="button" aria-pressed={f.venue === 'in-person'} onClick={() => f.toggleVenue('in-person')}><Icon name="chair" />{ui.inPerson}</button>
            <button type="button" aria-pressed={f.venue === 'virtual'} onClick={() => f.toggleVenue('virtual')}><Icon name="phone" />{ui.virtual}</button>
          </div>
          <div className="d2-town">
            <Icon name="pin" />
            <select id={townId} aria-label={ui.allTowns} value={f.town} onChange={(e) => f.setTown(e.target.value)}>
              <option value="">{ui.allTowns}</option>
              {f.townList.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <p className="sr-only" aria-live="polite">{announce(f.list.length, f.day, f.todayIdx, f.venue, f.town)}</p>
          {f.list.length === 0 ? (
            <p className="d2-none">{ui.noMeetings}</p>
          ) : (
            <ul className="d2-stack">
              {f.list.map((x) => {
                const st = f.status(x);
                return (
                  <li key={x.id}>
                    <button type="button" className={`d2-card${st ? ` d2-card--${st}` : ''}`} onClick={() => f.setDetail(x)} aria-haspopup="dialog">
                      <span className="d2-card__chip"><Icon name={x.venue === 'virtual' ? 'phone' : 'chair'} /></span>
                      <span className="d2-mono d2-card__time">{formatClock(x.start)}</span>
                      <span className="d2-card__main">
                        <span className="d2-card__name">{x.name}</span>
                        <span className="d2-card__town">{x.venue === 'virtual' ? ui.virtual : x.town || x.locationName}</span>
                      </span>
                      {st && <span className="d2-card__flag">{st === 'now' ? ui.happeningNow : ui.nextMeeting}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
      <p className="d2-count" data-deck="count">{deck.meetings.countSentence(f.counts.groups, f.counts.meetings)}</p>

      <Dialog open={!!d} onClose={() => f.setDetail(null)} labelledBy={detailId} className="d2-detail d2-tile" backdropClassName="d2-detail-backdrop">
        {d && (
          <>
            <button type="button" className="d2-btn d2-btn--alt d2-close" onClick={() => f.setDetail(null)}><Icon name="close" />{ui.close}</button>
            <p className="d2-kicker">{ui.meetingDetails}</p>
            <h2 id={detailId} className="d2-display d2-detail__name">{d.name}</h2>
            <p className="d2-mono d2-detail__when">{dayName(d.day)} {d.timeLabel}</p>
            <ul className="d2-detail__facts">
              <li><span className="d2-card__chip"><Icon name={d.venue === 'virtual' ? 'phone' : 'chair'} /></span><span><strong>{venueLabel(d)}</strong>
                {d.venue !== 'virtual' && d.locationName && <><br />{d.locationName}</>}
                {d.venue !== 'virtual' && d.address && <><br />{d.address}</>}
                {d.locationInfo && <><br />{d.locationInfo}</>}
                {d.comments && <><br />{d.comments}</>}
                {d.virtualInfo && <><br />{d.virtualInfo}</>}
                {d.wheelchair && <><br /><strong>{ui.wheelchair}</strong></>}
              </span></li>
            </ul>
            {d.formats.length > 0 && (
              <>
                <h3 className="d2-kicker">{ui.formats}</h3>
                <ul className="d2-detail__formats">{d.formats.map((x) => <li key={x.code}>{x.name}</li>)}</ul>
              </>
            )}
            <div className="d2-detail__actions">
              {d.mapUrl && <a className="d2-btn" href={d.mapUrl} target="_blank" rel="noopener noreferrer">{ui.directions}<Icon name="arrow" /></a>}
              {d.virtualLink && <a className="d2-btn" href={d.virtualLink} target="_blank" rel="noopener noreferrer">{ui.joinZoom}<Icon name="arrow" /></a>}
              {d.phone && <a className="d2-btn d2-btn--alt" href={telHref(d.phone)}><Icon name="phone" />{ui.callIn} {d.phone}</a>}
            </div>
          </>
        )}
      </Dialog>
    </>
  );
}
