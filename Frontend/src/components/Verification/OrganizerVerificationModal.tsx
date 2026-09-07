import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { VerificationOut, DocumentType } from '../../types';

interface OrganizerVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const OrganizerVerificationModal: React.FC<OrganizerVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, refreshUser } = useAuth();
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
  const MIN_BIRTH_YEAR = 1900;
  const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

  // Fetch current application on modal open
  useEffect(() => {
    if (!isOpen) return;

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
          // No verification application submitted yet
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
  }, [isOpen]);

  if (!isOpen) return null;

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
      if (onSuccess) onSuccess();
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-[#0e0e0e]/80 backdrop-blur-md animate-in fade-in"
      />

      {/* Modal Card */}
      <div className="relative bg-[#1c1b1b] border border-[#353534] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10 animate-in zoom-in-95">
        {/* Header */}
        <div className="p-6 border-b border-[#353534] flex items-center justify-between bg-[#201f1f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 flex items-center justify-center text-[#ffb4ab]">
              <span className="material-symbols-outlined text-[24px]">verified_user</span>
            </div>
            <div>
              <h2 className="font-headline-md text-[18px] text-[#e5e2e1] font-bold">
                Organizer Identity Verification
              </h2>
              <p className="text-[12px] text-[#e6bdb8] font-data-mono">
                Mandatory verification to post public events
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#2a2a2a] text-[#e6bdb8] hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {fetchingStatus ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <span className="material-symbols-outlined animate-spin text-[32px] text-[#ffb4ab]">
                progress_activity
              </span>
              <span className="text-[13px] text-[#e6bdb8] font-data-mono">
                Checking verification records...
              </span>
            </div>
          ) : user?.is_verified_organizer || verification?.status === 'approved' ? (
            /* Approved State */
            <div className="bg-[#131313] border border-[#ffb4ab]/30 rounded-2xl p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#ffb4ab]/20 text-[#ffb4ab] flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[36px]">check_circle</span>
              </div>
              <span className="font-label-caps text-[11px] text-[#ffb4ab] tracking-widest uppercase font-bold mb-1">
                ACCOUNT VERIFIED
              </span>
              <h3 className="font-headline-md text-[22px] font-bold text-white mb-2">
                You are a Verified Host
              </h3>
              <p className="font-body-md text-[14px] text-[#e6bdb8] max-w-md mb-6">
                Your government ID has been reviewed and approved by administrators. You have full
                access to create, publish, and manage events on EventBoard.
              </p>
              <button
                onClick={onClose}
                className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-6 py-2.5 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all shadow-md"
              >
                PROCEED TO HOST HUB
              </button>
            </div>
          ) : verification?.status === 'pending' && !showForm ? (
            /* Pending State */
            <div className="bg-[#131313] border border-[#353534] rounded-2xl p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 text-[#ffb4ab] flex items-center justify-center mb-4 animate-pulse">
                <span className="material-symbols-outlined text-[36px]">hourglass_top</span>
              </div>
              <span className="font-label-caps text-[11px] text-[#ffb4ab] tracking-widest uppercase font-bold mb-1">
                STATUS: UNDER REVIEW
              </span>
              <h3 className="font-headline-md text-[22px] font-bold text-white mb-2">
                Application Submitted
              </h3>
              <p className="font-body-md text-[14px] text-[#e6bdb8] max-w-md mb-4 leading-relaxed">
                Your ID verification application was submitted on{' '}
                <span className="text-white font-semibold">
                  {new Date(verification.submitted_at).toLocaleDateString()}
                </span>
                . Our moderation team is actively reviewing your credentials.
              </p>
              <div className="p-3 bg-[#201f1f] rounded-xl border border-[#353534] text-[12px] text-[#e6bdb8] font-data-mono mb-6 max-w-md w-full">
                Document Type: <span className="text-white uppercase">{verification.document_type}</span>
              </div>
              <p className="text-[12px] text-[#e6bdb8] italic mb-6">
                You will be granted full event creation privileges as soon as an admin approves your application.
              </p>
              <button
                onClick={onClose}
                className="bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] px-6 py-2.5 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all border border-[#353534]"
              >
                CLOSE WINDOW
              </button>
            </div>
          ) : (
            /* Form or Rejected with Resubmit State */
            <div className="space-y-6">
              {verification?.status === 'rejected' && !showForm ? (
                <div className="bg-[#690005]/20 border border-[#ffb4ab]/40 rounded-2xl p-6 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#690005] text-[#ffdad6] flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[28px]">cancel</span>
                  </div>
                  <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold mb-1">
                    APPLICATION REJECTED
                  </span>
                  <h3 className="font-headline-md text-[20px] font-bold text-white mb-2">
                    Verification Could Not Be Approved
                  </h3>
                  {verification.admin_note && (
                    <div className="bg-[#201f1f] border border-[#ffb4ab]/30 p-4 rounded-xl text-left w-full my-3">
                      <p className="font-label-caps text-[10px] text-[#ffb4ab] font-bold mb-1 uppercase">
                        ADMIN NOTE:
                      </p>
                      <p className="text-[13px] text-[#e5e2e1] font-body-md">
                        {verification.admin_note}
                      </p>
                    </div>
                  )}
                  <p className="text-[13px] text-[#e6bdb8] mb-6">
                    Please correct the issues indicated above and resubmit your government ID document.
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-6 py-2.5 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all shadow-md flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                    RESUBMIT APPLICATION
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="p-4 bg-[#201f1f] rounded-xl border border-[#353534] text-[13px] text-[#e6bdb8] flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#ffb4ab] text-[20px] mt-0.5 shrink-0">
                      info
                    </span>
                    <span>
                      To prevent scam/spam events, all organizers must provide valid government ID
                      before hosting events. Your document is securely stored and only accessible by authorized admins.
                    </span>
                  </div>

                  {formError && (
                    <div className="p-3 bg-[#690005]/40 border border-[#ffb4ab]/50 rounded-xl text-[#ffdad6] text-[13px] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#ffb4ab] text-[18px]">
                        error
                      </span>
                      <span>{formError}</span>
                    </div>
                  )}

                  {successMessage && (
                    <div className="p-3 bg-[#2a2a2a] border border-[#ffb4ab] rounded-xl text-[#ffdad6] text-[13px] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#ffb4ab] text-[18px]">
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
                        placeholder="As shown on official ID"
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
                      Residential / Business Address *
                    </label>
                    <textarea
                      required
                      minLength={5}
                      maxLength={300}
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, City, State/Province, Country"
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
                        Document Number *
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
                    <div className="border-2 border-dashed border-[#353534] hover:border-[#ffb4ab]/50 rounded-xl p-5 text-center transition-colors bg-[#131313] relative">
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/jpeg,image/png"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <span className="material-symbols-outlined text-[32px] text-[#ffb4ab]">
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
                              Drag & drop document or click to browse
                            </span>
                            <span className="text-[11px] text-[#e6bdb8] font-data-mono">
                              Supported formats: PDF, JPG, PNG (Max 5MB)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[#353534]">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 rounded-xl border border-[#353534] text-[#e6bdb8] hover:bg-[#2a2a2a] font-label-caps text-[12px] uppercase font-bold transition-all"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-6 py-2.5 rounded-xl font-label-caps text-[12px] uppercase font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="material-symbols-outlined animate-spin text-[18px]">
                          progress_activity
                        </span>
                      ) : (
                        <span>SUBMIT FOR VERIFICATION →</span>
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
