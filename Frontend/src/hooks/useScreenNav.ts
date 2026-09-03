import { useNavigate, useRouterState } from '@tanstack/react-router';
import type { ScreenType } from '../types/eventboard';
import { featuredMasterclass } from '../data/mockData';

/**
 * The original EventBoard design was a single-page app that switched between
 * in-memory "screens" via useState. The new app uses real TanStack Router
 * routes, so this adapter maps the old ScreenType navigation calls used
 * throughout the copied components/views onto real URLs - without requiring
 * any changes to those components' markup or props.
 */
const screenToPath = (screen: ScreenType, eventId?: string): string => {
  switch (screen) {
    case 'home':
      return '/';
    case 'events':
      return '/events';
    case 'event-detail':
      return `/events/${eventId ?? featuredMasterclass.id}`;
    case 'dashboard':
      return '/dashboard';
    case 'manage-event':
      return '/manage-event';
    case 'admin':
      return '/admin';
    case 'admin-users':
      return '/admin/users';
    case 'admin-reports':
      return '/admin/reports';
    case 'login':
      return '/login';
    case 'signup':
      return '/signup';
    default:
      return '/';
  }
};

const pathToScreen = (pathname: string): ScreenType => {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/events/')) return 'event-detail';
  if (pathname === '/events') return 'events';
  if (pathname === '/dashboard') return 'dashboard';
  if (pathname === '/manage-event') return 'manage-event';
  if (pathname === '/admin/reports') return 'admin-reports';
  if (pathname === '/admin/users') return 'admin-users';
  if (pathname === '/admin') return 'admin';
  if (pathname === '/login') return 'login';
  if (pathname === '/signup') return 'signup';
  return 'home';
};

/** Returns a navigate function with the original `(screen, eventId?) => void` signature. */
export function useScreenNavigate() {
  const navigate = useNavigate();
  return (screen: ScreenType, eventId?: string) => {
    navigate({ to: screenToPath(screen, eventId) });
  };
}

/** Derives the legacy ScreenType from the current route, for active-state styling. */
export function useCurrentScreen(): ScreenType {
  return useRouterState({ select: (s) => pathToScreen(s.location.pathname) });
}
