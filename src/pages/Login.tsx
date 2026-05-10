import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '../components/Logo';
import { useAuth } from '../lib/auth';
import { ArrowRight, Loader2, UserRound, Megaphone, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { Role } from '../lib/types';

const DEMO_PASSWORD = 'demo1234';

const DEMO_LOGINS: { email: string; password: string; label: string; description: string; role: Role; icon: any; color: string }[] = [
  { email: 'attendee@eventdock.demo', password: DEMO_PASSWORD, label: 'Sam Rivera', description: 'Attendee · find events', role: 'attendee', icon: UserRound, color: 'from-emerald-500 to-teal-500' },
  { email: 'organizer@eventdock.demo', password: DEMO_PASSWORD, label: 'Maya Chen', description: 'Organizer · run events', role: 'organizer', icon: Megaphone, color: 'from-amber-500 to-orange-500' },
  { email: 'admin@eventdock.demo', password: DEMO_PASSWORD, label: 'Jordan Park', description: 'Admin · platform control', role: 'admin', icon: ShieldCheck, color: 'from-indigo-500 to-violet-500' },
];

const routeFor = (r: Role) => (r === 'admin' ? '/app/admin' : r === 'organizer' ? '/app/organize' : '/app');

export default function Login() {
  const auth = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await auth.signIn(email, password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}`);
      nav(routeFor(u.role));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function onDemoLogin(d: (typeof DEMO_LOGINS)[number]) {
    setEmail(d.email);
    setPassword(d.password);
    setDemoLoading(d.email);
    try {
      const u = await auth.signIn(d.email, d.password);
      toast.success(`Signed in as ${u.name}`);
      nav(routeFor(u.role));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setDemoLoading(null);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-paper">

      <main className="relative z-10 flex flex-1 items-start justify-center px-6 pt-8 sm:pt-12 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-[440px]"
        >
          <div className="card p-7 sm:p-9 shadow-2xl">
            <div className="space-y-1.5">
              <h1 className="font-display font-extrabold text-3xl tracking-tight">Sign in to EventDock</h1>
              <p className="text-sm text-muted">
                New here?{' '}
                <Link to="/signup" className="font-semibold text-ink underline-offset-4 hover:underline">
                  Create an account
                </Link>
              </p>
            </div>

            <div className="my-6 grid gap-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.14em] font-bold text-muted">One-click demo logins</span>
                <span className="text-[10px] text-muted">No password needed</span>
              </div>
              {DEMO_LOGINS.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => onDemoLogin(d)}
                  disabled={demoLoading !== null || loading}
                  className="group flex items-center gap-3 rounded-2xl border-2 border-ink/15 bg-paper p-3 text-left transition-all hover:border-ink hover:shadow-[4px_4px_0_0_rgb(var(--ink))] hover:-translate-y-0.5 disabled:opacity-50"
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${d.color} text-white shadow-sm`}>
                    <d.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold text-base">{d.label}</div>
                    <div className="truncate text-xs text-muted">{d.description}</div>
                  </div>
                  {demoLoading === d.email ? (
                    <Loader2 size={14} className="animate-spin text-muted" />
                  ) : (
                    <ArrowRight size={14} className="text-muted transition-transform group-hover:translate-x-0.5" />
                  )}
                </button>
              ))}
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px bg-ink/15 flex-1" />
              <span className="text-[11px] uppercase tracking-wider font-bold text-muted">or sign in with email</span>
              <div className="h-px bg-ink/15 flex-1" />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-[0.12em] font-bold text-muted block mb-1.5">Email</label>
                <input type="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@eventdock.demo" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] uppercase tracking-[0.12em] font-bold text-muted">Password</label>
                  <span className="text-[11px] text-muted">demo password is demo1234</span>
                </div>
                <input type="password" autoComplete="current-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
              </div>
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : (<>Sign in <ArrowRight size={16} /></>)}
              </button>
            </form>
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 px-6 pb-8 text-center text-xs text-muted sm:px-10">
        <a href="https://letsbuildmyapp.com" target="_blank" rel="noreferrer" className="font-medium text-ink underline-offset-4 hover:underline">
          Let&apos;s Build My App
        </a>
      </footer>
    </div>
  );
}
