import React, { useState } from 'react';
import type { ScreenType } from '../../types/eventboard';
import { systemLogs } from '../../data/mockData';

interface AdminOverviewViewProps {
  onNavigate: (screen: ScreenType) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({ onNavigate }) => {
  const [logs] = useState(systemLogs);
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const [actionItems, setActionItems] = useState([
    {
      id: 'act-1',
      type: 'FLAGGED EVENT',
      time: '2h ago',
      title: 'Underground Crypto Mixer',
      desc: 'Reported for suspicious financial claims. User history indicates multiple deleted events.'
    },
    {
      id: 'act-2',
      type: 'SPAM USER',
      time: '5h ago',
      title: '@event_bot_99',
      desc: 'Created 50+ RSVPs across random events in the last 10 minutes.'
    }
  ]);

  const handleDismissAction = (id: string) => {
    setActionItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="flex flex-col w-full px-6 py-8 gap-8 max-w-[1280px] mx-auto min-h-screen">
      {/* Top Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-[#201f1f] rounded-xl p-5 border-t-2 border-[#353534] transition-transform hover:scale-[1.02] shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">Total Users</span>
            <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">group</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="font-headline-xl text-[38px] font-bold text-[#e5e2e1] font-data-mono">14,203</span>
            <span className="font-data-mono text-[12px] text-[#c6c6c7] mb-1.5">+124 this week</span>
          </div>
        </div>

        {/* Total Events */}
        <div className="bg-[#201f1f] rounded-xl p-5 border-t-2 border-[#353534] transition-transform hover:scale-[1.02] shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">Total Events</span>
            <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">event_note</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="font-headline-xl text-[38px] font-bold text-[#e5e2e1] font-data-mono">3,892</span>
            <span className="font-data-mono text-[12px] text-[#c6c6c7] mb-1.5">+45 this week</span>
          </div>
        </div>

        {/* Open Reports (Warning) */}
        <div
          onClick={() => onNavigate('admin-reports')}
          className="bg-[#93000a] rounded-xl p-5 border-t-2 border-[#ffb4ab] relative overflow-hidden transition-transform hover:scale-[1.02] cursor-pointer shadow-lg"
        >
          {/* Warning diagonal background pattern */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffb4ab 10px, #ffb4ab 20px)'
            }}
          ></div>
          <div className="relative z-10 flex justify-between items-start mb-2">
            <span className="font-label-caps text-[11px] text-[#ffdad6] uppercase font-bold">Open Reports</span>
            <span className="material-symbols-outlined text-[#ffdad6] text-[20px]">warning</span>
          </div>
          <div className="relative z-10 flex items-end gap-3">
            <span className="font-headline-xl text-[38px] font-bold text-[#ffdad6] font-data-mono">12</span>
            <span className="font-data-mono text-[12px] text-[#ffdad6] mb-1.5">Requires review →</span>
          </div>
        </div>

        {/* Active RSVPs */}
        <div className="bg-[#201f1f] rounded-xl p-5 border-t-2 border-[#353534] transition-transform hover:scale-[1.02] shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">Active RSVPs</span>
            <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">how_to_reg</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="font-headline-xl text-[38px] font-bold text-[#e5e2e1] font-data-mono">28.4k</span>
            <span className="font-data-mono text-[12px] text-[#c6c6c7] mb-1.5">Platform wide</span>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Event Activity (30 Days) */}
        <div className="lg:col-span-2 bg-[#201f1f] rounded-2xl p-6 border border-[#353534] flex flex-col h-[380px] shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline-md text-[18px] font-bold text-[#e5e2e1]">
              Event Activity (30 Days)
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ffb4ab]"></span>
                <span className="font-data-mono text-[12px] text-[#e6bdb8]">Created</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#bdc7d8]"></span>
                <span className="font-data-mono text-[12px] text-[#e6bdb8]">Completed</span>
              </div>
            </div>
          </div>

          <div className="flex-1 relative mt-2">
            <div className="absolute inset-0 flex items-end justify-between px-4 pb-8">
              {/* Grid Lines */}
              <div className="absolute inset-x-0 border-b border-[#353534]/50" style={{ top: '25%' }}></div>
              <div className="absolute inset-x-0 border-b border-[#353534]/50" style={{ top: '50%' }}></div>
              <div className="absolute inset-x-0 border-b border-[#353534]/50" style={{ top: '75%' }}></div>
              <div className="absolute inset-x-0 border-b border-[#353534]/50" style={{ top: '100%' }}></div>

              {/* Bars */}
              {[
                { height: '60%', count: '45 Events', day: 'Oct 01' },
                { height: '80%', count: '62 Events', day: 'Oct 06' },
                { height: '40%', count: '30 Events', day: 'Oct 11' },
                { height: '90%', count: '75 Events', day: 'Oct 16' },
                { height: '50%', count: '38 Events', day: 'Oct 21' },
                { height: '75%', count: '58 Events', day: 'Oct 26' },
                { height: '100%', count: '94 Events', day: 'Oct 30' }
              ].map((bar, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setActiveBarIndex(i)}
                  onMouseLeave={() => setActiveBarIndex(null)}
                  className="w-1/12 bg-[#ffb4ab]/80 rounded-t-sm z-10 hover:bg-[#ffb4ab] transition-colors cursor-pointer relative group"
                  style={{ height: bar.height }}
                >
                  <div
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#2a2a2a] text-[#e5e2e1] px-2.5 py-1 rounded-md transition-opacity whitespace-nowrap font-data-mono text-[12px] border border-[#353534] shadow-lg pointer-events-none ${
                      activeBarIndex === i ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {bar.count}
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 text-[#e6bdb8] font-data-mono text-[12px]">
              <span>Oct 01</span>
              <span>Oct 15</span>
              <span>Oct 30</span>
            </div>
          </div>
        </div>

        {/* Donut Chart: Top Categories */}
        <div className="bg-[#201f1f] rounded-2xl p-6 border border-[#353534] flex flex-col h-[380px] shadow-md">
          <h2 className="font-headline-md text-[18px] font-bold text-[#e5e2e1] mb-4">
            Top Categories
          </h2>

          <div className="flex-1 flex items-center justify-center relative">
            <svg className="w-44 h-44 -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-[#2a2a2a]"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="currentColor"
                strokeWidth="14"
              />
              <circle
                className="text-[#ffb4ab]"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="currentColor"
                strokeDasharray="251.2"
                strokeDashoffset="62.8"
                strokeWidth="14"
              />
              <circle
                className="text-[#bdc7d8]"
                cx="50"
                cy="50"
                fill="transparent"
                r="40"
                stroke="currentColor"
                strokeDasharray="251.2"
                strokeDashoffset="188.4"
                strokeWidth="14"
                transform="rotate(270 50 50)"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-headline-lg text-[26px] font-bold text-[#e5e2e1] font-data-mono">
                3.8k
              </span>
              <span className="font-label-caps text-[10px] text-[#e6bdb8] uppercase tracking-wider font-bold">
                TOTAL
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#ffb4ab] rounded-sm"></span>
                <span className="font-body-md text-[13px] text-[#e5e2e1]">Tech Meetups</span>
              </div>
              <span className="font-data-mono text-[13px] text-[#e6bdb8]">45%</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#bdc7d8] rounded-sm"></span>
                <span className="font-body-md text-[13px] text-[#e5e2e1]">Workshops</span>
              </div>
              <span className="font-data-mono text-[13px] text-[#e6bdb8]">25%</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-[#353534] rounded-sm"></span>
                <span className="font-body-md text-[13px] text-[#e5e2e1]">Other</span>
              </div>
              <span className="font-data-mono text-[13px] text-[#e6bdb8]">30%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section: Critical & Activity */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Critical Items (Action Required) */}
        <div className="xl:col-span-1 bg-[#201f1f] rounded-2xl p-6 border border-[#ffb4ab]/30 flex flex-col h-full shadow-md">
          <div className="flex justify-between items-center mb-4 border-b border-[#353534] pb-4">
            <h2 className="font-headline-md text-[18px] text-[#e5e2e1] flex items-center gap-2 font-bold">
              <span className="material-symbols-outlined text-[#ffb4ab]">gavel</span>
              Action Required
            </h2>
            <span className="bg-[#ffb4ab] text-[#690005] font-label-caps px-2 py-0.5 rounded text-[10px] font-bold">
              {actionItems.length} PENDING
            </span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto">
            {actionItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#131313] p-4 rounded-xl border border-[#353534] hover:border-[#ffb4ab] transition-colors"
              >
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-label-caps text-[10px] text-[#ffb4ab] font-bold">
                    {item.type}
                  </span>
                  <span className="font-data-mono text-[#e6bdb8] text-[11px]">{item.time}</span>
                </div>

                <p className="font-body-md text-[14px] text-[#e5e2e1] font-bold mb-1">
                  {item.title}
                </p>

                <p className="font-body-md text-[#e6bdb8] text-[13px] line-clamp-2 mb-3 leading-relaxed">
                  {item.desc}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => onNavigate('admin-reports')}
                    className="bg-[#ffb4ab]/20 text-[#ffb4ab] hover:bg-[#ffb4ab]/30 px-3 py-1.5 rounded-lg text-[11px] font-label-caps font-bold transition-colors"
                  >
                    REVIEW
                  </button>
                  <button
                    onClick={() => handleDismissAction(item.id)}
                    className="bg-[#2a2a2a] text-[#e5e2e1] hover:bg-[#353534] px-3 py-1.5 rounded-lg text-[11px] font-label-caps font-bold transition-colors"
                  >
                    DISMISS
                  </button>
                </div>
              </div>
            ))}

            {actionItems.length === 0 && (
              <div className="text-center py-8 text-[#e6bdb8] text-[14px]">
                No pending moderation items. All clear!
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Table (System Log) */}
        <div className="xl:col-span-2 bg-[#201f1f] rounded-2xl border border-[#353534] flex flex-col h-full overflow-hidden shadow-md">
          <div className="p-5 border-b border-[#353534] flex justify-between items-center bg-[#1c1b1b]">
            <h2 className="font-headline-md text-[18px] text-[#e5e2e1] font-bold">System Log</h2>
            <button
              onClick={() => alert('Filter applied: All activity')}
              className="flex items-center gap-1.5 text-[#ffb4ab] hover:underline text-[12px] font-label-caps font-bold transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">filter_list</span>
              FILTER
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#353534] bg-[#0e0e0e]/50">
                  <th className="p-4 font-label-caps text-[11px] text-[#e6bdb8] uppercase w-28 font-bold">Timestamp</th>
                  <th className="p-4 font-label-caps text-[11px] text-[#e6bdb8] uppercase w-24 font-bold">Type</th>
                  <th className="p-4 font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">Detail</th>
                  <th className="p-4 font-label-caps text-[11px] text-[#e6bdb8] uppercase w-24 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#353534] text-[14px]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#2a2a2a] transition-colors group">
                    <td className="p-4 font-data-mono text-[12px] text-[#e6bdb8]">
                      {log.timestamp}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-label-caps font-bold tracking-wider ${
                          log.type === 'EVENT'
                            ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                            : log.type === 'REPORT'
                            ? 'bg-[#93000a]/50 text-[#ffdad6]'
                            : log.type === 'SYSTEM'
                            ? 'bg-[#bdc7d8]/20 text-[#bdc7d8]'
                            : 'bg-[#353534] text-[#e6bdb8]'
                        }`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-[#e5e2e1]">{log.detail}</div>
                      <div className="text-[#e6bdb8] text-[12px] font-data-mono">{log.subdetail}</div>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => alert(`Log entry inspect: ${log.detail}`)}
                        className="text-[#e6bdb8] hover:text-[#ffb4ab] transition-colors"
                        title="View log"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-[#353534] text-center bg-[#1c1b1b] mt-auto">
            <button
              onClick={() => onNavigate('admin-reports')}
              className="font-label-caps text-[12px] text-[#ffb4ab] hover:underline uppercase tracking-widest font-bold"
            >
              VIEW ALL LOGS &amp; REPORTS →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
