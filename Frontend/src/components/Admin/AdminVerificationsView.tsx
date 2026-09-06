import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../../lib/api';
import type { VerificationAdminOut, VerificationStats } from '../../types';
import type { ScreenType } from '../../types/eventboard';

interface AdminVerificationsViewProps {
  onNavigate: (screen: ScreenType) => void;
}

const DOC_TYPE_INFO: Record<string, { label: string; icon: string }> = {
  citizenship: {
    label: 'Citizenship',
    icon: 'badge',
  },
  passport: {
    label: 'Passport',
    icon: 'menu_book',
  },
  national_id: {
    label: 'National ID',
    icon: 'fingerprint',
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

  // Load all verification data once from backend
  const fetchVerificationsData = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const [statsRes, listRes] = await Promise.all([
        api.get<VerificationStats>('/verifications/admin/stats'),
        api.get<VerificationAdminOut[]>('/verifications/admin/all'),
      ]);
      setStats(statsRes.data);
      setApplications(listRes.data);
    } catch (err: any) {
      console.error('Failed to load verification data:', err);
      setFeedback({ type: 'error', message: 'Failed to load verifications from the server.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerificationsData();
  }, [fetchVerificationsData]);

  // Instantaneous client-side filtering for 60fps smooth tab switching and search
  const filtered = useMemo(() => {
    return applications.filter((app) => {
      const matchesTab = activeTab === 'all' || app.status === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        app.full_legal_name.toLowerCase().includes(q) ||
        app.document_number.toLowerCase().includes(q) ||
        app.address.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [applications, activeTab, searchQuery]);

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
      const res = await api.post<VerificationAdminOut>(`/verifications/admin/${app.id}/review`, {
        decision: 'approved',
        admin_note: 'Identity verified and approved by Administrator.',
      });
      setApplications((prev) => prev.map((a) => (a.id === app.id ? res.data : a)));
      setStats((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - (app.status === 'pending' ? 1 : 0)),
        approved: prev.approved + (app.status !== 'approved' ? 1 : 0),
        rejected: Math.max(0, prev.rejected - (app.status === 'rejected' ? 1 : 0)),
      }));
      setFeedback({ type: 'success', message: `${app.full_legal_name} has been approved.` });
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
      const note = adminNote.trim() || 'Identity verification requirements not met. Please resubmit with a clear, valid document.';
      const res = await api.post<VerificationAdminOut>(`/verifications/admin/${selectedApp.id}/review`, {
        decision: 'rejected',
        admin_note: note,
      });
      setApplications((prev) => prev.map((a) => (a.id === selectedApp.id ? res.data : a)));
      setStats((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - (selectedApp.status === 'pending' ? 1 : 0)),
        approved: Math.max(0, prev.approved - (selectedApp.status === 'approved' ? 1 : 0)),
        rejected: prev.rejected + (selectedApp.status !== 'rejected' ? 1 : 0),
      }));
      setFeedback({ type: 'success', message: `${selectedApp.full_legal_name}'s application rejected with feedback.` });
      setRejectModalOpen(false);
      setSelectedApp(null);
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
    <div className="flex flex-col w-full px-4 sm:px-6 py-6 sm:py-8 gap-5 sm:gap-6 max-w-[1400px] mx-auto min-h-screen">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold tracking-widest">
            ADMINISTRATION // VERIFICATIONS
          </span>
          <h1 className="font-headline-xl text-[28px] sm:text-[34px] md:text-[40px] text-[#e5e2e1] font-bold mt-1">
            Organizer Verifications
          </h1>
          <p className="text-[#e6bdb8] text-[13px] sm:text-[14px] mt-0.5">
            Review government ID submissions and approve or reject organizer applications.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={fetchVerificationsData}
            disabled={loading}
            className="px-3.5 py-2 bg-[#201f1f] hover:bg-[#2a2a2a] text-[#e5e2e1] font-label-caps text-[11px] sm:text-[12px] rounded-xl border border-[#353534] transition-colors flex items-center gap-1.5 font-bold disabled:opacity-50 cursor-pointer"
            title="Refresh Verifications"
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
          onClick={() => setActiveTab('pending')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer min-w-0 ${
            activeTab === 'pending'
              ? 'bg-[#201f1f] border-[#ffb4ab] shadow-lg shadow-[#ffb4ab]/5 ring-1 ring-[#ffb4ab]'
              : 'bg-[#201f1f] border-[#353534] hover:border-[#ffb4ab]/50'
          }`}
        >
          <span className="font-label-caps text-[10px] sm:text-[11px] text-[#e6bdb8] flex items-center gap-1.5 mb-1 truncate">
            <span className="w-2 h-2 rounded-full bg-[#ffb4ab] animate-pulse shrink-0" /> PENDING
          </span>
          <span className="font-headline-xl text-[24px] sm:text-[30px] md:text-[36px] text-[#e5e2e1] font-bold">
            {loading ? '—' : stats.pending}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer min-w-0 ${
            activeTab === 'approved'
              ? 'bg-[#201f1f] border-[#ffb4ab] shadow-lg shadow-[#ffb4ab]/5 ring-1 ring-[#ffb4ab]'
              : 'bg-[#201f1f] border-[#353534] hover:border-[#ffb4ab]/50'
          }`}
        >
          <span className="font-label-caps text-[10px] sm:text-[11px] text-[#e6bdb8] block mb-1 truncate">
            APPROVED
          </span>
          <span className="font-headline-xl text-[24px] sm:text-[30px] md:text-[36px] text-[#ffb4ab] font-bold">
            {loading ? '—' : stats.approved}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer min-w-0 ${
            activeTab === 'rejected'
              ? 'bg-[#201f1f] border-[#ffb4ab] shadow-lg shadow-[#ffb4ab]/5 ring-1 ring-[#ffb4ab]'
              : 'bg-[#201f1f] border-[#353534] hover:border-[#ffb4ab]/50'
          }`}
        >
          <span className="font-label-caps text-[10px] sm:text-[11px] text-[#e6bdb8] block mb-1 truncate">
            REJECTED
          </span>
          <span className="font-headline-xl text-[24px] sm:text-[30px] md:text-[36px] text-[#e5e2e1] font-bold">
            {loading ? '—' : stats.rejected}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer min-w-0 ${
            activeTab === 'all'
              ? 'bg-[#201f1f] border-[#ffb4ab] shadow-lg shadow-[#ffb4ab]/5 ring-1 ring-[#ffb4ab]'
              : 'bg-[#201f1f] border-[#353534] hover:border-[#ffb4ab]/50'
          }`}
        >
          <span className="font-label-caps text-[10px] sm:text-[11px] text-[#e6bdb8] block mb-1 truncate">
            TOTAL
          </span>
          <span className="font-headline-xl text-[24px] sm:text-[30px] md:text-[36px] text-[#e5e2e1] font-bold">
            {loading ? '—' : stats.total}
          </span>
        </button>
      </div>

      {/* ── Toolbar (Search + Status Tabs without extra 'STATUS:' prefix) ── */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-[#201f1f] p-3 rounded-2xl border border-[#353534]">
        <div className="flex-1 sm:max-w-xs flex items-center bg-[#131313] px-3.5 py-2.5 rounded-xl border border-[#353534]">
          <span className="material-symbols-outlined text-[#e6bdb8] mr-2.5 text-[18px]">search</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, ID, address..."
            className="bg-transparent text-[#e5e2e1] font-data-mono text-[12px] w-full outline-none placeholder:text-[#666]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#666] hover:text-white ml-1 cursor-pointer">
              <span className="material-symbols-outlined text-[15px]">cancel</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 rounded-xl font-label-caps text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-[#ffb4ab] text-[#690005] shadow-sm'
                  : 'bg-[#131313] text-[#e6bdb8] hover:text-white border border-[#353534]'
              }`}
            >
              <span>{tab.toUpperCase()}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-data-mono ${
                activeTab === tab
                  ? 'bg-[#690005]/20 text-[#690005]'
                  : 'bg-[#2a2a2a] text-[#888]'
              }`}>
                {tab === 'all' ? stats.total : stats[tab]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Table Panel with Clear Sizing & Readable Date/Time ── */}
      <div className="bg-[#201f1f] rounded-2xl border border-[#353534] overflow-hidden shadow-xl">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse" style={{ minWidth: '780px' }}>
            <thead>
              <tr className="bg-[#1c1b1b] border-b border-[#353534]">
                <th className="px-4 py-4 font-label-caps text-[11px] text-[#e6bdb8] w-12 text-center">#</th>
                <th className="px-4 py-4 font-label-caps text-[11px] text-[#e6bdb8]">APPLICANT DETAILS</th>
                <th className="px-4 py-4 font-label-caps text-[11px] text-[#e6bdb8] w-52">DOCUMENT INFO</th>
                <th className="px-4 py-4 font-label-caps text-[11px] text-[#e6bdb8] w-32">STATUS</th>
                <th className="px-4 py-4 font-label-caps text-[11px] text-[#e6bdb8] w-40">SUBMITTED AT</th>
                <th className="px-4 py-4 font-label-caps text-[11px] text-[#e6bdb8] text-right w-28">ACTION</th>
              </tr>
            </thead>

            {loading ? (
              <tbody>
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="material-symbols-outlined animate-spin text-[36px] text-[#ffb4ab]">
                        progress_activity
                      </span>
                      <span className="text-[12px] text-[#888] font-data-mono">Loading verifications…</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : filtered.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={6} className="py-20 text-center px-4">
                    <div className="flex flex-col items-center justify-center">
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
                          ? `No submissions matched "${searchQuery}".`
                          : activeTab === 'pending'
                          ? 'All organizer applications have been reviewed.'
                          : `There are currently no ${activeTab} applications in the records.`}
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-[#353534]">
                {filtered.map((app, idx) => {
                  const docInfo = DOC_TYPE_INFO[app.document_type] || {
                    label: app.document_type,
                    icon: 'badge',
                  };

                  return (
                    <tr key={app.id} className="hover:bg-[#2a2a2a]/40 transition-colors">
                      {/* Index */}
                      <td className="px-4 py-4 text-center">
                        <span className="text-[11px] text-[#888] font-data-mono font-semibold">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </td>

                      {/* Applicant Details */}
                      <td className="px-4 py-4 max-w-[240px]">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-white truncate text-[14px]">
                            {app.full_legal_name}
                          </span>
                          <span className="font-data-mono text-[11px] text-[#e6bdb8] truncate opacity-70" title={app.address}>
                            {app.address}
                          </span>
                          <span className="font-data-mono text-[10px] text-[#888]">
                            DOB: {app.date_of_birth}
                          </span>
                        </div>
                      </td>

                      {/* Document Info */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="font-label-caps text-[10px] px-2 py-0.5 rounded font-bold bg-[#353534] text-[#e5e2e1] border border-[#353534] inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-[#ffb4ab]">{docInfo.icon}</span>
                            {docInfo.label}
                          </span>

                          <div className="inline-flex items-center gap-1.5 bg-[#131313] px-2 py-1 rounded-lg border border-[#353534]">
                            <span
                              className="max-w-[120px] truncate text-[11px] text-[#ffdad6] font-data-mono font-semibold tracking-wider"
                              title={app.document_number}
                            >
                              {app.document_number}
                            </span>
                            <button
                              onClick={() => handleCopyDocNumber(app.document_number, app.id)}
                              title="Copy Document Number"
                              className="text-[#e6bdb8] hover:text-[#ffb4ab] transition-colors shrink-0 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[13px]">
                                {copiedDocId === app.id ? 'check' : 'content_copy'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        {app.status === 'approved' ? (
                          <span className="font-label-caps text-[10px] px-2.5 py-1 rounded font-bold bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/30 inline-flex items-center gap-1 whitespace-nowrap">
                            <span className="material-symbols-outlined text-[13px]">verified</span>
                            APPROVED
                          </span>
                        ) : app.status === 'rejected' ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <span
                              className="font-label-caps text-[10px] px-2.5 py-1 rounded font-bold bg-[#690005] text-[#ffdad6] border border-[#ffb4ab]/30 inline-flex items-center gap-1 cursor-help whitespace-nowrap"
                              title={app.admin_note || 'Application rejected'}
                            >
                              <span className="material-symbols-outlined text-[13px]">cancel</span>
                              REJECTED
                            </span>
                            {app.admin_note && (
                              <span className="text-[10px] text-[#e6bdb8] opacity-60 truncate max-w-[120px]" title={app.admin_note}>
                                {app.admin_note}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="font-label-caps text-[10px] px-2.5 py-1 rounded font-bold bg-[#353534] text-[#e5e2e1] inline-flex items-center gap-1.5 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ffb4ab] animate-pulse shrink-0" />
                            PENDING
                          </span>
                        )}
                      </td>

                      {/* Submitted At */}
                      <td className="px-4 py-4 font-data-mono whitespace-nowrap">
                        <p className="text-[13px] text-[#e5e2e1] font-semibold">
                          {new Date(app.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-[12px] text-[#e6bdb8] opacity-75 mt-0.5">
                          {new Date(app.submitted_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* View Document Button */}
                          <button
                            onClick={() => handleViewDocument(app)}
                            disabled={fetchingDocId === app.id}
                            className="p-2 rounded-full text-[#e6bdb8] hover:text-[#ffb4ab] hover:bg-[#131313] transition-colors disabled:opacity-40 cursor-pointer"
                            title="View ID Document"
                          >
                            {fetchingDocId === app.id ? (
                              <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                            ) : (
                              <span className="material-symbols-outlined text-[18px]">visibility</span>
                            )}
                          </button>

                          {/* Approve Button */}
                          {app.status !== 'approved' && (
                            <button
                              onClick={() => handleApprove(app)}
                              disabled={actionLoading === app.id}
                              className="p-2 rounded-full text-[#e6bdb8] hover:text-[#ffb4ab] hover:bg-[#131313] transition-colors disabled:opacity-40 cursor-pointer"
                              title="Approve Organizer"
                            >
                              {actionLoading === app.id ? (
                                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                              ) : (
                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                              )}
                            </button>
                          )}

                          {/* Reject Button */}
                          {app.status !== 'rejected' && (
                            <button
                              onClick={() => openRejectModal(app)}
                              disabled={actionLoading === app.id}
                              className="p-2 rounded-full text-[#e6bdb8] hover:text-[#ffb4ab] hover:bg-[#131313] transition-colors disabled:opacity-40 cursor-pointer"
                              title="Reject Application"
                            >
                              <span className="material-symbols-outlined text-[18px]">block</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>

        <div className="p-4 border-t border-[#353534] bg-[#1c1b1b] text-center">
          <span className="font-data-mono text-[11px] text-[#e6bdb8]">
            Showing {filtered.length} of {stats.total} verification records
          </span>
        </div>
      </div>

      {/* ═══════════ Rejection Modal ═══════════ */}
      {rejectModalOpen && selectedApp && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div onClick={() => setRejectModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative bg-[#1c1b1b] border border-[#353534] w-full max-w-md rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in-95">
            <div className="px-5 pt-5 pb-4 border-b border-[#2a2a2a] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#690005] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#ffdad6] text-[18px]">block</span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-[14px]">Reject Application</h3>
                  <p className="text-[11px] text-[#e6bdb8] font-data-mono opacity-80">{selectedApp.full_legal_name}</p>
                </div>
              </div>
              <button onClick={() => setRejectModalOpen(false)} className="w-7 h-7 rounded-lg bg-[#2a2a2a] hover:bg-[#353534] text-[#e6bdb8] hover:text-white flex items-center justify-center transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="px-5 py-4">
              <label className="block font-label-caps text-[10px] text-[#e6bdb8] uppercase font-bold mb-2 tracking-wider">
                REASON — SENT TO ORGANIZER
              </label>
              <textarea
                rows={4}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="e.g. Document photo is unclear. Please upload a clear copy of your valid ID."
                className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[12px] text-white outline-none resize-none leading-relaxed placeholder:text-[#555] transition-colors"
              />
              <p className="text-[11px] text-[#e6bdb8] opacity-70 mt-1.5">
                The organizer will receive this feedback and can resubmit their documents.
              </p>
            </div>

            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 bg-[#201f1f] hover:bg-[#2a2a2a] text-[#e6bdb8] hover:text-white rounded-xl text-[11px] font-label-caps uppercase font-bold transition-all border border-[#353534] cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoading === selectedApp.id}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#690005] hover:bg-[#850007] text-[#ffdad6] border border-[#ffb4ab]/30 rounded-xl text-[11px] font-label-caps uppercase font-bold transition-all disabled:opacity-50 shadow-md cursor-pointer"
              >
                {actionLoading === selectedApp.id ? (
                  <span className="material-symbols-outlined animate-spin text-[15px]">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[15px]">block</span>
                )}
                CONFIRM REJECTION
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
                  <p className="text-[10px] text-[#e6bdb8] font-data-mono uppercase opacity-70">
                    {DOC_TYPE_INFO[previewDocMeta.type]?.label || previewDocMeta.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewDocUrl}
                  download={`id-${previewDocMeta.name.replace(/\s+/g, '_').toLowerCase()}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#131313] hover:bg-[#2a2a2a] text-[#ffb4ab] text-[10px] font-label-caps font-bold uppercase rounded-lg border border-[#353534] transition-all"
                >
                  <span className="material-symbols-outlined text-[14px]">download</span>
                  Download
                </a>
                <button
                  onClick={closeDocPreview}
                  className="w-8 h-8 rounded-lg bg-[#2a2a2a] hover:bg-[#353534] text-[#e6bdb8] hover:text-white flex items-center justify-center border border-[#353534] transition-colors cursor-pointer"
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
