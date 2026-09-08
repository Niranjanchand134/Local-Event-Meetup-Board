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
    const totalRevenue = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);
    const initiatedCount = payments.filter((p) => p.payment_status === 'initiated').length;
    const failedCount = payments.filter((p) => p.payment_status === 'failed').length;

    const esewaRevenue = verifiedPayments
      .filter((p) => p.gateway === 'esewa')
      .reduce((sum, p) => sum + p.amount, 0);
    const khaltiRevenue = verifiedPayments
      .filter((p) => p.gateway === 'khalti')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalTransactions,
      totalRevenue,
      verifiedCount: verifiedPayments.length,
      initiatedCount,
      failedCount,
      esewaRevenue,
      khaltiRevenue,
    };
  }, [payments]);

  // Filtered List
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        p.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.event_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.transaction_uuid.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || p.payment_status === statusFilter;

      const matchesGateway =
        gatewayFilter === 'all' || p.gateway === gatewayFilter;

      return matchesSearch && matchesStatus && matchesGateway;
    });
  }, [payments, searchTerm, statusFilter, gatewayFilter]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-headline-lg text-[28px] font-bold text-[#e5e2e1]">
              Payments &amp; Transactions
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#201f1f] border border-[#353534] rounded-full text-[11px] font-data-mono text-[#ffb4ab]">
              <span className="w-2 h-2 rounded-full bg-[#60d394] animate-pulse"></span>
              Live (15s)
            </span>
          </div>
          <p className="font-body-md text-[14px] text-[#c6c6c7] mt-1">
            Monitor real-time event ticket transactions, payment gateway verification, and platform revenue.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="self-start md:self-auto px-4 py-2 bg-[#201f1f] hover:bg-[#2a2a2a] text-[#ffb4ab] border border-[#5c403c] rounded-xl font-label-caps text-[12px] font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[16px] ${isRefetching ? 'animate-spin' : ''}`}>
            refresh
          </span>
          Refresh
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Revenue */}
        <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[11px] text-[#ac8884] font-bold uppercase tracking-wider">
              Total Verified Revenue
            </span>
            <span className="material-symbols-outlined text-[#60d394] text-[20px]">
              account_balance_wallet
            </span>
          </div>
          <div className="font-data-mono text-[26px] font-bold text-[#e5e2e1] mt-2">
            NPR {metrics.totalRevenue.toLocaleString()}
          </div>
          <div className="flex items-center gap-3 mt-2 text-[11px] font-data-mono text-[#c6c6c7]">
            <span className="text-[#60d394]">eSewa: NPR {metrics.esewaRevenue.toLocaleString()}</span>
            <span>•</span>
            <span className="text-[#b388ff]">Khalti: NPR {metrics.khaltiRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Verified Count */}
        <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[11px] text-[#ac8884] font-bold uppercase tracking-wider">
              Verified Success
            </span>
            <span className="material-symbols-outlined text-[#60d394] text-[20px]">
              check_circle
            </span>
          </div>
          <div className="font-data-mono text-[26px] font-bold text-[#60d394] mt-2">
            {metrics.verifiedCount}
          </div>
          <p className="text-[11px] font-data-mono text-[#c6c6c7] mt-2">
            Successful RSVPs confirmed
          </p>
        </div>

        {/* Initiated / Pending */}
        <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[11px] text-[#ac8884] font-bold uppercase tracking-wider">
              Initiated / Pending
            </span>
            <span className="material-symbols-outlined text-[#ffd166] text-[20px]">
              pending
            </span>
          </div>
          <div className="font-data-mono text-[26px] font-bold text-[#ffd166] mt-2">
            {metrics.initiatedCount}
          </div>
          <p className="text-[11px] font-data-mono text-[#c6c6c7] mt-2">
            Awaiting gateway callback
          </p>
        </div>

        {/* Failed Transactions */}
        <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-[11px] text-[#ac8884] font-bold uppercase tracking-wider">
              Failed Attempts
            </span>
            <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">
              cancel
            </span>
          </div>
          <div className="font-data-mono text-[26px] font-bold text-[#ffb4ab] mt-2">
            {metrics.failedCount}
          </div>
          <p className="text-[11px] font-data-mono text-[#c6c6c7] mt-2">
            Cancelled or failed transactions
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-[#201f1f] border border-[#353534] rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#ac8884] text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search attendee, event, or UUID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl pl-9 pr-4 py-2 text-[13px] text-[#e5e2e1] font-data-mono placeholder-[#777] outline-none transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center bg-[#131313] p-1 rounded-xl border border-[#353534]">
            {(['all', 'verified', 'initiated', 'failed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-[11px] font-label-caps font-bold uppercase transition-all ${
                  statusFilter === st
                    ? 'bg-[#ffb4ab] text-[#690005]'
                    : 'text-[#c6c6c7] hover:text-[#e5e2e1]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Gateway Filter */}
          <div className="flex items-center bg-[#131313] p-1 rounded-xl border border-[#353534]">
            {(['all', 'esewa', 'khalti'] as const).map((gw) => (
              <button
                key={gw}
                onClick={() => setGatewayFilter(gw)}
                className={`px-3 py-1 rounded-lg text-[11px] font-label-caps font-bold uppercase transition-all ${
                  gatewayFilter === gw
                    ? 'bg-[#ffb4ab] text-[#690005]'
                    : 'text-[#c6c6c7] hover:text-[#e5e2e1]'
                }`}
              >
                {gw}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#201f1f] border border-[#353534] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-[#c6c6c7] font-data-mono text-[13px] flex items-center justify-center gap-2">
            <span className="material-symbols-outlined animate-spin text-[20px] text-[#ffb4ab]">
              progress_activity
            </span>
            Loading payment records...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-[#c6c6c7] font-data-mono text-[13px]">
            No payment transactions match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#353534] bg-[#1a1a1a] text-[#ac8884] font-label-caps text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-bold">Event &amp; Date</th>
                  <th className="py-3.5 px-4 font-bold">Attendee</th>
                  <th className="py-3.5 px-4 font-bold">Amount</th>
                  <th className="py-3.5 px-4 font-bold">Gateway</th>
                  <th className="py-3.5 px-4 font-bold">Payment Status</th>
                  <th className="py-3.5 px-4 font-bold">RSVP Status</th>
                  <th className="py-3.5 px-4 font-bold">Transaction UUID</th>
                  <th className="py-3.5 px-4 font-bold">Initiated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#353534]/50 text-[13px] font-data-mono text-[#e5e2e1]">
                {filteredPayments.map((p) => {
                  const isVerified = p.payment_status === 'verified';
                  const isInitiated = p.payment_status === 'initiated';
                  const isFailed = p.payment_status === 'failed';

                  return (
                    <tr key={p.id} className="hover:bg-[#262525] transition-colors">
                      <td className="py-4 px-4 font-medium text-[#e5e2e1] max-w-[200px]">
                        <div className="truncate font-sans font-semibold text-[14px]">
                          {p.event_title}
                        </div>
                        <div className="text-[11px] text-[#ac8884] truncate">
                          ID: {p.event_id.slice(0, 8)}...
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-sans font-medium text-[13px] text-[#e5e2e1]">
                          {p.user_name}
                        </div>
                        <div className="text-[11px] text-[#c6c6c7] truncate max-w-[160px]">
                          {p.user_email}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-bold text-[#ffb4ab]">
                        NPR {p.amount.toLocaleString()}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-label-caps font-bold uppercase inline-flex items-center gap-1 ${
                            p.gateway === 'esewa'
                              ? 'bg-[#103b22] text-[#60d394] border border-[#1e6f42]'
                              : 'bg-[#2b194d] text-[#b388ff] border border-[#512da8]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">payments</span>
                          {p.gateway.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-label-caps font-bold uppercase border ${
                            isVerified
                              ? 'bg-[#1b4332] text-[#74c69d] border-[#2d6a4f]'
                              : isInitiated
                              ? 'bg-[#4a3b00] text-[#ffd166] border-[#705500]'
                              : 'bg-[#3b1219] text-[#ffb4ab] border-[#690005]'
                          }`}
                        >
                          {p.payment_status}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-label-caps font-bold uppercase ${
                            p.rsvp_status === 'confirmed'
                              ? 'text-[#74c69d]'
                              : p.rsvp_status === 'pending_payment'
                              ? 'text-[#ffd166]'
                              : 'text-[#ffb4ab]'
                          }`}
                        >
                          {p.rsvp_status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-[11px] text-[#c6c6c7] max-w-[140px] truncate" title={p.transaction_uuid}>
                        {p.transaction_uuid}
                      </td>

                      <td className="py-4 px-4 text-[11px] text-[#ac8884] whitespace-nowrap">
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
