import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../lib/store';
import { useDbVersion } from '../lib/queries';
import { useAuth } from '../lib/auth';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Download, Mail, Search, Trash2, ExternalLink, ScanLine, Send } from 'lucide-react';
import { downloadCsv } from '../lib/utils';
import { toast } from 'sonner';
import { useConfirm } from '../components/ConfirmModal';
import { sendBulkReminders, listOutbox } from '../lib/email';

export default function EventManage() {
  const { id } = useParams();
  useDbVersion();
  const auth = useAuth();
  const nav = useNavigate();
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [sending, setSending] = useState(false);

  const event = id ? db.getEvent(id) : undefined;
  if (!event || !auth.user) return null;
  if (event.organizerId !== auth.user.id && auth.user.role !== 'admin') {
    return <div className="card p-10">Not your event.</div>;
  }

  const rsvps = db.listRsvpsByEvent(event.id).filter(r => r.status !== 'cancelled');
  const filtered = useMemo(() => {
    return rsvps
      .filter(r => !q || (r.attendeeName + ' ' + r.attendeeEmail + ' ' + r.ticketCode).toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => a.attendeeName.localeCompare(b.attendeeName));
  }, [rsvps, q]);

  function exportCsv() {
    const rows = rsvps.map(r => ({
      name: r.attendeeName,
      email: r.attendeeEmail,
      ticket_type: event!.ticketTypes.find(t => t.id === r.ticketTypeId)?.name ?? '',
      ticket_code: r.ticketCode,
      status: r.status,
      created_at: r.createdAt,
      checked_in_at: r.checkedInAt ?? '',
    }));
    downloadCsv(`${event!.slug}-guests.csv`, rows);
    toast.success(`Exported ${rows.length} rows.`);
  }

  async function deleteEvent() {
    const ok = await confirm({
      title: 'Delete this event?',
      message: <>This removes the public page and every RSVP. Cannot be undone.</>,
      confirmLabel: 'Delete event',
      destructive: true,
    });
    if (!ok) return;
    db.deleteEvent(event!.id);
    toast.success('Event deleted.');
    nav('/app/organize');
  }

  async function sendReminders() {
    setSending(true);
    try {
      const n = await sendBulkReminders(event!, rsvps);
      toast.success(`Reminder sent to ${n} attendee${n === 1 ? '' : 's'}.`);
    } finally { setSending(false); }
  }

  const outbox = listOutbox().filter(e => e.subject.includes(event.title));

  return (
    <div>
      <Link to="/app/organize" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={14} /> All events</Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] font-bold text-primary">{event.category}</div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold mt-1 leading-tight">{event.title}</h1>
          <div className="text-muted mt-2 tabular">{format(new Date(event.date), 'EEE, MMM d · h:mm a')} · {event.location}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/e/${event.slug}`} className="btn-ghost h-10 px-4 text-sm"><ExternalLink size={14} /> Public page</Link>
          <Link to="/app/organize/checkin" className="btn-ghost h-10 px-4 text-sm"><ScanLine size={14} /> Check-in</Link>
          <button onClick={exportCsv} className="btn-ghost h-10 px-4 text-sm"><Download size={14} /> CSV</button>
          <button onClick={sendReminders} disabled={sending || rsvps.length === 0} className="btn-accent h-10 px-4 text-sm disabled:opacity-50">
            <Mail size={14} /> {sending ? 'Sending…' : 'Send reminders'}
          </button>
          <button onClick={deleteEvent} className="btn-quiet h-10 text-sm text-danger"><Trash2 size={14} /></button>
        </div>
      </div>

      <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl">Guest list <span className="text-muted tabular">({rsvps.length})</span></h2>
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input className="input pl-10 w-64" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guests" />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-5xl">🎟️</div>
              <div className="font-display text-xl font-bold mt-3">No RSVPs yet</div>
              <div className="text-muted text-sm mt-1">Share the public page and they'll start coming in.</div>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-paper border-b-2 border-ink/10 text-[10px] uppercase tracking-wider font-bold text-muted">
                    <th className="text-left px-5 py-3">Guest</th>
                    <th className="text-left px-5 py-3">Ticket</th>
                    <th className="text-left px-5 py-3">Code</th>
                    <th className="text-left px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const tt = event.ticketTypes.find(t => t.id === r.ticketTypeId);
                    return (
                      <tr key={r.id} className="border-t border-ink/10 text-sm">
                        <td className="px-5 py-3">
                          <div className="font-semibold">{r.attendeeName}</div>
                          <div className="text-xs text-muted">{r.attendeeEmail}</div>
                        </td>
                        <td className="px-5 py-3">{tt?.name ?? '—'}</td>
                        <td className="px-5 py-3 font-mono text-xs tabular">{r.ticketCode}</td>
                        <td className="px-5 py-3">
                          {r.status === 'checked_in' ? (
                            <span className="chip-accent !h-6 !text-[10px]">Checked in</span>
                          ) : (
                            <span className="chip !h-6 !text-[10px]">Going</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="text-[11px] uppercase tracking-wider font-bold text-muted">Reminders sent</div>
            <div className="font-display font-extrabold text-3xl mt-1 tabular">{outbox.length}</div>
            <div className="text-xs text-muted mt-1">Last batch arrives in inboxes within ~30s in production (Resend).</div>
            {outbox.slice(0, 3).map(e => (
              <div key={e.id} className="mt-3 rounded-xl border-2 border-ink/10 p-3 text-xs">
                <div className="flex items-center gap-2 text-muted">
                  <Send size={11} /> <span>{format(new Date(e.sentAt), 'MMM d, h:mm a')}</span>
                </div>
                <div className="font-semibold mt-0.5 truncate">{e.to}</div>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <div className="text-[11px] uppercase tracking-wider font-bold text-muted">Sessions</div>
            <div className="mt-2 space-y-2">
              {event.sessions.length === 0 && <div className="text-sm text-muted">None.</div>}
              {event.sessions.map(s => (
                <div key={s.id} className="text-sm">
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-xs text-muted tabular">{format(new Date(s.startTime), 'MMM d, h:mm a')}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="text-[11px] uppercase tracking-wider font-bold text-muted">Vendors</div>
            <div className="mt-2 space-y-2">
              {event.vendors.length === 0 && <div className="text-sm text-muted">None.</div>}
              {event.vendors.map(v => (
                <div key={v.id} className="text-sm">
                  <div className="font-semibold">{v.name}</div>
                  <div className="text-xs text-muted">{v.category} · {v.contact}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
