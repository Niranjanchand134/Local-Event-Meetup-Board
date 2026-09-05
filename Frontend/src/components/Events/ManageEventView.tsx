import React, { useState } from 'react';
import type { ScreenType, AttendeeRecord } from '../../types/eventboard';
import { hostManagedEvent } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

interface ManageEventViewProps {
  onNavigate: (screen: ScreenType) => void;
  onOpenCreateModal: () => void;
}

export const ManageEventView: React.FC<ManageEventViewProps> = ({ onNavigate, onOpenCreateModal }) => {
  const { isVerifiedOrganizer } = useAuth();
  const [activeTab, setActiveTab] = useState<'confirmed' | 'waitlist'>('confirmed');
  const [searchQuery, setSearchQuery] = useState('');
  const [attendees, setAttendees] = useState<AttendeeRecord[]>(hostManagedEvent.attendees);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<AttendeeRecord | null>(null);

  const filteredAttendees = attendees.filter((att) => {
    const matchesTab = att.status === activeTab;
    const matchesSearch =
      att.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleRemoveAttendee = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Remove this attendee from the roster?')) {
      setAttendees((prev) => prev.filter((a) => a.id !== id));
    }
  };

  return (
    <div className="flex flex-col w-full px-5 lg:px-16 py-12 gap-10 max-w-[1280px] mx-auto min-h-screen">
      {/* Verification Alert Banner if not verified */}
      {!isVerifiedOrganizer && (
        <div className="p-5 bg-[#201f1f] border border-[#ffb4ab]/50 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#ffb4ab] text-[28px]">
              gpp_maybe
            </span>
            <div>
              <p className="font-bold text-white text-[15px]">Identity Verification Required</p>
              <p className="text-[13px] text-[#e6bdb8]">
                Your organizer profile must be approved by administrators before new events can go live.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('verification')}
            className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-5 py-2 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all shadow-md shrink-0 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">verified</span>
            SUBMIT ID VERIFICATION
          </button>
        </div>
      )}

      {/* Header & Status Overview */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 w-full">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="font-label-caps text-[11px] text-[#ffb4ab] px-2.5 py-1 bg-[#ffb4ab]/10 rounded border border-[#ffb4ab]/30 font-bold">
              {hostManagedEvent.statusBadge}
            </span>
            <span className="font-data-mono text-data-mono text-[#e6bdb8]">
              {hostManagedEvent.id}
            </span>
          </div>

          <h1 className="font-headline-xl text-[36px] md:text-[48px] text-[#e5e2e1] font-bold tracking-tight">
            {hostManagedEvent.title}
          </h1>

          <p className="font-body-lg text-[15px] text-[#e6bdb8] max-w-2xl">
            {hostManagedEvent.description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] font-label-caps text-[12px] rounded-xl transition-colors font-bold border border-[#353534]"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            EDIT EVENT
          </button>
          
          <button
            onClick={() => setCancelModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-transparent hover:bg-[#690005]/20 text-[#ffb4ab] font-label-caps text-[12px] rounded-xl transition-colors font-bold border border-[#ffb4ab]/30"
          >
            <span className="material-symbols-outlined text-[18px]">cancel</span>
            CANCEL EVENT
          </button>
        </div>
      </section>

      {/* Key Metrics Bento Grid */}
      <section className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Total Attendees */}
        <div className="flex flex-col gap-3 p-6 bg-[#201f1f] border border-[#353534] rounded-2xl hover:scale-[1.02] transition-transform relative overflow-hidden group shadow-md">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">TOTAL ATTENDEES</span>
            <span className="material-symbols-outlined text-[#ffb4ab]">groups</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-headline-xl text-[42px] text-[#e5e2e1] tracking-tighter font-bold font-data-mono">
              {hostManagedEvent.metrics.totalAttendees}
            </span>
            <span className="font-data-mono text-[14px] text-[#e6bdb8]">/ {hostManagedEvent.metrics.maxCapacity}</span>
          </div>
          <div className="w-full h-2 bg-[#353534] rounded-full overflow-hidden mt-auto">
            <div
              className="h-full bg-[#ffb4ab] rounded-full transition-all duration-500"
              style={{ width: `${hostManagedEvent.metrics.trendPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 2: Confirmed */}
        <div className="flex flex-col gap-3 p-6 bg-[#201f1f] border border-[#353534] rounded-2xl hover:scale-[1.02] transition-transform relative overflow-hidden shadow-md">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">CONFIRMED</span>
            <span className="material-symbols-outlined text-[#c6c6c7]">check_circle</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-headline-xl text-[42px] text-[#e5e2e1] tracking-tighter font-bold font-data-mono">
              {hostManagedEvent.metrics.confirmed}
            </span>
          </div>
          <p className="font-data-mono text-[12px] text-[#e6bdb8] mt-auto">Active RSVPs</p>
        </div>

        {/* Metric 3: Waitlisted */}
        <div className="flex flex-col gap-3 p-6 bg-[#201f1f] border border-[#353534] rounded-2xl hover:scale-[1.02] transition-transform relative overflow-hidden shadow-md">
          <div className="flex justify-between items-start">
            <span className="font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">WAITLISTED</span>
            <span className="material-symbols-outlined text-[#bdc7d8]">hourglass_empty</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-headline-xl text-[42px] text-[#e5e2e1] tracking-tighter font-bold font-data-mono">
              {hostManagedEvent.metrics.waitlisted}
            </span>
          </div>
          <p className="font-data-mono text-[12px] text-[#e6bdb8] mt-auto">Pending approval</p>
        </div>

        {/* Metric 4: Sparkline Trend */}
        <div className="flex flex-col p-6 bg-[#201f1f] border border-[#353534] rounded-2xl hover:scale-[1.02] transition-transform relative overflow-hidden shadow-md">
          <div className="flex justify-between items-start mb-2">
            <span className="font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">RSVP TREND (7D)</span>
            <span className="material-symbols-outlined text-[#ffb4ab]">trending_up</span>
          </div>
          <div className="flex-grow w-full flex items-end justify-between gap-1.5 h-20 pt-2">
            <div className="w-full bg-[#ffb4ab]/20 hover:bg-[#ffb4ab] transition-colors rounded-t-sm h-[30%]" title="Day 1: 12 RSVPs"></div>
            <div className="w-full bg-[#ffb4ab]/20 hover:bg-[#ffb4ab] transition-colors rounded-t-sm h-[45%]" title="Day 2: 18 RSVPs"></div>
            <div className="w-full bg-[#ffb4ab]/20 hover:bg-[#ffb4ab] transition-colors rounded-t-sm h-[20%]" title="Day 3: 8 RSVPs"></div>
            <div className="w-full bg-[#ffb4ab]/20 hover:bg-[#ffb4ab] transition-colors rounded-t-sm h-[60%]" title="Day 4: 24 RSVPs"></div>
            <div className="w-full bg-[#ffb4ab]/20 hover:bg-[#ffb4ab] transition-colors rounded-t-sm h-[80%]" title="Day 5: 32 RSVPs"></div>
            <div className="w-full bg-[#ffb4ab]/20 hover:bg-[#ffb4ab] transition-colors rounded-t-sm h-[50%]" title="Day 6: 20 RSVPs"></div>
            <div className="w-full bg-[#ffb4ab] hover:bg-[#ffdad6] transition-colors rounded-t-sm h-[100%]" title="Today: 40 RSVPs"></div>
          </div>
        </div>
      </section>

      {/* Attendee Management Area */}
      <section className="w-full bg-[#201f1f] border border-[#353534] rounded-2xl overflow-hidden shadow-xl">
        {/* Controls Bar */}
        <div className="p-6 border-b border-[#353534] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#1c1b1b]">
          {/* Tabs */}
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('confirmed')}
              className={`font-label-caps text-[12px] uppercase pb-2 tracking-wider font-bold transition-all border-b-2 ${
                activeTab === 'confirmed'
                  ? 'text-[#ffb4ab] border-[#ffb4ab]'
                  : 'text-[#e6bdb8] border-transparent hover:text-white'
              }`}
            >
              CONFIRMED ({hostManagedEvent.metrics.confirmed})
            </button>
            <button
              onClick={() => setActiveTab('waitlist')}
              className={`font-label-caps text-[12px] uppercase pb-2 tracking-wider font-bold transition-all border-b-2 ${
                activeTab === 'waitlist'
                  ? 'text-[#ffb4ab] border-[#ffb4ab]'
                  : 'text-[#e6bdb8] border-transparent hover:text-white'
              }`}
            >
              WAITLIST ({hostManagedEvent.metrics.waitlisted})
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#e6bdb8] text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search attendees..."
                className="w-full bg-[#353534] text-[#e5e2e1] font-data-mono text-[13px] pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#ffb4ab] transition-all placeholder-[#e6bdb8]/50"
              />
            </div>
            <button 
              onClick={() => alert('Filter applied: All roles')}
              className="w-10 h-10 flex items-center justify-center bg-[#353534] hover:bg-[#3a3939] rounded-xl text-[#e5e2e1] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0e0e0e]/40 border-b border-[#353534]">
                <th className="font-label-caps text-[11px] text-[#e6bdb8] p-4 font-bold uppercase">ATTENDEE</th>
                <th className="font-label-caps text-[11px] text-[#e6bdb8] p-4 font-bold uppercase">ROLE</th>
                <th className="font-label-caps text-[11px] text-[#e6bdb8] p-4 font-bold uppercase hidden sm:table-cell">RSVP DATE</th>
                <th className="font-label-caps text-[11px] text-[#e6bdb8] p-4 font-bold uppercase text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#353534]">
              {filteredAttendees.map((att) => (
                <tr
                  key={att.id}
                  onClick={() => setSelectedAttendee(att)}
                  className="hover:bg-[#2a2a2a]/60 transition-colors group cursor-pointer"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#3a3939] flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-[#e5e2e1]">
                        {att.avatar ? (
                          <img className="w-full h-full object-cover" src={att.avatar} alt={att.name} />
                        ) : (
                          <span>{att.initials || att.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline-md text-[15px] font-bold text-[#e5e2e1] group-hover:text-[#ffb4ab] transition-colors">
                          {att.name}
                        </span>
                        <span className="font-data-mono text-[12px] text-[#e6bdb8]">
                          {att.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <span className="font-body-md text-[14px] text-[#e6bdb8]">
                      {att.role}
                    </span>
                  </td>

                  <td className="p-4 hidden sm:table-cell">
                    <span className="font-data-mono text-[13px] text-[#e6bdb8]">
                      {att.rsvpDate}
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedAttendee(att); }}
                        className="p-2 text-[#e6bdb8] hover:text-[#ffb4ab] transition-colors rounded-full hover:bg-[#353534]"
                        title="View profile"
                      >
                        <span className="material-symbols-outlined text-[18px]">person</span>
                      </button>
                      <button
                        onClick={(e) => handleRemoveAttendee(att.id, e)}
                        className="p-2 text-[#e6bdb8] hover:text-[#dc2626] transition-colors rounded-full hover:bg-[#dc2626]/20"
                        title="Remove attendee"
                      >
                        <span className="material-symbols-outlined text-[18px]">person_remove</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#353534] flex justify-between items-center bg-[#0e0e0e]/30">
          <span className="font-data-mono text-[12px] text-[#e6bdb8]">
            SHOWING 1-{filteredAttendees.length} OF {hostManagedEvent.metrics.totalAttendees}
          </span>
          <div className="flex gap-2">
            <button className="w-8 h-8 flex items-center justify-center bg-[#353534] rounded text-[#e6bdb8] hover:text-white disabled:opacity-40" disabled>
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center bg-[#353534] rounded text-[#e6bdb8] hover:text-white">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* Cancel Event Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div
            onClick={() => setCancelModalOpen(false)}
            className="absolute inset-0 bg-[#0e0e0e]/80 backdrop-blur-sm"
          ></div>
          <div className="relative bg-[#201f1f] border border-[#ffb4ab]/30 w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#690005]/40 flex items-center justify-center text-[#ffb4ab] mb-1">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <h3 className="font-headline-lg text-[22px] text-[#e5e2e1] font-bold">
              Cancel this event?
            </h3>
            <p className="font-body-md text-[14px] text-[#e6bdb8] leading-relaxed">
              This action cannot be undone. All 342 registered and waitlisted attendees will be notified of the cancellation immediately.
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2.5 font-label-caps text-[12px] text-[#e5e2e1] hover:bg-[#353534] rounded-xl transition-colors font-bold"
              >
                KEEP EVENT
              </button>
              <button
                onClick={() => {
                  alert('Event cancelled. Attendees notified.');
                  setCancelModalOpen(false);
                  onNavigate('dashboard');
                }}
                className="px-5 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-[#fff6f5] font-label-caps text-[12px] rounded-xl transition-colors shadow-sm font-bold"
              >
                CONFIRM CANCELLATION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendee Details Drawer Modal */}
      {selectedAttendee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0e0e0e]/70 backdrop-blur-sm">
          <div className="bg-[#1c1b1b] border border-[#353534] rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={() => setSelectedAttendee(null)}
              className="absolute top-4 right-4 text-[#e6bdb8] hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-[#353534] overflow-hidden flex items-center justify-center text-[18px] font-bold text-white">
                {selectedAttendee.avatar ? (
                  <img src={selectedAttendee.avatar} alt={selectedAttendee.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{selectedAttendee.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <h3 className="font-headline-md text-[18px] font-bold text-white">{selectedAttendee.name}</h3>
                <p className="text-[13px] text-[#e6bdb8]">{selectedAttendee.role}</p>
                <span className="inline-block mt-1 font-label-caps text-[10px] px-2 py-0.5 rounded bg-[#ffb4ab]/20 text-[#ffb4ab] font-bold uppercase">
                  {selectedAttendee.status}
                </span>
              </div>
            </div>
            <div className="space-y-2 py-3 border-t border-b border-[#353534] text-[13px] font-data-mono text-[#e6bdb8]">
              <div>Email: <span className="text-white">{selectedAttendee.email}</span></div>
              <div>Registered: <span className="text-white">{selectedAttendee.rsvpDate}</span></div>
              <div>Check-in Status: <span className="text-[#ffb4ab]">Confirmed (Pass valid)</span></div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setSelectedAttendee(null)}
                className="px-4 py-2 bg-[#ffb4ab] text-[#690005] font-label-caps text-[11px] rounded-lg font-bold"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
