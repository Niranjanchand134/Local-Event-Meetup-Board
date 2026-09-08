import { api } from "./api";
import type { RsvpOut, RsvpWithPayment, CheckoutOut, PaymentGateway } from "../types";

export const rsvpApi = {
  /**
   * Reserve a spot on an event.
   * - Free event: returns RSVPOut (status confirmed or waitlisted)
   * - Paid event: returns CheckoutOut containing checkout_url + method + fields
   */
  async reserveSpot(
    eventId: string,
    gateway?: PaymentGateway,
    quantity: number = 1
  ): Promise<RsvpOut | CheckoutOut> {
    const res = await api.post<RsvpOut | CheckoutOut>(
      `/events/${eventId}/reserve`,
      { gateway: gateway ?? null, quantity }
    );
    return res.data;
  },

  /**
   * Verify a payment after returning from the payment gateway.
   * Called from the eSewa callback page with the transaction_uuid query param.
   */
  async verifyPayment(merchantTransactionId: string): Promise<RsvpOut> {
    const res = await api.post<RsvpOut>("/payments/verify", {
      merchant_transaction_id: merchantTransactionId,
    });
    return res.data;
  },

  /**
   * Get all active reservations of the logged-in user.
   */
  async getMyReservations(): Promise<RsvpWithPayment[]> {
    const res = await api.get<RsvpWithPayment[]>("/users/me/reservations");
    return res.data;
  },

  /**
   * Cancel a specific RSVP owned by the current user.
   */
  async cancelRsvp(rsvpId: string): Promise<void> {
    await api.delete(`/rsvps/${rsvpId}`);
  },

  /** Helper: narrow the response type — CheckoutOut always has checkout_url */
  isCheckout(response: RsvpOut | CheckoutOut): response is CheckoutOut {
    return "checkout_url" in response;
  },
};
