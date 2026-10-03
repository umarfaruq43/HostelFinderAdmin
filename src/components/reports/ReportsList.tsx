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
} from 'lucide-react';
import type { Report } from '../../types';

export const ReportsList: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'open' | 'reviewed' | 'resolved' | ''>('open');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [targetStatus, setTargetStatus] = useState<'reviewed' | 'resolved'>('resolved');

  // Query
  const { data: reportsData, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'reports', activeTab],
    queryFn: () => getReportsQueue(activeTab || undefined),
  });

  // Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ reportId, status }: { reportId: string; status: 'reviewed' | 'resolved' }) =>
      updateReportStatus(reportId, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      showToast('success', `Report marked as ${variables.status}`);
      setSelectedReport(null);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update report status');
    },
  });

  const handleOpenUpdate = (report: Report, status: 'reviewed' | 'resolved') => {
    setSelectedReport(report);
    setTargetStatus(status);
  };

  const handleConfirmUpdate = async () => {
    if (!selectedReport) return;
    await updateStatusMutation.mutateAsync({
      reportId: selectedReport._id,
      status: targetStatus,
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
          className={`tab-btn ${activeTab === 'reviewed' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('reviewed')}
        >
          Under Review
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
          className={`tab-btn ${activeTab === '' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('')}
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
                  const propertyTitle =
                    typeof report.propertyId === 'object' && report.propertyId?.title
                      ? report.propertyId.title
                      : report.propertyId
                      ? `Property #${String(report.propertyId).substring(0, 8)}`
                      : 'Platform Entity';

                  const reporterEmail =
                    typeof report.userId === 'object' && report.userId?.email
                      ? report.userId.email
                      : 'Authenticated User';

                  const isOpen = report.status === 'open';

                  return (
                    <tr key={report._id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <Home size={15} className="text-rose flex-shrink-0" />
                          <span className="font-semibold text-sm" title={propertyTitle}>
                            {propertyTitle}
                          </span>
                        </div>
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
                          {isOpen && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              title="Mark as Under Review"
                              onClick={() => handleOpenUpdate(report, 'reviewed')}
                            >
                              <Clock size={13} /> Under Review
                            </button>
                          )}

                          {report.status !== 'resolved' && (
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              title="Mark as Resolved"
                              onClick={() => handleOpenUpdate(report, 'resolved')}
                            >
                              <CheckCircle size={13} /> Resolve
                            </button>
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
              : 'Mark Report as Under Review'
          }
          message={
            targetStatus === 'resolved'
              ? 'Are you sure you want to mark this dispute/complaint as resolved? This indicates investigation and necessary corrective actions have completed.'
              : 'Move this ticket into "Reviewed" status to indicate it is currently under investigation by admin staff.'
          }
          confirmLabel={targetStatus === 'resolved' ? 'Mark Resolved' : 'Mark Under Review'}
          variant={targetStatus === 'resolved' ? 'success' : 'primary'}
          isLoading={updateStatusMutation.isPending}
        />
      )}
    </div>
  );
};
