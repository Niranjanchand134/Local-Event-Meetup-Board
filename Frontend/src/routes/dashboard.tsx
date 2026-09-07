import { useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { UserDashboardView } from '../components/Dashboard/UserDashboardView';
import { useScreenNavigate } from '../hooks/useScreenNav';
import { useCreateEventModal } from '../hooks/useCreateEventModal';
import { useAuth } from '../context/AuthContext';

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
});

function RouteComponent() {
  const onNavigate = useScreenNavigate();
  const { openCreateModal } = useCreateEventModal();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      onNavigate('login');
    }
  }, [isLoading, isAuthenticated, onNavigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-[32px] text-[#ffb4ab]">
          progress_activity
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <UserDashboardView onNavigate={onNavigate} onOpenCreateModal={openCreateModal} />;
}
