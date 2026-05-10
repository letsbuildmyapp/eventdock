/**
 * Local AI simulation. Streams fixture text at ~30–50 chars/sec via setInterval
 * so the UX feels real. No live LLM calls.
 */
import type { EventDoc, EventCategory } from './types';

// ---------- streamText helper ----------

export function streamText(
  text: string,
  onChunk: (full: string) => void,
  onDone?: () => void,
): () => void {
  let i = 0;
  const tickMs = 28; // ~36 chars/sec average
  const id = window.setInterval(() => {
    // 1–3 chars per tick for a natural variable cadence
    i = Math.min(text.length, i + 1 + Math.floor(Math.random() * 3));
    onChunk(text.slice(0, i));
    if (i >= text.length) {
      window.clearInterval(id);
      onDone?.();
    }
  }, tickMs);
  return () => window.clearInterval(id);
}

// ---------- 1) Event copy writer ----------

export type CopyDraft = {
  titleOptions: string[];
  subheadline: string;
  description: string; // markdown
  socialVariants: string[];
};

const COPY_FIXTURES: Record<EventCategory, CopyDraft> = {
  conference: {
    titleOptions: [
      'Shipping Live · A Day for Builders',
      'Forward/Slash — A Conference for Senior ICs',
      'The Working Code Summit',
    ],
    subheadline: 'A no-keynote, no-influencer day for engineers who actually deploy.',
    description: [
      "Two days. Three tracks. One rule: every talk has to come from someone who shipped the thing they're talking about.",
      '',
      "We're pulling together senior engineers, lead designers, and product folks who run small teams that move fast — and asking them to share the actual mechanics. Not the slide deck. The pull request, the on-call rotation, the post-mortem.",
      '',
      "Hallway track is the main track. Demos run all afternoon. Coffee is excellent. Lunch is actually included.",
    ].join('\n'),
    socialVariants: [
      "We're hosting a two-day conference for engineers who deploy on Fridays. No keynote influencers. Just builders. Tickets are open.",
      "Tired of conferences that are 80% sponsor pitches? Same. We built ours different. Senior ICs, real demos, hallway-track-first. Two days, ~300 people.",
      "Independent two-day conference for working engineers. Three tracks, one rule: every speaker shipped the thing they're speaking about. Apply for a ticket.",
    ],
  },
  wedding: {
    titleOptions: [
      'A & B — Lakeside in July',
      'The Wedding (Casual Elegance)',
      'Coming Together — Two Days at the Lake',
    ],
    subheadline: "We're getting married, and you're invited.",
    description: [
      "It's been a while in the making, and we'd love to have you there.",
      '',
      "Plan on a Saturday afternoon ceremony, a long cocktail hour by the water, dinner with toasts that won't take three hours, dancing past midnight, and a late-night ramen bar for anyone still standing.",
      '',
      "Black-tie optional, comfortable shoes mandatory. RSVP below — we'll send the address and timing once we have your name on the list.",
    ].join('\n'),
    socialVariants: [
      "If you're getting an EventDock link from us this week — yes, that's the wedding RSVP. Tickets are free. Plus-ones welcome with a note.",
      "Sending official invites this weekend. Save the date is now an RSVP page (because we're nerds). See you on the water.",
      "We're keeping the guest list tight (~140) and the dance floor large. RSVP closes 30 days before so we can finalize the kitchen.",
    ],
  },
  fundraiser: {
    titleOptions: [
      "Raise the Roof — A Night for the Library",
      "Our Annual Benefit",
      "Books on the Block — A Live Auction Evening",
    ],
    subheadline: 'One night. One mission. Real money for the children\'s wing.',
    description: [
      "Help us reopen the wing. Every ticket funds one new library card holder for a year — that's the math we ran with the board, and we'll show you the receipts.",
      '',
      "Live auction with three big-ticket items donated by local artists. Author readings between rounds. Dessert reception at the back of the reading room. The kids' table will have its own auction (lower stakes, higher whimsy).",
      '',
      "Patron tickets seat eight at a reserved table near the stage. Supporter tickets get the run of the room. Kids under 12 are free, and we'll have storytelling in the side gallery for anyone who needs a quiet hour.",
    ].join('\n'),
    socialVariants: [
      "Our annual library benefit is back. Live auction, author readings, real dessert. Every ticket = one library card holder for a year.",
      "If you've never been to a fundraiser that actually felt like a party, this is the one. Tickets and tables open now.",
      "We need to raise $80K to reopen the children's wing. Tickets are $75. Tables of 8 are $800. Auction items dropping next week.",
    ],
  },
  workshop: {
    titleOptions: [
      'Hands-On — A Working Sunday',
      'The Long Workshop · Six Hours, Eight People',
      "Practice Day",
    ],
    subheadline: 'A small workshop for people who learn by making.',
    description: [
      "We meet at 10am, work until 4pm with a long lunch in the middle, and you leave with the thing you came to make.",
      '',
      "Materials are included. Coffee is constant. The space sits eight, and we like it that way — it means you'll have time and attention from the instructor without feeling crowded.",
      '',
      "Sign up below. If we sell out, we'll add a second date and email everyone on the waitlist first.",
    ].join('\n'),
    socialVariants: [
      "Small workshop, eight seats, one Sunday. Materials, lunch, and an instructor who's actually teaching the whole time.",
      "If you've been meaning to learn this and never blocked the time — block it. October Sunday, 10–4, in person.",
      "Eight-person workshop opens for sign-up tomorrow. We sold out in three days last quarter.",
    ],
  },
  art_opening: {
    titleOptions: [
      "First Look — New Work by [Artist]",
      "A Night at the Studio",
      "Soft Opening — Spring Series",
    ],
    subheadline: "New paintings, new prints, and a glass of wine.",
    description: [
      "Drop by between 6 and 9pm to walk through the new series before it goes up to the public.",
      '',
      "Wine, snacks, and the artist on the floor for the full three hours. Prints will be available at opening-night pricing — about 20% under what they'll be marked at later in the run.",
      '',
      "RSVP isn't required, but it helps with the wine count. The studio is a few stairs up; the freight elevator is open if anyone needs it.",
    ].join('\n'),
    socialVariants: [
      "Opening this Friday, 6–9. New series, new prints, the artist on the floor. RSVP for a wine count.",
      "Soft opening this week. Prints available at first-look pricing. Drop by anytime in the window.",
      "Walk-throughs all night. Wine, snacks, the work. Bring a friend who hasn't been to the studio yet.",
    ],
  },
  brand_launch: {
    titleOptions: [
      "Hello, World — Launch Night",
      "We Made a Thing. Come See.",
      "Day One",
    ],
    subheadline: "We've been working on this for a year. Tonight you get to see it.",
    description: [
      "Doors at 7. Brief remarks at 7:45. The product on display from 8 onward. We'll have demos, the team in person to answer anything, and a small bar at the back.",
      '',
      "Press and partners RSVP via the patron tier — we'll have a quiet room set aside for one-on-one conversations. Everyone else, the floor is yours.",
      '',
      "Dress is whatever you wore to work, plus a jacket. We'll have lapel pins for the first 100 through the door.",
    ].join('\n'),
    socialVariants: [
      "We're launching next Thursday. Demos, the team, a small bar. RSVP if you'd like to come.",
      "A year of work. One launch night. Doors at 7, demos all night. Limited capacity — RSVP early.",
      "Bringing the curtain up next week. Press and partners get a quiet room; everyone else gets the floor.",
    ],
  },
  fitness_retreat: {
    titleOptions: [
      "Long Weekend — A Movement Retreat",
      "Three Days, No Wifi",
      "The Practice Weekend",
    ],
    subheadline: "Three days of long mornings, slower afternoons, and meals together.",
    description: [
      "We meet Friday afternoon, and we don't leave until Sunday after lunch. Mornings are long movement sessions — strength, breath, mobility — outside when the weather plays along, inside when it doesn't.",
      '',
      "Afternoons are open. Walks, books, naps, the lake. Dinner is communal at a long table; we eat what the chef cooks and the chef cooks well.",
      '',
      "Twelve spots total, single-occupancy rooms included. Vegetarian by default; we accommodate any restriction with notice.",
    ].join('\n'),
    socialVariants: [
      "Three days, twelve people, one chef, no wifi. Long movement mornings, slow afternoons, communal dinners. Sign up below.",
      "We're running the retreat again in October. Twelve spots, single rooms, all meals. Last one sold out in two weeks.",
      "Friday-to-Sunday movement retreat. Strength, breath, mobility — no perfection required. Vegetarian meals, comfortable rooms, real rest.",
    ],
  },
};

