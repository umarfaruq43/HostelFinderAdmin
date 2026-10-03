import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import {
  MapPin,
  CheckCircle,
  XCircle,
  Car,
  Compass,
  Building,
  Image as ImageIcon,
} from 'lucide-react';
import type { Property } from '../../types';

interface PropertyDetailModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove?: (property: Property) => void;
  onReject?: (property: Property) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  isOpen,
  onClose,
  onApprove,
  onReject,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  if (!property) return null;

  const photos = property.photos || [];
  const currentPhoto = photos[selectedPhotoIndex]?.url;
  const isPending = property.verificationStatus === 'pending';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={property.title}
      subtitle={`Hostel ID: ${property._id}`}
      maxWidth="lg"
      footer={
        <div className="flex justify-between items-center w-full">
          <Badge variant="status" value={property.verificationStatus} />

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

        {/* Additional charges if any */}
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
    </Modal>
  );
};
