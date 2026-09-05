import { createFileRoute } from '@tanstack/react-router';
import { OrganizerVerificationView } from '../components/Verification/OrganizerVerificationView';
import { useScreenNavigate } from '../hooks/useScreenNav';

export const Route = createFileRoute('/verification')({
  component: RouteComponent,
});

function RouteComponent() {
  const onNavigate = useScreenNavigate();
  return <OrganizerVerificationView onNavigate={onNavigate} />;
}
