import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import type { NavTab } from './components/layout/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { UsersList } from './components/users/UsersList';
import { StudentsQueue } from './components/students/StudentsQueue';
import { ProvidersQueue } from './components/providers/ProvidersQueue';
import { PropertiesQueue } from './components/properties/PropertiesQueue';
import { InspectionsList } from './components/inspections/InspectionsList';
import { ReportsList } from './components/reports/ReportsList';
import { ReviewsManagement } from './components/reviews/ReviewsManagement';
import { SchoolsList } from './components/schools/SchoolsList';
import { NotificationsCenter } from './components/notifications/NotificationsCenter';
import { SettingsView } from './components/settings/SettingsView';
import {
  getStudentsQueue,
  getProvidersQueue,
  getPropertiesQueue,
  getReportsQueue,
  getPlatformInspections,
} from './api/adminServices';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch pending counts for live sidebar badges when authenticated
  const { data: pendingStudents } = useQuery({
    queryKey: ['admin', 'students', 'pending-count'],
    queryFn: () => getStudentsQueue('pending'),
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const { data: pendingProviders } = useQuery({
    queryKey: ['admin', 'providers', 'pending-count'],
    queryFn: () => getProvidersQueue('pending'),
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const { data: pendingProperties } = useQuery({
    queryKey: ['admin', 'properties', 'pending-count'],
    queryFn: () => getPropertiesQueue('pending'),
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const { data: requestedInspections } = useQuery({
    queryKey: ['admin', 'inspections', 'pending-count'],
    queryFn: () => getPlatformInspections('requested'),
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const { data: openReports } = useQuery({
    queryKey: ['admin', 'reports', 'open-count'],
    queryFn: () => getReportsQueue('open'),
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const pendingCounts = {
    students: pendingStudents?.students?.length || 0,
    providers: pendingProviders?.providers?.length || 0,
    properties: pendingProperties?.properties?.length || 0,
    inspections: requestedInspections?.inspections?.length || 0,
    reports: openReports?.reports?.length || 0,
  };

  const handleRefreshCurrent = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="fullscreen-loader">
        <div className="loader-box">
          <div className="loader-logo">🏠</div>
          <div className="spinner mt-4" />
          <p className="loader-text">Loading OCHF Admin Portal...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Authenticated View
  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      onRefreshCurrent={handleRefreshCurrent}
      isRefreshing={isRefreshing}
      pendingCounts={pendingCounts}
    >
      {currentTab === 'dashboard' && <DashboardOverview onNavigate={setCurrentTab} />}
      {currentTab === 'users' && <UsersList />}
      {currentTab === 'students' && <StudentsQueue />}
      {currentTab === 'providers' && <ProvidersQueue />}
      {currentTab === 'properties' && <PropertiesQueue />}
      {currentTab === 'inspections' && <InspectionsList />}
      {currentTab === 'reports' && <ReportsList />}
      {currentTab === 'reviews' && <ReviewsManagement />}
      {currentTab === 'schools' && <SchoolsList />}
      {currentTab === 'notifications' && <NotificationsCenter />}
      {currentTab === 'settings' && <SettingsView />}
    </Layout>
  );
};

export default App;
