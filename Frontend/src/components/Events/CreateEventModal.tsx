import React, { useState } from 'react';
import confetti from 'canvas-confetti';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated?: (eventData: any) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technology');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location] = useState('');
  const [venue, setVenue] = useState('');
  const [price, setPrice] = useState('0');
  const [capacity, setCapacity] = useState('100');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      if (onEventCreated) {
        onEventCreated({
          title,
          category,
          date,
          time,
          location,
          venue,
          price: parseFloat(price) || 0,
          capacity: parseInt(capacity) || 100,
          description
        });
      }
      setSubmitted(false);
      onClose();
    }, 1600);
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
            <div className="w-9 h-9 rounded-lg bg-[#dc2626]/20 flex items-center justify-center text-[#ffb4ab]">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </div>
            <div>
              <h3 className="font-headline-md text-[18px] text-white font-bold">
                Host a New Event
              </h3>
              <p className="text-[12px] text-[#e6bdb8] font-data-mono">
                PUBLISH TO GLOBAL DIRECTORY
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#e6bdb8] hover:text-white p-1 rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#ffb4ab]/20 flex items-center justify-center text-[#ffb4ab] animate-bounce">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>
            <h4 className="font-headline-lg text-white">Event Published!</h4>
            <p className="text-[#e6bdb8] text-[14px] max-w-md">
              "{title || 'New Event'}" has been deployed to the EventBoard directory. RSVPs are now live.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
            {/* Title */}
            <div>
              <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-2">
                Event Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Distributed Systems Architecture Summit"
                className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-lg p-3 text-[14px] text-white font-body-md outline-none transition-colors"
              />
            </div>

            {/* Category & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-lg p-3 text-[14px] text-white font-data-mono outline-none"
                >
                  <option value="Technology">Technology &amp; Engineering</option>
                  <option value="Design">UI/UX &amp; Creative</option>
                  <option value="Business">Founders &amp; Business</option>
                  <option value="Masterclass">Deep-Dive Masterclass</option>
                  <option value="Meetup">Community Meetup</option>
                </select>
              </div>

              <div>
                <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-2">
                  Ticket Price ($ USD)
                </label>
                <input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0 for Free"
                  className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-lg p-3 text-[14px] text-white font-data-mono outline-none"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-lg p-3 text-[14px] text-white font-data-mono outline-none"
                />
              </div>

              <div>
                <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-2">
                  Time
                </label>
                <input
                  type="text"
                  placeholder="10:00 AM - 4:00 PM PST"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-lg p-3 text-[14px] text-white font-data-mono outline-none"
                />
              </div>
            </div>

            {/* Location & Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-2">
                  Venue &amp; City
                </label>
                <input
                  type="text"
                  placeholder="The Cloud Hub, San Francisco"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-lg p-3 text-[14px] text-white font-body-md outline-none"
                />
              </div>

              <div>
                <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-2">
                  Max Capacity
                </label>
                <input
                  type="number"
                  min="5"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-lg p-3 text-[14px] text-white font-data-mono outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-2">
                Event Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give attendees a brief breakdown of what will be covered and who should attend..."
                className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-lg p-3 text-[14px] text-white font-body-md outline-none resize-none"
              />
            </div>

            {/* Submit Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#353534]">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded font-label-caps text-[12px] text-[#e5e2e1] hover:bg-[#2a2a2a] transition-colors"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="bg-[#dc2626] hover:bg-[#b91c1c] text-white px-6 py-2.5 rounded font-label-caps text-[12px] uppercase tracking-wider transition-all hover:scale-105 shadow-md flex items-center gap-2"
              >
                <span>PUBLISH EVENT</span>
                <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
