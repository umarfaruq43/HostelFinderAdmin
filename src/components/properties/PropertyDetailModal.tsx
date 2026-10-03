import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import {
  getPropertyReviews,
  deleteReview,
  deleteSlot,
} from '../../api/adminServices';
import {
  MapPin,
  CheckCircle,
  XCircle,
  Car,
  Compass,
  Building,
  Image as ImageIcon,
  Trash2,
  Star,
  AlertCircle,
} from 'lucide-react';
import type { Property, Review } from '../../types';

interface PropertyDetailModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (property: Property) => void;
  onReject?: (property: Property) => void;
  onDelete?: (property: Property) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onDelete,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'details' | 'reviews' | 'slots'>('details');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Review to delete
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);

  // Slot to delete
  const [slotIdInput, setSlotIdInput] = useState('');
  const [slotToDeleteId, setSlotToDeleteId] = useState<string | null>(null);

  // Fetch reviews for this property
  const { data: reviewsData, isLoading: loadingReviews } = useQuery({
    queryKey: ['property', 'reviews', property?._id],
    queryFn: () => (property ? getPropertyReviews(property._id) : null),
    enabled: !!property && activeSubTab === 'reviews',
  });

  // Delete review mutation (DELETE /reviews/:id)
  const deleteReviewMutation = useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['property', 'reviews', property?._id] });
      showToast('success', data.message || 'Review deleted successfully');
      setReviewToDelete(null);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to delete review (Student owner required)');
    },
  });

  // Delete slot mutation (DELETE /slots/:id)
  const deleteSlotMutation = useMutation({
    mutationFn: (slotId: string) => deleteSlot(slotId),
    onSuccess: (data) => {
      showToast('success', data.message || 'Slot removed successfully');
      setSlotToDeleteId(null);
      setSlotIdInput('');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to remove slot');
    },
  });

  if (!property) return null;

  const photos = property.photos || [];
  const currentPhoto = photos[selectedPhotoIndex]?.url;
  const isPending = property.verificationStatus === 'pending';
  const reviews = reviewsData?.reviews || [];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={property.title}
        subtitle={`Hostel ID: ${property._id}`}
        maxWidth="lg"
        footer={
          <div className="flex justify-between items-center w-full flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="status" value={property.verificationStatus} />
              {onDelete && (
                <button
                  type="button"
                  className="btn btn-ghost-sm text-danger"
                  onClick={() => onDelete(property)}
                  title="Delete Property Listing (DELETE /properties/:id)"
                >
                  <Trash2 size={14} /> Delete Listing
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>

              {isPending && onReject && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => onReject(property)}
                >
                  <XCircle size={16} /> Reject Listing
                </button>
              )}

              {isPending && onApprove && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => onApprove(property)}
                >
                  <CheckCircle size={16} /> Approve & Publish
                </button>
              )}
            </div>
          </div>
        }
      >
        {/* Navigation Tabs inside modal */}
        <div className="tabs-container mb-4">
          <button
            type="button"
            className={`tab-btn ${activeSubTab === 'details' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveSubTab('details')}
          >
            Property Details
          </button>
          <button
            type="button"
            className={`tab-btn ${activeSubTab === 'reviews' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveSubTab('reviews')}
          >
            Reviews & Ratings ({reviewsData?.count ?? '…'})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeSubTab === 'slots' ? 'tab-btn-active' : ''}`}
            onClick={() => setActiveSubTab('slots')}
          >
            Inspection Slots (DELETE /slots/:id)
          </button>
        </div>

        {activeSubTab === 'details' && (
          <div className="property-modal-content space-y-5">
            {/* Photo Gallery preview */}
            {photos.length > 0 ? (
              <div className="gallery-section">
                <div className="gallery-hero">
                  <img
                    src={currentPhoto}
                    alt={property.title}
                    className="gallery-hero-img"
                  />
                </div>
                {photos.length > 1 && (
                  <div className="gallery-thumbs">
                    {photos.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`gallery-thumb-btn ${
                          selectedPhotoIndex === idx ? 'thumb-active' : ''
                        }`}
                        onClick={() => setSelectedPhotoIndex(idx)}
                      >
                        <img src={p.url} alt={`Thumbnail ${idx + 1}`} className="thumb-img" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="photo-placeholder-box">
                <ImageIcon size={32} className="text-muted" />
                <span className="text-xs text-muted mt-1">No photographs provided for this listing</span>
              </div>
            )}

            {/* Pricing & Essential Details */}
            <div className="detail-cards-row">
              <div className="highlight-stat-box">
                <span className="text-xs text-muted font-medium uppercase">Annual Rent</span>
                <span className="text-2xl font-bold text-success">
                  ₦{property.price?.toLocaleString()}
                </span>
              </div>

              {property.distanceFromSchoolKm !== undefined && (
                <div className="highlight-stat-box">
                  <span className="text-xs text-muted font-medium uppercase">Campus Distance</span>
                  <span className="text-xl font-bold text-purple flex items-center gap-1.5">
                    <Compass size={18} /> {property.distanceFromSchoolKm} km
                  </span>
                </div>
              )}

              {property.drivingTimeMinutes !== undefined && (
                <div className="highlight-stat-box">
                  <span className="text-xs text-muted font-medium uppercase">Transit Time</span>
                  <span className="text-xl font-bold text-teal flex items-center gap-1.5">
                    <Car size={18} /> {property.drivingTimeMinutes} mins
                  </span>
                </div>
              )}
            </div>

            {/* Additional charges */}
            {property.additionalCharges && property.additionalCharges.length > 0 && (
              <div className="charges-box">
                <h5 className="charges-title">Mandatory Additional Charges</h5>
                <div className="charges-list">
                  {property.additionalCharges.map((ch, idx) => (
                    <div key={idx} className="charge-item">
                      <span className="text-xs text-secondary">{ch.name}:</span>
                      <span className="text-xs font-semibold">₦{ch.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="description-section">
              <h5 className="font-semibold text-sm mb-1">Description & Accommodation Details</h5>
              <p className="text-sm text-secondary leading-relaxed bg-surface-raised p-3 rounded-lg border border-theme">
                {property.description || 'No description provided.'}
              </p>
            </div>

            {/* Location & Address */}
            <div className="location-section">
              <h5 className="font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                <MapPin size={16} className="text-rose" /> Location
              </h5>
              <p className="text-sm text-secondary">{property.address}</p>
              {property.location?.coordinates && (
                <p className="text-xs font-mono text-muted mt-1">
                  Coordinates: Lat {property.location.coordinates[1]}, Lng {property.location.coordinates[0]}
                </p>
              )}
            </div>

            {/* Amenities list */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="amenities-section">
                <h5 className="font-semibold text-sm mb-2">Amenities Included</h5>
                <div className="amenities-pill-cloud">
                  {property.amenities.map((am, idx) => (
                    <span key={idx} className="amenity-pill">
                      {am}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Landlord information */}
            {property.providerId && (
              <div className="provider-section">
                <h5 className="font-semibold text-sm mb-1 flex items-center gap-1.5">
                  <Building size={16} className="text-blue" /> Landlord / Provider
                </h5>
                <p className="text-sm font-medium">
                  {property.providerId.businessName || 'Provider'}
                </p>
                {property.providerId.phone && (
                  <p className="text-xs text-muted">{property.providerId.phone}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reviews Sub-Tab (DELETE /reviews/:id) */}
        {activeSubTab === 'reviews' && (
          <div className="reviews-subtab space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">Property Reviews & Ratings</h4>
                <p className="text-xs text-muted">
                  Average Rating:{' '}
                  {reviewsData?.avgRating !== null && reviewsData?.avgRating !== undefined ? (
                    <span className="font-bold text-amber">★ {reviewsData.avgRating.toFixed(1)}/5</span>
                  ) : (
                    'No ratings yet'
                  )}
                </p>
              </div>
              <span className="badge badge-info badge-sm">DELETE /reviews/:id</span>
            </div>

            {loadingReviews ? (
              <div className="skeleton h-24" />
            ) : reviews.length === 0 ? (
              <div className="p-8 text-center text-muted border border-dashed border-theme rounded-lg">
                <Star size={24} className="mx-auto text-amber mb-2" />
                <p className="text-sm font-medium">No reviews submitted yet</p>
                <p className="text-xs text-muted mt-1">
                  Only students with an accepted inspection can post reviews.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => {
                  const authorName =
                    typeof rev.studentId === 'object' && rev.studentId?.fullName
                      ? rev.studentId.fullName
                      : 'Verified Student';

                  return (
                    <div key={rev._id} className="p-3 bg-surface-raised border border-theme rounded-lg flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-primary">{authorName}</span>
                          <span className="text-amber text-xs font-bold">
                            {'★'.repeat(rev.rating)}
                            {'☆'.repeat(5 - rev.rating)}
                          </span>
                          <span className="text-2xs text-muted">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-secondary mt-1">{rev.comment}</p>
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        title="Delete Review (DELETE /reviews/:id)"
                        onClick={() => setReviewToDelete(rev)}
                      >
                        <Trash2 size={13} /> Delete Review
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Slots Sub-Tab (DELETE /slots/:id) */}
        {activeSubTab === 'slots' && (
          <div className="slots-subtab space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold">Inspection Slots Management</h4>
                <p className="text-xs text-muted">
                  Remove open, unbooked inspection slots via <code>DELETE /slots/:id</code>
                </p>
              </div>
              <span className="badge badge-purple badge-sm">Owner Provider Only</span>
            </div>

            <div className="alert alert-info">
              <div className="flex items-start gap-2 text-xs">
                <AlertCircle size={16} className="text-info flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Backend Rule:</strong> The server atomically deletes the slot only if its
                  status is <code>open</code> and owned by the caller. If the slot is already booked,
                  the backend returns <code>409 Conflict</code>.
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="delete-slot-id">
                Slot MongoDB ObjectId to Remove
              </label>
              <div className="flex gap-2">
                <input
                  id="delete-slot-id"
                  type="text"
                  className="form-input font-mono text-xs"
                  placeholder="e.g. 6abd2953a0704e9c7f7c4077"
                  value={slotIdInput}
                  onChange={(e) => setSlotIdInput(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setSlotToDeleteId(slotIdInput.trim())}
                  disabled={!slotIdInput.trim() || deleteSlotMutation.isPending}
                >
                  <Trash2 size={15} /> Remove Slot
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Review Deletion Confirmation Dialog (DELETE /reviews/:id) */}
      {reviewToDelete && (
        <ConfirmDialog
          isOpen={!!reviewToDelete}
          onClose={() => setReviewToDelete(null)}
          onConfirm={() => deleteReviewMutation.mutate(reviewToDelete._id)}
          title="Delete Review"
          message={`Are you sure you want to delete this review? (DELETE /reviews/${reviewToDelete._id}). Note: The backend enforces student author ownership.`}
          confirmLabel="Delete Review"
          variant="danger"
          isLoading={deleteReviewMutation.isPending}
        />
      )}

      {/* Slot Deletion Confirmation Dialog (DELETE /slots/:id) */}
      {slotToDeleteId && (
        <ConfirmDialog
          isOpen={!!slotToDeleteId}
          onClose={() => setSlotToDeleteId(null)}
          onConfirm={() => deleteSlotMutation.mutate(slotToDeleteId)}
          title="Remove Inspection Slot"
          message={`Are you sure you want to remove slot ${slotToDeleteId}? (DELETE /slots/:id). The slot must be open (unbooked) and owned by the provider.`}
          confirmLabel="Remove Slot"
          variant="danger"
          isLoading={deleteSlotMutation.isPending}
        />
      )}
    </>
  );
};
