import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPropertiesQueue, reviewPropertyListing, deleteProperty } from '../../api/adminServices';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import { PropertyDetailModal } from './PropertyDetailModal';
import {
  Home,
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  Compass,
  Building,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';
import type { Property } from '../../types';

export const PropertiesQueue: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'pending' | 'verified' | 'rejected' | ''>('pending');
  const [selectedPropertyForAction, setSelectedPropertyForAction] = useState<Property | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [viewProperty, setViewProperty] = useState<Property | null>(null);

  // Property to delete (DELETE /properties/:id)
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

  // Queries
  const { data: propertiesData, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'properties', activeTab],
    queryFn: () => getPropertiesQueue(activeTab || undefined),
  });

  // Review mutation (PUT /admin/properties/:propertyId)
  const reviewMutation = useMutation({
    mutationFn: ({
      propertyId,
      status,
      reason,
    }: {
      propertyId: string;
      status: 'verified' | 'rejected';
      reason?: string;
    }) => reviewPropertyListing(propertyId, { status, reason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] });
      showToast(
        'success',
        variables.status === 'verified'
          ? 'Hostel listing approved and published live for students'
          : 'Hostel listing rejected and returned to provider'
      );
      setSelectedPropertyForAction(null);
      if (viewProperty?._id === variables.propertyId) {
        setViewProperty(null);
      }
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Property review failed');
    },
  });

  // Delete property mutation (DELETE /properties/:id)
  const deleteMutation = useMutation({
    mutationFn: (propertyId: string) => deleteProperty(propertyId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] });
      showToast('success', data.message || 'Property listing deleted successfully');
      setPropertyToDelete(null);
      if (viewProperty?._id === propertyToDelete?._id) {
        setViewProperty(null);
      }
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to delete property listing');
    },
  });

  const handleOpenApprove = (prop: Property) => {
    setSelectedPropertyForAction(prop);
    setActionType('approve');
  };

  const handleOpenReject = (prop: Property) => {
    setSelectedPropertyForAction(prop);
    setActionType('reject');
  };

  const handleConfirmAction = async (reason?: string) => {
    if (!selectedPropertyForAction) return;
    const newStatus = actionType === 'approve' ? 'verified' : 'rejected';
    await reviewMutation.mutateAsync({
      propertyId: selectedPropertyForAction._id,
      status: newStatus,
      reason,
    });
  };

  const properties = propertiesData?.properties || [];

  return (
    <div className="section-container">
      {/* Tabs */}
      <div className="tabs-container">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'pending' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Moderation
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'verified' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('verified')}
        >
          Approved & Live
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'rejected' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected Listings
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === '' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('')}
        >
          All Listings
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
            <p className="text-danger font-medium">Failed to load property listings</p>
            <p className="text-muted text-sm mt-1">{(error as Error)?.message}</p>
          </div>
        ) : properties.length === 0 ? (
          <EmptyState
            icon={Home}
            title={
              activeTab === 'pending'
                ? 'No pending hostel listings'
                : 'No properties found'
            }
            description={
              activeTab === 'pending'
                ? 'All submitted accommodations have been reviewed.'
                : 'No properties exist under the selected tab filter.'
            }
          />
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hostel Property</th>
                  <th>Landlord / Business</th>
                  <th>Rent / Price</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((prop) => {
                  const isPending = prop.verificationStatus === 'pending';
                  const firstPhoto = prop.photos?.[0]?.url;

                  return (
                    <tr key={prop._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="property-thumb-wrapper">
                            {firstPhoto ? (
                              <img
                                src={firstPhoto}
                                alt={prop.title}
                                className="property-thumb"
                              />
                            ) : (
                              <div className="property-thumb-placeholder">
                                <ImageIcon size={18} className="text-muted" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="property-cell-title" title={prop.title}>
                              {prop.title}
                            </h4>
                            <div className="flex items-center gap-1 text-xs text-muted mt-0.5">
                              <span>
                                {Array.isArray(prop.propertyType)
                                  ? prop.propertyType.join(', ')
                                  : prop.propertyType || 'Apartment'}
                              </span>
                              {prop.distanceFromSchoolKm !== undefined && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-0.5 text-purple font-medium">
                                    <Compass size={12} /> {prop.distanceFromSchoolKm} km
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-secondary font-medium">
                          <Building size={14} className="text-blue flex-shrink-0" />
                          <span>{prop.providerId?.businessName || 'Independent Provider'}</span>
                        </div>
                      </td>

                      <td>
                        <div className="price-cell">
                          <span className="price-val">₦{prop.price?.toLocaleString()}</span>
                          <span className="price-period">/ session</span>
                        </div>
                      </td>

                      <td>
                        <div className="flex items-start gap-1 text-xs text-muted max-w-xs truncate" title={prop.address}>
                          <MapPin size={13} className="text-rose flex-shrink-0 mt-0.5" />
                          <span className="truncate">{prop.address}</span>
                        </div>
                      </td>

                      <td>
                        <Badge variant="status" value={prop.verificationStatus} />
                      </td>

                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            title="Inspect complete listing"
                            onClick={() => setViewProperty(prop)}
                          >
                            <Eye size={13} /> View
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                title="Approve & Publish Listing"
                                onClick={() => handleOpenApprove(prop)}
                              >
                                <CheckCircle size={13} /> Approve
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline-danger btn-sm"
                                title="Reject Listing"
                                onClick={() => handleOpenReject(prop)}
                              >
                                <XCircle size={13} /> Reject
                              </button>
                            </>
                          )}

                          {/* Delete Property Listing (DELETE /properties/:id) */}
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            title="Delete Property Listing (DELETE /properties/:id)"
                            onClick={() => setPropertyToDelete(prop)}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
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

      {/* Moderation Review Confirm Dialog */}
      {selectedPropertyForAction && (
        <ConfirmDialog
          isOpen={!!selectedPropertyForAction}
          onClose={() => setSelectedPropertyForAction(null)}
          onConfirm={handleConfirmAction}
          title={
            actionType === 'approve'
              ? `Approve Listing: ${selectedPropertyForAction.title}`
              : `Reject Listing: ${selectedPropertyForAction.title}`
          }
          message={
            actionType === 'approve'
              ? `Approving this listing will make it visible in public campus search and allow verified students to book inspection slots.`
              : `Rejecting this listing will withhold it from public search. Please provide the landlord with reason for rejection (e.g. photos don't match, unrealistic pricing, insufficient details).`
          }
          confirmLabel={actionType === 'approve' ? 'Approve & Publish' : 'Reject Listing'}
          variant={actionType === 'approve' ? 'success' : 'danger'}
          requireReason={actionType === 'reject'}
          reasonPlaceholder="Specify moderation reason (e.g. inappropriate photos, misleading address)..."
          isLoading={reviewMutation.isPending}
        />
      )}

      {/* Property Deletion Confirm Dialog (DELETE /properties/:id) */}
      {propertyToDelete && (
        <ConfirmDialog
          isOpen={!!propertyToDelete}
          onClose={() => setPropertyToDelete(null)}
          onConfirm={() => deleteMutation.mutate(propertyToDelete._id)}
          title={`Delete Property: ${propertyToDelete.title}`}
          message={`Are you sure you want to delete this property listing? (DELETE /properties/${propertyToDelete._id}). This deletes the Property document permanently. Note: The backend verifies provider ownership.`}
          confirmLabel="Delete Listing"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      )}

      {/* Detailed Inspection Modal */}
      {viewProperty && (
        <PropertyDetailModal
          property={viewProperty}
          isOpen={!!viewProperty}
          onClose={() => setViewProperty(null)}
          onApprove={handleOpenApprove}
          onReject={handleOpenReject}
          onDelete={(p) => setPropertyToDelete(p)}
        />
      )}
    </div>
  );
};
