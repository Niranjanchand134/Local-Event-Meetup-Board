import { createContext, useContext } from 'react';

interface CreateEventModalContextValue {
  openCreateModal: () => void;
}

export const CreateEventModalContext = createContext<CreateEventModalContextValue | null>(null);

/** Lets any view open the CreateEventModal that is mounted once in the root layout. */
export function useCreateEventModal(): CreateEventModalContextValue {
  const ctx = useContext(CreateEventModalContext);
  if (!ctx) {
    throw new Error('useCreateEventModal must be used within the app root layout');
  }
  return ctx;
}
