import {
  ArrowRightLeft,
  ArrowUpFromLine,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  Package,
  RefreshCw,
  Settings,
  ShoppingCart,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { AuthRoute } from '../appTypes';

export type NavItem = {
  route: AuthRoute;
  label: string;
  mobileLabel?: string;
  Icon: LucideIcon;
};

export const NAV_OPERATIONS: NavItem[] = [
  { route: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { route: 'inventory', label: 'Inventory', Icon: Package },
  { route: 'request-center', label: 'Internal Request Hub', Icon: ClipboardList },
  { route: 'lending', label: 'Internal Lending Hub', Icon: ArrowRightLeft },
  { route: 'release', label: 'Release', Icon: ArrowUpFromLine },
  { route: 'restocking', label: 'Restocking', Icon: RefreshCw },
  { route: 'procurement', label: 'Procurement', Icon: ShoppingCart },
  { route: 'events', label: 'Events', Icon: Calendar },
];

export const NAV_ADMINISTRATION: NavItem[] = [
  { route: 'administration', label: 'Administration', Icon: Settings },
  { route: 'profile', label: 'Profile', Icon: User },
];

export const MOBILE_DOCK: NavItem[] = [
  { route: 'overview', label: 'Overview', Icon: LayoutDashboard },
  { route: 'request-center', label: 'Internal Request Hub', mobileLabel: 'Requests', Icon: ClipboardList },
  { route: 'lending', label: 'Internal Lending Hub', mobileLabel: 'Lending', Icon: ArrowRightLeft },
  { route: 'inventory', label: 'Inventory', Icon: Package },
  { route: 'release', label: 'Release', Icon: ArrowUpFromLine },
];

/** The controller projects this list from server-authorized capabilities. */
export function visibleNavigationItems(items: NavItem[], authorizedRoutes: AuthRoute[]): NavItem[] {
  return items.filter((item) => authorizedRoutes.includes(item.route));
}
