/**
 * Reminder "email" hook. In production this calls a Cloud Function that
 * uses Resend; here it queues a fixture into localStorage so the demo can
 * show an outbox. The shape mirrors the Cloud Function payload exactly.
 */
import type { EventDoc, Rsvp } from './types';

export type ReminderEmail = {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
};

const KEY = 'eventdock:outbox';

export function listOutbox(): ReminderEmail[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}

export async function sendReminder(event: EventDoc, rsvp: Rsvp): Promise<ReminderEmail> {
  const email: ReminderEmail = {
    id: 'em_' + Math.random().toString(36).slice(2, 10),
    to: rsvp.attendeeEmail,
    subject: `Reminder: ${event.title} on ${new Date(event.date).toLocaleDateString()}`,
    body: `Hi ${rsvp.attendeeName},\n\nThis is your reminder for ${event.title}.\n\nWhere: ${event.location}\nWhen: ${new Date(event.date).toLocaleString()}\nYour ticket code: ${rsvp.ticketCode}\n\nSee you there.\n\n— EventDock`,
    sentAt: new Date().toISOString(),
  };
  const all = listOutbox();
  all.unshift(email);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 200)));
  // simulate latency
  await new Promise(r => setTimeout(r, 250));
  return email;
}

export async function sendBulkReminders(event: EventDoc, rsvps: Rsvp[]): Promise<number> {
  let count = 0;
  for (const r of rsvps.filter(r => r.status === 'going')) {
    await sendReminder(event, r);
    count++;
  }
  return count;
}
