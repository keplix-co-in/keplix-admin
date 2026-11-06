/**
 * Pins the "swallow the error, return an empty collection" contract that the
 * list endpoints rely on. Several views render `list.map(...)` unconditionally,
 * so a refactor that turned any of these into a throw would crash the view.
 *
 * getVendors and getUsers share the same contract: only SESSION_EXPIRED (a
 * dead session that needs re-login) propagates as a throw; every other plain
 * failure (network, 500, bad payload, no token) degrades to an empty list.
 *
 * getBookings USED to share it and deliberately no longer does: an outage
 * rendered as "No bookings found" with no retry. Its only callers
 * (BookingsView via useApiResource, GlobalSearch via Promise.allSettled)
 * both handle a throw, so it now has its own "throws" block below.
 */
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';

const ok = (body) => ({ ok: true, status: 200, json: async () => body, text: async () => '' });
const bad = (status, body = {}) => ({
  ok: false,
  status,
  json: async () => body,
  text: async () => JSON.stringify(body),
});

let vendorsApi, usersApi, blogsApi, healthComponentsApi, offersApi, walkInJobsApi, bookingsApi;

// Flake fix 2026-11-05: the FIRST beforeEach below paid the cold transform of
// all seven service modules (≈3 s on an idle machine), and under load it hit
// the 10 s hookTimeout, failing the first getVendors test. Warm the transform
// cache once here, with its own generous timeout; vi.resetModules() in
// beforeEach still re-evaluates fresh module instances per test, it just no
// longer has to re-transform them.
beforeAll(async () => {
  await Promise.all([
    import('../services/vendorsApi.js'),
    import('../services/usersApi.js'),
    import('../services/blogsApi.js'),
    import('../services/healthComponentsApi.js'),
    import('../services/offersApi.js'),
    import('../services/walkInJobsApi.js'),
    import('../services/bookingsApi.js'),
  ]);
}, 60_000);

beforeEach(async () => {
  localStorage.clear();
  localStorage.setItem('adminToken', 'tok');
  vi.resetModules();
  vi.stubGlobal('fetch', vi.fn());
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});

  vendorsApi = await import('../services/vendorsApi.js');
  usersApi = await import('../services/usersApi.js');
  blogsApi = await import('../services/blogsApi.js');
  healthComponentsApi = await import('../services/healthComponentsApi.js');
  offersApi = await import('../services/offersApi.js');
  walkInJobsApi = await import('../services/walkInJobsApi.js');
  bookingsApi = await import('../services/bookingsApi.js');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe.each([
  ['getVendors', () => vendorsApi.getVendors()],
  ['getUsers', () => usersApi.getUsers()],
])('%s empty-array contract', (_name, call) => {
  // Both calls now go through authFetch, which retries a 401 once after
  // attempting to renew the token. With no refresh token stored, the retry
  // is unrecoverable, so a 401 now surfaces as SESSION_EXPIRED instead of
  // silently degrading to an empty list -- swallowing it was the bug being
  // fixed (see getOfferSlots' equivalent test below for the same contract).
  it('RE-THROWS SESSION_EXPIRED on a 401 instead of degrading it to []', async () => {
    fetch.mockResolvedValue(bad(401));
    await expect(call()).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
  });

  it('returns [] on a 500 rather than throwing', async () => {
    fetch.mockResolvedValue(bad(500));
    await expect(call()).resolves.toEqual([]);
  });

  it('returns [] when fetch rejects (network failure)', async () => {
    fetch.mockRejectedValue(new Error('network down'));
    await expect(call()).resolves.toEqual([]);
  });

  it('returns [] when no admin token is stored, without hitting the network', async () => {
    localStorage.removeItem('adminToken');
    await expect(call()).resolves.toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns [] when the payload is not an array', async () => {
    fetch.mockResolvedValue(ok({ data: [{ id: 1 }] }));
    await expect(call()).resolves.toEqual([]);
  });

  it('passes an array payload through unchanged', async () => {
    fetch.mockResolvedValue(ok([{ id: 1 }, { id: 2 }]));
    await expect(call()).resolves.toHaveLength(2);
  });
});

