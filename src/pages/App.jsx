import { useState, useEffect } from 'react';
import DashboardView from '../components/views/DashboardView';
import FinanceView from '../components/views/FinanceView';
import VendorsView from '../components/views/VendorsView';
import BookingsView from '../components/views/BookingsView';
import AnalyticsView from '../components/views/AnalyticsView';
import UsersView from '../components/views/UsersView';
import SettingsView from '../components/views/SettingsView';
import { Sidebar } from '../components/layout/Sidebar';
import { Topbar } from '../components/layout/Topbar';
import Login from './Login';

export default function KeplixAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [bookingFilter, setBookingFilter] = useState('All');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

  return (
    <div className="flex h-screen bg-brand-black font-sans overflow-hidden text-white">
      {/* -- SIDEBAR -- */}
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} onLogout={() => setIsAuthenticated(false)} />

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
          {activeNav === "analytics" && <AnalyticsView />}
          {activeNav === "users" && <UsersView />}
          {activeNav === "settings" && <SettingsView />}
        </div>
      </div>
    </div>
  );
}

