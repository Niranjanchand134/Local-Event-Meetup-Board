import { createFileRoute } from '@tanstack/react-router';
import { AdminReportsView } from '../../components/Admin/AdminReportsView';
import { useScreenNavigate } from '../../hooks/useScreenNav';

export const Route = createFileRoute('/admin/reports')({
  component: RouteComponent,
});

function RouteComponent() {
  const onNavigate = useScreenNavigate();
  return <AdminReportsView onNavigate={onNavigate} />;
}
