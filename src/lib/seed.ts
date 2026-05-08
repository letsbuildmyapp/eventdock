import { db } from './store';
import type { EventDoc, Rsvp, User, Organization, RsvpStatus } from './types';
import { ticketCode, uid } from './utils';
import { appendEmail } from './email';

const SEED_FLAG = 'eventdock:seeded:v4';

function iso(daysFromNow: number, hour = 18, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function isoMinutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

function isoDaysAgo(days: number, hour = 9, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const DEMOS: User[] = [
  { id: 'u_attendee', email: 'attendee@eventdock.demo', name: 'Sam Rivera', role: 'attendee' },
  { id: 'u_organizer', email: 'organizer@eventdock.demo', name: 'Maya Chen', role: 'organizer', orgId: 'org_chen' },
  { id: 'u_admin', email: 'admin@eventdock.demo', name: 'Jordan Park', role: 'admin' },
  { id: 'u_org_2', email: 'leo@eventdock.demo', name: 'Leo Okonkwo', role: 'organizer', orgId: 'org_okonkwo' },
  { id: 'u_org_3', email: 'priya@eventdock.demo', name: 'Priya Shah', role: 'organizer', orgId: 'org_shah' },
  { id: 'u_org_4', email: 'devon@eventdock.demo', name: 'Devon Hart', role: 'organizer', orgId: 'org_hart' },
  { id: 'u_a2', email: 'dana@eventdock.demo', name: 'Dana Liu', role: 'attendee' },
  { id: 'u_a3', email: 'tariq@eventdock.demo', name: 'Tariq Wells', role: 'attendee' },
  { id: 'u_a4', email: 'noor@eventdock.demo', name: 'Noor Patel', role: 'attendee' },
  { id: 'u_a5', email: 'kai@eventdock.demo', name: 'Kai Brennan', role: 'attendee' },
  { id: 'u_a6', email: 'maren@eventdock.demo', name: 'Maren Cobb', role: 'attendee' },
  { id: 'u_a7', email: 'jules@eventdock.demo', name: 'Jules Park', role: 'attendee' },
];

const ORGS: Organization[] = [
  { id: 'org_chen', name: 'Forward Slash Studio', ownerId: 'u_organizer', tier: 'pro', tierUpdatedAt: isoDaysAgo(40) },
  { id: 'org_okonkwo', name: 'Lakeside Productions', ownerId: 'u_org_2', tier: 'starter', tierUpdatedAt: isoDaysAgo(15) },
  { id: 'org_shah', name: 'Riverside Programs', ownerId: 'u_org_3', tier: 'scale', tierUpdatedAt: isoDaysAgo(120) },
  { id: 'org_hart', name: 'Hart Floral & Events', ownerId: 'u_org_4', tier: 'pro', tierUpdatedAt: isoDaysAgo(85) },
];

const EVENTS_SEED: Omit<EventDoc, 'id' | 'createdAt'>[] = [
  // 0 — Happening today (mid-event)
  {
    organizerId: 'u_organizer',
    title: 'StackForward 2026',
    slug: 'stackforward-2026',
    category: 'conference',
    coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80',
    description:
      "A two-day independent conference for shipping engineers. No keynote influencers — just builders who deploy on Fridays. Talks on local-first apps, agentic coding workflows, and the new wave of small teams.",
    date: iso(0, 9, 0),
    endDate: iso(1, 18, 0),
    location: 'Brooklyn, NY',
    venueAddress: '99 Commercial St, Brooklyn, NY 11222',
    capacity: 320,
    ticketTypes: [
      { id: 'tt_sf_early', name: 'Early bird', price: 199, capacity: 100 },
      { id: 'tt_sf_std', name: 'Standard', price: 299, capacity: 180 },
      { id: 'tt_sf_team', name: 'Team of 4', price: 999, capacity: 40 },
    ],
    sessions: [
      { id: uid('s_'), title: 'Opening — Why small teams won', startTime: iso(0, 9, 30), endTime: iso(0, 10, 15), speaker: 'Maya Chen', location: 'Main Hall' },
      { id: uid('s_'), title: 'Local-first, deploy never', startTime: iso(0, 10, 30), endTime: iso(0, 11, 15), speaker: 'Leo Okonkwo', location: 'Main Hall' },
      { id: uid('s_'), title: 'Agentic codebases in production', startTime: iso(0, 13, 0), endTime: iso(0, 13, 45), speaker: 'Priya Shah', location: 'Studio B' },
      { id: uid('s_'), title: 'Hallway track + demos', startTime: iso(0, 16, 0), endTime: iso(0, 18, 0), location: 'Atrium' },
    ],
    vendors: [
      {
        id: uid('v_'), name: 'Joe Coffee', category: 'Catering', contact: 'events@joecoffee.com', status: 'confirmed',
        notes: 'Both days, 8a–5p',
        tasks: [
          { id: uid('vt_'), title: 'Confirm pour-over count', dueDate: isoDaysAgo(2), status: 'done' },
          { id: uid('vt_'), title: 'Send vendor parking pass', dueDate: isoDaysAgo(1), status: 'done' },
          { id: uid('vt_'), title: 'Pickup empty kegs end of day 2', dueDate: iso(1, 19, 0), status: 'pending' },
        ],
      },
      {
        id: uid('v_'), name: 'NorthStar A/V', category: 'A/V', contact: 'crew@northstar-av.com', status: 'confirmed',
        tasks: [
          { id: uid('vt_'), title: 'Mic check at 7am', dueDate: iso(0, 7, 0), status: 'done' },
          { id: uid('vt_'), title: 'Move stage lighting to Studio B at lunch', dueDate: iso(0, 12, 30), status: 'in_progress' },
        ],
      },
      {
        id: uid('v_'), name: 'Pixel Print', category: 'Signage', contact: 'orders@pixelprint.co', status: 'confirmed',
        tasks: [
          { id: uid('vt_'), title: 'Reprint the schedule poster', dueDate: isoDaysAgo(0), status: 'done' },
        ],
      },
    ],
    status: 'featured',
  },
  // 1 — Wedding, free RSVPs
  {
    organizerId: 'u_org_2',
    title: 'Wren & Daniel — Lakeside Wedding',
    slug: 'wren-daniel-wedding',
    category: 'wedding',
    coverImage: 'https://images.unsplash.com/photo-1714972383570-44ddc9738355?auto=format&fit=crop&w=1600&q=80',
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
      {
        id: uid('v_'), name: 'Field & Vine Catering', category: 'Catering', contact: 'hello@fieldandvine.com', status: 'confirmed',
        tasks: [
          { id: uid('vt_'), title: 'Final headcount lockdown', dueDate: iso(35, 17, 0), status: 'pending' },
          { id: uid('vt_'), title: 'Tasting at the studio', dueDate: iso(20, 18, 0), status: 'pending' },
        ],
      },
      { id: uid('v_'), name: 'DJ Halcyon', category: 'Music', contact: 'book@djhalcyon.fm', status: 'confirmed', tasks: [] },
      { id: uid('v_'), name: 'Iris & Oak Florals', category: 'Florals', contact: 'studio@irisandoak.com', status: 'invited', tasks: [] },
      { id: uid('v_'), name: 'Bea Hayashi Photo', category: 'Photography', contact: 'bea@hayashiphoto.com', status: 'confirmed', tasks: [] },
    ],
    status: 'live',
  },
  // 2 — Fundraiser
  {
    organizerId: 'u_org_3',
    title: 'Riverside Public Library — Annual Benefit',
    slug: 'riverside-library-benefit',
    category: 'fundraiser',
    coverImage: 'https://images.unsplash.com/photo-1568667256549-094345857637?auto=format&fit=crop&w=1600&q=80',
    description:
      "Help us reopen the children's wing. Live auction, readings from local authors, dessert reception. Every ticket funds one new library card holder for a year.",
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
      { id: uid('v_'), name: 'Sweet Maple Bakery', category: 'Catering', contact: 'orders@sweetmaple.bake', status: 'confirmed', tasks: [] },
      { id: uid('v_'), name: 'Hearthstone Auctions', category: 'Auctioneer', contact: 'contact@hearthstone.bid', status: 'confirmed', tasks: [] },
    ],
    status: 'live',
  },
  // 3 — Indie conference
  {
    organizerId: 'u_organizer',
    title: 'IndieHack Summit',
    slug: 'indiehack-summit',
    category: 'conference',
    coverImage: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1600&q=80',
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
      { id: uid('v_'), name: 'Tacodeli', category: 'Catering', contact: 'events@tacodeli.com', status: 'confirmed', tasks: [] },
    ],
    status: 'live',
  },
  // 4 — Garden wedding
  {
    organizerId: 'u_org_4',
    title: 'Aliya & Sam — Garden Party Wedding',
    slug: 'aliya-sam-wedding',
    category: 'wedding',
    coverImage: 'https://images.unsplash.com/photo-1595407753234-0882f1e77954?auto=format&fit=crop&w=1600&q=80',
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
      { id: uid('v_'), name: 'Foxglove Florals', category: 'Florals', contact: 'hello@foxgloveflorals.co', status: 'confirmed', tasks: [] },
    ],
    status: 'live',
  },
  // 5 — Hackathon for climate (fundraiser)
  {
    organizerId: 'u_org_3',
    title: 'Code for the Coast — Hackathon for Climate',
    slug: 'code-for-the-coast',
    category: 'fundraiser',
    coverImage: 'https://images.unsplash.com/photo-1648501406936-43e844acce29?auto=format&fit=crop&w=1600&q=80',
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
      { id: uid('v_'), name: 'Coffee By Design', category: 'Catering', contact: 'events@coffeebydesign.com', status: 'confirmed', tasks: [] },
    ],
    status: 'live',
  },
  // 6 — Workshop (NEW category)
  {
    organizerId: 'u_organizer',
    title: 'Hand-Lettering Sunday — Six Hours, Eight People',
    slug: 'hand-lettering-sunday',
    category: 'workshop',
    coverImage: 'https://images.unsplash.com/photo-1586538883481-8ccbcff0b39d?auto=format&fit=crop&w=1600&q=80',
    description:
      'A small workshop for people who learn by making. Materials provided, lunch included, eight seats only. You leave with a finished piece and the sketch journal we built it in.',
    date: iso(18, 10, 0),
    endDate: iso(18, 16, 0),
    location: 'San Francisco, CA',
    capacity: 8,
    ticketTypes: [
      { id: 'tt_hl_std', name: 'Workshop seat', price: 175, capacity: 8 },
    ],
    sessions: [
      { id: uid('s_'), title: 'Warm-up + introductions', startTime: iso(18, 10, 0), endTime: iso(18, 10, 30) },
      { id: uid('s_'), title: 'Block one — letterforms', startTime: iso(18, 10, 30), endTime: iso(18, 12, 0) },
      { id: uid('s_'), title: 'Lunch', startTime: iso(18, 12, 0), endTime: iso(18, 13, 0) },
      { id: uid('s_'), title: 'Block two — composition', startTime: iso(18, 13, 0), endTime: iso(18, 16, 0) },
    ],
    vendors: [],
    status: 'live',
  },
  // 7 — Art opening (NEW category)
  {
    organizerId: 'u_org_4',
    title: 'First Look — Maren Cobb, Spring Series',
    slug: 'maren-cobb-spring',
    category: 'art_opening',
    coverImage: 'https://images.unsplash.com/photo-1774021803269-b1d0f92aaa07?auto=format&fit=crop&w=1600&q=80',
    description:
      'New paintings and prints from Maren Cobb. Drop by between 6 and 9pm to walk through the new series before it goes up to the public. Wine, snacks, the artist on the floor for the full three hours.',
    date: iso(11, 18, 0),
    endDate: iso(11, 21, 0),
    location: 'Hudson, NY',
    capacity: 120,
    ticketTypes: [
      { id: 'tt_mc_open', name: 'Opening night', price: 0, capacity: 100 },
      { id: 'tt_mc_patron', name: 'Patron (early entry + print)', price: 250, capacity: 20 },
    ],
    sessions: [
      { id: uid('s_'), title: 'Patron preview', startTime: iso(11, 17, 30), endTime: iso(11, 18, 0) },
      { id: uid('s_'), title: 'Doors open to all', startTime: iso(11, 18, 0), endTime: iso(11, 21, 0) },
    ],
    vendors: [
      { id: uid('v_'), name: 'Bayard Wine Co.', category: 'Catering', contact: 'orders@bayardwine.co', status: 'confirmed', tasks: [] },
    ],
    status: 'live',
  },
  // 8 — Brand launch (NEW category)
  {
    organizerId: 'u_organizer',
    title: 'Hello, World — Forward Slash Launch Night',
    slug: 'forward-slash-launch',
    category: 'brand_launch',
    coverImage: 'https://images.unsplash.com/photo-1561489401-fc2876ced162?auto=format&fit=crop&w=1600&q=80',
    description:
      "We've been working on this for a year. Tonight you get to see it. Doors at 7, brief remarks at 7:45, demos and the team on the floor from 8 onward. Press and partners get a quiet room set aside.",
    date: iso(28, 19, 0),
    endDate: iso(28, 22, 30),
    location: 'New York, NY',
    capacity: 220,
    ticketTypes: [
      { id: 'tt_fs_press', name: 'Press / partner', price: 0, capacity: 40 },
      { id: 'tt_fs_general', name: 'General admission', price: 35, capacity: 180 },
    ],
    sessions: [
      { id: uid('s_'), title: 'Doors open', startTime: iso(28, 19, 0), endTime: iso(28, 19, 30) },
      { id: uid('s_'), title: 'Remarks', startTime: iso(28, 19, 45), endTime: iso(28, 20, 15) },
      { id: uid('s_'), title: 'Demo floor', startTime: iso(28, 20, 15), endTime: iso(28, 22, 30) },
    ],
    vendors: [],
    status: 'live',
  },
  // 9 — Fitness retreat (NEW category)
  {
    organizerId: 'u_org_4',
    title: 'Long Weekend — A Movement Retreat',
    slug: 'long-weekend-movement',
    category: 'fitness_retreat',
    coverImage: 'https://images.unsplash.com/photo-1758797315487-b3b225dff7d8?auto=format&fit=crop&w=1600&q=80',
    description:
      "Three days of long mornings, slower afternoons, and meals together. Twelve people, one chef, one lake. Friday afternoon to Sunday after lunch.",
    date: iso(50, 14, 0),
    endDate: iso(52, 14, 0),
    location: 'Saugerties, NY',
    capacity: 12,
    ticketTypes: [
      { id: 'tt_mr_single', name: 'Single occupancy', price: 1200, capacity: 8 },
      { id: 'tt_mr_double', name: 'Shared (per person)', price: 850, capacity: 4 },
    ],
    sessions: [
      { id: uid('s_'), title: 'Welcome circle', startTime: iso(50, 16, 0), endTime: iso(50, 17, 0) },
      { id: uid('s_'), title: 'Saturday morning practice', startTime: iso(51, 7, 30), endTime: iso(51, 9, 30) },
      { id: uid('s_'), title: 'Sunday closing', startTime: iso(52, 11, 0), endTime: iso(52, 13, 0) },
    ],
    vendors: [
      { id: uid('v_'), name: 'Chef Hana Bao', category: 'Catering', contact: 'hana@kitchencircle.studio', status: 'confirmed', tasks: [] },
    ],
    status: 'live',
  },
  // 10 — Past event for the recap demo
  {
    organizerId: 'u_organizer',
    title: 'DesignDocs Quarterly · Q1',
    slug: 'designdocs-quarterly-q1',
    category: 'conference',
    coverImage: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1600&q=80',
    description:
      'A quarterly half-day for senior product designers who actually ship. Three case studies, no Figma plugins.',
    date: isoDaysAgo(20, 13, 0),
    endDate: isoDaysAgo(20, 18, 0),
    location: 'San Francisco, CA',
    capacity: 90,
    ticketTypes: [
      { id: 'tt_dd_std', name: 'In-person', price: 89, capacity: 90 },
    ],
    sessions: [
      { id: uid('s_'), title: 'Case study: Inbox redesign', startTime: isoDaysAgo(20, 13, 30), endTime: isoDaysAgo(20, 14, 15) },
      { id: uid('s_'), title: 'Case study: Onboarding flows', startTime: isoDaysAgo(20, 14, 30), endTime: isoDaysAgo(20, 15, 15) },
      { id: uid('s_'), title: 'Case study: Pricing pages', startTime: isoDaysAgo(20, 15, 30), endTime: isoDaysAgo(20, 16, 15) },
    ],
    vendors: [],
    status: 'live',
  },
];

