import { useState, useEffect } from 'react';
import { Icon } from './components/ui/Icon';
import DashboardView from './components/views/DashboardView';
import FinanceView from './components/views/FinanceView';
import VendorsView from './components/views/VendorsView';
import BookingsView from './components/views/BookingsView';
import AnalyticsView from './components/views/AnalyticsView';
import UsersView from './components/views/UsersView';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';

export default function KeplixAdmin() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [bookingFilter, setBookingFilter] = useState('All');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard',  icon: 'dashboard' },
    { id: 'finance',   label: 'Finance',    icon: 'finance'   },
    { id: 'vendors',   label: 'Vendors',    icon: 'vendors'   },
    { id: 'bookings',  label: 'Bookings',   icon: 'bookings'  },
    { id: 'analytics', label: 'Analytics',  icon: 'analytics' },
    { id: 'users',     label: 'Users',      icon: 'users'     },
  ];

  return (
    <div className="flex h-screen bg-brand-black font-sans overflow-hidden text-white">
      {/* -- SIDEBAR -- */}
      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

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
        </div>
      </div>
    </div>
  );
}

