import React, { useState, useEffect } from 'react';
import { Sidebar, type NavTab } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastContainer } from '../common/ToastContainer';

interface LayoutProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onRefreshCurrent: () => void;
  isRefreshing?: boolean;
  children: React.ReactNode;
  pendingCounts?: {
    students?: number;
    providers?: number;
    properties?: number;
    reports?: number;
  };
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  onRefreshCurrent,
  isRefreshing,
  children,
  pendingCounts,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('ochf_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ochf_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="app-layout">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        pendingCounts={pendingCounts}
      />

      <div className="main-wrapper">
        <Topbar
          currentTab={currentTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onRefreshCurrent={onRefreshCurrent}
          isRefreshing={isRefreshing}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <main className="content-area">
          <div className="content-container">{children}</div>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
};
