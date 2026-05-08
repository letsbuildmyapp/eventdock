import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { db, aiUnlocked } from '../lib/store';
import type { EventDoc, EventCategory, Session, TicketType, Vendor } from '../lib/types';
import { slugify, uid } from '../lib/utils';
import { generateEventCopy, streamText } from '../lib/aiFixtures';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, MapPin, Users, Tag, Sparkles, Lock, Image as ImageIcon, ArrowLeft, Upload } from 'lucide-react';

const CATEGORY_LABEL: Record<EventCategory, string> = {
  conference: 'Conference',
  wedding: 'Wedding',
  fundraiser: 'Fundraiser',
  workshop: 'Workshop',
  art_opening: 'Art opening',
  brand_launch: 'Brand launch',
  fitness_retreat: 'Fitness retreat',
};

// Curated cover photo per category — used as the default when an organizer
// picks a category and hasn't uploaded their own.
const COVER_BY_CATEGORY: Record<EventCategory, string> = {
  conference: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80',
  wedding: 'https://images.unsplash.com/photo-1714972383570-44ddc9738355?auto=format&fit=crop&w=1600&q=80',
  fundraiser: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=1600&q=80',
  workshop: 'https://images.unsplash.com/photo-1586538883481-8ccbcff0b39d?auto=format&fit=crop&w=1600&q=80',
  art_opening: 'https://images.unsplash.com/photo-1774021803269-b1d0f92aaa07?auto=format&fit=crop&w=1600&q=80',
  brand_launch: 'https://images.unsplash.com/photo-1561489401-fc2876ced162?auto=format&fit=crop&w=1600&q=80',
  fitness_retreat: 'https://images.unsplash.com/photo-1758797315487-b3b225dff7d8?auto=format&fit=crop&w=1600&q=80',
};

