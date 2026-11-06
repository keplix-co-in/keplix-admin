/**
 * Guards the deploy-time security config from security review 2026-10-28:
 *  - O-002: vercel.json must send an enforced CSP + anti-framing headers
 *    (also the mitigation for O-001, tokens kept in localStorage).
 *  - O-003 / O-004: production builds must strip console.log & co.
 * See README.md "Security headers" for the reasoning behind each source.
 */
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import viteConfig from '../../vite.config.js';

const root = path.resolve(import.meta.dirname, '../..');
const vercel = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));

const allHeaders = Object.fromEntries(
  vercel.headers
    .filter((h) => h.source === '/(.*)')
    .flatMap((h) => h.headers)
    .map((h) => [h.key.toLowerCase(), h.value])
);

const csp = Object.fromEntries(
  allHeaders['content-security-policy']
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const [name, ...sources] = d.split(/\s+/);
      return [name, sources];
    })
);

describe('vercel.json security headers (O-002)', () => {
  it('keeps the SPA rewrite', () => {
    expect(vercel.rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }]);
  });

  it('enforces (not report-only) a CSP that blocks inline and third-party script', () => {
    expect(allHeaders['content-security-policy-report-only']).toBeUndefined();
    expect(csp['default-src']).toEqual(["'self'"]);
    expect(csp['script-src']).toEqual(["'self'"]);
    expect(csp['object-src']).toEqual(["'none'"]);
    expect(csp['base-uri']).toEqual(["'self'"]);
    expect(csp['form-action']).toEqual(["'self'"]);
    expect(csp['frame-ancestors']).toEqual(["'none'"]);
  });

  it('only lets the app talk to itself and the backend', () => {
    expect(csp['connect-src']).toEqual([
      "'self'",
      'https://keplix-backend-529844482719.asia-south1.run.app',
    ]);
  });

  it('allows the fonts and images the app actually loads, and nothing broad', () => {
    expect(csp['style-src']).toContain('https://fonts.googleapis.com');
    expect(csp['font-src']).toContain('https://fonts.gstatic.com');
    expect(csp['img-src']).toContain('https://res.cloudinary.com');
    for (const sources of Object.values(csp)) {
      expect(sources).not.toContain('*');
      expect(sources).not.toContain('https:');
      expect(sources).not.toContain("'unsafe-eval'");
    }
  });

  it('sends the other hardening headers', () => {
    expect(allHeaders['x-frame-options']).toBe('DENY');
    expect(allHeaders['x-content-type-options']).toBe('nosniff');
    expect(allHeaders['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(allHeaders['strict-transport-security']).toMatch(/max-age=\d{8,}/);
    expect(allHeaders['permissions-policy']).toMatch(/camera=\(\)/);
  });
});

describe('vite production build strips debug logging (O-003 / O-004)', () => {
  it('marks console.log/info/debug/warn as pure and drops debugger', () => {
    const { rolldownOptions } = viteConfig.build;
    expect(rolldownOptions.treeshake.manualPureFunctions).toEqual(
      expect.arrayContaining(['console.log', 'console.info', 'console.debug', 'console.warn'])
    );
    expect(rolldownOptions.output.minify.compress.dropDebugger).toBe(true);
  });
});
