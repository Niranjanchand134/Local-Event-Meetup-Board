import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../lib/eventsApi';
import { EVENT_CATEGORIES, type EventCategory, type EventCreatePayload, type EventOut } from '../../types';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: (event: EventOut) => void;
  onOpenVerification?: () => void;
}

interface ScheduleRow {
  id: string;
  timeStr: string; // HH:mm
  title: string;
  description: string;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
  onOpenVerification,
}) => {
  const { isVerifiedOrganizer, isAdmin } = useAuth();

  // Basic Details
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('workshop');
  const [description, setDescription] = useState('');

  // Date & Time (HTML datetime-local)
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Location / Online
  const [isOnline, setIsOnline] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Pricing & Capacity
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('NPR');
  const [maxAttendees, setMaxAttendees] = useState('');

  // Cover Image
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Schedule / Itinerary
  const [scheduleItems, setScheduleItems] = useState<ScheduleRow[]>([
    { id: '1', timeStr: '10:00', title: 'Welcome & Introductions', description: 'Opening remarks and participant meetup' },
  ]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdEvent, setCreatedEvent] = useState<EventOut | null>(null);

  // Set default start_time to tomorrow at 10:00 AM on initial open
  useEffect(() => {
    if (isOpen && !startTime) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      const isoLocal = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setStartTime(isoLocal);

      const tomorrowEnd = new Date(tomorrow);
      tomorrowEnd.setHours(13, 0, 0, 0);
      const isoEndLocal = new Date(tomorrowEnd.getTime() - tomorrowEnd.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setEndTime(isoEndLocal);
    }
  }, [isOpen, startTime]);

  if (!isOpen) return null;

  // Handle Cover Image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('Image size exceeds 5MB limit. Please choose a smaller file.');
        return;
      }
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCoverImage = () => {
    setCoverImageFile(null);
    setCoverImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Schedule row actions
  const addScheduleRow = () => {
    setScheduleItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        timeStr: '11:00',
        title: '',
        description: '',
      },
    ]);
  };

  const removeScheduleRow = (id: string) => {
    setScheduleItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateScheduleRow = (id: string, field: keyof ScheduleRow, value: string) => {
    setScheduleItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Front-end Pre-validations
    if (!title.trim() || title.trim().length < 3) {
      setSubmitError('Event title must be at least 3 characters long.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setSubmitError('Event description must be at least 10 characters long.');
      return;
    }

    if (!startTime) {
      setSubmitError('Start date & time is required.');
      return;
    }

    const startDate = new Date(startTime);
    if (startDate <= new Date()) {
      setSubmitError('Start date & time must be in the future.');
      return;
    }

    if (endTime) {
      const endDate = new Date(endTime);
      if (endDate <= startDate) {
        setSubmitError('End time must be after the start time.');
        return;
      }
    }

    if (isOnline) {
      if (!meetingLink.trim()) {
        setSubmitError('Meeting link is required for online events.');
        return;
      }
      if (!meetingLink.startsWith('http://') && !meetingLink.startsWith('https://')) {
        setSubmitError('Meeting link must start with https:// or http://');
        return;
      }
    } else {
      if (!address.trim()) {
        setSubmitError('Street address is required for in-person events.');
        return;
      }
      if (!city.trim()) {
        setSubmitError('City is required for in-person events.');
        return;
      }
    }

    if (isPaid) {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        setSubmitError('Please enter a valid ticket price greater than 0.');
        return;
      }
    }

    // Build schedule items formatted with full ISO datetime matching event start date
    const dateOnly = startTime.split('T')[0];
    const parsedScheduleItems = scheduleItems
      .filter((s) => s.title.trim().length >= 2)
      .map((s, index) => {
        const itemDateTime = `${dateOnly}T${s.timeStr || '10:00'}:00`;
        return {
          item_time: new Date(itemDateTime).toISOString(),
          title: s.title.trim(),
          description: s.description.trim() || null,
          sort_order: index,
        };
      });

    const payload: EventCreatePayload = {
      title: title.trim(),
      description: description.trim(),
      category,
      start_time: new Date(startTime).toISOString(),
      end_time: endTime ? new Date(endTime).toISOString() : null,
      venue_name: isOnline ? null : venueName.trim() || null,
      address: isOnline ? null : address.trim() || null,
      city: isOnline ? null : city.trim() || null,
      is_online: isOnline,
      meeting_link: isOnline ? meetingLink.trim() : null,
      is_paid: isPaid,
      price: isPaid ? parseFloat(price) : null,
      currency: currency.toUpperCase(),
      max_attendees: maxAttendees ? parseInt(maxAttendees, 10) : null,
      schedule_items: parsedScheduleItems,
    };

    setIsSubmitting(true);

    try {
      // 1. Create the Event via Backend API
      let event = await eventsApi.createEvent(payload);

      // 2. If user selected a cover image, upload it
      if (coverImageFile) {
        try {
          event = await eventsApi.uploadCoverImage(event.id, coverImageFile);
        } catch (imgErr) {
          console.error('Failed to upload cover image:', imgErr);
          // Non-blocking: event was still created
        }
      }

      setCreatedEvent(event);

      // Confetti celebration
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });

      if (onEventCreated) {
        onEventCreated(event);
      }
    } catch (err: any) {
      console.error('Error creating event:', err);
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setSubmitError(detail);
      } else if (Array.isArray(detail)) {
        setSubmitError(detail.map((d: any) => d.msg || d.message).join(', '));
      } else if (err.response?.status === 403) {
        setSubmitError('Verification required: You must have an approved organizer profile to publish events.');
      } else {
        setSubmitError(err.message || 'Failed to publish event. Please check all fields and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreate = isAdmin || isVerifiedOrganizer;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#0e0e0e]/85 backdrop-blur-md animate-in fade-in"
      />

      {/* Modal Card */}
      <div className="relative bg-[#1c1b1b] border border-[#353534] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#353534] flex items-center justify-between bg-[#201f1f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#dc2626]/20 border border-[#dc2626]/30 flex items-center justify-center text-[#ffb4ab]">
              <span className="material-symbols-outlined text-[22px]">add_circle</span>
            </div>
            <div>
              <h3 className="font-headline-md text-[18px] text-white font-bold tracking-tight">
                Host a New Meetup or Event
              </h3>
              <p className="text-[11px] text-[#e6bdb8] font-data-mono tracking-wider uppercase">
                FASTAPI EVENT CREATION ENGINE
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#e6bdb8] hover:text-white p-1.5 rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Unverified Organizer Gate Banner */}
        {!canCreate && (
          <div className="p-5 bg-[#690005]/25 border-b border-[#ffb4ab]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#ffb4ab] text-[26px]">gpp_maybe</span>
              <div>
                <p className="text-white text-[14px] font-bold">Organizer Verification Required</p>
                <p className="text-[12px] text-[#e6bdb8]">
                  In accordance with safety policies, event publishing is restricted to verified organizers.
                </p>
              </div>
            </div>
            {onOpenVerification && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVerification();
                }}
                className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-4 py-2 rounded-xl font-label-caps text-[11px] font-bold uppercase transition-all whitespace-nowrap shadow-sm"
              >
                SUBMIT VERIFICATION
              </button>
            )}
          </div>
        )}

        {/* Error Alert Box */}
        {submitError && (
          <div className="m-5 p-4 rounded-xl bg-[#690005]/30 border border-[#ffb4ab]/40 text-[#ffdad6] text-[13px] flex items-start gap-3">
            <span className="material-symbols-outlined text-[#ffb4ab] text-[20px] shrink-0 mt-0.5">
              error
            </span>
            <div className="flex-1">
              <p className="font-bold">Cannot publish event:</p>
              <p className="text-[#e6bdb8] mt-0.5">{submitError}</p>
            </div>
            <button
              type="button"
              onClick={() => setSubmitError(null)}
              className="text-[#e6bdb8] hover:text-white"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Success Screen */}
        {createdEvent ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-5">
            <div className="w-18 h-18 rounded-full bg-[#ffb4ab]/20 border border-[#ffb4ab]/40 flex items-center justify-center text-[#ffb4ab] animate-bounce">
              <span className="material-symbols-outlined text-[42px]">check_circle</span>
            </div>
            <div>
              <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase tracking-widest font-bold block mb-1">
                EVENT PUBLISHED SUCCESSFULLY
              </span>
              <h4 className="font-headline-lg text-[24px] text-white font-bold">
                {createdEvent.title}
              </h4>
            </div>
            <p className="text-[#e6bdb8] text-[14px] max-w-md">
              Your event is now live on EventBoard. Attendees can RSVP and view the itinerary.
            </p>

            <div className="bg-[#201f1f] border border-[#353534] p-4 rounded-xl w-full max-w-md text-left font-data-mono text-[12px] space-y-1.5 text-[#e6bdb8]">
              <div><span className="text-white">Event ID:</span> {createdEvent.id}</div>
              <div><span className="text-white">Category:</span> {createdEvent.category}</div>
              <div><span className="text-white">Starts:</span> {new Date(createdEvent.start_time).toLocaleString()}</div>
              <div><span className="text-white">Format:</span> {createdEvent.is_online ? '🌐 Online' : `📍 ${createdEvent.venue_name || createdEvent.city}`}</div>
              <div><span className="text-white">Admission:</span> {createdEvent.is_paid ? `${createdEvent.currency} ${createdEvent.price}` : 'Free'}</div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setCreatedEvent(null);
                  onClose();
                }}
                className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-6 py-3 rounded-xl font-label-caps text-[12px] uppercase tracking-wider font-bold shadow-md transition-all"
              >
                CLOSE &amp; EXPLORE
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
            {/* Section 1: Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#353534] pb-2">
                <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold tracking-wider">
                  01. EVENT OVERVIEW
                </span>
              </div>

              {/* Title */}
              <div>
                <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={150}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Kathmandu AI & Rust Developers Meetup"
                  className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white font-body-md outline-none transition-colors"
                />
              </div>

              {/* Category Select */}
              <div>
                <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as EventCategory)}
                  className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white font-data-mono outline-none cursor-pointer"
                >
                  {EVENT_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value} className="bg-[#1c1b1b] text-white">
                      {cat.label} ({cat.description})
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">
                    Description *
                  </label>
                  <span className="font-data-mono text-[11px] text-[#e6bdb8]">
                    {description.length} / 5000 chars (min 10)
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  minLength={10}
                  maxLength={5000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide an engaging summary: What will attendees learn? What should they bring? Who is speaking?"
                  className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white font-body-md outline-none resize-none transition-colors"
                />
              </div>
            </div>

            {/* Section 2: Date & Time */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#353534] pb-2">
                <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold tracking-wider">
                  02. SCHEDULE &amp; TIMING
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                    Start Date &amp; Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white font-data-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                    End Date &amp; Time (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white font-data-mono outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Format & Location */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#353534] pb-2">
                <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold tracking-wider">
                  03. FORMAT &amp; VENUE
                </span>
                <div className="flex items-center gap-2 bg-[#131313] p-1 rounded-lg border border-[#353534]">
                  <button
                    type="button"
                    onClick={() => setIsOnline(false)}
                    className={`px-3 py-1 rounded-md text-[11px] font-label-caps font-bold transition-colors ${
                      !isOnline ? 'bg-[#ffb4ab] text-[#690005]' : 'text-[#e6bdb8] hover:text-white'
                    }`}
                  >
                    IN-PERSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOnline(true)}
                    className={`px-3 py-1 rounded-md text-[11px] font-label-caps font-bold transition-colors ${
                      isOnline ? 'bg-[#ffb4ab] text-[#690005]' : 'text-[#e6bdb8] hover:text-white'
                    }`}
                  >
                    ONLINE
                  </button>
                </div>
              </div>

              {isOnline ? (
                <div>
                  <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                    Meeting URL / Stream Link *
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#e6bdb8] text-[20px]">
                      link
                    </span>
                    <input
                      type="url"
                      required={isOnline}
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/xyz-abcd-efg"
                      className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl pl-10 pr-4 py-3 text-[14px] text-white font-data-mono outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-[#e6bdb8]/70 mt-1 font-data-mono">
                    Must start with https:// or http://. Link will be shared with confirmed attendees.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                      Venue Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="e.g. Pulchowk Innovation Hub, 3rd Floor"
                      className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white font-body-md outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required={!isOnline}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. Ring Road, Pulchowk"
                        className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white font-body-md outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                        City *
                      </label>
                      <input
                        type="text"
                        required={!isOnline}
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Lalitpur"
                        className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white font-body-md outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 4: Tickets & Capacity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#353534] pb-2">
                <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold tracking-wider">
                  04. ADMISSION &amp; CAPACITY
                </span>
                <div className="flex items-center gap-2 bg-[#131313] p-1 rounded-lg border border-[#353534]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPaid(false);
                      setPrice('');
                    }}
                    className={`px-3 py-1 rounded-md text-[11px] font-label-caps font-bold transition-colors ${
                      !isPaid ? 'bg-[#ffb4ab] text-[#690005]' : 'text-[#e6bdb8] hover:text-white'
                    }`}
                  >
                    FREE ENTRY
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPaid(true)}
                    className={`px-3 py-1 rounded-md text-[11px] font-label-caps font-bold transition-colors ${
                      isPaid ? 'bg-[#ffb4ab] text-[#690005]' : 'text-[#e6bdb8] hover:text-white'
                    }`}
                  >
                    PAID TICKET
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isPaid ? (
                  <div>
                    <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                      Ticket Price ({currency}) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        required={isPaid}
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="500"
                        className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white font-data-mono outline-none"
                      />
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="bg-[#131313] border border-[#353534] text-white font-data-mono text-[13px] px-3 rounded-xl outline-none"
                      >
                        <option value="NPR">NPR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="INR">INR</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center p-3 bg-[#131313] rounded-xl border border-[#353534] text-[#e6bdb8] text-[13px] gap-2">
                    <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">check_circle</span>
                    <span>Free admission for all community attendees.</span>
                  </div>
                )}

                <div>
                  <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                    Max Capacity (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={maxAttendees}
                    onChange={(e) => setMaxAttendees(e.target.value)}
                    placeholder="e.g. 50 (leave empty for unlimited)"
                    className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white font-data-mono outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Cover Image */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#353534] pb-2">
                <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold tracking-wider">
                  05. COVER IMAGE
                </span>
              </div>

              {coverImagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-[#353534] h-48 bg-[#131313] group">
                  <img
                    src={coverImagePreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[#0e0e0e]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-[#ffb4ab] text-[#690005] rounded-lg font-label-caps text-[11px] font-bold"
                    >
                      CHANGE IMAGE
                    </button>
                    <button
                      type="button"
                      onClick={removeCoverImage}
                      className="px-4 py-2 bg-[#dc2626] text-white rounded-lg font-label-caps text-[11px] font-bold"
                    >
                      REMOVE
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#353534] hover:border-[#ffb4ab] p-6 rounded-xl text-center cursor-pointer transition-colors bg-[#131313]/50 flex flex-col items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[#ffb4ab] text-[32px]">
                    add_photo_alternate
                  </span>
                  <p className="text-white text-[13px] font-medium">
                    Click to upload event cover image
                  </p>
                  <p className="text-[#e6bdb8] text-[11px] font-data-mono">
                    PNG, JPG, or WEBP up to 5MB (16:9 ratio recommended)
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {/* Section 6: Schedule / Itinerary Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#353534] pb-2">
                <span className="font-label-caps text-[11px] text-[#ffb4ab] uppercase font-bold tracking-wider">
                  06. ITINERARY &amp; SESSIONS
                </span>
                <button
                  type="button"
                  onClick={addScheduleRow}
                  className="flex items-center gap-1.5 text-[#ffb4ab] hover:text-[#ffdad6] font-label-caps text-[11px] font-bold uppercase transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  ADD SESSION
                </button>
              </div>

              <div className="space-y-3">
                {scheduleItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-[#131313] border border-[#353534] rounded-xl flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                  >
                    <div className="w-full sm:w-28 shrink-0">
                      <label className="block text-[10px] text-[#e6bdb8] font-data-mono mb-1">
                        TIME
                      </label>
                      <input
                        type="time"
                        value={item.timeStr}
                        onChange={(e) => updateScheduleRow(item.id, 'timeStr', e.target.value)}
                        className="w-full bg-[#1c1b1b] border border-[#353534] rounded-lg p-2 text-[13px] text-white font-data-mono outline-none"
                      />
                    </div>

                    <div className="flex-1 w-full">
                      <label className="block text-[10px] text-[#e6bdb8] font-data-mono mb-1">
                        SESSION TITLE #{index + 1}
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateScheduleRow(item.id, 'title', e.target.value)}
                        placeholder="e.g. Keynote Presentation"
                        className="w-full bg-[#1c1b1b] border border-[#353534] rounded-lg p-2 text-[13px] text-white font-body-md outline-none"
                      />
                    </div>

                    <div className="flex-1 w-full">
                      <label className="block text-[10px] text-[#e6bdb8] font-data-mono mb-1">
                        BRIEF NOTE (OPTIONAL)
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateScheduleRow(item.id, 'description', e.target.value)}
                        placeholder="Speaker / details"
                        className="w-full bg-[#1c1b1b] border border-[#353534] rounded-lg p-2 text-[13px] text-white font-body-md outline-none"
                      />
                    </div>

                    {scheduleItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeScheduleRow(item.id)}
                        className="text-[#e6bdb8] hover:text-[#dc2626] p-2 mt-auto sm:mt-5 rounded-lg hover:bg-[#2a2a2a] transition-colors"
                        title="Remove session"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#353534]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl font-label-caps text-[12px] text-[#e5e2e1] hover:bg-[#2a2a2a] transition-colors font-bold"
              >
                CANCEL
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !canCreate}
                className="bg-[#dc2626] hover:bg-[#b91c1c] disabled:opacity-50 disabled:cursor-not-allowed text-white px-7 py-3 rounded-xl font-label-caps text-[12px] uppercase tracking-wider transition-all hover:scale-105 shadow-md flex items-center gap-2 font-bold"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                    <span>PUBLISHING...</span>
                  </>
                ) : (
                  <>
                    <span>PUBLISH EVENT</span>
                    <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
