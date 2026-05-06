import { Link } from 'react-router-dom';
import { db } from '../lib/store';
import { useDbVersion } from '../lib/queries';
import { useAuth } from '../lib/auth';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { useConfirm } from '../components/ConfirmModal';
import { toast } from 'sonner';
import { Calendar, MapPin, X, ArrowRight } from 'lucide-react';

export default function MyEvents() {
  useDbVersion();
  const auth = useAuth();
  const confirm = useConfirm();

  if (!auth.user) return null;

  const rsvps = db.listRsvpsByAttendee(auth.user.id)
    .filter(r => r.status !== 'cancelled')
    .map(r => ({ ...r, event: db.getEvent(r.eventId)! }))
    .filter(r => r.event)
    .sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime());

  async function cancel(rsvpId: string, title: string) {
    const ok = await confirm({
      title: 'Cancel this RSVP?',
      message: <>You'll lose your ticket for <span className="font-semibold">{title}</span>. You can RSVP again later if there's space.</>,
      confirmLabel: 'Cancel RSVP',
      cancelLabel: 'Keep it',
      destructive: true,
    });
    if (!ok) return;
    const r = db.listRsvps().find(x => x.id === rsvpId);
    if (!r) return;
    db.upsertRsvp({ ...r, status: 'cancelled' });
    toast.success('RSVP cancelled.');
  }

  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.14em] font-bold text-muted">My events</div>
      <h1 className="font-display text-4xl sm:text-5xl font-extrabold mt-1">Your tickets, your timeline.</h1>

      {rsvps.length === 0 ? (
        <div className="card p-12 mt-10 text-center">
          <div className="text-7xl">🎟️</div>
          <div className="font-display text-2xl font-bold mt-4">No events yet</div>
          <div className="text-muted mt-2">Browse what's on and pick something to go to.</div>
          <Link to="/app" className="btn-primary mt-6 inline-flex">Browse events <ArrowRight size={16} /></Link>
        </div>
      ) : (
        <div className="mt-10 grid md:grid-cols-2 gap-6">
          {rsvps.map(r => (
            <div key={r.id} className="card overflow-hidden">
              <div className="grid grid-cols-[1fr_auto] gap-4 p-6">
                <div>
                  <div className="text-[11px] uppercase tracking-wider font-bold text-primary">{r.event.category}</div>
                  <Link to={`/e/${r.event.slug}`} className="block font-display font-bold text-2xl mt-1 leading-tight hover:underline">
                    {r.event.title}
                  </Link>
                  <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted">
                    <span className="inline-flex items-center gap-2"><Calendar size={14} /> {format(new Date(r.event.date), 'EEE, MMM d · h:mm a')}</span>
                    <span className="inline-flex items-center gap-2"><MapPin size={14} /> {r.event.location}</span>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 text-xs">
                    <span className="kbd font-bold tabular">{r.ticketCode}</span>
                    <span className="text-muted">{r.event.ticketTypes.find(t => t.id === r.ticketTypeId)?.name}</span>
                  </div>
                </div>
                <div className="bg-paper border-2 border-ink rounded-2xl p-3 grid place-items-center self-start">
                  <QRCodeSVG value={r.ticketCode} size={96} bgColor="transparent" fgColor="rgb(18,18,27)" />
                </div>
              </div>
              <div className="px-6 py-4 bg-paper border-t-2 border-ink/10 flex items-center justify-between">
                <Link to={`/e/${r.event.slug}`} className="text-sm font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
                  Event details <ArrowRight size={14} />
                </Link>
                <button onClick={() => cancel(r.id, r.event.title)} className="text-sm font-semibold text-danger inline-flex items-center gap-1.5 hover:underline">
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
