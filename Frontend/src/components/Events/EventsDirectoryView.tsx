import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ScreenType } from '../../types/eventboard';
import { EVENT_CATEGORIES } from '../../types';
import { eventsApi } from '../../lib/eventsApi';
import {
  getEventImageUrl,
  formatEventDate,
  formatEventTime,
  getEventLocationLabel,
  getEventBadge,
  CATEGORY_LABEL_MAP,
} from '../../lib/eventDisplay';

interface EventsDirectoryViewProps {
  onNavigate: (screen: ScreenType, eventId?: string) => void;
  onOpenCreateModal: () => void;
}

export const EventsDirectoryView: React.FC<EventsDirectoryViewProps> = ({
  onNavigate,
  onOpenCreateModal,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(6);
  const [categoryFilterOpen, setCategoryFilterOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState('ALL');

  // Fetch live events from FastAPI backend
  const {
    data: backendEvents = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventsApi.getEvents(),
  });

  // Extract unique cities from fetched backend events for dynamic filtering
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    backendEvents.forEach((evt) => {
      if (evt.city && evt.city.trim()) {
        cities.add(evt.city.trim());
      }
    });
    return Array.from(cities);
  }, [backendEvents]);

  // Filter events based on search, category, and city
  const filteredEvents = useMemo(() => {
    return backendEvents.filter((evt) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        evt.title.toLowerCase().includes(q) ||
        evt.description.toLowerCase().includes(q) ||
        (evt.venue_name && evt.venue_name.toLowerCase().includes(q)) ||
        (evt.city && evt.city.toLowerCase().includes(q)) ||
        (evt.address && evt.address.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'ALL' || evt.category === selectedCategory;

      const matchesLocation =
        locationFilter === 'ALL' ||
        (locationFilter === 'ONLINE' && evt.is_online) ||
        (evt.city && evt.city.toLowerCase() === locationFilter.toLowerCase());

      return matchesSearch && matchesCategory && matchesLocation;
    });
  }, [backendEvents, searchQuery, selectedCategory, locationFilter]);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col w-full bg-[#131313] min-h-screen pb-24 relative">
      {/* Subtle Grid Accent Background */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#e5e2e1_1px,transparent_1px),linear-gradient(to_bottom,#e5e2e1_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      <div className="max-w-[1280px] mx-auto w-full px-5 lg:px-16 py-12 relative z-10">
        {/* Editorial Header */}
        <header className="flex flex-col gap-3 mb-12 relative">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-8 h-[2px] bg-[#ffb4ab]"></span>
            <span className="font-label-caps text-label-caps text-[#ffb4ab] tracking-widest uppercase">
              GLOBAL DIRECTORY
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-headline-xl text-[44px] md:text-[64px] text-[#e5e2e1] max-w-2xl leading-tight tracking-tight font-bold">
                DISCOVER <br />
                <span className="text-[#e6bdb8]">EVENTS</span>
              </h1>

              <p className="font-data-mono text-data-mono text-[#e6bdb8] mt-2">
                // INDEX_REF: {backendEvents.length} ACTIVE SESSIONS IN DATABASE
              </p>
            </div>

            <button
              onClick={onOpenCreateModal}
              className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-6 py-3.5 rounded-xl font-label-caps text-[12px] uppercase tracking-wider font-bold shadow-lg transition-all hover:scale-105 flex items-center gap-2 self-start md:self-auto"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              HOST AN EVENT
            </button>
          </div>
        </header>

        {/* Search & Filter Toolbar (Sticky) */}
        <section className="flex flex-col lg:flex-row gap-4 mb-10 bg-[#1c1b1b] shadow-xl rounded-2xl p-4 items-center justify-between z-20 sticky top-[80px] border border-[#353534]/80 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row flex-1 w-full gap-3 items-center">
            {/* Search Input */}
            <div className="flex items-center bg-[#131313] w-full max-w-md rounded-xl shadow-inner px-4 py-2.5 h-12 border border-[#353534] focus-within:border-[#ffb4ab] transition-all">
              <span className="material-symbols-outlined text-[#e6bdb8] mr-3 text-[20px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, topics, or venues..."
                className="bg-transparent border-none outline-none font-data-mono text-[14px] text-[#e5e2e1] placeholder-[#e6bdb8]/50 w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#e6bdb8] hover:text-white">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto relative">
              {/* Category Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setCategoryFilterOpen(!categoryFilterOpen)}
                  className={`px-4 h-12 rounded-xl font-label-caps text-[12px] shadow-sm transition-colors flex items-center gap-2 border ${
                    selectedCategory !== 'ALL'
                      ? 'bg-[#2a2a2a] text-[#ffb4ab] border-[#ffb4ab]'
                      : 'bg-[#131313] text-[#e5e2e1] border-[#353534] hover:bg-[#2a2a2a]'
                  }`}
                >
                  <span>
                    CATEGORY{' '}
                    {selectedCategory !== 'ALL' &&
                      `(${CATEGORY_LABEL_MAP[selectedCategory as keyof typeof CATEGORY_LABEL_MAP] || selectedCategory})`}
                  </span>
                  <span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span>
                </button>

                {categoryFilterOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-[#201f1f] border border-[#353534] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in">
                    <button
                      onClick={() => {
                        setSelectedCategory('ALL');
                        setCategoryFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-[13px] font-medium transition-colors ${
                        selectedCategory === 'ALL'
                          ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                          : 'text-[#e5e2e1] hover:bg-[#2a2a2a]'
                      }`}
                    >
                      All Categories
                    </button>
                    {EVENT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => {
                          setSelectedCategory(cat.value);
                          setCategoryFilterOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-[13px] font-medium transition-colors flex items-center gap-2 ${
                          selectedCategory === cat.value
                            ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                            : 'text-[#e5e2e1] hover:bg-[#2a2a2a]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Location Quick filter */}
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="bg-[#131313] text-[#e5e2e1] border border-[#353534] hover:bg-[#2a2a2a] px-3 h-12 rounded-xl font-label-caps text-[12px] shadow-sm outline-none transition-colors cursor-pointer"
              >
                <option value="ALL">ALL LOCATIONS</option>
                <option value="ONLINE">🌐 ONLINE ONLY</option>
                {availableCities.map((city) => (
                  <option key={city} value={city}>
                    📍 {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-1 bg-[#131313] p-1 rounded-xl border border-[#353534] shrink-0 mt-2 lg:mt-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#2a2a2a] text-[#ffb4ab] shadow-sm'
                  : 'text-[#e6bdb8] hover:text-[#e5e2e1]'
              }`}
              title="Grid view"
            >
              <span className="material-symbols-outlined">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#2a2a2a] text-[#ffb4ab] shadow-sm'
                  : 'text-[#e6bdb8] hover:text-[#e5e2e1]'
              }`}
              title="List view"
            >
              <span className="material-symbols-outlined">view_list</span>
            </button>
          </div>
        </section>

        {/* Results Counter */}
        <div className="flex justify-between items-center mb-6">
          <span className="font-data-mono text-[13px] text-[#e6bdb8]">
            SHOWING {Math.min(visibleCount, filteredEvents.length)} OF {filteredEvents.length} MATCHING EVENTS
          </span>
          {(selectedCategory !== 'ALL' || locationFilter !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setLocationFilter('ALL');
                setSearchQuery('');
              }}
              className="text-[#ffb4ab] hover:underline font-label-caps text-[12px] font-bold"
            >
              RESET FILTERS
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined animate-spin text-[40px] text-[#ffb4ab] mb-4">
              progress_activity
            </span>
            <p className="font-data-mono text-[14px] text-[#e6bdb8]">LOADING LIVE EVENTS...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-8 bg-[#690005]/20 border border-[#ffb4ab]/30 rounded-2xl text-center space-y-3">
            <span className="material-symbols-outlined text-[#ffb4ab] text-[36px]">error</span>
            <h3 className="text-white font-bold text-[18px]">Could not load events from server</h3>
            <p className="text-[#e6bdb8] text-[13px]">Please check your network or backend connection.</p>
            <button
              onClick={() => refetch()}
              className="bg-[#ffb4ab] text-[#690005] px-5 py-2 rounded-xl font-label-caps text-[11px] font-bold uppercase"
            >
              RETRY
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredEvents.length === 0 && (
          <div className="py-16 px-6 text-center max-w-lg mx-auto bg-[#1c1b1b] border border-[#353534] rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 flex items-center justify-center text-[#ffb4ab] mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">event_busy</span>
            </div>
            <h3 className="font-headline-md text-[20px] text-white font-bold mb-2">No Events Found</h3>
            <p className="text-[#e6bdb8] text-[14px] mb-6">
              {backendEvents.length === 0
                ? 'There are currently no active meetups in the system. Be the first to host an event!'
                : 'No events match your current filter criteria. Try adjusting your search query or reset filters.'}
            </p>
            {backendEvents.length === 0 ? (
              <button
                onClick={onOpenCreateModal}
                className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-6 py-3 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all shadow-md"
              >
                HOST FIRST EVENT
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setLocationFilter('ALL');
                  setSearchQuery('');
                }}
                className="bg-[#2a2a2a] hover:bg-[#353534] text-white px-6 py-2.5 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all"
              >
                CLEAR ALL FILTERS
              </button>
            )}
          </div>
        )}

        {/* Event List / Grid */}
        {!isLoading && filteredEvents.length > 0 && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 transition-all duration-300">
                {filteredEvents.slice(0, visibleCount).map((event) => {
                  const isBookmarked = bookmarkedIds[event.id];
                  const imageUrl = getEventImageUrl(event);
                  const badge = getEventBadge(event);
                  const categoryLabel = CATEGORY_LABEL_MAP[event.category] || event.category;
                  const dateStr = formatEventDate(event.start_time);
                  const timeStr = formatEventTime(event.start_time, event.end_time);
                  const locationStr = getEventLocationLabel(event);

                  return (
                    <article
                      key={event.id}
                      onClick={() => onNavigate('event-detail', event.id)}
                      className="flex flex-col bg-[#201f1f] shadow-md hover:shadow-2xl rounded-2xl overflow-hidden group transition-all duration-300 transform hover:-translate-y-1.5 border border-[#353534] hover:border-[#ffb4ab] cursor-pointer"
                    >
                      <div className="relative w-full h-56 bg-cover bg-center overflow-hidden bg-[#2a2a2a]">
                        <div
                          className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                          style={{ backgroundImage: `url('${imageUrl}')` }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#201f1f] via-transparent to-transparent opacity-90"></div>

                        {/* Badge */}
                        <div
                          className={`absolute top-4 left-4 px-3 py-1 rounded font-label-caps text-[10px] shadow-lg backdrop-blur-sm flex items-center gap-1.5 font-bold ${
                            badge.type === 'almost-full'
                              ? 'bg-[#ffb4ab] text-[#690005]'
                              : badge.type === 'online'
                              ? 'bg-[#003822] text-[#66df98] border border-[#66df98]/30'
                              : badge.type === 'free'
                              ? 'bg-[#1e293b] text-[#93c5fd] border border-[#93c5fd]/30'
                              : 'bg-[#2a2a2a] text-[#ffdad6] border border-[#ffb4ab]/30'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                          {badge.label}
                        </div>

                        {/* Bookmark */}
                        <button
                          onClick={(e) => toggleBookmark(event.id, e)}
                          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#353534]/80 backdrop-blur text-[#e5e2e1] flex items-center justify-center hover:bg-[#ffb4ab] hover:text-[#690005] transition-colors"
                          title="Bookmark"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {isBookmarked ? 'bookmark' : 'bookmark_border'}
                          </span>
                        </button>
                      </div>

                      <div className="p-6 flex flex-col flex-1 relative z-10 -mt-6 bg-[#201f1f] rounded-t-2xl">
                        <span className="font-label-caps text-label-caps text-[#ffb4ab] mb-2 font-bold">
                          {categoryLabel.toUpperCase()}
                        </span>

                        <h2 className="font-headline-md text-[18px] text-[#e5e2e1] line-clamp-2 mb-3 group-hover:text-[#ffb4ab] transition-colors font-bold">
                          {event.title}
                        </h2>

                        <div className="flex flex-col gap-2 mb-5">
                          <div className="flex items-center gap-2 text-[#e6bdb8] text-[13px]">
                            <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">calendar_today</span>
                            <span className="font-data-mono">{dateStr} / {timeStr}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[#e6bdb8] text-[13px]">
                            <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">
                              {event.is_online ? 'language' : 'location_on'}
                            </span>
                            <span className="font-data-mono truncate">{locationStr}</span>
                          </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between pt-3 border-t border-[#353534]">
                          <div className="flex items-center gap-2 text-[#e6bdb8] font-data-mono text-[12px]">
                            <span className="text-[#ffb4ab] font-bold">
                              {event.is_paid ? `${event.currency} ${event.price}` : 'Free'}
                            </span>
                            <span>•</span>
                            <span>{event.confirmed_count} attendees</span>
                          </div>

                          <button className="w-11 h-11 rounded-full bg-[#353534] text-[#e5e2e1] group-hover:bg-[#ffb4ab] group-hover:text-[#690005] transition-all flex items-center justify-center shadow-md group-hover:scale-110">
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* List Mode */
              <div className="flex flex-col gap-4">
                {filteredEvents.slice(0, visibleCount).map((event) => {
                  const imageUrl = getEventImageUrl(event);
                  const badge = getEventBadge(event);
                  const categoryLabel = CATEGORY_LABEL_MAP[event.category] || event.category;
                  const dateStr = formatEventDate(event.start_time);
                  const timeStr = formatEventTime(event.start_time, event.end_time);
                  const locationStr = getEventLocationLabel(event);

                  return (
                    <article
                      key={event.id}
                      onClick={() => onNavigate('event-detail', event.id)}
                      className="bg-[#201f1f] border border-[#353534] hover:border-[#ffb4ab] p-5 rounded-2xl transition-all duration-200 flex flex-col md:flex-row items-center gap-6 cursor-pointer group"
                    >
                      <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden bg-[#2a2a2a] shrink-0 relative">
                        <div
                          className="w-full h-full bg-cover bg-center transition-transform group-hover:scale-105 duration-500"
                          style={{ backgroundImage: `url('${imageUrl}')` }}
                        ></div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-label-caps text-[11px] text-[#ffb4ab] font-bold">
                            {categoryLabel}
                          </span>
                          <span className="bg-[#2a2a2a] text-[#ffdad6] text-[10px] font-label-caps px-2 py-0.5 rounded border border-[#ffb4ab]/20">
                            {badge.label}
                          </span>
                        </div>
                        <h3 className="font-headline-md text-[18px] text-white group-hover:text-[#ffb4ab] transition-colors truncate font-bold">
                          {event.title}
                        </h3>
                        <p className="text-[#e6bdb8] text-[13px] line-clamp-1 mt-1">
                          {event.description}
                        </p>
                        <div className="flex flex-wrap gap-4 mt-3 text-[12px] font-data-mono text-[#e6bdb8]">
                          <span>📅 {dateStr} • {timeStr}</span>
                          <span>📍 {locationStr}</span>
                          <span>🎟️ {event.is_paid ? `${event.currency} ${event.price}` : 'Free Entry'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <button className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] font-label-caps text-[11px] px-4 py-2.5 rounded-lg font-bold">
                          VIEW EVENT →
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Load More Section */}
            {visibleCount < filteredEvents.length && (
              <div className="mt-16 flex flex-col items-center justify-center relative">
                <div className="w-px h-12 bg-[#353534] mb-6"></div>
                <button
                  onClick={() => setVisibleCount((prev) => prev + 3)}
                  className="bg-[#ffb4ab] text-[#690005] font-bold px-8 py-4 rounded font-label-caps text-label-caps shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                  LOAD MORE EVENTS
                </button>
                <span className="font-data-mono text-data-mono text-[#e6bdb8] mt-3">
                  SHOWING {Math.min(visibleCount, filteredEvents.length)} OF {filteredEvents.length}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
