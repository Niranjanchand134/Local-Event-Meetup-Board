import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ScreenType, AdminUserRecord } from '../../types/eventboard';
import { eventsApi } from '../../lib/eventsApi';
import { api } from '../../lib/api';
import type { EventOut, VerificationStats, VerificationAdminOut, EventCategory } from '../../types';
import {
  getEventImageUrl,
  formatEventDate,
  formatEventTime,
  getEventLocationLabel,
  CATEGORY_LABEL_MAP,
  CATEGORY_ICON_MAP,
} from '../../lib/eventDisplay';
import { systemLogs } from '../../data/mockData';

interface AdminOverviewViewProps {
  onNavigate: (screen: ScreenType, eventId?: string) => void;
}

const CATEGORY_PALETTE: Record<string, string> = {
  workshop: '#ffb4ab',
  community_class: '#bdc7d8',
  study_group: '#a8c7fa',
  free_tutoring: '#ffd8e4',
  park_cleanup: '#c2c8bc',
  garage_sale: '#d0bcff',
  other: '#796e6d',
};

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({ onNavigate }) => {
  const queryClient = useQueryClient();
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Detail Modal for selected event in dashboard
  const [selectedEvent, setSelectedEvent] = useState<EventOut | null>(null);

  // 1. Fetch Events
  const {
    data: events = [],
    isLoading: eventsLoading,
  } = useQuery<EventOut[]>({
    queryKey: ['events', 'overview'],
    queryFn: () => eventsApi.getEvents(),
  });

  // 2. Fetch Users
  const {
    data: users = [],
    isLoading: usersLoading,
  } = useQuery<AdminUserRecord[]>({
    queryKey: ['admin-users', 'overview'],
    queryFn: async () => {
      try {
        const res = await api.get<AdminUserRecord[]>('/admin/users');
        return res.data;
      } catch {
        return [];
      }
    },
  });

  const usersById = useMemo(() => {
    const map: Record<string, AdminUserRecord> = {};
    users.forEach((u) => {
      map[u.id] = u;
    });
    return map;
  }, [users]);

  // 3. Fetch Verification Stats
  const {
    data: verificationStats = { pending: 0, approved: 0, rejected: 0, total: 0 },
    isLoading: verificationsLoading,
  } = useQuery<VerificationStats>({
    queryKey: ['verifications-stats', 'overview'],
    queryFn: async () => {
      try {
        const res = await api.get<VerificationStats>('/verifications/admin/stats');
        return res.data;
      } catch {
        return { pending: 0, approved: 0, rejected: 0, total: 0 };
      }
    },
  });

  // 4. Fetch Pending Verifications List
  const {
    data: pendingVerifications = [],
  } = useQuery<VerificationAdminOut[]>({
    queryKey: ['verifications-pending', 'overview'],
    queryFn: async () => {
      try {
        const res = await api.get<VerificationAdminOut[]>('/verifications/admin/pending');
        return res.data;
      } catch {
        return [];
      }
    },
  });

  const isLoading = eventsLoading || usersLoading || verificationsLoading;

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['events'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
      queryClient.invalidateQueries({ queryKey: ['verifications-stats'] }),
      queryClient.invalidateQueries({ queryKey: ['verifications-pending'] }),
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Aggregated Metrics
  const totalUsers = users.length;
  const organizerCount = useMemo(() => users.filter((u) => u.role === 'ORGANIZER').length, [users]);
  const standardUserCount = useMemo(() => users.filter((u) => u.role === 'USER').length, [users]);
  const adminCount = useMemo(() => users.filter((u) => u.role === 'ADMIN').length, [users]);

  const totalEvents = events.length;
  const upcomingCount = useMemo(() => events.filter((e) => e.status === 'upcoming').length, [events]);
  const completedCount = useMemo(() => events.filter((e) => e.status === 'completed').length, [events]);
  const totalRsvps = useMemo(() => events.reduce((sum, e) => sum + (e.confirmed_count || 0), 0), [events]);

  // Recent 5 events
  const recentEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [events]);

  // Category Distribution
  const categoryStats = useMemo(() => {
    if (events.length === 0) return [];
    const counts: Record<string, number> = {};
    events.forEach((evt) => {
      counts[evt.category] = (counts[evt.category] || 0) + 1;
    });

    const entries = Object.entries(counts).map(([cat, count]) => ({
      category: cat,
      label: CATEGORY_LABEL_MAP[cat as EventCategory] || cat,
      count,
      percentage: Math.round((count / events.length) * 100),
      color: CATEGORY_PALETTE[cat] || '#796e6d',
    }));

    return entries.sort((a, b) => b.count - a.count);
  }, [events]);

  // Chart data
  const chartData = useMemo(() => {
    if (categoryStats.length === 0) {
      return [
        { label: 'Workshops', count: 0, height: '20%' },
        { label: 'Classes', count: 0, height: '20%' },
        { label: 'Study', count: 0, height: '20%' },
        { label: 'Tutoring', count: 0, height: '20%' },
      ];
    }
    const maxCount = Math.max(1, ...categoryStats.map((c) => c.count));
    return categoryStats.slice(0, 6).map((c) => ({
      label: c.label.length > 11 ? `${c.label.slice(0, 10)}…` : c.label,
      count: c.count,
      height: `${Math.max(25, Math.round((c.count / maxCount) * 92))}%`,
    }));
  }, [categoryStats]);

  const selectedEventCreator = selectedEvent ? usersById[selectedEvent.created_by] : null;

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 gap-6 sm:gap-8 max-w-[1360px] mx-auto min-h-screen">
      {/* ========================================================
          DASHBOARD HERO HEADER (Modern & Sleek)
          ======================================================== */}
      <section className="bg-gradient-to-r from-[#1c1b1b] via-[#201f1f] to-[#1c1b1b] border border-[#353534] p-5 sm:p-7 rounded-3xl shadow-lg relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-40 bg-[#ffb4ab]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab] animate-pulse"></span>
              <span className="text-[11px] font-label-caps font-bold tracking-widest text-[#ffb4ab] uppercase">
                ADMIN CONSOLE
              </span>
              <span className="text-[#353534]">•</span>
              <span className="text-[12px] font-data-mono text-[#e6bdb8]">Live Telemetry</span>
            </div>
            <h1 className="text-[26px] sm:text-[32px] font-bold text-[#e5e2e1] tracking-tight">
              Platform Overview
            </h1>
            <p className="text-[13px] text-[#e6bdb8] font-data-mono mt-0.5">
              Real-time community metrics, active meetups, and pending governance tasks
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefreshAll}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#201f1f] hover:bg-[#2a2a2a] border border-[#353534] text-[#e5e2e1] hover:border-[#ffb4ab]/50 transition-all text-[12px] font-label-caps font-bold shadow-sm disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-[18px] text-[#ffb4ab] ${isRefreshing ? 'animate-spin' : ''}`}>
                refresh
              </span>
              <span>{isRefreshing ? 'SYNCING...' : 'SYNC METRICS'}</span>
            </button>

            <button
              onClick={() => onNavigate('admin-events')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] font-label-caps font-bold text-[12px] tracking-wider transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span>MANAGE EVENTS</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          TOP TELEMETRY BENTO CARDS (Clean, Distinct, Aligned)
          ======================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* 1. Total Users */}
        <div
          onClick={() => onNavigate('admin-users')}
          className="bg-[#201f1f] hover:bg-[#242323] border border-[#353534] hover:border-[#ffb4ab]/60 p-5 rounded-2xl cursor-pointer transition-all duration-200 shadow-md group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-label-caps font-bold tracking-wider text-[#e6bdb8] uppercase">
                Total Users
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#ffb4ab]/10 flex items-center justify-center text-[#ffb4ab] border border-[#ffb4ab]/20 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">group</span>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[32px] font-bold font-data-mono text-[#e5e2e1] leading-none">
                {usersLoading ? '—' : totalUsers}
              </span>
              <span className="text-[11px] font-data-mono text-[#c6c6c7]">registered</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#131313] border border-[#353534] text-[11px] font-data-mono text-[#e6bdb8] mb-3">
              <span>{organizerCount} Org</span>
              <span>•</span>
              <span>{standardUserCount} Users</span>
              <span>•</span>
              <span>{adminCount} Adm</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-label-caps font-bold text-[#ffb4ab] pt-3 border-t border-[#353534]/50 group-hover:underline">
            <span>USER DIRECTORY</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </div>
        </div>

        {/* 2. Total Events */}
        <div
          onClick={() => onNavigate('admin-events')}
          className="bg-[#201f1f] hover:bg-[#242323] border border-[#353534] hover:border-[#ffb4ab]/60 p-5 rounded-2xl cursor-pointer transition-all duration-200 shadow-md group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-label-caps font-bold tracking-wider text-[#e6bdb8] uppercase">
                Total Events
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#a8c7fa]/10 flex items-center justify-center text-[#a8c7fa] border border-[#a8c7fa]/20 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">event_note</span>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[32px] font-bold font-data-mono text-[#e5e2e1] leading-none">
                {eventsLoading ? '—' : totalEvents}
              </span>
              <span className="text-[11px] font-data-mono text-[#c6c6c7]">hosted</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#131313] border border-[#353534] text-[11px] font-data-mono text-[#e6bdb8] mb-3">
              <span className="text-[#a8c7fa]">{upcomingCount} Active</span>
              <span>•</span>
              <span>{completedCount} Past</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-label-caps font-bold text-[#ffb4ab] pt-3 border-t border-[#353534]/50 group-hover:underline">
            <span>ALL EVENTS</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </div>
        </div>

        {/* 3. Verification Queue */}
        <div
          onClick={() => onNavigate('admin-verifications')}
          className={`p-5 rounded-2xl cursor-pointer transition-all duration-200 shadow-md group flex flex-col justify-between border ${
            verificationStats.pending > 0
              ? 'bg-gradient-to-br from-[#93000a] to-[#560005] border-[#ffb4ab]/60 hover:border-[#ffb4ab]'
              : 'bg-[#201f1f] hover:bg-[#242323] border-[#353534] hover:border-[#ffb4ab]/60'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span
                className={`text-[11px] font-label-caps font-bold tracking-wider uppercase ${
                  verificationStats.pending > 0 ? 'text-[#ffdad6]' : 'text-[#e6bdb8]'
                }`}
              >
                Verification Queue
              </span>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                  verificationStats.pending > 0
                    ? 'bg-[#ffdad6]/20 text-[#ffdad6] border border-[#ffdad6]/30'
                    : 'bg-[#ffd8e4]/10 text-[#ffd8e4] border border-[#ffd8e4]/20'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {verificationStats.pending > 0 ? 'gavel' : 'verified_user'}
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span
                className={`text-[32px] font-bold font-data-mono leading-none ${
                  verificationStats.pending > 0 ? 'text-[#ffdad6]' : 'text-[#e5e2e1]'
                }`}
              >
                {verificationsLoading ? '—' : verificationStats.pending}
              </span>
              <span
                className={`text-[11px] font-data-mono ${
                  verificationStats.pending > 0 ? 'text-[#ffdad6]/80' : 'text-[#c6c6c7]'
                }`}
              >
                pending review
              </span>
            </div>

            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-data-mono mb-3 ${
                verificationStats.pending > 0
                  ? 'bg-black/30 border border-white/10 text-[#ffdad6]'
                  : 'bg-[#131313] border border-[#353534] text-[#e6bdb8]'
              }`}
            >
              <span>{verificationStats.approved} Approved</span>
              <span>•</span>
              <span>{verificationStats.rejected} Rejected</span>
            </div>
          </div>

          <div
            className={`flex items-center justify-between text-[11px] font-label-caps font-bold pt-3 border-t group-hover:underline ${
              verificationStats.pending > 0
                ? 'text-[#ffdad6] border-white/20'
                : 'text-[#ffb4ab] border-[#353534]/50'
            }`}
          >
            <span>{verificationStats.pending > 0 ? 'ACTION REQUIRED' : 'VIEW VERIFICATIONS'}</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </div>
        </div>

        {/* 4. Confirmed RSVPs */}
        <div className="bg-[#201f1f] hover:bg-[#242323] border border-[#353534] hover:border-[#ffb4ab]/60 p-5 rounded-2xl transition-all duration-200 shadow-md group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-label-caps font-bold tracking-wider text-[#e6bdb8] uppercase">
                Confirmed RSVPs
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#c2c8bc]/10 flex items-center justify-center text-[#c2c8bc] border border-[#c2c8bc]/20 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[32px] font-bold font-data-mono text-[#e5e2e1] leading-none">
                {eventsLoading ? '—' : totalRsvps}
              </span>
              <span className="text-[11px] font-data-mono text-[#c6c6c7]">attendees</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#131313] border border-[#353534] text-[11px] font-data-mono text-[#e6bdb8] mb-3">
              <span>Across {totalEvents} events</span>
              <span>•</span>
              <span className="text-[#a8c7fa]">Platform active</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-label-caps font-bold text-[#c6c6c7] pt-3 border-t border-[#353534]/50">
            <span>ENGAGEMENT LEVEL</span>
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
          </div>
        </div>
      </section>

      {/* ========================================================
          ANALYTICS & BREAKDOWN (Interactive & Proportional)
          ======================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Dynamic Category Demand Bar Chart */}
        <div className="lg:col-span-2 bg-[#201f1f] rounded-2xl p-5 sm:p-6 border border-[#353534] flex flex-col justify-between shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-[17px] font-bold text-[#e5e2e1]">Category Distribution</h2>
              <p className="text-[12px] text-[#e6bdb8] font-data-mono">
                Active volume of community meetups by category
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]"></span>
              <span className="text-[11px] font-data-mono text-[#e6bdb8]">Live Event Ratios</span>
            </div>
          </div>

          <div className="h-56 relative mt-2 flex flex-col justify-end">
            <div className="absolute inset-0 flex items-end justify-between px-3 pb-8">
              {/* Reference Grid Lines */}
              <div className="absolute inset-x-0 border-b border-[#353534]/40" style={{ top: '25%' }} />
              <div className="absolute inset-x-0 border-b border-[#353534]/40" style={{ top: '50%' }} />
              <div className="absolute inset-x-0 border-b border-[#353534]/40" style={{ top: '75%' }} />
              <div className="absolute inset-x-0 border-b border-[#353534]/40" style={{ top: '100%' }} />

              {/* Dynamic Bars */}
              {chartData.map((bar, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setActiveBarIndex(i)}
                  onMouseLeave={() => setActiveBarIndex(null)}
                  className="w-1/6 sm:w-1/8 bg-[#ffb4ab]/80 rounded-t-md z-10 hover:bg-[#ffb4ab] transition-all cursor-pointer relative group flex flex-col justify-end items-center"
                  style={{ height: bar.height }}
                >
                  <div
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#2a2a2a] text-[#e5e2e1] px-2.5 py-1 rounded-md whitespace-nowrap font-data-mono text-[11px] border border-[#353534] shadow-lg pointer-events-none z-20 transition-opacity ${
                      activeBarIndex === i ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {bar.count} Events
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between px-1 text-[#e6bdb8] font-data-mono text-[11px] border-t border-[#353534] pt-2">
              {chartData.map((bar, i) => (
                <span key={i} className="truncate max-w-[60px] sm:max-w-[80px] text-center">
                  {bar.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Category Share Breakdown */}
        <div className="bg-[#201f1f] rounded-2xl p-5 sm:p-6 border border-[#353534] flex flex-col justify-between shadow-md">
          <div>
            <h2 className="text-[17px] font-bold text-[#e5e2e1]">Popular Categories</h2>
            <p className="text-[12px] text-[#e6bdb8] font-data-mono mb-4">
              Market share of total hosted events
            </p>

            <div className="space-y-3">
              {categoryStats.length === 0 ? (
                <p className="text-center text-[13px] text-[#e6bdb8] py-8 font-data-mono">
                  No events hosted yet.
                </p>
              ) : (
                categoryStats.slice(0, 5).map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="font-medium text-[#e5e2e1] truncate max-w-[160px]">
                        {cat.label}
                      </span>
                      <span className="font-data-mono text-[#e6bdb8]">
                        {cat.count} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#131313] rounded-full overflow-hidden border border-[#353534]/50">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#353534] mt-4 flex items-center justify-between text-[11px] font-data-mono text-[#e6bdb8]">
            <span>Total Categories: {categoryStats.length}</span>
            <button
              onClick={() => onNavigate('admin-events')}
              className="text-[#ffb4ab] hover:underline font-label-caps font-bold"
            >
              BROWSE ALL →
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          LIVE EVENTS MONITOR (Clean Table - No Category Column)
          ======================================================== */}
      <section className="bg-[#201f1f] rounded-2xl border border-[#353534] flex flex-col overflow-hidden shadow-md">
        <div className="p-5 border-b border-[#353534] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#1c1b1b]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ffb4ab]/10 flex items-center justify-center text-[#ffb4ab]">
              <span className="material-symbols-outlined text-[18px]">event_available</span>
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#e5e2e1]">Recent Events Monitor</h2>
              <p className="text-[12px] text-[#e6bdb8] font-data-mono">
                Latest community gatherings published on the platform
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('admin-events')}
            className="inline-flex items-center gap-1.5 text-[#ffb4ab] hover:underline text-[12px] font-label-caps font-bold transition-colors"
          >
            <span>VIEW ALL IN EVENTS DIRECTORY</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b border-[#353534] bg-[#0e0e0e]/60">
                <th className="p-4 font-label-caps text-[11px] text-[#e6bdb8] uppercase w-16 font-bold">
                  Cover
                </th>
                <th className="p-4 font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">
                  Event Title &amp; Creator
                </th>
                <th className="p-4 font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold whitespace-nowrap">
                  Date &amp; Time
                </th>
                <th className="p-4 font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold whitespace-nowrap">
                  Attendees
                </th>
                <th className="p-4 font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">
                  Status
                </th>
                <th className="p-4 font-label-caps text-[11px] text-[#e6bdb8] uppercase text-right w-24 font-bold">
                  Inspect
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#353534] text-[14px]">
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#e6bdb8] font-data-mono text-[13px]">
                    No events currently hosted.
                  </td>
                </tr>
              ) : (
                recentEvents.map((evt) => {
                  const coverImg = getEventImageUrl(evt);
                  const isCancelled = evt.status === 'cancelled';
                  const isCompleted = evt.status === 'completed';
                  const creator = usersById[evt.created_by];

                  return (
                    <tr
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className="hover:bg-[#2a2a2a]/90 transition-colors cursor-pointer group"
                    >
                      {/* Cover Thumbnail */}
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-xl bg-[#131313] border border-[#353534] overflow-hidden flex items-center justify-center shrink-0">
                          {coverImg ? (
                            <img
                              src={coverImg}
                              alt={evt.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-[20px] text-[#796e6d]">
                              image
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Title + Organizer Info */}
                      <td className="p-4 max-w-[280px]">
                        <div className="font-semibold text-[#e5e2e1] group-hover:text-[#ffb4ab] transition-colors line-clamp-1 text-[14px]">
                          {evt.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-[12px] text-[#e6bdb8] font-data-mono mt-0.5 truncate">
                          <span className="material-symbols-outlined text-[13px] text-[#ffb4ab] shrink-0">
                            person
                          </span>
                          <span className="truncate font-medium text-[#ffdad6]">
                            {creator?.name || `Org ID: ${evt.created_by.slice(0, 8)}…`}
                          </span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-data-mono text-[12px] text-[#e5e2e1]">
                          {formatEventDate(evt.start_time)}
                        </div>
                        <div className="font-data-mono text-[11px] text-[#e6bdb8]">
                          {formatEventTime(evt.start_time)}
                        </div>
                      </td>

                      {/* Attendees */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-data-mono text-[13px] font-bold text-[#e5e2e1]">
                          {evt.confirmed_count}
                          <span className="text-[#c6c6c7] font-normal">
                            /{evt.max_attendees ?? '∞'}
                          </span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-label-caps font-bold uppercase tracking-wider ${
                            isCancelled
                              ? 'bg-[#93000a]/40 text-[#ffdad6] border border-[#ffb4ab]/30'
                              : isCompleted
                              ? 'bg-[#353534] text-[#c6c6c7]'
                              : 'bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCancelled ? 'bg-[#ffdad6]' : isCompleted ? 'bg-[#c6c6c7]' : 'bg-[#ffb4ab]'
                            }`}
                          />
                          {evt.status}
                        </span>
                      </td>

                      {/* Inspect Button */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          className="p-1.5 rounded-lg text-[#e6bdb8] hover:text-[#ffb4ab] hover:bg-[#353534] transition-colors"
                          title="View event details popup"
                        >
                          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================
          BOTTOM ACTIONS & SYSTEM ACTIVITY LOG
          ======================================================== */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Verification Queue Quick Card */}
        <div className="xl:col-span-1 bg-[#201f1f] rounded-2xl p-5 sm:p-6 border border-[#353534] flex flex-col justify-between shadow-md">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-[#353534] pb-3">
              <h2 className="text-[17px] text-[#e5e2e1] flex items-center gap-2 font-bold">
                <span className="material-symbols-outlined text-[#ffb4ab]">gavel</span>
                Organizer Approvals
              </h2>
              <span className="bg-[#ffb4ab] text-[#690005] font-label-caps px-2 py-0.5 rounded text-[10px] font-bold">
                {pendingVerifications.length} PENDING
              </span>
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {pendingVerifications.length === 0 ? (
                <div className="text-center py-10 text-[#e6bdb8] text-[13px] font-data-mono">
                  <span className="material-symbols-outlined text-[32px] text-[#a8c7fa] mb-2 block">
                    check_circle
                  </span>
                  All organizer applications reviewed!
                </div>
              ) : (
                pendingVerifications.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#131313] p-3.5 rounded-xl border border-[#353534] hover:border-[#ffb4ab] transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-label-caps text-[10px] text-[#ffb4ab] font-bold uppercase">
                        {item.document_type}
                      </span>
                      <span className="font-data-mono text-[#e6bdb8] text-[10px]">
                        ID: {item.document_number}
                      </span>
                    </div>
                    <p className="font-semibold text-[#e5e2e1] text-[13px]">{item.full_legal_name}</p>
                    <button
                      onClick={() => onNavigate('admin-verifications')}
                      className="mt-2 text-[11px] font-label-caps text-[#ffb4ab] hover:underline font-bold flex items-center gap-1"
                    >
                      <span>REVIEW NOW</span>
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('admin-verifications')}
            className="w-full mt-4 py-2.5 rounded-xl bg-[#131313] hover:bg-[#2a2a2a] border border-[#353534] text-[#e5e2e1] text-[12px] font-label-caps font-bold transition-colors"
          >
            OPEN VERIFICATION CONSOLE →
          </button>
        </div>

        {/* System Activity Log */}
        <div className="xl:col-span-2 bg-[#201f1f] rounded-2xl border border-[#353534] flex flex-col overflow-hidden shadow-md">
          <div className="p-5 border-b border-[#353534] flex justify-between items-center bg-[#1c1b1b]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#bdc7d8] text-[20px]">
                receipt_long
              </span>
              <h2 className="text-[17px] text-[#e5e2e1] font-bold">System Log &amp; Audit Trail</h2>
            </div>
            <button
              onClick={() => onNavigate('admin-reports')}
              className="text-[#ffb4ab] hover:underline text-[12px] font-label-caps font-bold"
            >
              ALL REPORTS →
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#353534] bg-[#0e0e0e]/50">
                  <th className="p-3.5 font-label-caps text-[11px] text-[#e6bdb8] uppercase w-28 font-bold">
                    Timestamp
                  </th>
                  <th className="p-3.5 font-label-caps text-[11px] text-[#e6bdb8] uppercase w-24 font-bold">
                    Type
                  </th>
                  <th className="p-3.5 font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#353534] text-[13px]">
                {systemLogs.slice(0, 4).map((log) => (
                  <tr key={log.id} className="hover:bg-[#2a2a2a] transition-colors">
                    <td className="p-3.5 font-data-mono text-[11px] text-[#e6bdb8]">
                      {log.timestamp}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-label-caps font-bold uppercase ${
                          log.type === 'EVENT'
                            ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                            : log.type === 'REPORT'
                            ? 'bg-[#93000a]/50 text-[#ffdad6]'
                            : 'bg-[#353534] text-[#e6bdb8]'
                        }`}
                      >
                        {log.type}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-[#e5e2e1]">{log.detail}</div>
                      <div className="text-[#e6bdb8] text-[11px] font-data-mono">{log.subdetail}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================
          POPUP MODAL FOR EVENT DETAILS (Shared in Dashboard)
          ======================================================== */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-[#1c1b1b] border border-[#353534] rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Banner */}
            <div className="relative h-44 sm:h-52 bg-[#131313] overflow-hidden shrink-0 border-b border-[#353534]">
              {getEventImageUrl(selectedEvent) ? (
                <img
                  src={getEventImageUrl(selectedEvent)}
                  alt={selectedEvent.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#796e6d]">
                  <span className="material-symbols-outlined text-[44px] mb-1">image</span>
                  <span className="font-data-mono text-[11px]">No cover image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1c1b1b] via-[#1c1b1b]/40 to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-[#e5e2e1] hover:text-[#ffb4ab] flex items-center justify-center transition-colors border border-white/10 z-10"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>

              {/* Badges on Banner */}
              <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-2 z-10">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-label-caps font-bold bg-black/80 backdrop-blur-md border border-white/10 text-[#ffb4ab]">
                    <span className="material-symbols-outlined text-[14px]">
                      {CATEGORY_ICON_MAP[selectedEvent.category] || 'category'}
                    </span>
                    {CATEGORY_LABEL_MAP[selectedEvent.category] || selectedEvent.category}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-lg text-[11px] font-label-caps font-bold uppercase tracking-wider border ${
                      selectedEvent.status === 'cancelled'
                        ? 'bg-[#93000a] text-[#ffdad6] border-[#ffdad6]/30'
                        : selectedEvent.status === 'completed'
                        ? 'bg-[#353534] text-[#c6c6c7] border-[#353534]'
                        : 'bg-[#ffb4ab] text-[#690005] border-[#ffb4ab]'
                    }`}
                  >
                    {selectedEvent.status}
                  </span>
                </div>

                <div className="text-[12px] font-data-mono px-3 py-1 rounded-lg bg-black/70 text-[#e5e2e1] border border-white/10">
                  {selectedEvent.is_paid ? `${selectedEvent.currency} ${selectedEvent.price}` : 'FREE ADMISSION'}
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Event Title */}
              <div>
                <h2 className="text-[20px] sm:text-[24px] font-bold text-[#e5e2e1] leading-snug mb-1">
                  {selectedEvent.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-data-mono text-[#e6bdb8]">
                  <span>Event ID: {selectedEvent.id}</span>
                  <span>•</span>
                  <span>Created: {new Date(selectedEvent.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Creator / User Details Box */}
              <div className="bg-[#131313] border border-[#353534] rounded-2xl p-4 sm:p-5">
                <div className="flex items-center justify-between border-b border-[#353534]/60 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">
                      account_circle
                    </span>
                    <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold tracking-wider">
                      Event Creator Details
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEvent(null);
                      onNavigate('admin-users');
                    }}
                    className="text-[11px] font-label-caps text-[#ffb4ab] hover:underline font-bold flex items-center gap-1"
                  >
                    <span>USER DIRECTORY</span>
                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <span className="text-[10px] uppercase font-label-caps text-[#e6bdb8] block font-bold mb-0.5">
                      Full Name
                    </span>
                    <p className="text-[14px] font-semibold text-[#e5e2e1]">
                      {selectedEventCreator?.name || 'Unknown / Deleted User'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-label-caps text-[#e6bdb8] block font-bold mb-0.5">
                      Email Address
                    </span>
                    <p className="text-[13px] font-data-mono text-[#e5e2e1] truncate">
                      {selectedEventCreator?.email || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-label-caps text-[#e6bdb8] block font-bold mb-0.5">
                      Role
                    </span>
                    <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-label-caps font-bold uppercase bg-[#201f1f] text-[#ffb4ab] border border-[#ffb4ab]/30">
                      {selectedEventCreator?.role || 'ORGANIZER'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-label-caps text-[#e6bdb8] block font-bold mb-0.5">
                      User ID
                    </span>
                    <p className="text-[11px] font-data-mono text-[#c6c6c7] truncate">
                      {selectedEvent.created_by}
                    </p>
                  </div>
                </div>
              </div>

              {/* Logistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#201f1f] border border-[#353534] rounded-2xl p-4 text-[13px]">
                <div>
                  <span className="text-[10px] uppercase font-label-caps text-[#e6bdb8] block font-bold mb-1">
                    Date &amp; Time
                  </span>
                  <div className="text-[#e5e2e1] font-data-mono text-[12px]">
                    {formatEventDate(selectedEvent.start_time)}
                  </div>
                  <div className="text-[#e6bdb8] font-data-mono text-[11px]">
                    {formatEventTime(selectedEvent.start_time)}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-label-caps text-[#e6bdb8] block font-bold mb-1">
                    Location
                  </span>
                  <div className="text-[#e5e2e1] text-[12px] line-clamp-2">
                    {getEventLocationLabel(selectedEvent)}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-label-caps text-[#e6bdb8] block font-bold mb-1">
                    Confirmed Occupancy
                  </span>
                  <p className="text-[#e5e2e1] font-data-mono font-bold text-[14px]">
                    {selectedEvent.confirmed_count}{' '}
                    <span className="text-[#c6c6c7] font-normal text-[12px]">
                      / {selectedEvent.max_attendees ?? 'Unlimited'} spots
                    </span>
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-label-caps text-[#e6bdb8] block font-bold mb-1">
                    Pricing
                  </span>
                  <p className="text-[#e5e2e1] font-data-mono font-bold text-[14px]">
                    {selectedEvent.is_paid ? `${selectedEvent.currency} ${selectedEvent.price}` : 'Free'}
                  </p>
                </div>
              </div>

              {/* Full Description */}
              <div>
                <h3 className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold tracking-wider mb-2">
                  Event Description
                </h3>
                <div className="bg-[#131313] border border-[#353534] rounded-xl p-4 text-[13px] text-[#e5e2e1] leading-relaxed whitespace-pre-line font-body">
                  {selectedEvent.description || 'No description provided.'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#353534] bg-[#171616] flex items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  onNavigate('event-detail', selectedEvent.id);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#201f1f] hover:bg-[#2a2a2a] border border-[#353534] text-[#e5e2e1] text-[12px] font-label-caps font-bold transition-colors inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                PUBLIC PREVIEW
              </button>

              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] text-[12px] font-label-caps font-bold transition-colors"
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
