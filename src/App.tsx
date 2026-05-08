import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { ensureSeed } from './lib/seed';
import { ConfirmProvider } from './components/ConfirmModal';
import { AppToaster } from './components/Toast';
import { AppShell } from './components/AppShell';
import { Tutorial } from './components/Tutorial';

import Marketing from './pages/Marketing';
import Login from './pages/Login';
import EventPublic from './pages/EventPublic';
import Browse from './pages/Browse';
import MyEvents from './pages/MyEvents';
import Organize from './pages/Organize';
import EventEditor from './pages/EventEditor';
import EventManage from './pages/EventManage';
import CheckIn from './pages/CheckIn';
import Billing from './pages/Billing';
import AdminDashboard from './pages/AdminDashboard';
import AdminOutbox from './pages/AdminOutbox';
import NotFound from './pages/NotFound';
import type { Role } from './lib/types';

function RequireAuth({ allow, children }: { allow?: Role[]; children: React.ReactNode }) {
  const auth = useAuth();
  const loc = useLocation();
  if (!auth.hydrated) {
    return (
      <div className="min-h-screen grid place-items-center bg-paper">
        <div className="font-display text-2xl font-bold animate-pulse">EventDock</div>
      </div>
    );
  }
  if (!auth.user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  if (allow && !allow.includes(auth.user.role)) {
    const redirect = auth.user.role === 'admin' ? '/app/admin' : auth.user.role === 'organizer' ? '/app/organize' : '/app';
    return <Navigate to={redirect} replace />;
  }
  return <>{children}</>;
}

function ShellLayout() {
  return (
    <RequireAuth>
      <AppShell />
      <Tutorial />
    </RequireAuth>
  );
}

export default function App() {
  useEffect(() => {
    ensureSeed();
    useAuth.getState().hydrate();
    const stored = localStorage.getItem('eventdock:theme');
    if (stored === 'dark') document.documentElement.classList.add('dark');
  }, []);

  return (
    <ConfirmProvider>
      <AppToaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Marketing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/e/:slug" element={<EventPublic />} />

          <Route element={<ShellLayout />}>
            <Route path="/app" element={<RequireAuth allow={['attendee', 'organizer', 'admin']}><Browse /></RequireAuth>} />
            <Route path="/app/me" element={<RequireAuth allow={['attendee', 'organizer', 'admin']}><MyEvents /></RequireAuth>} />
            <Route path="/app/organize" element={<RequireAuth allow={['organizer', 'admin']}><Organize /></RequireAuth>} />
            <Route path="/app/organize/new" element={<RequireAuth allow={['organizer', 'admin']}><EventEditor /></RequireAuth>} />
            <Route path="/app/organize/checkin" element={<RequireAuth allow={['organizer', 'admin']}><CheckIn /></RequireAuth>} />
            <Route path="/app/organize/billing" element={<RequireAuth allow={['organizer', 'admin']}><Billing /></RequireAuth>} />
            <Route path="/app/organize/:id" element={<RequireAuth allow={['organizer', 'admin']}><EventManage /></RequireAuth>} />
            <Route path="/app/admin" element={<RequireAuth allow={['admin']}><AdminDashboard /></RequireAuth>} />
            <Route path="/app/admin/outbox" element={<RequireAuth allow={['admin']}><AdminOutbox /></RequireAuth>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ConfirmProvider>
  );
}
