import { createContext, useContext } from 'react';

/** @type {import('react').Context<null | { show: Function, success: Function, error: Function, info: Function, dismiss: Function }>} */
export const ToastContext = createContext(null);

/**
 * useToast() -> { show, success, error, info, dismiss }
 *
 * Lives in its own module so `toast.jsx` only ever exports a component, which
 * keeps Vite's fast-refresh boundary intact.
 *
 * Falls back to a no-op outside a ToastProvider rather than throwing: a
 * missing provider should not take a whole admin view down.
 */
const NOOP = {
  show: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  dismiss: () => {},
};

export function useToast() {
  return useContext(ToastContext) || NOOP;
}
