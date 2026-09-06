import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../lib/api';
import type { ScreenType, AdminUserRecord } from '../../types/eventboard';

interface AdminUsersViewProps {
  onNavigate: (screen: ScreenType) => void;
}

type TabType = 'ALL' | 'ADMIN' | 'ORGANIZER' | 'USER' | 'SUSPENDED';

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ onNavigate }) => {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('ALL');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.get<AdminUserRecord[]>('/admin/users');
      setUsers(res.data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to load users from the server.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Dynamic statistics
  const stats = useMemo(() => {
    return {
      ALL: users.length,
      ADMIN: users.filter((u) => u.role === 'ADMIN').length,
      ORGANIZER: users.filter((u) => u.role === 'ORGANIZER').length,
      USER: users.filter((u) => u.role === 'USER').length,
      SUSPENDED: users.filter((u) => u.status === 'SUSPENDED').length,
    };
  }, [users]);

  // 60fps smooth instant client-side filtering
  const filtered = useMemo(() => {
    return users.filter((u) => {
      let matchesTab = true;
      if (activeTab === 'SUSPENDED') {
        matchesTab = u.status === 'SUSPENDED';
      } else if (activeTab !== 'ALL') {
        matchesTab = u.role === activeTab;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [users, activeTab, searchQuery]);

  const toggleSuspend = async (user: AdminUserRecord) => {
    const willSuspend = user.status === 'ACTIVE';
    const confirmMessage = willSuspend
      ? `Suspend user "${user.name}" (${user.email})?\nThey will be blocked from logging in or managing events.`
      : `Reactivate user "${user.name}" (${user.email})?`;

    if (!confirm(confirmMessage)) return;

    setActionLoading(user.id);
    setFeedback(null);
    try {
      const res = await api.patch<AdminUserRecord>(`/admin/users/${user.id}/suspend`, {
        suspend: willSuspend,
      });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data : u)));
      setFeedback({
        type: 'success',
        message: `User ${user.name} is now ${willSuspend ? 'SUSPENDED' : 'ACTIVE'}.`,
      });
    } catch (err: any) {
      console.error('Failed to update suspension status:', err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to update user status.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const TABS: { id: TabType; label: string }[] = [
    { id: 'ALL', label: 'ALL' },
    { id: 'ADMIN', label: 'ADMIN' },
    { id: 'ORGANIZER', label: 'ORGANIZER' },
    { id: 'USER', label: 'USER' },
    { id: 'SUSPENDED', label: 'SUSPENDED' },
  ];

  return (
    <div className="flex flex-col w-full px-4 sm:px-6 py-6 sm:py-8 gap-5 sm:gap-6 max-w-[1400px] mx-auto min-h-screen">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold tracking-widest">
            ADMINISTRATION // USERS
          </span>
          <h1 className="font-headline-xl text-[28px] sm:text-[34px] md:text-[40px] text-[#e5e2e1] font-bold mt-1">
            User Management
          </h1>
          <p className="text-[#e6bdb8] text-[13px] sm:text-[14px] mt-0.5">
            System access, event participation, and role allocation.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-3.5 py-2 bg-[#201f1f] hover:bg-[#2a2a2a] text-[#e5e2e1] font-label-caps text-[11px] sm:text-[12px] rounded-xl border border-[#353534] transition-colors flex items-center gap-1.5 font-bold disabled:opacity-50 cursor-pointer"
            title="Refresh Users"
          >
            <span className={`material-symbols-outlined text-[17px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            REFRESH
          </button>
          
          <button
            onClick={() => onNavigate('admin')}
            className="px-3.5 py-2 bg-[#201f1f] hover:bg-[#2a2a2a] text-[#e5e2e1] font-label-caps text-[11px] sm:text-[12px] rounded-xl border border-[#353534] transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">dashboard</span>
            BACK TO OVERVIEW
          </button>
        </div>
      </div>

      {/* ── Feedback Banner ── */}
      {feedback && (
        <div className={`flex items-start justify-between gap-3 px-4 py-3 rounded-xl border text-[13px] animate-in fade-in ${
          feedback.type === 'success'
            ? 'bg-[#0f2416] border-[#4ade80]/30 text-[#86efac]'
            : 'bg-[#240f0f] border-[#f87171]/30 text-[#fca5a5]'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className={`material-symbols-outlined text-[18px] shrink-0 ${feedback.type === 'success' ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
              {feedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="shrink-0 opacity-50 hover:opacity-100 cursor-pointer">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* ── Metrics Cards (Responsive 2x2 on mobile/tablet, 4 on desktop) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer min-w-0 ${
            activeTab === 'ALL'
              ? 'bg-[#201f1f] border-[#ffb4ab] shadow-lg shadow-[#ffb4ab]/5 ring-1 ring-[#ffb4ab]'
              : 'bg-[#201f1f] border-[#353534] hover:border-[#ffb4ab]/50'
          }`}
        >
          <span className="font-label-caps text-[10px] sm:text-[11px] text-[#e6bdb8] block mb-1 truncate">
            TOTAL USERS
          </span>
          <span className="font-headline-xl text-[24px] sm:text-[30px] md:text-[36px] text-[#e5e2e1] font-bold">
            {loading ? '—' : stats.ALL}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ADMIN')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer min-w-0 ${
            activeTab === 'ADMIN'
              ? 'bg-[#201f1f] border-[#ffb4ab] shadow-lg shadow-[#ffb4ab]/5 ring-1 ring-[#ffb4ab]'
              : 'bg-[#201f1f] border-[#353534] hover:border-[#ffb4ab]/50'
          }`}
        >
          <span className="font-label-caps text-[10px] sm:text-[11px] text-[#e6bdb8] block mb-1 truncate">
            ADMINS
          </span>
          <span className="font-headline-xl text-[24px] sm:text-[30px] md:text-[36px] text-[#e5e2e1] font-bold">
            {loading ? '—' : stats.ADMIN}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ORGANIZER')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer min-w-0 ${
            activeTab === 'ORGANIZER'
              ? 'bg-[#201f1f] border-[#ffb4ab] shadow-lg shadow-[#ffb4ab]/5 ring-1 ring-[#ffb4ab]'
              : 'bg-[#201f1f] border-[#353534] hover:border-[#ffb4ab]/50'
          }`}
        >
          <span className="font-label-caps text-[10px] sm:text-[11px] text-[#e6bdb8] block mb-1 truncate">
            ORGANIZERS
          </span>
          <span className="font-headline-xl text-[24px] sm:text-[30px] md:text-[36px] text-[#ffb4ab] font-bold">
            {loading ? '—' : stats.ORGANIZER}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('SUSPENDED')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer min-w-0 ${
            activeTab === 'SUSPENDED'
              ? 'bg-[#201f1f] border-[#ffb4ab] shadow-lg shadow-[#ffb4ab]/5 ring-1 ring-[#ffb4ab]'
              : 'bg-[#201f1f] border-[#353534] hover:border-[#ffb4ab]/50'
          }`}
        >
          <span className="font-label-caps text-[10px] sm:text-[11px] text-[#e6bdb8] flex items-center gap-1.5 mb-1 truncate">
            <span className="w-2 h-2 rounded-full bg-[#f87171] animate-pulse shrink-0" /> SUSPENDED
          </span>
          <span className="font-headline-xl text-[24px] sm:text-[30px] md:text-[36px] text-[#f87171] font-bold">
            {loading ? '—' : stats.SUSPENDED}
          </span>
        </button>
      </div>

      {/* ── Toolbar (Search + Role Tabs without extra prefixes) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-[#201f1f] p-3 rounded-2xl border border-[#353534]">
        <div className="flex-1 sm:max-w-xs flex items-center bg-[#131313] px-3.5 py-2.5 rounded-xl border border-[#353534]">
          <span className="material-symbols-outlined text-[#e6bdb8] mr-2.5 text-[18px]">search</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, email, role..."
            className="bg-transparent text-[#e5e2e1] font-data-mono text-[12px] w-full outline-none placeholder:text-[#666]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#666] hover:text-white ml-1 cursor-pointer">
              <span className="material-symbols-outlined text-[15px]">cancel</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl font-label-caps text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#ffb4ab] text-[#690005] shadow-sm'
                  : 'bg-[#131313] text-[#e6bdb8] hover:text-white border border-[#353534]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-data-mono ${
                activeTab === tab.id
                  ? 'bg-[#690005]/20 text-[#690005]'
                  : 'bg-[#2a2a2a] text-[#888]'
              }`}>
                {stats[tab.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── List / Table ── */}
      <div className="bg-[#201f1f] rounded-2xl border border-[#353534] overflow-hidden shadow-xl">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse" style={{ minWidth: '780px' }}>
            <thead>
              <tr className="bg-[#1c1b1b] border-b border-[#353534]">
                <th className="px-4 py-4 font-label-caps text-[11px] text-[#e6bdb8] w-12 text-center">#</th>
                <th className="px-4 py-4 font-label-caps text-[11px] text-[#e6bdb8]">USER IDENTIFIER</th>
                <th className="px-4 py-4 font-label-caps text-[11px] text-[#e6bdb8] w-36">SYSTEM ROLE</th>
                <th className="px-4 py-4 font-label-caps text-[11px] text-[#e6bdb8] text-right w-28">CREATED</th>
                <th className="px-4 py-4 font-label-caps text-[11px] text-[#e6bdb8] text-right w-28">JOINED</th>
                <th className="px-4 py-4 font-label-caps text-[11px] text-[#e6bdb8] w-32">STATUS</th>
                <th className="px-4 py-4 font-label-caps text-[11px] text-[#e6bdb8] text-right w-24">ACTION</th>
              </tr>
            </thead>

            {loading ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="material-symbols-outlined animate-spin text-[36px] text-[#ffb4ab]">
                        progress_activity
                      </span>
                      <span className="text-[12px] text-[#888] font-data-mono">Loading user directory…</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : filtered.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={7} className="py-20 text-center px-4">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#2a2a2a] border border-[#353534] flex items-center justify-center mb-3">
                        <span className="material-symbols-outlined text-[30px] text-[#ffb4ab]">
                          {searchQuery ? 'search_off' : 'person_off'}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-[16px] mb-1">
                        {searchQuery ? 'No matching users found' : `No ${activeTab} users found`}
                      </h3>
                      <p className="text-[12px] text-[#777] max-w-xs">
                        {searchQuery
                          ? `No user records matched "${searchQuery}".`
                          : activeTab === 'SUSPENDED'
                          ? 'There are currently no suspended accounts.'
                          : `There are currently no users in the ${activeTab} category.`}
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-[#353534]">
                {filtered.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-[#2a2a2a]/40 transition-colors">
                    {/* Index */}
                    <td className="px-4 py-4 text-center">
                      <div className="w-8 h-8 rounded-full bg-[#353534] flex items-center justify-center text-[10px] font-bold text-white uppercase mx-auto">
                        {u.name
                          ? u.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                          : 'U'}
                      </div>
                    </td>

                    {/* User Identifier */}
                    <td className="px-4 py-4 max-w-[240px]">
                      <div className="flex flex-col min-w-0">
                        <span className={`font-semibold truncate text-[14px] ${u.status === 'SUSPENDED' ? 'text-[#e6bdb8]' : 'text-white'}`}>
                          {u.name}
                        </span>
                        <span className="font-data-mono text-[11px] text-[#e6bdb8] truncate opacity-70">
                          {u.email}
                        </span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-4">
                      <span
                        className={`font-label-caps text-[10px] px-2.5 py-1 rounded font-bold inline-block ${
                          u.role === 'ADMIN'
                            ? 'bg-[#690005] text-[#ffdad6] border border-[#ffb4ab]/30'
                            : u.role === 'ORGANIZER'
                            ? 'bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/30'
                            : 'bg-[#353534] text-[#e5e2e1]'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-4 py-4 text-right font-data-mono text-[13px] text-[#e5e2e1]">
                      {u.events_created ?? u.eventsCreated ?? 0}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-4 text-right font-data-mono text-[13px] text-[#e5e2e1]">
                      {u.events_joined ?? u.eventsJoined ?? 0}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${u.status === 'ACTIVE' ? 'bg-[#4ade80]' : 'bg-[#f87171]'}`}
                        />
                        <span className={`font-label-caps text-[11px] font-bold ${u.status === 'ACTIVE' ? 'text-[#e5e2e1]' : 'text-[#f87171]'}`}>
                          {u.status}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => toggleSuspend(u)}
                        disabled={actionLoading === u.id}
                        className="p-2 rounded-full text-[#e6bdb8] hover:text-[#ffb4ab] hover:bg-[#131313] transition-colors disabled:opacity-40 cursor-pointer"
                        title={u.status === 'ACTIVE' ? 'Suspend user' : 'Reactivate user'}
                      >
                        {actionLoading === u.id ? (
                          <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined text-[18px]">
                            {u.status === 'ACTIVE' ? 'block' : 'restart_alt'}
                          </span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>

        <div className="p-4 border-t border-[#353534] bg-[#1c1b1b] text-center">
          <span className="font-data-mono text-[11px] text-[#e6bdb8]">
            Showing {filtered.length} of {users.length} user records
          </span>
        </div>
      </div>
    </div>
  );
};