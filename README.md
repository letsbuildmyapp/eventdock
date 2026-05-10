# EventDock

Event management platform showcase for the LBMA portfolio. Conferences, weddings, fundraisers, workshops, art openings, brand launches, and fitness retreats — same toolkit, different skin.

EventDock is a sales-call demo. Click a role tile, run through the catalog, RSVP or buy a ticket, manage events, sync vendors, chat with the event AI. Every flow is fully functional in the browser — there is no real backend.

---

## Visual archetype

- **Archetype:** Playful illustrative (Eventbrite-meets-Notion)
- **Type:** Bricolage Grotesque (display) + Manrope (body)
- **Palette:** electric blue primary `#2563ff`, neon-yellow accent `#eaf53c`, off-white paper `#fafaf4`, ink `#12121b`
- **Radius:** `rounded-2xl` to `rounded-3xl`
- **Signature:** hard offset shadows in ink, springy framer-motion micro-interactions
- **Modes:** light + dark via CSS variables

---

## How it works

There is no Firebase Auth, no Firestore, no Cloud Functions, no Stripe API, no an LLM API. The whole demo runs in the browser:

- **Auth:** role-tile picker on `/login`. Three roles, no password, no signup.
- **Data:** localStorage under `eventdock:db:*`. Seed runs on first load via `eventdock:seeded:vN` sentinel.
- **Stripe:** "Buy ticket" and tier upgrades open a Stripe-styled checkout modal that runs a 1.2s processing animation, writes the order locally with a card-last-4 stub, fires a confirmation into the outbox.
- **AI features (Pro+ on the organizer side):**
  - **Event copy writer** — opens in the event editor; streams 3 title options, a hero subheadline, full description, and 3 social variants from `src/lib/aiFixtures.ts` at ~36 chars/sec.
  - **Attendee Q&A bot** — floating chat on the public event page. Keyword-matched fixture replies; out-of-scope questions are forwarded to the organizer's inbox as a real local-state action.
- **Email outbox:** `src/lib/email.ts` writes to localStorage. Pre-seeded with a mix of confirmations, reminders, day-before notices, post-event thanks, refund approvals. Admin "Outbox" tab lists all of them; per-event reminders surface in the organizer's event manage view.
- **Refunds:** attendees request from My events (within 24 hours of event start). Organizers see pending requests on the event manage page and approve in one click.
- **Vendors:** organizer-side coordination on each event — status pills (invited / confirmed / declined), per-vendor task lists with due dates and overdue flags.

Reset the demo from the link in the footer to start fresh.

---

## Roles

Land on `/login` and pick:

- **Sam Rivera · Attendee** — Browse the catalog, RSVP free, buy paid tickets, request refunds, chat with the event AI.
- **Maya Chen · Organizer** — Run events end-to-end. Create events with the AI copy writer, manage guest list, run check-in, send reminders, manage vendors and tasks, approve refunds, upgrade subscription tier.
- **Jordan Park · Admin** — Platform-wide stats, every event, feature/suspend, full transactional email log.

---

## Subscription tiers (organizer)

- **Starter** — Free. One active event at a time, free RSVPs and paid ticketing, guest list, check-in, manual reminders.
- **Pro** — $29/mo. Unlimited events, AI copy writer, AI Q&A bot, custom branding, scheduled reminders.
- **Scale** — $99/mo. Team accounts, white-label public pages, priority refund processing, vendor coordination dashboard.

Tier is set on the organization record in localStorage. Upgrades flow through the same Stripe-styled checkout modal as paid tickets.

---

## Run locally

```bash
npm install
npm run dev
```

Vite serves on `http://localhost:5173`. There is nothing else to run.

---

## Deploy

Two Firebase Hosting sites: `eventdock-lbma-staging` and `eventdock-lbma-prod`. Targets are pre-applied in `.firebaserc`.

```bash
npm run deploy:staging   # → https://eventdock-lbma-staging.web.app
npm run deploy:prod      # → https://eventdock-lbma-prod.web.app
```

Always staging first. Confirm at the staging URL, then prod.

---

## Tour

First-run interactive walkthrough lives in `src/components/Tutorial.tsx`. Per-role:

- **Attendee** (5 steps): welcome, browse, my events, QR ticket explainer, done.
- **Organizer** (5 steps): welcome, create event, guest list, mobile check-in, reminders.
- **Admin** (5 steps): welcome, platform stats, events table, suspend/feature, done.

Storage key: `eventdock:tutorial_seen:<role>`. The Reset demo button clears these so the tour replays.

---

## Stack

React 19 + TypeScript + Vite, Tailwind, React Router v7, Zustand (auth state), react-hook-form + zod, Framer Motion, lucide-react, sonner, qrcode.react, date-fns, cmdk. Firebase Hosting only.
