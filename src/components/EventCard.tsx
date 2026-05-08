import { Link } from 'react-router-dom';
import type { EventDoc } from '../lib/types';
import { Calendar, MapPin, Users } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const CAT_LABEL: Record<string, string> = {
  conference: 'Conference',
  wedding: 'Wedding',
  fundraiser: 'Fundraiser',
  workshop: 'Workshop',
  art_opening: 'Art opening',
  brand_launch: 'Brand launch',
  fitness_retreat: 'Fitness retreat',
};

export function EventCard({ event, going }: { event: EventDoc; going?: number }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="h-full"
    >
      <Link
        to={`/e/${event.slug}`}
        className="block card overflow-hidden hover:shadow-[8px_8px_0_0_rgb(var(--ink))] transition-shadow h-full flex flex-col"
      >
        <div className="h-48 relative border-b-2 border-ink overflow-hidden bg-paper shrink-0">
          <img
            src={event.coverImage}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Bottom-of-image scrim so chips read on any photo */}
          <div className="absolute inset-x-0 top-0 h-24 pointer-events-none"
               style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 100%)' }} />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="chip-ink">{CAT_LABEL[event.category] ?? event.category}</span>
            {event.status === 'featured' && <span className="chip-accent">Featured</span>}
          </div>
        </div>
        <div className="p-5 flex flex-col flex-1">
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
