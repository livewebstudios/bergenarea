// Demo 1 finder: today's list inside one wide white card. Presentation only.
import { useId } from 'react';
import type { Meeting } from '../../lib/bmlt';
import { announce, dayLabel, dayName, dayShort, placeLine, telHref, useFinder, venueLabel } from '../../lib/finder';
import { deck, ui } from '../../content/deck';
import { Dialog } from '../shared/Dialog';
import { Circled } from '../shared/Rough';
import { Icon } from '../shared/icons/Icon';

interface Props { meetings: Meeting[]; buildNow: number }

export default function Finder1({ meetings, buildNow }: Props) {
  const f = useFinder(meetings, buildNow);
  const titleId = useId();
  const townId = useId();
  const d = f.detail;

  return (
    <>
      <div className="d1-finder">
        <div className="d1-finder__head">
          <h2 className="d1-display d1-finder__title">{dayLabel(f.day, f.todayIdx, f.live)}</h2>
          <div className="d1-days" role="group" aria-label={dayName(f.day)}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <button key={i} type="button" className="d1-day" aria-pressed={f.day === i} onClick={() => f.setDay(i)}>
                <span aria-hidden="true">{dayShort(i)}</span>
                <span className="sr-only">{f.live && i === f.todayIdx ? `${ui.today}, ${dayName(i)}` : dayName(i)}</span>
                {f.live && i === f.todayIdx && <Circled className="d1-day__circle" />}
              </button>
            ))}
          </div>
        </div>

        <div className="d1-filters">
          <div className="d1-venue" role="group" aria-label={`${ui.inPerson} / ${ui.virtual}`}>
            <button type="button" className="d1-chip" aria-pressed={f.venue === 'in-person'} onClick={() => f.toggleVenue('in-person')}>
              <Icon name="chair" />{ui.inPerson}
            </button>
            <button type="button" className="d1-chip" aria-pressed={f.venue === 'virtual'} onClick={() => f.toggleVenue('virtual')}>
              <Icon name="phone" />{ui.virtual}
            </button>
          </div>
          <div className="d1-town">
            <Icon name="pin" />
            <select id={townId} aria-label={ui.allTowns} value={f.town} onChange={(e) => f.setTown(e.target.value)}>
              <option value="">{ui.allTowns}</option>
              {f.townList.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">{announce(f.list.length, f.day, f.todayIdx, f.venue, f.town)}</p>

        {f.list.length === 0 ? (
          <p className="d1-none">{ui.noMeetings}</p>
        ) : (
          <ul className="d1-rows">
            {f.list.map((m) => {
              const st = f.status(m);
              return (
                <li key={m.id}>
                  <button type="button" className={`d1-row${st ? ` d1-row--${st}` : ''}`} onClick={() => f.setDetail(m)} aria-haspopup="dialog">
                    <span className="d1-row__time d1-display">{m.timeLabel}</span>
                    <span className="d1-row__main">
                      {st && <span className="d1-row__flag">{st === 'now' ? ui.happeningNow : ui.nextMeeting}</span>}
                      <span className="d1-row__name">{m.name}</span>
                    </span>
                    <span className="d1-row__place">{placeLine(m)}</span>
                    <span className="d1-row__town">{m.venue === 'virtual' ? '' : m.town}</span>
                    <Icon name="arrow" className="d1-row__go" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="d1-count" data-deck="count">{deck.meetings.countSentence(f.counts.groups, f.counts.meetings)}</p>

      <Dialog open={!!d} onClose={() => f.setDetail(null)} labelledBy={titleId} className="d1-detail" backdropClassName="d1-detail-backdrop">
        {d && (
          <>
            <p className="d1-detail__kicker">{ui.meetingDetails}</p>
            <h2 id={titleId} className="d1-display d1-detail__name">{d.name}</h2>
            <p className="d1-detail__when">{dayName(d.day)}<br /><span className="d1-display">{d.timeLabel}</span></p>
            <dl className="d1-detail__facts">
              <dt className="sr-only">{venueLabel(d)}</dt>
              <dd>
                <span className="d1-detail__venue">{venueLabel(d)}</span>
                {d.venue !== 'virtual' && d.locationName && <span className="d1-detail__place">{d.locationName}</span>}
                {d.venue !== 'virtual' && d.address && <span>{d.address}</span>}
                {d.locationInfo && <span>{d.locationInfo}</span>}
                {d.comments && <span>{d.comments}</span>}
                {d.virtualInfo && <span>{d.virtualInfo}</span>}
                {d.wheelchair && <span className="d1-detail__wc">{ui.wheelchair}</span>}
              </dd>
            </dl>
            {d.formats.length > 0 && (
              <>
                <h3 className="d1-detail__sub">{ui.formats}</h3>
                <ul className="d1-detail__formats">{d.formats.map((x) => <li key={x.code}>{x.name}</li>)}</ul>
              </>
            )}
            <div className="d1-detail__actions">
              {d.mapUrl && <a className="d1-btn" href={d.mapUrl} target="_blank" rel="noopener noreferrer">{ui.directions}<Icon name="arrow" /></a>}
              {d.virtualLink && <a className="d1-btn" href={d.virtualLink} target="_blank" rel="noopener noreferrer">{ui.joinZoom}<Icon name="arrow" /></a>}
              {d.phone && <a className="d1-btn d1-btn--quiet" href={telHref(d.phone)}><Icon name="phone" />{ui.callIn} {d.phone}</a>}
            </div>
            <button type="button" className="d1-detail__close" onClick={() => f.setDetail(null)}><Icon name="close" /><span>{ui.close}</span></button>
          </>
        )}
      </Dialog>
    </>
  );
}
