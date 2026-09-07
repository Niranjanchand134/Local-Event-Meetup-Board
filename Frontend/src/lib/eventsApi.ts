import { api } from "./api";
import type { EventCreatePayload, EventOut, EventUpdatePayload } from "../types";

export interface EventFilterParams {
  category?: string;
  city?: string;
  date_from?: string;
  date_to?: string;
  skip?: number;
  limit?: number;
}

export const eventsApi = {
  /**
   * Create a new event. Requires verified organizer or admin role.
   */
  async createEvent(payload: EventCreatePayload): Promise<EventOut> {
    const res = await api.post<EventOut>("/events", payload);
    return res.data;
  },

  /**
   * Upload a cover image for an existing event.
   */
  async uploadCoverImage(eventId: string, file: File): Promise<EventOut> {
    const formData = new FormData();
    formData.append("image", file);

    const res = await api.post<EventOut>(`/events/${eventId}/cover-image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  /**
   * List all upcoming non-cancelled events with optional filters.
   */
  async getEvents(params?: EventFilterParams): Promise<EventOut[]> {
    const res = await api.get<EventOut[]>("/events", { params });
    return res.data;
  },

  /**
   * Get single event by ID.
   */
  async getEventById(eventId: string): Promise<EventOut> {
    const res = await api.get<EventOut>(`/events/${eventId}`);
    return res.data;
  },

  /**
   * Get events created by the logged-in organizer.
   */
  async getMyCreatedEvents(statusFilter?: string): Promise<EventOut[]> {
    const res = await api.get<EventOut[]>("/events/me/created", {
      params: statusFilter ? { status_filter: statusFilter } : undefined,
    });
    return res.data;
  },

  /**
   * Update an event (only the creator can update).
   */
  async updateEvent(eventId: string, payload: EventUpdatePayload): Promise<EventOut> {
    const res = await api.patch<EventOut>(`/events/${eventId}`, payload);
    return res.data;
  },

  /**
   * Get direct URL to the event cover image.
   */
  getCoverImageUrl(eventId: string): string {
    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
    return `${baseUrl}/events/${eventId}/cover-image`;
  },
};
