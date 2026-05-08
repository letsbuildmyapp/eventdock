import { useState, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles, Calendar, Ticket, QrCode, ArrowLeft, ArrowRight, X,
  Users, Plus, ScanLine, Mail, ShieldCheck, BarChart3, ListChecks,
} from 'lucide-react';
import { useAuth } from '../lib/auth';

const TUTORIAL_KEY_PREFIX = 'eventdock:tutorial_seen:';
const MOBILE_BREAKPOINT = 768;

type Step = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  body: React.ReactNode;
  target?: string;
  placement?: 'right' | 'left' | 'top' | 'bottom';
};

const ATTENDEE_STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Welcome to EventDock',
    body: 'A friendlier place to find events, RSVP, and keep your tickets. 30-second tour.',
  },
  {
    icon: Calendar,
    title: 'Browse what\'s happening',
    body: 'Conferences, weddings, fundraisers — all on one home page. Tap any card to see the public event page.',
    target: 'browse',
    placement: 'bottom',
  },
  {
    icon: Ticket,
    title: 'My events lives here',
    body: 'Every event you\'ve RSVP\'d to. Cancel anytime, or tap one to pull up your ticket.',
    target: 'nav-mine',
    placement: 'bottom',
  },
  {
    icon: QrCode,
    title: 'Tickets are QR codes',
    body: 'When you RSVP, you get a QR ticket you can scan at the door. No printing, no email hunting.',
  },
  {
    icon: Sparkles,
    title: "You're set.",
    body: 'Pick something on the home page and try an RSVP. Tap a "demo" tile from the login screen anytime to switch roles.',
  },
];

const ORGANIZER_STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Welcome, organizer',
    body: 'EventDock handles the boring half of running an event so you can focus on the good half.',
  },
  {
    icon: Plus,
    title: 'Create an event in one screen',
    body: 'Title, date, capacity, ticket types, sessions, vendors — all in one form. Public page generates instantly.',
    target: 'new-event',
    placement: 'bottom',
  },
  {
    icon: Users,
    title: 'Guest list + CSV export',
    body: 'See everyone who RSVP\'d, search by name, export to CSV for the venue.',
    target: 'nav-events',
    placement: 'bottom',
  },
  {
    icon: ScanLine,
    title: 'Mobile check-in',
    body: 'On the day of, open Check-in on your phone. Type the ticket code (or scan it). The list updates live.',
  },
  {
    icon: Mail,
    title: 'One-click reminders',
    body: 'Send a reminder email to everyone going. Powered by a Cloud Function on Resend in production.',
  },
];

const ADMIN_STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Welcome, admin',
    body: 'You see the platform from the top. Here\'s what\'s in the kit.',
  },
  {
    icon: BarChart3,
    title: 'Platform stats',
    body: 'Total events, RSVPs, organizers, and check-ins live at the top of your dashboard.',
    target: 'admin-stats',
    placement: 'bottom',
  },
  {
    icon: ListChecks,
    title: 'Every event, one table',
    body: 'Sort and search across all organizers. Click into any event to see its public page.',
    target: 'admin-table',
    placement: 'top',
  },
  {
    icon: ShieldCheck,
    title: 'Suspend or feature',
    body: 'One click to feature a great event or suspend something off-policy.',
  },
  {
    icon: Sparkles,
    title: "Tour complete.",
    body: 'Sign in as the attendee or organizer demo accounts to see their views.',
  },
];

type Rect = { top: number; left: number; width: number; height: number };

