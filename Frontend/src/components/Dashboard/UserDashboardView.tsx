import React from 'react';
import type { ScreenType } from '../../types/eventboard';
import { currentUser } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

interface UserDashboardViewProps {
  onNavigate: (screen: ScreenType, eventId?: string) => void;
  onOpenCreateModal: () => void;
}

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({ onNavigate, onOpenCreateModal }) => {
  const { user, isOrganizer, isAdmin } = useAuth();

  const displayName = user?.name || currentUser.name;
  const userInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roleLabel = isAdmin
    ? 'System Administrator'
    : user?.role === 'organizer'
    ? user.is_verified_organizer
      ? 'Verified Event Organizer'
      : 'Organizer (Verification Required)'
    : 'Community Member / Attendee';

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
            <div className="mt-1">
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
              <button
                onClick={() => onNavigate('events')}
                className="flex items-center gap-3 text-[#e5e2e1] hover:text-[#ffb4ab] transition-colors py-2 text-left"
              >
                <span className="material-symbols-outlined text-[20px] text-[#ffb4ab]">bookmarks</span>
                <span className="font-body-md text-[14px]">Browse All Events</span>
              </button>
              <button
                onClick={() => onNavigate('event-detail')}
                className="flex items-center gap-3 text-[#e5e2e1] hover:text-[#ffb4ab] transition-colors py-2 text-left"
              >
                <span className="material-symbols-outlined text-[20px] text-[#ffb4ab]">history</span>
                <span className="font-body-md text-[14px]">Featured Masterclass</span>
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#201f1f] rounded-2xl p-5 border border-[#5c403c] hover:scale-[1.02] transition-transform shadow-md">
                <span className="material-symbols-outlined text-[#ffb4ab] mb-2 text-[26px]">event_available</span>
                <div className="font-headline-lg text-[32px] text-[#e5e2e1] mb-1 font-bold font-data-mono">
                  {currentUser.stats.joined}
                </div>
                <div className="font-label-caps text-[10px] text-[#e6bdb8] uppercase font-bold">
                  EVENTS JOINED
                </div>
              </div>

              <div className="bg-[#201f1f] rounded-2xl p-5 border border-[#5c403c] hover:scale-[1.02] transition-transform shadow-md">
                <span className="material-symbols-outlined text-[#bdc7d8] mb-2 text-[26px]">add_box</span>
                <div className="font-headline-lg text-[32px] text-[#e5e2e1] mb-1 font-bold font-data-mono">
                  {currentUser.stats.created}
                </div>
                <div className="font-label-caps text-[10px] text-[#e6bdb8] uppercase font-bold">
                  CREATED
                </div>
              </div>

              <div className="bg-[#201f1f] rounded-2xl p-5 border border-[#5c403c] hover:scale-[1.02] transition-transform shadow-md">
                <span className="material-symbols-outlined text-[#c6c6c7] mb-2 text-[26px]">schedule</span>
                <div className="font-headline-lg text-[32px] text-[#e5e2e1] mb-1 font-bold font-data-mono">
                  {currentUser.stats.upcoming}
                </div>
                <div className="font-label-caps text-[10px] text-[#e6bdb8] uppercase font-bold">
                  UPCOMING
                </div>
              </div>

              <div className="bg-[#201f1f] rounded-2xl p-5 border border-[#5c403c] hover:scale-[1.02] transition-transform shadow-md">
                <span className="material-symbols-outlined text-[#ffb4ab] mb-2 text-[26px]">hourglass_empty</span>
                <div className="font-headline-lg text-[32px] text-[#e5e2e1] mb-1 font-bold font-data-mono">
                  {currentUser.stats.waitlisted}
                </div>
                <div className="font-label-caps text-[10px] text-[#e6bdb8] uppercase font-bold">
                  WAITLISTED
                </div>
              </div>
            </div>
          </section>

          {/* Upcoming Events & Activity Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Events Column */}
            <section className="flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <h2 className="font-headline-md text-[20px] text-[#e5e2e1] font-bold">
                  Upcoming Events
                </h2>
                <button
                  onClick={() => onNavigate('events')}
                  className="font-label-caps text-[11px] text-[#ffb4ab] hover:underline font-bold"
                >
                  VIEW ALL
                </button>
              </div>

              {/* Card 1 */}
              <div 
                onClick={() => onNavigate('event-detail')}
                className="bg-[#201f1f] border border-[#353534] rounded-2xl overflow-hidden shadow-md hover:scale-[1.01] transition-all cursor-pointer group hover:border-[#ffb4ab]"
              >
                <div
                  className="h-36 bg-[#2a2a2a] w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBTFoaYyLqx7Peg8W1HAThuJ3cHug-zRMmwwuMPdoHZgIVIrtnZMZ2zaufsf1yM4NdfL8nVqojgsiB2sCn-M1HqSiKWYu9nlD67YKpk2TPcYDUeO9587Fu3v-xWl6Jt9QlyrG4Xj4qDAEEhfOCa66Uc8YTQWimzam7v_8JYIDfCUhMHmv8LjZL5vvdDeQt5PU3tuuS98-vw6mtzwRJ9MbqHOFdKUTJQng-CWEMLTtvbSHWyVFhk37s')`
                  }}
                ></div>
                <div className="p-5">
                  <div className="font-label-caps text-[10px] text-[#ffb4ab] mb-1 font-bold">
                    CONFERENCE
                  </div>
                  <h3 className="font-headline-md text-[18px] text-[#e5e2e1] mb-2 font-bold group-hover:text-[#ffb4ab] transition-colors">
                    Web Summit 2024
                  </h3>
                  <div className="flex items-center gap-2 font-data-mono text-[13px] text-[#e6bdb8]">
                    <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">calendar_today</span>
                    <span>Oct 15, 09:00 AM</span>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div 
                onClick={() => onNavigate('event-detail')}
                className="bg-[#201f1f] border border-[#353534] rounded-2xl overflow-hidden shadow-md hover:scale-[1.01] transition-all cursor-pointer group hover:border-[#ffb4ab]"
              >
                <div className="p-5 flex gap-4 items-center">
                  <div
                    className="w-18 h-18 rounded-xl bg-[#353534] flex-shrink-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuB5iLcQHzJRPgiZnI95GYaFLUfDDoWsuRSy9BbrbXu2-KHDz6peYc1q9ee-WoYE6uK-bX2gvvhvQCOWItfObK68rAxqvsMgAum6lJcKW4R1MK49y2C_X6V4u4_EBtOP0nSkJwB1E5vxZ_c_5xEZfAh3ZUc7oQ965vSAx3msumn6REn7CQfsn-NJ5I5AlJO34cM_Xi4Pt4i0m7dIq-C4BqX4oeZy7R4qZ7SMULUFYSVv8wfno_aMLoo')`
                    }}
                  ></div>
                  <div>
                    <div className="font-label-caps text-[10px] text-[#bdc7d8] mb-1 font-bold">
                      WORKSHOP
                    </div>
                    <h3 className="font-body-lg text-[16px] font-bold text-[#e5e2e1] group-hover:text-[#ffb4ab] transition-colors">
                      React Performance Tuning
                    </h3>
                    <div className="font-data-mono text-[13px] text-[#e6bdb8] mt-1">
                      Tomorrow, 14:00 PM
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Activity Feed Column */}
            <section className="flex flex-col gap-4">
              <h2 className="font-headline-md text-[20px] text-[#e5e2e1] font-bold">
                Recent Activity
              </h2>

              <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-5 flex flex-col gap-2 shadow-md">
                <div className="flex gap-3 items-start py-3 border-b border-[#5c403c] last:border-0">
                  <div className="w-8 h-8 rounded-full bg-[#ffb4ab]/20 flex items-center justify-center text-[#ffb4ab] mt-0.5 shrink-0">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  </div>
                  <div>
                    <p className="font-body-md text-[14px] text-[#e5e2e1]">
                      You joined <span className="font-bold text-white">React Kathmandu Meetup</span>.
                    </p>
                    <span className="font-data-mono text-[11px] text-[#e6bdb8]">2 hours ago</span>
                  </div>
                </div>

                <div className="flex gap-3 items-start py-3 border-b border-[#5c403c] last:border-0">
                  <div className="w-8 h-8 rounded-full bg-[#bdc7d8]/20 flex items-center justify-center text-[#bdc7d8] mt-0.5 shrink-0">
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                  </div>
                  <div>
                    <p className="font-body-md text-[14px] text-[#e5e2e1]">
                      Waitlist update: You are now #5 for <span className="font-bold text-white">Design Summit</span>.
                    </p>
                    <span className="font-data-mono text-[11px] text-[#e6bdb8]">1 day ago</span>
                  </div>
                </div>

                <div className="flex gap-3 items-start py-3 border-b border-[#5c403c] last:border-0">
                  <div className="w-8 h-8 rounded-full bg-[#c6c6c7]/20 flex items-center justify-center text-[#c6c6c7] mt-0.5 shrink-0">
                    <span className="material-symbols-outlined text-[16px]">star</span>
                  </div>
                  <div>
                    <p className="font-body-md text-[14px] text-[#e5e2e1]">
                      New event recommendation based on your interests in <span className="text-[#ffb4ab]">Distributed Systems</span>.
                    </p>
                    <span className="font-data-mono text-[11px] text-[#e6bdb8]">2 days ago</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Recommended Section */}
          <section>
            <h2 className="font-headline-md text-[20px] text-[#e5e2e1] mb-4 font-bold">
              Recommended for You
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => onNavigate('event-detail')}
                className="bg-[#201f1f] rounded-2xl p-5 shadow-md border border-[#5c403c] hover:border-[#ffb4ab] transition-all cursor-pointer group"
              >
                <div className="font-label-caps text-[10px] text-[#bdc7d8] mb-2 font-bold">
                  MEETUP
                </div>
                <h3 className="font-body-lg text-[16px] font-bold text-[#e5e2e1] mb-1 group-hover:text-[#ffb4ab] transition-colors">
                  Local Go Developers
                </h3>
                <p className="font-body-md text-[13px] text-[#e6bdb8] mb-4 line-clamp-2">
                  Join us for an evening of Go talks and networking.
                </p>
                <span className="text-[#ffb4ab] font-label-caps text-[11px] font-bold group-hover:underline">
                  VIEW DETAILS →
                </span>
              </div>

              <div 
                onClick={() => onNavigate('event-detail')}
                className="bg-[#201f1f] rounded-2xl p-5 shadow-md border border-[#5c403c] hover:border-[#ffb4ab] transition-all cursor-pointer group"
              >
                <div className="font-label-caps text-[10px] text-[#bdc7d8] mb-2 font-bold">
                  WEBINAR
                </div>
                <h3 className="font-body-lg text-[16px] font-bold text-[#e5e2e1] mb-1 group-hover:text-[#ffb4ab] transition-colors">
                  AI in Production
                </h3>
                <p className="font-body-md text-[13px] text-[#e6bdb8] mb-4 line-clamp-2">
                  Learn how to deploy LLMs safely and efficiently.
                </p>
                <span className="text-[#ffb4ab] font-label-caps text-[11px] font-bold group-hover:underline">
                  VIEW DETAILS →
                </span>
              </div>

              <div 
                onClick={() => onNavigate('event-detail')}
                className="bg-[#201f1f] rounded-2xl p-5 shadow-md border border-[#5c403c] hover:border-[#ffb4ab] transition-all cursor-pointer group"
              >
                <div className="font-label-caps text-[10px] text-[#bdc7d8] mb-2 font-bold">
                  HACKATHON
                </div>
                <h3 className="font-body-lg text-[16px] font-bold text-[#e5e2e1] mb-1 group-hover:text-[#ffb4ab] transition-colors">
                  Climate Tech Hack
                </h3>
                <p className="font-body-md text-[13px] text-[#e6bdb8] mb-4 line-clamp-2">
                  Build solutions for a sustainable future.
                </p>
                <span className="text-[#ffb4ab] font-label-caps text-[11px] font-bold group-hover:underline">
                  VIEW DETAILS →
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
