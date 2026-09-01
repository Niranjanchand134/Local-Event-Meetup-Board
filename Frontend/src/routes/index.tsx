import { createFileRoute } from '@tanstack/react-router';
import { DiscoverView } from '../components/Events/DiscoverView';
import { useScreenNavigate } from '../hooks/useScreenNav';
import { useCreateEventModal } from '../hooks/useCreateEventModal';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  const onNavigate = useScreenNavigate();
  const { openCreateModal } = useCreateEventModal();
  return <DiscoverView onNavigate={onNavigate} onOpenCreateModal={openCreateModal} />;
}
