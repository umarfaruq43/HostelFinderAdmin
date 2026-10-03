import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllSchools } from '../../api/adminServices';
import { useDebounce } from '../../hooks/useDebounce';
import { AddSchoolModal } from './AddSchoolModal';
import { EmptyState } from '../common/EmptyState';
import { School, Plus, Search, MapPin, ExternalLink } from 'lucide-react';

export const SchoolsList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: schoolsData, isLoading, isError, error } = useQuery({
    queryKey: ['schools', debouncedSearch],
    queryFn: () => getAllSchools(debouncedSearch || undefined),
  });

  const schools = schoolsData?.schools || [];

  return (
    <div className="section-container">
      {/* Top Filter and Actions */}
      <div className="filter-card">
        <div className="filter-row">
          <div className="search-field">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search campuses (e.g. unilag, lasu, oau, ibadan)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={16} /> Add Campus Anchor
          </button>
        </div>

        <div className="filter-meta">
          <span className="results-count">
            Registered Campuses: <strong>{schools.length}</strong>
          </span>
        </div>
      </div>

      {/* Campuses Grid */}
      <div className="mt-6">
        {isLoading ? (
          <div className="schools-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card p-5">
                <div className="skeleton h-6 w-3/4 mb-3" />
                <div className="skeleton h-4 w-1/2 mb-4" />
                <div className="skeleton h-8 w-full" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="card p-8 text-center">
            <p className="text-danger font-medium">Failed to load institutions</p>
            <p className="text-muted text-sm mt-1">{(error as Error)?.message}</p>
          </div>
        ) : schools.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={School}
              title="No campuses found"
              description="No registered tertiary institutions match your search."
              actionLabel="Add Campus"
              onAction={() => setIsAddModalOpen(true)}
            />
          </div>
        ) : (
          <div className="schools-grid">
            {schools.map((school) => {
              const lng = school.location?.coordinates?.[0];
              const lat = school.location?.coordinates?.[1];
              const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

              return (
                <div key={school._id} className="school-card">
                  <div className="school-card-header">
                    <div className="school-card-icon">
                      <School size={20} className="text-purple" />
                    </div>
                    <span className="badge badge-purple badge-sm">Campus Anchor</span>
                  </div>

                  <h3 className="school-card-name" title={school.name}>
                    {school.name}
                  </h3>

                  <div className="school-card-coords">
                    <div className="coord-item">
                      <span className="coord-label">Latitude</span>
                      <span className="coord-val font-mono">{lat !== undefined ? lat.toFixed(4) : '—'}</span>
                    </div>
                    <div className="coord-item">
                      <span className="coord-label">Longitude</span>
                      <span className="coord-val font-mono">{lng !== undefined ? lng.toFixed(4) : '—'}</span>
                    </div>
                  </div>

                  <div className="school-card-footer">
                    <span className="school-card-id" title={school._id}>
                      ID: {school._id.substring(0, 8)}...
                    </span>

                    {lat !== undefined && lng !== undefined && (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost-sm"
                        title="View coordinates on Google Maps"
                      >
                        <MapPin size={13} /> View Map <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Campus Modal */}
      <AddSchoolModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
