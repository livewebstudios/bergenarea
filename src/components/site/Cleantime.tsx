// NA Cleantime Calculator. Clean date in; years, months, days and total days out.
// Runs only in the browser. Nothing is stored or sent anywhere.
import { useId, useMemo, useState } from 'react';
import { Icon } from '../shared/icons/Icon';

interface Props { title: string; prompt: string }

/** The NA key tag milestones, in days or months, in the order members earn them. */
const TAGS: { label: string; days?: number; months?: number }[] = [
  { label: '1 day', days: 1 }, { label: '30 days', days: 30 }, { label: '60 days', days: 60 }, { label: '90 days', days: 90 },
  { label: '6 months', months: 6 }, { label: '9 months', months: 9 }, { label: '1 year', months: 12 }, { label: '18 months', months: 18 },
  { label: 'Multiple years', months: 24 },
];

function todayParts(): [number, number, number] {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('-').map(Number);
  return [p[0], p[1], p[2]];
}

function diff(from: [number, number, number], to: [number, number, number]) {
  const [fy, fm, fd] = from;
  const [ty, tm, td] = to;
  let years = ty - fy;
  let months = tm - fm;
  let days = td - fd;
  if (days < 0) {
    months -= 1;
    days += new Date(Date.UTC(ty, tm - 1, 0)).getUTCDate();
  }
  if (months < 0) { years -= 1; months += 12; }
  const total = Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
  return { years, months, days, total, totalMonths: years * 12 + months };
}

export default function Cleantime({ title, prompt }: Props) {
  const id = useId();
  const [value, setValue] = useState('');
  const today = useMemo(todayParts, []);
  const max = today.map((n, i) => String(n).padStart(i ? 2 : 4, '0')).join('-');

  const result = useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!m) return null;
    const from: [number, number, number] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const d = diff(from, today);
    return d.total < 0 ? null : d;
  }, [value, today]);

  const earned = result ? TAGS.filter((t) => (t.days ? result.total >= t.days : result.totalMonths >= (t.months ?? 0))) : [];
  const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

  return (
    <div className="ct">
      <h2 className="d1-display ct__title">{title}</h2>
      <label className="ct__label" htmlFor={id}>{prompt}</label>
      <input id={id} className="ct__input" type="date" max={max} value={value} onChange={(e) => setValue(e.target.value)} />
      <div className="ct__out" aria-live="polite">
        {result && (
          <>
            <p className="d1-display ct__big">
              {[result.years && plural(result.years, 'year'), result.months && plural(result.months, 'month'), plural(result.days, 'day')].filter(Boolean).join(', ')}
            </p>
            <p className="ct__total">{result.total.toLocaleString('en-US')} days</p>
            {earned.length > 0 && (
              <ul className="ct__tags">
                {earned.map((t) => <li key={t.label}><Icon name="keytag" /><span>{t.label}</span></li>)}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
