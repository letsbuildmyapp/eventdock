export type Role = 'attendee' | 'organizer' | 'admin';

export type OrgTier = 'starter' | 'pro' | 'scale';

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  orgId?: string; // organizer-only
};

export type Organization = {
  id: string;
  name: string;
  ownerId: string; // user.id of the organizer
  tier: OrgTier;
  tierUpdatedAt: string;
};

export type EventStatus = 'live' | 'featured' | 'suspended' | 'draft';

export type EventCategory =
  | 'conference'
  | 'wedding'
  | 'fundraiser'
  | 'workshop'
  | 'art_opening'
  | 'brand_launch'
  | 'fitness_retreat';

export type TicketType = {
  id: string;
  name: string;
  price: number; // 0 for free RSVP, >0 for paid ticket
  capacity: number;
};

export type Session = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  speaker?: string;
  location?: string;
};

export type VendorTaskStatus = 'pending' | 'in_progress' | 'done';

export type VendorTask = {
  id: string;
  title: string;
  dueDate?: string; // ISO
  status: VendorTaskStatus;
};

export type VendorStatus = 'invited' | 'confirmed' | 'declined';

export type Vendor = {
  id: string;
  name: string;
  category: string;
  contact: string;
  status: VendorStatus;
  notes?: string;
  tasks: VendorTask[];
};

export type EventDoc = {
  id: string;
  organizerId: string;
  title: string;
  slug: string;
  category: EventCategory;
  description: string;
  coverImage: string; // full URL — Unsplash, organizer upload (data URL), etc.
  date: string;
  endDate: string;
  location: string;
  venueAddress?: string;
  capacity: number;
  ticketTypes: TicketType[];
  sessions: Session[];
  vendors: Vendor[];
  status: EventStatus;
  createdAt: string;
};

export type RsvpStatus = 'going' | 'cancelled' | 'checked_in' | 'refunded';

export type RefundStatus = 'none' | 'pending' | 'approved' | 'denied';

export type Rsvp = {
  id: string;
  eventId: string;
  attendeeId: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketTypeId: string;
  ticketCode: string;
  status: RsvpStatus;
  pricePaidCents?: number;
  paidAt?: string;
  refundStatus?: RefundStatus;
  refundRequestedAt?: string;
  refundedAt?: string;
  createdAt: string;
  checkedInAt?: string;
};

export type Notification = {
  id: string;
  recipientId: string; // organizer or admin user id
  eventId?: string;
  kind: 'qa_forwarded' | 'refund_requested';
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};
