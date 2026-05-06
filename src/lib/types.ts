export type Role = 'attendee' | 'organizer' | 'admin';

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
};

export type EventStatus = 'live' | 'featured' | 'suspended' | 'draft';

export type EventCategory = 'conference' | 'wedding' | 'fundraiser';

export type TicketType = {
  id: string;
  name: string;
  price: number; // 0 for free
  capacity: number;
};

export type Session = {
  id: string;
  title: string;
  startTime: string; // ISO
  endTime: string;
  speaker?: string;
  location?: string;
};

export type Vendor = {
  id: string;
  name: string;
  category: string; // catering, A/V, photography, etc.
  contact: string;
  notes?: string;
};

export type EventDoc = {
  id: string;
  organizerId: string;
  title: string;
  slug: string;
  category: EventCategory;
  description: string;
  coverColor: string; // tailwind-ish hue token used to render hero
  emoji: string;
  date: string; // ISO start
  endDate: string; // ISO end
  location: string;
  venueAddress?: string;
  capacity: number;
  ticketTypes: TicketType[];
  sessions: Session[];
  vendors: Vendor[];
  status: EventStatus;
  createdAt: string;
};

export type RsvpStatus = 'going' | 'cancelled' | 'checked_in';

export type Rsvp = {
  id: string;
  eventId: string;
  attendeeId: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketTypeId: string;
  ticketCode: string; // QR code string
  status: RsvpStatus;
  createdAt: string;
  checkedInAt?: string;
};
