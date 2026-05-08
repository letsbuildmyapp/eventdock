/**
 * Local email outbox. Mirrors the shape of a Cloud Function payload so a real
 * Resend integration could swap in cleanly. Pre-seeded with realistic content
 * via lib/seed.ts so the admin outbox view feels lived-in.
 */
import type { EventDoc, Rsvp } from './types';

export type EmailKind = 'confirmation' | 'reminder' | 'day_before' | 'post_event' | 'refund_approved';

export type ReminderEmail = {
  id: string;
  to: string;
  subject: string;
  body: string;
  kind: EmailKind;
  sentAt: string;
};

const KEY = 'eventdock:outbox';

function readOutbox(): ReminderEmail[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}

function writeOutbox(rows: ReminderEmail[]) {
  localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 200)));
  window.dispatchEvent(new CustomEvent('eventdock:db:changed'));
}

export function listOutbox(): ReminderEmail[] {
  return readOutbox().sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}

export function appendEmail(msg: Omit<ReminderEmail, 'id' | 'sentAt'> & { sentAt?: string }): ReminderEmail {
  const email: ReminderEmail = {
    id: 'em_' + Math.random().toString(36).slice(2, 10),
    sentAt: msg.sentAt ?? new Date().toISOString(),
    to: msg.to,
    subject: msg.subject,
    body: msg.body,
    kind: msg.kind,
  };
  writeOutbox([email, ...readOutbox()]);
  return email;
}

export async function sendReminder(event: EventDoc, rsvp: Rsvp): Promise<ReminderEmail> {
  const email = appendEmail({
    to: rsvp.attendeeEmail,
    subject: `Reminder: ${event.title} on ${new Date(event.date).toLocaleDateString()}`,
    kind: 'reminder',
    body: `Hi ${rsvp.attendeeName},\n\nThis is your reminder for ${event.title}.\n\nWhere: ${event.location}\nWhen: ${new Date(event.date).toLocaleString()}\nYour ticket code: ${rsvp.ticketCode}\n\nSee you there.\n\n— EventDock`,
  });
  await new Promise(r => setTimeout(r, 200));
  return email;
}

export async function sendBulkReminders(event: EventDoc, rsvps: Rsvp[]): Promise<number> {
  let count = 0;
  for (const r of rsvps.filter(r => r.status === 'going' || r.status === 'checked_in')) {
    await sendReminder(event, r);
    count++;
  }
  return count;
}

export function sendOrderConfirmation(event: EventDoc, rsvp: Rsvp): ReminderEmail {
  const isPaid = (rsvp.pricePaidCents ?? 0) > 0;
  return appendEmail({
    to: rsvp.attendeeEmail,
    subject: `${isPaid ? 'Receipt' : 'Confirmed'}: ${event.title}`,
    kind: 'confirmation',
    body: [
      `Hi ${rsvp.attendeeName},`,
      '',
      isPaid
        ? `You're in. We've charged $${((rsvp.pricePaidCents ?? 0) / 100).toFixed(2)} to your card on file.`
        : `You're on the list for ${event.title}.`,
      '',
      `Where: ${event.location}`,
      `When: ${new Date(event.date).toLocaleString()}`,
      `Ticket code: ${rsvp.ticketCode}`,
      '',
      isPaid ? 'A receipt is attached for your records.' : 'Bring this code to the door — we\'ll scan it on your phone.',
      '',
      '— EventDock',
    ].join('\n'),
  });
}

export function sendRefundApproved(event: EventDoc, rsvp: Rsvp): ReminderEmail {
  return appendEmail({
    to: rsvp.attendeeEmail,
    subject: `Refund approved: ${event.title}`,
    kind: 'refund_approved',
    body: [
      `Hi ${rsvp.attendeeName},`,
      '',
      `Your refund of $${((rsvp.pricePaidCents ?? 0) / 100).toFixed(2)} for ${event.title} has been approved.`,
      'It should land back on your card in 3–5 business days.',
      '',
      'Sorry you can\'t make it — hope to see you next time.',
      '',
      '— EventDock',
    ].join('\n'),
  });
}