describe('getBookings throws instead of degrading to []', () => {
  it('RE-THROWS SESSION_EXPIRED on a 401', async () => {
    fetch.mockResolvedValue(bad(401));
    await expect(bookingsApi.getBookings()).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
  });

  it('throws the server message on a 500', async () => {
    fetch.mockResolvedValue(bad(500, { message: 'Bookings fetch failed' }));
    await expect(bookingsApi.getBookings()).rejects.toThrow('Bookings fetch failed');
  });

  it('throws when fetch rejects (network failure)', async () => {
    fetch.mockRejectedValue(new Error('network down'));
    await expect(bookingsApi.getBookings()).rejects.toThrow('network down');
  });

  it('throws when no admin token is stored, without hitting the network', async () => {
    localStorage.removeItem('adminToken');
    await expect(bookingsApi.getBookings()).rejects.toThrow(/log in/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('throws when the payload is not an array', async () => {
    fetch.mockResolvedValue(ok({ data: [{ id: 1 }] }));
    await expect(bookingsApi.getBookings()).rejects.toThrow(/unexpected/i);
  });

  it('passes an array payload through unchanged, with the type filter in the query', async () => {
    fetch.mockResolvedValue(ok([{ id: 1 }, { id: 2 }]));
    await expect(bookingsApi.getBookings('disputed', 2, 10)).resolves.toHaveLength(2);
    expect(String(fetch.mock.calls[0][0])).toContain('type=disputed');
  });
});

describe('resolveDispute', () => {
  it('POSTs the reason to the dispute/resolve route', async () => {
    fetch.mockResolvedValue(ok({ booking: { id: 7, status: 'cancelled' } }));
    await expect(bookingsApi.resolveDispute(7, 'Vendor never showed up')).resolves.toMatchObject({
      booking: { status: 'cancelled' },
    });
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toContain('/admin/bookings/7/dispute/resolve');
    expect(JSON.parse(init.body)).toEqual({ reason: 'Vendor never showed up' });
  });

  it('throws the server message on a 400', async () => {
    fetch.mockResolvedValue(bad(400, { message: 'Please provide a detailed reason (minimum 10 characters)' }));
    await expect(bookingsApi.resolveDispute(7, 'short')).rejects.toThrow(/minimum 10/);
  });
});

describe.each([
  ['getBlogPosts', () => blogsApi.getBlogPosts()],
  ['getHealthComponents', () => healthComponentsApi.getHealthComponents()],
])('%s { data } envelope contract', (_name, call) => {
  it('unwraps json.data on success', async () => {
    fetch.mockResolvedValue(ok({ data: [{ id: 'a' }] }));
    await expect(call()).resolves.toEqual([{ id: 'a' }]);
  });

  it('returns [] when the envelope has no data key', async () => {
    fetch.mockResolvedValue(ok({}));
    await expect(call()).resolves.toEqual([]);
  });

  it('returns [] on a non-ok response', async () => {
    fetch.mockResolvedValue(bad(500));
    await expect(call()).resolves.toEqual([]);
  });

  it('returns [] when fetch rejects', async () => {
    fetch.mockRejectedValue(new Error('boom'));
    await expect(call()).resolves.toEqual([]);
  });
});

describe('getOfferSlots', () => {
  it('unwraps json.data on success', async () => {
    fetch.mockResolvedValue(ok({ data: [{ key: 'home_banner' }] }));
    await expect(offersApi.getOfferSlots()).resolves.toEqual([{ key: 'home_banner' }]);
  });

  it('returns [] on a 500', async () => {
    fetch.mockResolvedValue(bad(500));
    await expect(offersApi.getOfferSlots()).resolves.toEqual([]);
  });

  it('returns [] when fetch rejects', async () => {
    fetch.mockRejectedValue(new Error('boom'));
    await expect(offersApi.getOfferSlots()).resolves.toEqual([]);
  });

  it('RE-THROWS SESSION_EXPIRED instead of degrading it to an empty list', async () => {
    // authFetch 401s, then the refresh fails (no refresh token) -> SESSION_EXPIRED
    fetch.mockResolvedValue({ ...bad(401), status: 401 });
    await expect(offersApi.getOfferSlots()).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
  });
});

describe('walkInJobsApi', () => {
  it('getWalkInJobs returns { data: [], total: 0 } on a non-ok response', async () => {
    fetch.mockResolvedValue(bad(500));
    await expect(walkInJobsApi.getWalkInJobs()).resolves.toEqual({ data: [], total: 0 });
  });

  it('getWalkInJobs returns { data: [], total: 0 } when fetch rejects', async () => {
    fetch.mockRejectedValue(new Error('boom'));
    await expect(walkInJobsApi.getWalkInJobs()).resolves.toEqual({ data: [], total: 0 });
  });

  it('getWalkInAdoption returns { data: [] } when fetch rejects', async () => {
    fetch.mockRejectedValue(new Error('boom'));
    await expect(walkInJobsApi.getWalkInAdoption()).resolves.toEqual({ data: [] });
  });

  it('getWalkInJob (single) THROWS on a non-ok response, unlike the list calls', async () => {
    fetch.mockResolvedValue(bad(404));
    await expect(walkInJobsApi.getWalkInJob('abc')).rejects.toThrow(/404/);
  });
});

describe('mutations still throw (they must not be silently swallowed)', () => {
  it('createHealthComponent throws the server message', async () => {
    fetch.mockResolvedValue(bad(400, { message: 'Name required' }));
    await expect(healthComponentsApi.createHealthComponent({})).rejects.toThrow('Name required');
  });

  it('createBlogPost throws the server message', async () => {
    fetch.mockResolvedValue(bad(400, { message: 'Slug taken' }));
    await expect(blogsApi.createBlogPost({ title: 't' })).rejects.toThrow('Slug taken');
  });

  it('getVendorMetrics throws on a non-ok response', async () => {
    fetch.mockResolvedValue(bad(500));
    await expect(vendorsApi.getVendorMetrics()).rejects.toThrow(/500/);
  });
});