export function Tutorial() {
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth < MOBILE_BREAKPOINT,
  );

  const role = auth.user?.role;
  const STEPS = useMemo<Step[]>(() => {
    if (role === 'organizer') return ORGANIZER_STEPS;
    if (role === 'admin') return ADMIN_STEPS;
    return ATTENDEE_STEPS;
  }, [role]);

  useEffect(() => { setStep(0); }, [STEPS]);

  useEffect(() => {
    if (!role) { setOpen(false); return; }
    const seen = localStorage.getItem(TUTORIAL_KEY_PREFIX + role);
    setOpen(!seen);
    setStep(0);
  }, [role]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  const close = useCallback(() => {
    if (role) localStorage.setItem(TUTORIAL_KEY_PREFIX + role, '1');
    setOpen(false);
  }, [role]);

  const next = useCallback(() => {
    setStep((s) => {
      if (s < STEPS.length - 1) return s + 1;
      close();
      return s;
    });
  }, [close, STEPS.length]);

  const back = useCallback(() => setStep((s) => Math.max(0, s - 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close, next, back]);

  const currentStep = STEPS[step];
  const targetSel = currentStep.target;

  useLayoutEffect(() => {
    if (!open || isMobile || !targetSel) { setRect(null); return; }
    const compute = () => {
      const el = document.querySelector(`[data-tour="${targetSel}"]`) as HTMLElement | null;
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    compute();
    const onResize = () => compute();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open, isMobile, targetSel, step]);

  if (!open) return null;

  const hasTarget = !!rect && !!targetSel;
  if (isMobile || !hasTarget) {
    return <CenteredModal steps={STEPS} step={step} onClose={close} onNext={next} onBack={back} onJump={setStep} dim={!isMobile && !targetSel} />;
  }

  const Icon = currentStep.icon;
  const isLast = step === STEPS.length - 1;

  const PAD = 16;
  const TOOLTIP_W = 380;
  const TOOLTIP_H_EST = 320;
  let top = 0;
  let left = 0;
  if (rect) {
    const placement = currentStep.placement ?? 'bottom';
    if (placement === 'right') {
      left = rect.left + rect.width + PAD;
      top = rect.top;
      if (left + TOOLTIP_W > window.innerWidth - PAD) {
        left = rect.left;
        top = rect.top + rect.height + PAD;
      }
    } else if (placement === 'left') {
      left = rect.left - TOOLTIP_W - PAD;
      top = rect.top;
    } else if (placement === 'bottom') {
      left = rect.left;
      top = rect.top + rect.height + PAD;
    } else {
      left = rect.left;
      top = rect.top - TOOLTIP_H_EST - PAD;
    }
    left = Math.min(Math.max(PAD, left), window.innerWidth - TOOLTIP_W - PAD);
    top = Math.min(Math.max(PAD, top), window.innerHeight - TOOLTIP_H_EST - PAD);
  }

  return (
    <AnimatePresence>
      <motion.div
        key="spot-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
        onClick={close}
      >
        {hasTarget && rect ? (
          <motion.div
            initial={false}
            animate={{ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className="absolute rounded-2xl pointer-events-none"
            style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.72), 0 0 0 3px rgb(var(--accent))' }}
          />
        ) : (
          <div className="absolute inset-0 bg-black/72" />
        )}
      </motion.div>

      <motion.div
        key={`tip-${step}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        role="dialog"
        aria-modal="true"
        className="fixed z-[101] w-[380px] card bg-panel overflow-hidden"
        style={{ top, left }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-12 border-b-2 border-ink/10">
          <span className="text-xs uppercase tracking-[0.12em] font-bold text-muted">
            Tour · <span className="tabular">{step + 1}</span> of <span className="tabular">{STEPS.length}</span>
          </span>
          <button onClick={close} className="text-muted hover:text-ink p-1.5 rounded-lg hover:bg-line/40" aria-label="Close tour">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">
          <div className="h-12 w-12 rounded-2xl bg-accent border-2 border-ink grid place-items-center mb-4 shadow-[3px_3px_0_0_rgb(var(--ink))]">
            <Icon size={20} className="text-accent-ink" />
          </div>
          <h2 className="font-display text-xl font-bold tracking-tight">{currentStep.title}</h2>
          <div className="text-[15px] text-muted mt-2 leading-relaxed">{currentStep.body}</div>
        </div>
        <Footer steps={STEPS} step={step} onClose={close} onNext={next} onBack={back} onJump={setStep} isLast={isLast} />
      </motion.div>
    </AnimatePresence>
  );
}

function CenteredModal({
  steps, step, onClose, onNext, onBack, onJump, dim = true,
}: {
  steps: Step[];
  step: number;
  onClose: () => void;
  onNext: () => void;
  onBack: () => void;
  onJump: (i: number) => void;
  dim?: boolean;
}) {
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        key="modal-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[100] grid place-items-center px-4 py-8 ${dim ? 'bg-black/72 backdrop-blur-sm' : 'bg-black/72'}`}
        onClick={onClose}
      >
        <motion.div
          key={`step-${step}`}
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="w-full max-w-lg card overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 h-14 border-b-2 border-ink/10">
            <span className="text-xs uppercase tracking-[0.12em] font-bold text-muted">
              Tour · <span className="tabular">{step + 1}</span> of <span className="tabular">{steps.length}</span>
            </span>
            <button onClick={onClose} className="text-muted hover:text-ink p-1.5 rounded-lg hover:bg-line/40" aria-label="Close tour">
              <X size={16} />
            </button>
          </div>
          <div className="p-7">
            <div className="h-14 w-14 rounded-2xl bg-accent border-2 border-ink grid place-items-center mb-5 shadow-[4px_4px_0_0_rgb(var(--ink))]">
              <Icon size={24} className="text-accent-ink" />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight">{current.title}</h2>
            <div className="text-base text-muted mt-3 leading-relaxed">{current.body}</div>
          </div>
          <Footer steps={steps} step={step} onClose={onClose} onNext={onNext} onBack={onBack} onJump={onJump} isLast={isLast} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Footer({
  steps, step, onClose, onNext, onBack, onJump, isLast,
}: {
  steps: Step[]; step: number; onClose: () => void; onNext: () => void; onBack: () => void;
  onJump: (i: number) => void; isLast: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-5 h-16 border-t-2 border-ink/10 bg-paper">
      <div className="flex items-center gap-1.5">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => onJump(i)}
            aria-label={`Go to step ${i + 1}`}
            className={
              i === step
                ? 'h-2 w-6 rounded-full bg-ink transition-all'
                : 'h-2 w-2 rounded-full bg-line hover:bg-muted transition-all'
            }
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        {step > 0 ? (
          <button onClick={onBack} className="btn-quiet h-9 px-3 text-sm"><ArrowLeft size={14} /> Back</button>
        ) : (
          <button onClick={onClose} className="btn-quiet h-9 px-3 text-sm">Skip</button>
        )}
        <button onClick={onNext} className="btn-primary h-9 px-4 text-sm">
          {isLast ? 'Done' : 'Next'} {!isLast ? <ArrowRight size={14} /> : null}
        </button>
      </div>
    </div>
  );
}
