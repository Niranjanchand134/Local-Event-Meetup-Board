import { createFileRoute } from '@tanstack/react-router';
import { EventsDirectoryView } from '../../components/Events/EventsDirectoryView';
import { useScreenNavigate } from '../../hooks/useScreenNav';
import { useCreateEventModal } from '../../hooks/useCreateEventModal';

export const Route = createFileRoute('/events/')({
  component: RouteComponent,
});

function RouteComponent() {
  const onNavigate = useScreenNavigate();
  const { openCreateModal } = useCreateEventModal();
  return <EventsDirectoryView onNavigate={onNavigate} onOpenCreateModal={openCreateModal} />;
}
