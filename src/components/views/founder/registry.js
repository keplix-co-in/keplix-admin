import {
  TodayScreen, MessagesScreen, CalendarScreen, AdsScreen, SalesScreen,
  InstagramScreen, YouTubeScreen, ShortcutsScreen, ConnectedAppsScreen,
} from './FounderScreens';

/**
 * Founder screens, in sidebar order. Key = URL segment (/founder/<key>).
 * `group` = the sidebar heading (2026-11-14 light redesign).
 */
export const FOUNDER_SCREENS = {
  today: { label: 'Today', group: 'Home', el: TodayScreen },
  messages: { label: 'Messages', group: 'Messages', el: MessagesScreen },
  calendar: { label: 'Calendar', group: 'Schedule', el: CalendarScreen },
  sales: { label: 'Sales', group: 'Business', el: SalesScreen },
  ads: { label: 'Ads', group: 'Business', el: AdsScreen },
  instagram: { label: 'Instagram', group: 'Business', el: InstagramScreen },
  youtube: { label: 'YouTube', group: 'Business', el: YouTubeScreen },
  shortcuts: { label: 'Quick links', group: 'Setup', el: ShortcutsScreen },
  apps: { label: 'Connected apps', group: 'Setup', el: ConnectedAppsScreen },
};
