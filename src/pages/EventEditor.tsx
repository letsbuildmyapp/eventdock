import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { db } from '../lib/store';
import type { EventDoc, EventCategory, Session, TicketType, Vendor } from '../lib/types';
import { slugify, uid } from '../lib/utils';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, MapPin, Users, Tag } from 'lucide-react';

const EMOJI_BY_CATEGORY: Record<EventCategory, string> = {
  conference: '⚡',
  wedding: '💛',
  fundraiser: '📚',
};

export default function EventEditor() {
  const auth = useAuth();
  const nav = useNavigate();
  if (!auth.user) return null;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('conference');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); d.setHours(18, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30); d.setHours(22, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [location, setLocation] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [coverColor, setCoverColor] = useState<'primary' | 'accent'>('primary');
  const [emoji, setEmoji] = useState(EMOJI_BY_CATEGORY['conference']);

  const [tickets, setTickets] = useState<TicketType[]>([
    { id: uid('tt_'), name: 'Standard', price: 0, capacity: 100 },
  ]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  function addTicket() { setTickets(t => [...t, { id: uid('tt_'), name: '', price: 0, capacity: 50 }]); }
  function addSession() {
    setSessions(s => [...s, {
      id: uid('s_'), title: '',
      startTime: new Date(date).toISOString(),
      endTime: new Date(endDate).toISOString(),
    }]);
  }
  function addVendor() { setVendors(v => [...v, { id: uid('v_'), name: '', category: 'Catering', contact: '' }]); }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !location.trim() || tickets.length === 0) {
      toast.error('Title, location, and at least one ticket type are required.');
      return;
    }
    const slugBase = slugify(title);
    let slug = slugBase;
    let i = 1;
    while (db.getEventBySlug(slug)) { slug = `${slugBase}-${++i}`; }

    const ev: EventDoc = {
      id: uid('evt_'),
      organizerId: auth.user!.id,
      title: title.trim(),
      slug,
      category,
      description: description.trim(),
      date: new Date(date).toISOString(),
      endDate: new Date(endDate).toISOString(),
      location: location.trim(),
      venueAddress: venueAddress.trim() || undefined,
      capacity,
      coverColor,
      emoji,
      ticketTypes: tickets.filter(t => t.name.trim()),
      sessions: sessions.filter(s => s.title.trim()),
      vendors: vendors.filter(v => v.name.trim()),
      status: 'live',
      createdAt: new Date().toISOString(),
    };
    db.upsertEvent(ev);
    toast.success('Event live. Public page is up.');
    nav(`/app/organize/${ev.id}`);
  }

  return (
    <form onSubmit={save} className="max-w-4xl mx-auto">
      <div>
        <div className="text-[11px] uppercase tracking-[0.14em] font-bold text-muted">Create event</div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold mt-1">What are we putting on?</h1>
      </div>

      <div className="mt-10 space-y-8">
        {/* Basics */}
        <Section title="The basics">
          <Field label="Title" icon={<Tag size={14} />}>
            <input className="input-lg" value={title} onChange={e => setTitle(e.target.value)} placeholder="StackForward 2026" required />
          </Field>
          <div className="grid sm:grid-cols-3 gap-3">
            {(['conference', 'wedding', 'fundraiser'] as EventCategory[]).map(c => (
              <button
                type="button"
                key={c}
                onClick={() => { setCategory(c); setEmoji(EMOJI_BY_CATEGORY[c]); }}
                className={`h-14 rounded-2xl border-2 font-display font-bold capitalize text-lg transition-all ${
                  category === c ? 'bg-ink text-paper border-ink shadow-[4px_4px_0_0_rgb(var(--ink))]' : 'bg-panel border-ink/20 text-muted hover:border-ink/50'
                }`}
              >{c}</button>
            ))}
          </div>
          <Field label="Description">
            <textarea className="textarea" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell people what they're showing up for…" />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Cover style">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setCoverColor('primary')} className={`h-12 rounded-xl border-2 font-semibold ${coverColor === 'primary' ? 'border-ink bg-primary text-white' : 'border-ink/20 text-muted'}`}>Electric blue</button>
                <button type="button" onClick={() => setCoverColor('accent')} className={`h-12 rounded-xl border-2 font-semibold ${coverColor === 'accent' ? 'border-ink bg-accent text-accent-ink' : 'border-ink/20 text-muted'}`}>Neon yellow</button>
              </div>
            </Field>
            <Field label="Emoji">
              <input className="input-lg text-2xl" value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={4} />
            </Field>
          </div>
        </Section>

        {/* When + Where */}
        <Section title="When & where">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Starts" icon={<Calendar size={14} />}>
              <input type="datetime-local" className="input-lg tabular" value={date} onChange={e => setDate(e.target.value)} required />
            </Field>
            <Field label="Ends" icon={<Calendar size={14} />}>
              <input type="datetime-local" className="input-lg tabular" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </Field>
          </div>
          <Field label="City / region" icon={<MapPin size={14} />}>
            <input className="input-lg" value={location} onChange={e => setLocation(e.target.value)} placeholder="Brooklyn, NY" required />
          </Field>
          <Field label="Venue address (optional)">
            <input className="input-lg" value={venueAddress} onChange={e => setVenueAddress(e.target.value)} placeholder="99 Commercial St, Brooklyn, NY 11222" />
          </Field>
          <Field label="Capacity" icon={<Users size={14} />}>
            <input type="number" min={1} className="input-lg tabular" value={capacity} onChange={e => setCapacity(parseInt(e.target.value || '0', 10))} required />
          </Field>
        </Section>

        {/* Tickets */}
        <Section title="Ticket types" action={<button type="button" onClick={addTicket} className="btn-quiet h-9 text-sm"><Plus size={14} /> Add type</button>}>
          <div className="space-y-3">
            {tickets.map((t, i) => (
              <div key={t.id} className="grid grid-cols-[1fr_120px_120px_auto] gap-3 items-end">
                <Field label={i === 0 ? 'Name' : ''} compact>
                  <input className="input" value={t.name} onChange={e => setTickets(arr => arr.map(x => x.id === t.id ? { ...x, name: e.target.value } : x))} placeholder="Early bird" />
                </Field>
                <Field label={i === 0 ? 'Price ($)' : ''} compact>
                  <input type="number" min={0} className="input tabular" value={t.price} onChange={e => setTickets(arr => arr.map(x => x.id === t.id ? { ...x, price: parseFloat(e.target.value || '0') } : x))} />
                </Field>
                <Field label={i === 0 ? 'Capacity' : ''} compact>
                  <input type="number" min={1} className="input tabular" value={t.capacity} onChange={e => setTickets(arr => arr.map(x => x.id === t.id ? { ...x, capacity: parseInt(e.target.value || '0', 10) } : x))} />
                </Field>
                <button type="button" onClick={() => setTickets(arr => arr.filter(x => x.id !== t.id))} className="h-11 w-11 rounded-xl border-2 border-ink/20 hover:border-danger hover:text-danger grid place-items-center" aria-label="Remove ticket">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* Sessions */}
        <Section title="Schedule (optional)" action={<button type="button" onClick={addSession} className="btn-quiet h-9 text-sm"><Plus size={14} /> Add session</button>}>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted">No sessions yet — add one if your event has a schedule.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="card-flat p-4 grid sm:grid-cols-[1fr_180px_180px_auto] gap-3 items-end">
                  <input className="input" value={s.title} onChange={e => setSessions(arr => arr.map(x => x.id === s.id ? { ...x, title: e.target.value } : x))} placeholder="Opening keynote" />
                  <input type="datetime-local" className="input tabular" value={s.startTime.slice(0, 16)} onChange={e => setSessions(arr => arr.map(x => x.id === s.id ? { ...x, startTime: new Date(e.target.value).toISOString() } : x))} />
                  <input type="datetime-local" className="input tabular" value={s.endTime.slice(0, 16)} onChange={e => setSessions(arr => arr.map(x => x.id === s.id ? { ...x, endTime: new Date(e.target.value).toISOString() } : x))} />
                  <button type="button" onClick={() => setSessions(arr => arr.filter(x => x.id !== s.id))} className="h-11 w-11 rounded-xl border-2 border-ink/20 hover:border-danger hover:text-danger grid place-items-center"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Vendors */}
        <Section title="Vendors (optional)" action={<button type="button" onClick={addVendor} className="btn-quiet h-9 text-sm"><Plus size={14} /> Add vendor</button>}>
          {vendors.length === 0 ? (
            <p className="text-sm text-muted">No vendors yet — add caterers, A/V, photography, etc.</p>
          ) : (
            <div className="space-y-3">
              {vendors.map((v) => (
                <div key={v.id} className="card-flat p-4 grid sm:grid-cols-[1fr_180px_1fr_auto] gap-3">
                  <input className="input" value={v.name} onChange={e => setVendors(arr => arr.map(x => x.id === v.id ? { ...x, name: e.target.value } : x))} placeholder="Field & Vine Catering" />
                  <input className="input" value={v.category} onChange={e => setVendors(arr => arr.map(x => x.id === v.id ? { ...x, category: e.target.value } : x))} placeholder="Catering" />
                  <input className="input" value={v.contact} onChange={e => setVendors(arr => arr.map(x => x.id === v.id ? { ...x, contact: e.target.value } : x))} placeholder="hello@vendor.com" />
                  <button type="button" onClick={() => setVendors(arr => arr.filter(x => x.id !== v.id))} className="h-11 w-11 rounded-xl border-2 border-ink/20 hover:border-danger hover:text-danger grid place-items-center"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <div className="flex items-center gap-3 pt-4 border-t-2 border-ink/10">
          <button type="submit" className="btn-primary">Publish event</button>
          <button type="button" onClick={() => nav('/app/organize')} className="btn-ghost">Cancel</button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card p-6 sm:p-8 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, icon, compact, children }: { label: string; icon?: React.ReactNode; compact?: boolean; children: React.ReactNode }) {
  return (
    <div className={compact ? '' : 'space-y-1.5'}>
      {label && (
        <label className="text-[11px] uppercase tracking-[0.12em] font-bold text-muted inline-flex items-center gap-1.5">
          {icon} {label}
        </label>
      )}
      {children}
    </div>
  );
}
