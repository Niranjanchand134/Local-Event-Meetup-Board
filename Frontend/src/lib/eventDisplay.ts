import type { EventCategory, EventOut } from '../types';
import { eventsApi } from './eventsApi';

export const CATEGORY_IMAGE_MAP: Record<EventCategory, string> = {
  workshop: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
  community_class: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80",
  study_group: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
  free_tutoring: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
  park_cleanup: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80",
  garage_sale: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=1200&q=80",
  other: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80",
};

export const CATEGORY_LABEL_MAP: Record<EventCategory, string> = {
  workshop: "Workshop",
  community_class: "Community Class",
  study_group: "Study Group",
  free_tutoring: "Free Tutoring",
  park_cleanup: "Park Cleanup",
  garage_sale: "Garage Sale",
  other: "Meetup",
};

export const CATEGORY_ICON_MAP: Record<EventCategory, string> = {
  workshop: "code",
  community_class: "school",
  study_group: "menu_book",
  free_tutoring: "volunteer_activism",
  park_cleanup: "eco",
  garage_sale: "storefront",
  other: "groups",
};

export function getEventImageUrl(event: EventOut): string {
  if (event.cover_image_path) {
    return eventsApi.getCoverImageUrl(event.id);
  }
  return CATEGORY_IMAGE_MAP[event.category] || CATEGORY_IMAGE_MAP.other;
}

export function formatEventDate(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatEventDateShort(isoString: string): { day: string; month: string } {
  if (!isoString) return { day: '01', month: 'JAN' };
  const date = new Date(isoString);
  const day = date.toLocaleDateString('en-US', { day: '2-digit' });
  const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return { day, month };
}

export function formatEventTime(startIso: string, endIso?: string | null): string {
  if (!startIso) return '';
  const start = new Date(startIso);
  const startTimeStr = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  if (endIso) {
    const end = new Date(endIso);
    const endTimeStr = end.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${startTimeStr} - ${endTimeStr}`;
  }

  return startTimeStr;
}

export function getEventLocationLabel(event: EventOut): string {
  if (event.is_online) {
    return 'Online Meetup';
  }
  const parts = [event.venue_name, event.city].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : (event.address || 'In-Person');
}

export function getEventBadge(event: EventOut): { label: string; type: 'live' | 'almost-full' | 'online' | 'free' | 'paid' } {
  if (event.status === 'cancelled') {
    return { label: 'CANCELLED', type: 'almost-full' };
  }
  if (event.spots_left !== null && event.spots_left !== undefined && event.spots_left <= 5 && event.spots_left > 0) {
    return { label: `ONLY ${event.spots_left} SPOTS LEFT`, type: 'almost-full' };
  }
  if (event.spots_left === 0) {
    return { label: 'SOLD OUT', type: 'almost-full' };
  }
  if (event.is_online) {
    return { label: 'VIRTUAL EVENT', type: 'online' };
  }
  if (!event.is_paid) {
    return { label: 'FREE ENTRY', type: 'free' };
  }
  return { label: `${event.currency} ${event.price}`, type: 'paid' };
}
