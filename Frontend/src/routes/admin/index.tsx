import { createFileRoute } from '@tanstack/react-router';
import { AdminOverviewView } from '../../components/Admin/AdminOverviewView';
import { useScreenNavigate } from '../../hooks/useScreenNav';

export const Route = createFileRoute('/admin/')({
  component: RouteComponent,
});

function RouteComponent() {
  const onNavigate = useScreenNavigate();
  return <AdminOverviewView onNavigate={onNavigate} />;
}
