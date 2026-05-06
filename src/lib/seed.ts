import { db } from './store';
import type { EventDoc, Rsvp, User } from './types';
import { ticketCode, uid } from './utils';

const SEED_FLAG = 'eventdock:seeded:v1';

function iso(daysFromNow: number, hour = 18, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const DEMOS: User[] = [
  { id: 'u_attendee', email: 'attendee@eventdock.demo', name: 'Sam Rivera', role: 'attendee' },
  { id: 'u_organizer', email: 'organizer@eventdock.demo', name: 'Maya Chen', role: 'organizer' },
  { id: 'u_admin', email: 'admin@eventdock.demo', name: 'Jordan Park', role: 'admin' },
  // extra organizers + attendees for realism
  { id: 'u_org_2', email: 'leo@eventdock.demo', name: 'Leo Okonkwo', role: 'organizer' },
  { id: 'u_org_3', email: 'priya@eventdock.demo', name: 'Priya Shah', role: 'organizer' },
  { id: 'u_org_4', email: 'devon@eventdock.demo', name: 'Devon Hart', role: 'organizer' },
  { id: 'u_a2', email: 'dana@eventdock.demo', name: 'Dana Liu', role: 'attendee' },
  { id: 'u_a3', email: 'tariq@eventdock.demo', name: 'Tariq Wells', role: 'attendee' },
  { id: 'u_a4', email: 'noor@eventdock.demo', name: 'Noor Patel', role: 'attendee' },
  { id: 'u_a5', email: 'kai@eventdock.demo', name: 'Kai Brennan', role: 'attendee' },
];

const EVENTS_SEED: Omit<EventDoc, 'id' | 'createdAt'>[] = [
  {
    organizerId: 'u_organizer',
    title: 'StackForward 2026',
    slug: 'stackforward-2026',
    category: 'conference',
    emoji: '⚡',
    coverColor: 'primary',
    description:
      'A two-day independent conference for shipping engineers. No keynote influencers — just builders who deploy on Fridays. Talks on local-first apps, agentic coding workflows, and the new wave of small teams.',
    date: iso(21, 9, 0),
    endDate: iso(22, 18, 0),
    location: 'Brooklyn, NY',
    venueAddress: '99 Commercial St, Brooklyn, NY 11222',
    capacity: 320,
    ticketTypes: [
      { id: 'tt_sf_early', name: 'Early bird', price: 199, capacity: 100 },
      { id: 'tt_sf_std', name: 'Standard', price: 299, capacity: 180 },
      { id: 'tt_sf_team', name: 'Team of 4', price: 999, capacity: 40 },
    ],
    sessions: [
      { id: uid('s_'), title: 'Opening — Why small teams won', startTime: iso(21, 9, 30), endTime: iso(21, 10, 15), speaker: 'Maya Chen', location: 'Main Hall' },
      { id: uid('s_'), title: 'Local-first, deploy never', startTime: iso(21, 10, 30), endTime: iso(21, 11, 15), speaker: 'Leo Okonkwo', location: 'Main Hall' },
      { id: uid('s_'), title: 'Agentic codebases in production', startTime: iso(21, 13, 0), endTime: iso(21, 13, 45), speaker: 'Priya Shah', location: 'Studio B' },
      { id: uid('s_'), title: 'Hallway track + demos', startTime: iso(21, 16, 0), endTime: iso(21, 18, 0), location: 'Atrium' },
    ],
    vendors: [
      { id: uid('v_'), name: 'Joe Coffee', category: 'Catering', contact: 'events@joecoffee.com', notes: 'Both days, 8a–5p' },
      { id: uid('v_'), name: 'NorthStar A/V', category: 'A/V', contact: 'crew@northstar-av.com' },
      { id: uid('v_'), name: 'Pixel Print', category: 'Signage', contact: 'orders@pixelprint.co' },
    ],
    status: 'featured',
  },
  {
    organizerId: 'u_org_2',
    title: 'Wren & Daniel — Lakeside Wedding',
    slug: 'wren-daniel-wedding',
    category: 'wedding',
    emoji: '💛',
    coverColor: 'accent',
    description:
      'Wren and Daniel are getting married at the lake house, and you are invited. Casual elegance, dancing past midnight, late-night ramen bar. Black-tie optional.',
    date: iso(45, 16, 0),
    endDate: iso(45, 23, 30),
    location: 'Lake Geneva, WI',
    venueAddress: '1240 Shore Rd, Lake Geneva, WI',
    capacity: 140,
    ticketTypes: [
      { id: 'tt_wd_guest', name: 'Guest', price: 0, capacity: 130 },
      { id: 'tt_wd_plus', name: 'Plus one', price: 0, capacity: 10 },
    ],
    sessions: [
      { id: uid('s_'), title: 'Ceremony', startTime: iso(45, 16, 30), endTime: iso(45, 17, 15), location: 'Garden lawn' },
      { id: uid('s_'), title: 'Cocktail hour', startTime: iso(45, 17, 30), endTime: iso(45, 18, 30), location: 'West deck' },
      { id: uid('s_'), title: 'Dinner & toasts', startTime: iso(45, 18, 30), endTime: iso(45, 20, 30), location: 'Boathouse' },
      { id: uid('s_'), title: 'Dancing + ramen bar', startTime: iso(45, 20, 30), endTime: iso(45, 23, 30), location: 'Boathouse' },
    ],
    vendors: [
      { id: uid('v_'), name: 'Field & Vine Catering', category: 'Catering', contact: 'hello@fieldandvine.com' },
      { id: uid('v_'), name: 'DJ Halcyon', category: 'Music', contact: 'book@djhalcyon.fm' },
      { id: uid('v_'), name: 'Iris & Oak Florals', category: 'Florals', contact: 'studio@irisandoak.com' },
      { id: uid('v_'), name: 'Bea Hayashi Photo', category: 'Photography', contact: 'bea@hayashiphoto.com' },
    ],
    status: 'live',
  },
  {
    organizerId: 'u_org_3',
    title: 'Riverside Public Library — Annual Benefit',
    slug: 'riverside-library-benefit',
    category: 'fundraiser',
    emoji: '📚',
    coverColor: 'primary',
    description:
      'Help us reopen the children\'s wing. Live auction, readings from local authors, dessert reception. Every ticket funds one new library card holder for a year.',
    date: iso(14, 18, 30),
    endDate: iso(14, 22, 0),
    location: 'Riverside, IL',
    venueAddress: '120 Forest Ave, Riverside, IL',
    capacity: 220,
    ticketTypes: [
      { id: 'tt_lib_supporter', name: 'Supporter', price: 75, capacity: 150 },
      { id: 'tt_lib_patron', name: 'Patron (table of 8)', price: 800, capacity: 10 },
      { id: 'tt_lib_kids', name: 'Kids (under 12)', price: 0, capacity: 60 },
    ],
    sessions: [
      { id: uid('s_'), title: 'Welcome from the Director', startTime: iso(14, 18, 30), endTime: iso(14, 18, 50) },
      { id: uid('s_'), title: 'Author readings', startTime: iso(14, 19, 0), endTime: iso(14, 19, 45) },
      { id: uid('s_'), title: 'Live auction', startTime: iso(14, 20, 0), endTime: iso(14, 21, 15) },
      { id: uid('s_'), title: 'Dessert reception', startTime: iso(14, 21, 15), endTime: iso(14, 22, 0) },
    ],
    vendors: [
      { id: uid('v_'), name: 'Sweet Maple Bakery', category: 'Catering', contact: 'orders@sweetmaple.bake' },
      { id: uid('v_'), name: 'Hearthstone Auctions', category: 'Auctioneer', contact: 'contact@hearthstone.bid' },
    ],
    status: 'live',
  },
  {
    organizerId: 'u_organizer',
    title: 'IndieHack Summit',
    slug: 'indiehack-summit',
    category: 'conference',
    emoji: '🛠️',
    coverColor: 'accent',
    description:
      'A one-day micro-conference for solo founders and 2-person teams. Three talks, a build-in-public lunch, and a demo night.',
    date: iso(60, 10, 0),
    endDate: iso(60, 21, 0),
    location: 'Austin, TX',
    capacity: 140,
    ticketTypes: [
      { id: 'tt_ih_std', name: 'Founder pass', price: 149, capacity: 120 },
      { id: 'tt_ih_demo', name: 'Demo night only', price: 25, capacity: 80 },
    ],
    sessions: [
      { id: uid('s_'), title: 'Talk: One-person companies', startTime: iso(60, 10, 30), endTime: iso(60, 11, 15) },
      { id: uid('s_'), title: 'Build-in-public lunch', startTime: iso(60, 12, 0), endTime: iso(60, 13, 30) },
      { id: uid('s_'), title: 'Demo night', startTime: iso(60, 19, 0), endTime: iso(60, 21, 0) },
    ],
    vendors: [
      { id: uid('v_'), name: 'Tacodeli', category: 'Catering', contact: 'events@tacodeli.com' },
    ],
    status: 'live',
  },
  {
    organizerId: 'u_org_4',
    title: 'Aliya & Sam — Garden Party Wedding',
    slug: 'aliya-sam-wedding',
    category: 'wedding',
    emoji: '🌿',
    coverColor: 'primary',
    description:
      'Aliya and Sam invite you to a backyard wedding in early summer. Brunch ceremony, lawn games, slow afternoon. Wear something you can sit in the grass in.',
    date: iso(72, 11, 0),
    endDate: iso(72, 17, 0),
    location: 'Hudson, NY',
    capacity: 80,
    ticketTypes: [
      { id: 'tt_as_guest', name: 'Guest', price: 0, capacity: 80 },
    ],
    sessions: [
      { id: uid('s_'), title: 'Ceremony', startTime: iso(72, 11, 30), endTime: iso(72, 12, 0) },
      { id: uid('s_'), title: 'Brunch + lawn games', startTime: iso(72, 12, 0), endTime: iso(72, 15, 0) },
      { id: uid('s_'), title: 'First dance', startTime: iso(72, 15, 30), endTime: iso(72, 16, 0) },
    ],
    vendors: [
      { id: uid('v_'), name: 'Foxglove Florals', category: 'Florals', contact: 'hello@foxgloveflorals.co' },
    ],
    status: 'live',
  },
  {
    organizerId: 'u_org_3',
    title: 'Code for the Coast — Hackathon for Climate',
    slug: 'code-for-the-coast',
    category: 'fundraiser',
    emoji: '🌊',
    coverColor: 'accent',
    description:
      '48 hours, 30 teams, one mission: ship a tool a coastal nonprofit can actually use. Sponsored by local tech employers; all proceeds to the Coastal Resilience Fund.',
    date: iso(35, 9, 0),
    endDate: iso(37, 18, 0),
    location: 'Portland, ME',
    capacity: 180,
    ticketTypes: [
      { id: 'tt_cc_hacker', name: 'Hacker', price: 25, capacity: 120 },
      { id: 'tt_cc_mentor', name: 'Mentor', price: 0, capacity: 30 },
      { id: 'tt_cc_demo', name: 'Demo day visitor', price: 10, capacity: 200 },
    ],
    sessions: [
      { id: uid('s_'), title: 'Kickoff + team formation', startTime: iso(35, 9, 30), endTime: iso(35, 11, 0) },
      { id: uid('s_'), title: 'Final demos', startTime: iso(37, 14, 0), endTime: iso(37, 17, 0) },
    ],
    vendors: [
      { id: uid('v_'), name: 'Coffee By Design', category: 'Catering', contact: 'events@coffeebydesign.com' },
    ],
    status: 'live',
  },
  {
    organizerId: 'u_organizer',
    title: 'DesignDocs Quarterly',
    slug: 'designdocs-quarterly',
    category: 'conference',
    emoji: '✏️',
    coverColor: 'primary',
    description:
      'A quarterly half-day for senior product designers who actually ship. Three case studies, no Figma plugins.',
    date: iso(8, 13, 0),
    endDate: iso(8, 18, 0),
    location: 'San Francisco, CA',
    capacity: 90,
    ticketTypes: [
      { id: 'tt_dd_std', name: 'In-person', price: 89, capacity: 90 },
    ],
    sessions: [
      { id: uid('s_'), title: 'Case study: Inbox redesign', startTime: iso(8, 13, 30), endTime: iso(8, 14, 15) },
      { id: uid('s_'), title: 'Case study: Onboarding flows', startTime: iso(8, 14, 30), endTime: iso(8, 15, 15) },
      { id: uid('s_'), title: 'Case study: Pricing pages', startTime: iso(8, 15, 30), endTime: iso(8, 16, 15) },
    ],
    vendors: [],
    status: 'live',
  },
];

export function ensureSeed() {
  if (localStorage.getItem(SEED_FLAG)) return;

  // users
  DEMOS.forEach(u => db.upsertUser(u));

  // events
  const events: EventDoc[] = EVENTS_SEED.map((e, i) => ({
    ...e,
    id: 'evt_' + (i + 1).toString().padStart(2, '0'),
    createdAt: new Date(Date.now() - (EVENTS_SEED.length - i) * 86400000).toISOString(),
  }));
  events.forEach(e => db.upsertEvent(e));

  // rsvps — distribute across events using attendee accounts
  const attendees = DEMOS.filter(u => u.role === 'attendee');
  const rsvps: Rsvp[] = [];
  events.forEach((e, eIdx) => {
    // 4–8 RSVPs per event
    const count = 4 + (eIdx % 5);
    for (let i = 0; i < count; i++) {
      const att = attendees[(i + eIdx) % attendees.length];
      const tt = e.ticketTypes[i % e.ticketTypes.length];
      rsvps.push({
        id: uid('rsvp_'),
        eventId: e.id,
        attendeeId: att.id,
        attendeeName: att.name,
        attendeeEmail: att.email,
        ticketTypeId: tt.id,
        ticketCode: ticketCode(),
        status: 'going',
        createdAt: new Date(Date.now() - i * 3600_000).toISOString(),
      });
    }
    // ensure the primary attendee account has at least one rsvp on key events
    if (eIdx < 4) {
      rsvps.push({
        id: uid('rsvp_'),
        eventId: e.id,
        attendeeId: 'u_attendee',
        attendeeName: 'Sam Rivera',
        attendeeEmail: 'attendee@eventdock.demo',
        ticketTypeId: e.ticketTypes[0].id,
        ticketCode: ticketCode(),
        status: 'going',
        createdAt: new Date().toISOString(),
      });
    }
  });
  rsvps.forEach(r => db.upsertRsvp(r));

  localStorage.setItem(SEED_FLAG, '1');
}

export function resetSeed() {
  localStorage.removeItem(SEED_FLAG);
  localStorage.removeItem('eventdock:auth');
  // also clear tour-seen flags
  ['attendee', 'organizer', 'admin'].forEach(r => localStorage.removeItem(`eventdock:tutorial_seen:${r}`));
  db.reset();
  ensureSeed();
}
