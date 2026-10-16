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
  FileText,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import type { ProviderProfile } from '../../types';

export const ProvidersQueue: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected' | ''>('pending');
  const [selectedProviderForAction, setSelectedProviderForAction] = useState<ProviderProfile | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [viewProvider, setViewProvider] = useState<ProviderProfile | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast('info', `${label} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

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
                            {provider.fullName && (
                              <span className="text-2xs text-secondary font-medium">
                                Contact: {provider.fullName}
                              </span>
                            )}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="user-cell-email">
                                ID: {provider._id.substring(0, 8)}...
                              </span>
                              {provider.verificationDocUrl && (
                                <span className="badge badge-teal badge-xs flex items-center gap-0.5" title="Government ID document uploaded">
                                  <FileText size={10} /> ID Doc
                                </span>
                              )}
                            </div>
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
                          {provider.bankName && (
                            <div className="flex items-center gap-1.5 text-muted text-2xs">
                              <CreditCard size={11} className="text-teal" />
                              <span>{provider.bankName}</span>
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
          maxWidth="lg"
          footer={
            <div className="flex justify-between w-full items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="status" value={viewProvider.verificationStatus} />
                <span className="text-xs text-muted">
                  {viewProvider.userId?.isActive ? 'Account Active' : 'Account Suspended'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setViewProvider(null)}
                >
                  Close
                </button>

                {viewProvider.verificationStatus === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => {
                        const prov = viewProvider;
                        setViewProvider(null);
                        handleOpenReject(prov);
                      }}
                    >
                      <XCircle size={15} /> Reject Application
                    </button>

                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => {
                        const prov = viewProvider;
                        setViewProvider(null);
                        handleOpenApprove(prov);
                      }}
                    >
                      <CheckCircle size={15} /> Accredit & Verify
                    </button>
                  </>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Business Header Overview */}
            <div className="p-4 rounded-lg bg-surface-raised border border-theme flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="avatar-circle avatar-provider" style={{ width: 44, height: 44, fontSize: 18 }}>
                  {viewProvider.businessName ? viewProvider.businessName.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <h4 className="font-bold text-base text-primary">
                    {viewProvider.businessName || 'Unnamed Business'}
                  </h4>
                  <p className="text-xs text-muted mt-0.5">
                    {viewProvider.fullName ? `Contact Representative: ${viewProvider.fullName}` : 'Landlord / Provider'}
                  </p>
                </div>
              </div>
              <span className="badge badge-info badge-sm flex items-center gap-1 font-mono">
                <ShieldCheck size={13} /> {viewProvider.verificationStatus.toUpperCase()}
              </span>
            </div>

            {/* Section 1: Government Identity & Credentials (API v2) */}
            <div className="card p-4 border border-theme">
              <h5 className="font-semibold text-xs uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-teal" /> Landlord Identity & Government ID (API v2)
              </h5>

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Full Legal Name</span>
                  <span className="detail-value font-medium">
                    {viewProvider.fullName || '—'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Means of Identification</span>
                  <span className="detail-value font-medium">
                    {viewProvider.meansOfIdentification || 'Not specified'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Government ID / NIN Number</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-xs font-bold text-primary">
                      {viewProvider.idNumber || '—'}
                    </span>
                    {viewProvider.idNumber && (
                      <button
                        type="button"
                        className="btn-ghost-xs"
                        onClick={() => handleCopyText(viewProvider.idNumber!, 'ID Number')}
                        title="Copy ID Number"
                      >
                        {copiedField === 'ID Number' ? (
                          <Check size={11} className="text-success" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Government ID Document</span>
                  {viewProvider.verificationDocUrl ? (
                    <div className="mt-1">
                      <a
                        href={viewProvider.verificationDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary btn-xs inline-flex items-center gap-1.5"
                      >
                        <FileText size={12} /> Inspect Uploaded ID Document <ExternalLink size={10} />
                      </a>
                    </div>
                  ) : (
                    <span className="text-xs text-muted flex items-center gap-1 mt-0.5">
                      <AlertCircle size={12} className="text-amber" /> No ID file attached
                    </span>
                  )}
                </div>
              </div>

              {/* Document Image Preview if URL is an image */}
              {viewProvider.verificationDocUrl && (
                <div className="mt-3 pt-3 border-t border-theme">
                  <span className="text-2xs text-muted block mb-1.5 font-medium">Document Preview:</span>
                  <div className="p-2 bg-surface-sunken rounded border border-theme max-h-48 overflow-hidden flex items-center justify-center">
                    <img
                      src={viewProvider.verificationDocUrl}
                      alt="Government ID"
                      className="max-h-44 object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Payout Banking Information (API v2) */}
            <div className="card p-4 border border-theme">
              <h5 className="font-semibold text-xs uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
                <CreditCard size={14} className="text-purple" /> Payout Bank Details (API v2)
              </h5>

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Bank Name</span>
                  <span className="detail-value font-semibold text-primary">
                    {viewProvider.bankName || '—'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Payout Account Number</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono text-sm font-bold text-teal">
                      {viewProvider.accountNumber || '—'}
                    </span>
                    {viewProvider.accountNumber && (
                      <button
                        type="button"
                        className="btn-ghost-xs"
                        onClick={() => handleCopyText(viewProvider.accountNumber!, 'Account Number')}
                        title="Copy Account Number"
                      >
                        {copiedField === 'Account Number' ? (
                          <Check size={11} className="text-success" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Contact & System Metadata */}
            <div className="card p-4 border border-theme">
              <h5 className="font-semibold text-xs uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
                <Mail size={14} className="text-blue" /> Contact & Account Metadata
              </h5>

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Account Owner Email</span>
                  <span className="detail-value font-mono text-xs">
                    {viewProvider.userId?.email || '—'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Contact Phone</span>
                  <span className="detail-value font-mono text-xs">
                    {viewProvider.phone || '—'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Account Active Status</span>
                  <span className="detail-value text-xs font-semibold">
                    {viewProvider.userId?.isActive ? (
                      <span className="text-success">Active</span>
                    ) : (
                      <span className="text-danger">Suspended</span>
                    )}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Registration Date</span>
                  <span className="detail-value text-xs">
                    {new Date(viewProvider.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
