/**
 * Render smoke tests for every view in src/components/views.
 *
 * Each view is rendered three ways with its data source mocked:
 *   (i) returning populated data, (ii) returning an empty collection,
 *   (iii) rejecting.
 * None of the three may throw. This is the regression guard for the class of
 * bug where a view declares loading/error/empty states but never renders them
 * (or blindly maps over a non-array).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

vi.mock('../services/vendorsApi', () => ({
  getVendors: vi.fn(),
  getVendorMetrics: vi.fn(),
}));
vi.mock('../services/usersApi', () => ({
  getUsers: vi.fn(),
  deleteUser: vi.fn(),
  getUserMetrics: vi.fn(),
}));
vi.mock('../services/bookingsApi', () => ({
  getBookings: vi.fn(),
  getBookingMetrics: vi.fn(),
  forceCompleteBooking: vi.fn(),
  resolveDispute: vi.fn(),
}));
vi.mock('../services/blogsApi.js', () => ({
  getBlogPosts: vi.fn(),
  createBlogPost: vi.fn(),
  updateBlogPost: vi.fn(),
  deleteBlogPost: vi.fn(),
}));
vi.mock('../services/healthComponentsApi', () => ({
  getHealthComponents: vi.fn(),
  createHealthComponent: vi.fn(),
  updateHealthComponent: vi.fn(),
}));
vi.mock('../services/offersApi', () => ({
  getOfferSlots: vi.fn(),
  saveOfferSlotByKey: vi.fn(),
  createOfferSlot: vi.fn(),
  updateOfferSlot: vi.fn(),
  setOfferSlotTargets: vi.fn(),
  deleteOfferSlot: vi.fn(),
}));
vi.mock('../services/walkInJobsApi', () => ({
  getWalkInJobs: vi.fn(),
  getWalkInJob: vi.fn(),
  getWalkInAdoption: vi.fn(),
}));
vi.mock('../services/platformSettingsApi', () => ({
  getPlatformSettings: vi.fn(),
  updatePlatformSettings: vi.fn(),
}));

import { getVendors } from '../services/vendorsApi';
import { getUsers } from '../services/usersApi';
import { getBookings } from '../services/bookingsApi';
import { getBlogPosts } from '../services/blogsApi.js';
import { getHealthComponents } from '../services/healthComponentsApi';
import { getOfferSlots } from '../services/offersApi';
import { getWalkInJobs, getWalkInAdoption } from '../services/walkInJobsApi';
import { getPlatformSettings } from '../services/platformSettingsApi';

import VendorsView from '../components/views/VendorsView.jsx';
import UsersView from '../components/views/UsersView.jsx';
import BookingsView from '../components/views/BookingsView.jsx';
import BlogsView from '../components/views/BlogsView.jsx';
import HealthComponentsView from '../components/views/HealthComponentsView.jsx';
import OffersView from '../components/views/OffersView.jsx';
import WalkInJobsView from '../components/views/WalkInJobsView.jsx';
import SettingsView from '../components/views/SettingsView.jsx';
import AnalyticsView from '../components/views/AnalyticsView.jsx';
import DashboardView from '../components/views/DashboardView.jsx';
import FinanceView from '../components/views/FinanceView.jsx';

// DashboardView and FinanceView bypass the service layer and call fetch() on
// API_URL directly, so they are driven through a global fetch stub instead.
const jsonResponse = (body) => ({
  ok: true,
  status: 200,
  json: async () => body,
  text: async () => JSON.stringify(body),
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem('adminToken', 'tok');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({})));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Renders and flushes effects; fails the test if anything throws. */
const renderView = async (ui) => {
  let result;
  await act(async () => {
    result = render(ui);
  });
  // let any chained promises settle
  await act(async () => {
    await Promise.resolve();
  });
  return result;
};