export function generateEventCopy(category: EventCategory): CopyDraft {
  return COPY_FIXTURES[category] ?? COPY_FIXTURES.conference;
}

// ---------- 2) Attendee Q&A bot ----------

export type ChatReply = {
  reply: string;
  forwardToOrganizer?: boolean;
};

export function answerQuestion(question: string, event: EventDoc): ChatReply {
  const q = question.toLowerCase();
  const fmtDate = new Date(event.date).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const fmtEnd = new Date(event.endDate).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  // 1) When / time / start / end
  if (/(when|what time|start|begin|end|hour|date)/.test(q)) {
    return {
      reply: `It starts ${fmtDate} and runs through ${fmtEnd}. Doors open about 15 minutes before — turn up early if you'd like to settle in without rushing.`,
    };
  }

  // 2) Where / location / address / venue
  if (/(where|location|address|venue|directions|parking)/.test(q)) {
    const addr = event.venueAddress ? `\n\nAddress: ${event.venueAddress}` : '';
    return {
      reply: `${event.title} is at ${event.location}.${addr}\n\nWe'll send the exact entrance details and any parking notes in the day-before email.`,
    };
  }

  // 3) Tickets / cost / price / refund
  if (/(refund|cancel|money back|change)/.test(q)) {
    return {
      reply: `Yes — you can request a refund from your ticket page in My events. Refunds are open until 24 hours before the event starts. After that we hold the seat for you regardless.`,
    };
  }
  if (/(ticket|cost|price|how much|buy|paid)/.test(q)) {
    const tickets = event.ticketTypes.map(t => `  · ${t.name} — ${t.price === 0 ? 'free RSVP' : '$' + t.price.toFixed(2)}`).join('\n');
    return {
      reply: `Here's what's on offer:\n\n${tickets}\n\nGrab whichever fits and you'll get a QR ticket immediately.`,
    };
  }

  // 4) Schedule / sessions / agenda
  if (/(schedule|agenda|sessions|talks|program|line.?up)/.test(q)) {
    if (event.sessions.length === 0) {
      return { reply: 'There isn\'t a fixed schedule — it\'s a more open format. Show up anytime in the window and explore at your own pace.' };
    }
    const s = event.sessions.slice(0, 4).map(x => `  · ${x.title}${x.startTime ? ' — ' + new Date(x.startTime).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}`).join('\n');
    return {
      reply: `Here are the headline sessions:\n\n${s}\n\nFull schedule lives on the event page above the RSVP rail.`,
    };
  }

  // 5) Capacity / sold out / spots
  if (/(spots? left|capacity|sold out|space|room|how many)/.test(q)) {
    return {
      reply: `Capacity is ${event.capacity}. Live count is on the page above. If a tier sells out, we open a waitlist — just RSVP for any free tier and we'll let you know if a paid spot frees up.`,
    };
  }

  // 6) Dress code / what to bring
  if (/(dress|wear|bring|what.+to.+(wear|bring))/.test(q)) {
    return {
      reply: `Comfortable layers and a phone for your QR ticket. Some events have specific notes on dress in the description above — give that a quick scan.`,
    };
  }

  // 7) Contact / organizer / question
  if (/(contact|organizer|email|reach)/.test(q)) {
    return {
      reply: `The organizer is reachable through this chat — anything that needs a personal reply goes to their inbox. Otherwise the info on this page is the canonical reference.`,
    };
  }

  // 8) Greeting
  if (/^(hi|hey|hello|yo|sup|hiya)\b/.test(q)) {
    return { reply: `Hi! Ask me anything about ${event.title} — when it starts, where it is, what tickets are available, schedule, dress, refunds. I'll do my best.` };
  }

  // Fallback — forward to organizer
  return {
    reply: `Good question — that one's specific enough that I'd rather not guess. I've forwarded it to the organizer, and they'll reply within a day. In the meantime, the event description and schedule above might have more context.`,
    forwardToOrganizer: true,
  };
}
