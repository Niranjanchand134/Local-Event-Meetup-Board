import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ScreenType } from '../../types/eventboard';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../lib/eventsApi';
import {
  getEventImageUrl,
  formatEventDateShort,
  formatEventTime,
  getEventLocationLabel,
  getEventBadge,
  CATEGORY_LABEL_MAP,
} from '../../lib/eventDisplay';

interface DiscoverViewProps {
  onNavigate: (screen: ScreenType, eventId?: string) => void;
  onOpenCreateModal: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({ onNavigate, onOpenCreateModal }) => {
  const { isOrganizer } = useAuth();
  const [stats] = useState({
    eventsHosted: 10452,
    activeMembers: 25890,
    communities: 156,
    citiesActive: 52,
  });

  // Query featured events from FastAPI backend
  const { data: featuredEvents = [], isLoading } = useQuery({
    queryKey: ['events', 'featured'],
    queryFn: () => eventsApi.getEvents({ limit: 6 }),
  });

  return (
    <div className="flex flex-col w-full relative">
      {/* Interactive Visual Background Layer (Hero) */}
      <div className="absolute top-0 left-0 w-full h-[80vh] bg-[#131313] overflow-hidden -z-10 flex items-center justify-center opacity-40">
        <svg className="absolute inset-0 w-full h-full text-[#5c403c]/30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern height="64" id="hero-grid" patternUnits="userSpaceOnUse" width="64">
              <path d="M 64 0 L 0 0 0 64" fill="none" stroke="currentColor" strokeWidth="1"></path>
            </pattern>
          </defs>
          <rect fill="url(#hero-grid)" height="100%" width="100%"></rect>
        </svg>

        {/* Floating Event Node Visualizations */}
        <div className="relative w-full max-w-[1280px] h-full pointer-events-none">
          <div 
            onClick={() => onNavigate('events')}
            className="absolute top-1/4 left-[15%] hidden md:block pointer-events-auto cursor-pointer transition-transform hover:scale-105"
          >
            <div className="bg-[#131313] border border-[#5c403c] p-4 rounded shadow-2xl relative backdrop-blur-md">
              <span className="font-label-caps text-label-caps text-[#ffb4ab] block mb-2">TECH MEETUP</span>
              <span className="font-headline-md text-[18px] text-[#e5e2e1] block mb-1">Local Tech Circles</span>
              <div className="flex -space-x-2 mt-3">
                <div className="w-6 h-6 rounded-full bg-[#697382] border border-[#131313]"></div>
                <div className="w-6 h-6 rounded-full bg-[#dc2626] border border-[#131313]"></div>
                <div className="w-6 h-6 rounded-full bg-[#3a3939] border border-[#131313]"></div>
              </div>
            </div>
          </div>

          <div 
            onClick={() => onNavigate('events')}
            className="absolute top-1/3 right-[10%] hidden md:block pointer-events-auto cursor-pointer transition-transform hover:scale-105"
          >
            <div className="bg-[#131313] border border-[#5c403c] p-4 rounded shadow-2xl relative backdrop-blur-md">
              <span className="font-label-caps text-label-caps text-[#ffb4ab] block mb-2">COMMUNITY WORKSHOP</span>
              <span className="font-headline-md text-[18px] text-[#e5e2e1] block mb-1">Open Learning Sessions</span>
              <div className="flex -space-x-2 mt-3">
                <div className="w-6 h-6 rounded-full bg-[#454747] border border-[#131313]"></div>
                <div className="w-6 h-6 rounded-full bg-[#bdc7d8] border border-[#131313]"></div>
              </div>
            </div>
          </div>

          {/* Connecting SVG lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" style={{ zIndex: -1 }}>
            <path className="opacity-50" d="M 250 250 Q 500 100 800 300" fill="none" stroke="#5c403c" strokeDasharray="4 4" strokeWidth="1"></path>
          </svg>
        </div>
      </div>

      {/* Section 1: Hero */}
      <section className="relative max-w-[1280px] mx-auto w-full px-5 lg:px-16 py-20 md:py-28 flex flex-col items-center justify-center text-center z-10 min-h-[65vh]">
        <div className="mb-8 inline-flex items-center gap-4 bg-[#2a2a2a] px-4 py-2 rounded-full border border-[#353534]">
          <span className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-pulse"></span>
          <span className="font-label-caps text-label-caps text-[#e6bdb8]">LOCAL EVENTS · MEETUPS · COMMUNITY</span>
        </div>

        <h1 className="font-headline-xl text-[42px] md:text-[64px] text-[#e5e2e1] max-w-4xl tracking-tight mb-8 leading-[1.1]">
          Find What's Happening.<br />
          <span className="text-[#ffb4ab] italic font-semibold">Meet Who's Going.</span>
        </h1>

        <p className="font-body-lg text-body-lg text-[#e6bdb8] max-w-2xl mb-12">
          Discover local events, join communities, meet new people and create experiences worth remembering. Your next great connection starts here.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <button
            onClick={() => onNavigate('events')}
            className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-8 py-4 rounded font-label-caps text-label-caps tracking-widest transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-[#ffb4ab]/20 font-bold"
          >
            EXPLORE EVENTS
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>

          {isOrganizer && (
            <button
              onClick={onOpenCreateModal}
              className="bg-transparent border border-[#ac8884] text-[#e5e2e1] hover:bg-[#2a2a2a] px-8 py-4 rounded font-label-caps text-label-caps tracking-widest transition-all"
            >
              CREATE AN EVENT
            </button>
          )}
        </div>
      </section>

      {/* Technical Divider */}
      <div className="w-full h-px bg-[#353534] max-w-[1280px] mx-auto"></div>

      {/* Section 2: What's Happening Near You */}
      <section className="max-w-[1280px] mx-auto w-full px-5 lg:px-16 py-20 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
          <div className="flex flex-col">
            <span className="font-data-mono text-data-mono text-[#ffb4ab] mb-2 block">// 01 / FEATURED</span>
            <h2 className="font-headline-lg text-headline-lg text-[#e5e2e1]">What's Happening Near You</h2>
          </div>
          <button
            onClick={() => onNavigate('events')}
            className="font-label-caps text-label-caps text-[#e6bdb8] hover:text-[#ffb4ab] transition-colors flex items-center gap-2"
          >
            VIEW ALL EVENTS <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
          </button>
        </div>

        {/* Featured Events Grid */}
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <span className="material-symbols-outlined animate-spin text-[36px] text-[#ffb4ab]">
              progress_activity
            </span>
          </div>
        ) : featuredEvents.length === 0 ? (
          <div className="py-12 px-6 text-center bg-[#1c1b1b] border border-[#353534] rounded-2xl max-w-lg mx-auto">
            <span className="material-symbols-outlined text-[36px] text-[#ffb4ab] mb-3">event_available</span>
            <h3 className="text-white font-bold text-[18px] mb-1">No Active Events</h3>
            <p className="text-[#e6bdb8] text-[13px] mb-4">Be the first organizer to publish a community meetup.</p>
            <button
              onClick={onOpenCreateModal}
              className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-5 py-2.5 rounded-xl font-label-caps text-[11px] font-bold uppercase transition-all"
            >
              HOST AN EVENT
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.slice(0, 3).map((event) => {
              const { day, month } = formatEventDateShort(event.start_time);
              const timeStr = formatEventTime(event.start_time, event.end_time);
              const locationStr = getEventLocationLabel(event);
              const imageUrl = getEventImageUrl(event);
              const badge = getEventBadge(event);
              const categoryLabel = CATEGORY_LABEL_MAP[event.category] || event.category;

              return (
                <article
                  key={event.id}
                  onClick={() => onNavigate('event-detail', event.id)}
                  className="group bg-[#1c1b1b] border border-[#353534] hover:border-[#ffb4ab] transition-all duration-300 rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:shadow-[#ffb4ab]/5 hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-[#2a2a2a]">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url('${imageUrl}')` }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1b] via-transparent to-transparent"></div>
                    
                    <div className="absolute top-4 left-4 bg-[#131313]/90 backdrop-blur-sm border border-[#5c403c] px-3 py-1 rounded">
                      <span className="font-label-caps text-[10px] text-[#ffb4ab] font-bold">
                        {categoryLabel.toUpperCase()}
                      </span>
                    </div>

                    {badge.label && (
                      <div className="absolute top-4 right-4 bg-[#131313]/90 backdrop-blur-sm border border-[#5c403c] px-3 py-1 rounded flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] animate-pulse"></span>
                        <span className="font-data-mono text-[10px] text-[#e5e2e1]">{badge.label}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-6 flex flex-col flex-grow relative">
                    {/* Date badge */}
                    <div className="absolute -top-6 right-6 w-12 h-12 bg-[#ffb4ab] flex flex-col items-center justify-center rounded shadow-md border-2 border-[#1c1b1b]">
                      <span className="font-headline-md text-[16px] text-[#690005] font-bold leading-none">{day}</span>
                      <span className="font-label-caps text-[10px] text-[#690005]/80 font-bold">{month}</span>
                    </div>

                    <h3 className="font-headline-md text-[19px] text-[#e5e2e1] mb-2 mt-2 group-hover:text-[#ffb4ab] transition-colors line-clamp-1">
                      {event.title}
                    </h3>

                    <p className="font-body-md text-[14px] text-[#e6bdb8] mb-6 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>

                    <div className="mt-auto space-y-2 text-[13px]">
                      <div className="flex items-center gap-2 text-[#e6bdb8]">
                        <span className="material-symbols-outlined text-[16px] text-[#ac8884]">
                          {event.is_online ? 'language' : 'location_on'}
                        </span>
                        <span className="font-data-mono truncate">{locationStr}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#e6bdb8]">
                        <span className="material-symbols-outlined text-[16px] text-[#ac8884]">schedule</span>
                        <span className="font-data-mono">{timeStr}</span>
                      </div>
                    </div>

                    <div className="w-full h-px bg-[#353534] my-4"></div>

                    <div className="flex items-center justify-between">
                      <span className="font-data-mono text-[12px] text-[#e6bdb8]">
                        {event.is_paid ? `${event.currency} ${event.price}` : 'Free'} • {event.confirmed_count} going
                      </span>

                      <span className="font-label-caps text-[12px] text-[#ffb4ab] group-hover:underline">
                        RSVP →
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Technical Divider */}
      <div className="w-full h-px bg-[#353534] max-w-[1280px] mx-auto"></div>

      {/* Section 3: Statistics / Banner */}
      <section className="bg-[#201f1f] py-20 relative overflow-hidden">
        {/* Abstract curve */}
        <svg className="absolute w-[200%] h-full top-0 -left-[50%] pointer-events-none opacity-20" preserveAspectRatio="none" viewBox="0 0 1000 200">
          <path d="M 0 100 Q 250 50 500 100 T 1000 100" fill="none" stroke="#ffb4ab" strokeWidth="2"></path>
        </svg>

        <div className="max-w-[1280px] mx-auto px-5 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 divide-x-0 md:divide-x divide-[#353534] text-center">
            <div className="flex flex-col items-center justify-center p-4">
              <span className="font-headline-xl text-[36px] md:text-[48px] text-[#e5e2e1] mb-2 font-data-mono font-bold">
                {stats.eventsHosted.toLocaleString()}+
              </span>
              <span className="font-label-caps text-label-caps text-[#ffb4ab] tracking-widest uppercase">
                Events Hosted
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-4">
              <span className="font-headline-xl text-[36px] md:text-[48px] text-[#e5e2e1] mb-2 font-data-mono font-bold">
                {stats.activeMembers.toLocaleString()}+
              </span>
              <span className="font-label-caps text-label-caps text-[#ffb4ab] tracking-widest uppercase">
                Active Members
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-4">
              <span className="font-headline-xl text-[36px] md:text-[48px] text-[#e5e2e1] mb-2 font-data-mono font-bold">
                {stats.communities}+
              </span>
              <span className="font-label-caps text-label-caps text-[#ffb4ab] tracking-widest uppercase">
                Communities
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-4">
              <span className="font-headline-xl text-[36px] md:text-[48px] text-[#e5e2e1] mb-2 font-data-mono font-bold">
                {stats.citiesActive}+
              </span>
              <span className="font-label-caps text-label-caps text-[#ffb4ab] tracking-widest uppercase">
                Cities Active
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Divider */}
      <div className="w-full h-px bg-[#353534] max-w-[1280px] mx-auto"></div>

      {/* Section 4: Discover by Category (Bento) */}
      <section className="max-w-[1280px] mx-auto w-full px-5 lg:px-16 py-20">
        <div className="flex flex-col mb-12">
          <span className="font-data-mono text-data-mono text-[#ffb4ab] mb-2 block">// 02 / CATEGORIES</span>
          <h2 className="font-headline-lg text-headline-lg text-[#e5e2e1]">Explore Categories</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-[repeat(2,200px)] gap-4">
          {/* Large Panel: Workshops */}
          <div
            onClick={() => onNavigate('events')}
            className="group md:col-span-2 md:row-span-2 relative rounded-xl overflow-hidden flex items-end p-8 border border-[#353534] hover:border-[#ffb4ab] transition-all cursor-pointer bg-[#1c1b1b]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-60"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80')`
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#131313]/50 to-transparent"></div>
            
            <div className="relative z-10 w-full">
              <div className="flex justify-between items-center w-full">
                <div>
                  <h3 className="font-headline-lg text-[28px] text-[#e5e2e1] group-hover:text-[#ffb4ab] transition-colors">
                    Workshops &amp; Hands-on
                  </h3>
                  <span className="font-data-mono text-[13px] text-[#e6bdb8] block mt-1">
                    Interactive technical &amp; skill-building sessions
                  </span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#131313]/70 backdrop-blur border border-[#353534] flex items-center justify-center group-hover:bg-[#ffb4ab] transition-colors">
                  <span className="material-symbols-outlined text-[#e5e2e1] group-hover:text-[#690005]">
                    arrow_forward
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Small Panel 1: Community Classes */}
          <div
            onClick={() => onNavigate('events')}
            className="group md:col-span-2 md:row-span-1 relative rounded-xl overflow-hidden flex items-end p-6 border border-[#353534] hover:border-[#ffb4ab] transition-all cursor-pointer bg-[#1c1b1b]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 opacity-50"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80')`
              }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] to-transparent"></div>
            
            <div className="relative z-10 w-full flex justify-between items-end">
              <div>
                <h3 className="font-headline-md text-[20px] text-[#e5e2e1] group-hover:text-[#ffb4ab] transition-colors">
                  Community Classes
                </h3>
                <span className="font-data-mono text-[12px] text-[#e6bdb8] block mt-1">
                  Open community lessons &amp; classes
                </span>
              </div>
              <span className="material-symbols-outlined text-[#e6bdb8] group-hover:text-[#ffb4ab] transition-colors">
                arrow_forward
              </span>
            </div>
          </div>

          {/* Small Panel 2: Study Groups */}
          <div
            onClick={() => onNavigate('events')}
            className="group md:col-span-1 md:row-span-1 relative rounded-xl overflow-hidden flex items-end p-6 border border-[#353534] hover:border-[#ffb4ab] transition-all bg-[#201f1f] cursor-pointer"
          >
            <div className="relative z-10 w-full flex flex-col justify-between h-full">
              <span className="material-symbols-outlined text-[32px] text-[#ffb4ab] mb-auto">menu_book</span>
              <div>
                <h3 className="font-headline-md text-[18px] text-[#e5e2e1] group-hover:text-[#ffb4ab] transition-colors">
                  Study Groups
                </h3>
                <span className="font-data-mono text-[12px] text-[#e6bdb8] block mt-1">Collaborative learning</span>
              </div>
            </div>
          </div>

          {/* Small Panel 3: Park Cleanup */}
          <div
            onClick={() => onNavigate('events')}
            className="group md:col-span-1 md:row-span-1 relative rounded-xl overflow-hidden flex items-end p-6 border border-[#353534] hover:border-[#ffb4ab] transition-all bg-[#201f1f] cursor-pointer"
          >
            <div className="relative z-10 w-full flex flex-col justify-between h-full">
              <span className="material-symbols-outlined text-[32px] text-[#ffb4ab] mb-auto">eco</span>
              <div>
                <h3 className="font-headline-md text-[18px] text-[#e5e2e1] group-hover:text-[#ffb4ab] transition-colors">
                  Neighborhood Action
                </h3>
                <span className="font-data-mono text-[12px] text-[#e6bdb8] block mt-1">Cleanups &amp; eco projects</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-[1280px] mx-auto w-full px-5 lg:px-16 py-16">
        <div className="bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 rounded-2xl p-8 md:p-16 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#ffb4ab]/15 via-transparent to-transparent opacity-60"></div>
          
          <h2 className="font-headline-lg text-headline-lg text-[#e5e2e1] max-w-2xl mb-6 relative z-10">
            Have something worth bringing people together for?
          </h2>
          
          <p className="font-body-lg text-body-lg text-[#e6bdb8] max-w-xl mb-10 relative z-10">
            Create an event, manage RSVPs, and build your community on EventBoard. It's free to get started.
          </p>
          
          {isOrganizer ? (
            <button
              onClick={onOpenCreateModal}
              className="relative z-10 bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-8 py-4 rounded font-label-caps text-label-caps tracking-widest transition-all hover:scale-105 shadow-lg shadow-[#ffb4ab]/20 font-bold flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              CREATE AN EVENT NOW
            </button>
          ) : (
            <button
              onClick={() => onNavigate('events')}
              className="relative z-10 bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-8 py-4 rounded font-label-caps text-label-caps tracking-widest transition-all hover:scale-105 shadow-lg shadow-[#ffb4ab]/20 font-bold flex items-center gap-2"
            >
              EXPLORE ALL EVENTS
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
