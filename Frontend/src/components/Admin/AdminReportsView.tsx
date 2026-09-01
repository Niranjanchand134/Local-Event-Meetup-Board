import React, { useState } from 'react';
import type { ScreenType, ReportItem } from '../../types/eventboard';
import { adminReportsData } from '../../data/mockData';

interface AdminReportsViewProps {
  onNavigate: (screen: ScreenType) => void;
}

export const AdminReportsView: React.FC<AdminReportsViewProps> = ({ onNavigate }) => {
  const [reports, setReports] = useState<ReportItem[]>(adminReportsData);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(adminReportsData[0]);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const filteredReports = reports.filter((rpt) => {
    const matchesFilter =
      filterType === 'ALL' ||
      (filterType === 'DISMISSED' && rpt.status === 'DISMISSED') ||
      (filterType === 'EVENTS' && rpt.type === 'event' && rpt.status !== 'DISMISSED') ||
      (filterType === 'USERS' && rpt.type === 'user' && rpt.status !== 'DISMISSED');

    const matchesSearch =
      rpt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rpt.reportedItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rpt.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rpt.reporter.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleResolve = (status: 'OPEN' | 'REVIEWING' | 'DISMISSED') => {
    if (!selectedReport) return;
    const updated = reports.map((r) =>
      r.id === selectedReport.id ? { ...r, status } : r
    );
    setReports(updated);
    setSelectedReport({ ...selectedReport, status });
    setActionSuccessMessage(`Report ${selectedReport.id} marked as "${status}"!`);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  return (
    <div className="flex flex-col w-full px-6 py-8 gap-6 max-w-[1400px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold tracking-widest">
              ADMINISTRATION // MODERATION
            </span>
            <span className="bg-[#93000a] text-[#ffdad6] font-label-caps text-[10px] px-2 py-0.5 rounded font-bold">
              {reports.filter(r => r.status === 'OPEN' || r.status === 'REVIEWING').length} ACTIVE
            </span>
          </div>
          <h1 className="font-headline-xl text-[32px] md:text-[40px] text-[#e5e2e1] font-bold mt-1">
            Reports &amp; Moderation Queue
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('admin')}
            className="px-4 py-2 bg-[#201f1f] hover:bg-[#2a2a2a] text-[#e5e2e1] font-label-caps text-[12px] rounded-xl border border-[#353534] transition-colors flex items-center gap-2 font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            BACK TO OVERVIEW
          </button>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="bg-[#201f1f] border border-[#ffb4ab] text-[#ffb4ab] px-4 py-3 rounded-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span className="font-data-mono text-[13px]">{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-[#e6bdb8] hover:text-white">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Main Split: Reports Table & Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Queue Table */}
        <div className="lg:col-span-7 xl:col-span-8 bg-[#201f1f] border border-[#353534] rounded-2xl overflow-hidden shadow-xl flex flex-col">
          {/* Controls Bar */}
          <div className="p-4 bg-[#1c1b1b] border-b border-[#353534] flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              {['ALL', 'EVENTS', 'USERS', 'DISMISSED'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterType(tab)}
                  className={`font-label-caps text-[11px] px-3 py-1.5 rounded-lg font-bold transition-colors ${
                    filterType === tab
                      ? 'bg-[#ffb4ab] text-[#690005]'
                      : 'bg-[#2a2a2a] text-[#e6bdb8] hover:text-white hover:bg-[#353534]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#e6bdb8] text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reports..."
                className="w-full bg-[#131313] text-[#e5e2e1] font-data-mono text-[12px] pl-9 pr-3 py-1.5 rounded-lg border border-[#353534] focus:border-[#ffb4ab] outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#353534] bg-[#0e0e0e]/50 text-[#e6bdb8] font-label-caps text-[11px] uppercase">
                  <th className="p-3.5 font-bold">ID</th>
                  <th className="p-3.5 font-bold">Target</th>
                  <th className="p-3.5 font-bold">Reason</th>
                  <th className="p-3.5 font-bold">Reported By</th>
                  <th className="p-3.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#353534] text-[13px]">
                {filteredReports.map((report) => {
                  const isSelected = selectedReport?.id === report.id;
                  return (
                    <tr
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#ffb4ab]/15 border-l-4 border-[#ffb4ab]'
                          : 'hover:bg-[#2a2a2a]/60'
                      }`}
                    >
                      <td className="p-3.5 font-data-mono text-[12px] text-[#ffb4ab] font-bold">
                        {report.id}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-white truncate max-w-[180px]">
                          {report.reportedItem.title}
                        </div>
                        <span className="text-[10px] font-label-caps uppercase text-[#e6bdb8]">
                          {report.type}
                        </span>
                      </td>
                      <td className="p-3.5 text-[#e6bdb8]">
                        <span className="line-clamp-1">{report.reason}</span>
                      </td>
                      <td className="p-3.5 font-data-mono text-[12px] text-[#e6bdb8]">
                        {report.reporter.name}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-label-caps font-bold ${
                            report.status === 'OPEN'
                              ? 'bg-[#93000a] text-[#ffdad6]'
                              : report.status === 'REVIEWING'
                              ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                              : 'bg-[#353534] text-[#c6c6c7]'
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#1c1b1b] border-t border-[#353534] text-center">
            <span className="font-data-mono text-[11px] text-[#e6bdb8]">
              {filteredReports.length} reports listed
            </span>
          </div>
        </div>

        {/* Right: Inspector Drawer */}
        <div className="lg:col-span-5 xl:col-span-4 bg-[#201f1f] border border-[#353534] rounded-2xl p-6 shadow-xl flex flex-col gap-6 sticky top-24">
          {selectedReport ? (
            <>
              <div className="flex items-center justify-between border-b border-[#353534] pb-4">
                <div>
                  <span className="font-data-mono text-[12px] text-[#ffb4ab] font-bold">
                    {selectedReport.id}
                  </span>
                  <h3 className="font-headline-md text-[18px] text-[#e5e2e1] font-bold mt-0.5">
                    Report Details
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-1 rounded text-[11px] font-label-caps font-bold ${
                    selectedReport.status === 'OPEN'
                      ? 'bg-[#93000a] text-[#ffdad6]'
                      : selectedReport.status === 'REVIEWING'
                      ? 'bg-[#ffb4ab]/20 text-[#ffb4ab]'
                      : 'bg-[#353534] text-[#c6c6c7]'
                  }`}
                >
                  {selectedReport.status}
                </span>
              </div>

              {/* Target Details */}
              <div className="space-y-4">
                <div className="bg-[#131313] p-4 rounded-xl border border-[#353534]">
                  <span className="font-label-caps text-[10px] text-[#e6bdb8] uppercase font-bold block mb-1">
                    REPORTED TARGET ({selectedReport.type.toUpperCase()})
                  </span>
                  <p className="font-headline-md text-[16px] text-white font-bold">
                    {selectedReport.reportedItem.title}
                  </p>
                  <p className="text-[12px] text-[#e6bdb8] font-data-mono mt-1">
                    Path: {selectedReport.reportedItem.path}
                  </p>
                  {selectedReport.reportedItem.location && (
                    <p className="text-[12px] text-[#e6bdb8] font-data-mono mt-0.5">
                      Location: {selectedReport.reportedItem.location}
                    </p>
                  )}
                </div>

                <div className="bg-[#131313] p-4 rounded-xl border border-[#353534]">
                  <span className="font-label-caps text-[10px] text-[#e6bdb8] uppercase font-bold block mb-1">
                    PRIMARY REASON / FLAG
                  </span>
                  <p className="font-body-md text-[14px] text-[#ffb4ab] font-semibold">
                    {selectedReport.reason}
                  </p>
                  <p className="font-body-md text-[13px] text-[#e6bdb8] mt-2 leading-relaxed">
                    {selectedReport.reasonDetail || selectedReport.notes || 'Reporter submitted moderation alert.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 font-data-mono text-[12px] text-[#e6bdb8]">
                  <div className="bg-[#131313] p-3 rounded-lg border border-[#353534]">
                    <span className="text-[10px] text-[#e6bdb8] block font-label-caps">REPORTED BY</span>
                    <span className="text-white font-bold">{selectedReport.reporter.name}</span>
                  </div>
                  <div className="bg-[#131313] p-3 rounded-lg border border-[#353534]">
                    <span className="text-[10px] text-[#e6bdb8] block font-label-caps">TIMESTAMP</span>
                    <span className="text-white font-bold">{selectedReport.reporter.timeAgo}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#353534] flex flex-col gap-2.5">
                <button
                  onClick={() => handleResolve('DISMISSED')}
                  className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-[#fff6f5] font-label-caps text-[12px] py-3 rounded-xl transition-all font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">gavel</span>
                  TAKE ACTION &amp; BAN TARGET
                </button>

                <button
                  onClick={() => handleResolve('REVIEWING')}
                  className="w-full bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] font-label-caps text-[12px] py-3 rounded-xl transition-all font-bold flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  MARK AS UNDER REVIEW
                </button>

                <button
                  onClick={() => handleResolve('DISMISSED')}
                  className="w-full bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] font-label-caps text-[12px] py-3 rounded-xl transition-all font-bold flex items-center justify-center gap-2 border border-[#353534]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                  DISMISS AS FALSE POSITIVE
                </button>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-[#e6bdb8]">
              <span className="material-symbols-outlined text-[36px] mb-2 text-[#353534]">
                touch_app
              </span>
              <p className="font-body-md text-[14px]">
                Select a report from the queue to view full audit logs and execute moderation actions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