const vendorRow = {
  id: 'v1',
  name: 'Speedy Motors',
  category: 'General',
  city: 'Pune',
  bookings: 4,
  rating: 4.5,
  status: 'active',
  earnings: 12000,
};
const userRow = {
  id: 'u1',
  name: 'Asha',
  email: 'a@b.c',
  phone: '9999999999',
  role: 'customer',
  bookings: 2,
  status: 'active',
  joined: new Date().toISOString(),
};
const bookingRow = {
  id: 'b1',
  customer: 'Asha',
  phone: '9999999999',
  vendor: 'Speedy Motors',
  service: 'Oil change',
  slot: new Date().toISOString(),
  amount: 1200,
  fee: 100,
  status: 'pending',
};
const blogRow = {
  id: 'p1',
  title: 'Post',
  slug: 'post',
  status: 'published',
  createdAt: new Date().toISOString(),
  publishedAt: new Date().toISOString(),
};
const healthComponentRow = {
  id: 'h1',
  name: 'Brake pads',
  category: 'Brakes',
  isActive: true,
  sortOrder: 1,
};
const offerSlotRow = {
  id: 'o1',
  key: 'home_banner',
  title: 'Deal',
  subtitle: 'Sub',
  is_active: true,
  starts_at: new Date().toISOString(),
  ends_at: new Date().toISOString(),
  vendor_ids: [],
};
const walkInJobRow = {
  id: 'w1',
  status: 'completed',
  createdAt: new Date().toISOString(),
  vendor: { name: 'Speedy Motors' },
  vehicle: { registration: 'MH12AB1234' },
};

/**
 * cases: { data, empty } are the resolved values for the "populated" and
 * "empty" scenarios; setup(value) wires the mocks.
 */
const views = [
  {
    name: 'VendorsView',
    element: () => <VendorsView filter="all" setFilter={() => {}} />,
    setup: (v) => getVendors.mockImplementation(v),
    data: [vendorRow],
  },
  {
    name: 'UsersView',
    element: () => <UsersView />,
    setup: (v) => getUsers.mockImplementation(v),
    data: [userRow],
  },
  {
    name: 'BookingsView',
    element: () => <BookingsView filter="all" setFilter={() => {}} />,
    setup: (v) => getBookings.mockImplementation(v),
    data: [bookingRow],
  },
  {
    name: 'BlogsView',
    element: () => <BlogsView />,
    setup: (v) => getBlogPosts.mockImplementation(v),
    data: [blogRow],
  },
  {
    name: 'HealthComponentsView',
    element: () => <HealthComponentsView />,
    setup: (v) => getHealthComponents.mockImplementation(v),
    data: [healthComponentRow],
  },
  {
    name: 'OffersView',
    element: () => <OffersView />,
    setup: (v) => getOfferSlots.mockImplementation(v),
    data: [offerSlotRow],
  },
  {
    name: 'WalkInJobsView',
    element: () => <WalkInJobsView />,
    setup: (v) => {
      getWalkInJobs.mockImplementation(async (...a) => {
        const r = await v(...a);
        return { data: r, total: r.length };
      });
      // NOTE: getWalkInAdoption is deliberately NOT driven through the
      // rejecting variant here. WalkInJobsView.jsx:48 calls it as
      // `getWalkInAdoption().then(...)` with no .catch, so a rejection would
      // become an unhandled promise rejection rather than a rendered error
      // state. The service currently swallows its own errors and resolves
      // { data: [] }, which is what is mocked — see the report for this bug.
      getWalkInAdoption.mockResolvedValue({ data: [] });
    },
    data: [{ vendorId: 'v1', vendorName: 'Speedy Motors', jobs: 3, withSheet: 2 }],
  },
  {
    name: 'SettingsView',
    element: () => <SettingsView />,
    setup: (v) =>
      getPlatformSettings.mockImplementation(async (...a) => {
        const r = await v(...a);
        return Array.isArray(r) && r.length === 0
          ? { isHealthSheetRequired: false, healthSheetRequiredFrom: null }
          : r[0];
      }),
    data: [{ isHealthSheetRequired: true, healthSheetRequiredFrom: new Date().toISOString() }],
  },
  {
    name: 'AnalyticsView',
    element: () => <AnalyticsView />,
    setup: () => {},
    data: [],
  },
  {
    name: 'DashboardView',
    element: () => <DashboardView />,
    setup: (v) =>
      fetch.mockImplementation(async () => {
        const r = await v();
        return jsonResponse(Array.isArray(r) && r.length ? r[0] : {});
      }),
    data: [{ totalRevenue: 100, totalBookings: 3, data: [] }],
  },
  {
    name: 'FinanceView',
    element: () => <FinanceView />,
    setup: (v) =>
      fetch.mockImplementation(async () => {
        const r = await v();
        return jsonResponse(Array.isArray(r) && r.length ? r[0] : {});
      }),
    data: [{ totalRevenue: 100, transactions: [], data: [] }],
  },
];

