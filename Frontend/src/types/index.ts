export type UserRole = "user" | "organizer" | "admin";
export type EventStatus = "upcoming" | "completed" | "cancelled";
export type RsvpStatus = "confirmed" | "waitlisted" | "cancelled" | "pending_payment";
export type PaymentStatus = "initiated" | "verified" | "failed" | "refunded";
export type PaymentGateway = "esewa" | "khalti";

export type EventCategory =
  | "garage_sale"
  | "free_tutoring"
  | "community_class"
  | "park_cleanup"
  | "study_group"
  | "workshop"
  | "other";

export interface CategoryOption {
  value: EventCategory;
  label: string;
  icon: string;
  description: string;
}

export const EVENT_CATEGORIES: CategoryOption[] = [
  {
    value: "workshop",
    label: "Workshop & Hands-on",
    icon: "code",
    description: "Interactive skill-building and technical workshops",
  },
  {
    value: "community_class",
    label: "Community Class",
    icon: "school",
    description: "Open community lessons and educational sessions",
  },
  {
    value: "study_group",
    label: "Study Group",
    icon: "menu_book",
    description: "Collaborative learning, exam prep, and research",
  },
  {
    value: "free_tutoring",
    label: "Free Tutoring",
    icon: "volunteer_activism",
    description: "Pro-bono mentoring and academic support",
  },
  {
    value: "park_cleanup",
    label: "Park & Neighborhood Cleanup",
    icon: "eco",
    description: "Environmental action and neighborhood beautification",
  },
  {
    value: "garage_sale",
    label: "Garage Sale & Swap",
    icon: "storefront",
    description: "Neighborhood sales, secondhand swaps, and markets",
  },
  {
    value: "other",
    label: "Other Community Meetup",
    icon: "groups",
    description: "General social gatherings and cultural meetups",
  },
];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  requested_role: string;
  is_suspended: boolean;
  is_verified_organizer: boolean;
}

export interface ScheduleItemIn {
  item_time: string; // ISO 8601 string
  title: string;
  description?: string | null;
  sort_order?: number;
}

export interface ScheduleItemOut {
  id: string;
  item_time: string;
  title: string;
  description?: string | null;
  sort_order: number;
}

export interface EventCreatePayload {
  title: string;
  description: string;
  category: EventCategory;
  start_time: string; // ISO 8601
  end_time?: string | null;
  venue_name?: string | null;
  address?: string | null;
  city?: string | null;
  is_online: boolean;
  meeting_link?: string | null;
  is_paid: boolean;
  price?: number | null;
  currency?: string;
  max_attendees?: number | null;
  schedule_items?: ScheduleItemIn[];
}

export interface EventUpdatePayload {
  title?: string;
  description?: string;
  category?: EventCategory;
  start_time?: string;
  end_time?: string | null;
  venue_name?: string | null;
  address?: string | null;
  city?: string | null;
  is_online?: boolean;
  meeting_link?: string | null;
  is_paid?: boolean;
  price?: number | null;
  currency?: string;
  max_attendees?: number | null;
  status?: EventStatus;
}

export interface EventOut {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  start_time: string;
  end_time?: string | null;
  venue_name?: string | null;
  address?: string | null;
  city?: string | null;
  is_online: boolean;
  meeting_link?: string | null;
  is_paid: boolean;
  price?: number | null;
  currency: string;
  max_attendees?: number | null;
  confirmed_count: number;
  spots_left?: number | null;
  cover_image_path?: string | null;
  created_by: string;
  status: EventStatus;
  created_at: string;
  schedule_items: ScheduleItemOut[];
}

export interface Category {
  id: string;
  name: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string | null;
  event_time: string;
  max_attendees: number | null;
  status: EventStatus;
  created_by: string;
  category: Category;
  attendee_count?: number;
  spots_left?: number | null;
}

export type VerificationStatus = "not_submitted" | "pending" | "approved" | "rejected";
export type DocumentType = "citizenship" | "passport" | "national_id";

export interface VerificationOut {
  id: string;
  status: VerificationStatus;
  document_type: DocumentType;
  submitted_at: string;
  reviewed_at?: string | null;
  admin_note?: string | null;
}

export interface VerificationAdminOut extends VerificationOut {
  user_id: string;
  full_legal_name: string;
  date_of_birth: string;
  address: string;
  document_number: string;
  reviewed_by?: string | null;
}

export interface VerificationStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

// ─── RSVP & Payment types ───────────────────────────────────────────────────

export interface RsvpOut {
  id: string;
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  quantity: number;
  created_at: string;
}

export interface PaymentOut {
  id: string;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  status: PaymentStatus;
  merchant_transaction_id: string;
  gateway_reference?: string | null;
  created_at: string;
  verified_at?: string | null;
}

export interface RsvpWithPayment extends RsvpOut {
  payment?: PaymentOut | null;
  user_name?: string;
  user_email?: string;
}

export interface CheckoutOut {
  rsvp_id: string;
  payment_id: string;
  checkout_url: string;
  method: "GET" | "POST";
  fields: Record<string, string>;
  merchant_transaction_id: string;
  quantity: number;
}

export interface AdminPaymentOut {
  payment_id: string;
  rsvp_id: string;
  event_id: string;
  event_title: string;
  user_id: string;
  user_name: string;
  user_email: string;
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  quantity: number;
  payment_status: PaymentStatus;
  rsvp_status: RsvpStatus;
  merchant_transaction_id: string;
  gateway_reference?: string | null;
  created_at: string;
  verified_at?: string | null;
}