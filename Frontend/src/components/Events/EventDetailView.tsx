import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ScreenType } from '../../types/eventboard';
import { eventsApi } from '../../lib/eventsApi';
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

export const EventDetailView: React.FC<EventDetailViewProps> = ({ eventId, onNavigate }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [ticketReserved, setTicketReserved] = useState(false);
  const [ticketId, setTicketId] = useState('TKT-8X9P-MNSQ-2026');

  // Fetch real event data by ID
  const {
    data: event,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.getEventById(eventId!),
    enabled: !!eventId,
  });

  const handleReserveSpot = () => {
    if (!ticketReserved) {
      setTicketReserved(true);
      const randomTicket = `TKT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-2026`;
      setTicketId(randomTicket);
    }
    setModalOpen(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Loading Skeleton
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

  // Not Found / Error State
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

  const attendeeCount = (event.confirmed_count || 0) + (ticketReserved ? 1 : 0);
  const capacityPercent = event.max_attendees
    ? Math.round((attendeeCount / event.max_attendees) * 100)
    : 25;
  const spotsRemaining = event.max_attendees ? Math.max(0, event.max_attendees - attendeeCount) : null;

  return (
    <div className="flex flex-col w-full relative bg-[#131313]">
      {/* Full Bleed Hero Section */}
      <section className="w-full relative min-h-[500px] flex items-center pt-24 lg:pt-[120px] pb-16 lg:pb-[80px] bg-[#0e0e0e] border-b border-[#353534]">
        {/* Ambient technical background pattern */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#ffb4ab 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        ></div>

        <div className="max-w-[1280px] mx-auto w-full px-5 lg:px-16 relative z-10 flex flex-col lg:flex-row gap-8 items-center">
          {/* Hero Content */}
          <div className="flex-1 flex flex-col gap-4 justify-center">
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-[#dc2626] text-[#fff6f5] font-label-caps text-[11px] px-2.5 py-1 rounded tracking-widest uppercase shadow-sm font-bold">
                {categoryLabel}
              </span>
              <span className="font-data-mono text-[13px] text-[#ffb4ab] flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-pulse"></span>
                {badge.label}
              </span>
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
                <span>
                  {dateStr} • {timeStr}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">
                  {event.is_online ? 'language' : 'location_on'}
                </span>
                <span>{locationStr}</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Aspect */}
          <div className="flex-1 lg:max-w-[46%] w-full relative mt-6 lg:mt-0 shadow-2xl rounded-2xl overflow-hidden group border border-[#353534]">
            <div className="absolute inset-0 bg-gradient-to-t from-[#2a2a2a]/95 via-transparent to-transparent z-10"></div>
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Sidebar Layout */}
      <section className="max-w-[1280px] mx-auto w-full px-5 lg:px-16 py-16">
        <div className="flex flex-col lg:flex-row gap-12 relative items-start">
          {/* Main Content Column */}
          <div className="w-full lg:w-2/3 flex flex-col gap-16 pr-0 lg:pr-6">
            {/* 01. About Section */}
            <div className="flex flex-col gap-4 relative">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-label-caps text-label-caps text-[#ffb4ab] tracking-[0.2em] uppercase font-bold">
                  01. OVERVIEW
                </span>
              </div>
              <h2 className="font-headline-lg text-[28px] text-[#e5e2e1] font-bold">
                About this Event
              </h2>

              <div className="font-body-md text-[#e6bdb8] space-y-4 leading-relaxed text-[15px] whitespace-pre-line">
                {event.description}
              </div>

              {/* Dynamic Feature Badges */}
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
                      ? `Admission is ${event.currency} ${event.price} per person with instant pass.`
                      : 'Free entry for all community members and registered attendees.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 02. Schedule Section */}
            {event.schedule_items && event.schedule_items.length > 0 && (
              <div className="flex flex-col gap-4 relative">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-label-caps text-label-caps text-[#ffb4ab] tracking-[0.2em] uppercase font-bold">
                    02. ITINERARY &amp; SESSIONS
                  </span>
                </div>
                <h2 className="font-headline-lg text-[28px] text-[#e5e2e1] font-bold">
                  Schedule
                </h2>

                <div className="flex flex-col gap-0 border-l-2 border-[#2a2a2a] ml-2 pl-6 mt-4 relative">
                  <div className="absolute w-3 h-3 bg-[#ffb4ab] rounded-full -left-[7px] top-1 shadow-[0_0_10px_rgba(255,180,171,0.5)]"></div>

                  {event.schedule_items.map((item, idx) => {
                    const itemTime = new Date(item.item_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    });

                    return (
                      <div key={item.id || idx} className="mb-8 last:mb-0 relative group">
                        <div className="absolute w-2 h-2 bg-[#353534] rounded-full -left-[29px] top-2 transition-colors group-hover:bg-[#ffb4ab]"></div>
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 mb-1">
                          <span className="font-data-mono text-[14px] text-[#ffb4ab] font-bold w-24">
                            {itemTime}
                          </span>
                          <h3 className="font-headline-md text-[17px] text-[#e5e2e1] font-semibold">
                            {item.title}
                          </h3>
                        </div>
                        {item.description && (
                          <p className="font-body-md text-[14px] text-[#e6bdb8] sm:ml-[120px]">
                            {item.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 03. Location Section */}
            <div className="flex flex-col gap-4 relative">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-label-caps text-label-caps text-[#ffb4ab] tracking-[0.2em] uppercase font-bold">
                  03. VENUE &amp; LOGISTICS
                </span>
              </div>
              <h2 className="font-headline-lg text-[28px] text-[#e5e2e1] font-bold">
                {event.is_online ? 'Online Access' : 'Location & Venue'}
              </h2>

              <div className="bg-[#201f1f] rounded-2xl overflow-hidden shadow-md flex flex-col sm:flex-row border border-[#353534]">
                <div
                  className="w-full sm:w-1/2 h-64 sm:h-auto bg-cover bg-center min-h-[180px]"
                  style={{ backgroundImage: `url('${imageUrl}')` }}
                ></div>

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
                        <a
                          href={event.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#ffb4ab] hover:underline truncate"
                        >
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

          {/* Sticky Sidebar */}
          <div className="w-full lg:w-1/3 lg:sticky lg:top-[100px] z-20">
            {/* RSVP Card */}
            <div className="bg-[#201f1f] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative border border-[#353534]">
              {/* Top Accent Line */}
              <div className="h-1.5 w-full bg-[#ffb4ab] absolute top-0 left-0"></div>

              <div className="p-6 lg:p-8 flex flex-col gap-6">
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
                        isBookmarked
                          ? 'bg-[#ffb4ab] text-[#690005]'
                          : 'bg-[#2a2a2a] hover:bg-[#353534] text-[#e6bdb8]'
                      }`}
                      title="Bookmark"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isBookmarked ? 'bookmark' : 'bookmark_border'}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        alert('Event link copied to clipboard!');
                      }}
                      className="w-10 h-10 rounded-full bg-[#2a2a2a] hover:bg-[#353534] flex items-center justify-center transition-colors shadow-sm text-[#e6bdb8]"
                      title="Share"
                    >
                      <span className="material-symbols-outlined text-[20px]">share</span>
                    </button>
                  </div>
                </div>

                {/* Capacity Visualization */}
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
                        className="h-full bg-[#ffb4ab] rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                      ></div>
                    </div>
                  )}
                  <p className="font-body-md text-[12px] text-[#e6bdb8]/80 text-right mt-0.5">
                    {spotsRemaining !== null
                      ? spotsRemaining > 0
                        ? `${spotsRemaining} spots remaining`
                        : 'Event full'
                      : 'Open registration'}
                  </p>
                </div>

                {/* Action Button */}
                <button
                  onClick={handleReserveSpot}
                  className="w-full bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] font-headline-md text-[16px] py-4 rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group font-bold"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {ticketReserved ? 'VIEW TICKET CONFIRMATION' : 'RESERVE SPOT'}
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </span>
                </button>
                <p className="font-data-mono text-[12px] text-[#e6bdb8]/70 text-center">
                  Instant digital registration pass
                </p>
              </div>

              {/* Organizer Mini-profile at bottom of card */}
              <div className="bg-[#2a2a2a] p-4 flex items-center justify-between border-t border-[#353534]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#353534] flex items-center justify-center font-headline-md text-[13px] text-[#e5e2e1] shadow-inner font-bold">
                    HOST
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-md text-[14px] text-[#e5e2e1] font-bold truncate max-w-[140px]">
                      Verified Organizer
                    </span>
                    <span className="font-body-md text-[12px] text-[#e6bdb8]">
                      Host Profile
                    </span>
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

      {/* Confirmation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] bg-[#0e0e0e]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1c1b1b] border border-[#353534] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-transform animate-in zoom-in-95 flex flex-col relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-[#e6bdb8] hover:text-white p-1 rounded-lg hover:bg-[#2a2a2a] transition-colors z-10"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>

            <div className="h-28 bg-[#0e0e0e] relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-[#ffb4ab]/10"></div>
              <span className="material-symbols-outlined text-[54px] text-[#ffb4ab] animate-bounce">
                check_circle
              </span>
            </div>

            <div className="p-8 flex flex-col items-center text-center gap-3">
              <h3 className="font-headline-lg text-[24px] text-[#e5e2e1] font-bold">
                Spot Reserved!
              </h3>
              <p className="font-body-md text-[14px] text-[#e6bdb8] leading-relaxed">
                You're officially registered for "{event.title}". A confirmation pass has been dispatched to your primary inbox.
              </p>

              <div className="w-full bg-[#201f1f] border border-[#353534] p-4 rounded-xl mt-2 text-left">
                <span className="font-label-caps text-[10px] text-[#e6bdb8] block mb-1 uppercase font-bold">
                  YOUR DIGITAL TICKET ID
                </span>
                <span className="font-data-mono text-[14px] text-[#ffb4ab] font-bold block truncate">
                  {ticketId}
                </span>
              </div>

              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="flex-1 bg-[#2a2a2a] text-[#e5e2e1] font-label-caps text-[12px] py-3.5 rounded-xl hover:bg-[#353534] transition-colors shadow-sm font-bold"
                >
                  MY DASHBOARD
                </button>
                <button
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-[#ffb4ab] text-[#690005] font-label-caps text-[12px] py-3.5 rounded-xl hover:bg-[#ffdad6] transition-colors shadow-sm font-bold"
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
