import { createFileRoute } from '@tanstack/react-router';
import { AuthView } from '../components/Auth/AuthViews';
import { useScreenNavigate } from '../hooks/useScreenNav';

export const Route = createFileRoute('/signup')({
  component: RouteComponent,
});

function RouteComponent() {
  const onNavigate = useScreenNavigate();
  return <AuthView initialMode="signup" onNavigate={onNavigate} />;
}