// ---------------------------------------------------------------------------
// Seed runner
// ---------------------------------------------------------------------------

export function ensureSeed() {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SEED_FLAG)) return;

  // users
  DEMOS.forEach(u => db.upsertUser(u));

  // organizations
  ORGS.forEach(o => db.upsertOrganization(o));

  // events
  const events: EventDoc[] = EVENTS_SEED.map((e, i) => ({
    ...e,
    id: 'evt_' + (i + 1).toString().padStart(2, '0'),
    createdAt: new Date(Date.now() - (EVENTS_SEED.length - i) * 86400000).toISOString(),
  }));
  events.forEach(e => db.upsertEvent(e));

  // RSVPs — distribute across events with realistic statuses + paid records.
  const attendees = DEMOS.filter(u => u.role === 'attendee');
  const primary = DEMOS.find(u => u.id === 'u_attendee')!;
  const rsvps: Rsvp[] = [];

  events.forEach((e, eIdx) => {
    const baseCount = 5 + (eIdx % 6); // 5–10 per event
    for (let i = 0; i < baseCount; i++) {
      const att = attendees[(i + eIdx) % attendees.length];
      const tt = e.ticketTypes[i % e.ticketTypes.length];
      const isHappeningToday = eIdx === 0;
      // Vary statuses: some checked_in (today only), some cancelled (3% chance), one refunded for paid events 1+ days out.
      let status: RsvpStatus = 'going';
      if (isHappeningToday && i < Math.floor(baseCount * 0.55)) status = 'checked_in';
      const cancelled = !isHappeningToday && i === baseCount - 1 && eIdx % 3 === 0;
      if (cancelled) status = 'cancelled';

      const r: Rsvp = {
        id: uid('rsvp_'),
        eventId: e.id,
        attendeeId: att.id,
        attendeeName: att.name,
        attendeeEmail: att.email,
        ticketTypeId: tt.id,
        ticketCode: ticketCode(),
        status,
        createdAt: new Date(Date.now() - (i + 1) * 8 * 3600_000).toISOString(),
        ...(tt.price > 0 ? { pricePaidCents: Math.round(tt.price * 100), paidAt: new Date(Date.now() - (i + 1) * 8 * 3600_000).toISOString(), refundStatus: 'none' as const } : {}),
        ...(status === 'checked_in' ? { checkedInAt: isoMinutesAgo(20 + i * 8) } : {}),
      };
      rsvps.push(r);
    }

    // Always include the primary attendee on the first 4 events
    if (eIdx < 4) {
      const tt = e.ticketTypes[0];
      rsvps.push({
        id: uid('rsvp_'),
        eventId: e.id,
        attendeeId: primary.id,
        attendeeName: primary.name,
        attendeeEmail: primary.email,
        ticketTypeId: tt.id,
        ticketCode: ticketCode(),
        status: 'going',
        createdAt: new Date().toISOString(),
        ...(tt.price > 0 ? { pricePaidCents: Math.round(tt.price * 100), paidAt: new Date().toISOString(), refundStatus: 'none' as const } : {}),
      });
    }
  });

  // Add a pending refund request on a paid event (StackForward)
  const refundCandidate = rsvps.find(r => r.eventId === 'evt_01' && (r.pricePaidCents ?? 0) > 0);
  if (refundCandidate) {
    refundCandidate.refundStatus = 'pending';
    refundCandidate.refundRequestedAt = isoMinutesAgo(45);
  }
  rsvps.forEach(r => db.upsertRsvp(r));

  // Email outbox — pre-populated mix
  seedOutbox(events, rsvps);

  localStorage.setItem(SEED_FLAG, '1');
}

