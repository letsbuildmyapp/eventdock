import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '../components/Logo';
import { useAuth } from '../lib/auth';
import { Sparkles, ArrowRight, AtSign, Lock, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Role } from '../lib/types';

const DEMOS: { id: string; role: Role; name: string; tag: string }[] = [
  { id: 'u_attendee', role: 'attendee', name: 'Sam Rivera', tag: 'attendee' },
  { id: 'u_organizer', role: 'organizer', name: 'Maya Chen', tag: 'organizer' },
  { id: 'u_admin', role: 'admin', name: 'Jordan Park', tag: 'admin' },
];

export default function Login() {
  const auth = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('attendee@eventdock.demo');
  const [password, setPassword] = useState('demo1234');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('attendee');
  const [loading, setLoading] = useState(false);

  const routeFor = (r: Role) => r === 'admin' ? '/app/admin' : r === 'organizer' ? '/app/organize' : '/app';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signin') {
        const u = await auth.signIn(email, password);
        toast.success(`Welcome back, ${u.name.split(' ')[0]}`);
        nav(routeFor(u.role));
      } else {
        if (!name.trim()) throw new Error('Name is required.');
        const u = await auth.signUp(email, password, name.trim(), role);
        toast.success(`Account created — welcome, ${u.name.split(' ')[0]}`);
        nav(routeFor(u.role));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setLoading(false); }
  }

  function demoIn(id: string) {
    const u = auth.signInAs(id);
    toast.success(`Signed in as ${u.name}`);
    nav(routeFor(u.role));
  }

  async function googleIn() {
    const u = await auth.signInWithGoogle();
    toast.success(`Signed in as ${u.name}`);
    nav(routeFor(u.role));
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="px-5 sm:px-8 py-6">
        <Logo />
      </header>

      <main className="px-5 sm:px-8 py-8 grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto items-start">
        {/* LEFT — pitch */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:pr-6"
        >
          <span className="chip-accent">
            <Sparkles size={12} /> events that don't feel like spreadsheets
          </span>
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl mt-6 leading-[0.95] tracking-tight">
            Run the event.<br/>
            <span className="relative inline-block">
              <span className="relative z-10">Skip the busywork.</span>
              <span className="absolute -bottom-1 left-0 right-0 h-3 bg-accent -z-0 -rotate-1 rounded" />
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted max-w-prose leading-relaxed">
            Public event pages, RSVPs with QR tickets, mobile check-in, schedule, vendors, and one-click reminders. Conferences, weddings, fundraisers — same toolkit, different skin.
          </p>

          <div className="mt-10">
            <div className="text-[11px] uppercase tracking-[0.14em] font-bold text-muted">One-click demos</div>
            <div className="mt-3 grid sm:grid-cols-3 gap-3">
              {DEMOS.map(d => (
                <button
                  key={d.id}
                  onClick={() => demoIn(d.id)}
                  className="card p-4 text-left hover:shadow-[6px_6px_0_0_rgb(var(--ink))] hover:-translate-y-0.5 transition-all group"
                >
                  <div className="text-[10px] uppercase tracking-[0.12em] font-bold text-primary">{d.tag}</div>
                  <div className="font-display font-bold text-lg mt-1">{d.name}</div>
                  <div className="text-xs text-muted mt-1 inline-flex items-center gap-1">
                    Sign in <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* RIGHT — auth card */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <div className="card p-7 sm:p-9">
            <div className="flex gap-2 p-1 rounded-2xl bg-paper border-2 border-ink/20 mb-6">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-colors ${mode === 'signin' ? 'bg-ink text-paper' : 'text-muted'}`}
              >Sign in</button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-colors ${mode === 'signup' ? 'bg-ink text-paper' : 'text-muted'}`}
              >Sign up</button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <Field label="Your name" icon={<UserIcon size={16} />}>
                  <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Alex Dow" required />
                </Field>
              )}
              <Field label="Email" icon={<AtSign size={16} />}>
                <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required />
              </Field>
              <Field label="Password" icon={<Lock size={16} />} hint="demo password is demo1234">
                <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </Field>
              {mode === 'signup' && (
                <div>
                  <label className="text-[11px] uppercase tracking-[0.12em] font-bold text-muted">Role</label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(['attendee', 'organizer', 'admin'] as Role[]).map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`h-11 rounded-xl border-2 font-semibold text-sm transition-colors ${role === r ? 'bg-ink text-paper border-ink' : 'bg-panel border-ink/20 text-muted hover:border-ink/50'}`}
                      >{r}</button>
                    ))}
                  </div>
                </div>
              )}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px bg-ink/15 flex-1" />
              <span className="text-[11px] uppercase tracking-wider font-bold text-muted">or</span>
              <div className="h-px bg-ink/15 flex-1" />
            </div>

            <button onClick={googleIn} className="btn-ghost w-full">
              <GoogleG /> Continue with Google
            </button>

            <p className="mt-6 text-xs text-muted text-center">
              Demo only. <Link to="/" className="underline">Back to home</Link>
            </p>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

function Field({ label, hint, icon, children }: { label: string; hint?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] uppercase tracking-[0.12em] font-bold text-muted inline-flex items-center gap-1.5">
          {icon}{label}
        </label>
        {hint && <span className="text-[11px] text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.55-1.85.87-3.04.87-2.34 0-4.32-1.58-5.03-3.7H.96v2.32A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.73a5.41 5.41 0 0 1 0-3.46V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.32z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.32C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  );
}
