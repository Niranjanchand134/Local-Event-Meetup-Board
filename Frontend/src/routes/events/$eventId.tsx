import { createFileRoute } from '@tanstack/react-router';
import { EventDetailView } from '../../components/Events/EventDetailView';
import { useScreenNavigate } from '../../hooks/useScreenNav';

export const Route = createFileRoute('/events/$eventId')({
  component: RouteComponent,
});

function RouteComponent() {
  const { eventId } = Route.useParams();
  const onNavigate = useScreenNavigate();
  return <EventDetailView eventId={eventId} onNavigate={onNavigate} />;
}
