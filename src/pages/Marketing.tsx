import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '../components/Logo';
import { ArrowRight, Calendar, QrCode, ScanLine, Mail, Sparkles, Heart, Users, Zap } from 'lucide-react';
import { db } from '../lib/store';
import { EventCard } from '../components/EventCard';
import { useDbVersion } from '../lib/queries';
import { ResetDemo } from '../components/ResetDemo';

export default function Marketing() {
  useDbVersion();
  const featured = db.listEvents().filter(e => e.status === 'live' || e.status === 'featured').slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="px-5 sm:px-8 py-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-quiet">Sign in</Link>
          <Link to="/login" className="btn-primary h-10 px-4">Try it <ArrowRight size={14} /></Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-5 sm:px-8 pt-8 pb-24 flex-1">
        <section className="grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="chip-accent"><Sparkles size={12} /> Conferences · Weddings · Fundraisers</span>
            <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[0.95] tracking-tight">
              Events people<br />
              <span className="relative inline-block">
                <span className="relative z-10">actually show up to.</span>
                <span className="absolute -bottom-2 left-0 right-0 h-4 bg-accent -z-0 -rotate-1 rounded" />
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted max-w-prose leading-relaxed">
              EventDock gives organizers a single screen for invitations, RSVPs, QR tickets, schedule, vendors, and check-in — and gives attendees a place that actually feels worth opening.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="btn-primary">Try the demo <ArrowRight size={16} /></Link>
              <Link to="/login" className="btn-accent">See organizer view</Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="card p-6 md:p-8 rotate-1 hover:rotate-0 transition-transform">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl border-2 border-ink bg-primary text-white grid place-items-center">
                  <Zap size={20} />
                </div>
                <div>
                  <div className="font-display font-bold text-lg">StackForward 2026</div>
                  <div className="text-sm text-muted">Brooklyn · 2 days · 320 capacity</div>
                </div>
                <span className="ml-auto chip-accent">Featured</span>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
                <Stat icon={Users} label="Going" value="247" />
                <Stat icon={QrCode} label="Tickets" value="247" />
                <Stat icon={ScanLine} label="Checked in" value="0" />
              </div>
              <div className="mt-6 h-32 rounded-2xl bg-paper border-2 border-ink/20 p-4">
                <div className="text-xs uppercase tracking-wider font-bold text-muted">Today's reminders</div>
                <div className="mt-2 space-y-2">
                  <Row name="Dana Liu" code="EVT-XK4Q-MN29" />
                  <Row name="Tariq Wells" code="EVT-PB22-RC8L" />
                  <Row name="Noor Patel" code="EVT-9HJ4-T7QM" />
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-4 hidden md:flex card p-4 -rotate-6 bg-accent items-center gap-2">
              <Heart size={18} className="text-accent-ink" />
              <span className="font-bold text-accent-ink">142 RSVPs today</span>
            </div>
          </motion.div>
        </section>

        <section className="mt-24">
          <div className="flex items-end justify-between mb-6">
            <h2 className="font-display text-3xl sm:text-4xl font-bold">Live events you can browse</h2>
            <Link to="/login" className="text-primary font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">All events <ArrowRight size={14} /></Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {featured.map(e => <EventCard key={e.id} event={e} />)}
          </div>
        </section>

        <section className="mt-24 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Feature icon={Calendar} title="One-screen creation" body="Title, date, capacity, ticket types, sessions, vendors — all in one form." />
          <Feature icon={QrCode} title="QR tickets, no printing" body="Every RSVP gets a scannable code. Attendees keep it on their phone." />
          <Feature icon={ScanLine} title="Mobile check-in" body="Type or scan codes from your phone on the day. Live attendance updates." />
          <Feature icon={Mail} title="One-click reminders" body="Email everyone going. Powered by Resend, fired from a Cloud Function." />
        </section>
      </main>

      <footer className="border-t-2 border-ink bg-panel mt-auto">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <Logo />
          <div className="flex items-center gap-6">
            <ResetDemo />
            <a href="https://letsbuildmyapp.com" className="font-semibold underline-offset-2 hover:underline">Built by letsbuildmyapp.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border-2 border-ink/20 p-3">
      <Icon size={14} className="text-muted" />
      <div className="font-display font-bold text-2xl mt-1 tabular">{value}</div>
      <div className="text-xs uppercase tracking-wider text-muted font-bold">{label}</div>
    </div>
  );
}

function Row({ name, code }: { name: string; code: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium">{name}</span>
      <span className="font-mono text-xs text-muted tabular">{code}</span>
    </div>
  );
}

function Feature({ icon: Icon, title, body }: { icon: React.ComponentType<{ size?: number; className?: string }>; title: string; body: string }) {
  return (
    <div className="card p-6">
      <div className="h-12 w-12 rounded-2xl bg-accent border-2 border-ink grid place-items-center mb-4 shadow-[3px_3px_0_0_rgb(var(--ink))]">
        <Icon className="text-accent-ink" size={20} />
      </div>
      <div className="font-display font-bold text-lg">{title}</div>
      <div className="text-sm text-muted mt-1.5 leading-relaxed">{body}</div>
    </div>
  );
}
