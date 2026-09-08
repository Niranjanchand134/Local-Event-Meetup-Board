import React from 'react';
import { LOGO_URL } from '../../data/mockData';
import type { ScreenType } from '../../types/eventboard';
import { useAuth } from '../../context/AuthContext';

interface AdminSidebarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ currentScreen, onNavigate }) => {
  const { logout } = useAuth();

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
          onClick={() => onNavigate('admin-events')}
          className={`w-full flex items-center px-4 py-3 rounded text-[13px] font-label-caps uppercase transition-all ${
            currentScreen === 'admin-events'
              ? 'bg-[#dc2626] text-[#fff6f5] font-bold shadow-md'
              : 'text-[#e6bdb8] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
          }`}
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">event</span>
          Events
        </button>

        <button
          onClick={() => onNavigate('admin-users')}
          className={`w-full flex items-center px-4 py-3 rounded text-[13px] font-label-caps uppercase transition-all ${
            currentScreen === 'admin-users'
              ? 'bg-[#dc2626] text-[#fff6f5] font-bold shadow-md'
              : 'text-[#e6bdb8] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
          }`}
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">group</span>
          Users &amp; Hosts
        </button>

        <button
          onClick={() => onNavigate('admin-verifications')}
          className={`w-full flex items-center px-4 py-3 rounded text-[13px] font-label-caps uppercase transition-all ${
            currentScreen === 'admin-verifications'
              ? 'bg-[#dc2626] text-[#fff6f5] font-bold shadow-md'
              : 'text-[#e6bdb8] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
          }`}
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">verified_user</span>
          Verifications
          <span className="ml-auto bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/40 text-[10px] px-1.5 py-0.5 rounded font-bold">
            NEW
          </span>
        </button>

        <button
          onClick={() => onNavigate('admin-payments')}
          className={`w-full flex items-center px-4 py-3 rounded text-[13px] font-label-caps uppercase transition-all ${
            currentScreen === 'admin-payments'
              ? 'bg-[#dc2626] text-[#fff6f5] font-bold shadow-md'
              : 'text-[#e6bdb8] hover:bg-[#2a2a2a] hover:text-[#e5e2e1]'
          }`}
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">payments</span>
          Payments &amp; RSVPs
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
          className="w-full flex items-center px-4 py-3 rounded text-[13px] font-label-caps uppercase text-[#e6bdb8] hover:bg-[#2a2a2a] hover:text-[#e5e2e1] transition-all"
        >
          <span className="material-symbols-outlined mr-3 text-[20px]">category</span>
          Categories
        </button>
      </nav>

      {/* Exit Admin */}
      <div className="p-4 border-t border-[#353534] space-y-1">
        <button
          onClick={() => {
            logout();
            onNavigate('login');
          }}
          className="w-full flex items-center px-4 py-2.5 rounded text-[#ffb4ab] hover:text-[#ffdad6] hover:bg-[#690005]/40 transition-all font-label-caps text-[12px] uppercase font-bold"
        >
          <span className="material-symbols-outlined mr-3 text-[18px]">logout</span>
          Sign Out Admin
        </button>
      </div>
    </aside>
  );
};
