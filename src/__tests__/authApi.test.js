import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const makeJwt = (payload) => {
  const b64 = (o) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
};

let auth;

beforeEach(async () => {
  localStorage.clear();
  vi.resetModules();
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

  it('treats a well-formed token with no exp claim as valid', () => {
    localStorage.setItem('adminToken', makeJwt({ sub: 'admin-1' }));
    expect(auth.isAdminAuthenticated()).toBe(true);
  });

  it('handles base64url payloads containing - and _ characters', () => {
    localStorage.setItem(
      'adminToken',
      makeJwt({ exp: Math.floor(Date.now() / 1000) + 3600, n: 'a~b?c>>>~~~' })
    );
    expect(auth.isAdminAuthenticated()).toBe(true);
  });
});

describe('adminLogout', () => {
  const seed = () => {
    localStorage.setItem('adminToken', 'tok');
    localStorage.setItem('adminRefreshToken', 'refresh-abc');
    localStorage.setItem('adminUser', JSON.stringify({ id: 1 }));
  };

  it('POSTs to /admin/auth/logout with the refresh token in the body', async () => {
    seed();
    fetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    await auth.adminLogout();

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toMatch(/\/admin\/auth\/logout$/);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ refreshToken: 'refresh-abc' });
  });

  it('clears all three localStorage keys', async () => {
    seed();
    fetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    await auth.adminLogout();

    expect(localStorage.getItem('adminToken')).toBeNull();
    expect(localStorage.getItem('adminRefreshToken')).toBeNull();
    expect(localStorage.getItem('adminUser')).toBeNull();
  });

  it('still clears localStorage when the logout fetch REJECTS (finally block)', async () => {
    seed();
    fetch.mockRejectedValue(new Error('network down'));

    await expect(auth.adminLogout()).resolves.toBeUndefined();

    expect(localStorage.getItem('adminToken')).toBeNull();
    expect(localStorage.getItem('adminRefreshToken')).toBeNull();
    expect(localStorage.getItem('adminUser')).toBeNull();
  });

  it('skips the network call but still clears storage when no refresh token exists', async () => {
    localStorage.setItem('adminToken', 'tok');
    localStorage.setItem('adminUser', '{}');

    await auth.adminLogout();

    expect(fetch).not.toHaveBeenCalled();
    expect(localStorage.getItem('adminToken')).toBeNull();
    expect(localStorage.getItem('adminUser')).toBeNull();
  });
});

describe('adminLogin', () => {
  it('stores accessToken, refreshToken and user on success', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        accessToken: 'at',
        refreshToken: 'rt',
        user: { id: 7, email: 'a@b.c' },
      }),
    });

    await auth.adminLogin('a@b.c', 'pw');

    expect(localStorage.getItem('adminToken')).toBe('at');
    expect(localStorage.getItem('adminRefreshToken')).toBe('rt');
    expect(JSON.parse(localStorage.getItem('adminUser'))).toEqual({ id: 7, email: 'a@b.c' });
  });

  it('throws the server message on a non-ok response and stores nothing', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials' }),
    });

    await expect(auth.adminLogin('a@b.c', 'bad')).rejects.toThrow('Invalid credentials');
    expect(localStorage.getItem('adminToken')).toBeNull();
  });
});

describe('refreshAdminToken', () => {
  it('resolves null with no network call when no refresh token is stored', async () => {
    await expect(auth.refreshAdminToken()).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('stores the rotated access + refresh tokens on success', async () => {
    localStorage.setItem('adminRefreshToken', 'old');
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'new-at', refreshToken: 'new-rt' }),
    });

    await expect(auth.refreshAdminToken()).resolves.toBe('new-at');
    expect(localStorage.getItem('adminToken')).toBe('new-at');
    expect(localStorage.getItem('adminRefreshToken')).toBe('new-rt');
  });

  it('collapses concurrent refreshes into a single request', async () => {
    localStorage.setItem('adminRefreshToken', 'old');
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: 'new-at', refreshToken: 'new-rt' }),
    });

    const [a, b] = await Promise.all([auth.refreshAdminToken(), auth.refreshAdminToken()]);

    expect(a).toBe('new-at');
    expect(b).toBe('new-at');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('logs out locally and resolves null when the refresh is rejected', async () => {
    localStorage.setItem('adminToken', 'tok');
    localStorage.setItem('adminRefreshToken', 'old');
    localStorage.setItem('adminUser', '{}');
    fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });

    await expect(auth.refreshAdminToken()).resolves.toBeNull();
    expect(localStorage.getItem('adminToken')).toBeNull();
    expect(localStorage.getItem('adminRefreshToken')).toBeNull();
  });
});

describe('authFetch', () => {
  it('attaches the bearer token and returns a non-401 response untouched', async () => {
    localStorage.setItem('adminToken', 'tok');
    const res = { status: 200 };
    fetch.mockResolvedValue(res);

    await expect(auth.authFetch('http://x/y')).resolves.toBe(res);
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer tok');
  });

  it('throws SESSION_EXPIRED when a 401 cannot be refreshed', async () => {
    localStorage.setItem('adminToken', 'tok');
    fetch.mockResolvedValue({ status: 401 });

    await expect(auth.authFetch('http://x/y')).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
    });
  });

  it('refreshes once and retries the original request after a 401', async () => {
    localStorage.setItem('adminToken', 'old-tok');
    localStorage.setItem('adminRefreshToken', 'rt');
    fetch
      .mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ accessToken: 'fresh' }) })
      .mockResolvedValueOnce({ status: 200 });

    const res = await auth.authFetch('http://x/y');

    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch.mock.calls[2][1].headers.Authorization).toBe('Bearer fresh');
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
});
