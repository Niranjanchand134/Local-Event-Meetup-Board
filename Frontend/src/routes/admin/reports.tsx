import React, { useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { AdminReportsView } from '../../components/Admin/AdminReportsView';
import { useScreenNavigate } from '../../hooks/useScreenNav';
import { useAuth } from '../../context/AuthContext';

export const Route = createFileRoute('/admin/reports')({
  component: RouteComponent,
});

function RouteComponent() {
  const onNavigate = useScreenNavigate();
  const { isAdmin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      onNavigate('login');
    }
  }, [isLoading, isAdmin, onNavigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-[32px] text-[#ffb4ab]">
          progress_activity
        </span>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <AdminReportsView onNavigate={onNavigate} />;
}
