import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const makeJwt = (payload) => {
  const b64 = (o) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
};

// 2026-11 Supabase migration: sign-in/refresh/sign-out go through Supabase.
const sb = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  refreshSession: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(),
}));
vi.mock('../services/supabaseClient.js', () => ({ supabase: { auth: sb } }));

let auth;

beforeEach(async () => {
  localStorage.clear();
  vi.resetModules();
  for (const fn of Object.values(sb)) fn.mockReset();
  sb.signOut.mockResolvedValue({ error: null });
  vi.stubGlobal('fetch', vi.fn());
  auth = await import('../services/authApi.js');
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('isAdminAuthenticated', () => {
  it('returns false when no token is stored', () => {
    expect(auth.isAdminAuthenticated()).toBe(false);
  });

  it('returns false for an expired token', () => {
    localStorage.setItem('adminToken', makeJwt({ exp: Math.floor(Date.now() / 1000) - 60 }));
    expect(auth.isAdminAuthenticated()).toBe(false);
  });

  it('returns true for a token whose exp is in the future', () => {
    localStorage.setItem('adminToken', makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    expect(auth.isAdminAuthenticated()).toBe(true);
  });

  it('returns false for a malformed (non-JWT) token', () => {
    localStorage.setItem('adminToken', 'not-a-jwt');
    expect(auth.isAdminAuthenticated()).toBe(false);
  });

  it('returns false when the payload segment is not valid base64 JSON', () => {
    localStorage.setItem('adminToken', 'aaa.!!!not-base64!!!.ccc');
    expect(auth.isAdminAuthenticated()).toBe(false);
  });

  it('returns false for an empty-string token', () => {
    localStorage.setItem('adminToken', '');
    expect(auth.isAdminAuthenticated()).toBe(false);
  });

  // A-007 (security review 2026-10-28): a token without exp must not be
  // accepted as a never-expiring session.
  it('rejects a well-formed token with no exp claim', () => {
    localStorage.setItem('adminToken', makeJwt({ sub: 'admin-1' }));
    expect(auth.isAdminAuthenticated()).toBe(false);
  });

  it('rejects a token whose exp is not a number', () => {
    localStorage.setItem('adminToken', makeJwt({ sub: 'admin-1', exp: '9999999999' }));
    expect(auth.isAdminAuthenticated()).toBe(false);
  });

  it('rejects a token whose payload decodes to JSON null', () => {
    localStorage.setItem('adminToken', `x.${btoa('null')}.y`);
    expect(auth.isAdminAuthenticated()).toBe(false);
  });

  it('handles base64url payloads containing - and _ characters', () => {
    localStorage.setItem(
      'adminToken',
      makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600, n: 'a~b?c>>>~~~' })
    );
    expect(auth.isAdminAuthenticated()).toBe(true);
  });
});

describe('adminLogin', () => {
  it('signs in with Supabase, loads /admin/auth/me and stores token + user', async () => {
    sb.signInWithPassword.mockResolvedValue({ data: { session: { access_token: 'sb-tok' } }, error: null });
    fetch.mockResolvedValue({ ok: true, json: async () => ({ user: { id: 1, role: 'admin', email: 'a@x.com' } }) });
    localStorage.setItem('adminRefreshToken', 'legacy');

    const out = await auth.adminLogin('a@x.com', 'pw');

    expect(sb.signInWithPassword).toHaveBeenCalledWith({ email: 'a@x.com', password: 'pw' });
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe('http://test.local/api/admin/auth/me');
    expect(opts.headers.Authorization).toBe('Bearer sb-tok');
    expect(out).toEqual({ user: { id: 1, role: 'admin', email: 'a@x.com' }, accessToken: 'sb-tok' });
    expect(localStorage.getItem('adminToken')).toBe('sb-tok');
    expect(JSON.parse(localStorage.getItem('adminUser')).role).toBe('admin');
    expect(localStorage.getItem('adminRefreshToken')).toBeNull();
  });

  it('wrong password -> generic message, nothing stored', async () => {
    sb.signInWithPassword.mockResolvedValue({ data: { session: null }, error: { message: 'Invalid login credentials' } });
    await expect(auth.adminLogin('a@x.com', 'bad')).rejects.toThrow('Invalid email or password');
    expect(fetch).not.toHaveBeenCalled();
    expect(localStorage.getItem('adminToken')).toBeNull();
  });

  it('valid Supabase user who is not an admin -> signed out, rejected', async () => {
    sb.signInWithPassword.mockResolvedValue({ data: { session: { access_token: 'sb-tok' } }, error: null });
    fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    await expect(auth.adminLogin('c@x.com', 'pw')).rejects.toThrow('does not have admin access');
    expect(sb.signOut).toHaveBeenCalled();
    expect(localStorage.getItem('adminToken')).toBeNull();
    expect(localStorage.getItem('adminUser')).toBeNull();
  });

  it('never sends the password to the Keplix backend', async () => {
    sb.signInWithPassword.mockResolvedValue({ data: { session: { access_token: 't' } }, error: null });
    fetch.mockResolvedValue({ ok: true, json: async () => ({ user: { id: 1 } }) });
    await auth.adminLogin('a@x.com', 'secret-pw');
    for (const [, opts] of fetch.mock.calls) expect(JSON.stringify(opts ?? {})).not.toContain('secret-pw');
  });
});

describe('adminLogout', () => {
  const seed = () => {
    localStorage.setItem('adminToken', 'a');
    localStorage.setItem('adminUser', '{}');
    localStorage.setItem('adminRefreshToken', 'r');
  };

  it('signs out of Supabase and clears local state', async () => {
    seed();
    await auth.adminLogout();
    expect(sb.signOut).toHaveBeenCalled();
    for (const k of ['adminToken', 'adminUser', 'adminRefreshToken']) expect(localStorage.getItem(k)).toBeNull();
  });

  it('still clears local state if Supabase sign-out throws', async () => {
    seed();
    sb.signOut.mockRejectedValue(new Error('network down'));
    await auth.adminLogout();
    expect(localStorage.getItem('adminToken')).toBeNull();
  });

  it('does not call the retired backend logout route', async () => {
    seed();
    await auth.adminLogout();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('refreshAdminToken', () => {
  it('stores and returns the refreshed Supabase token', async () => {
    localStorage.setItem('adminUser', '{"id":1}');
    sb.refreshSession.mockResolvedValue({ data: { session: { access_token: 'new' } }, error: null });
    await expect(auth.refreshAdminToken()).resolves.toBe('new');
    expect(localStorage.getItem('adminToken')).toBe('new');
  });

  it('collapses concurrent refreshes into one call', async () => {
    sb.refreshSession.mockResolvedValue({ data: { session: { access_token: 'new' } }, error: null });
    await Promise.all([auth.refreshAdminToken(), auth.refreshAdminToken()]);
    expect(sb.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('no session -> logs out and returns null', async () => {
    localStorage.setItem('adminToken', 'old');
    sb.refreshSession.mockResolvedValue({ data: { session: null }, error: { message: 'no session' } });
    await expect(auth.refreshAdminToken()).resolves.toBeNull();
    expect(localStorage.getItem('adminToken')).toBeNull();
  });
});

describe('authFetch', () => {
  it('attaches the stored bearer token', async () => {
    localStorage.setItem('adminToken', 'tok');
    const res = { ok: true, status: 200 };
    fetch.mockResolvedValue(res);
    await expect(auth.authFetch('http://x/y')).resolves.toBe(res);
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
  });

  it('on 401 refreshes once via Supabase and retries with the new token', async () => {
    localStorage.setItem('adminToken', 'old');
    localStorage.setItem('adminUser', '{"id":1}');
    sb.refreshSession.mockResolvedValue({ data: { session: { access_token: 'fresh' } }, error: null });
    fetch
      .mockResolvedValueOnce({ status: 401 })
      // L-3: refresh now re-reads /admin/auth/me
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ user: { id: 1 } }) })
      .mockResolvedValueOnce({ status: 200 });
    const r = await auth.authFetch('http://x/y');
    expect(r.status).toBe(200);
    expect(fetch.mock.calls[2][1].headers.Authorization).toBe('Bearer fresh');
  });

  it('throws SESSION_EXPIRED when refresh fails', async () => {
    localStorage.setItem('adminToken', 'old');
    sb.refreshSession.mockResolvedValue({ data: { session: null }, error: { message: 'x' } });
    fetch.mockResolvedValue({ status: 401 });
    await expect(auth.authFetch('http://x/y')).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
  });

  it('authFetchRaw does not force Content-Type', async () => {
    localStorage.setItem('adminToken', 'tok');
    fetch.mockResolvedValue({ status: 200 });
    await auth.authFetchRaw('http://x/y', { method: 'POST' });
    expect(fetch.mock.calls[0][1].headers['Content-Type']).toBeUndefined();
  });
});

describe('getAdminUser', () => {
  it('returns null when nothing is stored', () => {
    expect(auth.getAdminUser()).toBeNull();
  });

  it('parses the stored user JSON', () => {
    localStorage.setItem('adminUser', JSON.stringify({ id: 3 }));
    expect(auth.getAdminUser()).toEqual({ id: 3 });
  });

  it('returns null for corrupt JSON instead of crashing the sidebar', () => {
    localStorage.setItem('adminUser', '{not json');
    expect(auth.getAdminUser()).toBeNull();
  });
});

describe('review fixes 2026-11-06', () => {
  it('refresh restores a missing adminUser from /admin/auth/me', async () => {
    sb.refreshSession.mockResolvedValue({ data: { session: { access_token: 'new' } }, error: null });
    fetch.mockResolvedValue({ ok: true, json: async () => ({ user: { id: 9, role: 'admin' } }) });
    await expect(auth.refreshAdminToken()).resolves.toBe('new');
    expect(JSON.parse(localStorage.getItem('adminUser')).id).toBe(9);
  });

  it('refresh logs out when the session is not an admin', async () => {
    sb.refreshSession.mockResolvedValue({ data: { session: { access_token: 'new' } }, error: null });
    fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
    await expect(auth.refreshAdminToken()).resolves.toBeNull();
    expect(localStorage.getItem('adminToken')).toBeNull();
  });

  it('hasStoredSession sees the Supabase session even without the mirror', () => {
    expect(auth.hasStoredSession()).toBe(false);
    localStorage.setItem('keplix-admin-auth', '{}');
    expect(auth.hasStoredSession()).toBe(true);
  });

  it('listener does not publish a token while login is still checking admin access', async () => {
    const listener = sb.onAuthStateChange.mock.calls[0][0];
    sb.signInWithPassword.mockImplementation(async () => {
      listener('SIGNED_IN', { access_token: 'early' });
      return { data: { session: { access_token: 'early' } }, error: null };
    });
    let seen;
    fetch.mockImplementation(async () => {
      seen = localStorage.getItem('adminToken');
      return { ok: false, status: 401, json: async () => ({}) };
    });
    await expect(auth.adminLogin('c@x.com', 'pw')).rejects.toThrow();
    expect(seen).toBeNull();
  });
});

describe('review fixes 2026-11-07', () => {
  const ok = (body) => ({ ok: true, status: 200, json: async () => body });
  const session = (t = 'new') => ({ data: { session: { access_token: t } }, error: null });

  // M-1
  it('logout revokes server-side with global scope', async () => {
    await auth.adminLogout();
    expect(sb.signOut).toHaveBeenCalledWith({ scope: 'global' });
  });

  it('logout clears local state when Supabase returns an error object', async () => {
    localStorage.setItem('adminToken', 'a');
    sb.signOut.mockResolvedValue({ error: { message: 'boom' } });
    await auth.adminLogout();
    expect(localStorage.getItem('adminToken')).toBeNull();
  });

  it('non-admin login rejection signs out locally only', async () => {
    sb.signInWithPassword.mockResolvedValue(session('t'));
    fetch.mockResolvedValue({ ok: false, status: 403, json: async () => ({}) });
    await expect(auth.adminLogin('a@b.c', 'pw')).rejects.toThrow(/admin access/);
    expect(sb.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  // M-3
  it('isSuperAdmin reflects the stored role', () => {
    expect(auth.isSuperAdmin()).toBe(false);
    localStorage.setItem('adminUser', JSON.stringify({ role: 'admin' }));
    expect(auth.isSuperAdmin()).toBe(false);
    localStorage.setItem('adminUser', JSON.stringify({ role: 'super_admin' }));
    expect(auth.isSuperAdmin()).toBe(true);
  });

  // L-3
  it('refresh re-fetches /me even when a profile is cached, so role changes apply', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ id: 1, role: 'super_admin' }));
    sb.refreshSession.mockResolvedValue(session());
    fetch.mockResolvedValue(ok({ user: { id: 1, role: 'admin' } }));
    await expect(auth.refreshAdminToken()).resolves.toBe('new');
    expect(fetch.mock.calls[0][0]).toMatch(/\/admin\/auth\/me$/);
    expect(JSON.parse(localStorage.getItem('adminUser')).role).toBe('admin');
  });

  it('refresh signs out a cached admin who was suspended (/me 403)', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ id: 1 }));
    sb.refreshSession.mockResolvedValue(session());
    fetch.mockResolvedValue({ ok: false, status: 403, json: async () => ({}) });
    await expect(auth.refreshAdminToken()).resolves.toBeNull();
    expect(localStorage.getItem('adminUser')).toBeNull();
  });

  it('refresh keeps the cached profile when /me is down (5xx / network)', async () => {
    localStorage.setItem('adminUser', JSON.stringify({ id: 1, role: 'admin' }));
    sb.refreshSession.mockResolvedValue(session());
    fetch.mockResolvedValueOnce({ ok: false, status: 503 });
    await expect(auth.refreshAdminToken()).resolves.toBe('new');
    fetch.mockRejectedValueOnce(new Error('offline'));
    await expect(auth.refreshAdminToken()).resolves.toBe('new');
    expect(JSON.parse(localStorage.getItem('adminUser')).id).toBe(1);
  });

  // Previously untested
  it('a second 401 after a successful refresh throws SESSION_EXPIRED', async () => {
    localStorage.setItem('adminToken', 'old');
    localStorage.setItem('adminUser', '{"id":1}');
    sb.refreshSession.mockResolvedValue(session('fresh'));
    fetch
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce(ok({ user: { id: 1 } }))
      .mockResolvedValueOnce({ status: 401 });
    await expect(auth.authFetch('http://x/y')).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
    expect(sb.refreshSession).toHaveBeenCalledTimes(1);
  });

  it('SESSION_EXPIRED announces the session end', async () => {
    const onEnded = vi.fn();
    window.addEventListener(auth.SESSION_ENDED_EVENT, onEnded);
    sb.refreshSession.mockResolvedValue({ data: { session: null }, error: { message: 'x' } });
    fetch.mockResolvedValue({ status: 401 });
    await expect(auth.authFetch('http://x/y')).rejects.toMatchObject({ code: 'SESSION_EXPIRED' });
    window.removeEventListener(auth.SESSION_ENDED_EVENT, onEnded);
    expect(onEnded).toHaveBeenCalled();
  });

  it('a SIGNED_OUT event clears local state and announces the session end', () => {
    const onEnded = vi.fn();
    window.addEventListener(auth.SESSION_ENDED_EVENT, onEnded);
    localStorage.setItem('adminToken', 'a');
    localStorage.setItem('adminUser', '{}');
    localStorage.setItem('adminRefreshToken', 'r');
    const listener = sb.onAuthStateChange.mock.calls[0][0];
    listener('SIGNED_OUT', null);
    window.removeEventListener(auth.SESSION_ENDED_EVENT, onEnded);
    for (const k of ['adminToken', 'adminUser', 'adminRefreshToken']) expect(localStorage.getItem(k)).toBeNull();
    expect(onEnded).toHaveBeenCalledTimes(1);
  });
});
