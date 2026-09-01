import React, { useState } from 'react';
import type { ScreenType } from '../types/eventboard';

interface ScreenSwitcherProps {
  currentScreen: ScreenType;
  onSelectScreen: (screen: ScreenType) => void;
}

export const ScreenSwitcher: React.FC<ScreenSwitcherProps> = ({ currentScreen, onSelectScreen }) => {
  const [collapsed, setCollapsed] = useState(false);

  const screens: { id: ScreenType; label: string; icon: string; category: string }[] = [
    { id: 'home', label: 'Discover Home', icon: 'explore', category: 'Public' },
    { id: 'events', label: 'Events Directory', icon: 'view_agenda', category: 'Public' },
    { id: 'event-detail', label: 'Event Masterclass', icon: 'event', category: 'Public' },
    { id: 'dashboard', label: 'User Dashboard', icon: 'account_circle', category: 'User' },
    { id: 'manage-event', label: 'Host Management (EVT-9942)', icon: 'tune', category: 'Host' },
    { id: 'admin', label: 'Admin Overview', icon: 'dashboard', category: 'Admin' },
    { id: 'admin-reports', label: 'Admin Moderation', icon: 'gavel', category: 'Admin' },
    { id: 'login', label: 'Login Screen', icon: 'lock', category: 'Auth' },
    { id: 'signup', label: 'Sign Up Screen', icon: 'person_add', category: 'Auth' },
  ];

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-50 bg-[#dc2626] hover:bg-[#b91c1c] text-white px-3.5 py-2 rounded-full shadow-2xl flex items-center gap-2 font-label-caps text-[11px] uppercase tracking-wider border border-[#ffb4ab]/40 transition-all hover:scale-105"
        title="Open Screen Switcher"
      >
        <span className="material-symbols-outlined text-[16px]">devices</span>
        <span>Screens ({screens.find(s => s.id === currentScreen)?.label.split(' ')[0]})</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-[#1c1b1b]/95 backdrop-blur-md border border-[#353534] rounded-2xl shadow-2xl p-3 max-w-sm w-full text-white animate-in slide-in-from-bottom-5">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#353534]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-pulse"></span>
          <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase tracking-wider">
            Screen Navigator
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-[#e6bdb8] hover:text-white p-1 rounded hover:bg-[#2a2a2a] transition-colors"
          title="Minimize switcher"
        >
          <span className="material-symbols-outlined text-[16px]">expand_more</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5 max-h-60 overflow-y-auto custom-scrollbar p-0.5">
        {screens.map((screen) => {
          const isActive = currentScreen === screen.id;
          return (
            <button
              key={screen.id}
              onClick={() => onSelectScreen(screen.id)}
              className={`p-2 rounded-lg text-left text-[11px] font-medium transition-all flex flex-col gap-1 ${
                isActive
                  ? 'bg-[#dc2626] text-white shadow-md ring-1 ring-[#ffb4ab]'
                  : 'bg-[#2a2a2a] text-[#e5e2e1] hover:bg-[#353534] hover:text-[#ffb4ab]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="material-symbols-outlined text-[16px] opacity-90">
                  {screen.icon}
                </span>
                <span className="text-[9px] uppercase tracking-tighter opacity-60">
                  {screen.category}
                </span>
              </div>
              <span className="truncate font-sans font-semibold leading-tight">
                {screen.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
