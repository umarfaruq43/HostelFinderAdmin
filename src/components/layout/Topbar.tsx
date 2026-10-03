import { Menu, RefreshCw, Sun, Moon, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getBaseUrl } from '../../api/client';
import type { NavTab } from './Sidebar';

interface TopbarProps {
  currentTab: NavTab;
  onOpenMobileSidebar: () => void;
  onRefreshCurrent: () => void;
  isRefreshing?: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const TAB_TITLES: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Platform Overview',
    subtitle: 'Real-time metrics, queue health, and recent activities',
  },
  users: {
    title: 'Users & Roles Directory',
    subtitle: 'Manage student, provider, and administrator accounts',
  },
  students: {
    title: 'Student Verification Queue',
    subtitle: 'Review student profiles, campus eligibility, and proof of enrollment',
  },
  providers: {
    title: 'Provider Accreditation Queue',
    subtitle: 'Verify landlord identities, business legitimacy, and property owners',
  },
  properties: {
    title: 'Property Moderation Queue',
    subtitle: 'Audit new hostel listings, pricing, amenities, and photo galleries',
  },
  inspections: {
    title: 'Platform Inspections',
    subtitle: 'Track property viewing appointments and student booking decisions',
  },
  reports: {
    title: 'Dispute & Flagged Reports',
    subtitle: 'Investigate student complaints, fraudulent listings, and policy violations',
  },
  reviews: {
    title: 'Property Reviews Moderation',
    subtitle: 'Audit verified student reviews and delete violating content (DELETE /reviews/:id)',
  },
  schools: {
    title: 'Schools & Campuses Directory',
    subtitle: 'Manage registered tertiary institutions and proximity anchors',
  },
  notifications: {
    title: 'System Diagnostics & Alerts',
    subtitle: 'Test outbound SMTP email dispatch and broadcast announcements',
  },
  settings: {
    title: 'System & API Settings',
    subtitle: 'Configure backend connection, review JWT tokens, and system health',
  },
};

export const Topbar: React.FC<TopbarProps> = ({
  currentTab,
  onOpenMobileSidebar,
  onRefreshCurrent,
  isRefreshing = false,
  theme,
  onToggleTheme,
}) => {
  const { user } = useAuth();
  const currentInfo = TAB_TITLES[currentTab] || { title: 'Admin Console', subtitle: '' };
  const baseUrl = getBaseUrl();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-hamburger"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>

        <div className="topbar-heading">
          <h1 className="topbar-title">{currentInfo.title}</h1>
          <p className="topbar-subtitle">{currentInfo.subtitle}</p>
        </div>
      </div>

      <div className="topbar-right">
        {/* API Backend indicator */}
        <div className="api-chip" title={`Connected to ${baseUrl}`}>
          <span className="api-pulse-dot" />
          <span className="api-chip-text">
            API: {baseUrl.replace(/^https?:\/\//, '')}
          </span>
        </div>

        {/* Refresh data button */}
        <button
          type="button"
          className="btn-icon"
          onClick={onRefreshCurrent}
          title="Refresh current view"
          disabled={isRefreshing}
          aria-label="Refresh data"
        >
          <RefreshCw size={17} className={isRefreshing ? 'spin-animation' : ''} />
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          className="btn-icon"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User avatar pill */}
        <div className="admin-chip">
          <ShieldCheck size={16} className="text-purple" />
          <span className="admin-chip-email">{user?.email || 'admin@ochf.com'}</span>
        </div>
      </div>
    </header>
  );
};
