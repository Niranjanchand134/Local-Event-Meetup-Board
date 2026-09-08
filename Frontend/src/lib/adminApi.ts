import { api } from "./api";
import type { AdminPaymentOut, RsvpWithPayment } from "../types";

export const adminApi = {
  /**
   * Fetch all payments across all events — admin only.
   */
  async getAllPayments(): Promise<AdminPaymentOut[]> {
    const res = await api.get<AdminPaymentOut[]>("/admin/payments");
    return res.data;
  },

  /**
   * Fetch RSVPs (with payment details) for a specific event.
   * Accessible to: admin (any event), organizer (own events only).
   */
  async getEventRsvps(eventId: string): Promise<RsvpWithPayment[]> {
    const res = await api.get<RsvpWithPayment[]>(`/admin/events/${eventId}/rsvps`);
    return res.data;
  },
};
