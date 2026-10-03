import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import { sendSystemAnnouncement } from '../../api/adminServices';
import { Bell, Send } from 'lucide-react';
import type { User } from '../../types';

interface UserAnnouncementModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserAnnouncementModal: React.FC<UserAnnouncementModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !body.trim()) return;

    setIsLoading(true);
    try {
      await sendSystemAnnouncement({
        userId: user.id,
        title: title.trim(),
        body: body.trim(),
      });
      showToast('success', `Announcement sent to ${user.email}`);
      setTitle('');
      setBody('');
      onClose();
    } catch (err: unknown) {
      const errObj = err as Error;
      showToast('error', errObj?.message || 'Failed to dispatch announcement');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Direct Announcement"
      subtitle={`Dispatching notification & email to ${user.name || user.email}`}
      maxWidth="md"
      footer={
        <div className="flex gap-2 justify-end w-full">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isLoading || !title.trim() || !body.trim()}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="spinner-sm" /> Dispatching...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send size={15} /> Send Notice
              </span>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="recipient-pill mb-4">
          <Bell size={16} className="text-purple" />
          <span className="text-xs font-semibold">Target User:</span>
          <span className="text-xs text-muted font-mono">{user.email}</span>
          <span className="badge badge-purple badge-sm">{user.role}</span>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="announce-title">
            Announcement Title <span className="text-danger">*</span>
          </label>
          <input
            id="announce-title"
            type="text"
            className="form-input"
            placeholder="e.g. Account Verification Update or Scheduled Maintenance"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="announce-body">
            Message Body <span className="text-danger">*</span>
          </label>
          <textarea
            id="announce-body"
            className="form-textarea"
            rows={4}
            placeholder="Enter the notification message to display in-app and dispatch via email..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
        </div>
      </form>
    </Modal>
  );
};
