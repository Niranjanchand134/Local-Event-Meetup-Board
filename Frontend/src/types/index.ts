export type UserRole = "user" | "organizer" | "admin";
export type EventStatus = "upcoming" | "completed" | "cancelled";
export type RsvpStatus = "confirmed" | "waitlisted" | "cancelled";

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