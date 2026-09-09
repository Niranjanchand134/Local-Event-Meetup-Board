import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../lib/adminApi';
import type { AdminPaymentOut } from '../../types';

export const AdminPaymentsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'initiated' | 'failed'>('all');
  const [gatewayFilter, setGatewayFilter] = useState<'all' | 'esewa' | 'khalti'>('all');

  const {
    data: payments = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<AdminPaymentOut[]>({
    queryKey: ['admin-payments'],
    queryFn: () => adminApi.getAllPayments(),
    refetchInterval: 15_000,
  });

  // Calculate Metrics
  const metrics = useMemo(() => {
    const totalTransactions = payments.length;
    const verifiedPayments = payments.filter((p) => p.payment_status === 'verified');
    const totalRevenue = verifiedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    const initiatedCount = payments.filter((p) => p.payment_status === 'initiated').length;
    const failedCount = payments.filter((p) => p.payment_status === 'failed').length;
    const esewaRevenue = verifiedPayments.filter((p) => p.gateway === 'esewa').reduce((sum, p) => sum + Number(p.amount), 0);
    const khaltiRevenue = verifiedPayments.filter((p) => p.gateway === 'khalti').reduce((sum, p) => sum + Number(p.amount), 0);
    return { totalTransactions, totalRevenue, verifiedCount: verifiedPayments.length, initiatedCount, failedCount, esewaRevenue, khaltiRevenue };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        p.user_name.toLowerCase().includes(q) ||
        p.user_email.toLowerCase().includes(q) ||
        p.event_title.toLowerCase().includes(q) ||
        p.merchant_transaction_id.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || p.payment_status === statusFilter;
      const matchesGateway = gatewayFilter === 'all' || p.gateway === gatewayFilter;
      return matchesSearch && matchesStatus && matchesGateway;
    });
  }, [payments, searchTerm, statusFilter, gatewayFilter]);

  const paymentStatusBadge = (status: string) => {
    if (status === 'verified') return 'bg-[#1b4332] text-[#74c69d] border-[#2d6a4f]';
    if (status === 'initiated') return 'bg-[#4a3b00] text-[#ffd166] border-[#705500]';
    return 'bg-[#3b1219] text-[#ffb4ab] border-[#690005]';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="font-headline-lg text-[22px] sm:text-[26px] font-bold text-[#e5e2e1]">
              Payments &amp; Transactions
            </h1>
            <span className="flex items-center gap-1 px-2 py-0.5 bg-[#201f1f] border border-[#353534] rounded-full text-[10px] font-data-mono text-[#ffb4ab]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#60d394] animate-pulse" />
              Live
            </span>
          </div>
          <p className="font-body-md text-[13px] text-[#c6c6c7]">
            Monitor ticket transactions, gateway verification, and revenue.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="self-start sm:self-auto px-4 py-2 bg-[#201f1f] hover:bg-[#2a2a2a] text-[#ffb4ab] border border-[#5c403c] rounded-xl font-label-caps text-[11px] font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[16px] ${isRefetching ? 'animate-spin' : ''}`}>refresh</span>
          Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-caps text-[10px] text-[#ac8884] font-bold uppercase">Revenue</span>
            <span className="material-symbols-outlined text-[#60d394] text-[18px]">account_balance_wallet</span>
          </div>
          <div className="font-data-mono text-[20px] sm:text-[24px] font-bold text-[#e5e2e1]">
            NPR {metrics.totalRevenue.toLocaleString()}
          </div>
          <div className="flex flex-wrap gap-x-2 mt-1 text-[10px] font-data-mono text-[#c6c6c7]">
            <span className="text-[#60d394]">eSewa {metrics.esewaRevenue.toLocaleString()}</span>
            <span className="text-[#b388ff]">Khalti {metrics.khaltiRevenue.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-caps text-[10px] text-[#ac8884] font-bold uppercase">Verified</span>
            <span className="material-symbols-outlined text-[#60d394] text-[18px]">check_circle</span>
          </div>
          <div className="font-data-mono text-[24px] font-bold text-[#60d394]">{metrics.verifiedCount}</div>
          <p className="text-[10px] font-data-mono text-[#c6c6c7] mt-1">Successful RSVPs</p>
        </div>

        <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-caps text-[10px] text-[#ac8884] font-bold uppercase">Pending</span>
            <span className="material-symbols-outlined text-[#ffd166] text-[18px]">pending</span>
          </div>
          <div className="font-data-mono text-[24px] font-bold text-[#ffd166]">{metrics.initiatedCount}</div>
          <p className="text-[10px] font-data-mono text-[#c6c6c7] mt-1">Awaiting callback</p>
        </div>

        <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-caps text-[10px] text-[#ac8884] font-bold uppercase">Failed</span>
            <span className="material-symbols-outlined text-[#ffb4ab] text-[18px]">cancel</span>
          </div>
          <div className="font-data-mono text-[24px] font-bold text-[#ffb4ab]">{metrics.failedCount}</div>
          <p className="text-[10px] font-data-mono text-[#c6c6c7] mt-1">Cancelled / failed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-3 sm:p-4 mb-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#ac8884] text-[17px]">search</span>
          <input
            type="text"
            placeholder="Search attendee, event, or transaction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl pl-9 pr-4 py-2 text-[12px] text-[#e5e2e1] font-data-mono placeholder-[#777] outline-none transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center bg-[#131313] p-1 rounded-xl border border-[#353534]">
            {(['all', 'verified', 'initiated', 'failed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-label-caps font-bold uppercase transition-all ${
                  statusFilter === st ? 'bg-[#ffb4ab] text-[#690005]' : 'text-[#c6c6c7] hover:text-[#e5e2e1]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-[#131313] p-1 rounded-xl border border-[#353534]">
            {(['all', 'esewa', 'khalti'] as const).map((gw) => (
              <button
                key={gw}
                onClick={() => setGatewayFilter(gw)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-label-caps font-bold uppercase transition-all ${
                  gatewayFilter === gw ? 'bg-[#ffb4ab] text-[#690005]' : 'text-[#c6c6c7] hover:text-[#e5e2e1]'
                }`}
              >
                {gw}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Count */}
      <div className="text-[12px] font-data-mono text-[#ac8884] mb-3">
        {filteredPayments.length} transaction{filteredPayments.length !== 1 ? 's' : ''} found
      </div>

      {/* Transactions — Desktop table / Mobile cards */}
      {isLoading ? (
        <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-12 text-center text-[#c6c6c7] font-data-mono text-[13px] flex items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin text-[20px] text-[#ffb4ab]">progress_activity</span>
          Loading payment records...
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-12 text-center text-[#c6c6c7] font-data-mono text-[13px]">
          No payment transactions match the selected criteria.
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-[#201f1f] border border-[#353534] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#353534] bg-[#1a1a1a] text-[#ac8884] font-label-caps text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Event</th>
                    <th className="py-3 px-4 font-bold">Attendee</th>
                    <th className="py-3 px-4 font-bold">Amount</th>
                    <th className="py-3 px-4 font-bold">Gateway</th>
                    <th className="py-3 px-4 font-bold">Payment</th>
                    <th className="py-3 px-4 font-bold">RSVP</th>
                    <th className="py-3 px-4 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#353534]/50 text-[12px] font-data-mono text-[#e5e2e1]">
                  {filteredPayments.map((p) => (
                    <tr key={p.payment_id} className="hover:bg-[#262525] transition-colors">
                      <td className="py-3.5 px-4 max-w-[180px]">
                        <div className="truncate font-sans font-semibold text-[13px] text-[#e5e2e1]">{p.event_title}</div>
                        <div className="text-[10px] text-[#ac8884]">ID: {p.event_id.slice(0, 8)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-sans font-medium text-[12px] text-[#e5e2e1]">{p.user_name}</div>
                        <div className="text-[10px] text-[#c6c6c7] truncate max-w-[150px]">{p.user_email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#ffb4ab] whitespace-nowrap">
                        NPR {Number(p.amount).toLocaleString()}
                        {(p.quantity ?? 1) > 1 && <span className="text-[10px] text-[#ac8884] ml-1">×{p.quantity}</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-label-caps font-bold uppercase inline-flex items-center gap-1 ${
                          p.gateway === 'esewa' ? 'bg-[#103b22] text-[#60d394] border border-[#1e6f42]' : 'bg-[#2b194d] text-[#b388ff] border border-[#512da8]'
                        }`}>
                          <span className="material-symbols-outlined text-[11px]">payments</span>
                          {p.gateway.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-label-caps font-bold uppercase border ${paymentStatusBadge(p.payment_status)}`}>
                          {p.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-label-caps font-bold uppercase ${
                          p.rsvp_status === 'confirmed' ? 'text-[#74c69d]' : p.rsvp_status === 'pending_payment' ? 'text-[#ffd166]' : 'text-[#ffb4ab]'
                        }`}>
                          {p.rsvp_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[10px] text-[#ac8884] whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString()}<br />
                        <span className="text-[9px]">{new Date(p.created_at).toLocaleTimeString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile / Tablet Cards */}
          <div className="lg:hidden space-y-3">
            {filteredPayments.map((p) => (
              <div key={p.payment_id} className="bg-[#201f1f] border border-[#353534] rounded-2xl p-4">
                {/* Top row: event + amount */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-sans font-semibold text-[14px] text-[#e5e2e1] truncate">{p.event_title}</p>
                    <p className="text-[11px] text-[#c6c6c7] mt-0.5">{p.user_name} · {p.user_email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-data-mono font-bold text-[15px] text-[#ffb4ab]">NPR {Number(p.amount).toLocaleString()}</p>
                    {(p.quantity ?? 1) > 1 && <p className="text-[10px] text-[#ac8884]">{p.quantity} tickets</p>}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-label-caps font-bold uppercase inline-flex items-center gap-1 ${
                    p.gateway === 'esewa' ? 'bg-[#103b22] text-[#60d394] border border-[#1e6f42]' : 'bg-[#2b194d] text-[#b388ff] border border-[#512da8]'
                  }`}>
                    <span className="material-symbols-outlined text-[11px]">payments</span>
                    {p.gateway.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-label-caps font-bold uppercase border ${paymentStatusBadge(p.payment_status)}`}>
                    {p.payment_status}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-label-caps font-bold uppercase bg-[#1a1a1a] border border-[#353534] ${
                    p.rsvp_status === 'confirmed' ? 'text-[#74c69d]' : p.rsvp_status === 'pending_payment' ? 'text-[#ffd166]' : 'text-[#ffb4ab]'
                  }`}>
                    RSVP: {p.rsvp_status.replace('_', ' ')}
                  </span>
                </div>

                {/* Footer: transaction ID + date */}
                <div className="flex items-center justify-between text-[10px] font-data-mono text-[#ac8884] pt-2 border-t border-[#353534]/50">
                  <span className="truncate max-w-[55%]" title={p.merchant_transaction_id}>
                    TXN: {p.merchant_transaction_id.slice(0, 16)}…
                  </span>
                  <span>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
