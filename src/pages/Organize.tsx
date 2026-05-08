import { Link } from 'react-router-dom';
import { db } from '../lib/store';
import { useDbVersion } from '../lib/queries';
import { useAuth } from '../lib/auth';
import { format } from 'date-fns';
import { Plus, Users, Eye, BarChart3, ArrowRight, Calendar } from 'lucide-react';

export default function Organize() {
  useDbVersion();
  const auth = useAuth();
  if (!auth.user) return null;

  const events = db.listEventsByOrganizer(auth.user.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const allRsvps = db.listRsvps();

  const totalRsvps = events.reduce((acc, e) => acc + allRsvps.filter(r => r.eventId === e.id && r.status !== 'cancelled').length, 0);
  const totalCheckedIn = allRsvps.filter(r => r.status === 'checked_in' && events.some(e => e.id === r.eventId)).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] font-bold text-muted">Organizer</div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold mt-1">Your events, your numbers.</h1>
        </div>
        <Link to="/app/organize/new" className="btn-primary" data-tour="new-event"><Plus size={16} /> New event</Link>
      </div>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat icon={Calendar} label="Events" value={events.length} />
        <Stat icon={Users} label="RSVPs" value={totalRsvps} />
        <Stat icon={Eye} label="Capacity" value={events.reduce((a, e) => a + e.capacity, 0)} />
        <Stat icon={BarChart3} label="Checked in" value={totalCheckedIn} />
      </div>

      <div className="mt-10">
        {events.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="size-16 mx-auto rounded-2xl border-2 border-ink bg-accent grid place-items-center text-accent-ink shadow-[3px_3px_0_0_rgb(var(--ink))]">
              <Calendar size={28} />
            </div>
            <div className="font-display text-2xl font-bold mt-4">No events yet</div>
            <div className="text-muted mt-2">Spin up your first event in under a minute.</div>
            <Link to="/app/organize/new" className="btn-primary mt-6 inline-flex"><Plus size={16} /> New event</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(e => {
              const evRsvps = allRsvps.filter(r => r.eventId === e.id && r.status !== 'cancelled');
              return (
                <div key={e.id} className="card p-5 sm:p-6 flex flex-wrap items-center gap-5">
                  <div className="h-16 w-16 rounded-2xl border-2 border-ink overflow-hidden bg-paper shrink-0">
                    <img src={e.coverImage} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider font-bold text-primary">{e.category.replace('_', ' ')}</span>
                      {e.status === 'featured' && <span className="chip-accent !h-5 !text-xs !px-2">Featured</span>}
                      {e.status === 'suspended' && <span className="chip !h-5 !text-xs !px-2 !bg-danger !text-white !border-danger">Suspended</span>}
                    </div>
                    <Link to={`/e/${e.slug}`} className="font-display font-bold text-xl block leading-tight mt-1 hover:underline">{e.title}</Link>
                    <div className="text-sm text-muted mt-1 tabular">{format(new Date(e.date), 'EEE, MMM d · h:mm a')} · {e.location}</div>
                  </div>
                  <div className="flex items-center gap-6 tabular">
                    <Mini label="RSVPs" value={evRsvps.length} />
                    <Mini label="Capacity" value={e.capacity} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/app/organize/${e.id}`}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-2xl bg-panel text-ink font-semibold border-2 border-ink hover:bg-accent hover:text-accent-ink transition-colors text-sm"
                    >
                      Manage
                    </Link>
                    <Link to={`/e/${e.slug}`} className="btn-quiet h-10 text-sm">Public page <ArrowRight size={14} /></Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: number }) {
  return (
    <div className="card p-5">
      <Icon size={16} className="text-muted" />
      <div className="font-display font-extrabold text-3xl mt-2 tabular">{value}</div>
      <div className="text-xs uppercase tracking-wider font-bold text-muted mt-0.5">{label}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="font-display font-bold text-2xl tabular">{value}</div>
      <div className="text-xs uppercase tracking-wider font-bold text-muted">{label}</div>
    </div>
  );
}
