import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Building2,
  Home,
  CalendarCheck,
  ShieldAlert,
  School,
  Star,
  BellRing,
  Sliders,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'users'
  | 'students'
  | 'providers'
  | 'properties'
  | 'inspections'
  | 'reports'
  | 'reviews'
  | 'schools'
  | 'notifications'
  | 'settings';

interface NavActionItem {
  id: NavTab;
  label: string;
  icon: LucideIcon;
  badge?: number;
  badgeColor?: string;
  group?: never;
}

interface NavGroupItem {
  group: string;
  id?: never;
  label?: never;
  icon?: never;
  badge?: never;
  badgeColor?: never;
}

type NavEntry = NavActionItem | NavGroupItem;

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  pendingCounts?: {
    students?: number;
    providers?: number;
    properties?: number;
    reports?: number;
    inspections?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onCloseMobile,
  pendingCounts = {},
}) => {
  const { user, logout } = useAuth();

  const navItems: NavEntry[] = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      group: 'Moderation & Accounts',
    },
    {
      id: 'users',
      label: 'Users Directory',
      icon: Users,
    },
    {
      id: 'students',
      label: 'Student Queue',
      icon: GraduationCap,
      badge: pendingCounts.students,
      badgeColor: 'amber',
    },
    {
      id: 'providers',
      label: 'Provider Queue',
      icon: Building2,
      badge: pendingCounts.providers,
      badgeColor: 'amber',
    },
    {
      id: 'properties',
      label: 'Property Listings',
      icon: Home,
      badge: pendingCounts.properties,
      badgeColor: 'rose',
    },
    {
      group: 'Operations & Safety',
    },
    {
      id: 'inspections',
      label: 'Inspections',
      icon: CalendarCheck,
      badge: pendingCounts.inspections,
      badgeColor: 'amber',
    },
    {
      id: 'reports',
      label: 'Disputes & Reports',
      icon: ShieldAlert,
      badge: pendingCounts.reports,
      badgeColor: 'rose',
    },
    {
      id: 'reviews',
      label: 'Reviews & Ratings',
      icon: Star,
    },
    {
      id: 'schools',
      label: 'Schools & Campuses',
      icon: School,
    },
    {
      group: 'System & Tools',
    },
    {
      id: 'notifications',
      label: 'Diagnostics & Alerts',
      icon: BellRing,
    },
    {
      id: 'settings',
      label: 'API & Config',
      icon: Sliders,
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <span className="brand-icon">🏠</span>
            <div className="brand-text">
              <span className="brand-title">OCHF Admin</span>
              <span className="brand-tag">HOSTEL FINDER</span>
            </div>
          </div>
          <button
            type="button"
            className="mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-nav-container">
          <nav className="sidebar-nav">
            {navItems.map((item, idx) => {
              if ('group' in item && item.group) {
                return (
                  <div key={`group-${idx}`} className="nav-group-label">
                    {item.group}
                  </div>
                );
              }

              const actionItem = item as NavActionItem;
              const Icon = actionItem.icon;
              const isActive = currentTab === actionItem.id;
              const count = actionItem.badge ?? 0;

              return (
                <button
                  key={actionItem.id}
                  type="button"
                  className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                  onClick={() => {
                    onSelectTab(actionItem.id);
                    onCloseMobile();
                  }}
                >
                  <div className="nav-link-main">
                    <Icon size={18} className="nav-link-icon" />
                    <span>{actionItem.label}</span>
                  </div>
                  {count > 0 && (
                    <span className={`nav-pill pill-${actionItem.badgeColor || 'amber'}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="avatar-circle">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="user-info">
              <span className="user-email" title={user?.email}>
                {user?.email || 'admin@ochf.com'}
              </span>
              <span className="user-role-tag">Super Admin</span>
            </div>
            <button
              type="button"
              className="logout-icon-btn"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
