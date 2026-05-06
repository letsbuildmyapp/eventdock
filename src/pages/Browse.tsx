import { useMemo, useState } from 'react';
import { db } from '../lib/store';
import { useDbVersion } from '../lib/queries';
import { EventCard } from '../components/EventCard';
import { Search } from 'lucide-react';

const CATEGORIES = ['all', 'conference', 'wedding', 'fundraiser'] as const;

export default function Browse() {
  useDbVersion();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<typeof CATEGORIES[number]>('all');

  const all = db.listEvents().filter(e => e.status !== 'suspended' && e.status !== 'draft');
  const rsvps = db.listRsvps();

  const filtered = useMemo(() => {
    return all
      .filter(e => cat === 'all' || e.category === cat)
      .filter(e => !q || (e.title + ' ' + e.location + ' ' + e.description).toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [all, q, cat]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] font-bold text-muted">Browse</div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold mt-1">Pick your next thing.</h1>
        </div>
        <div className="text-sm text-muted">
          <span className="tabular font-bold text-ink">{filtered.length}</span> event{filtered.length === 1 ? '' : 's'} · <span className="tabular font-bold text-ink">{rsvps.length}</span> RSVPs
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3" data-tour="browse">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, place, vibe…"
            className="input-lg pl-11"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`h-12 px-5 rounded-2xl border-2 font-semibold capitalize transition-all whitespace-nowrap ${
                cat === c ? 'bg-ink text-paper border-ink' : 'bg-panel border-ink/20 text-muted hover:border-ink/50'
              }`}
            >{c}</button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(e => {
          const going = rsvps.filter(r => r.eventId === e.id && r.status !== 'cancelled').length;
          return <EventCard key={e.id} event={e} going={going} />;
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 mt-10 text-center">
          <div className="font-display text-2xl font-bold">Nothing matches.</div>
          <div className="text-muted mt-2">Try clearing the filter or the search.</div>
        </div>
      )}
    </div>
  );
}
