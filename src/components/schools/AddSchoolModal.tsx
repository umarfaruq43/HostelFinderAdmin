import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { createSchool } from '../../api/adminServices';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { School, MapPin, Sparkles } from 'lucide-react';

interface AddSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_SCHOOLS = [
  { name: 'Covenant University (CU)', latitude: 6.6718, longitude: 3.1581 },
  { name: 'University of Benin (UNIBEN)', latitude: 6.3350, longitude: 5.6037 },
  { name: 'University of Nigeria Nsukka (UNN)', latitude: 6.8645, longitude: 7.4083 },
  { name: 'Ahmadu Bello University (ABU Zaria)', latitude: 11.1524, longitude: 7.6504 },
  { name: 'Babcock University (BU)', latitude: 6.8927, longitude: 3.7225 },
];

export const AddSchoolModal: React.FC<AddSchoolModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: { name: string; latitude: number; longitude: number }) =>
      createSchool(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
      showToast('success', `Campus "${data.school.name}" created successfully`);
      setName('');
      setLatitude('');
      setLongitude('');
      onClose();
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to create campus institution');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (!name.trim()) {
      showToast('error', 'Campus institution name is required');
      return;
    }
    if (isNaN(lat) || isNaN(lng)) {
      showToast('error', 'Please enter valid numerical latitude and longitude');
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      latitude: lat,
      longitude: lng,
    });
  };

  const applyPreset = (preset: typeof PRESET_SCHOOLS[0]) => {
    setName(preset.name);
    setLatitude(String(preset.latitude));
    setLongitude(String(preset.longitude));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Campus Institution"
      subtitle="Campuses act as geographical proximity anchors for student hostel discovery"
      maxWidth="md"
      footer={
        <div className="flex gap-2 justify-end w-full">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={createMutation.isPending || !name.trim() || !latitude || !longitude}
          >
            {createMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="spinner-sm" /> Registering...
              </span>
            ) : (
              'Create Campus Anchor'
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Quick presets */}
        <div>
          <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles size={12} className="text-purple" /> Quick Sample Presets
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_SCHOOLS.map((ps, idx) => (
              <button
                key={idx}
                type="button"
                className="chip-preset"
                onClick={() => applyPreset(ps)}
              >
                {ps.name.split('(')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="school-name">
            Institution / Campus Name <span className="text-danger">*</span>
          </label>
          <div className="input-with-icon">
            <School size={17} className="input-icon" />
            <input
              id="school-name"
              type="text"
              className="form-input"
              placeholder="e.g. Covenant University (CU)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label" htmlFor="school-lat">
              Latitude <span className="text-danger">*</span>
            </label>
            <div className="input-with-icon">
              <MapPin size={17} className="input-icon" />
              <input
                id="school-lat"
                type="number"
                step="any"
                className="form-input font-mono"
                placeholder="6.6718"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="school-lng">
              Longitude <span className="text-danger">*</span>
            </label>
            <div className="input-with-icon">
              <MapPin size={17} className="input-icon" />
              <input
                id="school-lng"
                type="number"
                step="any"
                className="form-input font-mono"
                placeholder="3.1581"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
