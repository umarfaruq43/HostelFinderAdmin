import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProvidersQueue, reviewProviderVerification } from '../../api/adminServices';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import {
  Building2,
  CheckCircle,
  XCircle,
  Eye,
  Mail,
  Phone,
} from 'lucide-react';
import type { ProviderProfile } from '../../types';

export const ProvidersQueue: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected' | ''>('pending');
  const [selectedProviderForAction, setSelectedProviderForAction] = useState<ProviderProfile | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [viewProvider, setViewProvider] = useState<ProviderProfile | null>(null);

  // Queries
  const { data: providersData, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'providers', activeTab],
    queryFn: () => getProvidersQueue(activeTab || undefined),
  });

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: ({
      providerProfileId,
      status,
      reason,
    }: {
      providerProfileId: string;
      status: 'verified' | 'rejected';
      reason?: string;
    }) => reviewProviderVerification(providerProfileId, { status, reason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showToast(
        'success',
        variables.status === 'verified'
          ? 'Provider business accredited and verified'
          : 'Provider application rejected'
      );
      setSelectedProviderForAction(null);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Provider verification update failed');
    },
  });

  const handleOpenApprove = (provider: ProviderProfile) => {
    setSelectedProviderForAction(provider);
    setActionType('approve');
  };

  const handleOpenReject = (provider: ProviderProfile) => {
    setSelectedProviderForAction(provider);
    setActionType('reject');
  };

  const handleConfirmAction = async (reason?: string) => {
    if (!selectedProviderForAction) return;
    const newStatus = actionType === 'approve' ? 'verified' : 'rejected';
    await reviewMutation.mutateAsync({
      providerProfileId: selectedProviderForAction._id,
      status: newStatus,
      reason,
    });
  };

  const providers = providersData?.providers || [];

  return (
    <div className="section-container">
      {/* Queue Tabs */}
      <div className="tabs-container">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'pending' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Accreditation
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'verified' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('verified')}
        >
          Verified Providers
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
          All Providers
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
            <p className="text-danger font-medium">Failed to load provider queue</p>
            <p className="text-muted text-sm mt-1">{(error as Error)?.message}</p>
          </div>
        ) : providers.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={
              activeTab === 'pending'
                ? 'No pending provider applications'
                : 'No provider profiles found'
            }
            description={
              activeTab === 'pending'
                ? 'All landlord credentials and identity verifications have been processed.'
                : 'No provider profiles exist in this state.'
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Business / Landlord</th>
                  <th>Contact Details</th>
                  <th>Accreditation Status</th>
                  <th>Registered</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => {
                  const isPending = provider.verificationStatus === 'pending';

                  return (
                    <tr key={provider._id}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar-circle avatar-provider">
                            {provider.businessName
                              ? provider.businessName.charAt(0).toUpperCase()
                              : 'P'}
                          </div>
                          <div className="user-details">
                            <span className="user-cell-name">
                              {provider.businessName || 'Unnamed Business'}
                            </span>
                            <span className="user-cell-email">
                              ID: {provider._id.substring(0, 10)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="text-xs space-y-1">
                          {provider.userId?.email && (
                            <div className="flex items-center gap-1.5 text-muted">
                              <Mail size={12} />
                              <span>{provider.userId.email}</span>
                            </div>
                          )}
                          {provider.phone && (
                            <div className="flex items-center gap-1.5 text-muted">
                              <Phone size={12} />
                              <span>{provider.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        <Badge variant="status" value={provider.verificationStatus} />
                      </td>

                      <td>
                        <span className="text-xs text-muted">
                          {new Date(provider.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </td>

                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            title="Inspect credentials"
                            onClick={() => setViewProvider(provider)}
                          >
                            <Eye size={13} /> View
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                title="Approve & Verify Landlord"
                                onClick={() => handleOpenApprove(provider)}
                              >
                                <CheckCircle size={13} /> Verify
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                title="Reject Application"
                                onClick={() => handleOpenReject(provider)}
                              >
                                <XCircle size={13} /> Reject
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
      {selectedProviderForAction && (
        <ConfirmDialog
          isOpen={!!selectedProviderForAction}
          onClose={() => setSelectedProviderForAction(null)}
          onConfirm={handleConfirmAction}
          title={
            actionType === 'approve'
              ? `Accredit Landlord: ${selectedProviderForAction.businessName}`
              : `Reject Provider: ${selectedProviderForAction.businessName}`
          }
          message={
            actionType === 'approve'
              ? `Approving this provider will publish their verified status and permit their hostel listings to be reviewed and published to students.`
              : `Rejecting this provider application will request credentials correction.`
          }
          confirmLabel={actionType === 'approve' ? 'Accredit & Verify' : 'Reject Accreditation'}
          variant={actionType === 'approve' ? 'success' : 'danger'}
          requireReason={actionType === 'reject'}
          reasonPlaceholder="Specify reason for accreditation rejection..."
          isLoading={reviewMutation.isPending}
        />
      )}

      {/* Provider Details Modal */}
      {viewProvider && (
        <Modal
          isOpen={!!viewProvider}
          onClose={() => setViewProvider(null)}
          title="Provider Accreditation Profile"
          subtitle={`Provider ID: ${viewProvider._id}`}
          maxWidth="md"
          footer={
            <div className="flex justify-between w-full items-center">
              <Badge variant="status" value={viewProvider.verificationStatus} />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewProvider(null)}
              >
                Close
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Business / Brand Name</span>
                <span className="detail-value">{viewProvider.businessName || '—'}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Account Owner Email</span>
                <span className="detail-value font-mono">
                  {viewProvider.userId?.email || '—'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Contact Phone</span>
                <span className="detail-value">{viewProvider.phone || '—'}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Account Active</span>
                <span className="detail-value">
                  {viewProvider.userId?.isActive ? 'Yes (Active)' : 'No (Suspended)'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Registered Date</span>
                <span className="detail-value">
                  {new Date(viewProvider.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
