import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ScreenType, AdminUserRecord } from '../../types/eventboard';
import { eventsApi } from '../../lib/eventsApi';
import { api } from '../../lib/api';
import type { EventOut } from '../../types';
import {
  getEventImageUrl,
  formatEventDate,
  formatEventTime,
  getEventLocationLabel,
  CATEGORY_LABEL_MAP,
  CATEGORY_ICON_MAP,
} from '../../lib/eventDisplay';

interface AdminEventsViewProps {
  onNavigate: (screen: ScreenType, eventId?: string) => void;
}

export const AdminEventsView: React.FC<AdminEventsViewProps> = ({ onNavigate }) => {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'upcoming' | 'completed' | 'cancelled'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Selected event for the popup modal dialog
  const [selectedEvent, setSelectedEvent] = useState<EventOut | null>(null);

  // Force Cancel confirmation state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // 1. Fetch all events
  const {
    data: allEvents = [],
    isLoading: eventsLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['events', 'admin-all'],
    queryFn: () => eventsApi.getEvents(),
  });

  // 2. Fetch all users to map created_by -> User Record details
  const { data: allUsers = [] } = useQuery<AdminUserRecord[]>({
    queryKey: ['admin-users', 'lookup'],
    queryFn: async () => {
      try {
        const res = await api.get<AdminUserRecord[]>('/admin/users');
        return res.data;
      } catch {
        return [];
      }
    },
  });

  const usersById = useMemo(() => {
    const map: Record<string, AdminUserRecord> = {};
    allUsers.forEach((u) => {
      map[u.id] = u;
    });
    return map;
  }, [allUsers]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((evt) => {
      const q = searchQuery.toLowerCase().trim();
      const creator = usersById[evt.created_by];
      const creatorName = creator?.name?.toLowerCase() || '';
      const creatorEmail = creator?.email?.toLowerCase() || '';

      const matchesSearch =
        !q ||
        evt.title.toLowerCase().includes(q) ||
        evt.description.toLowerCase().includes(q) ||
        evt.created_by.toLowerCase().includes(q) ||
        creatorName.includes(q) ||
        creatorEmail.includes(q) ||
        (evt.city && evt.city.toLowerCase().includes(q)) ||
        (evt.venue_name && evt.venue_name.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'ALL' || evt.status === statusFilter;
      const matchesCategory = selectedCategory === 'ALL' || evt.category === selectedCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [allEvents, searchQuery, statusFilter, selectedCategory, usersById]);

  // Overall Counts
  const totalEvents = allEvents.length;
  const upcomingCount = useMemo(() => allEvents.filter((e) => e.status === 'upcoming').length, [allEvents]);
  const cancelledCount = useMemo(() => allEvents.filter((e) => e.status === 'cancelled').length, [allEvents]);

  // Selected event creator record
  const selectedEventCreator = selectedEvent ? usersById[selectedEvent.created_by] : null;

  const handleForceCancel = async () => {
    if (!selectedEvent) return;
    setIsCancelling(true);
    try {
      const updated = await eventsApi.updateEvent(selectedEvent.id, { status: 'cancelled' });
      setSelectedEvent(updated);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setCancelModalOpen(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to force cancel event');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCopyShareLink = (eventId: string) => {
    const url = `${window.location.origin}/events/${eventId}`;
    navigator.clipboard.writeText(url);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 gap-6 max-w-[1400px] mx-auto min-h-screen">
      {/* Header Bar */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#1c1b1b] border border-[#353534] p-5 sm:p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab] animate-pulse"></span>
            <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold tracking-widest">
              EVENT GOVERNANCE
            </span>
          </div>
          <h1 className="font-headline-xl text-[24px] sm:text-[30px] text-[#e5e2e1] font-bold tracking-tight">
            Events Directory
          </h1>
          <p className="text-[13px] text-[#e6bdb8] font-data-mono mt-0.5">
            Manage meetups, inspect organizer records, and enforce platform standards
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-[12px] font-data-mono">
          <div className="px-3.5 py-1.5 bg-[#131313] border border-[#353534] rounded-xl flex items-center gap-2">
            <span className="text-[#e6bdb8]">Total:</span>
            <span className="text-[#e5e2e1] font-bold">{totalEvents}</span>
          </div>
          <div className="px-3.5 py-1.5 bg-[#131313] border border-[#353534] rounded-xl flex items-center gap-2">
            <span className="text-[#e6bdb8]">Active:</span>
            <span className="text-[#ffb4ab] font-bold">{upcomingCount}</span>
          </div>
          <div className="px-3.5 py-1.5 bg-[#131313] border border-[#353534] rounded-xl flex items-center gap-2">
            <span className="text-[#e6bdb8]">Cancelled:</span>
            <span className="text-[#ffdad6] font-bold">{cancelledCount}</span>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center justify-between bg-[#201f1f] border border-[#353534] p-4 rounded-2xl shadow-md">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#e6bdb8] text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event, organizer name, or city..."
              className="w-full bg-[#131313] text-[#e5e2e1] font-data-mono text-[13px] pl-10 pr-8 py-2.5 rounded-xl border border-[#353534] focus:border-[#ffb4ab] outline-none transition-colors placeholder-[#e6bdb8]/50"
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

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-1 bg-[#131313] p-1 rounded-xl border border-[#353534]">
            {(['ALL', 'upcoming', 'completed', 'cancelled'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-label-caps font-bold uppercase transition-all ${
                  statusFilter === st
                    ? 'bg-[#ffb4ab] text-[#690005] shadow-sm'
                    : 'text-[#e6bdb8] hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-[#131313] text-[#e5e2e1] font-data-mono text-[12px] px-3 py-2.5 rounded-xl border border-[#353534] focus:border-[#ffb4ab] outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {Object.entries(CATEGORY_LABEL_MAP).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#353534]/50">
          <span className="text-[#e6bdb8] font-data-mono text-[12px]">
            Showing <strong className="text-[#e5e2e1]">{filteredEvents.length}</strong> of {totalEvents}
          </span>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-[#131313] border border-[#353534] text-[#e6bdb8] hover:text-[#ffb4ab] transition-colors"
            title="Refresh events"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
          </button>
        </div>
      </section>

      {/* Lean Table Container (No Category column - Clean & Responsive) */}
      <section className="bg-[#201f1f] border border-[#353534] rounded-2xl overflow-hidden shadow-xl">
        {eventsLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined animate-spin text-[40px] text-[#ffb4ab] mb-3">
              progress_activity
            </span>
            <p className="font-data-mono text-[14px] text-[#e6bdb8]">LOADING EVENTS...</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-[#ffb4ab] text-[36px] mb-2">error</span>
            <p className="text-[#e5e2e1] font-bold text-[16px] mb-1">Failed to load events</p>
            <p className="text-[#e6bdb8] text-[13px] font-data-mono mb-4">
              Unable to reach backend API.
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-[#ffb4ab] text-[#690005] rounded-xl font-label-caps font-bold text-[12px]"
            >
              RETRY
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-20 px-6 text-center">
            <span className="material-symbols-outlined text-[#796e6d] text-[48px] mb-3 block">
              event_busy
            </span>
            <p className="text-[#e5e2e1] font-bold text-[17px] mb-1">No events match filter</p>
            <p className="text-[#e6bdb8] text-[13px] font-data-mono max-w-md mx-auto">
              Try adjusting your search terms or clearing the status/category filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-[#353534] bg-[#0e0e0e]/60">
                  <th className="p-4 font-label-caps text-[11px] text-[#e6bdb8] uppercase w-16 font-bold">
                    Cover
                  </th>
                  <th className="p-4 font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">
                    Event Title &amp; Creator
                  </th>
                  <th className="p-4 font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold whitespace-nowrap">
                    Date &amp; Time
                  </th>
                  <th className="p-4 font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold whitespace-nowrap">
                    Attendees
                  </th>
                  <th className="p-4 font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">
                    Status
                  </th>
                  <th className="p-4 font-label-caps text-[11px] text-[#e6bdb8] uppercase text-right w-24 font-bold">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#353534] text-[14px]">
                {filteredEvents.map((evt) => {
                  const coverImg = getEventImageUrl(evt);
                  const isCancelled = evt.status === 'cancelled';
                  const isCompleted = evt.status === 'completed';
                  const creator = usersById[evt.created_by];
                  const maxCap = evt.max_attendees ?? null;
                  const ratio = maxCap ? Math.min(100, Math.round((evt.confirmed_count / maxCap) * 100)) : 0;

                  return (
                    <tr
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className="hover:bg-[#2a2a2a]/90 transition-colors cursor-pointer group"
                    >
                      {/* 1. Cover Thumb */}
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-xl bg-[#131313] border border-[#353534] overflow-hidden flex items-center justify-center shrink-0">
                          {coverImg ? (
                            <img
                              src={coverImg}
                              alt={evt.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-[20px] text-[#796e6d]">
                              image
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Title + Creator User Details */}
                      <td className="p-4 max-w-[320px]">
                        <div className="font-semibold text-[#e5e2e1] group-hover:text-[#ffb4ab] transition-colors line-clamp-1 text-[15px]">
                          {evt.title}
                        </div>
                        <div className="flex items-center gap-2 text-[12px] text-[#e6bdb8] font-data-mono mt-0.5 truncate">
                          <span className="material-symbols-outlined text-[14px] text-[#ffb4ab] shrink-0">
                            person
                          </span>
                          <span className="truncate font-medium text-[#ffdad6]">
                            {creator ? creator.name : `Org ID: ${evt.created_by.slice(0, 8)}…`}
                          </span>
                          {creator?.email && (
                            <span className="text-[#c6c6c7] truncate">
                              ({creator.email})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Date & Time */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-data-mono text-[13px] text-[#e5e2e1]">
                          {formatEventDate(evt.start_time)}
                        </div>
                        <div className="font-data-mono text-[11px] text-[#e6bdb8]">
                          {formatEventTime(evt.start_time)}
                        </div>
                      </td>

                      {/* 4. Attendees (X/Y) */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-data-mono text-[13px] font-bold text-[#e5e2e1]">
                            {evt.confirmed_count}
                            <span className="text-[#c6c6c7] font-normal">
                              /{maxCap ?? '∞'}
                            </span>
                          </span>
                          {maxCap && (
                            <div className="w-16 h-1.5 bg-[#131313] rounded-full overflow-hidden border border-[#353534]">
                              <div
                                className="h-full bg-[#ffb4ab] rounded-full transition-all"
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Status Badge */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps font-bold uppercase tracking-wider ${
                            isCancelled
                              ? 'bg-[#93000a]/40 text-[#ffdad6] border border-[#ffb4ab]/30'
                              : isCompleted
                              ? 'bg-[#353534] text-[#c6c6c7]'
                              : 'bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCancelled ? 'bg-[#ffdad6]' : isCompleted ? 'bg-[#c6c6c7]' : 'bg-[#ffb4ab]'
                            }`}
                          ></span>
                          {evt.status}
                        </span>
                      </td>

                      {/* 6. Inspect Button */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#131313] border border-[#353534] text-[#e6bdb8] hover:text-[#ffb4ab] hover:border-[#ffb4ab]/50 transition-all font-label-caps text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <span>VIEW</span>
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ========================================================
          EVENT DETAILS POPUP MODAL DIALOG (Centered Popup)
          ======================================================== */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-[#1c1b1b] border border-[#353534] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Banner */}
            <div className="relative h-44 sm:h-52 bg-[#131313] overflow-hidden shrink-0 border-b border-[#353534]">
              {getEventImageUrl(selectedEvent) ? (
                <img
                  src={getEventImageUrl(selectedEvent)}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#796e6d]">
                  <span className="material-symbols-outlined text-[44px] mb-1">image</span>
                  <span className="font-data-mono text-[11px]">No cover image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1b] via-[#1c1b1b]/40 to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-[#e5e2e1] hover:text-[#ffb4ab] flex items-center justify-center transition-colors border border-white/10 z-10"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>

              {/* Badges on Banner */}
              <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-2 z-10">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-label-caps font-bold bg-black/80 backdrop-blur-md border border-white/10 text-[#ffb4ab]">
                    <span className="material-symbols-outlined text-[14px]">
                      {CATEGORY_ICON_MAP[selectedEvent.category] || 'category'}
                    </span>
                    {CATEGORY_LABEL_MAP[selectedEvent.category] || selectedEvent.category}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-lg text-[11px] font-label-caps font-bold uppercase tracking-wider border ${
                      selectedEvent.status === 'cancelled'
                        ? 'bg-[#93000a] text-[#ffdad6] border-[#ffdad6]/30'
                        : selectedEvent.status === 'completed'
                        ? 'bg-[#353534] text-[#c6c6c7] border-[#353534]'
                        : 'bg-[#ffb4ab] text-[#690005] border-[#ffb4ab]'
                    }`}
                  >
                    {selectedEvent.status}
                  </span>
                </div>

                <div className="text-[12px] font-data-mono px-3 py-1 rounded-lg bg-black/70 text-[#e5e2e1] border border-white/10">
                  {selectedEvent.is_paid ? `${selectedEvent.currency} ${selectedEvent.price}` : 'FREE ADMISSION'}
                </div>
              </div>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Event Title & Metadata */}
              <div>
                <h2 className="text-[20px] sm:text-[24px] font-bold text-[#e5e2e1] leading-snug mb-1">
                  {selectedEvent.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-data-mono text-[#e6bdb8]">
                  <span>Event ID: {selectedEvent.id}</span>
                  <span>•</span>
                  <span>Created: {new Date(selectedEvent.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* ========================================================
                  CREATOR / USER DETAILS BOX (High Visibility)
                  ======================================================== */}
              <div className="bg-[#131313] border border-[#353534] rounded-2xl p-4 sm:p-5 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#353534]/60 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">
                      account_circle
                    </span>
                    <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold tracking-wider">
                      Event Creator &amp; Organizer Record
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEvent(null);
                      onNavigate('admin-users');
                    }}
                    className="text-[11px] font-label-caps text-[#ffb4ab] hover:underline font-bold flex items-center gap-1"
                  >
                    <span>USER DIRECTORY</span>
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <span className="text-[10px] uppercase font-label-caps text-[#e6bdb8] block font-bold mb-0.5">
                      Full Name
                    </span>
                    <p className="text-[14px] font-semibold text-[#e5e2e1]">
                      {selectedEventCreator?.name || 'Unknown / Deleted User'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-label-caps text-[#e6bdb8] block font-bold mb-0.5">
                      Email Address
                    </span>
                    <p className="text-[13px] font-data-mono text-[#e5e2e1] truncate">
                      {selectedEventCreator?.email || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-label-caps text-[#e6bdb8] block font-bold mb-0.5">
                      Platform Role
                    </span>
                    <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-label-caps font-bold uppercase bg-[#201f1f] text-[#ffb4ab] border border-[#ffb4ab]/30">
                      {selectedEventCreator?.role || 'ORGANIZER'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-label-caps text-[#e6bdb8] block font-bold mb-0.5">
                      Creator User ID
                    </span>
                    <p className="text-[11px] font-data-mono text-[#c6c6c7] truncate" title={selectedEvent.created_by}>
                      {selectedEvent.created_by}
                    </p>
                  </div>
                </div>
              </div>

              {/* Logistics & Timing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#201f1f] border border-[#353534] rounded-2xl p-4 text-[13px]">
                <div>
                  <span className="text-[10px] uppercase font-label-caps text-[#e6bdb8] block font-bold mb-1">
                    Date &amp; Schedule
                  </span>
                  <div className="flex items-center gap-2 text-[#e5e2e1] font-data-mono text-[12px]">
                    <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">
                      calendar_today
                    </span>
                    <span>{formatEventDate(selectedEvent.start_time)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#e6bdb8] font-data-mono text-[11px] mt-0.5">
                    <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">
                      schedule
                    </span>
                    <span>{formatEventTime(selectedEvent.start_time)}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-label-caps text-[#e6bdb8] block font-bold mb-1">
                    Location &amp; Format
                  </span>
                  <div className="flex items-start gap-2 text-[#e5e2e1] text-[12px]">
                    <span className="material-symbols-outlined text-[16px] text-[#ffb4ab] shrink-0 mt-0.5">
                      {selectedEvent.is_online ? 'laptop_mac' : 'location_on'}
                    </span>
                    <span className="line-clamp-2">
                      {getEventLocationLabel(selectedEvent)}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-label-caps text-[#e6bdb8] block font-bold mb-1">
                    Confirmed Occupancy
                  </span>
                  <p className="text-[#e5e2e1] font-data-mono font-bold text-[14px]">
                    {selectedEvent.confirmed_count}{' '}
                    <span className="text-[#c6c6c7] font-normal text-[12px]">
                      / {selectedEvent.max_attendees ?? 'Unlimited'} spots
                    </span>
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-label-caps text-[#e6bdb8] block font-bold mb-1">
                    Pricing
                  </span>
                  <p className="text-[#e5e2e1] font-data-mono font-bold text-[14px]">
                    {selectedEvent.is_paid ? `${selectedEvent.currency} ${selectedEvent.price}` : 'Free'}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold tracking-wider mb-2">
                  Event Description
                </h3>
                <div className="bg-[#131313] border border-[#353534] rounded-xl p-4 text-[13px] text-[#e5e2e1] leading-relaxed whitespace-pre-line font-body">
                  {selectedEvent.description || 'No description provided.'}
                </div>
              </div>

              {/* Schedule Items (if any) */}
              {selectedEvent.schedule_items && selectedEvent.schedule_items.length > 0 && (
                <div>
                  <h3 className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold tracking-wider mb-2">
                    Schedule Breakdown ({selectedEvent.schedule_items.length} items)
                  </h3>
                  <div className="space-y-2 bg-[#131313] border border-[#353534] rounded-xl p-4">
                    {selectedEvent.schedule_items.map((item, idx) => (
                      <div key={item.id || idx} className="flex items-start gap-3 text-[13px]">
                        <span className="font-data-mono text-[11px] text-[#ffb4ab] shrink-0 mt-0.5 w-16">
                          {formatEventTime(item.item_time)}
                        </span>
                        <div className="flex-1">
                          <p className="text-[#e5e2e1] font-medium">{item.title}</p>
                          {item.description && (
                            <p className="text-[12px] text-[#e6bdb8]">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Action Footer */}
            <div className="p-4 sm:p-5 border-t border-[#353534] bg-[#171616] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyShareLink(selectedEvent.id)}
                  className="px-3.5 py-2 rounded-xl bg-[#201f1f] hover:bg-[#2a2a2a] border border-[#353534] text-[#e5e2e1] text-[12px] font-label-caps font-bold transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copyFeedback ? 'check' : 'content_copy'}
                  </span>
                  {copyFeedback ? 'COPIED!' : 'COPY LINK'}
                </button>

                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    onNavigate('event-detail', selectedEvent.id);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#201f1f] hover:bg-[#2a2a2a] border border-[#353534] text-[#e5e2e1] text-[12px] font-label-caps font-bold transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  PREVIEW
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedEvent.status !== 'cancelled' && (
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#93000a] hover:bg-[#b3261e] text-[#ffdad6] text-[12px] font-label-caps font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">block</span>
                    FORCE CANCEL
                  </button>
                )}

                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 rounded-xl bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] text-[12px] font-label-caps font-bold transition-colors"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          FORCE CANCEL CONFIRMATION MODAL
          ======================================================== */}
      {cancelModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#1c1b1b] border-2 border-[#ffb4ab] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#ffdad6]">
              <span className="material-symbols-outlined text-[32px] text-[#ffb4ab]">
                warning
              </span>
              <div>
                <h3 className="text-[17px] font-bold text-[#e5e2e1]">Confirm Force Cancellation</h3>
                <p className="text-[11px] font-label-caps text-[#ffb4ab] font-bold">
                  DESTRUCTIVE GOVERNANCE ACTION
                </p>
              </div>
            </div>

            <p className="text-[13px] text-[#e6bdb8] leading-relaxed">
              Are you sure you want to force-cancel{' '}
              <strong className="text-[#e5e2e1] font-semibold">"{selectedEvent.title}"</strong>?
              This will mark the event as cancelled platform-wide.
            </p>

            <div className="bg-[#131313] p-3 rounded-xl border border-[#353534] text-[12px] font-data-mono text-[#e6bdb8]">
              <div>Event: {selectedEvent.title}</div>
              <div>Organizer: {selectedEventCreator?.name || selectedEvent.created_by}</div>
              <div>Attendees impacted: {selectedEvent.confirmed_count}</div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                disabled={isCancelling}
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#201f1f] text-[#e5e2e1] font-label-caps text-[12px] font-bold hover:bg-[#2a2a2a] transition-colors"
              >
                ABORT
              </button>
              <button
                disabled={isCancelling}
                onClick={handleForceCancel}
                className="px-4 py-2 rounded-xl bg-[#93000a] text-[#ffdad6] font-label-caps text-[12px] font-bold hover:bg-[#b3261e] transition-colors flex items-center gap-2"
              >
                {isCancelling ? (
                  <>
                    <span className="material-symbols-outlined text-[16px] animate-spin">
                      progress_activity
                    </span>
                    <span>CANCELLING...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                    <span>YES, CANCEL EVENT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
