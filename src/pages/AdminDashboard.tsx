import { Link } from 'react-router-dom';
import { db } from '../lib/store';
import { useDbVersion } from '../lib/queries';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ShieldCheck, Star, Pause, Play, Search, Users, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirm } from '../components/ConfirmModal';

export default function AdminDashboard() {
  useDbVersion();
  const confirm = useConfirm();
  const [q, setQ] = useState('');

  const events = db.listEvents();
  const users = db.listUsers();
  const rsvps = db.listRsvps();
  const organizers = users.filter(u => u.role === 'organizer');

  const filtered = useMemo(() => events.filter(e =>
    !q || (e.title + ' ' + e.location + ' ' + (users.find(u => u.id === e.organizerId)?.name ?? '')).toLowerCase().includes(q.toLowerCase())
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [events, users, q]);

  async function feature(id: string) {
    const e = db.getEvent(id);
    if (!e) return;
    db.upsertEvent({ ...e, status: e.status === 'featured' ? 'live' : 'featured' });
    toast.success(e.status === 'featured' ? 'Unfeatured.' : 'Featured.');
  }

  async function suspend(id: string) {
    const e = db.getEvent(id);
    if (!e) return;
    if (e.status === 'suspended') {
      db.upsertEvent({ ...e, status: 'live' });
      toast.success('Event reinstated.');
      return;
    }
    const ok = await confirm({
      title: 'Suspend this event?',
      message: <>Public page goes dark. Organizer can still see it. You can reinstate anytime.</>,
      confirmLabel: 'Suspend',
      destructive: true,
    });
    if (!ok) return;
    db.upsertEvent({ ...e, status: 'suspended' });
    toast.success('Event suspended.');
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-ink text-paper grid place-items-center"><ShieldCheck size={20} /></div>
        <div>
          <div className="text-[11px] uppercase tracking-[0.14em] font-bold text-muted">Admin</div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight">Platform overview</h1>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4" data-tour="admin-stats">
        <Stat icon={Calendar} label="Events" value={events.length} />
        <Stat icon={Users} label="Organizers" value={organizers.length} />
        <Stat icon={Users} label="RSVPs" value={rsvps.filter(r => r.status !== 'cancelled').length} />
        <Stat icon={BarChart3} label="Checked in" value={rsvps.filter(r => r.status === 'checked_in').length} />
      </div>

      <div className="mt-10" data-tour="admin-table">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-2xl">All events</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input pl-10 w-72" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events, organizers" />
          </div>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-paper border-b-2 border-ink/10 text-[10px] uppercase tracking-wider font-bold text-muted">
                <th className="text-left px-5 py-3">Event</th>
                <th className="text-left px-5 py-3">Organizer</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="text-right px-5 py-3 tabular">RSVPs</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const org = users.find(u => u.id === e.organizerId);
                const evRsvps = rsvps.filter(r => r.eventId === e.id && r.status !== 'cancelled').length;
                return (
                  <tr key={e.id} className="border-t border-ink/10 text-sm hover:bg-paper transition-colors">
                    <td className="px-5 py-4">
                      <Link to={`/e/${e.slug}`} className="font-semibold hover:underline inline-flex items-center gap-2">
                        <span className="text-xl">{e.emoji}</span> {e.title}
                      </Link>
                      <div className="text-xs text-muted mt-0.5">{e.location}</div>
                    </td>
                    <td className="px-5 py-4">{org?.name ?? '—'}</td>
                    <td className="px-5 py-4 tabular">{format(new Date(e.date), 'MMM d, yyyy')}</td>
                    <td className="px-5 py-4 text-right tabular font-semibold">{evRsvps}</td>
                    <td className="px-5 py-4">
                      {e.status === 'featured' && <span className="chip-accent !h-6 !text-[10px]">Featured</span>}
                      {e.status === 'live' && <span className="chip !h-6 !text-[10px]">Live</span>}
                      {e.status === 'suspended' && <span className="chip !h-6 !text-[10px] !bg-danger !text-white !border-danger">Suspended</span>}
                      {e.status === 'draft' && <span className="chip !h-6 !text-[10px]">Draft</span>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => feature(e.id)}
                          className={`h-9 w-9 rounded-xl border-2 grid place-items-center transition-colors ${e.status === 'featured' ? 'border-ink bg-accent' : 'border-ink/20 hover:border-ink'}`}
                          aria-label="Feature"
                          title={e.status === 'featured' ? 'Unfeature' : 'Feature'}
                        >
                          <Star size={14} />
                        </button>
                        <button
                          onClick={() => suspend(e.id)}
                          className={`h-9 w-9 rounded-xl border-2 grid place-items-center transition-colors ${e.status === 'suspended' ? 'border-danger bg-danger/15 text-danger' : 'border-ink/20 hover:border-danger hover:text-danger'}`}
                          aria-label="Suspend"
                          title={e.status === 'suspended' ? 'Reinstate' : 'Suspend'}
                        >
                          {e.status === 'suspended' ? <Play size={14} /> : <Pause size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted">No events match.</div>}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: number }) {
  return (
    <div className="card p-5">
      <Icon size={16} className="text-muted" />
      <div className="font-display font-extrabold text-3xl mt-2 tabular">{value}</div>
      <div className="text-[11px] uppercase tracking-wider font-bold text-muted mt-0.5">{label}</div>
    </div>
  );
}
