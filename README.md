# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Security headers (vercel.json)

Added 2026-11-05 for security review 2026-10-28 finding **O-002** (no CSP or
framing protection on the admin console). JSON can't carry comments, so the
reasoning lives here; `src/__tests__/securityConfig.test.js` guards it.

- The admin's tokens stay in `localStorage` by owner decision (finding
  **O-001**, accepted risk). The enforced CSP is the mitigation:
  `script-src 'self'` (no inline or third-party script can run) and a
  `connect-src` limited to this origin and the backend, so an injected script
  can't send tokens anywhere else.
- `connect-src` lists only the Cloud Run backend
  (`https://keplix-backend-529844482719.asia-south1.run.app`, the value of
  `VITE_API_URL`). **If `VITE_API_URL` ever changes, update the CSP too**, or
  every API call will be blocked. The admin has no Socket.IO/websocket
  client, so no `wss:` source is allowed.
- `style-src 'unsafe-inline'` is needed for React `style={...}` props, Radix,
  Recharts and Tiptap. `fonts.googleapis.com` / `fonts.gstatic.com` are there
  for the Google Fonts `@import` in `src/index.css`.
- `img-src` allows `'self'`, `data:`, `blob:` (local upload previews) and
  Cloudinary, where uploads are stored. An offer banner URL on another host
  won't show a preview in the admin (it still saves).
- `frame-ancestors 'none'` + `X-Frame-Options: DENY` stop clickjacking on the
  refund/payout buttons.

The production bundle also drops `console.log/info/debug/warn/trace` calls and
`debugger` statements (O-003 / O-004, see `vite.config.js`).
