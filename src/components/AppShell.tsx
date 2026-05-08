import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';
import { useAuth } from '../lib/auth';
import { Calendar, Ticket, LayoutDashboard, ScanLine, ShieldCheck, LogOut, Sun, Moon, Plus, CreditCard, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ResetDemo } from './ResetDemo';

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const stored = localStorage.getItem('eventdock:theme');
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
      setDark(true);
    }
  }, []);
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('eventdock:theme', next ? 'dark' : 'light');
    setDark(next);
  };
  return { dark, toggle };
}

export function AppShell() {
  const auth = useAuth();
  const nav = useNavigate();
  const { dark, toggle } = useTheme();
  const role = auth.user?.role;

  const links = (() => {
    if (role === 'attendee') return [
      { to: '/app', label: 'Browse', icon: Calendar, end: true, tour: 'browse' },
      { to: '/app/me', label: 'My events', icon: Ticket, tour: 'nav-mine' },
    ];
    if (role === 'organizer') return [
      { to: '/app/organize', label: 'My events', icon: LayoutDashboard, end: true, tour: 'nav-events' },
      { to: '/app/organize/new', label: 'Create', icon: Plus, tour: 'new-event' },
      { to: '/app/organize/checkin', label: 'Check-in', icon: ScanLine, tour: 'nav-checkin' },
      { to: '/app/organize/billing', label: 'Billing', icon: CreditCard, tour: 'nav-billing' },
    ];
    if (role === 'admin') return [
      { to: '/app/admin', label: 'Dashboard', icon: ShieldCheck, end: true, tour: 'admin-nav' },
      { to: '/app/admin/outbox', label: 'Outbox', icon: Mail, tour: 'admin-outbox' },
    ];
    return [];
  })();

  function signOut() {
    auth.signOut();
    nav('/login');
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 flex items-center gap-6">
          <Logo to={role === 'admin' ? '/app/admin' : role === 'organizer' ? '/app/organize' : '/app'} />
          <nav className="hidden md:flex items-center gap-1 ml-2">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                data-tour={l.tour}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition-all ${
                    isActive ? 'bg-ink text-paper' : 'text-muted hover:text-ink hover:bg-line/40'
                  }`
                }
              >
                <l.icon size={16} /> {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggle} className="btn-quiet h-10 w-10 px-0" aria-label="Toggle theme">
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l-2 border-line h-8">
              <div className="text-right">
                <div className="text-sm font-semibold leading-tight">{auth.user?.name}</div>
                <div className="text-xs uppercase tracking-wider text-muted font-bold">{role}</div>
              </div>
              <button onClick={signOut} className="btn-quiet h-10 w-10 px-0" aria-label="Switch role" title="Switch role">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="md:hidden border-t-2 border-ink bg-paper">
          <div className="flex overflow-x-auto px-3 py-2 gap-1">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                data-tour={l.tour}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold whitespace-nowrap ${
                    isActive ? 'bg-ink text-paper' : 'text-muted hover:bg-line/40'
                  }`
                }
              >
                <l.icon size={15} /> {l.label}
              </NavLink>
            ))}
            <button onClick={signOut} className="ml-auto inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold text-muted">
              <LogOut size={15} /> Switch role
            </button>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl w-full px-5 sm:px-8 py-8 sm:py-12 flex-1">
        <Outlet />
      </main>
      <footer className="border-t-2 border-ink bg-panel mt-auto">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-8 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <div className="flex items-center gap-3">
            <Logo to="/" />
          </div>
          <div className="flex items-center gap-5">
            <ResetDemo />
            <a href="https://letsbuildmyapp.com" className="font-semibold underline-offset-2 hover:underline">
              Built by letsbuildmyapp.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
