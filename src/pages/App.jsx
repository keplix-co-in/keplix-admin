import { useState, useEffect } from 'react';
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
import { isAdminAuthenticated, adminLogout, refreshAdminToken, getAdminToken } from '../services/authApi';

export default function KeplixAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => isAdminAuthenticated());
  // Distinguishes "known logged out" from "still checking" so a reload with an
  // expired access token doesn't flash the login screen before the silent
  // refresh below has had a chance to run.
  const [checkingSession, setCheckingSession] = useState(() => !isAdminAuthenticated() && !!getAdminToken());
  const [activeNav, setActiveNav] = useState('dashboard');
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
    const staleToken = getAdminToken();
    if (!staleToken) return;

    let cancelled = false;
    refreshAdminToken().then((renewed) => {
      if (cancelled) return;
      if (renewed) setIsAuthenticated(true);
      setCheckingSession(false);
    });
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    // Awaited so the server-side refresh-token revocation is actually issued
    // before the UI tears down; adminLogout clears the local session in its own
    // `finally`, so a failed request still logs the admin out locally.
    await adminLogout();
    setIsAuthenticated(false);
  };

  const handleLogin = (userData) => {
    console.log('User logged in:', userData);
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
          {activeNav === "dashboard" && <DashboardView />}
          {activeNav === "finance" && <FinanceView />}
          {activeNav === "vendors" && <VendorsView filter={vendorFilter} setFilter={setVendorFilter} />}
          {activeNav === "bookings" && <BookingsView filter={bookingFilter} setFilter={setBookingFilter} />}
          {activeNav === "walkins" && <WalkInJobsView />}
          {activeNav === "health-components" && <HealthComponentsView />}
          {activeNav === "offers" && <OffersView />}
          {activeNav === "analytics" && <AnalyticsView />}
          {activeNav === "users" && <UsersView />}
          {activeNav === "blogs" && <BlogsView />}
          {activeNav === "settings" && <SettingsView />}
        </div>
      </div>
    </div>
    </ToastProvider>
  );
}

