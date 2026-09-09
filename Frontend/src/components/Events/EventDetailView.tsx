import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ScreenType } from '../../types/eventboard';
import { eventsApi } from '../../lib/eventsApi';
import { rsvpApi } from '../../lib/rsvpApi';
import { useAuth } from '../../context/AuthContext';
import type { CheckoutOut, RsvpOut, PaymentGateway } from '../../types';
import {
  getEventImageUrl,
  formatEventDate,
  formatEventTime,
  getEventLocationLabel,
  getEventBadge,
  CATEGORY_LABEL_MAP,
} from '../../lib/eventDisplay';
import confetti from 'canvas-confetti';

interface EventDetailViewProps {
  eventId?: string;
  onNavigate: (screen: ScreenType) => void;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function submitEsewaForm(checkoutOut: CheckoutOut) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = checkoutOut.checkout_url;
  for (const [key, value] of Object.entries(checkoutOut.fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

// ─── Status badge helper ─────────────────────────────────────────────────────
function RsvpStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; classes: string }> = {
    confirmed: { label: 'CONFIRMED', classes: 'bg-green-500/20 text-green-400 border-green-500/40' },
    waitlisted: { label: 'WAITLISTED', classes: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' },
    pending_payment: { label: 'PENDING PAYMENT', classes: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
    cancelled: { label: 'CANCELLED', classes: 'bg-red-500/20 text-red-400 border-red-500/40' },
  };
  const c = cfg[status] ?? { label: status.toUpperCase(), classes: 'bg-[#353534] text-[#e6bdb8] border-[#353534]' };
  return (
    <span className={`font-data-mono text-[11px] px-2.5 py-1 rounded border font-bold tracking-widest ${c.classes}`}>
      {c.label}
    </span>
  );
}

// ─── Quantity Stepper ─────────────────────────────────────────────────────────
function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 10,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-0 rounded-xl border border-[#353534] overflow-hidden bg-[#0e0e0e] h-10">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-10 h-10 flex items-center justify-center text-[#e6bdb8] hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-[18px]"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="flex-1 text-center font-data-mono text-[15px] text-[#e5e2e1] font-bold select-none min-w-[32px]">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-10 h-10 flex items-center justify-center text-[#e6bdb8] hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors font-bold text-[18px]"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ eventId, onNavigate }) => {
  const { isAuthenticated, isOrganizer, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // Ticket quantity state
  const [ticketQty, setTicketQty] = useState(1);

  // Payment gateway selection modal
  const [gatewayModalOpen, setGatewayModalOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);

  // Confirmation modal (free events / after payment)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmedRsvp, setConfirmedRsvp] = useState<RsvpOut | null>(null);

  // Error banner
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch event — refetch every 15 s for real-time attendee count
  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.getEventById(eventId!),
    enabled: !!eventId,
    refetchInterval: 15_000,
  });

  // Fetch my reservations to detect if user already reserved this event
  const { data: myRsvps = [] } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: () => rsvpApi.getMyReservations(),
    enabled: isAuthenticated && !isOrganizer && !isAdmin,
  });

  const existingRsvp = myRsvps.find((r) => r.event_id === eventId && r.status !== 'cancelled');
  const isPendingPayment = existingRsvp?.status === 'pending_payment';

  // Compute max qty from spots remaining
  const attendeeCount = event?.confirmed_count || 0;
  const spotsRemaining = event?.max_attendees ? Math.max(0, event.max_attendees - attendeeCount) : null;
  const isFull = spotsRemaining !== null && spotsRemaining <= 0;
  const maxQty = spotsRemaining !== null ? Math.min(10, spotsRemaining) : 10;

  // Reset qty if it exceeds newly computed max
  useEffect(() => {
    if (ticketQty > maxQty) setTicketQty(Math.max(1, maxQty));
  }, [maxQty]);

