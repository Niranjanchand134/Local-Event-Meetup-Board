import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ScreenType } from '../../types/eventboard';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../lib/eventsApi';
import type { EventOut, EventCategory } from '../../types';
import {
  getEventImageUrl,
  formatEventDate,
  formatEventTime,
  CATEGORY_LABEL_MAP,
} from '../../lib/eventDisplay';

interface UserDashboardViewProps {
  onNavigate: (screen: ScreenType, eventId?: string) => void;
  onOpenCreateModal: () => void;
}

function getRelativeTime(isoString?: string): string {
  if (!isoString) return 'Recently';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({ onNavigate, onOpenCreateModal }) => {
  const { user, isOrganizer, isAdmin, isAuthenticated } = useAuth();

  // 1. Fetch all platform events
  const { data: allEvents = [] } = useQuery<EventOut[]>({
    queryKey: ['events', 'dashboard-all'],
    queryFn: () => eventsApi.getEvents(),
  });

  // 2. If organizer, fetch organizer's own created events
  const { data: myEvents = [] } = useQuery<EventOut[]>({
    queryKey: ['my-events', 'dashboard'],
    queryFn: () => eventsApi.getMyCreatedEvents(),
    enabled: !!isOrganizer,
  });

  // Defensive: If user is somehow not authenticated, do not show dashboard
  if (!isAuthenticated && !user) {
    return null;
  }

  const displayName = user?.name || 'Community Member';
  const userInitials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const roleLabel = isAdmin
    ? 'System Administrator'
    : user?.role === 'organizer'
    ? user.is_verified_organizer
      ? 'Verified Event Organizer'
      : 'Organizer (Verification Required)'
    : 'Community Member / Attendee';

  // Computed Dynamic Stats
  const organizerStats = useMemo(() => {
    const created = myEvents.length;
    const upcoming = myEvents.filter((e) => e.status === 'upcoming').length;
    const totalAttendees = myEvents.reduce((acc, e) => acc + (e.confirmed_count || 0), 0);
    const completed = myEvents.filter((e) => e.status === 'completed').length;
    return { created, upcoming, totalAttendees, completed };
  }, [myEvents]);

  const userStats = useMemo(() => {
    const totalAvailable = allEvents.length;
    const upcoming = allEvents.filter((e) => e.status === 'upcoming').length;
    const categoriesCount = new Set(allEvents.map((e) => e.category)).size;
    const freeCount = allEvents.filter((e) => !e.is_paid).length;
    return { totalAvailable, upcoming, categoriesCount, freeCount };
  }, [allEvents]);

  // Upcoming events display
  const primaryUpcomingList = useMemo(() => {
    if (isOrganizer && myEvents.length > 0) {
      const active = myEvents.filter((e) => e.status === 'upcoming');
      return active.length > 0 ? active : myEvents;
    }
    return allEvents.filter((e) => e.status === 'upcoming').slice(0, 5);
  }, [isOrganizer, myEvents, allEvents]);

  const eventCard1 = primaryUpcomingList[0] || allEvents[0] || null;
  const eventCard2 = primaryUpcomingList[1] || allEvents[1] || null;

  // Recommended events (up to 3 from available events)
  const recommendedList = useMemo(() => {
    if (allEvents.length === 0) return [];
    // Show events excluding eventCard1 if possible
    const pool = eventCard1 ? allEvents.filter((e) => e.id !== eventCard1.id) : allEvents;
    return (pool.length > 0 ? pool : allEvents).slice(0, 3);
  }, [allEvents, eventCard1]);

  return (
    <div className="flex flex-col w-full bg-[#131313] min-h-screen">
      <div className="max-w-[1280px] mx-auto w-full px-5 lg:px-16 py-12 flex flex-col lg:flex-row gap-8">
        {/* Sidebar / Quick Actions */}
        <aside className="w-full lg:w-1/4 flex flex-col gap-6">
          {/* Profile Card */}
          <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-6 flex flex-col items-center text-center shadow-md">
            <div className="w-24 h-24 rounded-full bg-[#2a2a2a] mb-4 overflow-hidden border-2 border-[#ac8884] flex items-center justify-center text-[28px] font-bold text-[#ffb4ab]">
              {userInitials}
            </div>
            <h2 className="font-headline-md text-[20px] text-[#e5e2e1] font-bold">
              {displayName}
            </h2>
            <p className="text-[12px] font-data-mono text-[#c6c6c7] mt-0.5 truncate max-w-full">
              {user?.email}
            </p>
            <div className="mt-2">
              <span className={`text-[11px] font-label-caps font-bold uppercase px-2.5 py-1 rounded-full border ${
                isAdmin
                  ? 'bg-[#690005]/40 text-[#ffdad6] border-[#ffb4ab]/30'
                  : isOrganizer
                  ? user?.is_verified_organizer
                    ? 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/30'
                    : 'bg-[#690005]/20 text-[#ffb4ab] border-[#ffb4ab]/30'
                  : 'bg-[#2a2a2a] text-[#e6bdb8] border-[#353534]'
              }`}>
                {roleLabel}
              </span>
            </div>

            <div className="mt-6 w-full flex flex-col gap-2.5">
              {isOrganizer && (
                <button
                  onClick={onOpenCreateModal}
                  className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-[#fff6f5] font-label-caps text-[12px] py-3 rounded-xl hover:scale-[1.02] transition-all shadow-sm font-bold uppercase flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {user?.is_verified_organizer || isAdmin ? 'add' : 'verified_user'}
                  </span>
                  {user?.is_verified_organizer || isAdmin ? 'CREATE EVENT' : 'VERIFY & CREATE'}
                </button>
              )}
              <button
                onClick={() => onNavigate('events')}
                className={`w-full font-label-caps text-[12px] py-3 rounded-xl transition-all uppercase font-semibold ${
                  isOrganizer
                    ? 'bg-[#131313] text-[#e5e2e1] border border-[#ac8884] hover:bg-[#2a2a2a]'
                    : 'bg-[#ffb4ab] text-[#690005] hover:bg-[#ffdad6] font-bold shadow-md hover:scale-[1.02]'
                }`}
              >
                EXPLORE EVENTS
              </button>
            </div>
          </div>

          {/* Quick Links Card */}
          <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-6 shadow-md">
            <h3 className="font-label-caps text-[11px] text-[#e6bdb8] mb-4 uppercase font-bold tracking-wider">
              QUICK LINKS
            </h3>
            <nav className="flex flex-col gap-2">
              {isOrganizer && (
                <>
                  <button
                    onClick={() => onNavigate('manage-event')}
                    className="flex items-center gap-3 text-[#e5e2e1] hover:text-[#ffb4ab] transition-colors py-2 text-left"
                  >
                    <span className="material-symbols-outlined text-[20px] text-[#ffb4ab]">hub</span>
                    <span className="font-body-md text-[14px]">Host Event Management</span>
                  </button>

                  <button
                    onClick={() => onNavigate('verification')}
                    className="flex items-center gap-3 text-[#e5e2e1] hover:text-[#ffb4ab] transition-colors py-2 text-left"
                  >
                    <span className="material-symbols-outlined text-[20px] text-[#ffb4ab]">verified_user</span>
                    <span className="font-body-md text-[14px]">
                      {user?.is_verified_organizer ? 'Verification Status' : 'Verify ID to Publish'}
                    </span>
                  </button>
                </>
              )}
              {!isOrganizer && !isAdmin && (
                <button
                  onClick={() => onNavigate('verification')}
                  className="flex items-center gap-3 text-[#e5e2e1] hover:text-[#ffb4ab] transition-colors py-2 text-left"
                >
                  <span className="material-symbols-outlined text-[20px] text-[#ffb4ab]">badge</span>
                  <span className="font-body-md text-[14px]">Apply as Organizer</span>
                </button>
              )}
              <button
                onClick={() => onNavigate('events')}
                className="flex items-center gap-3 text-[#e5e2e1] hover:text-[#ffb4ab] transition-colors py-2 text-left"
              >
                <span className="material-symbols-outlined text-[20px] text-[#ffb4ab]">bookmarks</span>
                <span className="font-body-md text-[14px]">Browse All Events</span>
              </button>
              <button
                onClick={() => onNavigate('events')}
                className="flex items-center gap-3 text-[#e5e2e1] hover:text-[#ffb4ab] transition-colors py-2 text-left"
              >
                <span className="material-symbols-outlined text-[20px] text-[#ffb4ab]">history</span>
                <span className="font-body-md text-[14px]">Community Meetups</span>
              </button>
              {isAdmin && (
                <>
                  <button
                    onClick={() => onNavigate('admin-verifications')}
                    className="flex items-center gap-3 text-[#ffb4ab] hover:text-[#ffdad6] transition-colors py-2 text-left"
                  >
                    <span className="material-symbols-outlined text-[20px] text-[#ffb4ab]">verified_user</span>
                    <span className="font-body-md text-[14px] font-bold">Review Verifications</span>
                  </button>
                  <button
                    onClick={() => onNavigate('admin-events')}
                    className="flex items-center gap-3 text-[#ffb4ab] hover:text-[#ffdad6] transition-colors py-2 text-left"
                  >
                    <span className="material-symbols-outlined text-[20px] text-[#ffb4ab]">calendar_month</span>
                    <span className="font-body-md text-[14px] font-bold">Events Directory</span>
                  </button>
                  <button
                    onClick={() => onNavigate('admin')}
                    className="flex items-center gap-3 text-[#ffb4ab] hover:text-[#ffdad6] transition-colors py-2 text-left"
                  >
                    <span className="material-symbols-outlined text-[20px] text-[#ffb4ab]">admin_panel_settings</span>
                    <span className="font-body-md text-[14px] font-bold">Admin Portal</span>
                  </button>
                </>
              )}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="w-full lg:w-3/4 flex flex-col gap-10">
          {/* Unverified Organizer Alert Banner */}
          {user?.role === 'organizer' && !user.is_verified_organizer && (
            <div className="p-6 bg-[#201f1f] border border-[#ffb4ab]/40 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ffb4ab]"></div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 flex items-center justify-center text-[#ffb4ab] shrink-0">
                  <span className="material-symbols-outlined text-[28px]">gpp_maybe</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-[18px] text-white font-bold">
                    Identity Verification Required
                  </h3>
                  <p className="text-[13px] text-[#e6bdb8] mt-1 max-w-xl">
                    To prevent fraudulent and fake events, organizers must verify their government ID
                    before publishing events. You can submit your application in under 2 minutes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('verification')}
                className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-6 py-2.5 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all shadow-md shrink-0 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">verified</span>
                VERIFY NOW
              </button>
            </div>
          )}

          {/* Welcome & Stats */}
          <section>
            <h1 className="font-headline-lg text-[32px] text-[#e5e2e1] mb-1 font-bold">
              Welcome back, {displayName.split(' ')[0]}.
            </h1>
            <p className="font-body-lg text-[16px] text-[#e6bdb8] mb-6">
              {isOrganizer
                ? 'Manage your hosted meetups and see community participation.'
                : 'Discover exciting meetups and manage your RSVPs.'}
            </p>

            {/* Dynamic 4 Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {isOrganizer ? (
                <>
                  {/* Organizer Card 1: Created */}
                  <div className="bg-[#201f1f] rounded-2xl p-5 border border-[#5c403c] hover:scale-[1.02] transition-transform shadow-md">
                    <span className="material-symbols-outlined text-[#bdc7d8] mb-2 text-[26px]">add_box</span>
                    <div className="font-headline-lg text-[32px] text-[#e5e2e1] mb-1 font-bold font-data-mono">
                      {organizerStats.created}
                    </div>
                    <div className="font-label-caps text-[10px] text-[#e6bdb8] uppercase font-bold">
                      HOSTED MEETUPS
                    </div>
                  </div>

                  {/* Organizer Card 2: Upcoming */}
                  <div className="bg-[#201f1f] rounded-2xl p-5 border border-[#5c403c] hover:scale-[1.02] transition-transform shadow-md">
                    <span className="material-symbols-outlined text-[#c6c6c7] mb-2 text-[26px]">schedule</span>
                    <div className="font-headline-lg text-[32px] text-[#e5e2e1] mb-1 font-bold font-data-mono">
                      {organizerStats.upcoming}
                    </div>
                    <div className="font-label-caps text-[10px] text-[#e6bdb8] uppercase font-bold">
                      UPCOMING
                    </div>
                  </div>

                  {/* Organizer Card 3: Total Attendees */}
                  <div className="bg-[#201f1f] rounded-2xl p-5 border border-[#5c403c] hover:scale-[1.02] transition-transform shadow-md">
                    <span className="material-symbols-outlined text-[#ffb4ab] mb-2 text-[26px]">event_available</span>
                    <div className="font-headline-lg text-[32px] text-[#e5e2e1] mb-1 font-bold font-data-mono">
                      {organizerStats.totalAttendees}
                    </div>
                    <div className="font-label-caps text-[10px] text-[#e6bdb8] uppercase font-bold">
                      TOTAL ATTENDEES
                    </div>
                  </div>

                  {/* Organizer Card 4: Completed */}
                  <div className="bg-[#201f1f] rounded-2xl p-5 border border-[#5c403c] hover:scale-[1.02] transition-transform shadow-md">
                    <span className="material-symbols-outlined text-[#ffb4ab] mb-2 text-[26px]">check_circle</span>
                    <div className="font-headline-lg text-[32px] text-[#e5e2e1] mb-1 font-bold font-data-mono">
                      {organizerStats.completed}
                    </div>
                    <div className="font-label-caps text-[10px] text-[#e6bdb8] uppercase font-bold">
                      COMPLETED
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Normal User Card 1: Available Events */}
                  <div className="bg-[#201f1f] rounded-2xl p-5 border border-[#5c403c] hover:scale-[1.02] transition-transform shadow-md">
                    <span className="material-symbols-outlined text-[#ffb4ab] mb-2 text-[26px]">event_available</span>
                    <div className="font-headline-lg text-[32px] text-[#e5e2e1] mb-1 font-bold font-data-mono">
                      {userStats.totalAvailable}
                    </div>
                    <div className="font-label-caps text-[10px] text-[#e6bdb8] uppercase font-bold">
                      EVENTS AVAILABLE
                    </div>
                  </div>

                  {/* Normal User Card 2: Upcoming */}
                  <div className="bg-[#201f1f] rounded-2xl p-5 border border-[#5c403c] hover:scale-[1.02] transition-transform shadow-md">
                    <span className="material-symbols-outlined text-[#c6c6c7] mb-2 text-[26px]">schedule</span>
                    <div className="font-headline-lg text-[32px] text-[#e5e2e1] mb-1 font-bold font-data-mono">
                      {userStats.upcoming}
                    </div>
                    <div className="font-label-caps text-[10px] text-[#e6bdb8] uppercase font-bold">
                      UPCOMING
                    </div>
                  </div>

                  {/* Normal User Card 3: Categories */}
                  <div className="bg-[#201f1f] rounded-2xl p-5 border border-[#5c403c] hover:scale-[1.02] transition-transform shadow-md">
                    <span className="material-symbols-outlined text-[#bdc7d8] mb-2 text-[26px]">category</span>
                    <div className="font-headline-lg text-[32px] text-[#e5e2e1] mb-1 font-bold font-data-mono">
                      {userStats.categoriesCount}
                    </div>
                    <div className="font-label-caps text-[10px] text-[#e6bdb8] uppercase font-bold">
                      CATEGORIES
                    </div>
                  </div>

                  {/* Normal User Card 4: Free Admission */}
                  <div className="bg-[#201f1f] rounded-2xl p-5 border border-[#5c403c] hover:scale-[1.02] transition-transform shadow-md">
                    <span className="material-symbols-outlined text-[#ffb4ab] mb-2 text-[26px]">local_activity</span>
                    <div className="font-headline-lg text-[32px] text-[#e5e2e1] mb-1 font-bold font-data-mono">
                      {userStats.freeCount}
                    </div>
                    <div className="font-label-caps text-[10px] text-[#e6bdb8] uppercase font-bold">
                      FREE ADMISSION
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Upcoming Events & Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Events Column */}
            <section className="flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <h2 className="font-headline-md text-[20px] text-[#e5e2e1] font-bold">
                  {isOrganizer ? 'My Hosted Events' : 'Upcoming Events'}
                </h2>
                <button
                  onClick={() => onNavigate(isOrganizer ? 'manage-event' : 'events')}
                  className="font-label-caps text-[11px] text-[#ffb4ab] hover:underline font-bold uppercase"
                >
                  VIEW ALL
                </button>
              </div>

              {/* Dynamic Card 1 */}
              {eventCard1 ? (
                <div 
                  onClick={() => onNavigate('event-detail', eventCard1.id)}
                  className="bg-[#201f1f] border border-[#353534] rounded-2xl overflow-hidden shadow-md hover:scale-[1.01] transition-all cursor-pointer group hover:border-[#ffb4ab]"
                >
                  <div
                    className="h-36 bg-[#2a2a2a] w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: `url('${getEventImageUrl(eventCard1)}')`
                    }}
                  ></div>
                  <div className="p-5">
                    <div className="font-label-caps text-[10px] text-[#ffb4ab] mb-1 font-bold uppercase">
                      {CATEGORY_LABEL_MAP[eventCard1.category as EventCategory] || eventCard1.category}
                    </div>
                    <h3 className="font-headline-md text-[18px] text-[#e5e2e1] mb-2 font-bold group-hover:text-[#ffb4ab] transition-colors line-clamp-1">
                      {eventCard1.title}
                    </h3>
                    <div className="flex items-center gap-2 font-data-mono text-[13px] text-[#e6bdb8]">
                      <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">calendar_today</span>
                      <span>{formatEventDate(eventCard1.start_time)}, {formatEventTime(eventCard1.start_time)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-6 text-center text-[#e6bdb8] font-data-mono text-[13px]">
                  No upcoming events scheduled yet.
                </div>
              )}

              {/* Dynamic Card 2 */}
              {eventCard2 ? (
                <div 
                  onClick={() => onNavigate('event-detail', eventCard2.id)}
                  className="bg-[#201f1f] border border-[#353534] rounded-2xl overflow-hidden shadow-md hover:scale-[1.01] transition-all cursor-pointer group hover:border-[#ffb4ab]"
                >
                  <div className="p-5 flex gap-4 items-center">
                    <div
                      className="w-18 h-18 rounded-xl bg-[#353534] flex-shrink-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url('${getEventImageUrl(eventCard2)}')`
                      }}
                    ></div>
                    <div className="min-w-0 flex-1">
                      <div className="font-label-caps text-[10px] text-[#bdc7d8] mb-1 font-bold uppercase">
                        {CATEGORY_LABEL_MAP[eventCard2.category as EventCategory] || eventCard2.category}
                      </div>
                      <h3 className="font-body-lg text-[16px] font-bold text-[#e5e2e1] group-hover:text-[#ffb4ab] transition-colors truncate">
                        {eventCard2.title}
                      </h3>
                      <div className="font-data-mono text-[13px] text-[#e6bdb8] mt-1">
                        {formatEventDate(eventCard2.start_time)}, {formatEventTime(eventCard2.start_time)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>

            {/* Recent Activity Feed Column */}
            <section className="flex flex-col gap-4">
              <h2 className="font-headline-md text-[20px] text-[#e5e2e1] font-bold">
                Recent Activity
              </h2>

              <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-5 flex flex-col gap-2 shadow-md">
                {/* Activity 1 */}
                <div className="flex gap-3 items-start py-3 border-b border-[#5c403c] last:border-0">
                  <div className="w-8 h-8 rounded-full bg-[#ffb4ab]/20 flex items-center justify-center text-[#ffb4ab] mt-0.5 shrink-0">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  </div>
                  <div>
                    <p className="font-body-md text-[14px] text-[#e5e2e1]">
                      Signed in as <span className="font-bold text-white">{user?.email}</span>.
                    </p>
                    <span className="font-data-mono text-[11px] text-[#e6bdb8]">Session active</span>
                  </div>
                </div>

                {/* Activity 2: Real Organizer or Platform Event Activity */}
                {isOrganizer && myEvents.length > 0 ? (
                  <div className="flex gap-3 items-start py-3 border-b border-[#5c403c] last:border-0">
                    <div className="w-8 h-8 rounded-full bg-[#bdc7d8]/20 flex items-center justify-center text-[#bdc7d8] mt-0.5 shrink-0">
                      <span className="material-symbols-outlined text-[16px]">campaign</span>
                    </div>
                    <div>
                      <p className="font-body-md text-[14px] text-[#e5e2e1]">
                        You published <span className="font-bold text-white">{myEvents[0].title}</span>.
                      </p>
                      <span className="font-data-mono text-[11px] text-[#e6bdb8]">
                        {getRelativeTime(myEvents[0].created_at)}
                      </span>
                    </div>
                  </div>
                ) : allEvents.length > 0 ? (
                  <div className="flex gap-3 items-start py-3 border-b border-[#5c403c] last:border-0">
                    <div className="w-8 h-8 rounded-full bg-[#bdc7d8]/20 flex items-center justify-center text-[#bdc7d8] mt-0.5 shrink-0">
                      <span className="material-symbols-outlined text-[16px]">event</span>
                    </div>
                    <div>
                      <p className="font-body-md text-[14px] text-[#e5e2e1]">
                        New meetup <span className="font-bold text-white">{allEvents[0].title}</span> available.
                      </p>
                      <span className="font-data-mono text-[11px] text-[#e6bdb8]">
                        {getRelativeTime(allEvents[0].created_at)}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Activity 3: Account Verification or Platform Standing */}
                <div className="flex gap-3 items-start py-3 border-b border-[#5c403c] last:border-0">
                  <div className="w-8 h-8 rounded-full bg-[#c6c6c7]/20 flex items-center justify-center text-[#c6c6c7] mt-0.5 shrink-0">
                    <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  </div>
                  <div>
                    <p className="font-body-md text-[14px] text-[#e5e2e1]">
                      Account status:{' '}
                      <span className="text-[#ffb4ab] font-medium">
                        {user?.is_verified_organizer
                          ? 'Verified Organizer'
                          : isOrganizer
                          ? 'Organizer (ID Pending)'
                          : 'Community Member'}
                      </span>
                    </p>
                    <span className="font-data-mono text-[11px] text-[#e6bdb8]">Profile verified</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Recommended Section (Dynamic from Real Events) */}
          <section>
            <h2 className="font-headline-md text-[20px] text-[#e5e2e1] mb-4 font-bold">
              Recommended for You
            </h2>

            {recommendedList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendedList.map((evt) => (
                  <div 
                    key={evt.id}
                    onClick={() => onNavigate('event-detail', evt.id)}
                    className="bg-[#201f1f] rounded-2xl p-5 shadow-md border border-[#5c403c] hover:border-[#ffb4ab] transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-label-caps text-[10px] text-[#bdc7d8] mb-2 font-bold uppercase">
                        {CATEGORY_LABEL_MAP[evt.category as EventCategory] || evt.category}
                      </div>
                      <h3 className="font-body-lg text-[16px] font-bold text-[#e5e2e1] mb-1 group-hover:text-[#ffb4ab] transition-colors line-clamp-1">
                        {evt.title}
                      </h3>
                      <p className="font-body-md text-[13px] text-[#e6bdb8] mb-4 line-clamp-2">
                        {evt.description || 'Join community members for this meetup.'}
                      </p>
                    </div>
                    <span className="text-[#ffb4ab] font-label-caps text-[11px] font-bold group-hover:underline flex items-center gap-1">
                      <span>VIEW DETAILS</span>
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#201f1f] rounded-2xl p-8 text-center border border-[#5c403c] text-[#e6bdb8] font-data-mono text-[13px]">
                Explore upcoming meetups across your community.
                <div className="mt-3">
                  <button
                    onClick={() => onNavigate('events')}
                    className="px-4 py-2 bg-[#ffb4ab] text-[#690005] rounded-xl font-label-caps font-bold text-[12px]"
                  >
                    BROWSE EVENTS
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
