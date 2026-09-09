import React, { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ScreenType, AdminUserRecord } from '../../types/eventboard';
import { eventsApi } from '../../lib/eventsApi';
import { api } from '../../lib/api';
import type { EventOut, VerificationStats, VerificationAdminOut } from '../../types';
import {
  getEventImageUrl,
  formatEventDate,
  formatEventTime,
  CATEGORY_LABEL_MAP,
} from '../../lib/eventDisplay';

interface AdminOverviewViewProps {
  onNavigate: (screen: ScreenType, eventId?: string) => void;
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({ onNavigate }) => {
  const queryClient = useQueryClient();

  const { data: allEvents = [], isLoading: eventsLoading } = useQuery<EventOut[]>({
    queryKey: ['events', 'admin-all'],
    queryFn: () => eventsApi.getEvents(),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUserRecord[]>({
    queryKey: ['admin-users', 'overview'],
    queryFn: async () => {
      try { const r = await api.get<AdminUserRecord[]>('/admin/users'); return r.data; } catch { return []; }
    },
  });

  const { data: verificationStats = { pending: 0, approved: 0, rejected: 0, total: 0 } } =
    useQuery<VerificationStats>({
      queryKey: ['verifications-stats', 'overview'],
      queryFn: async () => {
        try { const r = await api.get<VerificationStats>('/verifications/admin/stats'); return r.data; } catch { return { pending: 0, approved: 0, rejected: 0, total: 0 }; }
      },
    });

  const { data: pendingVerifications = [] } = useQuery<VerificationAdminOut[]>({
    queryKey: ['verifications-pending', 'overview'],
    queryFn: async () => {
      try { const r = await api.get<VerificationAdminOut[]>('/verifications/admin/pending'); return r.data; } catch { return []; }
    },
  });

  const isLoading = eventsLoading || usersLoading;

  // Metrics
  const totalEvents = allEvents.length;
  const upcomingCount = allEvents.filter((e) => e.status === 'upcoming').length;
  const completedCount = allEvents.filter((e) => e.status === 'completed').length;
  const cancelledCount = allEvents.filter((e) => e.status === 'cancelled').length;
  const totalRsvps = useMemo(() => allEvents.reduce((s, e) => s + (e.confirmed_count || 0), 0), [allEvents]);
  const totalUsers = users.length;
  const organizerCount = users.filter((u) => u.role === 'ORGANIZER').length;
  const userCount = users.filter((u) => u.role === 'USER').length;

  // Recent events (5 most recent by created_at)
  const recentEvents = useMemo(
    () => [...allEvents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8),
    [allEvents]
  );

  const handleRefresh = async () => {
    await queryClient.invalidateQueries();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[26px] font-bold text-[#e5e2e1]">Admin Dashboard</h1>
          <p className="text-[13px] text-[#c6c6c7] font-data-mono mt-0.5">Platform overview — live community metrics</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-[#201f1f] hover:bg-[#2a2a2a] border border-[#353534] text-[#ffb4ab] rounded-xl text-[11px] font-label-caps font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[15px]">refresh</span>
            Refresh
          </button>
          <button
            onClick={() => onNavigate('admin-events')}
            className="px-4 py-2 bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] rounded-xl text-[11px] font-label-caps font-bold flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">calendar_month</span>
            Manage Events
          </button>
        </div>
      </div>

      {/* ── 4 Stat Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Users */}
        <div
          onClick={() => onNavigate('admin-users')}
          className="bg-[#201f1f] border border-[#353534] hover:border-[#ffb4ab]/50 rounded-2xl p-4 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-label-caps text-[#ac8884] uppercase font-bold">Users</span>
            <span className="material-symbols-outlined text-[#ffb4ab] text-[18px]">group</span>
          </div>
          <div className="font-data-mono text-[28px] font-bold text-[#e5e2e1]">
            {usersLoading ? '—' : totalUsers}
          </div>
          <p className="text-[11px] font-data-mono text-[#c6c6c7] mt-1">{organizerCount} organizers · {userCount} users</p>
          <div className="flex items-center gap-1 text-[10px] font-label-caps text-[#ffb4ab] mt-2 group-hover:underline">
            <span>USER DIRECTORY</span>
            <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
          </div>
        </div>

        {/* Events */}
        <div
          onClick={() => onNavigate('admin-events')}
          className="bg-[#201f1f] border border-[#353534] hover:border-[#ffb4ab]/50 rounded-2xl p-4 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-label-caps text-[#ac8884] uppercase font-bold">Events</span>
            <span className="material-symbols-outlined text-[#a8c7fa] text-[18px]">event_note</span>
          </div>
          <div className="font-data-mono text-[28px] font-bold text-[#e5e2e1]">
            {eventsLoading ? '—' : totalEvents}
          </div>
          <p className="text-[11px] font-data-mono text-[#c6c6c7] mt-1">{upcomingCount} active · {completedCount} completed · {cancelledCount} cancelled</p>
          <div className="flex items-center gap-1 text-[10px] font-label-caps text-[#ffb4ab] mt-2 group-hover:underline">
            <span>ALL EVENTS</span>
            <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
          </div>
        </div>

        {/* RSVPs */}
        <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-label-caps text-[#ac8884] uppercase font-bold">RSVPs</span>
            <span className="material-symbols-outlined text-[#c2c8bc] text-[18px]">how_to_reg</span>
          </div>
          <div className="font-data-mono text-[28px] font-bold text-[#e5e2e1]">
            {eventsLoading ? '—' : totalRsvps}
          </div>
          <p className="text-[11px] font-data-mono text-[#c6c6c7] mt-1">Confirmed attendees across all events</p>
        </div>

        {/* Verifications */}
        <div
          onClick={() => onNavigate('admin-verifications')}
          className={`rounded-2xl p-4 cursor-pointer transition-all group border ${
            verificationStats.pending > 0
              ? 'bg-gradient-to-br from-[#93000a] to-[#560005] border-[#ffb4ab]/40 hover:border-[#ffb4ab]'
              : 'bg-[#201f1f] border-[#353534] hover:border-[#ffb4ab]/50'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[10px] font-label-caps uppercase font-bold ${verificationStats.pending > 0 ? 'text-[#ffdad6]' : 'text-[#ac8884]'}`}>
              Verifications
            </span>
            <span className="material-symbols-outlined text-[18px] text-[#ffd8e4]">
              {verificationStats.pending > 0 ? 'gavel' : 'verified_user'}
            </span>
          </div>
          <div className={`font-data-mono text-[28px] font-bold ${verificationStats.pending > 0 ? 'text-[#ffdad6]' : 'text-[#e5e2e1]'}`}>
            {verificationStats.pending}
          </div>
          <p className={`text-[11px] font-data-mono mt-1 ${verificationStats.pending > 0 ? 'text-[#ffdad6]/80' : 'text-[#c6c6c7]'}`}>
            {verificationStats.pending > 0 ? 'PENDING REVIEW' : 'All clear'} · {verificationStats.approved} approved
          </p>
          <div className={`flex items-center gap-1 text-[10px] font-label-caps mt-2 group-hover:underline ${verificationStats.pending > 0 ? 'text-[#ffdad6]' : 'text-[#ffb4ab]'}`}>
            <span>{verificationStats.pending > 0 ? 'ACTION REQUIRED' : 'VIEW QUEUE'}</span>
            <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
          </div>
        </div>
      </div>

      {/* ── Two columns: Recent Events table + Pending Verifications ─────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Recent Events — 2/3 width */}
        <div className="xl:col-span-2 bg-[#201f1f] border border-[#353534] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#353534] bg-[#1c1b1b]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffb4ab] text-[18px]">event_available</span>
              <h2 className="font-bold text-[15px] text-[#e5e2e1]">Recent Events</h2>
            </div>
            <button
              onClick={() => onNavigate('admin-events')}
              className="text-[11px] font-label-caps text-[#ffb4ab] hover:underline font-bold flex items-center gap-1"
            >
              VIEW ALL
              <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
            </button>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#353534] bg-[#1a1a1a] text-[#ac8884] font-label-caps text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-bold">Event</th>
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 font-bold">Attendees</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#353534]/50">
                {recentEvents.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-[#c6c6c7] font-data-mono text-[12px]">No events yet.</td></tr>
                ) : recentEvents.map((evt) => {
                  const img = getEventImageUrl(evt);
                  const statusColor = evt.status === 'upcoming'
                    ? 'bg-[#ffb4ab]/20 text-[#ffb4ab] border-[#ffb4ab]/30'
                    : evt.status === 'completed'
                    ? 'bg-[#353534] text-[#c6c6c7] border-[#353534]'
                    : 'bg-[#93000a]/40 text-[#ffdad6] border-[#ffdad6]/20';
                  return (
                    <tr key={evt.id} className="hover:bg-[#262525] transition-colors group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-[#131313] border border-[#353534] overflow-hidden flex-shrink-0">
                            {img ? <img src={img} alt={evt.title} className="w-full h-full object-cover" /> : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-[16px] text-[#796e6d]">image</span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[13px] text-[#e5e2e1] truncate max-w-[160px] group-hover:text-[#ffb4ab] transition-colors">{evt.title}</p>
                            <p className="text-[10px] text-[#ac8884] font-data-mono">{CATEGORY_LABEL_MAP[evt.category] || evt.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <p className="font-data-mono text-[11px] text-[#e5e2e1]">{formatEventDate(evt.start_time)}</p>
                        <p className="font-data-mono text-[10px] text-[#ac8884]">{formatEventTime(evt.start_time)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-data-mono text-[13px] font-bold text-[#e5e2e1]">
                          {evt.confirmed_count}<span className="text-[#c6c6c7] font-normal">/{evt.max_attendees ?? '∞'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-label-caps font-bold uppercase border ${statusColor}`}>
                          {evt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onNavigate('event-detail', evt.id)}
                          className="p-1.5 rounded-lg text-[#e6bdb8] hover:text-[#ffb4ab] hover:bg-[#353534] transition-colors"
                          title="View event"
                        >
                          <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-[#353534]/50">
            {recentEvents.map((evt) => (
              <div key={evt.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[13px] text-[#e5e2e1] truncate">{evt.title}</p>
                  <p className="text-[11px] text-[#ac8884] font-data-mono mt-0.5">{formatEventDate(evt.start_time)} · {evt.confirmed_count} attendees</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-label-caps font-bold uppercase border flex-shrink-0 ${
                  evt.status === 'upcoming' ? 'bg-[#ffb4ab]/20 text-[#ffb4ab] border-[#ffb4ab]/30' : 'bg-[#353534] text-[#c6c6c7] border-[#353534]'
                }`}>
                  {evt.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Verifications — 1/3 width */}
        <div className="bg-[#201f1f] border border-[#353534] rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#353534] bg-[#1c1b1b]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffb4ab] text-[18px]">gavel</span>
              <h2 className="font-bold text-[15px] text-[#e5e2e1]">Organizer Approvals</h2>
            </div>
            {pendingVerifications.length > 0 && (
              <span className="bg-[#ffb4ab] text-[#690005] font-label-caps text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingVerifications.length}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#353534]/50">
            {pendingVerifications.length === 0 ? (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-[32px] text-[#a8c7fa] block mb-2">check_circle</span>
                <p className="text-[13px] text-[#c6c6c7] font-data-mono">All applications reviewed!</p>
              </div>
            ) : pendingVerifications.map((item) => (
              <div key={item.id} className="px-4 py-3.5 hover:bg-[#262525] transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-[13px] text-[#e5e2e1]">{item.full_legal_name}</p>
                  <span className="text-[10px] font-label-caps text-[#ffb4ab] bg-[#ffb4ab]/10 px-1.5 py-0.5 rounded font-bold flex-shrink-0">
                    {item.document_type}
                  </span>
                </div>
                <p className="text-[11px] font-data-mono text-[#ac8884]">Doc: {item.document_number}</p>
                <button
                  onClick={() => onNavigate('admin-verifications')}
                  className="mt-1.5 text-[10px] font-label-caps text-[#ffb4ab] hover:underline font-bold flex items-center gap-1"
                >
                  REVIEW NOW
                  <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-[#353534]">
            <button
              onClick={() => onNavigate('admin-verifications')}
              className="w-full py-2.5 rounded-xl bg-[#131313] hover:bg-[#2a2a2a] border border-[#353534] text-[#e5e2e1] text-[11px] font-label-caps font-bold transition-colors"
            >
              OPEN VERIFICATION CONSOLE →
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick Links Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { label: 'Users', icon: 'group', screen: 'admin-users' },
          { label: 'Events', icon: 'event_note', screen: 'admin-events' },
          { label: 'Payments', icon: 'payments', screen: 'admin-payments' },
          { label: 'Reports', icon: 'bar_chart', screen: 'admin-reports' },
        ] as const).map((link) => (
          <button
            key={link.label}
            onClick={() => onNavigate(link.screen as ScreenType)}
            className="bg-[#201f1f] hover:bg-[#2a2a2a] border border-[#353534] hover:border-[#ffb4ab]/40 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all group"
          >
            <span className="material-symbols-outlined text-[#ffb4ab] text-[24px] group-hover:scale-110 transition-transform">{link.icon}</span>
            <span className="font-label-caps text-[11px] text-[#c6c6c7] font-bold uppercase">{link.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
