import React, { useState } from 'react';
import type { ScreenType } from '../../types/eventboard';
import { featuredMasterclass } from '../../data/mockData';
import confetti from 'canvas-confetti';

interface EventDetailViewProps {
  onNavigate: (screen: ScreenType) => void;
}

export const EventDetailView: React.FC<EventDetailViewProps> = ({ onNavigate }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(featuredMasterclass.registeredCount);
  const [ticketReserved, setTicketReserved] = useState(false);
  const [ticketId, setTicketId] = useState('TKT-8X9P-MNSQ-2024');

  const capacity = featuredMasterclass.capacity;
  const capacityPercent = Math.round((attendeeCount / capacity) * 100);
  const spotsRemaining = capacity - attendeeCount;

  const handleReserveSpot = () => {
    if (!ticketReserved) {
      setAttendeeCount((prev) => prev + 1);
      setTicketReserved(true);
      const randomTicket = `TKT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-2024`;
      setTicketId(randomTicket);
    }
    setModalOpen(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="flex flex-col w-full relative bg-[#131313]">
      {/* Full Bleed Hero Section */}
      <section className="w-full relative min-h-[500px] flex items-center pt-24 lg:pt-[120px] pb-16 lg:pb-[80px] bg-[#0e0e0e] border-b border-[#353534]">
        {/* Ambient technical background pattern */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#ffb4ab 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        ></div>

        <div className="max-w-[1280px] mx-auto w-full px-5 lg:px-16 relative z-10 flex flex-col lg:flex-row gap-8 items-center">
          {/* Hero Content */}
          <div className="flex-1 flex flex-col gap-4 justify-center">
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-[#dc2626] text-[#fff6f5] font-label-caps text-[11px] px-2.5 py-1 rounded tracking-widest uppercase shadow-sm font-bold">
                {featuredMasterclass.categoryLabel}
              </span>
              <span className="font-data-mono text-[13px] text-[#ffb4ab] flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-pulse"></span>
                {featuredMasterclass.badge}
              </span>
            </div>

            <h1 className="font-headline-xl text-[38px] lg:text-[56px] text-[#e5e2e1] leading-[1.08] tracking-[-0.03em] max-w-2xl drop-shadow-sm font-bold">
              {featuredMasterclass.title}
            </h1>

            <p className="font-body-lg text-body-lg text-[#e6bdb8] max-w-xl mt-1 leading-relaxed">
              {featuredMasterclass.description}
            </p>

            <div className="flex flex-wrap gap-y-3 gap-x-6 mt-4 font-body-md text-[15px] text-[#e5e2e1]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">calendar_today</span>
                <span>{featuredMasterclass.date} • {featuredMasterclass.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">location_on</span>
                <span>{featuredMasterclass.venueName}, {featuredMasterclass.location}</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Aspect */}
          <div className="flex-1 lg:max-w-[46%] w-full relative mt-6 lg:mt-0 shadow-2xl rounded-2xl overflow-hidden group border border-[#353534]">
            <div className="absolute inset-0 bg-gradient-to-t from-[#2a2a2a]/95 via-transparent to-transparent z-10"></div>
            <img
              className="w-full h-full object-cover min-h-[360px] max-h-[420px] transition-transform duration-700 group-hover:scale-105"
              src={featuredMasterclass.image}
              alt={featuredMasterclass.title}
            />

            {/* Overlay Stats Card */}
            <div className="absolute bottom-5 left-5 right-5 z-20 flex justify-between items-end backdrop-blur-md bg-[#2a2a2a]/80 p-4 rounded-xl shadow-lg border border-[#353534]">
              <div>
                <p className="font-label-caps text-[10px] text-[#e6bdb8] mb-1 font-bold">ORGANIZED BY</p>
                <div className="flex items-center gap-3">
                  <img
                    className="w-8 h-8 rounded-full shadow-sm object-cover"
                    src={featuredMasterclass.organizer.avatar}
                    alt="Organizer"
                  />
                  <span className="font-headline-md text-[17px] text-[#e5e2e1] font-bold">
                    {featuredMasterclass.organizer.name}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-label-caps text-[10px] text-[#e6bdb8] mb-1 font-bold">ATTENDEES</p>
                <span className="font-data-mono text-[22px] text-[#ffb4ab] font-bold">
                  {attendeeCount}
                  <span className="text-[#e6bdb8] text-[14px] font-normal">/{capacity}</span>
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
                About this Masterclass
              </h2>
              
              <div className="font-body-md text-[#e6bdb8] space-y-4 leading-relaxed text-[15px]">
                {featuredMasterclass.longDescription?.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>

              {/* Feature cards */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featuredMasterclass.features?.map((f, i) => (
                  <div key={i} className="bg-[#201f1f] border border-[#353534] p-5 rounded-xl shadow-sm hover:border-[#ffb4ab] transition-colors">
                    <span className="material-symbols-outlined text-[#ffb4ab] mb-2 text-[28px]">{f.icon}</span>
                    <h3 className="font-headline-md text-[18px] text-[#e5e2e1] mb-1 font-bold">{f.title}</h3>
                    <p className="font-body-md text-[14px] text-[#e6bdb8] leading-normal">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 02. Schedule Section */}
            <div className="flex flex-col gap-4 relative">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-label-caps text-label-caps text-[#ffb4ab] tracking-[0.2em] uppercase font-bold">
                  02. ITINERARY
                </span>
              </div>
              <h2 className="font-headline-lg text-[28px] text-[#e5e2e1] font-bold">
                Schedule
              </h2>

              <div className="flex flex-col gap-0 border-l-2 border-[#2a2a2a] ml-2 pl-6 mt-4 relative">
                <div className="absolute w-3 h-3 bg-[#ffb4ab] rounded-full -left-[7px] top-1 shadow-[0_0_10px_rgba(255,180,171,0.5)]"></div>

                {featuredMasterclass.schedule?.map((item, idx) => (
                  <div key={idx} className="mb-8 last:mb-0 relative group">
                    <div className="absolute w-2 h-2 bg-[#353534] rounded-full -left-[29px] top-2 transition-colors group-hover:bg-[#ffb4ab]"></div>
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 mb-1">
                      <span className="font-data-mono text-[14px] text-[#ffb4ab] font-bold w-24">
                        {item.time}
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
                ))}
              </div>
            </div>

            {/* 03. Location Section */}
            <div className="flex flex-col gap-4 relative">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-label-caps text-label-caps text-[#ffb4ab] tracking-[0.2em] uppercase font-bold">
                  03. VENUE
                </span>
              </div>
              <h2 className="font-headline-lg text-[28px] text-[#e5e2e1] font-bold">
                Location &amp; Logistics
              </h2>

              <div className="bg-[#201f1f] rounded-2xl overflow-hidden shadow-md flex flex-col sm:flex-row border border-[#353534]">
                <div
                  className="w-full sm:w-1/2 h-64 sm:h-auto bg-cover bg-center"
                  style={{
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCMZPDIQ3P7rIszbKmtkvSrItMpYlZecQTimyL5LhJ-qq5PmXLxJp1XRTX9lB9zzMrKWPBkzy2c9qXjK7vw2PTRXdAcBJrAyOyi7Lwtz1oIwnW8pkQOS-fRKRPsrz3aWijs-3R4-jnLkgHK2Jxp-2z-uf4YyG5aI02ZQb18dsmPzFQyBws8o3q8minw2KTqCN1ruPhDYiznJcj-6h_T4Xq2FPUGXWTCS2QrH25Y2JDOViOkbeyxvGY')`
                  }}
                ></div>

                <div className="p-6 flex flex-col justify-center sm:w-1/2 bg-[#2a2a2a]">
                  <h3 className="font-headline-md text-[20px] text-[#e5e2e1] mb-2 font-bold">
                    {featuredMasterclass.venueName}
                  </h3>
                  <p className="font-body-md text-[14px] text-[#e6bdb8] mb-6">
                    {featuredMasterclass.address}
                  </p>
                  
                  <div className="space-y-3 font-data-mono text-[13px] text-[#e6bdb8]">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-[#ffb4ab]">directions_subway</span>
                      <span>{featuredMasterclass.transitInfo}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-[#ffb4ab]">local_parking</span>
                      <span>{featuredMasterclass.parkingInfo}</span>
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
                      ${featuredMasterclass.price.toFixed(2)}
                    </span>
                    <span className="font-body-md text-[13px] text-[#e6bdb8]">General Admission</span>
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
                    <span className="text-[#ffb4ab] font-bold">{attendeeCount} / {capacity}</span>
                  </div>

                  <div className="h-2.5 w-full bg-[#353534] rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-[#ffb4ab] rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                    ></div>
                  </div>
                  <p className="font-body-md text-[12px] text-[#e6bdb8]/80 text-right mt-0.5">
                    {spotsRemaining > 0 ? `${spotsRemaining} spots remaining` : 'Event full - waitlist active'}
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
                  Sales end Nov 17, 2024 • Instant digital pass
                </p>
              </div>

              {/* Organizer Mini-profile at bottom of card */}
              <div className="bg-[#2a2a2a] p-4 flex items-center justify-between border-t border-[#353534]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#353534] flex items-center justify-center font-headline-md text-[15px] text-[#e5e2e1] shadow-inner font-bold">
                    {featuredMasterclass.organizer.initials}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-md text-[14px] text-[#e5e2e1] font-bold">
                      {featuredMasterclass.organizer.name}
                    </span>
                    <span className="font-body-md text-[12px] text-[#e6bdb8]">
                      {featuredMasterclass.organizer.pastEventsCount} Past Events
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

            {/* Attendee Preview */}
            <div className="mt-8 bg-[#201f1f] p-5 rounded-2xl border border-[#353534]">
              <h4 className="font-label-caps text-label-caps text-[#e6bdb8] mb-4 uppercase font-bold">
                WHO'S GOING ({attendeeCount})
              </h4>
              <div className="flex flex-wrap gap-2.5">
                {featuredMasterclass.attendees.map((att, i) => (
                  <img
                    key={i}
                    src={att.avatar}
                    alt={att.name}
                    title={`${att.name} (${att.role})`}
                    className="w-10 h-10 rounded-full object-cover shadow-md ring-2 ring-[#201f1f] cursor-pointer hover:scale-110 transition-transform"
                  />
                ))}
                <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center font-data-mono text-[12px] text-[#e5e2e1] shadow-sm ring-2 ring-[#201f1f] font-bold">
                  +{attendeeCount - 4}
                </div>
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
                You're officially registered for "{featuredMasterclass.title}". A confirmation pass has been dispatched to your primary inbox.
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
                  className="flex-1 bg-[#2a2a2a] text-[#e5e2e1] font-label-caps text-[12px] py-3.5 rounded-xl hover:bg-[#353534] transition-colors shadow-sm"
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
