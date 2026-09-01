export type ScreenType = 
  | 'home' 
  | 'events' 
  | 'event-detail' 
  | 'dashboard' 
  | 'manage-event' 
  | 'admin' 
  | 'admin-reports' 
  | 'login' 
  | 'signup';

export interface EventItem {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  badge?: string;
  badgeType?: 'live' | 'almost-full' | 'upcoming' | 'closed';
  date: string;
  time: string;
  location: string;
  venueName: string;
  address?: string;
  transitInfo?: string;
  parkingInfo?: string;
  image: string;
  price: number;
  capacity: number;
  registeredCount: number;
  organizer: {
    name: string;
    avatar?: string;
    initials?: string;
    pastEventsCount: number;
    description?: string;
  };
  description: string;
  longDescription?: string[];
  attendees: {
    name: string;
    avatar?: string;
    role?: string;
  }[];
  schedule?: {
    time: string;
    title: string;
    description?: string;
    isHighlight?: boolean;
  }[];
  features?: {
    icon: string;
    title: string;
    description: string;
  }[];
}

export interface AttendeeRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  rsvpDate: string;
  avatar?: string;
  initials?: string;
  status: 'confirmed' | 'waitlist';
}

export interface ReportItem {
  id: string;
  reportedItem: {
    title: string;
    path: string;
    image?: string;
    organizer?: string;
    location?: string;
  };
  type: 'event' | 'comment' | 'user';
  reason: string;
  reasonDetail: string;
  reporter: {
    name: string;
    initials?: string;
    timeAgo: string;
  };
  status: 'OPEN' | 'REVIEWING' | 'DISMISSED';
  isUrgent?: boolean;
  notes?: string;
}

export interface SystemLogItem {
  id: string;
  timestamp: string;
  type: 'USER' | 'EVENT' | 'SYSTEM' | 'REPORT';
  detail: string;
  subdetail: string;
}

export interface UserProfile {
  name: string;
  role: string;
  avatar: string;
  stats: {
    joined: number;
    created: number;
    upcoming: number;
    waitlisted: number;
  };
}
