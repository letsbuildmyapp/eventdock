import { useState, useMemo } from 'react';
import { db } from '../lib/store';
import { useDbVersion } from '../lib/queries';
import { useAuth } from '../lib/auth';
import { format } from 'date-fns';
import { ScanLine, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function CheckIn() {
  useDbVersion();
  const auth = useAuth();
  const [eventId, setEventId] = useState<string>('');
  const [code, setCode] = useState('');
  const [lastResult, setLastResult] = useState<{ ok: boolean; message: string; name?: string } | null>(null);

  if (!auth.user) return null;

  const myEvents = auth.user.role === 'admin'
    ? db.listEvents().filter(e => e.status !== 'suspended')
    : db.listEventsByOrganizer(auth.user.id);

  const activeEvent = eventId ? db.getEvent(eventId) : myEvents[0];
  const eventToUse = activeEvent ?? myEvents[0];

  const rsvps = useMemo(() => eventToUse ? db.listRsvpsByEvent(eventToUse.id).filter(r => r.status !== 'cancelled') : [], [eventToUse]);
  const checkedIn = rsvps.filter(r => r.status === 'checked_in').length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!eventToUse) return;
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    const r = db.getRsvpByCode(trimmed);
    if (!r) {
      setLastResult({ ok: false, message: 'No ticket found with that code.' });
      toast.error('No ticket found with that code.');
    } else if (r.eventId !== eventToUse.id) {
      setLastResult({ ok: false, message: 'That ticket is for a different event.' });
      toast.error('Wrong event.');
    } else if (r.status === 'checked_in') {
      setLastResult({ ok: false, message: `${r.attendeeName} was already checked in at ${format(new Date(r.checkedInAt!), 'h:mm a')}.`, name: r.attendeeName });
    } else {
      db.upsertRsvp({ ...r, status: 'checked_in', checkedInAt: new Date().toISOString() });
      setLastResult({ ok: true, message: 'Checked in.', name: r.attendeeName });
      toast.success(`${r.attendeeName} is in.`);
    }
    setCode('');
  }

  return (
    <div className="max-w-3xl mx-auto">
      {eventToUse && auth.user.role === 'organizer' ? (
        <Link to={`/app/organize/${eventToUse.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink mb-4">
          <ArrowLeft size={14} /> Back to {eventToUse.title}
        </Link>
      ) : (
        <Link to={auth.user.role === 'admin' ? '/app/admin' : '/app/organize'} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink mb-4">
          <ArrowLeft size={14} /> Back
        </Link>
      )}
      <div className="text-xs uppercase tracking-[0.14em] font-bold text-muted">Check-in</div>
      <h1 className="font-display text-4xl font-extrabold mt-1">Door scanner</h1>

      <div className="mt-6 card p-5">
        <label className="text-xs uppercase tracking-[0.12em] font-bold text-muted">Event</label>
        <select value={eventToUse?.id ?? ''} onChange={(e) => setEventId(e.target.value)} className="input-lg mt-1.5">
          {myEvents.map(e => (
            <option key={e.id} value={e.id}>{e.title} · {format(new Date(e.date), 'MMM d')}</option>
          ))}
        </select>
        {eventToUse && (
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <Stat label="RSVPs" value={rsvps.length} />
            <Stat label="Checked in" value={checkedIn} highlight />
            <Stat label="Remaining" value={rsvps.length - checkedIn} />
          </div>
        )}
      </div>

      <form onSubmit={submit} className="mt-6 card p-6">
        <label className="text-xs uppercase tracking-[0.12em] font-bold text-muted">Ticket code</label>
        <div className="mt-2 flex gap-3">
          <div className="relative flex-1">
            <ScanLine size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input-lg pl-12 font-mono text-lg tabular tracking-widest uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="EVT-XXXX-XXXX"
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary px-6">Check in</button>
        </div>
        <div className="mt-3 text-xs text-muted">In production this is wired to a QR scanner. Type or paste codes here for the demo.</div>
      </form>

      <AnimatePresence mode="wait">
        {lastResult && (
          <motion.div
            key={lastResult.message}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mt-4 card p-5 border-2 ${lastResult.ok ? '!border-success bg-success/10' : '!border-danger bg-danger/10'}`}
          >
            <div className="flex items-start gap-3">
              {lastResult.ok ? <CheckCircle2 className="text-success" /> : <AlertCircle className="text-danger" />}
              <div>
                {lastResult.name && <div className="font-display font-bold text-xl">{lastResult.name}</div>}
                <div className="text-sm">{lastResult.message}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="mt-10">
        <h2 className="font-display text-xl font-bold mb-3">Recent check-ins</h2>
        <div className="card divide-y-2 divide-ink/10 overflow-hidden">
          {rsvps.filter(r => r.status === 'checked_in')
            .sort((a, b) => new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime())
            .slice(0, 8)
            .map(r => (
              <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{r.attendeeName}</div>
                  <div className="text-xs text-muted font-mono tabular">{r.ticketCode}</div>
                </div>
                <div className="text-xs text-muted tabular">{format(new Date(r.checkedInAt!), 'h:mm:ss a')}</div>
              </div>
            ))}
          {rsvps.filter(r => r.status === 'checked_in').length === 0 && (
            <div className="px-5 py-6 text-sm text-muted text-center">No check-ins yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border-2 p-3 ${highlight ? 'border-ink bg-accent text-accent-ink' : 'border-ink/15 bg-paper'}`}>
      <div className="font-display font-extrabold text-2xl tabular">{value}</div>
      <div className={`text-xs uppercase tracking-wider font-bold ${highlight ? 'text-accent-ink/80' : 'text-muted'}`}>{label}</div>
    </div>
  );
}
