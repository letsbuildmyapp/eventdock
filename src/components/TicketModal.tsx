import { AnimatePresence, motion } from 'framer-motion';
import { X, Calendar, MapPin, Ticket } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import type { EventDoc, Rsvp } from '../lib/types';
import { formatMoney } from '../lib/utils';

export function TicketModal({
  open,
  onClose,
  event,
  rsvp,
}: {
  open: boolean;
  onClose: () => void;
  event: EventDoc;
  rsvp: Rsvp;
}) {
  const tt = event.ticketTypes.find(t => t.id === rsvp.ticketTypeId);
  const isPaid = (rsvp.pricePaidCents ?? 0) > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] grid place-items-center px-4 py-8 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="card w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 h-14 border-b-2 border-ink/10 bg-paper">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] font-bold text-muted">
                <Ticket size={12} /> Your ticket
              </div>
              <button onClick={onClose} className="text-muted hover:text-ink p-1.5 rounded-lg hover:bg-line/40" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="p-7 text-center">
              <div
                className="border-2 border-ink rounded-2xl p-5 inline-flex items-center justify-center"
                style={{ background: '#ffffff' }}
              >
                <QRCodeSVG value={rsvp.ticketCode} size={180} bgColor="#ffffff" fgColor="#12121b" />
              </div>
              <div className="font-mono text-sm tabular mt-4">{rsvp.ticketCode}</div>

              <div className="mt-6 text-left space-y-3">
                <div className="text-xs uppercase tracking-wider font-bold text-muted">{tt?.name ?? 'Ticket'}</div>
                <h2 className="font-display font-bold text-2xl leading-tight">{event.title}</h2>
                <div className="flex flex-col gap-1.5 text-sm text-muted">
                  <span className="inline-flex items-center gap-2"><Calendar size={14} /> {format(new Date(event.date), 'EEE, MMM d · h:mm a')}</span>
                  <span className="inline-flex items-center gap-2"><MapPin size={14} /> {event.location}</span>
                  {isPaid && (
                    <span className="inline-flex items-center gap-2 tabular">Paid {formatMoney((rsvp.pricePaidCents ?? 0) / 100)}</span>
                  )}
                </div>
              </div>

              <p className="mt-6 text-xs text-muted">
                Show this QR code at the door — no printing needed.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
