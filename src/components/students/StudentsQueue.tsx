import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudentsQueue, reviewStudentVerification, getAllSchools } from '../../api/adminServices';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import {
  GraduationCap,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Phone,
  School,
} from 'lucide-react';
import type { StudentProfile } from '../../types';

export const StudentsQueue: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected' | ''>('pending');
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<StudentProfile | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [viewStudent, setViewStudent] = useState<StudentProfile | null>(null);

  // Queries
  const { data: studentsData, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'students', activeTab],
    queryFn: () => getStudentsQueue(activeTab || undefined),
  });

  const { data: schoolsData } = useQuery({
    queryKey: ['schools', 'all'],
    queryFn: () => getAllSchools(),
  });

  // Map schoolId to school name
  const getSchoolName = (schoolId?: string | { _id: string; name: string }) => {
    if (!schoolId) return 'Not linked';
    if (typeof schoolId === 'object' && schoolId.name) return schoolId.name;
    const match = schoolsData?.schools?.find((s) => s._id === schoolId);
    return match ? match.name : String(schoolId);
  };

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: ({
      studentProfileId,
      status,
      reason,
    }: {
      studentProfileId: string;
      status: 'verified' | 'rejected';
      reason?: string;
    }) => reviewStudentVerification(studentProfileId, { status, reason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showToast(
        'success',
        variables.status === 'verified'
          ? 'Student profile has been verified and accredited'
          : 'Student verification rejected'
      );
      setSelectedStudentForAction(null);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Verification review failed');
    },
  });

  const handleOpenApprove = (student: StudentProfile) => {
    setSelectedStudentForAction(student);
    setActionType('approve');
  };

  const handleOpenReject = (student: StudentProfile) => {
    setSelectedStudentForAction(student);
    setActionType('reject');
  };

  const handleConfirmAction = async (reason?: string) => {
    if (!selectedStudentForAction) return;
    const newStatus = actionType === 'approve' ? 'verified' : 'rejected';
    await reviewMutation.mutateAsync({
      studentProfileId: selectedStudentForAction._id,
      status: newStatus,
      reason,
    });
  };

  const students = studentsData?.students || [];

  return (
    <div className="section-container">
      {/* Queue Tabs */}
      <div className="tabs-container">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'pending' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Review
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'verified' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('verified')}
        >
          Verified Students
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'rejected' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === '' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('')}
        >
          All Applications
        </button>
      </div>

      {/* Main Content Card */}
      <div className="card mt-4">
        {isLoading ? (
          <div className="p-8">
            <div className="table-skeleton" />
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-danger font-medium">Failed to load student queue</p>
            <p className="text-muted text-sm mt-1">{(error as Error)?.message}</p>
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={
              activeTab === 'pending'
                ? 'No pending student verifications'
                : 'No student profiles found'
            }
            description={
              activeTab === 'pending'
                ? 'All submitted student documents and accounts have been reviewed.'
                : 'There are no student profiles under this category.'
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Campus Institution</th>
                  <th>Contact Info</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th className="text-right">Decision</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const isPending = student.verificationStatus === 'pending';

                  return (
                    <tr key={student._id}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar-circle avatar-student">
                            {student.fullName
                              ? student.fullName.charAt(0).toUpperCase()
                              : 'S'}
                          </div>
                          <div className="user-details">
                            <span className="user-cell-name">
                              {student.fullName || 'Student Applicant'}
                            </span>
                            <span className="user-cell-email">
                              ID: {student._id.substring(0, 10)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-secondary font-medium">
                          <School size={14} className="text-purple flex-shrink-0" />
                          <span>{getSchoolName(student.schoolId)}</span>
                        </div>
                      </td>

                      <td>
                        <div className="text-xs space-y-1">
                          {student.userId?.email && (
                            <div className="flex items-center gap-1.5 text-muted">
                              <Mail size={12} />
                              <span>{student.userId.email}</span>
                            </div>
                          )}
                          {student.phone && (
                            <div className="flex items-center gap-1.5 text-muted">
                              <Phone size={12} />
                              <span>{student.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        <Badge variant="status" value={student.verificationStatus} />
                      </td>

                      <td>
                        <span className="text-xs text-muted">
                          {new Date(student.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </td>

                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            className="btn-action"
                            title="Inspect application details"
                            onClick={() => setViewStudent(student)}
                            aria-label="View student details"
                          >
                            <Eye size={15} />
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                className="btn-action btn-action-success"
                                title="Approve & Verify Student"
                                onClick={() => handleOpenApprove(student)}
                                aria-label="Approve student"
                              >
                                <CheckCircle size={15} />
                              </button>

                              <button
                                type="button"
                                className="btn-action btn-action-danger"
                                title="Reject Application"
                                onClick={() => handleOpenReject(student)}
                                aria-label="Reject student"
                              >
                                <XCircle size={15} />
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

      {/* Decision Confirm Dialog */}
      {selectedStudentForAction && (
        <ConfirmDialog
          isOpen={!!selectedStudentForAction}
          onClose={() => setSelectedStudentForAction(null)}
          onConfirm={handleConfirmAction}
          title={
            actionType === 'approve'
              ? `Approve Student: ${selectedStudentForAction.fullName}`
              : `Reject Student: ${selectedStudentForAction.fullName}`
          }
          message={
            actionType === 'approve'
              ? `Approving this profile grants full student privileges: booking inspection slots, viewing verified landlord details, and submitting reviews.`
              : `Rejecting will mark the application as rejected. Please provide constructive feedback to help the student correct their submission.`
          }
          confirmLabel={actionType === 'approve' ? 'Approve & Verify' : 'Reject Application'}
          variant={actionType === 'approve' ? 'success' : 'danger'}
          requireReason={actionType === 'reject'}
          reasonPlaceholder="Specify reason for rejection (e.g. invalid student ID, blur scan)..."
          isLoading={reviewMutation.isPending}
        />
      )}

      {/* Student Details Drawer / Modal */}
      {viewStudent && (
        <Modal
          isOpen={!!viewStudent}
          onClose={() => setViewStudent(null)}
          title="Student Profile Inspection"
          subtitle={`Profile ID: ${viewStudent._id}`}
          maxWidth="md"
          footer={
            <div className="flex justify-between w-full items-center">
              <Badge variant="status" value={viewStudent.verificationStatus} />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewStudent(null)}
              >
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Full Name</span>
                <span className="detail-value">{viewStudent.fullName || '—'}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Email Address</span>
                <span className="detail-value font-mono">
                  {viewStudent.userId?.email || '—'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Phone Number</span>
                <span className="detail-value">{viewStudent.phone || '—'}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Assigned Campus</span>
                <span className="detail-value font-medium text-purple">
                  {getSchoolName(viewStudent.schoolId)}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Account Active</span>
                <span className="detail-value">
                  {viewStudent.userId?.isActive ? 'Yes (Active)' : 'No (Suspended)'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Registered At</span>
                <span className="detail-value">
                  {new Date(viewStudent.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
