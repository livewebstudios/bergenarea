// The full meeting finder on /meetings/. Same engine as the home finder (useFinder), plus
// views by town and on a map, a format filter and text search.
// Leaflet and its tiles load only when the map view is opened.
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Meeting } from '../../lib/bmlt';
import { dayLabel, dayName, dayShort, placeLine, telHref, townNJ, useFinder, venueLabel } from '../../lib/finder';
import { isInPerson, isVirtual } from '../../lib/bmlt';
import { deck, ui } from '../../content/deck';
import { meetingsPage } from '../../content/pages';
import { Dialog } from '../shared/Dialog';
import { Circled } from '../shared/Rough';
import { Icon } from '../shared/icons/Icon';

type View = 'day' | 'town' | 'map';

interface Props {
  meetings: Meeting[];
  buildNow: number;
  /** resolved page addresses, so the island never needs the base path */
  links: { contact: string; printable: string; seventh: string };
}

const lower = (s: string) => s.toLocaleLowerCase('en-US');

export default function MeetingFinder({ meetings, buildNow, links }: Props) {
  const f = useFinder(meetings, buildNow);
  const [view, setView] = useState<View>('day');
  const [format, setFormat] = useState('');
  const [query, setQuery] = useState('');
  const titleId = useId();
  const searchId = useId();
  const formatId = useId();
  const townId = useId();
  const d = f.detail;

  // the shareable ?id= address, after hydration
  const openedFromUrl = useRef(false);
  useEffect(() => {
    if (openedFromUrl.current) return;
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) { openedFromUrl.current = true; return; }
    const m = f.meetings.find((x) => x.id === id);
    if (m) { openedFromUrl.current = true; f.setDetail(m); f.setDay(m.day); }
  }, [f.meetings]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!openedFromUrl.current) return;
    const url = new URL(window.location.href);
    if (d) url.searchParams.set('id', d.id); else url.searchParams.delete('id');
    window.history.replaceState(null, '', url);
  }, [d]);

  const formats = useMemo(() => {
    const seen = new Map<string, string>();
    for (const m of f.meetings) for (const x of m.formats) if (!seen.has(x.code)) seen.set(x.code, x.name);
    return [...seen].map(([code, name]) => ({ code, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [f.meetings]);

  const matches = useCallback((m: Meeting) => {
    if (f.venue === 'in-person' && !isInPerson(m)) return false;
    if (f.venue === 'virtual' && !isVirtual(m)) return false;
    if (f.town && m.town !== f.town) return false;
    if (format && !m.formats.some((x) => x.code === format)) return false;
    const q = lower(query.trim());
    if (q && !lower(`${m.name} ${m.locationName} ${m.address} ${m.town}`).includes(q)) return false;
    return true;
  }, [f.venue, f.town, format, query]);

  const week = useMemo(() => f.meetings.filter(matches), [f.meetings, matches]);
  const dayList = useMemo(() => week.filter((m) => m.day === f.day), [week, f.day]);
  const byTown = useMemo(() => {
    const groups = new Map<string, Meeting[]>();
    for (const m of week) {
      const key = m.venue === 'virtual' || !m.town ? ui.virtual : townNJ(m.town);
      groups.set(key, [...(groups.get(key) ?? []), m]);
    }
    return [...groups].sort(([a], [b]) => (a === ui.virtual ? 1 : b === ui.virtual ? -1 : a.localeCompare(b)));
  }, [week]);
  const shownCount = view === 'day' ? dayList.length : week.length;
  const viewName = { day: dayLabel(f.day, f.todayIdx, f.live), town: ui.byTown, map: ui.map }[view];

  const row = (m: Meeting, opts: { withDay?: boolean } = {}) => {
    const st = f.status(m);
    return (
      <li key={m.id}>
        <button type="button" className={`d1-row mf-row${st ? ` d1-row--${st}` : ''}`} onClick={() => f.setDetail(m)} aria-haspopup="dialog">
          <span className="d1-row__time d1-display">
            {opts.withDay && <span className="mf-row__day">{dayName(m.day)}</span>}
            {m.timeLabel}
          </span>
          <span className="d1-row__main">
            {st && <span className="d1-row__flag">{st === 'now' ? ui.happeningNow : ui.nextMeeting}</span>}
            <span className="d1-row__name">{m.name}</span>
            {m.wheelchair && <span className="mf-wc" title={ui.wheelchair}><span aria-hidden="true">WC</span><span className="sr-only">{ui.wheelchair}</span></span>}
          </span>
          <span className="d1-row__place">{placeLine(m)}</span>
          <span className="d1-row__town">{m.venue === 'virtual' ? '' : townNJ(m.town)}</span>
          <Icon name="arrow" className="d1-row__go" />
        </button>
      </li>
    );
  };

  const rows = (list: Meeting[], withDay: boolean) =>
    list.length === 0 ? <p className="d1-none">{ui.noMeetings}</p> : <ul className="d1-rows">{list.map((m) => row(m, { withDay }))}</ul>;

  const views: { key: View; label: string; icon: 'calendar' | 'pin' | 'door' }[] = [
    { key: 'day', label: ui.byDay, icon: 'calendar' },
    { key: 'town', label: ui.byTown, icon: 'door' },
    { key: 'map', label: ui.map, icon: 'pin' },
  ];

  return (
    <>
      <div className="d1-finder mf">
        <div className="mf-views" role="group" aria-label={ui.menu}>
          {views.map((v) => (
            <button key={v.key} type="button" className="d1-chip mf-view" aria-pressed={view === v.key} onClick={() => setView(v.key)}>
              <Icon name={v.icon} />{v.label}
            </button>
          ))}
        </div>

        <div className="d1-filters mf-filters">
          <div className="mf-search">
            <label htmlFor={searchId} className="sr-only">{ui.search}</label>
            <input id={searchId} type="search" placeholder={ui.search} value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
          </div>
          <div className="d1-venue" role="group" aria-label={`${ui.inPerson} / ${ui.virtual}`}>
            <button type="button" className="d1-chip" aria-pressed={f.venue === 'in-person'} onClick={() => f.toggleVenue('in-person')}><Icon name="chair" />{ui.inPerson}</button>
            <button type="button" className="d1-chip" aria-pressed={f.venue === 'virtual'} onClick={() => f.toggleVenue('virtual')}><Icon name="phone" />{ui.virtual}</button>
          </div>
          <div className="d1-town">
            <Icon name="pin" />
            <label htmlFor={townId} className="sr-only">{ui.allTowns}</label>
            <select id={townId} value={f.town} onChange={(e) => f.setTown(e.target.value)}>
              <option value="">{ui.allTowns}</option>
              {f.townList.map((t) => <option key={t} value={t}>{townNJ(t)}</option>)}
            </select>
          </div>
          <div className="d1-town">
            <Icon name="clipboard" />
            <label htmlFor={formatId} className="sr-only">{ui.formats}</label>
            <select id={formatId} value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="">{ui.allFormats}</option>
              {formats.map((x) => <option key={x.code} value={x.code}>{x.name}</option>)}
            </select>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">{`${viewName}: ${shownCount === 0 ? ui.noMeetings : `${shownCount} ${shownCount === 1 ? 'meeting' : 'meetings'}`}`}</p>

        {view === 'day' && (
          <>
            <div className="d1-finder__head mf-head">
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
            {rows(dayList, false)}
          </>
        )}

        {view === 'town' && (
          byTown.length === 0 ? <p className="d1-none">{ui.noMeetings}</p> : (
            <div className="mf-groups">
              {byTown.map(([town, list]) => (
                <section key={town} className="mf-group">
                  <h2 className="d1-display mf-group__title">{town}</h2>
                  <ul className="d1-rows">{list.map((m) => row(m, { withDay: true }))}</ul>
                </section>
              ))}
            </div>
          )
        )}

        {view === 'map' && <MeetingMap meetings={week} onPick={(m) => f.setDetail(m)} />}

      </div>

      <p className="d1-count" data-deck="count">{deck.meetings.countSentence(f.counts.groups, f.counts.meetings)}</p>
      <ul className="mf-after">
        <li><a className="d1-btn d1-btn--white" href={links.printable}>{meetingsPage.printed}<Icon name="arrow" /></a></li>
        <li><a className="d1-btn" href={links.seventh}><strong>{meetingsPage.seventh}</strong><Icon name="arrow" /></a></li>
      </ul>

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
            <p className="mf-report">
              <a className="tap-link" href={`${links.contact}?topic=meeting&meeting=${encodeURIComponent(`${d.name}, ${dayName(d.day)} ${d.timeLabel}`)}#form`}>{ui.reportUpdate}</a>
            </p>
            <button type="button" className="d1-detail__close" onClick={() => f.setDetail(null)}><Icon name="close" /><span>{ui.close}</span></button>
          </>
        )}
      </Dialog>
    </>
  );
}

// The rust map pin from the drawings, as a marker. Tip at the bottom center.
const PIN_SVG = `<svg viewBox="-46 -130 92 145" width="30" height="47" aria-hidden="true" focusable="false"><path fill="none" stroke="#1C1A17" stroke-width="2" stroke-linecap="round" d="M-22 5c14 4 30 4 45 0M-13 11c9 2 18 2 27 0"/><path fill="#A8492A" stroke="#1C1A17" stroke-width="4.5" stroke-linejoin="round" d="M0.5 0C-9 -33 -41 -51 -40 -86A40 41 0 0 1 41 -85C40 -52 11 -35 0.5 0Z"/><path fill="#FFFAF5" stroke="#1C1A17" stroke-width="3.5" d="M-15 -86a15 15.5 0 1 0 30.5 1a15 15.5 0 1 0 -30.5 -1Z"/></svg>`;

function MeetingMap({ meetings, onPick }: { meetings: Meeting[]; onPick: (m: Meeting) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const layerRef = useRef<import('leaflet').LayerGroup | null>(null);
  const libRef = useRef<typeof import('leaflet') | null>(null);
  const [ready, setReady] = useState(false);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;
    Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]).then(([mod]) => {
      if (cancelled || !box.current) return;
      const L = (mod as unknown as { default?: typeof import('leaflet') }).default ?? (mod as typeof import('leaflet'));
      libRef.current = L;
      const map = L.map(box.current, { scrollWheelZoom: false }).setView([40.95, -74.07], 11);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setReady(true);
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = libRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !map || !layer) return;
    layer.clearLayers();
    // One pin per place. A place with several meetings opens a short list.
    const places = new Map<string, Meeting[]>();
    for (const m of meetings) {
      if (m.venue === 'virtual' || m.lat === null || m.lng === null) continue;
      const key = `${m.lat.toFixed(5)},${m.lng.toFixed(5)}`;
      places.set(key, [...(places.get(key) ?? []), m]);
    }
    const icon = L.divIcon({ className: 'mf-pin', html: PIN_SVG, iconSize: [30, 47], iconAnchor: [15, 42], popupAnchor: [0, -40] });
    const points: [number, number][] = [];
    for (const list of places.values()) {
      const first = list[0];
      const at: [number, number] = [first.lat as number, first.lng as number];
      points.push(at);
      const label = list.length === 1 ? `${first.name}, ${dayName(first.day)} ${first.timeLabel}` : `${first.locationName || first.address} (${list.length})`;
      const marker = L.marker(at, { icon, title: label, alt: label, keyboard: true }).addTo(layer);
      if (list.length === 1) {
        marker.on('click', () => pickRef.current(first));
      } else {
        const wrap = document.createElement('div');
        wrap.className = 'mf-popup';
        const place = document.createElement('p');
        place.className = 'mf-popup__place';
        place.textContent = first.locationName || first.address;
        wrap.append(place);
        for (const m of list) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'mf-popup__item';
          b.textContent = `${dayName(m.day)} ${m.timeLabel}: ${m.name}`;
          b.addEventListener('click', () => { map.closePopup(); pickRef.current(m); });
          wrap.append(b);
        }
        marker.bindPopup(wrap);
      }
    }
    if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
  }, [ready, meetings]);

  return <div ref={box} className="mf-map" role="region" aria-label={ui.map} />;
}
