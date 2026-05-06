import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../lib/store';
import { useDbVersion } from '../lib/queries';
import { format } from 'date-fns';
import { useAuth } from '../lib/auth';
import { Calendar, MapPin, Users, Ticket, ArrowLeft, Clock } from 'lucide-react';
import { useState } from 'react';
import { ticketCode, uid, formatMoney } from '../lib/utils';
import { toast } from 'sonner';
import { Logo } from '../components/Logo';

const COVER_BG: Record<string, string> = {
  primary: 'bg-primary text-white',
  accent: 'bg-accent text-accent-ink',
};

export default function EventPublic() {
  const { slug } = useParams();
  useDbVersion();
  const auth = useAuth();
  const nav = useNavigate();
  const event = slug ? db.getEventBySlug(slug) : undefined;
  const [rsvping, setRsvping] = useState<string | null>(null);

  if (!event) {
    return (
      <div className="min-h-screen grid place-items-center p-8">
        <div className="card p-10 text-center max-w-md">
          <div className="font-display text-3xl font-bold">Event not found</div>
          <div className="text-muted mt-2">This event might have been removed or never existed.</div>
          <Link to="/" className="btn-primary mt-6 inline-flex"><ArrowLeft size={16} /> Home</Link>
        </div>
      </div>
    );
  }

  const rsvps = db.listRsvpsByEvent(event.id);
  const going = rsvps.filter(r => r.status !== 'cancelled').length;
  const myRsvp = auth.user ? rsvps.find(r => r.attendeeId === auth.user!.id && r.status !== 'cancelled') : undefined;
  const cover = COVER_BG[event.coverColor] ?? COVER_BG.primary;

  function handleRsvp(ticketTypeId: string) {
    if (!auth.user) {
      toast('Sign in first', { description: 'You need an account to RSVP.' });
      nav('/login');
      return;
    }
    if (auth.user.role !== 'attendee') {
      toast.error('Switch to an attendee account to RSVP.');
      return;
    }
    if (myRsvp) {
      toast('You\'re already going.');
      return;
    }
    const ev = event!;
    setRsvping(ticketTypeId);
    setTimeout(() => {
      db.upsertRsvp({
        id: uid('rsvp_'),
        eventId: ev.id,
        attendeeId: auth.user!.id,
        attendeeName: auth.user!.name,
        attendeeEmail: auth.user!.email,
        ticketTypeId,
        ticketCode: ticketCode(),
        status: 'going',
        createdAt: new Date().toISOString(),
      });
      toast.success(`You're in. Ticket coming up.`);
      setRsvping(null);
      nav('/app/me');
    }, 350);
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="px-5 sm:px-8 py-5 max-w-6xl mx-auto flex items-center justify-between">
        <Logo to={auth.user ? (auth.user.role === 'admin' ? '/app/admin' : auth.user.role === 'organizer' ? '/app/organize' : '/app') : '/'} />
        {!auth.user && <Link to="/login" className="btn-primary h-10 px-4">Sign in</Link>}
      </header>

      <article className="max-w-6xl mx-auto px-5 sm:px-8 pb-24">
        {/* Hero */}
        <section className={`card overflow-hidden`}>
          <div className={`${cover} relative h-72 md:h-96 border-b-2 border-ink overflow-hidden`}>
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-[180px] md:text-[240px] leading-none">{event.emoji}</span>
            </div>
            <div className="absolute top-6 left-6 flex gap-2">
              <span className="chip bg-paper">{event.category}</span>
              {event.status === 'featured' && <span className="chip-accent">Featured</span>}
            </div>
          </div>
          <div className="p-7 md:p-10">
            <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-[0.95]">{event.title}</h1>
            <div className="mt-5 grid sm:grid-cols-3 gap-4 text-base">
              <Detail icon={Calendar} label="When" value={format(new Date(event.date), 'EEE, MMM d · h:mm a')} sub={format(new Date(event.endDate), '\'ends\' MMM d, h:mm a')} />
              <Detail icon={MapPin} label="Where" value={event.location} sub={event.venueAddress} />
              <Detail icon={Users} label="Capacity" value={`${going} / ${event.capacity}`} sub={`${event.capacity - going} spots open`} />
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 mt-10">
          <div className="space-y-10">
            {/* About */}
            <section>
              <h2 className="font-display text-2xl font-bold">About</h2>
              <p className="mt-3 text-muted text-lg leading-relaxed max-w-prose">{event.description}</p>
            </section>

            {/* Schedule */}
            {event.sessions.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-bold">Schedule</h2>
                <ol className="mt-4 card divide-y-2 divide-ink/10 overflow-hidden">
                  {event.sessions.map((s) => (
                    <li key={s.id} className="p-5 flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl border-2 border-ink bg-accent grid place-items-center shrink-0">
                        <Clock size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-bold text-lg leading-tight">{s.title}</div>
                        <div className="text-sm text-muted mt-1 tabular">
                          {format(new Date(s.startTime), 'MMM d, h:mm a')} – {format(new Date(s.endTime), 'h:mm a')}
                          {s.location && ` · ${s.location}`}
                          {s.speaker && ` · ${s.speaker}`}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Vendors */}
            {event.vendors.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-bold">Vendors & partners</h2>
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  {event.vendors.map(v => (
                    <div key={v.id} className="card p-5">
                      <div className="text-[10px] uppercase tracking-wider font-bold text-primary">{v.category}</div>
                      <div className="font-display font-bold text-lg mt-1">{v.name}</div>
                      <div className="text-sm text-muted mt-1">{v.contact}</div>
                      {v.notes && <div className="text-sm text-muted mt-2 italic">"{v.notes}"</div>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* RSVP rail */}
          <aside className="lg:sticky lg:top-8 self-start">
            <div className="card p-6">
              <div className="text-[11px] uppercase tracking-[0.12em] font-bold text-muted">RSVP</div>
              <div className="font-display font-bold text-2xl mt-1">Pick a ticket</div>

              {myRsvp ? (
                <div className="mt-5 rounded-2xl bg-accent/30 border-2 border-ink p-4">
                  <div className="text-[11px] uppercase tracking-wider font-bold">You're going</div>
                  <div className="font-mono text-sm mt-1 tabular">{myRsvp.ticketCode}</div>
                  <Link to="/app/me" className="btn-primary mt-4 w-full">View ticket <Ticket size={16} /></Link>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {event.ticketTypes.map(tt => {
                    const sold = rsvps.filter(r => r.ticketTypeId === tt.id && r.status !== 'cancelled').length;
                    const left = tt.capacity - sold;
                    const soldOut = left <= 0;
                    return (
                      <div key={tt.id} className="rounded-2xl border-2 border-ink/20 p-4">
                        <div className="flex items-baseline justify-between">
                          <div className="font-display font-bold text-lg">{tt.name}</div>
                          <div className="font-bold tabular">{formatMoney(tt.price)}</div>
                        </div>
                        <div className="text-xs text-muted mt-1 tabular">
                          {soldOut ? 'Sold out' : `${left} of ${tt.capacity} left`}
                        </div>
                        <button
                          onClick={() => handleRsvp(tt.id)}
                          disabled={soldOut || rsvping !== null}
                          className="btn-primary w-full mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {rsvping === tt.id ? 'Booking…' : soldOut ? 'Sold out' : 'RSVP'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="mt-4 text-xs text-muted text-center">
              Share this page: <span className="font-mono">/e/{event.slug}</span>
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}

function Detail({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border-2 border-ink/15 p-4 bg-paper">
      <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider font-bold text-muted">
        <Icon size={13} /> {label}
      </div>
      <div className="font-display font-bold text-lg mt-1 leading-tight">{value}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </div>
  );
}