export default function EventEditor() {
  const auth = useAuth();
  const nav = useNavigate();
  if (!auth.user) return null;

  const org = auth.user.orgId ? db.getOrganization(auth.user.orgId) : db.getOrganizationByOwner(auth.user.id);
  const aiOn = aiUnlocked(org?.tier);

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
  const [coverImage, setCoverImage] = useState<string>(COVER_BY_CATEGORY['conference']);

  const [tickets, setTickets] = useState<TicketType[]>([
    { id: uid('tt_'), name: 'Standard', price: 0, capacity: 100 },
  ]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [aiTitleOptions, setAiTitleOptions] = useState<string[]>([]);
  const [aiSocial, setAiSocial] = useState<string[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const aiCancelRef = useRef<(() => void) | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function pickCategory(c: EventCategory) {
    setCategory(c);
    // Only swap the default cover if the organizer hasn't uploaded a custom one
    if (Object.values(COVER_BY_CATEGORY).includes(coverImage)) {
      setCoverImage(COVER_BY_CATEGORY[c]);
    }
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Pick an image under 4 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setCoverImage(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function addTicket() { setTickets(t => [...t, { id: uid('tt_'), name: '', price: 0, capacity: 50 }]); }
  function addSession() {
    setSessions(s => [...s, {
      id: uid('s_'), title: '',
      startTime: new Date(date).toISOString(),
      endTime: new Date(endDate).toISOString(),
    }]);
  }
  function addVendor() { setVendors(v => [...v, { id: uid('v_'), name: '', category: 'Catering', contact: '', status: 'invited', tasks: [] }]); }

  function generateCopy() {
    if (!aiOn) {
      toast.error('AI copy writer is on Pro and Scale plans.');
      return;
    }
    const draft = generateEventCopy(category);
    setAiTitleOptions(draft.titleOptions);
    setAiSocial(draft.socialVariants);
    setDescription('');
    setAiBusy(true);
    aiCancelRef.current = streamText(
      draft.description,
      (full) => setDescription(full),
      () => { setAiBusy(false); aiCancelRef.current = null; },
    );
  }

  function stopGenerating() {
    aiCancelRef.current?.();
    aiCancelRef.current = null;
    setAiBusy(false);
  }

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
      coverImage,
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
      <Link to="/app/organize" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink mb-6">
        <ArrowLeft size={14} /> Back to events
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] font-bold text-muted">Create event</div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold mt-1">What are we putting on?</h1>
        </div>
        <button type="button" onClick={() => nav('/app/organize')} className="btn-quiet">Cancel</button>
      </div>

      <div className="mt-10 space-y-8">
        <Section title="The basics">
          <Field label="Title" icon={<Tag size={14} />}>
            <input className="input-lg" value={title} onChange={e => setTitle(e.target.value)} placeholder="StackForward 2026" required />
          </Field>
          {aiTitleOptions.length > 0 && (
            <div className="rounded-2xl border-2 border-ink/15 bg-paper p-4">
              <div className="text-xs uppercase tracking-[0.12em] font-bold text-muted mb-2 inline-flex items-center gap-1.5">
                <Sparkles size={12} /> AI title options
              </div>
              <div className="flex flex-wrap gap-2">
                {aiTitleOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setTitle(opt)}
                    className="text-xs px-3 py-2 rounded-xl border-2 border-ink/15 hover:border-ink hover:bg-accent/30 transition-colors text-left"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(Object.keys(CATEGORY_LABEL) as EventCategory[]).map(c => (
              <button
                type="button"
                key={c}
                onClick={() => pickCategory(c)}
                className={`h-14 rounded-2xl border-2 font-display font-bold text-base transition-all ${
                  category === c ? 'bg-ink !text-paper border-ink shadow-[4px_4px_0_0_rgb(var(--ink))]' : 'bg-panel border-ink/20 text-muted hover:border-ink/50'
                }`}
              >{CATEGORY_LABEL[c]}</button>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-[0.12em] font-bold text-muted">Description</label>
              {aiBusy ? (
                <button type="button" onClick={stopGenerating} className="btn-quiet h-9 text-xs">
                  Stop generating
                </button>
              ) : (
                <button
                  type="button"
                  onClick={generateCopy}
                  className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold transition-colors ${
                    aiOn ? 'bg-accent border-2 border-ink text-accent-ink hover:shadow-[2px_2px_0_0_rgb(var(--ink))]' : 'border-2 border-ink/20 text-muted'
                  }`}
                  title={aiOn ? 'Generate copy from a fixture library' : 'Available on Pro and Scale plans'}
                >
                  {aiOn ? <Sparkles size={12} /> : <Lock size={12} />}
                  {aiOn ? 'Generate with AI' : 'Pro+ feature'}
                </button>
              )}
            </div>
            <textarea
              className="textarea"
              rows={6}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell people what they're showing up for…"
            />
            {aiSocial.length > 0 && (
              <div className="mt-3 rounded-2xl border-2 border-ink/15 bg-paper p-4">
                <div className="text-xs uppercase tracking-[0.12em] font-bold text-muted mb-2 inline-flex items-center gap-1.5">
                  <Sparkles size={12} /> Social variants
                </div>
                <ul className="space-y-2">
                  {aiSocial.map((v, i) => (
                    <li key={i} className="text-sm leading-relaxed border-l-2 border-accent pl-3">{v}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Cover photo */}
          <div>
            <label className="text-xs uppercase tracking-[0.12em] font-bold text-muted inline-flex items-center gap-1.5 mb-2">
              <ImageIcon size={12} /> Cover photo
            </label>
            <div className="grid sm:grid-cols-[1fr_220px] gap-4">
              <div className="aspect-[16/10] rounded-2xl border-2 border-ink overflow-hidden bg-paper relative">
                {coverImage && <img src={coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />}
              </div>
              <div className="flex flex-col gap-3">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onPhotoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="btn-ghost h-11 text-sm"
                >
                  <Upload size={14} /> Upload your own
                </button>
                <button
                  type="button"
                  onClick={() => setCoverImage(COVER_BY_CATEGORY[category])}
                  className="btn-quiet h-11 text-sm"
                >
                  Use default for category
                </button>
                <p className="text-xs text-muted leading-relaxed">
                  PNG or JPG, ideally 1600 × 1000 or larger. Renders behind your event title.
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="When & where">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Starts" icon={<Calendar size={14} />}>
              <input type="datetime-local" className="input-date" value={date} onChange={e => setDate(e.target.value)} required />
            </Field>
            <Field label="Ends" icon={<Calendar size={14} />}>
              <input type="datetime-local" className="input-date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
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

        <Section title="Ticket types" action={<button type="button" onClick={addTicket} className="btn-quiet h-9 text-sm"><Plus size={14} /> Add type</button>}>
          <div className="space-y-4">
            {tickets.map((t, i) => (
              <div key={t.id} className="card-flat p-4 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_140px_140px_auto] gap-3 items-end">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-xs uppercase tracking-[0.12em] font-bold text-muted">{i === 0 ? 'Name' : `Type ${i + 1}`}</label>
                  <input className="input" value={t.name} onChange={e => setTickets(arr => arr.map(x => x.id === t.id ? { ...x, name: e.target.value } : x))} placeholder="Early bird" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-[0.12em] font-bold text-muted">Price ($)</label>
                  <input type="number" min={0} className="input tabular" value={t.price} onChange={e => setTickets(arr => arr.map(x => x.id === t.id ? { ...x, price: parseFloat(e.target.value || '0') } : x))} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-[0.12em] font-bold text-muted">Capacity</label>
                  <input type="number" min={1} className="input tabular" value={t.capacity} onChange={e => setTickets(arr => arr.map(x => x.id === t.id ? { ...x, capacity: parseInt(e.target.value || '0', 10) } : x))} />
                </div>
                <button type="button" onClick={() => setTickets(arr => arr.filter(x => x.id !== t.id))} className="h-11 w-11 rounded-xl border-2 border-ink/20 hover:border-danger hover:text-danger grid place-items-center self-end" aria-label="Remove ticket">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted mt-2">Leave the price at 0 for free RSVPs. Anything above 0 fires a Stripe-style checkout.</p>
        </Section>

        <Section title="Schedule (optional)" action={<button type="button" onClick={addSession} className="btn-quiet h-9 text-sm"><Plus size={14} /> Add session</button>}>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted">No sessions yet — add one if your event has a schedule.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="card-flat p-4 grid sm:grid-cols-[1.4fr_1fr_1fr_auto] gap-3 items-end">
                  <Field label="Session" compact>
                    <input className="input" value={s.title} onChange={e => setSessions(arr => arr.map(x => x.id === s.id ? { ...x, title: e.target.value } : x))} placeholder="Opening keynote" />
                  </Field>
                  <Field label="Starts" compact>
                    <input type="datetime-local" className="input-date" value={s.startTime.slice(0, 16)} onChange={e => setSessions(arr => arr.map(x => x.id === s.id ? { ...x, startTime: new Date(e.target.value).toISOString() } : x))} />
                  </Field>
                  <Field label="Ends" compact>
                    <input type="datetime-local" className="input-date" value={s.endTime.slice(0, 16)} onChange={e => setSessions(arr => arr.map(x => x.id === s.id ? { ...x, endTime: new Date(e.target.value).toISOString() } : x))} />
                  </Field>
                  <button type="button" onClick={() => setSessions(arr => arr.filter(x => x.id !== s.id))} className="h-11 w-11 rounded-xl border-2 border-ink/20 hover:border-danger hover:text-danger grid place-items-center"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Vendors (optional)" action={<button type="button" onClick={addVendor} className="btn-quiet h-9 text-sm"><Plus size={14} /> Add vendor</button>}>
          {vendors.length === 0 ? (
            <p className="text-sm text-muted">No vendors yet — add caterers, A/V, photography, etc. You'll manage status and tasks from the event page.</p>
          ) : (
            <div className="space-y-3">
              {vendors.map((v) => (
                <div key={v.id} className="card-flat p-4 grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_160px_1fr_auto] gap-3">
                  <input className="col-span-2 sm:col-span-1 input" value={v.name} onChange={e => setVendors(arr => arr.map(x => x.id === v.id ? { ...x, name: e.target.value } : x))} placeholder="Field & Vine Catering" />
                  <input className="input" value={v.category} onChange={e => setVendors(arr => arr.map(x => x.id === v.id ? { ...x, category: e.target.value } : x))} placeholder="Catering" />
                  <input className="input col-span-1" value={v.contact} onChange={e => setVendors(arr => arr.map(x => x.id === v.id ? { ...x, contact: e.target.value } : x))} placeholder="hello@vendor.com" />
                  <button type="button" onClick={() => setVendors(arr => arr.filter(x => x.id !== v.id))} className="h-11 w-11 rounded-xl border-2 border-ink/20 hover:border-danger hover:text-danger grid place-items-center"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </Section>

        <div className="flex items-center gap-3 pt-4 border-t-2 border-ink/10">
          <button type="submit" className="btn-primary">Publish event</button>
          <button type="button" onClick={() => nav('/app/organize')} className="btn-ghost">Cancel</button>
          {!aiOn && (
            <Link to="/app/organize/billing" className="ml-auto text-xs text-muted inline-flex items-center gap-1.5 hover:text-ink">
              <Sparkles size={12} /> Unlock AI on Pro
            </Link>
          )}
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
        <label className="text-xs uppercase tracking-[0.12em] font-bold text-muted inline-flex items-center gap-1.5">
          {icon} {label}
        </label>
      )}
      {children}
    </div>
  );
}
