import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPlatformInspections,
  reviewInspectionBooking,
  cancelInspection,
} from '../../api/adminServices';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Modal } from '../common/Modal';
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
  AlertCircle,
  Mail,
  RefreshCw,
  Phone,
} from 'lucide-react';
import type { Inspection } from '../../types';

export const InspectionsList: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<string>('requested');
  const [inspectionToCancel, setInspectionToCancel] = useState<Inspection | null>(null);
  const [inspectionToApprove, setInspectionToApprove] = useState<Inspection | null>(null);
  const [inspectionToReject, setInspectionToReject] = useState<Inspection | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>(
    'Landlord unavailable or duplicate inspection request.'
  );

  // Pending count query for tab badge
  const { data: requestedData } = useQuery({
    queryKey: ['admin', 'inspections', 'badge-count'],
    queryFn: () => getPlatformInspections('requested'),
  });
  const pendingCount = requestedData?.inspections?.length || 0;

  // Main inspections query
  const queryFilter = statusFilter === 'all' ? undefined : statusFilter || undefined;
  const {
    data: inspectionsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin', 'inspections', statusFilter],
    queryFn: () => getPlatformInspections(queryFilter),
  });

  // Approve Inspection Mutation (PUT /admin/inspections/:id with { status: "confirmed" })
  const approveMutation = useMutation({
    mutationFn: (inspectionId: string) =>
      reviewInspectionBooking(inspectionId, { status: 'confirmed' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inspections'] });
      showToast(
        'success',
        data.message || 'Inspection booking approved and confirmed! Email notifications dispatched.'
      );
      setInspectionToApprove(null);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to approve inspection request');
    },
  });

  // Reject Inspection Mutation (PUT /admin/inspections/:id with { status: "rejected", reason: ... })
  const rejectMutation = useMutation({
    mutationFn: ({ inspectionId, reason }: { inspectionId: string; reason: string }) =>
      reviewInspectionBooking(inspectionId, { status: 'rejected', reason }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inspections'] });
      showToast(
        'success',
        data.message ||
          'Inspection request rejected. The booked time slot has been re-opened for other students.'
      );
      setInspectionToReject(null);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to reject inspection');
    },
  });

  // Cancel Inspection Mutation (DELETE /inspections/:id)
  const cancelMutation = useMutation({
    mutationFn: (inspectionId: string) => cancelInspection(inspectionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inspections'] });
      showToast(
        'success',
        data.message || 'Inspection booking cancelled and time slot released back to open'
      );
      setInspectionToCancel(null);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to cancel inspection (Student ownership required)');
    },
  });

  const inspections = inspectionsData?.inspections || [];

  const handleOpenRejectModal = (insp: Inspection) => {
    setInspectionToReject(insp);
    setRejectionReason('Landlord unavailable or duplicate inspection request.');
  };

  return (
    <div className="section-container">
      {/* Top Filter & Queue Switcher Tabs */}
      <div className="filter-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-theme">
          <div className="tab-group flex flex-wrap gap-1">
            <button
              type="button"
              className={`tab-btn ${statusFilter === 'requested' ? 'tab-btn-active' : ''}`}
              onClick={() => setStatusFilter('requested')}
            >
              <span>Pending Requests</span>
              {pendingCount > 0 && (
                <span className="badge badge-amber badge-sm ml-1.5">{pendingCount}</span>
              )}
            </button>
            <button
              type="button"
              className={`tab-btn ${statusFilter === 'confirmed' ? 'tab-btn-active' : ''}`}
              onClick={() => setStatusFilter('confirmed')}
            >
              Confirmed
            </button>
            <button
              type="button"
              className={`tab-btn ${statusFilter === 'completed' ? 'tab-btn-active' : ''}`}
              onClick={() => setStatusFilter('completed')}
            >
              Completed
            </button>
            <button
              type="button"
              className={`tab-btn ${statusFilter === 'rejected' ? 'tab-btn-active' : ''}`}
              onClick={() => setStatusFilter('rejected')}
            >
              Rejected
            </button>
            <button
              type="button"
              className={`tab-btn ${statusFilter === 'cancelled' ? 'tab-btn-active' : ''}`}
              onClick={() => setStatusFilter('cancelled')}
            >
              Cancelled
            </button>
            <button
              type="button"
              className={`tab-btn ${statusFilter === 'all' ? 'tab-btn-active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Inspections
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh inspection data"
          >
            <RefreshCw size={13} className={isFetching ? 'spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <Filter size={16} className="text-muted" />
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter inspections by status"
            >
              <option value="requested">Pending Requests (awaiting moderation)</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed / Attended</option>
              <option value="rejected">Rejected by Admin</option>
              <option value="cancelled">Cancelled</option>
              <option value="declined">Declined by Student</option>
              <option value="missed">Missed</option>
              <option value="all">All Platform Bookings</option>
            </select>
          </div>

          <div className="filter-meta">
            <span className="results-count">
              Found <strong>{inspections.length}</strong> booking
              {inspections.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Informative Workflow Banner for Pending Queue */}
      {statusFilter === 'requested' && (
        <div className="alert alert-warning mt-3">
          <div className="flex items-start gap-2.5 text-xs">
            <AlertCircle size={16} className="text-warning flex-shrink-0 mt-0.5" />
            <div>
              <strong>Inspection Moderation Workflow:</strong> When students book open inspection
              slots, appointments enter <code>requested</code> status. Review landlord
              availability and either <strong>Approve</strong> (moves status to{' '}
              <code>confirmed</code> and dispatches email notifications) or <strong>Reject</strong>{' '}
              (moves status to <code>rejected</code>, releases time slot back to <code>open</code>,
              and notifies parties).
            </div>
          </div>
        </div>
      )}

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
            title={
              statusFilter === 'requested'
                ? 'No pending inspection requests'
                : 'No inspections found'
            }
            description={
              statusFilter === 'requested'
                ? 'All student booking requests have been reviewed and approved or rejected.'
                : statusFilter
                ? `No inspections match the status filter "${statusFilter}".`
                : 'There are currently no inspection appointments placed on the platform.'
            }
            actionLabel={statusFilter !== 'requested' ? 'View Pending Queue' : undefined}
            onAction={() => setStatusFilter('requested')}
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
                  <th>Decision / Reason</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((insp) => {
                  const propertyTitle =
                    typeof insp.propertyId === 'object' && insp.propertyId?.title
                      ? insp.propertyId.title
                      : `Hostel #${String(insp.propertyId).substring(0, 8)}`;

                  const propertyAddress =
                    typeof insp.propertyId === 'object' && insp.propertyId?.address
                      ? insp.propertyId.address
                      : null;

                  const studentName =
                    typeof insp.studentId === 'object' && insp.studentId?.fullName
                      ? insp.studentId.fullName
                      : 'Verified Student';

                  const studentEmail =
                    typeof insp.studentId === 'object' && insp.studentId?.userId?.email
                      ? insp.studentId.userId.email
                      : null;

                  const studentPhone =
                    typeof insp.studentId === 'object' && insp.studentId?.phone
                      ? insp.studentId.phone
                      : null;

                  const providerName =
                    typeof insp.providerId === 'object' && insp.providerId?.businessName
                      ? insp.providerId.businessName
                      : 'Landlord';

                  const providerPhone =
                    typeof insp.providerId === 'object' && insp.providerId?.phone
                      ? insp.providerId.phone
                      : null;

                  const isRequested = insp.status === 'requested';
                  const canCancel =
                    insp.status !== 'completed' &&
                    insp.status !== 'cancelled' &&
                    insp.status !== 'missed' &&
                    insp.status !== 'rejected';

                  return (
                    <tr key={insp._id}>
                      <td>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 font-semibold text-sm">
                            <Home size={14} className="text-rose flex-shrink-0" />
                            <span className="truncate max-w-xs" title={propertyTitle}>
                              {propertyTitle}
                            </span>
                          </div>
                          {propertyAddress && (
                            <span className="text-xs text-muted truncate max-w-xs mt-0.5">
                              {propertyAddress}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="flex flex-col text-xs">
                          <div className="flex items-center gap-1.5 font-medium text-secondary">
                            <User size={13} className="text-teal" />
                            <span>{studentName}</span>
                          </div>
                          {studentEmail && (
                            <span className="text-muted flex items-center gap-1 text-2xs mt-0.5">
                              <Mail size={11} /> {studentEmail}
                            </span>
                          )}
                          {studentPhone && (
                            <span className="text-muted flex items-center gap-1 text-2xs mt-0.5">
                              <Phone size={11} /> {studentPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="flex flex-col text-xs">
                          <div className="flex items-center gap-1.5 font-medium text-secondary">
                            <Building size={13} className="text-blue" />
                            <span>{providerName}</span>
                          </div>
                          {providerPhone && (
                            <span className="text-muted flex items-center gap-1 text-2xs mt-0.5">
                              <Phone size={11} /> {providerPhone}
                            </span>
                          )}
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
                        {insp.status === 'rejected' ? (
                          <div className="text-xs">
                            <span className="badge badge-danger badge-sm flex items-center gap-1">
                              <XCircle size={12} /> Rejected by Admin
                            </span>
                            {insp.reason && (
                              <p
                                className="text-muted text-2xs mt-1 truncate max-w-xs"
                                title={insp.reason}
                              >
                                &quot;{insp.reason}&quot;
                              </p>
                            )}
                          </div>
                        ) : insp.decision === 'accepted' ? (
                          <span className="badge badge-success badge-sm flex items-center gap-1">
                            <CheckCircle2 size={12} /> Accepted
                          </span>
                        ) : insp.decision === 'rejected' ? (
                          <div className="text-xs">
                            <span className="badge badge-danger badge-sm flex items-center gap-1">
                              <XCircle size={12} /> Declined
                            </span>
                            {insp.reason && (
                              <p
                                className="text-muted text-2xs mt-0.5 truncate max-w-xs"
                                title={insp.reason}
                              >
                                &quot;{insp.reason}&quot;
                              </p>
                            )}
                          </div>
                        ) : insp.status === 'confirmed' ? (
                          <span className="text-xs text-muted flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-info" /> Confirmed
                          </span>
                        ) : (
                          <span className="text-muted text-xs">—</span>
                        )}
                      </td>

                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isRequested && (
                            <>
                              <button
                                type="button"
                                className="btn btn-success btn-sm flex items-center gap-1"
                                title="Approve booking and send confirmation emails (PUT /admin/inspections/:id)"
                                onClick={() => setInspectionToApprove(insp)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle2 size={13} /> Approve
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm flex items-center gap-1"
                                title="Reject booking, reopen slot, and notify student (PUT /admin/inspections/:id)"
                                onClick={() => handleOpenRejectModal(insp)}
                                disabled={rejectMutation.isPending}
                              >
                                <XCircle size={13} /> Reject
                              </button>
                            </>
                          )}

                          {canCancel && !isRequested && (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm flex items-center gap-1"
                              title="Cancel Booking & Release Slot (DELETE /inspections/:id)"
                              onClick={() => setInspectionToCancel(insp)}
                            >
                              <XCircle size={13} /> Cancel Booking
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

      {/* Approve Inspection Confirm Dialog (PUT /admin/inspections/:id with { status: "confirmed" }) */}
      {inspectionToApprove && (
        <ConfirmDialog
          isOpen={!!inspectionToApprove}
          onClose={() => setInspectionToApprove(null)}
          onConfirm={() => approveMutation.mutate(inspectionToApprove._id)}
          title="Approve Inspection Booking"
          message={`Approve inspection booking #${inspectionToApprove._id.substring(
            0,
            8
          )}? This will transition status to 'confirmed' and automatically dispatch confirmation email notifications to both the student and the landlord.`}
          confirmLabel="Approve & Send Notification"
          variant="primary"
          isLoading={approveMutation.isPending}
        />
      )}

      {/* Reject Inspection Dialog (PUT /admin/inspections/:id with { status: "rejected", reason }) */}
      {inspectionToReject && (
        <Modal
          isOpen={!!inspectionToReject}
          onClose={() => setInspectionToReject(null)}
          title="Reject Inspection Booking"
          subtitle={`Inspection #${inspectionToReject._id.substring(0, 8)}`}
          maxWidth="md"
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setInspectionToReject(null)}
                disabled={rejectMutation.isPending}
              >
                Keep Inspection
              </button>
              <button
                type="button"
                className="btn btn-danger flex items-center gap-1.5"
                onClick={() =>
                  rejectMutation.mutate({
                    inspectionId: inspectionToReject._id,
                    reason: rejectionReason.trim(),
                  })
                }
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
              >
                <XCircle size={14} />
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject Booking & Re-open Slot'}
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="alert alert-warning">
              <div className="flex items-start gap-2 text-xs">
                <AlertCircle size={16} className="text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Rejection Effect:</strong> Setting status to <code>rejected</code> will
                  automatically release the booked time slot back to <code>open</code> status,
                  allowing other students to select it, and email notifications will be sent with
                  your provided reason.
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label font-semibold text-xs" htmlFor="rejection-reason">
                Rejection Reason (Sent to Student and Landlord)
              </label>
              <textarea
                id="rejection-reason"
                className="form-input text-xs"
                rows={3}
                placeholder="e.g. Landlord unavailable or duplicate inspection request."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <span className="text-2xs text-muted">
                Be clear and constructive so the student knows why the appointment cannot proceed.
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Inspection Confirm Dialog (DELETE /inspections/:id) */}
      {inspectionToCancel && (
        <ConfirmDialog
          isOpen={!!inspectionToCancel}
          onClose={() => setInspectionToCancel(null)}
          onConfirm={() => cancelMutation.mutate(inspectionToCancel._id)}
          title="Cancel Inspection Booking"
          message={`Are you sure you want to cancel inspection booking #${inspectionToCancel._id.substring(
            0,
            8
          )}? (DELETE /inspections/:id). This releases the booked slot back to 'open' status for other students and sends a cancellation notification.`}
          confirmLabel="Cancel Booking & Free Slot"
          variant="danger"
          isLoading={cancelMutation.isPending}
        />
      )}
    </div>
  );
};

