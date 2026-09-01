import { createFileRoute } from '@tanstack/react-router';
import { UserDashboardView } from '../components/Dashboard/UserDashboardView';
import { useScreenNavigate } from '../hooks/useScreenNav';
import { useCreateEventModal } from '../hooks/useCreateEventModal';

export const Route = createFileRoute('/dashboard')({
  component: RouteComponent,
});

function RouteComponent() {
  const onNavigate = useScreenNavigate();
  const { openCreateModal } = useCreateEventModal();
  return <UserDashboardView onNavigate={onNavigate} onOpenCreateModal={openCreateModal} />;
}
