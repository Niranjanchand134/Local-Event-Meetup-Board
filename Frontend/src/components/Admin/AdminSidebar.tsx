import React from 'react';
import { LOGO_URL } from '../../data/mockData';
import type { ScreenType } from '../../types/eventboard';

interface AdminSidebarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentScreen, onNavigate }) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#201f1f] border-r border-[#353534] z-50 flex flex-col">
      {/* Admin Header */}
      <div 
        onClick={() => onNavigate('admin')}
        className="p-6 flex items-center gap-3 mb-4 border-b border-[#353534] cursor-pointer group"
      >
        <img
          alt="Logo"
          className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
          src={LOGO_URL}
        />
        <span className="font-headline-md text-[20px] font-bold text-[#e5e2e1] tracking-wider">
          ADMIN
        </span>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 space-y-2">
        <button
          onClick={() => onNavigate('admin')}
          className={`w-full flex items-center px-4 py-3 rounded text-[13px] font-label-caps uppercase transition-all ${
            currentScreen === 'admin'
              ? 'bg-[#dc2626] text-[#fff6f5] font-bold shadow-md'
              : 'text-[#e6bdb8] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
          }`}
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">dashboard</span>
          Overview
        </button>

        <button
          onClick={() => onNavigate('events')}
          className="w-full flex items-center px-4 py-3 rounded text-[13px] font-label-caps uppercase text-[#e6bdb8] hover:bg-[#2a2a2a] hover:text-[#e5e2e1] transition-all"
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">event</span>
          Events
        </button>

        <button
          onClick={() => onNavigate('manage-event')}
          className="w-full flex items-center px-4 py-3 rounded text-[13px] font-label-caps uppercase text-[#e6bdb8] hover:bg-[#2a2a2a] hover:text-[#e5e2e1] transition-all"
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">group</span>
          Users &amp; Hosts
        </button>

        <button
          onClick={() => onNavigate('admin-reports')}
          className={`w-full flex items-center px-4 py-3 rounded text-[13px] font-label-caps uppercase transition-all ${
            currentScreen === 'admin-reports'
              ? 'bg-[#dc2626] text-[#fff6f5] font-bold shadow-md'
              : 'text-[#e6bdb8] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
          }`}
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">bar_chart</span>
          Reports
          <span className="ml-auto bg-[#690005] text-[#ffdad6] text-[10px] px-1.5 py-0.5 rounded">
            24
          </span>
        </button>

        <button
          onClick={() => onNavigate('events')}
          className="w-full flex items-center px-4 py-3 rounded text-[13px] font-label-caps uppercase text-[#e6bdb8] hover:bg-[#2a2a2a] hover:text-[#e5e2e1] transition-all"
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">category</span>
          Categories
        </button>
      </nav>

      {/* Exit Admin */}
      <div className="p-4 border-t border-[#353534]">
        <button
          onClick={() => onNavigate('home')}
          className="w-full flex items-center px-4 py-3 rounded text-[#e6bdb8] hover:text-[#ffb4ab] hover:bg-[#2a2a2a] transition-all font-label-caps text-[12px] uppercase"
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">logout</span>
          Exit Admin
        </button>
      </div>
    </aside>
  );
};
