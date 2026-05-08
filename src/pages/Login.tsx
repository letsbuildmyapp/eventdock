import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '../components/Logo';
import { useAuth } from '../lib/auth';
import { Sparkles, ArrowRight, Calendar, ScanLine, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { Role } from '../lib/types';

type Tile = {
  id: string;
  role: Role;
  name: string;
  blurb: string;
  initials: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
};

const TILES: Tile[] = [
  {
    id: 'u_attendee',
    role: 'attendee',
    name: 'Sam Rivera',
    blurb: 'Browse events, RSVP, keep your QR tickets in one place.',
    initials: 'SR',
    Icon: Calendar,
  },
  {
    id: 'u_organizer',
    role: 'organizer',
    name: 'Maya Chen',
    blurb: 'Run events end-to-end — guests, schedule, vendors, check-in.',
    initials: 'MC',
    Icon: ScanLine,
  },
  {
    id: 'u_admin',
    role: 'admin',
    name: 'Jordan Park',
    blurb: 'Platform stats, every event, feature or suspend in one click.',
    initials: 'JP',
    Icon: ShieldCheck,
  },
];

export default function Login() {
  const auth = useAuth();
  const nav = useNavigate();

  function pick(tile: Tile) {
    const u = auth.signInAs(tile.id);
    toast.success(`Welcome, ${u.name.split(' ')[0]}`);
    const next =
      u.role === 'admin' ? '/app/admin' :
      u.role === 'organizer' ? '/app/organize' :
      '/app';
    nav(next);
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="px-5 sm:px-8 py-6 max-w-7xl mx-auto">
        <Logo />
      </header>

      <main className="px-5 sm:px-8 pt-4 pb-16 max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-12 items-start">
        {/* LEFT — pitch */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:pr-6"
        >
          <span className="chip-accent">
            <Sparkles size={12} /> Pick a role to enter
          </span>
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl mt-6 leading-[0.95] tracking-tight text-ink">
            Run the event.<br />
            <span className="relative inline-block">
              <span className="relative z-10">Skip the busywork.</span>
              <span className="absolute -bottom-1 left-0 right-0 h-3 bg-accent -z-0 -rotate-1 rounded" />
            </span>
          </h1>
          <p className="mt-6 text-lg text-muted max-w-prose leading-relaxed">
            EventDock is a portfolio demo for letsbuildmyapp.com. Pick the role you'd like to walk through —
            your session lives in this browser tab and resets via <em>Reset demo</em> in the footer.
          </p>
        </motion.section>

        {/* RIGHT — role tiles */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="space-y-4"
        >
          {TILES.map((t) => {
            const Icon = t.Icon;
            return (
              <motion.button
                key={t.id}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                onClick={() => pick(t)}
                className="w-full text-left card p-5 sm:p-6 flex items-center gap-5 hover:shadow-[8px_8px_0_0_rgb(var(--ink))] transition-shadow group"
              >
                <span className="h-14 w-14 shrink-0 rounded-2xl border-2 border-ink bg-accent grid place-items-center font-display font-extrabold text-xl text-accent-ink shadow-[3px_3px_0_0_rgb(var(--ink))]">
                  {t.initials}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="text-xs uppercase tracking-[0.14em] font-bold text-primary inline-flex items-center gap-1.5">
                    <Icon size={12} /> {t.role}
                  </span>
                  <span className="block font-display font-bold text-2xl mt-0.5 leading-tight">
                    {t.name}
                  </span>
                  <span className="block text-sm text-muted mt-1.5 leading-relaxed">
                    {t.blurb}
                  </span>
                </span>
                <ArrowRight className="text-muted group-hover:text-ink group-hover:translate-x-1 transition-all shrink-0" size={20} />
              </motion.button>
            );
          })}
          <p className="text-xs text-muted text-center pt-2">
            <Link to="/" className="underline">Back to home</Link>
          </p>
        </motion.section>
      </main>
    </div>
  );
}
