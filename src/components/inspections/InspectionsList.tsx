import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPlatformInspections } from '../../api/adminServices';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import {
  CalendarCheck,
  Calendar,
  Clock,
  Home,
  User,
  Building,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react';


export const InspectionsList: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: inspectionsData, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'inspections', statusFilter],
    queryFn: () => getPlatformInspections(statusFilter || undefined),
  });

  const inspections = inspectionsData?.inspections || [];

  return (
    <div className="section-container">
      {/* Filter Header */}
      <div className="filter-card">
        <div className="filter-row">
          <div className="filter-group">
            <Filter size={16} className="text-muted" />
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter inspections by status"
            >
              <option value="">All Inspection Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="requested">Requested</option>
              <option value="completed">Completed / Attended</option>
              <option value="missed">Missed</option>
              <option value="cancelled">Cancelled</option>
              <option value="declined">Declined</option>
            </select>
          </div>

          <div className="filter-meta">
            <span className="results-count">
              Found <strong>{inspections.length}</strong> booking{inspections.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card mt-4">
        {isLoading ? (
          <div className="p-8">
            <div className="table-skeleton" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-danger font-medium">Failed to load platform inspections</p>
            <p className="text-muted text-sm mt-1">{(error as Error)?.message}</p>
          </div>
        ) : inspections.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No inspections found"
            description={
              statusFilter
                ? `No inspections match the status filter "${statusFilter}".`
                : 'There are currently no inspection appointments placed on the platform.'
            }
            actionLabel={statusFilter ? 'Clear Filter' : undefined}
            onAction={() => setStatusFilter('')}
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hostel Property</th>
                  <th>Student Participant</th>
                  <th>Provider / Host</th>
                  <th>Scheduled Date & Time</th>
                  <th>Booking Status</th>
                  <th>Student Decision</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((insp) => {
                  const propertyTitle =
                    typeof insp.propertyId === 'object' && insp.propertyId?.title
                      ? insp.propertyId.title
                      : `Hostel #${String(insp.propertyId).substring(0, 8)}`;

                  const studentName =
                    typeof insp.studentId === 'object' && insp.studentId?.fullName
                      ? insp.studentId.fullName
                      : 'Verified Student';

                  const providerName =
                    typeof insp.providerId === 'object' && insp.providerId?.businessName
                      ? insp.providerId.businessName
                      : 'Landlord';

                  return (
                    <tr key={insp._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Home size={15} className="text-rose flex-shrink-0" />
                          <span className="font-semibold text-sm" title={propertyTitle}>
                            {propertyTitle}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-2 text-xs">
                          <User size={13} className="text-teal" />
                          <span className="font-medium text-secondary">{studentName}</span>
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-2 text-xs">
                          <Building size={13} className="text-blue" />
                          <span className="font-medium text-secondary">{providerName}</span>
                        </div>
                      </td>

                      <td>
                        <div className="text-xs space-y-0.5">
                          {insp.scheduledAt ? (
                            <div className="flex items-center gap-1.5 text-secondary">
                              <Calendar size={13} className="text-purple" />
                              <span>{new Date(insp.scheduledAt).toLocaleDateString()}</span>
                              <Clock size={12} className="text-muted ml-1" />
                              <span>
                                {new Date(insp.scheduledAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted italic">Slot claimed (awaiting schedule)</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <Badge variant="status" value={insp.status} />
                      </td>

                      <td>
                        {insp.decision === 'accepted' ? (
                          <span className="badge badge-success badge-sm flex items-center gap-1">
                            <CheckCircle2 size={12} /> Accepted
                          </span>
                        ) : insp.decision === 'rejected' ? (
                          <div className="text-xs">
                            <span className="badge badge-danger badge-sm flex items-center gap-1">
                              <XCircle size={12} /> Declined
                            </span>
                            {insp.reason && (
                              <p className="text-muted text-2xs mt-0.5 truncate max-w-xs" title={insp.reason}>
                                &quot;{insp.reason}&quot;
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
