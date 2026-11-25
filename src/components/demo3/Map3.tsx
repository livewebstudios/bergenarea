// Demo 3: a hand-drawn map of the county. Tap your town and see your meetings.
// The map is drawn from the data (lib/map.ts). The towns are real HTML buttons laid over
// the SVG, in A to Z tab order. Presentation only.
import { useEffect, useId, useMemo, useRef } from 'react';
import { isVirtual, type Meeting } from '../../lib/bmlt';
import { announce, dayLabel, dayName, dayShort, placeLine, telHref, useFinder, venueLabel } from '../../lib/finder';
import { buildMap, type MapModel } from '../../lib/map';
import { ui } from '../../content/deck';
import { Dialog } from '../shared/Dialog';
import { Ink, InkPaths } from '../shared/Rough';
import { PinShape } from '../shared/Scene';
import { Icon } from '../shared/icons/Icon';

interface Props { meetings: Meeting[]; buildNow: number; ring: [number, number][] }

const PINE = 'M12 2.800l-3.700 5.400 2-.200-3.600 5 2.300-.300-3.900 5.300h13.900l-3.900-5.400 2.300.400-3.600-5 2 .100zM12 18.200v3.400';
const HARDWOOD = 'M12 21.500v-7M12 17.200l-2.600-2.400M12.100 15.900l2.500-2.200M7.300 14.800c-2.400-.400-3.700-2.600-2.800-4.700-.800-2.400.900-4.600 3.200-4.500.900-2.300 3.800-3.100 5.600-1.500 2.100-.900 4.400.400 4.700 2.700 2 .900 2.600 3.500 1.200 5.200.300 2-1.500 3.500-3.400 3.100';

/** Every stroke on the map, built once per data set with a fixed seed. */
function drawMap(model: MapModel) {
  const outline = new Ink(81, 3, 0.7, 3);
  if (model.outline.length) outline.linear([...model.outline, model.outline[0]], { w: 3.2, dash: '0.1 12', rough: 0.6 });
  const river = new Ink(83, 3, 1, 4);
  if (model.river.length) {
    river.curve(model.river, { w: 3.4, rough: 1.1 });
    river.curve(model.river.map(([x, y]) => [x + 13, y + 6] as [number, number]), { w: 1.6, rough: 1.3 });
  }
  const north = new Ink(85, 2.4, 0.8, 2);
  const [nx, ny] = model.north;
  north.line(nx, ny, nx, ny - 62, { w: 2.6 });
  north.linear([[nx - 11, ny - 44], [nx, ny - 64], [nx + 11, ny - 44]], { w: 2.6 });
  const dots = model.towns.map((t, i) => {
    const ink = new Ink(100 + i, 2, 1.1, 2);
    ink.circle(t.x, t.y, t.r * 2, { fill: 'ink', w: 1.6 });
    return ink.paths;
  });
  return { outline: outline.paths, river: river.paths, north: north.paths, dots };
}

