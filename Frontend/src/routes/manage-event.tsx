import { createFileRoute } from '@tanstack/react-router';
import { ManageEventView } from '../components/Events/ManageEventView';
import { useScreenNavigate } from '../hooks/useScreenNav';
import { useCreateEventModal } from '../hooks/useCreateEventModal';
import { useAuth } from '../context/AuthContext';

export const Route = createFileRoute('/manage-event')({
  component: RouteComponent,
});

function RouteComponent() {
  const onNavigate = useScreenNavigate();
  const { openCreateModal } = useCreateEventModal();
  const { isOrganizer, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-[32px] text-[#ffb4ab]">
          progress_activity
        </span>
      </div>
    );
  }

  if (!isAuthenticated || !isOrganizer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 flex items-center justify-center text-[#ffb4ab] mb-6">
          <span className="material-symbols-outlined text-[36px]">lock</span>
        </div>
        <span className="font-label-caps text-[11px] text-[#ffb4ab] tracking-widest uppercase font-bold mb-2">
          ACCESS RESTRICTED
        </span>
        <h1 className="font-headline-lg text-[28px] font-bold text-[#e5e2e1] mb-3">
          Organizer Access Required
        </h1>
        <p className="font-body-md text-[14px] text-[#e6bdb8] mb-8 leading-relaxed">
          The Host Management Hub is reserved for event organizers and system administrators.
          Sign in with an organizer account or register as a host to manage events.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          {!isAuthenticated ? (
            <button
              onClick={() => onNavigate('login')}
              className="bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] px-6 py-3 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all shadow-md"
            >
              SIGN IN AS HOST
            </button>
          ) : (
            <button
              onClick={() => onNavigate('dashboard')}
              className="bg-[#2a2a2a] hover:bg-[#353534] text-[#e5e2e1] border border-[#353534] px-6 py-3 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all"
            >
              MY DASHBOARD
            </button>
          )}
          <button
            onClick={() => onNavigate('events')}
            className="bg-[#1c1b1b] hover:bg-[#2a2a2a] text-[#e6bdb8] border border-[#353534] px-6 py-3 rounded-xl font-label-caps text-[12px] font-bold uppercase transition-all"
          >
            EXPLORE EVENTS
          </button>
        </div>
      </div>
    );
  }

  return <ManageEventView onNavigate={onNavigate} onOpenCreateModal={openCreateModal} />;
}
