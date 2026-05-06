import { Link } from 'react-router-dom';
import type { EventDoc } from '../lib/types';
import { Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const COVER_BG: Record<string, string> = {
  primary: 'bg-primary text-white',
  accent: 'bg-accent text-accent-ink',
};

export function EventCard({ event, going }: { event: EventDoc; going?: number }) {
  const cover = COVER_BG[event.coverColor] ?? COVER_BG.primary;
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <Link to={`/e/${event.slug}`} className="block card overflow-hidden hover:shadow-[8px_8px_0_0_rgb(var(--ink))] transition-shadow">
        <div className={`${cover} h-40 relative border-b-2 border-ink overflow-hidden`}>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.6) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.4) 0, transparent 40%)',
          }} />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="chip bg-paper">{event.category}</span>
            {event.status === 'featured' && <span className="chip-accent">Featured</span>}
          </div>
          <div className="absolute bottom-4 left-4 text-7xl">{event.emoji}</div>
        </div>
        <div className="p-5">
          <h3 className="font-display font-bold text-xl leading-tight">{event.title}</h3>
          <div className="mt-3 flex flex-col gap-1.5 text-sm text-muted">
            <span className="inline-flex items-center gap-2"><Calendar size={14} /> {format(new Date(event.date), 'EEE, MMM d · h:mm a')}</span>
            <span className="inline-flex items-center gap-2"><MapPin size={14} /> {event.location}</span>
            {going !== undefined && (
              <span className="inline-flex items-center gap-2"><Users size={14} /> <span className="tabular">{going}</span> going · <span className="tabular">{event.capacity}</span> capacity</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