  // ─── Reserve mutation ───────────────────────────────────────────────────────
  const reserveMutation = useMutation({
    mutationFn: ({ gateway, qty }: { gateway?: PaymentGateway; qty: number }) =>
      rsvpApi.reserveSpot(eventId!, gateway, qty),
    onSuccess: (data) => {
      if (rsvpApi.isCheckout(data)) {
        const checkout = data as CheckoutOut;
        if (checkout.method === 'POST') {
          submitEsewaForm(checkout);
        } else {
          window.location.href = checkout.checkout_url;
        }
      } else {
        const rsvp = data as RsvpOut;
        setConfirmedRsvp(rsvp);
        setGatewayModalOpen(false);
        setConfirmModalOpen(true);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
        queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? 'Something went wrong. Please try again.';
      setErrorMsg(msg);
      setGatewayModalOpen(false);
    },
  });

  // Cancel pending RSVP mutation
  const cancelPendingMutation = useMutation({
    mutationFn: () => rsvpApi.cancelRsvp(existingRsvp!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail ?? 'Could not cancel reservation.';
      setErrorMsg(msg);
    },
  });

  // Auto-dismiss error after 5 s
  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(null), 5000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  // ─── Reserve handler ────────────────────────────────────────────────────────
  const handleReserveClick = () => {
    setErrorMsg(null);
    if (event?.is_paid) {
      setGatewayModalOpen(true);
    } else {
      reserveMutation.mutate({ qty: ticketQty });
    }
  };

  const handleGatewayConfirm = () => {
    if (!selectedGateway) return;
    reserveMutation.mutate({ gateway: selectedGateway, qty: ticketQty });
  };

  // ─── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-[#131313]">
        <span className="material-symbols-outlined animate-spin text-[44px] text-[#ffb4ab] mb-3">
          progress_activity
        </span>
        <p className="font-data-mono text-[14px] text-[#e6bdb8]">LOADING EVENT DETAILS...</p>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-[#690005]/20 border border-[#ffb4ab]/30 flex items-center justify-center text-[#ffb4ab] mb-4">
          <span className="material-symbols-outlined text-[36px]">error</span>
        </div>
        <h2 className="font-headline-lg text-[26px] font-bold text-white mb-2">Event Not Found</h2>
        <p className="text-[#e6bdb8] text-[14px] mb-6">
          The requested meetup could not be found or may have been deleted.
        </p>
        <button
          onClick={() => onNavigate('events')}
          className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-6 py-3 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all shadow-md"
        >
          BACK TO DIRECTORY
        </button>
      </div>
    );
  }

  const imageUrl = getEventImageUrl(event);
  const badge = getEventBadge(event);
  const categoryLabel = CATEGORY_LABEL_MAP[event.category] || event.category;
  const dateStr = formatEventDate(event.start_time);
  const timeStr = formatEventTime(event.start_time, event.end_time);
  const locationStr = getEventLocationLabel(event);

  const capacityPercent = event.max_attendees
    ? Math.round((attendeeCount / event.max_attendees) * 100)
    : 25;

  // Total price for selected quantity
  const totalPrice = event.is_paid && event.price
    ? (Number(event.price) * ticketQty).toFixed(2)
    : null;

