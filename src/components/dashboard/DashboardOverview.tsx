import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  GraduationCap,
  Building2,
  Home,
  CalendarCheck,
  ShieldAlert,
  School,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import {
  getUsers,
  getStudentsQueue,
  getProvidersQueue,
  getPropertiesQueue,
  getPlatformInspections,
  getReportsQueue,
  getAllSchools,
} from '../../api/adminServices';
import type { NavTab } from '../layout/Sidebar';

interface DashboardOverviewProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin', 'users', 'all'],
    queryFn: () => getUsers(),
  });

  const { data: pendingStudents, isLoading: loadingStudents } = useQuery({
    queryKey: ['admin', 'students', 'pending'],
    queryFn: () => getStudentsQueue('pending'),
  });

  const { data: pendingProviders, isLoading: loadingProviders } = useQuery({
    queryKey: ['admin', 'providers', 'pending'],
    queryFn: () => getProvidersQueue('pending'),
  });

  const { data: pendingProperties, isLoading: loadingProperties } = useQuery({
    queryKey: ['admin', 'properties', 'pending'],
    queryFn: () => getPropertiesQueue('pending'),
  });

  const { data: inspectionsData, isLoading: loadingInspections } = useQuery({
    queryKey: ['admin', 'inspections'],
    queryFn: () => getPlatformInspections(),
  });

  const { data: requestedInspections, isLoading: loadingRequested } = useQuery({
    queryKey: ['admin', 'inspections', 'requested-overview'],
    queryFn: () => getPlatformInspections('requested'),
  });

  const { data: openReports, isLoading: loadingReports } = useQuery({
    queryKey: ['admin', 'reports', 'open'],
    queryFn: () => getReportsQueue('open'),
  });

  const { data: schoolsData, isLoading: loadingSchools } = useQuery({
    queryKey: ['schools', 'all'],
    queryFn: () => getAllSchools(),
  });

  const totalUsers = usersData?.users?.length || 0;
  const studentCount = usersData?.users?.filter((u) => u.role === 'student').length || 0;
  const providerCount = usersData?.users?.filter((u) => u.role === 'provider').length || 0;

  const pendingStudentsCount = pendingStudents?.students?.length || 0;
  const pendingProvidersCount = pendingProviders?.providers?.length || 0;
  const pendingPropertiesCount = pendingProperties?.properties?.length || 0;
  const pendingInspectionsCount = requestedInspections?.inspections?.length || 0;
  const openReportsCount = openReports?.reports?.length || 0;
  const totalInspections = inspectionsData?.inspections?.length || 0;
  const totalSchools = schoolsData?.schools?.length || 0;

  return (
    <div className="dashboard-container">
      {/* Top Banner */}
      <div className="hero-banner">
        <div className="hero-content">
          <h2 className="hero-title">Welcome to OCHF Control Center</h2>
          <p className="hero-description">
            Live administration portal for Off-Campus Hostel Finder. Review pending student &
            landlord accreditations, audit property listings, moderate inspection requests, and oversee campus anchors.
          </p>
        </div>
        <div className="hero-actions flex gap-2">
          {pendingInspectionsCount > 0 && (
            <button
              type="button"
              className="btn btn-warning"
              onClick={() => onNavigate('inspections')}
            >
              Review Inspections ({pendingInspectionsCount})
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onNavigate('properties')}
          >
            Review Properties ({pendingPropertiesCount})
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stats-grid">
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          color="purple"
          subtext={`${studentCount} students, ${providerCount} landlords`}
          isLoading={loadingUsers}
          onClick={() => onNavigate('users')}
        />

        <StatCard
          title="Pending Students"
          value={pendingStudentsCount}
          icon={GraduationCap}
          color="amber"
          badge={pendingStudentsCount > 0 ? `${pendingStudentsCount} Awaiting Review` : 'All Clear'}
          badgeType={pendingStudentsCount > 0 ? 'warning' : 'success'}
          isLoading={loadingStudents}
          onClick={() => onNavigate('students')}
        />

        <StatCard
          title="Pending Providers"
          value={pendingProvidersCount}
          icon={Building2}
          color="blue"
          badge={pendingProvidersCount > 0 ? `${pendingProvidersCount} To Verify` : 'Clear'}
          badgeType={pendingProvidersCount > 0 ? 'warning' : 'success'}
          isLoading={loadingProviders}
          onClick={() => onNavigate('providers')}
        />

        <StatCard
          title="Listing Moderation"
          value={pendingPropertiesCount}
          icon={Home}
          color="rose"
          badge={pendingPropertiesCount > 0 ? 'Action Required' : 'Up to Date'}
          badgeType={pendingPropertiesCount > 0 ? 'danger' : 'success'}
          isLoading={loadingProperties}
          onClick={() => onNavigate('properties')}
        />

        <StatCard
          title="Inspection Bookings"
          value={totalInspections}
          icon={CalendarCheck}
          color="teal"
          badge={pendingInspectionsCount > 0 ? `${pendingInspectionsCount} Pending Review` : 'All Clear'}
          badgeType={pendingInspectionsCount > 0 ? 'warning' : 'success'}
          subtext={
            pendingInspectionsCount > 0
              ? `${pendingInspectionsCount} awaiting admin moderation`
              : `${totalInspections} total scheduled/confirmed`
          }
          isLoading={loadingInspections || loadingRequested}
          onClick={() => onNavigate('inspections')}
        />

        <StatCard
          title="Open Reports"
          value={openReportsCount}
          icon={ShieldAlert}
          color="emerald"
          badge={openReportsCount > 0 ? `${openReportsCount} Active Issues` : 'No Issues'}
          badgeType={openReportsCount > 0 ? 'danger' : 'success'}
          isLoading={loadingReports}
          onClick={() => onNavigate('reports')}
        />
      </div>

      {/* Quick Moderation Queues Summary */}
      <div className="grid-2-cols mt-6">
        {/* Properties Awaiting Moderation */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <Home size={18} className="text-rose" />
              <h3 className="card-title">Properties Pending Verification</h3>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('properties')}
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          <div className="card-body p-0">
            {loadingProperties ? (
              <div className="p-6">
                <div className="skeleton h-12 mb-3" />
                <div className="skeleton h-12 mb-3" />
                <div className="skeleton h-12" />
              </div>
            ) : pendingProperties?.properties?.length === 0 ? (
              <div className="p-8 text-center text-muted">
                <CheckCircle2 size={32} className="mx-auto text-success mb-2" />
                <p className="font-medium">No pending property listings</p>
                <p className="text-xs text-muted mt-1">All submitted hostels have been moderated.</p>
              </div>
            ) : (
              <div className="divide-list">
                {pendingProperties?.properties?.slice(0, 4).map((prop) => (
                  <div key={prop._id} className="list-item">
                    <div className="list-item-photo">
                      {prop.photos && prop.photos.length > 0 ? (
                        <img
                          src={prop.photos[0].url}
                          alt={prop.title}
                          className="thumb-img"
                        />
                      ) : (
                        <div className="thumb-placeholder">🏠</div>
                      )}
                    </div>
                    <div className="list-item-info">
                      <h4 className="list-item-title" title={prop.title}>
                        {prop.title}
                      </h4>
                      <p className="list-item-subtitle">
                        ₦{prop.price?.toLocaleString()} • {prop.address}
                      </p>
                    </div>
                    <Badge variant="status" value={prop.verificationStatus} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Student Verifications Queue Preview */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <GraduationCap size={18} className="text-amber" />
              <h3 className="card-title">Student Verifications Queue</h3>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigate('students')}
            >
              View Queue <ArrowRight size={14} />
            </button>
          </div>

          <div className="card-body p-0">
            {loadingStudents ? (
              <div className="p-6">
                <div className="skeleton h-12 mb-3" />
                <div className="skeleton h-12 mb-3" />
                <div className="skeleton h-12" />
              </div>
            ) : pendingStudents?.students?.length === 0 ? (
              <div className="p-8 text-center text-muted">
                <CheckCircle2 size={32} className="mx-auto text-success mb-2" />
                <p className="font-medium">No pending student verifications</p>
                <p className="text-xs text-muted mt-1">All student profiles are verified.</p>
              </div>
            ) : (
              <div className="divide-list">
                {pendingStudents?.students?.slice(0, 4).map((stud) => (
                  <div key={stud._id} className="list-item">
                    <div className="avatar-circle avatar-sm">
                      {stud.fullName?.charAt(0).toUpperCase() || 'S'}
                    </div>
                    <div className="list-item-info">
                      <h4 className="list-item-title">{stud.fullName || 'Student Applicant'}</h4>
                      <p className="list-item-subtitle">
                        {stud.userId?.email || stud.phone || 'No email provided'}
                      </p>
                    </div>
                    <span className="badge badge-warning">
                      <Clock size={12} /> Pending
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campus anchors info */}
      <div className="card mt-6">
        <div className="card-header">
          <div className="card-title-group">
            <School size={18} className="text-purple" />
            <h3 className="card-title">Active University Anchors ({totalSchools})</h3>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('schools')}
          >
            Manage Campuses
          </button>
        </div>
        <div className="card-body">
          {loadingSchools ? (
            <div className="skeleton h-10" />
          ) : (
            <div className="school-pill-cloud">
              {schoolsData?.schools?.map((school) => (
                <div key={school._id} className="school-pill">
                  <span className="school-dot" />
                  <span className="school-name">{school.name}</span>
                  <span className="school-coords">
                    [{school.location?.coordinates?.[1]?.toFixed(3)},{' '}
                    {school.location?.coordinates?.[0]?.toFixed(3)}]
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
