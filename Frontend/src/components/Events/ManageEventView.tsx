import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ScreenType } from '../../types/eventboard';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../lib/eventsApi';
import type { EventOut } from '../../types';
import {
  getEventImageUrl,
  formatEventDate,
  formatEventTime,
  getEventLocationLabel,
  CATEGORY_LABEL_MAP,
} from '../../lib/eventDisplay';

interface ManageEventViewProps {
  onNavigate: (screen: ScreenType, eventId?: string) => void;
  onOpenCreateModal: () => void;
}

export const ManageEventView: React.FC<ManageEventViewProps> = ({
  onNavigate,
  onOpenCreateModal,
}) => {
  const { isVerifiedOrganizer } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'upcoming' | 'completed' | 'cancelled'>('ALL');
  const [eventToCancel, setEventToCancel] = useState<EventOut | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Fetch organizer's real created events from FastAPI
  const {
    data: myEvents = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['my-events'],
    queryFn: () => eventsApi.getMyCreatedEvents(),
  });

  // Filter events based on search query and status tab
  const filteredEvents = useMemo(() => {
    return myEvents.filter((evt) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        evt.title.toLowerCase().includes(q) ||
        evt.description.toLowerCase().includes(q) ||
        evt.category.toLowerCase().includes(q) ||
        (evt.city && evt.city.toLowerCase().includes(q)) ||
        (evt.venue_name && evt.venue_name.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'ALL' || evt.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [myEvents, searchQuery, statusFilter]);

  // Aggregated Stats
  const totalEvents = myEvents.length;
  const totalAttendees = myEvents.reduce(
    (sum, evt) => sum + (evt.confirmed_count || 0),
    0
  );
  const upcomingEvents = myEvents.filter((e) => e.status === 'upcoming').length;
  const cancelledEvents = myEvents.filter((e) => e.status === 'cancelled').length;

  const handleCancelEvent = async () => {
    if (!eventToCancel) return;
    setIsCancelling(true);
    try {
      await eventsApi.updateEvent(eventToCancel.id, { status: 'cancelled' });
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setEventToCancel(null);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel event');
    } finally {
      setIsCancelling(false);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-[#131313]">
        <span className="material-symbols-outlined animate-spin text-[44px] text-[#ffb4ab] mb-3">
          progress_activity
        </span>
        <p className="font-data-mono text-[14px] text-[#e6bdb8]">LOADING ORGANIZER DASHBOARD...</p>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-[#690005]/20 border border-[#ffb4ab]/30 flex items-center justify-center text-[#ffb4ab] mb-4">
          <span className="material-symbols-outlined text-[36px]">error</span>
        </div>
        <h2 className="font-headline-lg text-[26px] font-bold text-white mb-2">Could Not Load Events</h2>
        <p className="text-[#e6bdb8] text-[14px] mb-6">
          There was an issue fetching your hosted events. Please check your backend connection.
        </p>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['my-events'] })}
          className="bg-[#ffb4ab] text-[#690005] px-6 py-3 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all shadow-md"
        >
          RETRY
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full px-5 lg:px-16 py-12 gap-10 max-w-[1280px] mx-auto min-h-screen">
      {/* Verification Alert Banner if not verified */}
      {!isVerifiedOrganizer && (
        <div className="p-5 bg-[#201f1f] border border-[#ffb4ab]/50 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#ffb4ab] text-[28px]">
              gpp_maybe
            </span>
            <div>
              <p className="font-bold text-white text-[15px]">Identity Verification Required</p>
              <p className="text-[13px] text-[#e6bdb8]">
                Your organizer profile must be approved by administrators before new events can go live.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('verification')}
            className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-5 py-2 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all shadow-md shrink-0 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            SUBMIT ID VERIFICATION
          </button>
        </div>
      )}

      {/* Header & Status Overview */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 w-full">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="font-label-caps text-[11px] text-[#ffb4ab] px-2.5 py-1 bg-[#ffb4ab]/10 rounded border border-[#ffb4ab]/30 font-bold uppercase">
              ORGANIZER CONTROL CENTER
            </span>
            <span className="font-data-mono text-data-mono text-[#e6bdb8]">
              // {totalEvents} EVENTS REGISTERED
            </span>
          </div>

          <h1 className="font-headline-xl text-[36px] md:text-[48px] text-[#e5e2e1] font-bold tracking-tight">
            Manage Hosted Events
          </h1>

          <p className="font-body-lg text-[15px] text-[#e6bdb8] max-w-2xl">
            Monitor attendee registrations, review your event rosters, view live previews, and coordinate your community meetups.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-5 py-3 bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] font-label-caps text-[12px] rounded-xl transition-all font-bold shadow-md hover:scale-105"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            HOST NEW EVENT
          </button>
        </div>
      </section>

      {/* Key Metrics Bento Grid */}
      <section className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Total Events Hosted */}
        <div className="flex flex-col gap-3 p-6 bg-[#201f1f] border border-[#353534] rounded-2xl hover:scale-[1.02] transition-transform relative overflow-hidden group shadow-md">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">TOTAL HOSTED</span>
            <span className="material-symbols-outlined text-[#ffb4ab]">event</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-headline-xl text-[42px] text-[#e5e2e1] tracking-tighter font-bold font-data-mono">
              {totalEvents}
            </span>
            <span className="font-data-mono text-[14px] text-[#e6bdb8]">events</span>
          </div>
          <p className="font-data-mono text-[12px] text-[#e6bdb8] mt-auto">
            {upcomingEvents} active, {cancelledEvents} cancelled
          </p>
        </div>

        {/* Metric 2: Total Attendees Across Events */}
        <div className="flex flex-col gap-3 p-6 bg-[#201f1f] border border-[#353534] rounded-2xl hover:scale-[1.02] transition-transform relative overflow-hidden shadow-md">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">TOTAL RSVPS</span>
            <span className="material-symbols-outlined text-[#c6c6c7]">groups</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-headline-xl text-[42px] text-[#e5e2e1] tracking-tighter font-bold font-data-mono">
              {totalAttendees}
            </span>
          </div>
          <p className="font-data-mono text-[12px] text-[#e6bdb8] mt-auto">Confirmed registrations</p>
        </div>

        {/* Metric 3: Active Upcoming */}
        <div className="flex flex-col gap-3 p-6 bg-[#201f1f] border border-[#353534] rounded-2xl hover:scale-[1.02] transition-transform relative overflow-hidden shadow-md">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">UPCOMING ACTIVE</span>
            <span className="material-symbols-outlined text-[#bdc7d8]">hourglass_top</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-headline-xl text-[42px] text-[#e5e2e1] tracking-tighter font-bold font-data-mono">
              {upcomingEvents}
            </span>
          </div>
          <p className="font-data-mono text-[12px] text-[#e6bdb8] mt-auto">Live in directory</p>
        </div>

        {/* Metric 4: Profile Status */}
        <div className="flex flex-col p-6 bg-[#201f1f] border border-[#353534] rounded-2xl hover:scale-[1.02] transition-transform relative overflow-hidden shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">ORGANIZER STATUS</span>
            <span className="material-symbols-outlined text-[#ffb4ab]">verified</span>
          </div>
          <div className="flex-grow w-full flex flex-col justify-center">
            <span className="font-headline-md text-[20px] text-white font-bold">
              {isVerifiedOrganizer ? 'Verified Host' : 'Pending Verification'}
            </span>
            <span className="font-data-mono text-[12px] text-[#ffb4ab] mt-1">
              Publishing privileges active
            </span>
          </div>
        </div>
      </section>

      {/* Events Directory Table Section */}
      <section className="w-full bg-[#201f1f] border border-[#353534] rounded-2xl overflow-hidden shadow-xl">
        {/* Controls Bar */}
        <div className="p-6 border-b border-[#353534] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1c1b1b]">
          {/* Status Tabs */}
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`font-label-caps text-[12px] uppercase pb-2 tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'text-[#ffb4ab] border-[#ffb4ab]'
                  : 'text-[#e6bdb8] border-transparent hover:text-white'
              }`}
            >
              ALL EVENTS ({totalEvents})
            </button>
            <button
              onClick={() => setStatusFilter('upcoming')}
              className={`font-label-caps text-[12px] uppercase pb-2 tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
                statusFilter === 'upcoming'
                  ? 'text-[#ffb4ab] border-[#ffb4ab]'
                  : 'text-[#e6bdb8] border-transparent hover:text-white'
              }`}
            >
              UPCOMING ({upcomingEvents})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`font-label-caps text-[12px] uppercase pb-2 tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
                statusFilter === 'completed'
                  ? 'text-[#ffb4ab] border-[#ffb4ab]'
                  : 'text-[#e6bdb8] border-transparent hover:text-white'
              }`}
            >
              COMPLETED ({myEvents.filter((e) => e.status === 'completed').length})
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`font-label-caps text-[12px] uppercase pb-2 tracking-wider font-bold transition-all border-b-2 whitespace-nowrap ${
                statusFilter === 'cancelled'
                  ? 'text-[#ffb4ab] border-[#ffb4ab]'
                  : 'text-[#e6bdb8] border-transparent hover:text-white'
              }`}
            >
              CANCELLED ({cancelledEvents})
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#e6bdb8] text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your events..."
                className="w-full bg-[#353534] text-[#e5e2e1] font-data-mono text-[13px] pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#ffb4ab] transition-all placeholder-[#e6bdb8]/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#e6bdb8] hover:text-white"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table / Empty State */}
        {filteredEvents.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#353534]/50 flex items-center justify-center text-[#e6bdb8] mb-3">
              <span className="material-symbols-outlined text-[32px]">event_busy</span>
            </div>
            <h4 className="font-headline-md text-[18px] text-white font-bold mb-1">
              {myEvents.length === 0 ? 'No Hosted Events Yet' : 'No Matching Events'}
            </h4>
            <p className="text-[14px] text-[#e6bdb8] max-w-sm mb-6">
              {myEvents.length === 0
                ? 'Create your first community meetup to start accepting RSVPs and managing attendees.'
                : 'Try adjusting your search query or status filter.'}
            </p>
            {myEvents.length === 0 && (
              <button
                onClick={onOpenCreateModal}
                className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-6 py-3 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all shadow-md"
              >
                HOST FIRST EVENT
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[920px]">
              <thead>
                <tr className="bg-[#0e0e0e]/40 border-b border-[#353534]">
                  <th className="font-label-caps text-[11px] text-[#e6bdb8] p-4 font-bold uppercase min-w-[280px]">
                    EVENT DETAILS
                  </th>
                  <th className="font-label-caps text-[11px] text-[#e6bdb8] p-4 font-bold uppercase min-w-[190px] whitespace-nowrap">
                    DATE &amp; TIME
                  </th>
                  <th className="font-label-caps text-[11px] text-[#e6bdb8] p-4 font-bold uppercase min-w-[190px]">
                    VENUE / FORMAT
                  </th>
                  <th className="font-label-caps text-[11px] text-[#e6bdb8] p-4 font-bold uppercase min-w-[150px] whitespace-nowrap">
                    ATTENDEES / CAPACITY
                  </th>
                  <th className="font-label-caps text-[11px] text-[#e6bdb8] p-4 font-bold uppercase min-w-[110px] whitespace-nowrap">
                    STATUS
                  </th>
                  <th className="font-label-caps text-[11px] text-[#e6bdb8] p-4 font-bold uppercase min-w-[130px] whitespace-nowrap text-right">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#353534]">
                {filteredEvents.map((evt) => {
                  const imageUrl = getEventImageUrl(evt);
                  const categoryLabel = CATEGORY_LABEL_MAP[evt.category] || evt.category;
                  const dateStr = formatEventDate(evt.start_time);
                  const timeStr = formatEventTime(evt.start_time, evt.end_time);
                  const locationStr = getEventLocationLabel(evt);
                  const capacityPercent = evt.max_attendees
                    ? Math.min(100, Math.round(((evt.confirmed_count || 0) / evt.max_attendees) * 100))
                    : 25;

                  return (
                    <tr
                      key={evt.id}
                      className="hover:bg-[#2a2a2a]/60 transition-colors group"
                    >
                      {/* Event Column */}
                      <td className="p-4 min-w-[280px]">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#353534] shrink-0 overflow-hidden relative border border-[#353534]">
                            <img
                              src={imageUrl}
                              alt={evt.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex flex-col min-w-0 max-w-xs sm:max-w-sm">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-label-caps text-[10px] text-[#ffb4ab] font-bold uppercase">
                                {categoryLabel}
                              </span>
                              <span className="text-[#e6bdb8]/50 text-[10px] font-data-mono truncate">
                                #{evt.id.slice(0, 8)}
                              </span>
                            </div>
                            <span className="font-headline-md text-[8px] font-bold text-[#e5e2e1] group-hover:text-[#ffb4ab] transition-colors leading-snug block w-[180px] truncate">
                              {evt.title}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time Column */}
                      <td className="p-4 min-w-[190px] whitespace-nowrap">
                        <div className="flex flex-col text-[13px] font-data-mono text-[#e6bdb8] whitespace-nowrap">
                          <span className="text-[#e5e2e1] font-medium whitespace-nowrap">{dateStr}</span>
                          <span className="text-[11px] text-[#e6bdb8]/70 whitespace-nowrap">{timeStr}</span>
                        </div>
                      </td>

                      {/* Location Column */}
                      <td className="p-4 min-w-[190px]">
                        <div className="flex items-center gap-2 text-[13px] font-data-mono text-[#e6bdb8] max-w-[220px]">
                          <span className="material-symbols-outlined text-[16px] text-[#ffb4ab] shrink-0">
                            {evt.is_online ? 'language' : 'location_on'}
                          </span>
                          <span className="truncate" title={locationStr}>{locationStr}</span>
                        </div>
                      </td>

                      {/* Capacity Column */}
                      <td className="p-4 min-w-[150px] whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 w-32">
                          <div className="flex items-baseline justify-between font-data-mono text-[12px]">
                            <span className="text-[#e5e2e1] font-bold">
                              {evt.confirmed_count || 0}
                            </span>
                            <span className="text-[#e6bdb8] text-[11px]">
                              / {evt.max_attendees || '∞'}
                            </span>
                          </div>
                          {evt.max_attendees && (
                            <div className="w-full h-1.5 bg-[#353534] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#ffb4ab] rounded-full"
                                style={{ width: `${capacityPercent}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="p-4 min-w-[110px] whitespace-nowrap">
                        <span
                          className={`font-label-caps text-[10px] px-2.5 py-1 rounded border font-bold uppercase inline-block whitespace-nowrap ${
                            evt.status === 'cancelled'
                              ? 'bg-[#690005]/40 text-[#ffb4ab] border-[#ffb4ab]/30'
                              : evt.status === 'completed'
                              ? 'bg-[#2a2a2a] text-[#c6c6c7] border-[#353534]'
                              : 'bg-[#ffb4ab]/15 text-[#ffb4ab] border-[#ffb4ab]/30'
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="p-4 min-w-[130px] whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Public Preview Icon Button */}
                          <button
                            onClick={() => onNavigate('event-detail', evt.id)}
                            className="p-2 text-[#e5e2e1] hover:text-[#690005] hover:bg-[#ffb4ab] transition-all rounded-xl shadow-sm border border-[#353534] flex items-center justify-center"
                            title="Preview Public Event Page"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>

                          {/* Share Link Icon Button */}
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}/events/${evt.id}`;
                              navigator.clipboard?.writeText(url);
                              alert('Event link copied to clipboard!');
                            }}
                            className="p-2 text-[#e6bdb8] hover:text-white hover:bg-[#353534] transition-all rounded-xl border border-[#353534] flex items-center justify-center"
                            title="Copy Event Share Link"
                          >
                            <span className="material-symbols-outlined text-[18px]">share</span>
                          </button>

                          {/* Cancel Action */}
                          {evt.status !== 'cancelled' && (
                            <button
                              onClick={() => setEventToCancel(evt)}
                              className="p-2 text-[#e6bdb8] hover:text-[#ffdad6] hover:bg-[#690005]/50 transition-all rounded-xl border border-transparent hover:border-[#ffb4ab]/30 flex items-center justify-center"
                              title="Cancel Event"
                            >
                              <span className="material-symbols-outlined text-[18px]">cancel</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-4 border-t border-[#353534] flex justify-between items-center bg-[#0e0e0e]/30 font-data-mono text-[12px] text-[#e6bdb8]">
          <span>
            SHOWING {filteredEvents.length} OF {totalEvents} HOSTED EVENTS
          </span>
          <span className="text-[#ffb4ab]">
            TOTAL CONFIRMED: {totalAttendees} RSVPS
          </span>
        </div>
      </section>

      {/* Cancel Event Modal */}
      {eventToCancel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div
            onClick={() => !isCancelling && setEventToCancel(null)}
            className="absolute inset-0 bg-[#0e0e0e]/80 backdrop-blur-sm"
          ></div>
          <div className="relative bg-[#201f1f] border border-[#ffb4ab]/30 w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#690005]/40 flex items-center justify-center text-[#ffb4ab] mb-1">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <h3 className="font-headline-lg text-[22px] text-[#e5e2e1] font-bold">
              Cancel "{eventToCancel.title}"?
            </h3>
            <p className="font-body-md text-[14px] text-[#e6bdb8] leading-relaxed">
              This action will mark the event as cancelled in the public directory and update all attendee statuses.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                disabled={isCancelling}
                onClick={() => setEventToCancel(null)}
                className="px-4 py-2.5 font-label-caps text-[12px] text-[#e5e2e1] hover:bg-[#353534] rounded-xl transition-colors font-bold"
              >
                KEEP EVENT
              </button>
              <button
                disabled={isCancelling}
                onClick={handleCancelEvent}
                className="px-5 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-[#fff6f5] font-label-caps text-[12px] rounded-xl transition-colors shadow-sm font-bold flex items-center gap-2"
              >
                {isCancelling ? 'CANCELLING...' : 'CONFIRM CANCELLATION'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