describe.each(views)('$name renders without throwing', ({ element, setup, data }) => {
  it('with populated data', async () => {
    setup(async () => data);
    await renderView(element());
    expect(document.body.textContent.length).toBeGreaterThan(0);
  });

  it('with an empty collection', async () => {
    setup(async () => []);
    await renderView(element());
    expect(document.body.textContent.length).toBeGreaterThan(0);
  });

  it('when the data source rejects', async () => {
    setup(async () => {
      throw new Error('backend unavailable');
    });
    await renderView(element());
    expect(document.body.textContent.length).toBeGreaterThan(0);
  });
});

/**
 * CHARACTERIZATION tests — these pin CURRENT behaviour that is arguably wrong.
 * They are here so the behaviour cannot change unnoticed; see the report.
 */
// These two were originally written as CHARACTERIZATION tests pinning a bug:
// on any failure the dashboard fell through to the hardcoded mock KPIs from
// src/data/DashBoardMock.js and rendered them badged "Live" in green, with no
// error anywhere. The bug is now fixed, so they assert the opposite: no
// fabricated figure may ever reach the screen, and the failure must be visible.
describe('DashboardView failure behaviour', () => {
  it('shows an error instead of the mock KPIs when the metrics endpoint 500s', async () => {
    fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    await renderView(<DashboardView />);

    // The mock value must NOT appear.
    expect(screen.queryByText(/94,000/)).not.toBeInTheDocument();
    expect(screen.getByText(/couldn't load dashboard metrics/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('surfaces an expired session distinctly on 401', async () => {
    fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });

    await renderView(<DashboardView />);

    expect(screen.getByText(/session has expired/i)).toBeInTheDocument();
    expect(screen.queryByText(/94,000/)).not.toBeInTheDocument();
  });

  it('shows an error instead of the mock KPIs when fetch rejects', async () => {
    fetch.mockRejectedValue(new Error('network down'));

    await renderView(<DashboardView />);

    expect(screen.queryByText(/94,000/)).not.toBeInTheDocument();
    expect(screen.getByText(/couldn't load dashboard metrics/i)).toBeInTheDocument();
  });

  it('renders live values when the metrics endpoint succeeds', async () => {
    fetch.mockResolvedValue(jsonResponse({ todayGMV: 123456, bookingsToday: 7 }));

    await renderView(<DashboardView />);

    expect(screen.getByText(/1,23,456/)).toBeInTheDocument();
  });
});

describe('FinanceView failure behaviour', () => {
  // Previously this view degraded to zeroed KPIs and "No pending payouts"
  // with no error banner on a failed fetch -- indistinguishable from a real
  // zero-revenue, zero-payouts day. Now both the KPI grid and the payout
  // queue show an explicit error with a Retry button instead.
  it('shows error states instead of fabricated zeros when the endpoints fail', async () => {
    fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    await renderView(<FinanceView />);

    expect(screen.queryByText(/no pending payouts/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/server returned 500/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /retry/i }).length).toBeGreaterThan(0);
  });
});

describe('WalkInJobsView adoption panel', () => {
  it('renders the adoption panel when getWalkInAdoption returns rows', async () => {
    getWalkInJobs.mockResolvedValue({ data: [walkInJobRow], total: 1 });
    getWalkInAdoption.mockResolvedValue({
      data: [{ vendorId: 'v1', vendorName: 'Speedy Motors', jobs: 3, withSheet: 2 }],
    });

    await renderView(<WalkInJobsView />);

    await waitFor(() => {
      expect(screen.getByText(/adoption by garage/i)).toBeInTheDocument();
    });
  });

  it('hides the adoption panel when adoption comes back empty', async () => {
    getWalkInJobs.mockResolvedValue({ data: [], total: 0 });
    getWalkInAdoption.mockResolvedValue({ data: [] });

    await renderView(<WalkInJobsView />);

    expect(screen.queryByText(/adoption by garage/i)).not.toBeInTheDocument();
  });
});

describe('VendorsView renders its declared loading / error / empty states', () => {
  it('renders an empty state (not a blank table) for an empty vendor list', async () => {
    getVendors.mockResolvedValue([]);
    await renderView(<VendorsView filter="all" setFilter={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/no vendors/i)).toBeInTheDocument();
    });
  });

  it('renders an error state when getVendors rejects', async () => {
    getVendors.mockRejectedValue(new Error('backend unavailable'));
    await renderView(<VendorsView filter="all" setFilter={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/failed|error|unavailable/i)).toBeInTheDocument();
    });
  });
});