function seedOutbox(events: EventDoc[], rsvps: Rsvp[]) {
  // Confirmations across the catalog
  rsvps.slice(0, 14).forEach((r, i) => {
    const e = events.find(x => x.id === r.eventId);
    if (!e) return;
    appendEmail({
      to: r.attendeeEmail,
      subject: `${(r.pricePaidCents ?? 0) > 0 ? 'Receipt' : 'Confirmed'}: ${e.title}`,
      kind: 'confirmation',
      sentAt: new Date(Date.now() - (i + 2) * 6 * 3600_000).toISOString(),
      body: [
        `Hi ${r.attendeeName},`,
        '',
        (r.pricePaidCents ?? 0) > 0
          ? `You're in. We've charged $${((r.pricePaidCents ?? 0) / 100).toFixed(2)} to your card on file.`
          : `You're on the list for ${e.title}.`,
        '',
        `Where: ${e.location}`,
        `When: ${new Date(e.date).toLocaleString()}`,
        `Ticket code: ${r.ticketCode}`,
        '',
        '— EventDock',
      ].join('\n'),
    });
  });

  // Day-before reminders for events happening within ~48 hours
  events
    .filter(e => {
      const ms = new Date(e.date).getTime() - Date.now();
      return ms > 0 && ms < 48 * 3600_000;
    })
    .forEach((e) => {
      const guests = rsvps.filter(r => r.eventId === e.id && r.status === 'going').slice(0, 4);
      guests.forEach((r) => {
        appendEmail({
          to: r.attendeeEmail,
          subject: `Tomorrow: ${e.title}`,
          kind: 'day_before',
          sentAt: isoMinutesAgo(60 * 8),
          body: `Hi ${r.attendeeName},\n\nQuick reminder — ${e.title} is tomorrow.\n\nWhere: ${e.location}\nWhen: ${new Date(e.date).toLocaleString()}\nTicket: ${r.ticketCode}\n\nBring layers; the venue runs cool.\n\n— EventDock`,
        });
      });
    });

  // Post-event follow-ups for the past event
  const past = events.find(e => new Date(e.date) < new Date());
  if (past) {
    rsvps.filter(r => r.eventId === past.id).slice(0, 6).forEach((r) => {
      appendEmail({
        to: r.attendeeEmail,
        subject: `Thanks for coming to ${past.title}`,
        kind: 'post_event',
        sentAt: new Date(new Date(past.date).getTime() + 24 * 3600_000).toISOString(),
        body: `Hi ${r.attendeeName},\n\nThanks for coming to ${past.title}. Recordings drop next week — we'll send a link.\n\nIf you have a minute, the post-event survey is two questions: https://eventdock.demo/survey\n\n— EventDock`,
      });
    });
  }
}

export function resetSeed() {
  // Clear every eventdock:* key in one pass
  if (typeof window === 'undefined') return;
  const ls = window.localStorage;
  const remove: string[] = [];
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (k && k.startsWith('eventdock:')) remove.push(k);
  }
  remove.forEach(k => ls.removeItem(k));
  ensureSeed();
}
