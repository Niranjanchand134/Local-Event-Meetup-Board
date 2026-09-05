import React, { useState } from 'react';
import type { ScreenType, AdminUserRecord } from '../../types/eventboard';
import { adminUsersData } from '../../data/mockData';

interface AdminUsersViewProps {
  onNavigate: (screen: ScreenType) => void;
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ onNavigate }) => {
  const [users, setUsers] = useState<AdminUserRecord[]>(adminUsersData);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'ORGANIZER' | 'USER'>('ALL');

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const toggleSuspend = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : u
      )
    );
  };

  return (
    <div className="flex flex-col w-full px-6 py-8 gap-6 max-w-[1400px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold tracking-widest">
            ADMINISTRATION // USERS
          </span>
          <h1 className="font-headline-xl text-[32px] md:text-[40px] text-[#e5e2e1] font-bold mt-1">
            User Management
          </h1>
          <p className="text-[#e6bdb8] text-[14px] mt-1">
            System access, event participation, and role allocation.
          </p>
        </div>
        <button
          onClick={() => onNavigate('admin')}
          className="px-4 py-2 bg-[#201f1f] hover:bg-[#2a2a2a] text-[#e5e2e1] font-label-caps text-[12px] rounded-xl border border-[#353534] transition-colors flex items-center gap-2 font-bold"
        >
          <span className="material-symbols-outlined text-[18px]">dashboard</span>
          BACK TO OVERVIEW
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#201f1f] p-6 rounded-2xl border border-[#353534]">
          <span className="font-label-caps text-[11px] text-[#e6bdb8] block mb-1">TOTAL USERS</span>
          <span className="font-headline-xl text-[36px] text-[#e5e2e1] font-bold">{users.length}</span>
        </div>
        <div className="bg-[#201f1f] p-6 rounded-2xl border border-[#353534]">
          <span className="font-label-caps text-[11px] text-[#e6bdb8] block mb-1">ADMINS</span>
          <span className="font-headline-xl text-[36px] text-[#e5e2e1] font-bold">
            {users.filter((u) => u.role === 'ADMIN').length}
          </span>
        </div>
        <div className="bg-[#201f1f] p-6 rounded-2xl border border-[#353534]">
          <span className="font-label-caps text-[11px] text-[#e6bdb8] block mb-1">ORGANIZERS</span>
          <span className="font-headline-xl text-[36px] text-[#ffb4ab] font-bold">
            {users.filter((u) => u.role === 'ORGANIZER').length}
          </span>
        </div>
        <div className="bg-[#201f1f] p-6 rounded-2xl border border-[#353534]">
          <span className="font-label-caps text-[11px] text-[#e6bdb8] flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-pulse" /> SUSPENDED
          </span>
          <span className="font-headline-xl text-[36px] text-[#e5e2e1] font-bold">
            {users.filter((u) => u.status === 'SUSPENDED').length}
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-[#201f1f] p-3 rounded-2xl border border-[#353534]">
        <div className="w-full md:w-96 flex items-center bg-[#131313] px-4 py-3 rounded-xl border border-[#353534]">
          <span className="material-symbols-outlined text-[#e6bdb8] mr-3 text-[20px]">search</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="QUERY: NAME | EMAIL..."
            className="bg-transparent text-[#e5e2e1] font-data-mono text-[13px] w-full outline-none"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {(['ALL', 'ADMIN', 'ORGANIZER', 'USER'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl font-label-caps text-[11px] font-bold transition-colors whitespace-nowrap ${
                roleFilter === r
                  ? 'bg-[#ffb4ab] text-[#690005]'
                  : 'bg-[#131313] text-[#e6bdb8] hover:text-white border border-[#353534]'
              }`}
            >
              ROLE: {r}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-[#201f1f] rounded-2xl border border-[#353534] overflow-hidden shadow-xl">
        <div className="hidden lg:grid grid-cols-[48px_minmax(250px,1fr)_130px_100px_100px_120px_80px] gap-4 px-6 py-4 bg-[#1c1b1b] items-center">
          <div />
          <span className="font-label-caps text-[11px] text-[#e6bdb8]">USER IDENTIFIER</span>
          <span className="font-label-caps text-[11px] text-[#e6bdb8]">SYSTEM ROLE</span>
          <span className="font-label-caps text-[11px] text-[#e6bdb8] text-right">CREATED</span>
          <span className="font-label-caps text-[11px] text-[#e6bdb8] text-right">JOINED</span>
          <span className="font-label-caps text-[11px] text-[#e6bdb8]">STATUS</span>
          <span className="font-label-caps text-[11px] text-[#e6bdb8] text-right">ACTION</span>
        </div>

        <div className="divide-y divide-[#353534]">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-[48px_1fr_auto] lg:grid-cols-[48px_minmax(250px,1fr)_130px_100px_100px_120px_80px] gap-4 px-6 py-4 hover:bg-[#2a2a2a]/40 transition-colors items-center"
            >
              <div className="w-10 h-10 rounded-full bg-[#353534] flex items-center justify-center text-[11px] font-bold text-white">
                {u.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`font-semibold truncate ${u.status === 'SUSPENDED' ? 'text-[#e6bdb8]' : 'text-white'}`}>
                  {u.name}
                </span>
                <span className="font-data-mono text-[11px] text-[#e6bdb8] truncate opacity-70">{u.email}</span>
              </div>
              <div className="hidden lg:flex">
                <span
                  className={`font-label-caps text-[10px] px-2 py-1 rounded font-bold ${
                    u.role === 'ADMIN'
                      ? 'bg-[#690005] text-[#ffdad6] border border-[#ffb4ab]/30'
                      : u.role === 'ORGANIZER'
                      ? 'bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/30'
                      : 'bg-[#353534] text-[#e5e2e1]'
                  }`}
                >
                  {u.role}
                </span>
              </div>
              <div className="hidden lg:block text-right font-data-mono text-[12px] text-[#e5e2e1]">
                {u.eventsCreated || '--'}
              </div>
              <div className="hidden lg:block text-right font-data-mono text-[12px] text-[#e5e2e1]">
                {u.eventsJoined || '--'}
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${u.status === 'ACTIVE' ? 'bg-[#ffb4ab]' : 'bg-[#353534]'}`}
                />
                <span className="font-label-caps text-[11px] text-[#e5e2e1]">{u.status}</span>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => toggleSuspend(u.id)}
                  className="p-2 rounded-full text-[#e6bdb8] hover:text-[#ffb4ab] hover:bg-[#131313] transition-colors"
                  title={u.status === 'ACTIVE' ? 'Suspend user' : 'Reactivate user'}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {u.status === 'ACTIVE' ? 'block' : 'restart_alt'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[#353534] bg-[#1c1b1b] text-center">
          <span className="font-data-mono text-[11px] text-[#e6bdb8]">
            Showing {filtered.length} of {users.length} users
          </span>
        </div>
      </div>
    </div>
  );
};