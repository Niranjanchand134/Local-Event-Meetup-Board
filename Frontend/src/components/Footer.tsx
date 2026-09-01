import React from 'react';
import { LOGO_URL } from '../data/mockData';
import type { ScreenType } from '../types/eventboard';

interface FooterProps {
  onNavigate: (screen: ScreenType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#1c1b1b] border-t border-[#353534] mt-24">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Col 1 */}
          <div className="md:col-span-4">
            <div 
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3 mb-4 cursor-pointer group"
            >
              <img
                alt="EventBoard Logo"
                className="h-6 w-auto object-contain"
                src={LOGO_URL}
              />
              <span className="font-headline-md text-[20px] font-bold text-[#e5e2e1] group-hover:text-white transition-colors">
                EventBoard
              </span>
            </div>
            <p className="text-[#e6bdb8] font-body-md text-[14px] max-w-xs mb-6 leading-relaxed">
              A premium technical platform for modern community discovery and professional networking events.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => onNavigate('events')}
                className="w-8 h-8 rounded bg-[#2a2a2a] hover:bg-[#353534] flex items-center justify-center text-[#e6bdb8] hover:text-[#ffb4ab] transition-colors"
                aria-label="Web platform"
              >
                <span className="material-symbols-outlined text-[18px]">language</span>
              </button>
              <button 
                onClick={() => onNavigate('admin')}
                className="w-8 h-8 rounded bg-[#2a2a2a] hover:bg-[#353534] flex items-center justify-center text-[#e6bdb8] hover:text-[#ffb4ab] transition-colors"
                aria-label="Terminal admin"
              >
                <span className="material-symbols-outlined text-[18px]">terminal</span>
              </button>
              <button 
                onClick={() => onNavigate('manage-event')}
                className="w-8 h-8 rounded bg-[#2a2a2a] hover:bg-[#353534] flex items-center justify-center text-[#e6bdb8] hover:text-[#ffb4ab] transition-colors"
                aria-label="Event Host"
              >
                <span className="material-symbols-outlined text-[18px]">hub</span>
              </button>
            </div>
          </div>

          {/* Col 2 */}
          <div className="md:col-span-2 md:col-start-6">
            <h4 className="font-label-caps text-label-caps text-[#e5e2e1] mb-4 uppercase tracking-wider">
              PLATFORM
            </h4>
            <ul className="space-y-2 text-[#e6bdb8] text-[14px] font-body-md">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-[#ffb4ab] transition-colors">
                  Discover
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('events')} className="hover:text-[#ffb4ab] transition-colors">
                  Events Directory
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-[#ffb4ab] transition-colors">
                  User Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('manage-event')} className="hover:text-[#ffb4ab] transition-colors">
                  Host Console
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="md:col-span-2">
            <h4 className="font-label-caps text-label-caps text-[#e5e2e1] mb-4 uppercase tracking-wider">
              COMMUNITY
            </h4>
            <ul className="space-y-2 text-[#e6bdb8] text-[14px] font-body-md">
              <li>
                <button onClick={() => onNavigate('events')} className="hover:text-[#ffb4ab] transition-colors">
                  Guidelines
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('events')} className="hover:text-[#ffb4ab] transition-colors">
                  Meetups
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('event-detail')} className="hover:text-[#ffb4ab] transition-colors">
                  Featured Masterclass
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('admin')} className="hover:text-[#ffb4ab] transition-colors">
                  Admin System
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="md:col-span-3">
            <h4 className="font-label-caps text-label-caps text-[#e5e2e1] mb-4 uppercase tracking-wider">
              LEGAL &amp; SECURITY
            </h4>
            <ul className="space-y-2 text-[#e6bdb8] text-[14px] font-body-md">
              <li>
                <a href="#privacy" className="hover:text-[#ffb4ab] transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#terms" className="hover:text-[#ffb4ab] transition-colors">Terms of Service</a>
              </li>
              <li>
                <a href="#cookies" className="hover:text-[#ffb4ab] transition-colors">Cookie Policy</a>
              </li>
              <li>
                <button onClick={() => onNavigate('login')} className="text-[#ffb4ab] hover:underline font-data-mono text-[12px]">
                  Terminal Auth Access
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-16 pt-6 border-t border-[#353534] flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-data-mono text-data-mono text-[12px] text-[#e6bdb8]">
            © {new Date().getFullYear()} EVENTBOARD_SYSTEM. ALL RIGHTS RESERVED.
          </span>
          <span className="font-data-mono text-data-mono text-[12px] text-[#bdc7d8] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] animate-pulse"></span>
            LAT_40.7128 LON_74.0060 // SYSTEM ONLINE
          </span>
        </div>
      </div>
    </footer>
  );
};
