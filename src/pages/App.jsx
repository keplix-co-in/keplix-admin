import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import DashboardView from '../components/views/DashboardView';
import { ToastProvider } from '../components/ui/toast.jsx';
import FinanceView from '../components/views/FinanceView';
import VendorsView from '../components/views/VendorsView';
import BookingsView from '../components/views/BookingsView';
import AnalyticsView from '../components/views/AnalyticsView';
import UsersView from '../components/views/UsersView';
import SettingsView from '../components/views/SettingsView';
import BlogsView from '../components/views/BlogsView';
import WalkInJobsView from '../components/views/WalkInJobsView';
import HealthComponentsView from '../components/views/HealthComponentsView';
import OffersView from '../components/views/OffersView';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import Login from './Login';
import { isAdminAuthenticated, adminLogout, refreshAdminToken, hasStoredSession, SESSION_ENDED_EVENT } from '../services/authApi';

export default function KeplixAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => isAdminAuthenticated());
  // Distinguishes "known logged out" from "still checking" so a reload with an
  // expired access token doesn't flash the login screen before the silent
  // refresh below has had a chance to run.
  const [checkingSession, setCheckingSession] = useState(() => !isAdminAuthenticated() && hasStoredSession());
  // Was `useState('dashboard')`, driving conditional `activeNav === 'x' &&`
  // renders instead of real routes -- nothing was deep-linkable, bookmarkable,
  // or reachable via the browser back/forward buttons, and a page reload
  // always dropped an admin back to the dashboard regardless of where they'd
  // been. `activeNav` is now derived from the URL itself so the two can never
  // drift apart; navigating is `navigate()` to a real path, not local state.
  const navigate = useNavigate();
  const location = useLocation();
  const activeNav = location.pathname.replace(/^\//, '').split('/')[0] || 'dashboard';
  const setActiveNav = (id) => navigate(`/${id}`);
  const [bookingFilter, setBookingFilter] = useState('All');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Found live: a plain page reload always dropped back to the login screen,
  // even seconds after a successful sign-in with a perfectly valid refresh
  // token still in localStorage. isAdminAuthenticated() only reads the ACCESS
  // token's own short-lived exp claim -- it never attempted to use the
  // refresh token on boot, only reactively inside authFetch() when an actual
  // API call 401s. So every reload cost the admin a fresh login, which real
  // usage will hit constantly. This runs the same silent-refresh path once,
  // on mount, when a token is present but already expired.
  useEffect(() => {
    if (isAuthenticated) return;
    // Also covers a surviving Supabase session whose 'adminToken' mirror is gone.
    if (!hasStoredSession()) return;

    let cancelled = false;
    refreshAdminToken().then((renewed) => {
      if (cancelled) return;
      if (renewed) setIsAuthenticated(true);
      setCheckingSession(false);
    });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // SESSION_EXPIRED / Supabase SIGNED_OUT: authApi has already cleared local
  // state; show the Login screen instead of a dashboard whose calls all fail.
  useEffect(() => {
    const onEnded = () => {
      setIsAuthenticated(false);
      setCheckingSession(false);
    };
    window.addEventListener(SESSION_ENDED_EVENT, onEnded);
    return () => window.removeEventListener(SESSION_ENDED_EVENT, onEnded);
  }, []);

  const handleLogout = async () => {
    // Awaited so the Supabase global sign-out (server-side revocation of this
    // admin's refresh tokens, see adminLogout) is issued before the UI tears
    // down; adminLogout clears local state in its own `finally`, so a failed
    // request still logs the admin out locally.
    await adminLogout();
    setIsAuthenticated(false);
  };

  // Security review 2026-10-28 O-004: this used to console.log the full
  // admin user object on every login; removed. The callback argument is
  // unused now, so it is no longer taken.
  const handleLogin = () => {
    setIsAuthenticated(true);
    setCheckingSession(false);
  };

  if (!isAuthenticated && checkingSession) {
    // A blank frame here beats flashing the login form for the ~100-300ms a
    // silent refresh takes -- reload would otherwise show login, then the
    // dashboard, on every visit past the access token's short life.
    return <div className="h-screen bg-brand-black" />;
  }

  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <Login onLogin={handleLogin} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
    <div className="flex h-screen bg-brand-black font-sans overflow-hidden text-white">
      {/* -- SIDEBAR -- */}
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} onLogout={handleLogout} />

      {/* -- MAIN -- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <Topbar activeNav={activeNav} time={time} setActiveNav={setActiveNav} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/finance" element={<FinanceView />} />
            <Route path="/vendors" element={<VendorsView filter={vendorFilter} setFilter={setVendorFilter} />} />
            <Route path="/bookings" element={<BookingsView filter={bookingFilter} setFilter={setBookingFilter} />} />
            <Route path="/walkins" element={<WalkInJobsView />} />
            <Route path="/health-components" element={<HealthComponentsView />} />
            <Route path="/offers" element={<OffersView />} />
            <Route path="/analytics" element={<AnalyticsView />} />
            <Route path="/users" element={<UsersView />} />
            <Route path="/blogs" element={<BlogsView />} />
            <Route path="/settings" element={<SettingsView />} />
            {/* Unknown path -- back to a known-good screen rather than a blank page. */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
    </ToastProvider>
  );
}

