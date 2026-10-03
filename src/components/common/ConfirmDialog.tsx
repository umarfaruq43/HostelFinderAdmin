import React, { useState } from 'react';
import { Modal } from './Modal';
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void> | void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  requireReason?: boolean;
  reasonPlaceholder?: string;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  requireReason = false,
  reasonPlaceholder = 'Please specify the reason...',
  isLoading = false,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      setError('A reason is required to proceed.');
      return;
    }
    setError('');
    await onConfirm(reason.trim() || undefined);
    setReason('');
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertCircle className="text-danger" size={28} />;
      case 'warning':
        return <AlertTriangle className="text-warning" size={28} />;
      case 'success':
        return <CheckCircle className="text-success" size={28} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
      footer={
        <div className="flex gap-2 justify-end w-full">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn-${variant}`}
            onClick={handleConfirm}
            disabled={isLoading || (requireReason && !reason.trim())}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="spinner-sm" /> Processing...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      }
    >
      <div className="dialog-content">
        <div className="flex items-start gap-4">
          {getIcon() && <div className="dialog-icon">{getIcon()}</div>}
          <div className="flex-1">
            <p className="dialog-message">{message}</p>

            {requireReason && (
              <div className="dialog-reason-container mt-4">
                <label className="form-label" htmlFor="dialog-reason">
                  Reason <span className="text-danger">*</span>
                </label>
                <textarea
                  id="dialog-reason"
                  className="form-textarea"
                  rows={3}
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder={reasonPlaceholder}
                  autoFocus
                />
                {error && <p className="form-error mt-1">{error}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
