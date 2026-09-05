import React, { useState } from 'react';
import type { ScreenType } from '../types/eventboard';
import { LOGO_URL } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  onOpenCreateModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentScreen, onNavigate, onOpenCreateModal }) => {
  const { user, logout, isAuthenticated, isAdmin, isOrganizer } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // If in admin mode, the header has a slightly different layout matching the screenshot
  const isAdminView = (currentScreen as string).startsWith('admin');

  if (isAdminView) {
    return (
      <header className="fixed top-0 left-64 right-0 h-[72px] bg-[#131313]/90 backdrop-blur-xl border-b border-[#353534] z-40 flex items-center justify-between px-6">
        <div className="flex items-center bg-[#1c1b1b] px-3 py-1.5 rounded border border-[#353534] w-96">
          <span className="material-symbols-outlined text-[#e6bdb8] text-[20px]">search</span>
          <input
            type="text"
            placeholder="SEARCH_SYSTEM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none px-2 font-data-mono text-[14px] text-[#e5e2e1] w-full placeholder-[#e6bdb8]/50"
          />
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="text-[#e6bdb8] hover:text-[#e5e2e1] transition-colors relative flex items-center"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#dc2626] animate-pulse"></span>
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-3 w-80 bg-[#201f1f] border border-[#353534] rounded-lg shadow-2xl p-4 z-50 animate-in fade-in">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#353534]">
                  <span className="font-label-caps text-[#ffb4ab] text-[11px]">SYSTEM ALERTS</span>
                  <span className="font-data-mono text-[11px] text-[#bdc7d8]">3 Unread</span>
                </div>
                <div className="space-y-2 text-[13px]">
                  <div className="p-2 rounded bg-[#2a2a2a] hover:bg-[#353534] transition-colors cursor-pointer">
                    <p className="font-semibold text-[#ffdad6]">12 Open Reports pending</p>
                    <span className="text-[11px] text-[#e6bdb8]">Requires admin moderation</span>
                  </div>
                  <div className="p-2 rounded bg-[#2a2a2a] hover:bg-[#353534] transition-colors cursor-pointer">
                    <p className="font-semibold text-[#e5e2e1]">Peak traffic spike</p>
                    <span className="text-[11px] text-[#c6c6c7]">+14% RSVP surge in Tokyo</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <div
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="w-8 h-8 rounded-full bg-[#ffb4ab] flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#ffdad6] transition-all font-bold text-[#690005] text-[14px]"
              title={user?.name ?? 'Admin'}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-[#201f1f] border border-[#353534] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in">
                <div className="px-3 py-2 border-b border-[#353534]">
                  <p className="font-semibold text-[14px] text-white">{user?.name ?? 'System Admin'}</p>
                  <p className="text-[12px] text-[#ffb4ab] font-data-mono font-bold">ADMINISTRATOR</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { onNavigate('home'); setUserDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2 text-[13px] text-[#e5e2e1] hover:bg-[#2a2a2a] rounded flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">home</span>
                    Exit to Main Site
                  </button>
                  <div className="h-px bg-[#353534] my-1"></div>
                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                      onNavigate('login');
                    }}
                    className="w-full text-left px-3 py-2 text-[13px] text-[#ffb4ab] hover:bg-[#2a2a2a] rounded flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign Out Admin
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 w-full z-50 bg-[#131313]/90 backdrop-blur-xl border-b border-[#353534]">
      <div className="h-[72px] max-w-[1280px] mx-auto px-5 lg:px-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img
            alt="EventBoard Logo"
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
            src={LOGO_URL}
          />
          <span className="font-headline-md text-[22px] font-bold text-[#e5e2e1] tracking-tight group-hover:text-white transition-colors">
            EventBoard
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8 h-full">
          <button
            onClick={() => onNavigate('home')}
            className={`font-label-caps text-label-caps uppercase transition-colors py-6 h-full border-b-2 ${currentScreen === 'home'
              ? 'text-[#ffb4ab] border-[#ffb4ab]'
              : 'text-[#e6bdb8] hover:text-[#e5e2e1] border-transparent'
              }`}
          >
            Discover
          </button>
          <button
            onClick={() => onNavigate('events')}
            className={`font-label-caps text-label-caps uppercase transition-colors py-6 h-full border-b-2 ${currentScreen === 'events' || currentScreen === 'event-detail'
              ? 'text-[#ffb4ab] border-[#ffb4ab]'
              : 'text-[#e6bdb8] hover:text-[#e5e2e1] border-transparent'
              }`}
          >
            Events
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className={`font-label-caps text-label-caps uppercase transition-colors py-6 h-full border-b-2 ${currentScreen === 'dashboard'
              ? 'text-[#ffb4ab] border-[#ffb4ab]'
              : 'text-[#e6bdb8] hover:text-[#e5e2e1] border-transparent'
              }`}
          >
            Dashboard
          </button>
          {isOrganizer && (
            <button
              onClick={() => onNavigate('manage-event')}
              className={`font-label-caps text-label-caps uppercase transition-colors py-6 h-full border-b-2 ${currentScreen === 'manage-event'
                ? 'text-[#ffb4ab] border-[#ffb4ab]'
                : 'text-[#e6bdb8] hover:text-[#e5e2e1] border-transparent'
                }`}
            >
              Host Hub
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className={`font-label-caps text-label-caps uppercase transition-colors py-6 h-full border-b-2 ${(currentScreen as string).startsWith('admin')
                ? 'text-[#ffb4ab] border-[#ffb4ab]'
                : 'text-[#e6bdb8] hover:text-[#e5e2e1] border-transparent'
                }`}
            >
              Admin
            </button>
          )}
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-5">
          <div className="hidden sm:flex items-center gap-4">
            {/* Search toggler */}
            <div className="relative">
              {searchOpen ? (
                <div className="flex items-center bg-[#201f1f] px-3 py-1.5 rounded border border-[#353534] w-64 animate-in fade-in">
                  <span className="material-symbols-outlined text-[#e6bdb8] text-[18px]">search</span>
                  <input
                    type="text"
                    placeholder="Search events, tags..."
                    value={searchQuery}
                    autoFocus
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onNavigate('events');
                        setSearchOpen(false);
                      }
                    }}
                    className="bg-transparent border-none outline-none px-2 font-data-mono text-[13px] text-[#e5e2e1] w-full"
                  />
                  <button onClick={() => setSearchOpen(false)} className="text-[#e6bdb8] hover:text-white">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="text-[#e6bdb8] hover:text-[#e5e2e1] transition-colors p-1"
                  aria-label="Search"
                >
                  <span className="material-symbols-outlined text-[22px]">search</span>
                </button>
              )}
            </div>

            {/* Create Event CTA - Only for Organizers & Admins */}
            {isOrganizer && (
              <button
                onClick={onOpenCreateModal}
                className="bg-[#dc2626] hover:bg-[#b91c1c] text-[#fff6f5] px-4 py-2 rounded font-label-caps text-label-caps uppercase transition-all hover:scale-105 active:scale-95 shadow-md flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                CREATE EVENT
              </button>
            )}

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="text-[#e6bdb8] hover:text-[#e5e2e1] transition-colors relative p-1"
                aria-label="Notifications"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ffb4ab]"></span>
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-[#201f1f] border border-[#353534] rounded-xl shadow-2xl p-4 z-50 animate-in fade-in">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#353534]">
                    <span className="font-label-caps text-[#ffb4ab] text-[11px]">NOTIFICATIONS</span>
                    <span className="font-data-mono text-[11px] text-[#c6c6c7]">Mark read</span>
                  </div>
                  <div className="space-y-2 text-[13px]">
                    <div className="p-2.5 rounded-lg bg-[#2a2a2a] hover:bg-[#353534] transition-colors cursor-pointer border-l-2 border-[#ffb4ab]">
                      <p className="font-semibold text-[#e5e2e1]">Waitlist update</p>
                      <p className="text-[12px] text-[#e6bdb8]">You are now #5 for Design Summit</p>
                      <span className="font-data-mono text-[10px] text-[#c6c6c7]">1 day ago</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#2a2a2a] hover:bg-[#353534] transition-colors cursor-pointer">
                      <p className="font-semibold text-[#e5e2e1]">React Kathmandu Meetup</p>
                      <p className="text-[12px] text-[#e6bdb8]">RSVP Confirmed for Nov 18</p>
                      <span className="font-data-mono text-[10px] text-[#c6c6c7]">2 hours ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Profile Avatar with dropdown or Sign In button */}
          {isAuthenticated ? (
            <div className="relative">
              <div
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-8 h-8 rounded-full bg-[#ffb4ab] flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#ffdad6] transition-all overflow-hidden font-bold text-[#690005] text-[14px]"
                title={user?.name ?? 'User Account'}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-[#201f1f] border border-[#353534] rounded-xl shadow-2xl p-2 z-50 animate-in fade-in">
                  <div className="px-3 py-2 border-b border-[#353534]">
                    <p className="font-semibold text-[14px] text-white truncate">{user?.name}</p>
                    <div className="text-[11px] text-[#e6bdb8] flex items-center gap-1.5 uppercase font-data-mono mt-0.5">
                      {isAdmin ? (
                        <span className="bg-[#690005] text-[#ffdad6] text-[10px] font-bold px-1.5 py-0.5 rounded">
                          ADMIN
                        </span>
                      ) : user?.role === 'organizer' ? (
                        <span className="bg-[#ffb4ab]/20 text-[#ffb4ab] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#ffb4ab]/30">
                          ORGANIZER
                        </span>
                      ) : (
                        <span className="bg-[#353534] text-[#e5e2e1] text-[10px] font-bold px-1.5 py-0.5 rounded">
                          ATTENDEE
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { onNavigate('dashboard'); setUserDropdownOpen(false); }}
                      className="w-full text-left px-3 py-2 text-[13px] text-[#e5e2e1] hover:bg-[#2a2a2a] rounded flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">account_circle</span>
                      Profile & Dashboard
                    </button>
                    {isOrganizer && (
                      <>
                        <button
                          onClick={() => { onNavigate('manage-event'); setUserDropdownOpen(false); }}
                          className="w-full text-left px-3 py-2 text-[13px] text-[#e5e2e1] hover:bg-[#2a2a2a] rounded flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">dashboard_customize</span>
                          Host Event Hub
                        </button>
                        <button
                          onClick={() => { onNavigate('verification'); setUserDropdownOpen(false); }}
                          className="w-full text-left px-3 py-2 text-[13px] text-[#e5e2e1] hover:bg-[#2a2a2a] rounded flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">verified_user</span>
                          Identity Verification
                          {user?.is_verified_organizer ? (
                            <span className="ml-auto text-[9px] bg-[#ffb4ab]/20 text-[#ffb4ab] px-1 rounded">
                              ✓
                            </span>
                          ) : (
                            <span className="ml-auto text-[9px] bg-[#690005] text-[#ffdad6] px-1 rounded">
                              UNVERIFIED
                            </span>
                          )}
                        </button>
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => { onNavigate('admin-verifications'); setUserDropdownOpen(false); }}
                          className="w-full text-left px-3 py-2 text-[13px] text-[#ffb4ab] hover:bg-[#2a2a2a] rounded flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">verified_user</span>
                          Review Verifications
                        </button>
                        <button
                          onClick={() => { onNavigate('admin'); setUserDropdownOpen(false); }}
                          className="w-full text-left px-3 py-2 text-[13px] text-[#ffb4ab] hover:bg-[#2a2a2a] rounded flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                          Admin Portal
                        </button>
                      </>
                    )}
                    <div className="h-px bg-[#353534] my-1"></div>
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                        onNavigate('login');
                      }}
                      className="w-full text-left px-3 py-2 text-[13px] text-[#ffb4ab] hover:bg-[#2a2a2a] rounded flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="bg-[#2a2a2a] hover:bg-[#353534] text-[#ffb4ab] border border-[#353534] px-4 py-2 rounded font-label-caps text-[12px] font-bold uppercase transition-all"
            >
              Sign In
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-[#e5e2e1] p-1"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-[28px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#1c1b1b] border-b border-[#353534] px-5 py-4 space-y-3 animate-in slide-in-from-top duration-200">
          {isOrganizer && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => { onOpenCreateModal(); setMobileMenuOpen(false); }}
                className="w-full bg-[#dc2626] text-white py-2 rounded font-label-caps text-[12px] uppercase flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                CREATE EVENT
              </button>
            </div>
          )}
          <button
            onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
            className={`block w-full text-left py-2 font-label-caps uppercase text-[13px] ${currentScreen === 'home' ? 'text-[#ffb4ab]' : 'text-[#e6bdb8]'
              }`}
          >
            Discover
          </button>
          <button
            onClick={() => { onNavigate('events'); setMobileMenuOpen(false); }}
            className={`block w-full text-left py-2 font-label-caps uppercase text-[13px] ${currentScreen === 'events' ? 'text-[#ffb4ab]' : 'text-[#e6bdb8]'
              }`}
          >
            Events Directory
          </button>
          <button
            onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
            className={`block w-full text-left py-2 font-label-caps uppercase text-[13px] ${currentScreen === 'dashboard' ? 'text-[#ffb4ab]' : 'text-[#e6bdb8]'
              }`}
          >
            My Dashboard
          </button>
          {isOrganizer && (
            <>
              <button
                onClick={() => { onNavigate('manage-event'); setMobileMenuOpen(false); }}
                className={`block w-full text-left py-2 font-label-caps uppercase text-[13px] ${currentScreen === 'manage-event' ? 'text-[#ffb4ab]' : 'text-[#e6bdb8]'
                  }`}
              >
                Host Management
              </button>
              <button
                onClick={() => { onNavigate('verification'); setMobileMenuOpen(false); }}
                className={`block w-full text-left py-2 font-label-caps uppercase text-[13px] ${currentScreen === 'verification' ? 'text-[#ffb4ab]' : 'text-[#e6bdb8]'
                  }`}
              >
                Identity Verification
              </button>
            </>
          )}
          {isAdmin && (
            <>
              <button
                onClick={() => { onNavigate('admin-verifications'); setMobileMenuOpen(false); }}
                className={`block w-full text-left py-2 font-label-caps uppercase text-[13px] ${currentScreen === 'admin-verifications' ? 'text-[#ffb4ab]' : 'text-[#e6bdb8]'
                  }`}
              >
                Review Verifications
              </button>
              <button
                onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
                className={`block w-full text-left py-2 font-label-caps uppercase text-[13px] ${(currentScreen as string) === 'admin' ? 'text-[#ffb4ab]' : 'text-[#e6bdb8]'
                  }`}
              >
                Admin Portal
              </button>
            </>
          )}
          {isAuthenticated ? (
            <button
              onClick={() => { logout(); setMobileMenuOpen(false); onNavigate('login'); }}
              className="block w-full text-left py-2 font-label-caps uppercase text-[13px] text-[#ffb4ab]"
            >
              Sign Out ({user?.name})
            </button>
          ) : (
            <button
              onClick={() => { onNavigate('login'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-2 font-label-caps uppercase text-[13px] text-[#ffb4ab]"
            >
              Sign In / Register
            </button>
          )}
        </div>
      )}
    </header>
  );
};
