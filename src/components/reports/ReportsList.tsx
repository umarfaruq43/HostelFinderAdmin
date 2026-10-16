import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReportsQueue, updateReportStatus } from '../../api/adminServices';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import {
  ShieldAlert,
  CheckCircle,
  Clock,
  Home,
  User,
  XCircle,
  Receipt,
} from 'lucide-react';
import type { Report, ReportStatus } from '../../types';

export const ReportsList: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<ReportStatus | 'all'>('open');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [targetStatus, setTargetStatus] = useState<ReportStatus>('resolved');
  const [resolutionReason, setResolutionReason] = useState<string>('');

  // Query
  const { data: reportsData, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'reports', activeTab],
    queryFn: () => getReportsQueue(activeTab === 'all' ? undefined : activeTab),
  });

  // Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      reportId,
      status,
      reason,
    }: {
      reportId: string;
      status: ReportStatus;
      reason?: string;
    }) => updateReportStatus(reportId, { status, reason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      showToast('success', `Report marked as ${variables.status}`);
      setSelectedReport(null);
      setResolutionReason('');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update report status');
    },
  });

  const handleOpenUpdate = (report: Report, status: ReportStatus) => {
    setSelectedReport(report);
    setTargetStatus(status);
    setResolutionReason('');
  };

  const handleConfirmUpdate = async (reason?: string) => {
    if (!selectedReport) return;
    await updateStatusMutation.mutateAsync({
      reportId: selectedReport._id,
      status: targetStatus,
      reason: reason || resolutionReason || undefined,
    });
  };

  const reports = reportsData?.reports || [];

  return (
    <div className="section-container">
      {/* Tabs */}
      <div className="tabs-container">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'open' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('open')}
        >
          Open Reports
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'investigating' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('investigating')}
        >
          Under Investigation
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'reviewed' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('reviewed')}
        >
          Reviewed
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'resolved' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('resolved')}
        >
          Resolved
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'dismissed' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('dismissed')}
        >
          Dismissed
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'all' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Reports
        </button>
      </div>

      {/* Main Content */}
      <div className="card mt-4">
        {isLoading ? (
          <div className="p-8">
            <div className="table-skeleton" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-danger font-medium">Failed to load reports queue</p>
            <p className="text-muted text-sm mt-1">{(error as Error)?.message}</p>
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={ShieldAlert}
            title={
              activeTab === 'open'
                ? 'No open disputes or reports'
                : 'No reports under this category'
            }
            description={
              activeTab === 'open'
                ? 'Great news! There are no outstanding user complaints or fraud flags.'
                : 'No flagged items exist in the selected state.'
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reported Item / Target</th>
                  <th>Grievance Reason</th>
                  <th>Reported By</th>
                  <th>Filed Date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => {
                  const hasProperty = Boolean(report.propertyId);
                  const propertyTitle =
                    typeof report.propertyId === 'object' && report.propertyId?.title
                      ? report.propertyId.title
                      : report.propertyId
                      ? `Property #${String(report.propertyId).substring(0, 8)}`
                      : null;

                  const targetUserEmail =
                    typeof report.targetUserId === 'object' && report.targetUserId?.email
                      ? report.targetUserId.email
                      : typeof report.targetUserId === 'string'
                      ? `User #${report.targetUserId.substring(0, 8)}`
                      : !hasProperty && typeof report.userId === 'object' && report.userId?.email
                      ? report.userId.email
                      : null;

                  const reporterEmail =
                    typeof report.userId === 'object' && report.userId?.email
                      ? report.userId.email
                      : 'Authenticated User';

                  const canAct = report.status !== 'resolved' && report.status !== 'dismissed';

                  return (
                    <tr key={report._id}>
                      <td>
                        {hasProperty ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <Home size={15} className="text-rose flex-shrink-0" />
                              <span className="font-semibold text-sm truncate max-w-xs" title={propertyTitle || ''}>
                                {propertyTitle}
                              </span>
                            </div>
                            <span className="badge badge-rose badge-xs w-max mt-1">Hostel Listing</span>
                          </div>
                        ) : targetUserEmail ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <User size={15} className="text-amber flex-shrink-0" />
                              <span className="font-semibold text-sm truncate max-w-xs" title={targetUserEmail}>
                                {targetUserEmail}
                              </span>
                            </div>
                            <span className="badge badge-amber badge-xs w-max mt-1">Student / User</span>
                          </div>
                        ) : report.transactionId ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <Receipt size={15} className="text-teal flex-shrink-0" />
                              <span className="font-semibold text-sm font-mono">
                                Tx: #{String(report.transactionId).substring(0, 8)}
                              </span>
                            </div>
                            <span className="badge badge-teal badge-xs w-max mt-1">Rent Transaction</span>
                          </div>
                        ) : (
                          <span className="text-muted text-xs">Platform Entity</span>
                        )}
                      </td>

                      <td>
                        <div className="report-reason-box" title={report.reason}>
                          <span className="text-xs text-secondary line-clamp-2">
                            {report.reason}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-muted">
                          <User size={12} />
                          <span>{reporterEmail}</span>
                        </div>
                      </td>

                      <td>
                        <span className="text-xs text-muted">
                          {new Date(report.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </td>

                      <td>
                        <Badge variant="status" value={report.status} />
                      </td>

                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {canAct && (
                            <>
                              {report.status !== 'investigating' && (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  title="Mark Under Investigation (PUT /admin/reports/:id)"
                                  onClick={() => handleOpenUpdate(report, 'investigating')}
                                >
                                  <Clock size={13} /> Investigate
                                </button>
                              )}

                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                title="Resolve Report & Enforce Action (PUT /admin/reports/:id)"
                                onClick={() => handleOpenUpdate(report, 'resolved')}
                              >
                                <CheckCircle size={13} /> Resolve
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                title="Dismiss Report (PUT /admin/reports/:id)"
                                onClick={() => handleOpenUpdate(report, 'dismissed')}
                              >
                                <XCircle size={13} /> Dismiss
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Update Dialog */}
      {selectedReport && (
        <ConfirmDialog
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          onConfirm={handleConfirmUpdate}
          title={
            targetStatus === 'resolved'
              ? 'Mark Report as Resolved'
              : targetStatus === 'dismissed'
              ? 'Dismiss Report'
              : targetStatus === 'investigating'
              ? 'Move to Investigation'
              : 'Mark as Under Review'
          }
          message={
            targetStatus === 'resolved'
              ? 'Are you sure you want to resolve this report/complaint? This indicates investigation and corrective actions have completed.'
              : targetStatus === 'dismissed'
              ? 'Dismiss this report if it is unfounded, duplicate, or invalid. The reporter will be notified.'
              : 'Move this dispute ticket into active investigation by the admin compliance team.'
          }
          confirmLabel={
            targetStatus === 'resolved'
              ? 'Resolve Report'
              : targetStatus === 'dismissed'
              ? 'Dismiss Report'
              : targetStatus === 'investigating'
              ? 'Start Investigation'
              : 'Mark Under Review'
          }
          variant={
            targetStatus === 'resolved'
              ? 'success'
              : targetStatus === 'dismissed'
              ? 'danger'
              : 'primary'
          }
          requireReason={targetStatus === 'dismissed'}
          reasonPlaceholder="Optional note or reason for this status update..."
          isLoading={updateStatusMutation.isPending}
        />
      )}
    </div>
  );
};
