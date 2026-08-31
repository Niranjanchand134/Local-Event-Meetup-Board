export type UserRole = "user" | "admin";
export type EventStatus = "upcoming" | "completed" | "cancelled";
export type RsvpStatus = "confirmed" | "waitlisted" | "cancelled";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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