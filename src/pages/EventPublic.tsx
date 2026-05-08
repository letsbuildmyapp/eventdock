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
import { CheckoutModal } from '../components/CheckoutModal';
import { sendOrderConfirmation } from '../lib/email';
import { QABot } from '../components/QABot';
import { TicketModal } from '../components/TicketModal';

const CAT_LABEL: Record<string, string> = {
  conference: 'Conference',
  wedding: 'Wedding',
  fundraiser: 'Fundraiser',
  workshop: 'Workshop',
  art_opening: 'Art opening',
  brand_launch: 'Brand launch',
  fitness_retreat: 'Fitness retreat',
};

export default function EventPublic() {
  const { slug } = useParams();
  useDbVersion();
  const auth = useAuth();
  const nav = useNavigate();
  const event = slug ? db.getEventBySlug(slug) : undefined;
  const [rsvping, setRsvping] = useState<string | null>(null);
  const [paying, setPaying] = useState<{ ttId: string; priceCents: number; name: string } | null>(null);
  const [showTicket, setShowTicket] = useState(false);

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
  const going = rsvps.filter(r => r.status !== 'cancelled' && r.status !== 'refunded').length;
  const myRsvp = auth.user ? rsvps.find(r => r.attendeeId === auth.user!.id && r.status !== 'cancelled' && r.status !== 'refunded') : undefined;

  function handleRsvp(ticketTypeId: string) {
    if (!auth.user) {
      toast('Pick a role first', { description: 'Choose an attendee tile to RSVP.' });
      nav('/login');
      return;
    }
    if (auth.user.role !== 'attendee') {
      toast.error('Switch to the attendee role to RSVP.');
      return;
    }
    if (myRsvp) {
      toast('You\'re already going.');
      return;
    }
    const ev = event!;
    const tt = ev.ticketTypes.find(t => t.id === ticketTypeId);
    if (!tt) return;
    if (tt.price > 0) {
      setPaying({ ttId: ticketTypeId, priceCents: Math.round(tt.price * 100), name: tt.name });
      return;
    }
    setRsvping(ticketTypeId);
    setTimeout(() => {
      const r = {
        id: uid('rsvp_'),
        eventId: ev.id,
        attendeeId: auth.user!.id,
        attendeeName: auth.user!.name,
        attendeeEmail: auth.user!.email,
        ticketTypeId,
        ticketCode: ticketCode(),
        status: 'going' as const,
        createdAt: new Date().toISOString(),
      };
      db.upsertRsvp(r);
      sendOrderConfirmation(ev, r);
      toast.success('You\'re in. Ticket ready.', { description: 'Tap “View ticket” to see your QR code.' });
      setRsvping(null);
    }, 350);
  }

  function completePayment() {
    if (!paying || !event || !auth.user) return;
    const r = {
      id: uid('rsvp_'),
      eventId: event.id,
      attendeeId: auth.user.id,
      attendeeName: auth.user.name,
      attendeeEmail: auth.user.email,
      ticketTypeId: paying.ttId,
      ticketCode: ticketCode(),
      status: 'going' as const,
      pricePaidCents: paying.priceCents,
      paidAt: new Date().toISOString(),
      refundStatus: 'none' as const,
      createdAt: new Date().toISOString(),
    };
    db.upsertRsvp(r);
    sendOrderConfirmation(event, r);
    setPaying(null);
    setShowTicket(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="px-5 sm:px-8 py-5 max-w-6xl w-full mx-auto flex items-center justify-between">
        <Logo to={auth.user ? (auth.user.role === 'admin' ? '/app/admin' : auth.user.role === 'organizer' ? '/app/organize' : '/app') : '/'} />
        <div className="flex items-center gap-3">
          {auth.user ? (
            <Link
              to={auth.user.role === 'admin' ? '/app/admin' : auth.user.role === 'organizer' ? '/app/organize' : '/app'}
              className="btn-ghost h-10 px-4 text-sm"
            >
              <ArrowLeft size={14} /> Back to {auth.user.role === 'attendee' ? 'browse' : 'dashboard'}
            </Link>
          ) : (
            <>
              <Link to="/" className="btn-quiet text-sm">Home</Link>
              <Link to="/login" className="btn-primary h-10 px-4">Sign in</Link>
            </>
          )}
        </div>
      </header>

      <article className="max-w-6xl w-full mx-auto px-5 sm:px-8 pb-24 flex-1">
        {/* Hero */}
        <section className="card overflow-hidden">
          <div className="relative h-72 md:h-96 border-b-2 border-ink overflow-hidden bg-paper">
            <img
              src={event.coverImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 top-0 h-32 pointer-events-none"
                 style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)' }} />
            <div className="absolute top-6 left-6 flex gap-2">
              <span className="chip-ink">{CAT_LABEL[event.category] ?? event.category}</span>
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
            <section>
              <h2 className="font-display text-2xl font-bold">About</h2>
              <p className="mt-3 text-muted text-lg leading-relaxed max-w-prose whitespace-pre-line">{event.description}</p>
            </section>

            {event.sessions.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-bold">Schedule</h2>
                <ol className="mt-4 card divide-y-2 divide-ink/10 overflow-hidden">
                  {event.sessions.map((s) => (
                    <li key={s.id} className="p-5 flex items-start gap-4">
                      <div className="h-10 w-10 rounded-xl border-2 border-ink bg-accent grid place-items-center shrink-0">
                        <Clock size={16} className="text-accent-ink" />
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

            {event.vendors.length > 0 && (
              <section>
                <h2 className="font-display text-2xl font-bold">Vendors & partners</h2>
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  {event.vendors.map(v => (
                    <div key={v.id} className="card p-5">
                      <div className="text-xs uppercase tracking-wider font-bold text-primary">{v.category}</div>
                      <div className="font-display font-bold text-lg mt-1">{v.name}</div>
                      <div className="text-sm text-muted mt-1">{v.contact}</div>
                      {v.notes && <div className="text-sm text-muted mt-2 italic">"{v.notes}"</div>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:sticky lg:top-8 self-start">
            <div className="card p-6">
              <div className="text-xs uppercase tracking-[0.12em] font-bold text-muted">RSVP</div>
              <div className="font-display font-bold text-2xl mt-1">Pick a ticket</div>

              {myRsvp ? (
                <div className="mt-5 rounded-2xl bg-accent/30 border-2 border-ink p-4">
                  <div className="text-xs uppercase tracking-wider font-bold">You're going</div>
                  <div className="font-mono text-sm mt-1 tabular">{myRsvp.ticketCode}</div>
                  <button onClick={() => setShowTicket(true)} className="btn-primary mt-4 w-full">
                    View ticket <Ticket size={16} />
                  </button>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {event.ticketTypes.map(tt => {
                    const sold = rsvps.filter(r => r.ticketTypeId === tt.id && r.status !== 'cancelled' && r.status !== 'refunded').length;
                    const left = tt.capacity - sold;
                    const soldOut = left <= 0;
                    const isPaid = tt.price > 0;
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
                          {rsvping === tt.id ? 'Booking…' : soldOut ? 'Sold out' : isPaid ? `Buy ticket — ${formatMoney(tt.price)}` : 'RSVP'}
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

      {paying && auth.user && (
        <CheckoutModal
          open
          onClose={() => setPaying(null)}
          onSuccess={completePayment}
          amountCents={paying.priceCents}
          email={auth.user.email}
          description={`${event.title} · ${paying.name}`}
          cta={`Pay ${formatMoney(paying.priceCents / 100)}`}
        />
      )}

      {myRsvp && (
        <TicketModal
          open={showTicket}
          onClose={() => setShowTicket(false)}
          event={event}
          rsvp={myRsvp}
        />
      )}

      <QABot event={event} />
    </div>
  );
}

function Detail({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border-2 border-ink/15 p-4 bg-paper">
      <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-muted">
        <Icon size={13} /> {label}
      </div>
      <div className="font-display font-bold text-lg mt-1 leading-tight">{value}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
    </div>
  );
}
