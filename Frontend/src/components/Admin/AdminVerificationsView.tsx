import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import type { VerificationAdminOut, VerificationStats } from '../../types';
import type { ScreenType } from '../../types/eventboard';

interface AdminVerificationsViewProps {
  onNavigate: (screen: ScreenType) => void;
}

const DOC_TYPE_INFO: Record<string, { label: string; icon: string; badgeColor: string }> = {
  citizenship: {
    label: 'Citizenship',
    icon: 'badge',
    badgeColor: 'bg-[#3b82f6]/10 text-[#60a5fa] border-[#3b82f6]/30',
  },
  passport: {
    label: 'Passport',
    icon: 'menu_book',
    badgeColor: 'bg-[#a855f7]/10 text-[#c084fc] border-[#a855f7]/30',
  },
  national_id: {
    label: 'National ID',
    icon: 'fingerprint',
    badgeColor: 'bg-[#14b8a6]/10 text-[#2dd4bf] border-[#14b8a6]/30',
  },
};

export const AdminVerificationsView: React.FC<AdminVerificationsViewProps> = ({ onNavigate }) => {
  const [applications, setApplications] = useState<VerificationAdminOut[]>([]);
  const [stats, setStats] = useState<VerificationStats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<VerificationAdminOut | null>(null);
  const [adminNote, setAdminNote] = useState('');

  // Document preview
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocMeta, setPreviewDocMeta] = useState<{ name: string; type: string } | null>(null);
  const [fetchingDocId, setFetchingDocId] = useState<string | null>(null);

  const fetchVerificationsData = useCallback(async (tab = activeTab, search = searchQuery) => {
    setLoading(true);
    setFeedback(null);
    try {
      const statsRes = await api.get<VerificationStats>('/verifications/admin/stats');
      setStats(statsRes.data);

      const params: Record<string, string> = {};
      if (tab !== 'all') {
        params.status = tab;
      }
      if (search.trim()) {
        params.search = search.trim();
      }

      const listRes = await api.get<VerificationAdminOut[]>('/verifications/admin/all', { params });
      setApplications(listRes.data);
    } catch (err: any) {
      console.error('Failed to load verification data:', err);
      setFeedback({ type: 'error', message: 'Failed to load verifications. Check backend connection.' });
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchVerificationsData(activeTab, searchQuery);
  }, [activeTab, fetchVerificationsData, searchQuery]);

  const handleCopyDocNumber = (docNumber: string, id: string) => {
    navigator.clipboard.writeText(docNumber);
    setCopiedDocId(id);
    setTimeout(() => setCopiedDocId(null), 2000);
  };

  const handleApprove = async (app: VerificationAdminOut) => {
    if (!confirm(`Approve ${app.full_legal_name}?\nThis grants host publishing permissions immediately.`)) return;
    setActionLoading(app.id);
    setFeedback(null);
    try {
      await api.post(`/verifications/admin/${app.id}/review`, {
        decision: 'approved',
        admin_note: 'Identity verified and approved by Administrator.',
      });
      setFeedback({ type: 'success', message: `${app.full_legal_name} has been approved.` });
      await fetchVerificationsData(activeTab, searchQuery);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Approval failed. Please try again.' });
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (app: VerificationAdminOut) => {
    setSelectedApp(app);
    setAdminNote('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedApp) return;
    setActionLoading(selectedApp.id);
    setFeedback(null);
    try {
      await api.post(`/verifications/admin/${selectedApp.id}/review`, {
        decision: 'rejected',
        admin_note: adminNote.trim() || 'Identity verification requirements not met. Please resubmit with a clear, valid document.',
      });
      setFeedback({ type: 'success', message: `${selectedApp.full_legal_name}'s application rejected with feedback.` });
      setRejectModalOpen(false);
      setSelectedApp(null);
      await fetchVerificationsData(activeTab, searchQuery);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.response?.data?.detail || 'Rejection failed. Please try again.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDocument = async (app: VerificationAdminOut) => {
    setFetchingDocId(app.id);
    setPreviewDocMeta({ name: app.full_legal_name, type: app.document_type });
    try {
      const res = await api.get(`/verifications/admin/${app.id}/document`, { responseType: 'blob' } as any);
      const fileType = (res.headers['content-type'] as string) || 'application/pdf';
      const blob = new Blob([res.data], { type: fileType });
      setPreviewDocUrl(URL.createObjectURL(blob));
    } catch {
      setFeedback({ type: 'error', message: 'Could not load ID document. File may be missing or corrupt.' });
    } finally {
      setFetchingDocId(null);
    }
  };

  const closeDocPreview = () => {
    if (previewDocUrl) URL.revokeObjectURL(previewDocUrl);
    setPreviewDocUrl(null);
    setPreviewDocMeta(null);
  };

  return (
    <div className="w-full min-h-screen bg-[#131313] p-5 lg:p-7 flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="font-label-caps text-[10px] text-[#ffb4ab] uppercase tracking-widest font-bold mb-1">
            Administration · Trust &amp; Safety
          </p>
          <h1 className="text-[24px] lg:text-[30px] font-bold text-[#e5e2e1] leading-tight">
            Organizer Identity Verifications
          </h1>
          <p className="text-[12px] text-[#888] mt-1">
            Review government ID submissions and approve or reject organizer applications.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => fetchVerificationsData(activeTab, searchQuery)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#201f1f] hover:bg-[#2a2a2a] text-[#e5e2e1] text-[11px] font-label-caps font-bold uppercase rounded-xl border border-[#353534] transition-all disabled:opacity-50"
            title="Refresh Table and Counters"
          >
            <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Refresh
          </button>
          <button
            onClick={() => onNavigate('admin')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#201f1f] hover:bg-[#2a2a2a] text-[#e5e2e1] text-[11px] font-label-caps font-bold uppercase rounded-xl border border-[#353534] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Overview
          </button>
        </div>
      </div>

      {/* ── Persistent Stats Row (Stable on Refresh) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-2xl border text-left transition-all ${activeTab === 'pending'
              ? 'bg-[#201f1f] border-[#fbbf24] shadow-lg shadow-[#fbbf24]/5'
              : 'bg-[#1c1b1b] border-[#353534] hover:border-[#555]'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-caps text-[10px] text-[#fbbf24] uppercase font-bold tracking-wider">Pending Review</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] animate-pulse"></span>
          </div>
          <span className="text-[32px] font-bold text-white leading-none block">
            {stats.pending}
          </span>
          <span className="text-[11px] text-[#777] mt-1 block">Awaiting admin review</span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`p-4 rounded-2xl border text-left transition-all ${activeTab === 'approved'
              ? 'bg-[#201f1f] border-[#4ade80] shadow-lg shadow-[#4ade80]/5'
              : 'bg-[#1c1b1b] border-[#353534] hover:border-[#555]'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-caps text-[10px] text-[#4ade80] uppercase font-bold tracking-wider">Approved</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#4ade80]"></span>
          </div>
          <span className="text-[32px] font-bold text-[#4ade80] leading-none block">
            {stats.approved}
          </span>
          <span className="text-[11px] text-[#777] mt-1 block">Verified organizers</span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`p-4 rounded-2xl border text-left transition-all ${activeTab === 'rejected'
              ? 'bg-[#201f1f] border-[#f87171] shadow-lg shadow-[#f87171]/5'
              : 'bg-[#1c1b1b] border-[#353534] hover:border-[#555]'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-caps text-[10px] text-[#f87171] uppercase font-bold tracking-wider">Rejected</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#f87171]"></span>
          </div>
          <span className="text-[32px] font-bold text-[#f87171] leading-none block">
            {stats.rejected}
          </span>
          <span className="text-[11px] text-[#777] mt-1 block">Declined / Needs re-upload</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border text-left transition-all ${activeTab === 'all'
              ? 'bg-[#201f1f] border-[#ffb4ab] shadow-lg shadow-[#ffb4ab]/5'
              : 'bg-[#1c1b1b] border-[#353534] hover:border-[#555]'
            }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-caps text-[10px] text-[#ffb4ab] uppercase font-bold tracking-wider">All Records</span>
            <span className="material-symbols-outlined text-[16px] text-[#ffb4ab]">inventory_2</span>
          </div>
          <span className="text-[32px] font-bold text-white leading-none block">
            {stats.total}
          </span>
          <span className="text-[11px] text-[#777] mt-1 block">Total lifetime submissions</span>
        </button>
      </div>

      {/* ── Feedback Banner ── */}
      {feedback && (
        <div className={`flex items-start justify-between gap-3 px-4 py-3 rounded-xl border text-[13px] animate-in fade-in ${feedback.type === 'success'
            ? 'bg-[#0f2416] border-[#4ade80]/30 text-[#86efac]'
            : 'bg-[#240f0f] border-[#f87171]/30 text-[#fca5a5]'
          }`}>
          <div className="flex items-center gap-2.5">
            <span className={`material-symbols-outlined text-[18px] shrink-0 ${feedback.type === 'success' ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
              {feedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="shrink-0 opacity-50 hover:opacity-100">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* ── Table Panel ── */}
      <div className="bg-[#201f1f] border border-[#353534] rounded-2xl overflow-hidden flex-1 shadow-xl flex flex-col">

        {/* Panel Header with Filters & Search */}
        <div className="px-5 py-3.5 bg-[#1c1b1b] border-b border-[#353534] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#131313] rounded-xl border border-[#353534] self-start sm:self-auto overflow-x-auto">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-label-caps font-bold uppercase transition-all flex items-center gap-1.5 whitespace-nowrap ${activeTab === tab
                    ? 'bg-[#ffb4ab] text-[#690005] shadow-sm'
                    : 'text-[#888] hover:text-[#e5e2e1] hover:bg-[#201f1f]'
                  }`}
              >
                <span>{tab}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === tab
                    ? 'bg-[#690005]/20 text-[#690005]'
                    : 'bg-[#2a2a2a] text-[#777]'
                  }`}>
                  {tab === 'all' ? stats.total : stats[tab]}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[240px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#666]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, address..."
              className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl pl-9 pr-3 py-1.5 text-[12px] text-white outline-none placeholder:text-[#555]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777] hover:text-white"
              >
                <span className="material-symbols-outlined text-[14px]">cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Content States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="material-symbols-outlined animate-spin text-[36px] text-[#ffb4ab]">progress_activity</span>
            <span className="text-[12px] text-[#777] font-data-mono">Loading verifications…</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#2a2a2a] border border-[#353534] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[30px] text-[#ffb4ab]">
                {searchQuery ? 'search_off' : 'task_alt'}
              </span>
            </div>
            <h3 className="font-bold text-white text-[16px] mb-1">
              {searchQuery ? 'No matching records' : `No ${activeTab} applications`}
            </h3>
            <p className="text-[12px] text-[#777] max-w-xs">
              {searchQuery
                ? `No submissions found for "${searchQuery}". Try a different keyword.`
                : activeTab === 'pending'
                  ? 'All organizer applications have been reviewed.'
                  : `There are currently no ${activeTab} applications in the records.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full flex-1">
            <table className="w-full" style={{ minWidth: '760px' }}>
              <thead>
                <tr className="border-b border-[#2a2a2a] bg-[#1a1919]">
                  <th className="text-left px-4 py-3 font-label-caps text-[10px] text-[#666] uppercase w-10">#</th>
                  <th className="text-left px-4 py-3 font-label-caps text-[10px] text-[#666] uppercase">Applicant Details</th>
                  <th className="text-left px-4 py-3 font-label-caps text-[10px] text-[#666] uppercase">Document Info</th>
                  <th className="text-left px-4 py-3 font-label-caps text-[10px] text-[#666] uppercase">Status</th>
                  <th className="text-left px-4 py-3 font-label-caps text-[10px] text-[#666] uppercase">Submitted At</th>
                  <th className="text-right px-4 py-3 font-label-caps text-[10px] text-[#666] uppercase">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#262626]">
                {applications.map((app, idx) => {
                  const docInfo = DOC_TYPE_INFO[app.document_type] || {
                    label: app.document_type,
                    icon: 'badge',
                    badgeColor: 'bg-[#ffb4ab]/10 text-[#ffb4ab] border-[#ffb4ab]/30',
                  };

                  return (
                    <tr key={app.id} className="hover:bg-[#1c1b1b] transition-colors">

                      {/* Index */}
                      <td className="px-4 py-3.5 align-middle">
                        <span className="text-[11px] text-[#555] font-data-mono font-bold">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </td>

                      {/* Applicant Name & Address */}
                      <td className="px-4 py-3.5 align-middle max-w-[200px]">
                        <p className="text-[13px] text-white font-semibold leading-tight truncate">
                          {app.full_legal_name}
                        </p>
                        <p className="text-[11px] text-[#888] font-data-mono mt-0.5 truncate" title={app.address}>
                          {app.address}
                        </p>
                        <span className="text-[10px] text-[#555] font-data-mono">
                          DOB: {app.date_of_birth}
                        </span>
                      </td>

                      {/* Document Type & Number (Nepal formatting) */}
                      <td className="px-4 py-3.5 align-middle max-w-[220px]">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-md text-[10px] font-label-caps font-bold uppercase ${docInfo.badgeColor}`}>
                            <span className="material-symbols-outlined text-[13px]">{docInfo.icon}</span>
                            {docInfo.label}
                          </span>

                          {/* Improved Monospace Document Number with Copy */}
                          <div className="flex items-center gap-1.5 bg-[#131313] px-2 py-1 rounded-lg border border-[#353534] group">
                            <span
                              className="w-[130px] truncate text-[12px] text-[#ffdad6] font-data-mono font-semibold tracking-wider"
                              title={app.document_number}
                            >
                              {app.document_number}
                            </span>

                            <button
                              onClick={() => handleCopyDocNumber(app.document_number, app.id)}
                              title="Copy Document Number"
                              className="text-[#666] hover:text-[#ffb4ab] transition-colors shrink-0"
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                {copiedDocId === app.id ? 'check' : 'content_copy'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 align-middle">
                        {app.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps font-bold uppercase bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/30">
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            Approved
                          </span>
                        ) : app.status === 'rejected' ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps font-bold uppercase bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/30">
                              <span className="material-symbols-outlined text-[13px]">cancel</span>
                              Rejected
                            </span>
                            {app.admin_note && (
                              <span className="text-[10px] text-[#fca5a5] line-clamp-1 max-w-[140px]" title={app.admin_note}>
                                {app.admin_note}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-label-caps font-bold uppercase bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30">
                            <span className="material-symbols-outlined text-[13px] animate-spin">progress_activity</span>
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Submitted At */}
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <p className="text-[11px] text-[#bbb] font-data-mono">
                          {new Date(app.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-[#555] font-data-mono">
                          {new Date(app.submitted_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>

                      {/* Icon-only Actions */}
                      <td className="px-4 py-3.5 align-middle text-right">
                        <div className="inline-flex items-center gap-1.5">

                          {/* View Document Icon Button */}
                          <button
                            onClick={() => handleViewDocument(app)}
                            disabled={fetchingDocId === app.id}
                            title="View / Preview Document"
                            className="w-8 h-8 rounded-xl bg-[#131313] hover:bg-[#2a2a2a] border border-[#353534] text-[#ffb4ab] hover:border-[#ffb4ab]/40 flex items-center justify-center transition-all disabled:opacity-40"
                          >
                            {fetchingDocId === app.id ? (
                              <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                            ) : (
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                            )}
                          </button>

                          {/* Approve Icon Button */}
                          {app.status !== 'approved' && (
                            <button
                              onClick={() => handleApprove(app)}
                              disabled={actionLoading === app.id}
                              title="Approve Organizer Application"
                              className="w-8 h-8 rounded-xl bg-[#4ade80]/10 hover:bg-[#4ade80]/20 border border-[#4ade80]/30 hover:border-[#4ade80]/60 text-[#4ade80] flex items-center justify-center transition-all disabled:opacity-40"
                            >
                              {actionLoading === app.id ? (
                                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                              ) : (
                                <span className="material-symbols-outlined text-[16px]">check</span>
                              )}
                            </button>
                          )}

                          {/* Reject Icon Button */}
                          {app.status !== 'rejected' && (
                            <button
                              onClick={() => openRejectModal(app)}
                              disabled={actionLoading === app.id}
                              title="Reject Application"
                              className="w-8 h-8 rounded-xl bg-[#f87171]/10 hover:bg-[#f87171]/20 border border-[#f87171]/30 hover:border-[#f87171]/60 text-[#f87171] flex items-center justify-center transition-all disabled:opacity-40"
                            >
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════ Rejection Modal ═══════════ */}
      {rejectModalOpen && selectedApp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div onClick={() => setRejectModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative bg-[#1c1b1b] border border-[#353534] w-full max-w-md rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95">
            <div className="px-5 pt-5 pb-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#f87171]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#f87171] text-[18px]">do_not_disturb</span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-[14px]">Reject Application</h3>
                  <p className="text-[11px] text-[#777] font-data-mono">{selectedApp.full_legal_name}</p>
                </div>
              </div>
              <button onClick={() => setRejectModalOpen(false)} className="w-7 h-7 rounded-lg bg-[#2a2a2a] hover:bg-[#353534] text-[#777] hover:text-white flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="px-5 py-4">
              <label className="block font-label-caps text-[9px] text-[#888] uppercase font-bold mb-2 tracking-wider">
                Reason — sent to organizer
              </label>
              <textarea
                rows={4}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="e.g. Document photo is unclear or expired. Please upload a clear copy of your Nepal citizenship / passport."
                className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[12px] text-white outline-none resize-none leading-relaxed placeholder:text-[#444] transition-colors"
              />
              <p className="text-[10px] text-[#666] mt-1.5">
                The organizer will receive this feedback and can resubmit their documents.
              </p>
            </div>

            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#353534] text-[#888] hover:text-white rounded-xl text-[11px] font-label-caps uppercase font-bold transition-all border border-[#353534]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading === selectedApp.id}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#7f1d1d] hover:bg-[#991b1b] text-[#fca5a5] rounded-xl text-[11px] font-label-caps uppercase font-bold transition-all disabled:opacity-50 shadow-md"
              >
                {actionLoading === selectedApp.id ? (
                  <span className="material-symbols-outlined animate-spin text-[15px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[15px]">do_not_disturb</span>
                )}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ Document Preview Modal ═══════════ */}
      {previewDocUrl && previewDocMeta && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div onClick={closeDocPreview} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
          <div
            className="relative bg-[#1c1b1b] border border-[#353534] w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col shadow-2xl z-10 animate-in zoom-in-95"
            style={{ height: 'min(88vh, 820px)' }}
          >
            <div className="px-4 py-3 bg-[#201f1f] border-b border-[#353534] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="material-symbols-outlined text-[#ffb4ab] text-[20px] shrink-0">badge</span>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-[13px] truncate">{previewDocMeta.name}</p>
                  <p className="text-[10px] text-[#777] font-data-mono uppercase">
                    {DOC_TYPE_INFO[previewDocMeta.type]?.label || previewDocMeta.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewDocUrl}
                  download={`id-${previewDocMeta.name.replace(/\s+/g, '_').toLowerCase()}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#353534] text-[#ffb4ab] text-[10px] font-label-caps font-bold uppercase rounded-lg border border-[#353534] transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  Download
                </a>
                <button
                  onClick={closeDocPreview}
                  className="w-8 h-8 rounded-lg bg-[#2a2a2a] hover:bg-[#353534] text-[#777] hover:text-white flex items-center justify-center border border-[#353534] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#0d0d0d] p-3 overflow-hidden">
              <iframe
                src={previewDocUrl}
                title="Organizer ID Document"
                className="w-full h-full rounded-xl border border-[#2a2a2a] bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
