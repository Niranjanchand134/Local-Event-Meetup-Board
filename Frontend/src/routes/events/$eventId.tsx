import { createFileRoute } from '@tanstack/react-router';
import { EventDetailView } from '../../components/Events/EventDetailView';
import { useScreenNavigate } from '../../hooks/useScreenNav';

export const Route = createFileRoute('/events/$eventId')({
  component: RouteComponent,
});

function RouteComponent() {
  // The original design always renders the single featured masterclass event
  // regardless of which card was clicked (mock data only has one detailed
  // event). The $eventId param is preserved in the URL for a real API to key
  // off in the future, but the view itself is unchanged.
  const onNavigate = useScreenNavigate();
  return <EventDetailView onNavigate={onNavigate} />;
}
