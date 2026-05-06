# EventDock

Event management platform showcase for the LBMA portfolio. Conferences, weddings, and fundraisers — same toolkit, different skin.

**Live at:** _staging URL pending_

## Visual archetype

- **Archetype:** Playful illustrative (Eventbrite-meets-Notion)
- **Type:** Bricolage Grotesque (display) + Manrope (text)
- **Palette:** electric blue primary `#2563ff`, neon-yellow accent `#eaf53c`, off-white paper `#fafaf4`
- **Radius:** `rounded-2xl` to `rounded-3xl`
- **Signature:** hard offset shadows in ink, springy framer-motion micro-interactions, light/dark via CSS vars

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # produces /dist
```

The demo is fully functional from a fresh clone — no Firebase emulator required. Demo data is seeded into `localStorage` on first load. The data layer (`src/lib/store.ts`) is shaped to mirror Firestore so swapping in the real SDK is a 1:1 change.

To use Firebase emulators (config included):

```bash
firebase emulators:start --project demo-eventdock --only auth,firestore,functions
```

Hosting emulator runs on **port 5050** per project rule.

## Roles & demo accounts

Password for all demo accounts: **`demo1234`**

| Role | Email | Name | What they see |
|---|---|---|---|
| attendee | `attendee@eventdock.demo` | Sam Rivera | Browse, RSVP, QR ticket, My events |
| organizer | `organizer@eventdock.demo` | Maya Chen | Event creation, guest list, CSV export, check-in, reminders |
| admin | `admin@eventdock.demo` | Jordan Park | Platform stats, all events, feature/suspend |

Login screen has one-click demo tiles for each role.

## What's wired

- Email + Google sign in (Google is simulated — picks the organizer demo)
- Public event pages at `/e/:slug` (no auth required to view)
- RSVPs with QR-code tickets (`qrcode.react`)
- Cancel RSVP from My events (custom confirm modal — no native dialogs)
- Event creation form: title, date, capacity, ticket types, sessions, vendors
- Guest list with search + CSV export
- Mobile check-in screen with code entry, live attendance counters, recent log
- Reminder emails (queued to a local outbox; Cloud Function/Resend payload shape matches)
- Admin: feature/unfeature, suspend/reinstate, platform stats
- 5 / 5 / 5 step spotlight tour per role with viewport clamping + mobile fallback
- 404 + 500 designed pages
- Light + dark theme via CSS vars

## Tour storage keys

- `eventdock:tutorial_seen:attendee`
- `eventdock:tutorial_seen:organizer`
- `eventdock:tutorial_seen:admin`

To reset seed data (also clears tour flags):

```js
// in browser devtools
localStorage.clear(); location.reload();
```
