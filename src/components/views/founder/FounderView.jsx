import { Navigate, useParams } from 'react-router-dom';
import { FOUNDER_SCREENS } from './registry';

/**
 * Founder dashboard (2026-11-14). Lives inside the admin panel at /founder/*,
 * super_admin only (gated in App.jsx). Read-only: nothing here changes any
 * account. Every screen shows live data only (Sample mode removed 2026-11-15).
 */
export default function FounderView() {
  const { screen } = useParams();
  const entry = FOUNDER_SCREENS[screen];
  if (!entry) return <Navigate to="/founder/today" replace />;
  const Screen = entry.el;
  return <Screen />;
}
