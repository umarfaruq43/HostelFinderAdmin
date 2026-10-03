import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPropertiesQueue, getPropertyReviews, deleteReview } from '../../api/adminServices';
import { useToast } from '../../context/ToastContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import {
  Star,
  Trash2,
  Home,
  MessageSquare,
  Search,
} from 'lucide-react';
import type { Review } from '../../types';

export const ReviewsManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [directReviewId, setDirectReviewId] = useState<string>('');
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null);
  const [directReviewToDelete, setDirectReviewToDelete] = useState<string | null>(null);

  // Fetch properties to choose from
  const { data: propertiesData } = useQuery({
    queryKey: ['admin', 'properties', 'all-for-reviews'],
    queryFn: () => getPropertiesQueue(),
  });

  // Fetch reviews for selected property
  const { data: reviewsData, isLoading: loadingReviews } = useQuery({
    queryKey: ['property', 'reviews', selectedPropertyId],
    queryFn: () => (selectedPropertyId ? getPropertyReviews(selectedPropertyId) : null),
    enabled: !!selectedPropertyId,
  });

  // Delete review mutation (DELETE /reviews/:id)
  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['property', 'reviews', selectedPropertyId] });
      showToast('success', data.message || 'Review deleted successfully');
      setReviewToDelete(null);
      setDirectReviewToDelete(null);
      setDirectReviewId('');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to delete review (Student ownership required)');
    },
  });

  const properties = propertiesData?.properties || [];
  const reviews = reviewsData?.reviews || [];

  return (
    <div className="section-container">
      <div className="grid-2-cols mb-6">
        {/* Selector Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <Home size={18} className="text-purple" />
              <h3 className="card-title">Select Property to Inspect Reviews</h3>
            </div>
            <span className="badge badge-purple badge-sm">Verified Reviews</span>
          </div>

          <div className="card-body space-y-4">
            <div className="form-group">
              <label className="form-label" htmlFor="review-prop-select">
                Select Hostel Listing
              </label>
              <select
                id="review-prop-select"
                className="form-select"
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
              >
                <option value="">— Select a Hostel Property —</option>
                {properties.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title} (₦{p.price?.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {selectedPropertyId && reviewsData && (
              <div className="p-3 bg-surface-raised border border-theme rounded-md text-xs">
                <span className="font-semibold text-secondary">Average Rating: </span>
                {reviewsData.avgRating !== null ? (
                  <span className="font-bold text-amber">★ {reviewsData.avgRating.toFixed(1)} / 5</span>
                ) : (
                  <span className="text-muted">No rating average</span>
                )}
                <span className="ml-3 font-semibold text-secondary">Total Reviews: </span>
                <span className="font-bold text-primary">{reviewsData.count}</span>
              </div>
            )}
          </div>
        </div>

        {/* Direct Review Deletion Card (DELETE /reviews/:id) */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <Trash2 size={18} className="text-danger" />
              <h3 className="card-title">Direct Review Deletion Tool</h3>
            </div>
            <span className="badge badge-danger badge-sm">DELETE /reviews/:id</span>
          </div>

          <div className="card-body space-y-4">
            <p className="text-xs text-secondary leading-relaxed">
              Remove a specific review document by its MongoDB ObjectId. The backend verifies student
              author ownership.
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="direct-review-id">
                Review ObjectId
              </label>
              <div className="flex gap-2">
                <input
                  id="direct-review-id"
                  type="text"
                  className="form-input font-mono text-xs"
                  placeholder="e.g. 6ac0c0141dbbde750ec95d08"
                  value={directReviewId}
                  onChange={(e) => setDirectReviewId(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setDirectReviewToDelete(directReviewId.trim())}
                  disabled={!directReviewId.trim() || deleteMutation.isPending}
                >
                  <Trash2 size={15} /> Delete Review
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <MessageSquare size={18} className="text-teal" />
            <h3 className="card-title">
              {selectedPropertyId
                ? `Property Reviews (${reviews.length})`
                : 'Select a Property to View Reviews'}
            </h3>
          </div>
        </div>

        <div className="card-body">
          {!selectedPropertyId ? (
            <EmptyState
              icon={Search}
              title="No property selected"
              description="Choose a hostel property from the dropdown above to load and moderate its student reviews."
            />
          ) : loadingReviews ? (
            <div className="skeleton h-24" />
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={Star}
              title="No reviews found for this property"
              description="This hostel listing has not received any verified student reviews yet."
            />
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => {
                const authorName =
                  typeof rev.studentId === 'object' && rev.studentId?.fullName
                    ? rev.studentId.fullName
                    : 'Verified Student';

                return (
                  <div
                    key={rev._id}
                    className="p-4 bg-surface-raised border border-theme rounded-lg flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-primary">{authorName}</span>
                        <span className="text-amber text-sm font-bold">
                          {'★'.repeat(rev.rating)}
                          {'☆'.repeat(5 - rev.rating)}
                        </span>
                        <span className="text-2xs font-mono text-muted">ID: {rev._id}</span>
                        <span className="text-2xs text-muted">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-secondary mt-1.5 leading-relaxed">{rev.comment}</p>
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
      </div>

      {/* Review Delete Confirm Dialog */}
      {reviewToDelete && (
        <ConfirmDialog
          isOpen={!!reviewToDelete}
          onClose={() => setReviewToDelete(null)}
          onConfirm={() => deleteMutation.mutate(reviewToDelete._id)}
          title="Delete Review"
          message={`Are you sure you want to delete this review? (DELETE /reviews/${reviewToDelete._id}). Note: The backend requires student author ownership.`}
          confirmLabel="Delete Review"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      )}

      {/* Direct Review Delete Confirm Dialog */}
      {directReviewToDelete && (
        <ConfirmDialog
          isOpen={!!directReviewToDelete}
          onClose={() => setDirectReviewToDelete(null)}
          onConfirm={() => deleteMutation.mutate(directReviewToDelete)}
          title="Delete Review by ID"
          message={`Are you sure you want to delete review document ${directReviewToDelete}? (DELETE /reviews/${directReviewToDelete}).`}
          confirmLabel="Delete Review"
          variant="danger"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
};
