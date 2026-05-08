import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { db, TIER_LIMITS, TIER_PRICING } from '../lib/store';
import type { OrgTier, Organization } from '../lib/types';
import { uid, formatMoney } from '../lib/utils';
import { CheckoutModal } from '../components/CheckoutModal';
import { Check, Sparkles, ArrowLeft, Lock, Zap, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useDbVersion } from '../lib/queries';

const TIER_FEATURES: Record<OrgTier, string[]> = {
  starter: [
    'One active event at a time',
    'Free RSVPs and paid ticketing',
    'Guest list, CSV export, mobile check-in',
    'Manual reminder emails',
  ],
  pro: [
    'Unlimited events',
    'AI event copy writer',
    'AI attendee Q&A bot',
    'Custom branding (cover styles, accent palette)',
    'Scheduled reminders + day-before emails',
  ],
  scale: [
    'Everything in Pro',
    'Team accounts (5 seats)',
    'White-label public pages',
    'Priority refund processing',
    'Vendor coordination dashboard',
  ],
};

const TIER_ICONS: Record<OrgTier, React.ComponentType<{ size?: number; className?: string }>> = {
  starter: Sparkles,
  pro: Zap,
  scale: Crown,
};

export default function Billing() {
  useDbVersion();
  const auth = useAuth();
  const [pendingTier, setPendingTier] = useState<OrgTier | null>(null);

  if (!auth.user) return null;

  let org = auth.user.orgId ? db.getOrganization(auth.user.orgId) : db.getOrganizationByOwner(auth.user.id);
  // First-time fallback — create a starter org if none exists
  if (!org) {
    org = {
      id: uid('org_'),
      name: `${auth.user.name.split(' ')[0]}'s Studio`,
      ownerId: auth.user.id,
      tier: 'starter',
      tierUpdatedAt: new Date().toISOString(),
    };
    db.upsertOrganization(org);
    db.upsertUser({ ...auth.user, orgId: org.id });
  }

  const currentTier = org.tier;

  function pickTier(t: OrgTier) {
    if (t === currentTier) {
      toast('Already on this plan.');
      return;
    }
    if (TIER_PRICING[t].monthlyCents === 0) {
      // downgrade to starter — instant, no checkout
      const next: Organization = { ...org!, tier: t, tierUpdatedAt: new Date().toISOString() };
      db.upsertOrganization(next);
      toast.success('Switched to Starter.');
      return;
    }
    setPendingTier(t);
  }

  function completeUpgrade() {
    if (!pendingTier || !org) return;
    const next: Organization = { ...org, tier: pendingTier, tierUpdatedAt: new Date().toISOString() };
    db.upsertOrganization(next);
    toast.success(`You're on ${TIER_LIMITS[pendingTier].label}. AI is unlocked.`);
    setPendingTier(null);
  }

  return (
    <div>
      <Link to="/app/organize" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft size={14} /> Back to events
      </Link>

      <div className="mt-4 max-w-3xl">
        <div className="text-xs uppercase tracking-[0.14em] font-bold text-muted">Billing</div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold mt-1">Pick a plan that fits.</h1>
        <p className="mt-4 text-lg text-muted leading-relaxed">
          {org.name} is currently on <span className="font-bold text-ink">{TIER_LIMITS[currentTier].label}</span>.
          Switch any time — downgrades take effect at the next billing cycle.
        </p>
      </div>

      <div className="mt-10 grid md:grid-cols-3 gap-5 auto-rows-fr">
        {(['starter', 'pro', 'scale'] as OrgTier[]).map((t) => {
          const Icon = TIER_ICONS[t];
          const isCurrent = t === currentTier;
          const isHighlighted = t === 'pro' && currentTier !== 'scale';
          const TIER_RANK: Record<OrgTier, number> = { starter: 0, pro: 1, scale: 2 };
          const isDowngrade = TIER_RANK[t] < TIER_RANK[currentTier];
          let cta: string;
          if (isCurrent) cta = 'Current plan';
          else if (isDowngrade) cta = `Downgrade to ${TIER_LIMITS[t].label}`;
          else cta = `Upgrade to ${TIER_LIMITS[t].label}`;
          return (
            <div
              key={t}
              className={`card p-6 relative h-full flex flex-col ${isHighlighted ? '!shadow-[6px_6px_0_0_rgb(var(--accent))]' : ''}`}
            >
              {isHighlighted && (
                <div className="absolute -top-3 left-6 chip-accent !h-7">
                  <Sparkles size={11} /> Most popular
                </div>
              )}
              <div className={`size-12 rounded-2xl border-2 border-ink grid place-items-center mb-4 shadow-[3px_3px_0_0_rgb(var(--ink))] ${
                t === 'starter' ? 'bg-paper' : t === 'pro' ? 'bg-accent' : 'bg-primary text-white'
              }`}>
                <Icon size={20} className={t === 'pro' ? 'text-accent-ink' : ''} />
              </div>
              <div className="font-display font-bold text-2xl">{TIER_LIMITS[t].label}</div>
              <div className="mt-1 text-sm text-muted">{TIER_PRICING[t].blurb}</div>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="font-display font-extrabold text-4xl tabular">
                  {TIER_PRICING[t].monthlyCents === 0 ? 'Free' : formatMoney(TIER_PRICING[t].monthlyCents / 100)}
                </span>
                {TIER_PRICING[t].monthlyCents > 0 && <span className="text-sm text-muted">/ month</span>}
              </div>
              <ul className="mt-6 space-y-2.5">
                {TIER_FEATURES[t].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check size={14} className="text-primary mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => pickTier(t)}
                disabled={isCurrent}
                className={`mt-auto pt-6 w-full text-center font-semibold transition-all ${isCurrent ? 'cursor-default' : ''}`}
              >
                <span className={`block w-full h-11 rounded-2xl border-2 border-ink leading-[40px] ${
                  isCurrent
                    ? 'bg-paper text-muted'
                    : t === 'pro'
                    ? 'bg-accent text-accent-ink hover:shadow-[4px_4px_0_0_rgb(var(--ink))]'
                    : t === 'scale' && !isDowngrade
                    ? 'bg-primary text-white hover:shadow-[4px_4px_0_0_rgb(var(--ink))]'
                    : 'bg-panel text-ink hover:bg-paper'
                }`}>
                  {cta}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-10 card p-6 max-w-3xl">
        <div className="flex items-start gap-3">
          <Lock size={16} className="text-muted mt-1 shrink-0" />
          <div className="text-sm text-muted leading-relaxed">
            Plans are billed monthly. Cancel any time from this page — there's no contract.
            Annual billing knocks two months off; reach out if you'd like that set up.
          </div>
        </div>
      </div>

      {pendingTier && (
        <CheckoutModal
          open
          onClose={() => setPendingTier(null)}
          onSuccess={completeUpgrade}
          amountCents={TIER_PRICING[pendingTier].monthlyCents}
          email={auth.user.email}
          description={`EventDock ${TIER_LIMITS[pendingTier].label} · monthly`}
          cta={`Subscribe to ${TIER_LIMITS[pendingTier].label}`}
        />
      )}
    </div>
  );
}
