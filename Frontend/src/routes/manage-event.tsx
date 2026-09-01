import { createFileRoute } from '@tanstack/react-router';
import { ManageEventView } from '../components/Events/ManageEventView';
import { useScreenNavigate } from '../hooks/useScreenNav';
import { useCreateEventModal } from '../hooks/useCreateEventModal';

export const Route = createFileRoute('/manage-event')({
  component: RouteComponent,
});

function RouteComponent() {
  const onNavigate = useScreenNavigate();
  const { openCreateModal } = useCreateEventModal();
  return <ManageEventView onNavigate={onNavigate} onOpenCreateModal={openCreateModal} />;
}
