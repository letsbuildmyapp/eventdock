import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CreditCard, Lock, Check, X } from 'lucide-react';
import { formatMoney } from '../lib/utils';

type Phase = 'form' | 'processing' | 'success';

export type CheckoutResult = {
  ok: boolean;
  cardLast4: string;
  receiptId: string;
};

export function CheckoutModal({
  open,
  onClose,
  onSuccess,
  amountCents,
  email: initialEmail,
  description,
  cta,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (r: CheckoutResult) => void;
  amountCents: number;
  email: string;
  description: string;
  cta?: string;
}) {
  const [phase, setPhase] = useState<Phase>('form');
  const [email, setEmail] = useState(initialEmail);
  const [card, setCard] = useState('4242 4242 4242 4242');
  const [exp, setExp] = useState('12 / 28');
  const [cvc, setCvc] = useState('123');
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) {
      setPhase('form');
      setEmail(initialEmail);
      setCard('4242 4242 4242 4242');
      setExp('12 / 28');
      setCvc('123');
      setName('');
    }
  }, [open, initialEmail]);

  function formatCard(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }
  function formatExp(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    if (digits.length < 3) return digits;
    return digits.slice(0, 2) + ' / ' + digits.slice(2);
  }

  function pay(e: React.FormEvent) {
    e.preventDefault();
    setPhase('processing');
    setTimeout(() => {
      setPhase('success');
      const last4 = card.replace(/\s/g, '').slice(-4) || '4242';
      const receiptId = 'rcp_' + Math.random().toString(36).slice(2, 10);
      setTimeout(() => {
        onSuccess({ ok: true, cardLast4: last4, receiptId });
      }, 700);
    }, 1200);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="bg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] grid place-items-center px-4 py-8 bg-black/60 backdrop-blur-sm"
          onClick={() => phase === 'form' && onClose()}
        >
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="card w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 h-14 border-b-2 border-ink/10 bg-paper">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] font-bold text-muted">
                <Lock size={12} /> Secure checkout
              </div>
              {phase === 'form' && (
                <button onClick={onClose} className="text-muted hover:text-ink p-1.5 rounded-lg hover:bg-line/40" aria-label="Close">
                  <X size={16} />
                </button>
              )}
            </div>

            {phase === 'form' && (
              <form onSubmit={pay} className="p-6 space-y-4">
                <div>
                  <div className="font-display font-bold text-2xl">{formatMoney(amountCents / 100)}</div>
                  <div className="text-sm text-muted">{description}</div>
                </div>

                <Field label="Email">
                  <input
                    type="email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>

                <Field label="Cardholder name">
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name on card"
                    required
                  />
                </Field>

                <Field label="Card information" icon={<CreditCard size={12} />}>
                  <input
                    className="input tabular font-mono"
                    value={card}
                    onChange={(e) => setCard(formatCard(e.target.value))}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    required
                  />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <input
                      className="input tabular font-mono"
                      value={exp}
                      onChange={(e) => setExp(formatExp(e.target.value))}
                      placeholder="MM / YY"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      required
                    />
                    <input
                      className="input tabular font-mono"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="CVC"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      required
                    />
                  </div>
                </Field>

                <button type="submit" className="btn-primary w-full">
                  {cta ?? `Pay ${formatMoney(amountCents / 100)}`}
                </button>

                <p className="text-xs text-muted text-center pt-1">
                  <Lock size={10} className="inline mr-1" />
                  Payments secured by Stripe.
                </p>
              </form>
            )}

            {phase === 'processing' && (
              <div className="p-10 grid place-items-center text-center">
                <div className="size-14 rounded-2xl bg-paper border-2 border-ink grid place-items-center shadow-[3px_3px_0_0_rgb(var(--ink))] mb-5">
                  <CreditCard size={20} />
                </div>
                <div className="font-display font-bold text-xl">Processing payment…</div>
                <div className="text-sm text-muted mt-2">Authorizing your card.</div>
                <div className="mt-5 flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-2 rounded-full bg-ink"
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{ duration: 1.0, repeat: Infinity, delay: i * 0.16 }}
                    />
                  ))}
                </div>
              </div>
            )}

            {phase === 'success' && (
              <div className="p-10 grid place-items-center text-center">
                <motion.div
                  initial={{ scale: 0.4, rotate: -12, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 16 }}
                  className="size-16 rounded-2xl bg-accent border-2 border-ink grid place-items-center shadow-[4px_4px_0_0_rgb(var(--ink))] mb-5"
                >
                  <Check size={28} className="text-accent-ink" />
                </motion.div>
                <div className="font-display font-bold text-2xl">Paid · {formatMoney(amountCents / 100)}</div>
                <div className="text-sm text-muted mt-2">Receipt sent to {email}.</div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs uppercase tracking-[0.12em] font-bold text-muted inline-flex items-center gap-1.5">
        {icon} {label}
      </label>
      {children}
    </div>
  );
}
