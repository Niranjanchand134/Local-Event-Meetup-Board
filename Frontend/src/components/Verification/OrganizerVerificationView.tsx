import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { VerificationOut, DocumentType } from '../../types';
import type { ScreenType } from '../../types/eventboard';

interface OrganizerVerificationViewProps {
  onNavigate: (screen: ScreenType) => void;
}

export const OrganizerVerificationView: React.FC<OrganizerVerificationViewProps> = ({ onNavigate }) => {
  const { user, isOrganizer, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [verification, setVerification] = useState<VerificationOut | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [legalName, setLegalName] = useState(user?.name || '');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('citizenship');
  const [documentNumber, setDocumentNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const NAME_PATTERN = /^[A-Za-z\s.'-]+$/;
  const DOCUMENT_NUMBER_PATTERN = /^[A-Za-z0-9-]+$/;
  const MIN_BIRTH_YEAR = 1900;
  const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

  useEffect(() => {
    const fetchVerificationStatus = async () => {
      setFetchingStatus(true);
      setFormError(null);
      try {
        const res = await api.get<VerificationOut>('/verifications/me');
        setVerification(res.data);
        if (res.data.status === 'rejected') {
          setShowForm(false);
        } else if (res.data.status === 'pending' || res.data.status === 'approved') {
          setShowForm(false);
        }
      } catch (err: any) {
        if (err.response?.status === 404) {
          setVerification(null);
          setShowForm(true);
        } else {
          console.error('Failed to fetch verification status:', err);
        }
      } finally {
        setFetchingStatus(false);
      }
    };

    fetchVerificationStatus();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValidType = ALLOWED_MIME_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(fileExt);

      if (!isValidType) {
        setFormError('Document must be a PDF, JPG, or PNG');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Document must be under 5MB');
        return;
      }
      setSelectedFile(file);
      setFormError(null);
    }
  };

  const validateDob = (birthDate: string): { valid: boolean; message?: string } => {
    if (!birthDate) return { valid: false, message: 'Please provide your date of birth.' };

    const [bYear, bMonth, bDay] = birthDate.split('-').map(Number);
    const today = new Date();
    const tYear = today.getFullYear();
    const tMonth = today.getMonth() + 1;
    const tDay = today.getDate();

    if (bYear > tYear || (bYear === tYear && (bMonth > tMonth || (bMonth === tMonth && bDay > tDay)))) {
      return { valid: false, message: 'Date of birth cannot be in the future' };
    }

    if (bYear < MIN_BIRTH_YEAR) {
      return { valid: false, message: `Date of birth cannot be before ${MIN_BIRTH_YEAR}` };
    }

    let age = tYear - bYear;
    if (tMonth < bMonth || (tMonth === bMonth && tDay < bDay)) {
      age--;
    }

    if (age < 18) {
      return { valid: false, message: 'Organizer must be at least 18 years old' };
    }
    if (age > 120) {
      return { valid: false, message: 'Please check the date of birth entered' };
    }

    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedLegalName = legalName.trim();
    if (!trimmedLegalName) {
      setFormError('Full legal name cannot be blank');
      return;
    }
    if (trimmedLegalName.length < 2) {
      setFormError('Full legal name must be at least 2 characters');
      return;
    }
    if (trimmedLegalName.length > 150) {
      setFormError('Full legal name cannot exceed 150 characters');
      return;
    }
    if (!NAME_PATTERN.test(trimmedLegalName)) {
      setFormError('Full legal name can only contain letters, spaces, apostrophes, periods, and hyphens');
      return;
    }

    const dobValidation = validateDob(dob);
    if (!dobValidation.valid) {
      setFormError(dobValidation.message || 'Invalid date of birth');
      return;
    }

    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setFormError('Address cannot be blank');
      return;
    }
    if (trimmedAddress.length < 5) {
      setFormError('Address must be at least 5 characters');
      return;
    }
    if (trimmedAddress.length > 300) {
      setFormError('Address cannot exceed 300 characters');
      return;
    }

    if (!['citizenship', 'passport', 'national_id'].includes(documentType)) {
      setFormError('Invalid document type selected');
      return;
    }

    const trimmedDocNumber = documentNumber.trim();
    if (!trimmedDocNumber) {
      setFormError('Document number cannot be blank');
      return;
    }
    if (trimmedDocNumber.length < 3) {
      setFormError('Document number must be at least 3 characters');
      return;
    }
    if (trimmedDocNumber.length > 50) {
      setFormError('Document number cannot exceed 50 characters');
      return;
    }

    if (documentType === 'citizenship') {
      const digitsOnly = trimmedDocNumber.replace(/[/-]/g, '');
      if (!/^[0-9]+([/-][0-9]+)*$/.test(trimmedDocNumber) || digitsOnly.length < 3) {
        setFormError('Invalid Nepal Citizenship format (e.g. 27-01-78-12345 or 1234/5678)');
        return;
      }
    } else if (documentType === 'passport') {
      const cleanPass = trimmedDocNumber.replace(/\s+/g, '');
      if (!/^[A-Za-z0-9]{7,9}$/.test(cleanPass) || !/\d/.test(cleanPass)) {
        setFormError('Invalid Nepal Passport format (7-9 alphanumeric characters, e.g. 08123456 or PA0123456)');
        return;
      }
    } else if (documentType === 'national_id') {
      const digitsOnly = trimmedDocNumber.replace(/[-\s]/g, '');
      if (!/^\d{10}$/.test(digitsOnly)) {
        setFormError('Nepal National ID must be a 10-digit number (e.g. 1234567890 or 123-456-7890)');
        return;
      }
    }

    if (!selectedFile) {
      setFormError('Please select a government ID document (PDF, PNG, or JPG).');
      return;
    }

    const fileExt = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    const isValidType = ALLOWED_MIME_TYPES.includes(selectedFile.type) || ALLOWED_EXTENSIONS.includes(fileExt);
    if (!isValidType) {
      setFormError('Document must be a PDF, JPG, or PNG');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFormError('Document must be under 5MB');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('full_legal_name', trimmedLegalName);
      formData.append('date_of_birth', dob);
      formData.append('address', trimmedAddress);
      formData.append('document_type', documentType);
      formData.append('document_number', trimmedDocNumber);
      formData.append('document', selectedFile);

      const res = await api.post<VerificationOut>('/verifications/apply', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setVerification(res.data);
      setShowForm(false);
      setSuccessMessage('Your verification application has been submitted successfully.');
      await refreshUser();
    } catch (err: any) {
      console.error('Verification submission failed:', err);
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setFormError(detail);
      } else if (Array.isArray(detail)) {
        const messages = detail
          .map((d: any) => (d.msg || '').replace(/^Value error,\s*/i, ''))
          .filter(Boolean)
          .join(', ');
        setFormError(messages || 'Failed to submit verification. Please check your inputs.');
      } else {
        setFormError('Failed to submit verification. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOrganizer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 flex items-center justify-center text-[#ffb4ab] mb-6">
          <span className="material-symbols-outlined text-[36px]">shield_person</span>
        </div>
        <span className="font-label-caps text-[11px] text-[#ffb4ab] tracking-widest uppercase font-bold mb-2">
          ORGANIZER ONLY
        </span>
        <h1 className="font-headline-lg text-[28px] font-bold text-[#e5e2e1] mb-3">
          Organizer Account Required
        </h1>
        <p className="font-body-md text-[14px] text-[#e6bdb8] mb-8 leading-relaxed">
          Identity verification is designed for Event Organizers who wish to publish events on EventBoard.
        </p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="bg-[#ffb4ab] text-[#690005] px-6 py-3 rounded-xl font-label-caps text-[12px] font-bold uppercase"
        >
          GO TO DASHBOARD
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-5 lg:px-8 py-12 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => onNavigate('dashboard')}
          className="text-[#e6bdb8] hover:text-white transition-colors flex items-center gap-1 text-[13px] font-data-mono"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Dashboard
        </button>
        <span className="text-[#353534]">/</span>
        <span className="text-[#ffb4ab] font-data-mono text-[13px]">Identity Verification</span>
      </div>

      <div className="bg-[#201f1f] border border-[#353534] rounded-2xl shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="p-8 border-b border-[#353534] bg-[#1c1b1b] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 flex items-center justify-center text-[#ffb4ab] shrink-0">
              <span className="material-symbols-outlined text-[32px]">verified_user</span>
            </div>
            <div>
              <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold tracking-widest">
                TRUST & SAFETY // VERIFICATION
              </span>
              <h1 className="font-headline-xl text-[26px] md:text-[32px] font-bold text-white mt-0.5">
                Host Identity Verification
              </h1>
              <p className="text-[13px] text-[#e6bdb8]">
                Prevent fake events and build attendee trust by verifying your organizer profile.
              </p>
            </div>
          </div>

          <div>
            {user?.is_verified_organizer || verification?.status === 'approved' ? (
              <span className="bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/40 px-3 py-1.5 rounded-xl font-label-caps text-[11px] font-bold uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                VERIFIED
              </span>
            ) : verification?.status === 'pending' ? (
              <span className="bg-[#bdc7d8]/20 text-[#bdc7d8] border border-[#bdc7d8]/40 px-3 py-1.5 rounded-xl font-label-caps text-[11px] font-bold uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                UNDER REVIEW
              </span>
            ) : verification?.status === 'rejected' ? (
              <span className="bg-[#690005] text-[#ffdad6] border border-[#ffb4ab]/40 px-3 py-1.5 rounded-xl font-label-caps text-[11px] font-bold uppercase flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">cancel</span>
                REJECTED
              </span>
            ) : (
              <span className="bg-[#353534] text-[#e5e2e1] px-3 py-1.5 rounded-xl font-label-caps text-[11px] font-bold uppercase">
                UNVERIFIED
              </span>
            )}
          </div>
        </div>

        {/* Body content */}
        <div className="p-8">
          {fetchingStatus ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="material-symbols-outlined animate-spin text-[36px] text-[#ffb4ab]">
                progress_activity
              </span>
              <span className="text-[13px] text-[#e6bdb8] font-data-mono">
                Loading verification status...
              </span>
            </div>
          ) : user?.is_verified_organizer || verification?.status === 'approved' ? (
            <div className="bg-[#131313] border border-[#ffb4ab]/30 rounded-2xl p-8 text-center flex flex-col items-center max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#ffb4ab]/20 text-[#ffb4ab] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[36px]">check_circle</span>
              </div>
              <h2 className="font-headline-md text-[24px] font-bold text-white mb-2">
                Identity Verified Successfully
              </h2>
              <p className="text-[14px] text-[#e6bdb8] mb-6 leading-relaxed">
                You are a verified event organizer. You have unlocked complete permissions to create, host, and manage public community events.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => onNavigate('manage-event')}
                  className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-6 py-3 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all shadow-md"
                >
                  GO TO HOST HUB
                </button>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] px-6 py-3 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all border border-[#353534]"
                >
                  DASHBOARD
                </button>
              </div>
            </div>
          ) : verification?.status === 'pending' && !showForm ? (
            <div className="bg-[#131313] border border-[#353534] rounded-2xl p-8 text-center flex flex-col items-center max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[36px]">hourglass_top</span>
              </div>
              <span className="font-label-caps text-[11px] text-[#ffb4ab] tracking-widest uppercase font-bold mb-1">
                APPLICATION QUEUED
              </span>
              <h2 className="font-headline-md text-[22px] font-bold text-white mb-2">
                Verification Under Review
              </h2>
              <p className="text-[14px] text-[#e6bdb8] mb-6 leading-relaxed">
                Your application submitted on{' '}
                <span className="text-white font-semibold">
                  {new Date(verification.submitted_at).toLocaleString()}
                </span>{' '}
                is currently being processed by our trust &amp; safety administrators.
              </p>
              <div className="bg-[#201f1f] border border-[#353534] p-4 rounded-xl text-left w-full text-[13px] space-y-2 mb-6 font-data-mono text-[#e6bdb8]">
                <div className="flex justify-between">
                  <span>Document Type:</span>
                  <span className="text-white uppercase">{verification.document_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Review Status:</span>
                  <span className="text-[#ffb4ab] font-bold uppercase">{verification.status}</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate('dashboard')}
                className="bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] px-6 py-2.5 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all border border-[#353534]"
              >
                RETURN TO DASHBOARD
              </button>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {verification?.status === 'rejected' && !showForm ? (
                <div className="bg-[#690005]/20 border border-[#ffb4ab]/40 rounded-2xl p-8 text-center flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-[#690005] text-[#ffdad6] flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[32px]">cancel</span>
                  </div>
                  <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold mb-1">
                    DECISION: REJECTED
                  </span>
                  <h2 className="font-headline-md text-[22px] font-bold text-white mb-2">
                    Application Was Not Approved
                  </h2>
                  {verification.admin_note && (
                    <div className="bg-[#201f1f] border border-[#ffb4ab]/30 p-4 rounded-xl text-left w-full my-4">
                      <p className="font-label-caps text-[11px] text-[#ffb4ab] font-bold mb-1 uppercase">
                        REASON FROM ADMINISTRATOR:
                      </p>
                      <p className="text-[14px] text-[#e5e2e1]">
                        {verification.admin_note}
                      </p>
                    </div>
                  )}
                  <p className="text-[13px] text-[#e6bdb8] mb-6">
                    You can resubmit your application with clear, updated credentials.
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-6 py-3 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all shadow-md flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                    RESUBMIT VERIFICATION
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="p-4 bg-[#131313] rounded-xl border border-[#353534] text-[13px] text-[#e6bdb8] flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#ffb4ab] text-[20px] mt-0.5 shrink-0">
                      verified
                    </span>
                    <div>
                      <p className="font-bold text-white mb-1">Identity Requirement Policy</p>
                      <p>
                        Please ensure your legal name and date of birth match the official document you upload.
                        Our administrators inspect documents only to authenticate host accounts.
                      </p>
                    </div>
                  </div>

                  {formError && (
                    <div className="p-4 bg-[#690005]/40 border border-[#ffb4ab]/50 rounded-xl text-[#ffdad6] text-[13px] flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">
                        error
                      </span>
                      <span>{formError}</span>
                    </div>
                  )}

                  {successMessage && (
                    <div className="p-4 bg-[#2a2a2a] border border-[#ffb4ab] rounded-xl text-[#ffdad6] text-[13px] flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">
                        check_circle
                      </span>
                      <span>{successMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                        Full Legal Name *
                      </label>
                      <input
                        type="text"
                        required
                        minLength={2}
                        maxLength={150}
                        value={legalName}
                        onChange={(e) => setLegalName(e.target.value)}
                        placeholder="e.g. Alexander Mercer"
                        className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                        Date of Birth (18+ Required) *
                      </label>
                      <input
                        type="date"
                        required
                        min="1900-01-01"
                        max={new Date().toISOString().split('T')[0]}
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white outline-none font-data-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                      Address *
                    </label>
                    <textarea
                      required
                      minLength={5}
                      maxLength={300}
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street address, city, state/province, country"
                      className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white outline-none resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                        Document Type *
                      </label>
                      <select
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                        className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white outline-none font-data-mono"
                      >
                        <option value="citizenship">Citizenship Certificate (नागरिकता)</option>
                        <option value="passport">Passport (राहदानी)</option>
                        <option value="national_id">National ID Card (राष्ट्रिय परिचयपत्र)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                        Document Number / ID *
                      </label>
                      <input
                        type="text"
                        required
                        minLength={3}
                        maxLength={50}
                        value={documentNumber}
                        onChange={(e) => setDocumentNumber(e.target.value)}
                        placeholder={
                          documentType === 'citizenship'
                            ? 'e.g. 27-01-78-12345 or 1234/5678'
                            : documentType === 'passport'
                            ? 'e.g. 08123456 or PA0123456'
                            : 'e.g. 1234567890 or 123-456-7890'
                        }
                        className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white outline-none font-data-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                      Upload Document Copy (PDF, JPG, PNG &le; 5MB) *
                    </label>
                    <div className="border-2 border-dashed border-[#353534] hover:border-[#ffb4ab]/50 rounded-xl p-6 text-center transition-colors bg-[#131313] relative">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/jpeg,image/png"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-[36px] text-[#ffb4ab]">
                          {selectedFile ? 'task_alt' : 'cloud_upload'}
                        </span>
                        {selectedFile ? (
                          <div className="text-[13px] text-[#e5e2e1] font-semibold">
                            Selected: <span className="text-[#ffb4ab]">{selectedFile.name}</span> (
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </div>
                        ) : (
                          <>
                            <span className="text-[13px] text-[#e5e2e1] font-medium">
                              Drag & drop ID document or click to browse
                            </span>
                            <span className="text-[11px] text-[#e6bdb8] font-data-mono">
                              PDF, JPG, PNG up to 5MB
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#353534]">
                    <button
                      type="button"
                      onClick={() => onNavigate('dashboard')}
                      className="px-5 py-3 rounded-xl border border-[#353534] text-[#e6bdb8] hover:bg-[#2a2a2a] font-label-caps text-[12px] uppercase font-bold transition-all"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-8 py-3 rounded-xl font-label-caps text-[12px] uppercase font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="material-symbols-outlined animate-spin text-[18px]">
                          progress_activity
                        </span>
                      ) : (
                        <span>SUBMIT APPLICATION →</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
