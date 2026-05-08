/**
 * Local persistence layer. All collections live in localStorage under the
 * `eventdock:db:` prefix and emit a CustomEvent on mutation so components
 * can subscribe via useDbVersion(). Shape mirrors a Firestore-style API.
 */
import type { EventDoc, Rsvp, User, Organization, Notification } from './types';

const PREFIX = 'eventdock:db:';
const EV = 'eventdock:db:changed';

type DB = {
  users: User[];
  events: EventDoc[];
  rsvps: Rsvp[];
  organizations: Organization[];
  notifications: Notification[];
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
  getRsvp: (id: string) => read<Rsvp>('rsvps').find(r => r.id === id),
  getRsvpByCode: (code: string) =>
    read<Rsvp>('rsvps').find(r => r.ticketCode.toLowerCase() === code.toLowerCase()),
  upsertRsvp: (r: Rsvp) => {
    const all = read<Rsvp>('rsvps');
    const idx = all.findIndex(x => x.id === r.id);
    if (idx >= 0) all[idx] = r; else all.push(r);
    write('rsvps', all);
  },

  // ---------- organizations ----------
  listOrganizations: () => read<Organization>('organizations'),
  getOrganization: (id: string) => read<Organization>('organizations').find(o => o.id === id),
  getOrganizationByOwner: (ownerId: string) =>
    read<Organization>('organizations').find(o => o.ownerId === ownerId),
  upsertOrganization: (o: Organization) => {
    const all = read<Organization>('organizations');
    const idx = all.findIndex(x => x.id === o.id);
    if (idx >= 0) all[idx] = o; else all.push(o);
    write('organizations', all);
  },

  // ---------- notifications ----------
  listNotifications: (recipientId: string) =>
    read<Notification>('notifications').filter(n => n.recipientId === recipientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  upsertNotification: (n: Notification) => {
    const all = read<Notification>('notifications');
    const idx = all.findIndex(x => x.id === n.id);
    if (idx >= 0) all[idx] = n; else all.push(n);
    write('notifications', all);
  },

  // ---------- meta ----------
  reset: () => {
    (['users', 'events', 'rsvps', 'organizations', 'notifications'] as (keyof DB)[]).forEach(k => {
      localStorage.removeItem(PREFIX + k);
    });
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

// ---------- helpers used across the app ----------
export const TIER_LIMITS = {
  starter: { ai: false, customBranding: false, label: 'Starter' },
  pro: { ai: true, customBranding: true, label: 'Pro' },
  scale: { ai: true, customBranding: true, label: 'Scale' },
} as const;

export const TIER_PRICING = {
  starter: { monthlyCents: 0, blurb: 'Free forever for the first event.' },
  pro: { monthlyCents: 2900, blurb: 'For organizers running events monthly.' },
  scale: { monthlyCents: 9900, blurb: 'For agencies and venues with full calendars.' },
} as const;

export function aiUnlocked(tier?: import('./types').OrgTier | null): boolean {
  if (!tier) return false;
  return TIER_LIMITS[tier].ai;
}
