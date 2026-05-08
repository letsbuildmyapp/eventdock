import { Link, useNavigate, useParams } from 'react-router-dom';
import { db } from '../lib/store';
import { useDbVersion } from '../lib/queries';
import { useAuth } from '../lib/auth';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Download, Mail, Search, Trash2, ExternalLink, ScanLine, Send, Check, RefreshCw, Plus, MessageCircleQuestion, X, Ticket, ClipboardList, Inbox } from 'lucide-react';
import { downloadCsv, formatMoney, uid } from '../lib/utils';
import { toast } from 'sonner';
import { useConfirm } from '../components/ConfirmModal';
import { sendBulkReminders, listOutbox, sendRefundApproved } from '../lib/email';
import type { Vendor, VendorTask, VendorStatus } from '../lib/types';

type Tab = 'guests' | 'vendors' | 'inbox';

const VENDOR_STATUS_STYLES: Record<VendorStatus, string> = {
  invited: 'bg-paper border-ink/30 text-ink',
  confirmed: 'bg-accent border-ink text-accent-ink',
  declined: 'bg-paper border-danger/40 text-danger',
};

export default function EventManage() {
  const { id } = useParams();
  useDbVersion();
  const auth = useAuth();
  const nav = useNavigate();
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<Tab>('guests');

  const event = id ? db.getEvent(id) : undefined;
  if (!event || !auth.user) return null;
  if (event.organizerId !== auth.user.id && auth.user.role !== 'admin') {
    return <div className="card p-10">Not your event.</div>;
  }

  const allRsvps = db.listRsvpsByEvent(event.id);
  const rsvps = allRsvps.filter(r => r.status !== 'cancelled' && r.status !== 'refunded');
  const refundRequests = allRsvps.filter(r => r.refundStatus === 'pending');
  const filtered = useMemo(() => {
    return rsvps
      .filter(r => !q || (r.attendeeName + ' ' + r.attendeeEmail + ' ' + r.ticketCode).toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => a.attendeeName.localeCompare(b.attendeeName));
  }, [rsvps, q]);

  const inbox = db.listNotifications(auth.user.id).filter(n => n.eventId === event.id);

  function exportCsv() {
    const rows = rsvps.map(r => ({
      name: r.attendeeName,
      email: r.attendeeEmail,
      ticket_type: event!.ticketTypes.find(t => t.id === r.ticketTypeId)?.name ?? '',
      ticket_code: r.ticketCode,
      status: r.status,
      paid_cents: r.pricePaidCents ?? 0,
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

  async function approveRefund(rsvpId: string) {
    const r = db.getRsvp(rsvpId);
    if (!r) return;
    const ok = await confirm({
      title: 'Approve refund?',
      message: <>Refund <span className="tabular font-bold">{formatMoney((r.pricePaidCents ?? 0) / 100)}</span> to {r.attendeeName}. They'll be notified by email.</>,
      confirmLabel: 'Approve refund',
    });
    if (!ok) return;
    db.upsertRsvp({
      ...r,
      status: 'refunded',
      refundStatus: 'approved',
      refundedAt: new Date().toISOString(),
    });
    sendRefundApproved(event!, r);
    toast.success(`Refund approved. ${r.attendeeName} notified.`);
  }

  async function declineRefund(rsvpId: string) {
    const r = db.getRsvp(rsvpId);
    if (!r) return;
    const ok = await confirm({
      title: 'Decline this refund?',
      message: <>{r.attendeeName} keeps their ticket and the charge stays on their card. They'll be notified the request was declined.</>,
      confirmLabel: 'Decline refund',
      destructive: true,
    });
    if (!ok) return;
    db.upsertRsvp({
      ...r,
      refundStatus: 'denied',
      refundedAt: undefined,
    });
    toast.success(`Refund declined. ${r.attendeeName} notified.`);
  }

  function updateVendor(vendorId: string, patch: Partial<Vendor>) {
    const next = { ...event!, vendors: event!.vendors.map(v => v.id === vendorId ? { ...v, ...patch } : v) };
    db.upsertEvent(next);
  }

  function addVendor() {
    const v: Vendor = {
      id: uid('v_'),
      name: 'New vendor',
      category: 'Catering',
      contact: '',
      status: 'invited',
      tasks: [],
    };
    db.upsertEvent({ ...event!, vendors: [...event!.vendors, v] });
  }

  async function removeVendor(vendorId: string, name: string) {
    const ok = await confirm({
      title: `Remove ${name}?`,
      confirmLabel: 'Remove',
      destructive: true,
    });
    if (!ok) return;
    db.upsertEvent({ ...event!, vendors: event!.vendors.filter(v => v.id !== vendorId) });
  }

  function addTask(vendorId: string) {
    const task: VendorTask = { id: uid('vt_'), title: 'New task', status: 'pending' };
    const next = { ...event!, vendors: event!.vendors.map(v => v.id === vendorId ? { ...v, tasks: [...v.tasks, task] } : v) };
    db.upsertEvent(next);
  }

  function updateTask(vendorId: string, taskId: string, patch: Partial<VendorTask>) {
    const next = {
      ...event!,
      vendors: event!.vendors.map(v => v.id === vendorId ? {
        ...v,
        tasks: v.tasks.map(t => t.id === taskId ? { ...t, ...patch } : t),
      } : v),
    };
    db.upsertEvent(next);
  }

  function removeTask(vendorId: string, taskId: string) {
    const next = {
      ...event!,
      vendors: event!.vendors.map(v => v.id === vendorId ? {
        ...v,
        tasks: v.tasks.filter(t => t.id !== taskId),
      } : v),
    };
    db.upsertEvent(next);
  }

  const outbox = listOutbox().filter(e => e.subject.includes(event.title));

  return (
    <div>
      <Link to="/app/organize" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={14} /> All events</Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] font-bold text-primary">{event.category.replace('_', ' ')}</div>
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

      {/* Refund requests banner */}
      {refundRequests.length > 0 && (
        <div className="mt-6 card p-5 !shadow-[6px_6px_0_0_rgb(var(--accent))]">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-2xl bg-accent border-2 border-ink grid place-items-center shadow-[3px_3px_0_0_rgb(var(--ink))] shrink-0 text-accent-ink">
              <RefreshCw size={16} />
            </div>
            <div className="flex-1">
              <div className="font-display font-bold text-lg">Refund requests · <span className="tabular">{refundRequests.length}</span></div>
              <div className="mt-3 space-y-2">
                {refundRequests.map(r => (
                  <div key={r.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{r.attendeeName}</div>
                      <div className="text-xs text-muted truncate">{r.attendeeEmail}</div>
                      <span className="mt-1 inline-block chip !h-6 !text-xs tabular">{formatMoney((r.pricePaidCents ?? 0) / 100)}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => declineRefund(r.id)} className="btn-quiet h-9 px-3 text-sm text-danger hover:!bg-danger/10">
                        <X size={14} /> Decline
                      </button>
                      <button onClick={() => approveRefund(r.id)} className="btn-primary h-9 px-4 text-sm">
                        <Check size={14} /> Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8 flex gap-2 border-b-2 border-ink/10">
        {(['guests', 'vendors', 'inbox'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`h-11 px-5 -mb-0.5 border-b-2 font-semibold capitalize text-sm transition-colors ${
              tab === t ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t === 'inbox' ? `Inbox · ${inbox.length}` : t === 'guests' ? `Guest list · ${rsvps.length}` : `Vendors · ${event.vendors.length}`}
          </button>
        ))}
      </div>

      {tab === 'guests' && (
        <div className="mt-6 grid lg:grid-cols-[1fr_320px] gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-xl">Guest list</h2>
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input className="input pl-10 w-64" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search guests" />
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="size-14 mx-auto rounded-2xl border-2 border-ink bg-accent grid place-items-center text-accent-ink shadow-[3px_3px_0_0_rgb(var(--ink))]">
                  <Ticket size={24} />
                </div>
                <div className="font-display text-xl font-bold mt-3">No RSVPs yet</div>
                <div className="text-muted text-sm mt-1">Share the public page and they'll start coming in.</div>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="card overflow-hidden hidden md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-paper border-b-2 border-ink/10 text-xs uppercase tracking-wider font-bold text-muted">
                        <th className="text-left px-5 py-3">Guest</th>
                        <th className="text-left px-5 py-3">Ticket</th>
                        <th className="text-right px-5 py-3">Paid</th>
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
                            <td className="px-5 py-3 text-right tabular">
                              {(r.pricePaidCents ?? 0) > 0 ? formatMoney((r.pricePaidCents ?? 0) / 100) : <span className="text-muted">—</span>}
                            </td>
                            <td className="px-5 py-3 font-mono text-xs tabular">{r.ticketCode}</td>
                            <td className="px-5 py-3">
                              {r.status === 'checked_in' ? (
                                <span className="chip-accent !h-6 !text-xs">Checked in</span>
                              ) : (
                                <span className="chip !h-6 !text-xs">Going</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {filtered.map(r => {
                    const tt = event.ticketTypes.find(t => t.id === r.ticketTypeId);
                    return (
                      <div key={r.id} className="card p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <div className="font-semibold leading-tight">{r.attendeeName}</div>
                            <div className="text-xs text-muted truncate">{r.attendeeEmail}</div>
                          </div>
                          {r.status === 'checked_in' ? (
                            <span className="chip-accent !h-6 !text-xs shrink-0">Checked in</span>
                          ) : (
                            <span className="chip !h-6 !text-xs shrink-0">Going</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="text-muted">{tt?.name ?? '—'}</span>
                          {(r.pricePaidCents ?? 0) > 0 && (
                            <span className="chip !h-6 !text-xs tabular">{formatMoney((r.pricePaidCents ?? 0) / 100)}</span>
                          )}
                          <span className="ml-auto font-mono text-xs tabular text-muted">{r.ticketCode}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <aside className="space-y-4">
            <div className="card p-5">
              <div className="text-xs uppercase tracking-wider font-bold text-muted">Reminders sent</div>
              <div className="font-display font-extrabold text-3xl mt-1 tabular">{outbox.length}</div>
              <div className="text-xs text-muted mt-1">Last batch arrives in inboxes within ~30s in production.</div>
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
              <div className="text-xs uppercase tracking-wider font-bold text-muted">Sessions</div>
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
          </aside>
        </div>
      )}

      {tab === 'vendors' && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xl">Vendors</h2>
            <button onClick={addVendor} className="btn-quiet h-9 text-sm"><Plus size={14} /> Add vendor</button>
          </div>
          {event.vendors.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="size-14 mx-auto rounded-2xl border-2 border-ink bg-accent grid place-items-center text-accent-ink shadow-[3px_3px_0_0_rgb(var(--ink))]">
                <ClipboardList size={24} />
              </div>
              <div className="font-display text-xl font-bold mt-3">No vendors yet</div>
              <div className="text-muted text-sm mt-1">Add caterers, A/V, photo, venue contacts. Track tasks against each.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {event.vendors.map(v => (
                <article key={v.id} className="card p-5">
                  <div className="grid sm:grid-cols-[2fr_1fr_2fr_auto] gap-3 items-start">
                    <input
                      className="input"
                      value={v.name}
                      onChange={(e) => updateVendor(v.id, { name: e.target.value })}
                      placeholder="Vendor name"
                    />
                    <input
                      className="input"
                      value={v.category}
                      onChange={(e) => updateVendor(v.id, { category: e.target.value })}
                      placeholder="Category"
                    />
                    <input
                      className="input"
                      value={v.contact}
                      onChange={(e) => updateVendor(v.id, { contact: e.target.value })}
                      placeholder="contact@vendor.com"
                    />
                    <button
                      onClick={() => removeVendor(v.id, v.name)}
                      className="h-11 w-11 rounded-xl border-2 border-ink/15 hover:border-danger hover:text-danger grid place-items-center"
                      aria-label="Remove vendor"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <div className="text-xs uppercase tracking-wider font-bold text-muted">Status</div>
                    {(['invited', 'confirmed', 'declined'] as VendorStatus[]).map(s => (
                      <button
                        key={s}
                        onClick={() => updateVendor(v.id, { status: s })}
                        className={`h-7 px-3 rounded-full border-2 text-xs font-bold uppercase tracking-wider capitalize ${
                          v.status === s ? VENDOR_STATUS_STYLES[s] : 'border-ink/15 text-muted'
                        }`}
                      >{s}</button>
                    ))}
                  </div>

                  {/* Tasks */}
                  <div className="mt-5 border-t-2 border-ink/10 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs uppercase tracking-wider font-bold text-muted">Tasks · <span className="tabular">{v.tasks.filter(t => t.status === 'done').length}</span> / <span className="tabular">{v.tasks.length}</span></div>
                      <button onClick={() => addTask(v.id)} className="btn-quiet h-8 text-xs"><Plus size={12} /> Add task</button>
                    </div>
                    {v.tasks.length === 0 ? (
                      <div className="text-sm text-muted">No tasks yet.</div>
                    ) : (
                      <ul className="space-y-2">
                        {v.tasks.map(t => {
                          const overdue = t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date();
                          return (
                            <li key={t.id} className="flex items-center gap-3 group">
                              <button
                                onClick={() => updateTask(v.id, t.id, { status: t.status === 'done' ? 'pending' : 'done' })}
                                className={`size-5 rounded-md border-2 grid place-items-center shrink-0 ${
                                  t.status === 'done' ? 'bg-ink border-ink' : 'border-ink/30 hover:border-ink'
                                }`}
                                aria-label="Toggle done"
                              >
                                {t.status === 'done' && <Check size={11} className="text-paper" />}
                              </button>
                              <input
                                className={`flex-1 bg-transparent border-none focus:outline-none focus:bg-paper rounded-md px-2 py-1 text-sm ${t.status === 'done' ? 'line-through text-muted' : ''}`}
                                value={t.title}
                                onChange={(e) => updateTask(v.id, t.id, { title: e.target.value })}
                              />
                              <input
                                type="date"
                                value={t.dueDate ? t.dueDate.slice(0, 10) : ''}
                                onChange={(e) => updateTask(v.id, t.id, { dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                className={`text-xs h-8 px-2 rounded-md border-2 tabular ${overdue ? 'border-danger text-danger' : 'border-ink/15 text-muted'}`}
                              />
                              <button
                                onClick={() => removeTask(v.id, t.id)}
                                className="text-muted hover:text-danger opacity-0 group-hover:opacity-100"
                                aria-label="Remove task"
                              >
                                <X size={14} />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'inbox' && (
        <div className="mt-6">
          <h2 className="font-display font-bold text-xl mb-4">Forwarded questions & requests</h2>
          {inbox.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="size-14 mx-auto rounded-2xl border-2 border-ink bg-paper grid place-items-center">
                <Inbox size={24} />
              </div>
              <div className="font-display text-xl font-bold mt-3">Nothing in your inbox</div>
              <div className="text-muted text-sm mt-1">When attendees ask the AI a question it can't answer, it shows up here.</div>
            </div>
          ) : (
            <ul className="space-y-3">
              {inbox.map(n => (
                <li key={n.id} className="card p-5 flex items-start gap-4">
                  <div className="size-10 rounded-2xl border-2 border-ink bg-paper grid place-items-center shrink-0">
                    {n.kind === 'qa_forwarded' ? <MessageCircleQuestion size={16} /> : <RefreshCw size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-bold leading-tight">{n.title}</div>
                    <div className="text-sm text-muted mt-1 leading-relaxed">{n.body}</div>
                    <div className="text-xs text-muted mt-2 tabular">{format(new Date(n.createdAt), 'MMM d, h:mm a')}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
