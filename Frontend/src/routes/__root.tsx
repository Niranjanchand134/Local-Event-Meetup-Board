import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useState } from 'react';

import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
// import { ScreenSwitcher } from '../components/ScreenSwitcher';
import { AdminSidebar } from '../components/Admin/AdminSidebar';
import { CreateEventModal } from '../components/Events/CreateEventModal';
import { CreateEventModalContext } from '../hooks/useCreateEventModal';
import { useCurrentScreen, useScreenNavigate } from '../hooks/useScreenNav';

import { AuthProvider } from '../context/AuthContext';

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const currentScreen = useCurrentScreen();
  const onNavigate = useScreenNavigate();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const isAdminScreen =
    currentScreen === 'admin' || currentScreen === 'admin-users' || currentScreen === 'admin-reports';

  return (
    <AuthProvider>
      <CreateEventModalContext.Provider value={{ openCreateModal: () => setCreateModalOpen(true) }}>
        <div className="min-h-screen bg-[#131313] text-[#e5e2e1] font-sans flex flex-col selection:bg-[#ffb4ab] selection:text-[#690005]">
          {/* Screen Switcher Floating Widget */}
          {/* <ScreenSwitcher currentScreen={currentScreen} onSelectScreen={onNavigate} /> */}

          {/* Create Event Modal */}
          <CreateEventModal
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onEventCreated={(eventData) => {
              console.log('Event published:', eventData);
            }}
          />

          {/* Admin layout with fixed sidebar or standard header/footer layout */}
          {isAdminScreen ? (
            <div className="flex min-h-screen">
              {/* Admin Sidebar */}
              <AdminSidebar currentScreen={currentScreen} onNavigate={onNavigate} />

              {/* Admin Main Frame */}
              <div className="flex-1 ml-64 flex flex-col min-h-screen">
                <Header
                  currentScreen={currentScreen}
                  onNavigate={onNavigate}
                  onOpenCreateModal={() => setCreateModalOpen(true)}
                />

                <main className="flex-1 pt-[72px] bg-[#131313]">
                  <Outlet />
                </main>
              </div>
            </div>
          ) : (
            <div className="flex flex-col min-h-screen">
              {/* Standard Navigation Header */}
              <Header
                currentScreen={currentScreen}
                onNavigate={onNavigate}
                onOpenCreateModal={() => setCreateModalOpen(true)}
              />

              {/* Main View Container */}
              <main className="flex-1 pt-[72px]">
                <Outlet />
              </main>

              {/* Standard Editorial Technical Footer */}
              <Footer onNavigate={onNavigate} />
            </div>
          )}
        </div>
      </CreateEventModalContext.Provider>
    </AuthProvider>
  );
}
