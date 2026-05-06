/**
 * Local persistence layer. Mirrors a Firestore-shaped API so swapping in
 * the real Firebase SDK later is a 1:1 change. All collections live in
 * localStorage under the `eventdock:db:` prefix and emit a CustomEvent on
 * mutation so components can subscribe.
 */
import type { EventDoc, Rsvp, User } from './types';

const PREFIX = 'eventdock:db:';
const EV = 'eventdock:db:changed';

type DB = {
  users: User[];
  events: EventDoc[];
  rsvps: Rsvp[];
};

function read<T>(key: keyof DB): T[] {
  const raw = localStorage.getItem(PREFIX + key);
  if (!raw) return [];
  try { return JSON.parse(raw) as T[]; } catch { return []; }
}

function write<T>(key: keyof DB, rows: T[]) {
  localStorage.setItem(PREFIX + key, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(EV, { detail: { key } }));
}

export const db = {
  // ---------- users ----------
  listUsers: () => read<User>('users'),
  getUser: (id: string) => read<User>('users').find(u => u.id === id),
  getUserByEmail: (email: string) => read<User>('users').find(u => u.email.toLowerCase() === email.toLowerCase()),
  upsertUser: (u: User) => {
    const all = read<User>('users');
    const idx = all.findIndex(x => x.id === u.id);
    if (idx >= 0) all[idx] = u; else all.push(u);
    write('users', all);
  },

  // ---------- events ----------
  listEvents: () => read<EventDoc>('events'),
  getEvent: (id: string) => read<EventDoc>('events').find(e => e.id === id),
  getEventBySlug: (slug: string) => read<EventDoc>('events').find(e => e.slug === slug),
  listEventsByOrganizer: (organizerId: string) =>
    read<EventDoc>('events').filter(e => e.organizerId === organizerId),
  upsertEvent: (e: EventDoc) => {
    const all = read<EventDoc>('events');
    const idx = all.findIndex(x => x.id === e.id);
    if (idx >= 0) all[idx] = e; else all.push(e);
    write('events', all);
  },
  deleteEvent: (id: string) => {
    write('events', read<EventDoc>('events').filter(e => e.id !== id));
    write('rsvps', read<Rsvp>('rsvps').filter(r => r.eventId !== id));
  },

  // ---------- rsvps ----------
  listRsvps: () => read<Rsvp>('rsvps'),
  listRsvpsByEvent: (eventId: string) => read<Rsvp>('rsvps').filter(r => r.eventId === eventId),
  listRsvpsByAttendee: (attendeeId: string) =>
    read<Rsvp>('rsvps').filter(r => r.attendeeId === attendeeId),
  getRsvpByCode: (code: string) =>
    read<Rsvp>('rsvps').find(r => r.ticketCode.toLowerCase() === code.toLowerCase()),
  upsertRsvp: (r: Rsvp) => {
    const all = read<Rsvp>('rsvps');
    const idx = all.findIndex(x => x.id === r.id);
    if (idx >= 0) all[idx] = r; else all.push(r);
    write('rsvps', all);
  },

  // ---------- meta ----------
  reset: () => {
    localStorage.removeItem(PREFIX + 'users');
    localStorage.removeItem(PREFIX + 'events');
    localStorage.removeItem(PREFIX + 'rsvps');
    window.dispatchEvent(new CustomEvent(EV));
  },

  subscribe: (cb: () => void) => {
    const handler = () => cb();
    window.addEventListener(EV, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EV, handler);
      window.removeEventListener('storage', handler);
    };
  },
};