  // ─── Render the RSVP button area based on auth + role ─────────────────────
  const renderRsvpAction = () => {
    // 1. Not logged in
    if (!isAuthenticated) {
      return (
        <div className="flex flex-col gap-3">
          <button
            id="btn-signup-to-reserve"
            onClick={() => onNavigate('signup')}
            className="w-full relative overflow-hidden group bg-gradient-to-br from-[#ffb4ab] to-[#ff8a7a] hover:from-[#ffdad6] hover:to-[#ffb4ab] text-[#690005] font-headline-md text-[15px] py-4 rounded-2xl shadow-lg transition-all duration-200 font-bold hover:shadow-[0_4px_24px_rgba(255,180,171,0.3)] active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              SIGN UP TO RESERVE
            </span>
          </button>
          <p className="font-data-mono text-[12px] text-[#e6bdb8]/70 text-center">
            Create a free account to reserve your spot
          </p>
        </div>
      );
    }

    // 2. Organizer or Admin — blocked
    if (isOrganizer || isAdmin) {
      return (
        <div className="bg-[#2a2a2a] border border-[#353534] rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#e6bdb8] text-[22px]">info</span>
          <p className="font-data-mono text-[12px] text-[#e6bdb8] leading-relaxed">
            {isAdmin ? 'Admins' : 'Organizers'} cannot reserve spots. Switch to a user account to attend events.
          </p>
        </div>
      );
    }

    // 3. Already reserved — pending payment (repay flow)
    if (isPendingPayment && existingRsvp) {
      return (
        <div className="flex flex-col gap-3">
          {/* Pending Payment Banner */}
          <div className="bg-[#2a1a00] border border-orange-500/40 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-orange-400 text-[20px]">hourglass_empty</span>
              <span className="font-data-mono text-[11px] text-orange-400 font-bold tracking-widest">PAYMENT PENDING</span>
            </div>
            <p className="font-body-md text-[12px] text-[#e6bdb8] leading-relaxed">
              You started a reservation but payment wasn't completed. You can retry payment or cancel to start fresh.
            </p>
            <p className="font-data-mono text-[11px] text-orange-400/70 mt-1">
              RSVP #{existingRsvp.id.slice(0, 8).toUpperCase()} · {existingRsvp.quantity} ticket{existingRsvp.quantity > 1 ? 's' : ''}
            </p>
          </div>

          {/* Ticket Qty Stepper for repay (if paid event) */}
          {event.is_paid && (
            <div className="flex items-center justify-between bg-[#0e0e0e] border border-[#353534] rounded-xl px-4 py-3">
              <div>
                <p className="font-data-mono text-[10px] text-[#e6bdb8] uppercase font-bold mb-0.5">Tickets</p>
                {totalPrice && (
                  <p className="font-data-mono text-[13px] text-[#ffb4ab] font-bold">
                    {event.currency} {totalPrice}
                  </p>
                )}
              </div>
              <QuantityStepper value={ticketQty} onChange={setTicketQty} max={maxQty} />
            </div>
          )}

          {/* Complete Payment Button */}
          <button
            id="btn-complete-payment"
            onClick={() => {
              setErrorMsg(null);
              if (event.is_paid) {
                setGatewayModalOpen(true);
              } else {
                reserveMutation.mutate({ qty: ticketQty });
              }
            }}
            disabled={reserveMutation.isPending}
            className="w-full relative overflow-hidden group bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-headline-md text-[15px] py-4 rounded-2xl shadow-lg transition-all duration-200 font-bold hover:shadow-[0_4px_24px_rgba(251,146,60,0.35)] active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              {reserveMutation.isPending ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  REDIRECTING…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                  COMPLETE PAYMENT
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </span>
          </button>

          {/* Cancel pending reservation */}
          <button
            id="btn-cancel-pending"
            onClick={() => {
              if (window.confirm('Cancel this pending reservation? You can re-reserve after.')) {
                cancelPendingMutation.mutate();
              }
            }}
            disabled={cancelPendingMutation.isPending}
            className="w-full py-2.5 rounded-xl border border-[#353534] hover:border-red-500/40 text-[#e6bdb8] hover:text-red-400 font-data-mono text-[12px] font-bold transition-all disabled:opacity-50"
          >
            {cancelPendingMutation.isPending ? 'CANCELLING...' : 'CANCEL PENDING RESERVATION'}
          </button>
        </div>
      );
    }

    // 4. Already confirmed/waitlisted
    if (existingRsvp) {
      return (
        <div className="flex flex-col gap-3">
          <div className="bg-[#1a2a1a] border border-green-500/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-green-400 text-[22px]">check_circle</span>
              <div>
                <p className="font-headline-md text-[13px] text-[#e5e2e1] font-bold">You're registered!</p>
                <p className="font-data-mono text-[11px] text-[#e6bdb8] mt-0.5">
                  RSVP #{existingRsvp.id.slice(0, 8).toUpperCase()}
                  {existingRsvp.quantity > 1 && <span className="ml-1.5 text-[#ffb4ab]">· {existingRsvp.quantity} tickets</span>}
                </p>
              </div>
            </div>
            <RsvpStatusBadge status={existingRsvp.status} />
          </div>
          <button
            id="btn-view-dashboard"
            onClick={() => onNavigate('dashboard')}
            className="w-full bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] font-headline-md text-[14px] py-3.5 rounded-2xl transition-all font-bold border border-[#353534]"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[16px]">dashboard</span>
              VIEW IN DASHBOARD
            </span>
          </button>
        </div>
      );
    }

    // 5. Event full
    if (isFull) {
      return (
        <div className="flex flex-col gap-3">
          <button
            disabled
            className="w-full bg-[#353534] text-[#e6bdb8]/50 font-headline-md text-[15px] py-4 rounded-2xl cursor-not-allowed font-bold"
          >
            EVENT FULL — JOIN WAITLIST
          </button>
          <p className="font-data-mono text-[12px] text-[#e6bdb8]/70 text-center">
            You'll be confirmed automatically if a spot opens
          </p>
        </div>
      );
    }

    // 6. Normal reserve flow
    const isProcessing = reserveMutation.isPending;
    return (
      <div className="flex flex-col gap-3">
        {/* Ticket quantity selector */}
        <div className="flex items-center justify-between bg-[#0e0e0e] border border-[#353534] rounded-xl px-4 py-3">
          <div>
            <p className="font-data-mono text-[10px] text-[#e6bdb8] uppercase font-bold mb-0.5">Tickets</p>
            {event.is_paid && totalPrice ? (
              <p className="font-data-mono text-[13px] font-bold">
                <span className="text-[#e6bdb8]">{event.currency} {Number(event.price).toFixed(2)} × {ticketQty} =</span>
                <span className="text-[#ffb4ab] ml-1">{event.currency} {totalPrice}</span>
              </p>
            ) : (
              <p className="font-data-mono text-[12px] text-[#e6bdb8]">Free entry</p>
            )}
          </div>
          <QuantityStepper value={ticketQty} onChange={setTicketQty} max={maxQty} />
        </div>

        {/* CTA Button */}
        <button
          id="btn-reserve-spot"
          onClick={handleReserveClick}
          disabled={isProcessing || ticketQty < 1}
          className="w-full relative overflow-hidden group bg-gradient-to-br from-[#ffb4ab] to-[#e8847a] hover:from-[#ffdad6] hover:to-[#ffb4ab] disabled:opacity-60 disabled:cursor-not-allowed text-[#690005] font-headline-md text-[15px] py-4 rounded-2xl shadow-lg hover:shadow-[0_4px_24px_rgba(255,180,171,0.35)] transition-all duration-200 active:scale-[0.98] font-bold"
        >
          {/* Shimmer on hover */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
          <span className="relative flex items-center justify-center gap-2">
            {isProcessing ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                PROCESSING…
              </>
            ) : (
              <>
                {event.is_paid ? (
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                )}
                {event.is_paid
                  ? `PAY ${event.currency} ${totalPrice} & RESERVE`
                  : ticketQty > 1
                  ? `RESERVE ${ticketQty} SPOTS`
                  : 'RESERVE SPOT'}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </>
            )}
          </span>
        </button>
        <p className="font-data-mono text-[12px] text-[#e6bdb8]/70 text-center">
          {event.is_paid ? 'Secure payment via eSewa or Khalti' : 'Instant digital registration pass'}
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full relative bg-[#131313]">
      {/* Error Banner */}
      {errorMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-[#690005] border border-[#ffb4ab]/40 text-[#ffdad6] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-md w-full mx-4 animate-in slide-in-from-top">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <p className="font-data-mono text-[13px]">{errorMsg}</p>
          <button onClick={() => setErrorMsg(null)} className="ml-auto">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Full Bleed Hero Section */}
      <section className="w-full relative min-h-[500px] flex items-center pt-24 lg:pt-[120px] pb-16 lg:pb-[80px] bg-[#0e0e0e] border-b border-[#353534]">
        <div
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `radial-gradient(#ffb4ab 1px, transparent 1px)`, backgroundSize: '24px 24px' }}
        />

        <div className="max-w-[1280px] mx-auto w-full px-5 lg:px-16 relative z-10 flex flex-col lg:flex-row gap-8 items-center">
          {/* Hero Content */}
          <div className="flex-1 flex flex-col gap-4 justify-center">
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-[#dc2626] text-[#fff6f5] font-label-caps text-[11px] px-2.5 py-1 rounded tracking-widest uppercase shadow-sm font-bold">
                {categoryLabel}
              </span>
              <span className="font-data-mono text-[13px] text-[#ffb4ab] flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-pulse" />
                {badge.label}
              </span>
              {event.is_paid && (
                <span className="bg-[#ffb4ab]/20 text-[#ffb4ab] font-label-caps text-[11px] px-2.5 py-1 rounded tracking-widest uppercase border border-[#ffb4ab]/30 font-bold">
                  PAID · {event.currency} {event.price}
                </span>
              )}
            </div>

            <h1 className="font-headline-xl text-[38px] lg:text-[56px] text-[#e5e2e1] leading-[1.08] tracking-[-0.03em] max-w-2xl drop-shadow-sm font-bold">
              {event.title}
            </h1>

            <p className="font-body-lg text-body-lg text-[#e6bdb8] max-w-xl mt-1 leading-relaxed line-clamp-3">
              {event.description}
            </p>

            <div className="flex flex-wrap gap-y-3 gap-x-6 mt-4 font-body-md text-[15px] text-[#e5e2e1]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">calendar_today</span>
                <span>{dateStr} • {timeStr}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">
                  {event.is_online ? 'language' : 'location_on'}
                </span>
                <span>{locationStr}</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="flex-1 lg:max-w-[46%] w-full relative mt-6 lg:mt-0 shadow-2xl rounded-2xl overflow-hidden group border border-[#353534]">
            <div className="absolute inset-0 bg-gradient-to-t from-[#2a2a2a]/95 via-transparent to-transparent z-10" />
            <img
              className="w-full h-full object-cover min-h-[360px] max-h-[420px] transition-transform duration-700 group-hover:scale-105"
              src={imageUrl}
              alt={event.title}
            />
            {/* Overlay Stats Card */}
            <div className="absolute bottom-5 left-5 right-5 z-20 flex justify-between items-end backdrop-blur-md bg-[#2a2a2a]/80 p-4 rounded-xl shadow-lg border border-[#353534]">
              <div>
                <p className="font-label-caps text-[10px] text-[#e6bdb8] mb-1 font-bold">ORGANIZED BY</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#353534] flex items-center justify-center text-[12px] font-bold text-[#ffb4ab]">
                    HOST
                  </div>
                  <span className="font-headline-md text-[15px] text-[#e5e2e1] font-bold">
                    Community Host ({event.created_by.slice(0, 8)})
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-label-caps text-[10px] text-[#e6bdb8] mb-1 font-bold">ATTENDEES</p>
                <span className="font-data-mono text-[22px] text-[#ffb4ab] font-bold">
                  {attendeeCount}
                  {event.max_attendees && (
                    <span className="text-[#e6bdb8] text-[14px] font-normal">/{event.max_attendees}</span>
                  )}
                </span>
                <div className="flex items-center gap-1 justify-end mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] animate-pulse" />
                  <span className="font-data-mono text-[10px] text-[#ffb4ab]/70">LIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Sidebar */}
      <section className="max-w-[1280px] mx-auto w-full px-5 lg:px-16 py-16">
        <div className="flex flex-col lg:flex-row gap-12 relative items-start">
          {/* Main Content Column */}
          <div className="w-full lg:w-2/3 flex flex-col gap-16 pr-0 lg:pr-6">
            {/* 01. About */}
            <div className="flex flex-col gap-4 relative">
              <span className="font-label-caps text-label-caps text-[#ffb4ab] tracking-[0.2em] uppercase font-bold">
                01. OVERVIEW
              </span>
              <h2 className="font-headline-lg text-[28px] text-[#e5e2e1] font-bold">About this Event</h2>
              <div className="font-body-md text-[#e6bdb8] space-y-4 leading-relaxed text-[15px] whitespace-pre-line">
                {event.description}
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#201f1f] border border-[#353534] p-5 rounded-xl shadow-sm hover:border-[#ffb4ab] transition-colors">
                  <span className="material-symbols-outlined text-[#ffb4ab] mb-2 text-[28px]">
                    {event.is_online ? 'videocam' : 'groups'}
                  </span>
                  <h3 className="font-headline-md text-[18px] text-[#e5e2e1] mb-1 font-bold">
                    {event.is_online ? 'Interactive Online Session' : 'In-Person Networking'}
                  </h3>
                  <p className="font-body-md text-[14px] text-[#e6bdb8] leading-normal">
                    {event.is_online
                      ? 'Live meeting stream with real-time audio/video and interactive chat.'
                      : 'Meet local members face-to-face and engage in hands-on collaboration.'}
                  </p>
                </div>
                <div className="bg-[#201f1f] border border-[#353534] p-5 rounded-xl shadow-sm hover:border-[#ffb4ab] transition-colors">
                  <span className="material-symbols-outlined text-[#ffb4ab] mb-2 text-[28px]">
                    {event.is_paid ? 'payments' : 'volunteer_activism'}
                  </span>
                  <h3 className="font-headline-md text-[18px] text-[#e5e2e1] mb-1 font-bold">
                    {event.is_paid ? 'Paid Registration' : 'Open Community Access'}
                  </h3>
                  <p className="font-body-md text-[14px] text-[#e6bdb8] leading-normal">
                    {event.is_paid
                      ? `Admission is ${event.currency} ${event.price} per person. Pay securely via eSewa or Khalti.`
                      : 'Free entry for all community members and registered attendees.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 02. Schedule */}
            {event.schedule_items && event.schedule_items.length > 0 && (
              <div className="flex flex-col gap-4 relative">
                <span className="font-label-caps text-label-caps text-[#ffb4ab] tracking-[0.2em] uppercase font-bold">
                  02. ITINERARY &amp; SESSIONS
                </span>
                <h2 className="font-headline-lg text-[28px] text-[#e5e2e1] font-bold">Schedule</h2>
                <div className="flex flex-col gap-0 border-l-2 border-[#2a2a2a] ml-2 pl-6 mt-4 relative">
                  <div className="absolute w-3 h-3 bg-[#ffb4ab] rounded-full -left-[7px] top-1 shadow-[0_0_10px_rgba(255,180,171,0.5)]" />
                  {event.schedule_items.map((item, idx) => {
                    const itemTime = new Date(item.item_time).toLocaleTimeString('en-US', {
                      hour: 'numeric', minute: '2-digit', hour12: true,
                    });
                    return (
                      <div key={item.id || idx} className="mb-8 last:mb-0 relative group">
                        <div className="absolute w-2 h-2 bg-[#353534] rounded-full -left-[29px] top-2 transition-colors group-hover:bg-[#ffb4ab]" />
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 mb-1">
                          <span className="font-data-mono text-[14px] text-[#ffb4ab] font-bold w-24">{itemTime}</span>
                          <h3 className="font-headline-md text-[17px] text-[#e5e2e1] font-semibold">{item.title}</h3>
                        </div>
                        {item.description && (
                          <p className="font-body-md text-[14px] text-[#e6bdb8] sm:ml-[120px]">{item.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 03. Location */}
            <div className="flex flex-col gap-4 relative">
              <span className="font-label-caps text-label-caps text-[#ffb4ab] tracking-[0.2em] uppercase font-bold">
                03. VENUE &amp; LOGISTICS
              </span>
              <h2 className="font-headline-lg text-[28px] text-[#e5e2e1] font-bold">
                {event.is_online ? 'Online Access' : 'Location & Venue'}
              </h2>
              <div className="bg-[#201f1f] rounded-2xl overflow-hidden shadow-md flex flex-col sm:flex-row border border-[#353534]">
                <div
                  className="w-full sm:w-1/2 h-64 sm:h-auto bg-cover bg-center min-h-[180px]"
                  style={{ backgroundImage: `url('${imageUrl}')` }}
                />
                <div className="p-6 flex flex-col justify-center sm:w-1/2 bg-[#2a2a2a]">
                  <h3 className="font-headline-md text-[20px] text-[#e5e2e1] mb-2 font-bold">
                    {event.is_online ? 'Virtual Meeting' : event.venue_name || event.city}
                  </h3>
                  <p className="font-body-md text-[14px] text-[#e6bdb8] mb-6">
                    {event.is_online
                      ? 'Live streaming session accessible worldwide via meeting link.'
                      : `${event.address ? `${event.address}, ` : ''}${event.city || ''}`}
                  </p>
                  <div className="space-y-3 font-data-mono text-[13px] text-[#e6bdb8]">
                    {event.is_online && event.meeting_link && (
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-[18px] text-[#ffb4ab]">link</span>
                        <a href={event.meeting_link} target="_blank" rel="noreferrer" className="text-[#ffb4ab] hover:underline truncate">
                          {event.meeting_link}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-[#ffb4ab]">schedule</span>
                      <span>Starts {dateStr} at {timeStr}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Sidebar — RSVP Card */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-[100px] z-20">
            <div className="bg-[#201f1f] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative border border-[#353534]">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#ffb4ab] to-[#e8847a] absolute top-0 left-0" />

              <div className="p-6 lg:p-8 flex flex-col gap-6">
                {/* Price + Actions */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-headline-md text-[32px] text-[#e5e2e1] block font-bold font-data-mono">
                      {event.is_paid ? `${event.currency} ${event.price}` : 'Free Entry'}
                    </span>
                    <span className="font-body-md text-[13px] text-[#e6bdb8]">Community Admission</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                        isBookmarked ? 'bg-[#ffb4ab] text-[#690005]' : 'bg-[#2a2a2a] hover:bg-[#353534] text-[#e6bdb8]'
                      }`}
                      title="Bookmark"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isBookmarked ? 'bookmark' : 'bookmark_border'}
                      </span>
                    </button>
                    <button
                      onClick={() => { navigator.clipboard?.writeText(window.location.href); }}
                      className="w-10 h-10 rounded-full bg-[#2a2a2a] hover:bg-[#353534] flex items-center justify-center transition-colors shadow-sm text-[#e6bdb8]"
                      title="Share"
                    >
                      <span className="material-symbols-outlined text-[20px]">share</span>
                    </button>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="flex flex-col gap-2 bg-[#0e0e0e] p-4 rounded-xl border border-[#353534]">
                  <div className="flex justify-between items-end font-data-mono text-[13px]">
                    <span className="text-[#e6bdb8] uppercase tracking-wider text-[11px] font-bold">Capacity</span>
                    <span className="text-[#ffb4ab] font-bold">
                      {attendeeCount} / {event.max_attendees ? event.max_attendees : '∞'}
                    </span>
                  </div>
                  {event.max_attendees && (
                    <div className="h-2.5 w-full bg-[#353534] rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          capacityPercent >= 90 ? 'bg-red-500' : capacityPercent >= 70 ? 'bg-yellow-500' : 'bg-[#ffb4ab]'
                        }`}
                        style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                      />
                    </div>
                  )}
                  <p className="font-body-md text-[12px] text-[#e6bdb8]/80 text-right mt-0.5">
                    {spotsRemaining !== null
                      ? spotsRemaining > 0
                        ? `${spotsRemaining} spot${spotsRemaining !== 1 ? 's' : ''} remaining`
                        : 'Event full — waitlist available'
                      : 'Open registration'}
                  </p>
                </div>

                {/* Action Button Area */}
                {renderRsvpAction()}
              </div>

              {/* Organizer mini-profile */}
              <div className="bg-[#2a2a2a] p-4 flex items-center justify-between border-t border-[#353534]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#353534] flex items-center justify-center font-headline-md text-[13px] text-[#e5e2e1] shadow-inner font-bold">
                    HOST
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-md text-[14px] text-[#e5e2e1] font-bold truncate max-w-[140px]">
                      Verified Organizer
                    </span>
                    <span className="font-body-md text-[12px] text-[#e6bdb8]">Host Profile</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`font-label-caps text-[11px] px-3.5 py-1.5 border rounded-lg transition-colors font-bold ${
                    isFollowing
                      ? 'bg-[#ffb4ab] text-[#690005] border-[#ffb4ab]'
                      : 'text-[#ffb4ab] border-[#ffb4ab]/40 hover:bg-[#ffb4ab]/10'
                  }`}
                >
                  {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Gateway Selection Modal (paid events) ──────────────────────────── */}
      {gatewayModalOpen && (
        <div className="fixed inset-0 z-[100] bg-[#0e0e0e]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1c1b1b] border border-[#353534] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative animate-in zoom-in-95">
            <button
              onClick={() => setGatewayModalOpen(false)}
              className="absolute top-4 right-4 text-[#e6bdb8] hover:text-white p-1 rounded-lg hover:bg-[#2a2a2a] transition-colors z-10"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>

            <div className="h-20 bg-[#0e0e0e] flex items-center justify-center">
              <span className="material-symbols-outlined text-[40px] text-[#ffb4ab]">payments</span>
            </div>

            <div className="p-8 flex flex-col gap-6">
              <div>
                <h3 className="font-headline-lg text-[22px] text-[#e5e2e1] font-bold">Choose Payment Method</h3>
                <p className="font-body-md text-[13px] text-[#e6bdb8] mt-1">
                  {ticketQty > 1
                    ? <>Total: <span className="font-bold text-[#ffb4ab]">{event.currency} {totalPrice}</span> ({ticketQty} tickets × {event.currency} {Number(event.price).toFixed(2)})</>
                    : <>Total: <span className="font-bold text-[#ffb4ab]">{event.currency} {event.price}</span> for "{event.title}"</>
                  }
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {/* eSewa Option */}
                <button
                  onClick={() => setSelectedGateway('esewa')}
                  className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                    selectedGateway === 'esewa'
                      ? 'border-[#60d394] bg-[#60d394]/10'
                      : 'border-[#353534] bg-[#2a2a2a] hover:border-[#60d394]/50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-[#60d394]/20 flex items-center justify-center text-[#60d394] font-bold text-[14px] font-data-mono">
                    eSewa
                  </div>
                  <div className="text-left">
                    <p className="font-headline-md text-[15px] text-[#e5e2e1] font-bold">eSewa</p>
                    <p className="font-body-md text-[12px] text-[#e6bdb8]">Nepal's leading digital wallet</p>
                  </div>
                  {selectedGateway === 'esewa' && (
                    <span className="material-symbols-outlined text-[#60d394] ml-auto text-[22px]">check_circle</span>
                  )}
                </button>

                {/* Khalti Option */}
                <button
                  onClick={() => setSelectedGateway('khalti')}
                  className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${
                    selectedGateway === 'khalti'
                      ? 'border-[#7c4dff] bg-[#7c4dff]/10'
                      : 'border-[#353534] bg-[#2a2a2a] hover:border-[#7c4dff]/50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-[#7c4dff]/20 flex items-center justify-center text-[#7c4dff] font-bold text-[14px] font-data-mono">
                    Khalti
                  </div>
                  <div className="text-left">
                    <p className="font-headline-md text-[15px] text-[#e5e2e1] font-bold">Khalti</p>
                    <p className="font-body-md text-[12px] text-[#e6bdb8]">Fast mobile payment gateway</p>
                  </div>
                  {selectedGateway === 'khalti' && (
                    <span className="material-symbols-outlined text-[#7c4dff] ml-auto text-[22px]">check_circle</span>
                  )}
                </button>
              </div>

              <button
                id="btn-proceed-payment"
                onClick={handleGatewayConfirm}
                disabled={!selectedGateway || reserveMutation.isPending}
                className="w-full relative overflow-hidden group bg-gradient-to-br from-[#ffb4ab] to-[#e8847a] hover:from-[#ffdad6] hover:to-[#ffb4ab] disabled:opacity-50 disabled:cursor-not-allowed text-[#690005] font-headline-md text-[15px] py-4 rounded-2xl shadow-lg transition-all duration-200 font-bold hover:shadow-[0_4px_24px_rgba(255,180,171,0.35)] active:scale-[0.98]"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                <span className="relative">
                  {reserveMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      REDIRECTING TO PAYMENT…
                    </span>
                  ) : (
                    `PROCEED TO ${selectedGateway?.toUpperCase() ?? 'PAYMENT'}`
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirmation Modal (free event / after verify) ───────────────── */}
      {confirmModalOpen && confirmedRsvp && (
        <div className="fixed inset-0 z-[100] bg-[#0e0e0e]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1c1b1b] border border-[#353534] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col relative animate-in zoom-in-95">
            <button
              onClick={() => setConfirmModalOpen(false)}
              className="absolute top-4 right-4 text-[#e6bdb8] hover:text-white p-1 rounded-lg hover:bg-[#2a2a2a] transition-colors z-10"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>

            <div className="h-28 bg-[#0e0e0e] relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[#ffb4ab]/10" />
              <span className="material-symbols-outlined text-[54px] text-[#ffb4ab] animate-bounce">
                check_circle
              </span>
            </div>

            <div className="p-8 flex flex-col items-center text-center gap-3">
              <h3 className="font-headline-lg text-[24px] text-[#e5e2e1] font-bold">
                {confirmedRsvp.status === 'waitlisted' ? 'Added to Waitlist!' : 'Spot Reserved!'}
              </h3>
              <p className="font-body-md text-[14px] text-[#e6bdb8] leading-relaxed">
                {confirmedRsvp.status === 'waitlisted'
                  ? `You're on the waitlist for "${event.title}". We'll notify you automatically if a spot opens.`
                  : confirmedRsvp.quantity > 1
                  ? `You've reserved ${confirmedRsvp.quantity} spots for "${event.title}". See you there!`
                  : `You're officially registered for "${event.title}". See you there!`}
              </p>

              <div className="w-full bg-[#201f1f] border border-[#353534] p-4 rounded-xl mt-2 text-left space-y-2">
                <div>
                  <span className="font-label-caps text-[10px] text-[#e6bdb8] block mb-0.5 uppercase font-bold">RSVP ID</span>
                  <span className="font-data-mono text-[13px] text-[#ffb4ab] font-bold block truncate">
                    #{confirmedRsvp.id.slice(0, 12).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="font-label-caps text-[10px] text-[#e6bdb8] block mb-0.5 uppercase font-bold">STATUS</span>
                  <RsvpStatusBadge status={confirmedRsvp.status} />
                </div>
                {confirmedRsvp.quantity > 1 && (
                  <div>
                    <span className="font-label-caps text-[10px] text-[#e6bdb8] block mb-0.5 uppercase font-bold">TICKETS</span>
                    <span className="font-data-mono text-[13px] text-[#ffb4ab] font-bold">{confirmedRsvp.quantity}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="flex-1 bg-[#2a2a2a] text-[#e5e2e1] font-label-caps text-[12px] py-3.5 rounded-xl hover:bg-[#353534] transition-colors shadow-sm font-bold"
                >
                  MY DASHBOARD
                </button>
                <button
                  onClick={() => setConfirmModalOpen(false)}
                  className="flex-1 bg-gradient-to-br from-[#ffb4ab] to-[#e8847a] hover:from-[#ffdad6] hover:to-[#ffb4ab] text-[#690005] font-label-caps text-[12px] py-3.5 rounded-xl transition-all shadow-sm font-bold"
                >
                  DONE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
