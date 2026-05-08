import { useMemo, useState } from 'react';
import { listOutbox, type EmailKind, type ReminderEmail } from '../lib/email';
import { useDbVersion } from '../lib/queries';
import { format, formatDistanceToNow } from 'date-fns';
import { Mail, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const KIND_LABEL: Record<EmailKind, string> = {
  confirmation: 'Confirmation',
  reminder: 'Reminder',
  day_before: 'Day-before',
  post_event: 'Post-event',
  refund_approved: 'Refund',
};

const KIND_STYLE: Record<EmailKind, string> = {
  confirmation: 'bg-paper border-ink/30 text-ink',
  reminder: 'bg-accent border-ink text-accent-ink',
  day_before: 'bg-paper border-primary/40 text-primary',
  post_event: 'bg-paper border-success/40 text-success',
  refund_approved: 'bg-paper border-danger/40 text-danger',
};

export default function AdminOutbox() {
  useDbVersion();
  const [q, setQ] = useState('');
  const [kindFilter, setKindFilter] = useState<EmailKind | 'all'>('all');
  const [open, setOpen] = useState<ReminderEmail | null>(null);

  const all = listOutbox();
  const filtered = useMemo(() => {
    return all
      .filter(e => kindFilter === 'all' || e.kind === kindFilter)
      .filter(e => !q || (e.subject + ' ' + e.to + ' ' + e.body).toLowerCase().includes(q.toLowerCase()));
  }, [all, q, kindFilter]);

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-2xl bg-ink text-paper grid place-items-center"><Mail size={20} /></div>
        <div>
          <div className="text-xs uppercase tracking-[0.14em] font-bold text-muted">Admin · Outbox</div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight">Every email, one place.</h1>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <div className="relative w-full max-w-md">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search subject, recipient, body…"
            className="input-lg pl-11"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0 pb-1">
          {(['all', 'confirmation', 'reminder', 'day_before', 'post_event', 'refund_approved'] as const).map(k => (
            <button
              key={k}
              onClick={() => setKindFilter(k)}
              className={`shrink-0 h-10 px-4 rounded-2xl border-2 font-semibold text-sm whitespace-nowrap transition-colors ${
                kindFilter === k
                  ? 'bg-ink text-paper border-ink'
                  : 'bg-panel border-ink/40 text-ink hover:bg-line/40'
              }`}
            >{k === 'all' ? 'All' : KIND_LABEL[k]}</button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="mt-8 card overflow-hidden hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="bg-paper border-b-2 border-ink/10 text-xs uppercase tracking-wider font-bold text-muted">
              <th className="text-left px-5 py-3">Kind</th>
              <th className="text-left px-5 py-3">Subject</th>
              <th className="text-left px-5 py-3">To</th>
              <th className="text-left px-5 py-3">Sent</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => (
              <tr
                key={e.id}
                onClick={() => setOpen(e)}
                className="border-t border-ink/10 text-sm align-top cursor-pointer hover:bg-paper transition-colors"
              >
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center h-7 px-3 rounded-full border-2 text-xs font-bold uppercase tracking-wider ${KIND_STYLE[e.kind]}`}>
                    {KIND_LABEL[e.kind]}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="font-semibold leading-tight">{e.subject}</div>
                  <div className="text-xs text-muted mt-1.5 max-w-prose line-clamp-2">{e.body.slice(0, 180)}{e.body.length > 180 ? '…' : ''}</div>
                </td>
                <td className="px-5 py-4 tabular">{e.to}</td>
                <td className="px-5 py-4 text-muted whitespace-nowrap">
                  <div className="tabular">{format(new Date(e.sentAt), 'MMM d')}</div>
                  <div className="text-xs">{formatDistanceToNow(new Date(e.sentAt), { addSuffix: true })}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-muted">No emails match.</div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="mt-6 md:hidden space-y-3">
        {filtered.map(e => (
          <button
            key={e.id}
            onClick={() => setOpen(e)}
            className="w-full text-left card p-4 hover:shadow-[6px_6px_0_0_rgb(var(--ink))] transition-shadow"
          >
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className={`inline-flex items-center h-6 px-3 rounded-full border-2 text-xs font-bold uppercase tracking-wider shrink-0 ${KIND_STYLE[e.kind]}`}>
                {KIND_LABEL[e.kind]}
              </span>
              <span className="text-xs text-muted whitespace-nowrap tabular">{format(new Date(e.sentAt), 'MMM d')}</span>
            </div>
            <div className="font-semibold leading-tight">{e.subject}</div>
            <div className="text-xs text-muted mt-1 truncate">To {e.to}</div>
            <div className="text-xs text-muted mt-1.5 line-clamp-2">{e.body.slice(0, 140)}{e.body.length > 140 ? '…' : ''}</div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center text-sm text-muted">No emails match.</div>
        )}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] grid place-items-center px-4 py-8 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 h-14 border-b-2 border-ink/10 bg-paper">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] font-bold text-muted">
                  <Mail size={12} /> Email · {KIND_LABEL[open.kind]}
                </div>
                <button onClick={() => setOpen(null)} className="text-muted hover:text-ink p-1.5 rounded-lg hover:bg-line/40" aria-label="Close">
                  <X size={16} />
                </button>
              </div>
              <div className="px-6 py-5 border-b-2 border-ink/10 space-y-1.5">
                <div className="text-xs uppercase tracking-wider font-bold text-muted">Subject</div>
                <div className="font-display font-bold text-xl leading-tight">{open.subject}</div>
                <div className="text-sm text-muted tabular pt-1">
                  To <span className="text-ink font-semibold">{open.to}</span>
                  <span className="mx-2">·</span>
                  {format(new Date(open.sentAt), 'MMM d, yyyy · h:mm a')}
                  <span className="mx-2">·</span>
                  {formatDistanceToNow(new Date(open.sentAt), { addSuffix: true })}
                </div>
              </div>
              <div className="px-6 py-5 overflow-y-auto flex-1 bg-paper">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-ink font-sans">{open.body}</pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