export default function Map3({ meetings, buildNow, ring }: Props) {
  const f = useFinder(meetings, buildNow);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const detailId = useId();
  const model = useMemo(() => buildMap(f.meetings, ring), [f.meetings, ring]);
  const art = useMemo(() => drawMap(model), [model]);

  // Positions are data, so they are written as a small stylesheet, never as inline styles.
  const css = useMemo(() => {
    const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(2)}%`;
    const cq = (units: number) => `${(units / (model.w / 100)).toFixed(3)}cqw`;
    const rules = model.towns.map((t) => `.d3-town--${t.slug}{left:${pct(t.x, model.w)};top:${pct(t.y, model.h)}}`);
    // Label spots come from the collision pass in lib/map.ts.
    for (const t of model.towns) {
      const { h, v, gx, gy } = t.spot;
      const x = h === 'e' ? `left:calc(50% + ${cq(gx)})` : h === 'w' ? `right:calc(50% + ${cq(gx)})` : 'left:50%';
      const y = v === 's' ? `top:calc(50% + ${cq(gy)})` : v === 'n' ? `bottom:calc(50% + ${cq(gy)})` : 'top:50%';
      rules.push(`.d3-town--${t.slug} .d3-town__label{${x};${y};translate:${h === 'c' ? '-50%' : '0'} ${v === 'c' ? '-50%' : '0'}}`);
    }
    rules.push(`.d3-map__river{left:${pct(model.riverLabel.x, model.w)};top:${pct(model.riverLabel.y, model.h)};rotate:${model.riverLabel.angle.toFixed(1)}deg}`);
    rules.push(`.d3-map__n{left:${pct(model.north[0], model.w)};top:${pct(model.north[1] - 92, model.h)}}`);
    // town dots land in a quick stagger, all done inside 1.2s
    model.towns.forEach((_, i) => rules.push(`.d3-dots>g:nth-child(${i + 1}){animation-delay:${300 + i * 34}ms}`));
    return rules.join('');
  }, [model]);

  const todayTowns = useMemo(
    () => new Set(f.live ? f.meetings.filter((m) => m.day === f.todayIdx && m.venue !== 'virtual' && m.town).map((m) => m.town) : []),
    [f.live, f.meetings, f.todayIdx],
  );
  const virtualCount = useMemo(() => f.meetings.filter(isVirtual).length, [f.meetings]);
  const selected = model.towns.find((t) => t.name === f.town) ?? null;
  const pick = (name: string) => f.setTown(f.town === name ? '' : name);

  // Keep the chip row in step with the map: slide the chosen chip into view (sideways only, never the page).
  const chips = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = chips.current;
    const chip = row?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!row || !chip || row.scrollWidth <= row.clientWidth) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  }, [f.town]);

  // With a town chosen the panel shows that town's whole week, starting from today.
  const weekDays = [0, 1, 2, 3, 4, 5, 6].map((i) => (f.todayIdx + i) % 7);
  const groups = f.town
    ? weekDays.map((day) => ({ day, items: f.week.filter((m) => m.day === day) })).filter((g) => g.items.length)
    : [{ day: f.day, items: f.list }];
  const total = groups.reduce((s, g) => s + g.items.length, 0);
  const d = f.detail;

  return (
    <div className="d3-finder">
      <div className="d3-mapcol">
        <div className="d3-sheet">
          <div className="d3-map">
            <style>{css}</style>
            <svg className="d3-map__ink" viewBox={`0 0 ${model.w} ${model.h}`} aria-hidden="true" focusable="false">
              <defs>
                <mask id={`${uid}-draw`} maskUnits="userSpaceOnUse" x="0" y="0" width={model.w} height={model.h}>
                  <rect className="d3-wipe" x="0" y="0" width={model.w} height={model.h} />
                </mask>
              </defs>
              <g mask={`url(#${uid}-draw)`}>
                <InkPaths paths={art.outline} className="d3-outline" />
                <InkPaths paths={art.river} />
                <InkPaths paths={art.north} />
              </g>
              {model.trees.map((t, i) => (
                <g key={i} className="d3-tree" transform={`translate(${(t.x - 20).toFixed(1)} ${(t.y - 22).toFixed(1)}) scale(1.7)`}>
                  <path className="ink-line" strokeWidth="1.1" d={t.kind === 'pine' ? PINE : HARDWOOD} />
                </g>
              ))}
              <g className="d3-dots">
                {model.towns.map((t, i) => (
                  <g key={t.slug} className="d3-dot">
                    <InkPaths paths={art.dots[i]} />
                  </g>
                ))}
              </g>
              {model.towns.filter((t) => todayTowns.has(t.name)).map((t) => (
                <g key={t.slug} transform={`translate(${t.x.toFixed(1)} ${(t.y - t.r + 3).toFixed(1)}) scale(0.4)`}>
                  <g className="d3-pin"><PinShape /></g>
                </g>
              ))}
              {selected && (
                <g key={selected.slug}>
                  <mask id={`${uid}-ring`} maskUnits="userSpaceOnUse" x="0" y="0" width={model.w} height={model.h}>
                    <circle className="d3-ring__reveal" cx={selected.x} cy={selected.y} r={selected.r + 11} pathLength={1} transform={`rotate(-90 ${selected.x} ${selected.y})`} />
                  </mask>
                  <circle className="d3-ring" cx={selected.x} cy={selected.y} r={selected.r + 11} mask={`url(#${uid}-ring)`} />
                </g>
              )}
            </svg>
            {model.towns.map((t) => (
              <button key={t.slug} type="button" className={`d3-town d3-town--${t.slug}`} aria-pressed={f.town === t.name} onClick={() => pick(t.name)}>
                <span className="d3-town__label">{t.name}</span>
              </button>
            ))}
            <span className="d3-map__river" aria-hidden="true">HUDSON RIVER</span>
            <span className="d3-map__n" aria-hidden="true">N</span>
          </div>
        </div>

        <div className="d3-chips" role="group" aria-label={ui.allTowns} ref={chips}>
          <button type="button" className="d3-chip" aria-pressed={!f.town} onClick={() => f.setTown('')}>{ui.allTowns}</button>
          {model.towns.map((t) => (
            <button key={t.slug} type="button" className="d3-chip" aria-pressed={f.town === t.name} onClick={() => pick(t.name)}>{t.name}</button>
          ))}
        </div>

        <button type="button" className="d3-virtual" aria-pressed={f.venue === 'virtual'} onClick={() => f.toggleVenue('virtual')}>
          <Icon name="phone" />
          <span className="d3-virtual__label">{ui.virtual}</span>
          <span className="d3-display d3-virtual__count">{virtualCount}</span>
        </button>
      </div>

      <section className="d3-panel" aria-labelledby={`${uid}-h`}>
        <div className="d3-panel__head">
          <h2 id={`${uid}-h`} className="d3-display d3-panel__title">{f.town || dayLabel(f.day, f.todayIdx, f.live)}</h2>
          {f.town && <button type="button" className="d3-reset" onClick={() => f.setTown('')}><Icon name="close" />{ui.allTowns}</button>}
        </div>
        {!f.town && (
          <div className="d3-days" role="group" aria-label={dayName(f.day)}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <button key={i} type="button" className={`d3-day${f.live && i === f.todayIdx ? ' is-today' : ''}`} aria-pressed={f.day === i} onClick={() => f.setDay(i)}>
                <span aria-hidden="true">{dayShort(i)}</span>
                <span className="sr-only">{f.live && i === f.todayIdx ? `${ui.today}, ${dayName(i)}` : dayName(i)}</span>
              </button>
            ))}
          </div>
        )}
        <div className="d3-venue" role="group" aria-label={`${ui.inPerson} / ${ui.virtual}`}>
          <button type="button" aria-pressed={f.venue === 'in-person'} onClick={() => f.toggleVenue('in-person')}><Icon name="chair" />{ui.inPerson}</button>
          <button type="button" aria-pressed={f.venue === 'virtual'} onClick={() => f.toggleVenue('virtual')}><Icon name="phone" />{ui.virtual}</button>
        </div>
        <p className="sr-only" aria-live="polite">{announce(total, f.day, f.todayIdx, f.venue, f.town)}</p>
        {total === 0 ? (
          <p className="d3-none">{ui.noMeetings}</p>
        ) : (
          groups.map((g) => (
            <div key={g.day} className="d3-group">
              {f.town && <h3 className="d3-group__day">{dayLabel(g.day, f.todayIdx, f.live)}</h3>}
              <ul className="d3-list">
                {g.items.map((m) => {
                  const st = f.status(m);
                  return (
                    <li key={m.id}>
                      <button type="button" className={`d3-item${st ? ` d3-item--${st}` : ''}`} onClick={() => f.setDetail(m)} aria-haspopup="dialog">
                        <span className="d3-display d3-item__time">{m.timeLabel}</span>
                        <span className="d3-item__name">{m.name}</span>
                        <span className="d3-item__place">{placeLine(m)}{m.venue !== 'virtual' && m.town && !f.town ? `, ${m.town}` : ''}</span>
                        {st && <span className="d3-item__flag">{st === 'now' ? ui.happeningNow : ui.nextMeeting}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </section>

      <Dialog open={!!d} onClose={() => f.setDetail(null)} labelledBy={detailId} className="d3-detail" backdropClassName="d3-detail-backdrop">
        {d && (
          <>
            <div className="d3-detail__band">
              <p className="d3-detail__kicker">{ui.meetingDetails}</p>
              <button type="button" className="d3-detail__close" onClick={() => f.setDetail(null)}><Icon name="close" /><span>{ui.close}</span></button>
            </div>
            <div className="d3-detail__body">
              <h2 id={detailId} className="d3-display d3-detail__name">{d.name}</h2>
              <p className="d3-detail__when">{dayName(d.day)}, {d.timeLabel}</p>
              <div className="d3-detail__where">
                <p className="d3-detail__venue">{venueLabel(d)}</p>
                {d.venue !== 'virtual' && d.locationName && <p><strong>{d.locationName}</strong></p>}
                {d.venue !== 'virtual' && d.address && <p>{d.address}</p>}
                {d.locationInfo && <p>{d.locationInfo}</p>}
                {d.comments && <p>{d.comments}</p>}
                {d.virtualInfo && <p>{d.virtualInfo}</p>}
                {d.wheelchair && <p><strong>{ui.wheelchair}</strong></p>}
              </div>
              {d.formats.length > 0 && (
                <>
                  <h3 className="d3-detail__sub">{ui.formats}</h3>
                  <ul className="d3-detail__formats">{d.formats.map((x) => <li key={x.code}>{x.name}</li>)}</ul>
                </>
              )}
              <div className="d3-detail__actions">
                {d.mapUrl && <a className="d3-btn" href={d.mapUrl} target="_blank" rel="noopener noreferrer">{ui.directions}<Icon name="arrow" /></a>}
                {d.virtualLink && <a className="d3-btn" href={d.virtualLink} target="_blank" rel="noopener noreferrer">{ui.joinZoom}<Icon name="arrow" /></a>}
                {d.phone && <a className="d3-btn d3-btn--alt" href={telHref(d.phone)}><Icon name="phone" />{ui.callIn} {d.phone}</a>}
              </div>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
