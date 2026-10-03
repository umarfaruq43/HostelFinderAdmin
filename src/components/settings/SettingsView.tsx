import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getBaseUrl, setBaseUrl, DEFAULT_BASE_URL, getAuthToken } from '../../api/client';
import { deleteAccount } from '../../api/adminServices';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import {
  Server,
  Key,
  Activity,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user, refreshUser, logout } = useAuth();

  const [baseUrlInput, setBaseUrlInput] = useState(getBaseUrl());
  const [copiedToken, setCopiedToken] = useState(false);
  const [pingStatus, setPingStatus] = useState<{
    latencyMs?: number;
    status: 'idle' | 'testing' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  // Delete account state (DELETE /auth/me)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const token = getAuthToken();

  const handleSaveBaseUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setBaseUrl(baseUrlInput);
    queryClient.invalidateQueries();
    showToast('success', 'Backend Base URL updated');
  };

  const handleResetDefaultUrl = () => {
    setBaseUrlInput(DEFAULT_BASE_URL);
    setBaseUrl(DEFAULT_BASE_URL);
    queryClient.invalidateQueries();
    showToast('info', `Reset to default: ${DEFAULT_BASE_URL}`);
  };

  const handleCopyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    showToast('info', 'Admin Bearer Token copied to clipboard');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleTestPing = async () => {
    setPingStatus({ status: 'testing' });
    const start = performance.now();
    try {
      const res = await fetch(`${getBaseUrl().replace(/\/+$/, '')}/schools`);
      const latency = Math.round(performance.now() - start);
      if (res.ok) {
        setPingStatus({
          status: 'success',
          latencyMs: latency,
          message: `HTTP ${res.status} OK • Response in ${latency}ms`,
        });
        showToast('success', `API Ping Healthy (${latency}ms)`);
      } else {
        setPingStatus({
          status: 'error',
          message: `HTTP ${res.status} ${res.statusText}`,
        });
      }
    } catch (err: unknown) {
      const errObj = err as Error;
      setPingStatus({
        status: 'error',
        message: errObj?.message || 'Failed to connect to backend',
      });
      showToast('error', 'Ping failed. Backend unreachable.');
    }
  };

  const handleClearCache = () => {
    queryClient.clear();
    refreshUser();
    showToast('info', 'React Query cache cleared & refetched');
  };

  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword) {
      setDeleteError('Password is required to confirm account deletion.');
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);

    try {
      await deleteAccount(deletePassword);
      showToast('success', 'Account deleted successfully');
      setIsDeleteModalOpen(false);
      logout();
    } catch (err: unknown) {
      const errObj = err as Error;
      setDeleteError(errObj?.message || 'Failed to delete account. Please verify password.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="section-container">
      <div className="grid-2-cols">
        {/* Backend Endpoint Config */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <Server size={18} className="text-purple" />
              <h3 className="card-title">Backend API Configuration</h3>
            </div>
            <span className="badge badge-purple badge-sm">REST API</span>
          </div>

          <div className="card-body">
            <form onSubmit={handleSaveBaseUrl} className="space-y-4">
              <div className="form-group">
                <label className="form-label" htmlFor="settings-base-url">
                  Base URL
                </label>
                <input
                  id="settings-base-url"
                  type="url"
                  className="form-input font-mono text-xs"
                  value={baseUrlInput}
                  onChange={(e) => setBaseUrlInput(e.target.value)}
                  placeholder="https://hostelfinderbe.onrender.com"
                  required
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleResetDefaultUrl}
                >
                  Reset Default
                </button>
              </div>
            </form>

            {/* Health Ping tool */}
            <div className="border-t border-theme pt-4 mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    API Connectivity Test
                  </h4>
                  <p className="text-xs text-secondary mt-0.5">
                    Measure roundtrip latency to the cloud backend.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleTestPing}
                  disabled={pingStatus.status === 'testing'}
                >
                  <Activity size={14} />{' '}
                  {pingStatus.status === 'testing' ? 'Pinging...' : 'Ping Test'}
                </button>
              </div>

              {pingStatus.status !== 'idle' && (
                <div
                  className={`diagnostic-box mt-3 ${
                    pingStatus.status === 'success'
                      ? 'diag-success'
                      : pingStatus.status === 'error'
                      ? 'diag-error'
                      : ''
                  }`}
                >
                  <div className="text-xs font-mono font-medium">
                    {pingStatus.message || 'Connecting to backend...'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security & Authentication Tokens */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <Key size={18} className="text-amber" />
              <h3 className="card-title">Session & Authentication</h3>
            </div>
            <span className="badge badge-success badge-sm">Active Session</span>
          </div>

          <div className="card-body space-y-4">
            <div>
              <span className="detail-label">Authenticated Admin</span>
              <p className="font-mono text-sm font-semibold mt-0.5">
                {user?.email || 'admin@ochf.com'}
              </p>
              <p className="text-xs text-muted mt-0.5">Role: {user?.role || 'admin'}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="detail-label">Current Bearer JWT Token</span>
                <button
                  type="button"
                  className="btn-ghost-sm"
                  onClick={handleCopyToken}
                  title="Copy token to clipboard"
                >
                  {copiedToken ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                  <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
                </button>
              </div>
              <textarea
                readOnly
                className="form-textarea font-mono text-2xs bg-surface-sunken"
                rows={3}
                value={token || 'No active token'}
              />
            </div>

            {/* Cache management */}
            <div className="border-t border-theme pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-secondary">
                    TanStack Query State
                  </h4>
                  <p className="text-xs text-muted">
                    Clear client memory cache to fetch completely fresh API data.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleClearCache}
                >
                  <RefreshCw size={13} /> Purge Cache
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone: Account Deletion (DELETE /auth/me) */}
      <div className="card mt-6 border-danger-subtle">
        <div className="card-header bg-danger-subtle">
          <div className="card-title-group">
            <AlertTriangle size={18} className="text-danger" />
            <h3 className="card-title text-danger">Danger Zone</h3>
          </div>
          <span className="badge badge-danger badge-sm">Irreversible</span>
        </div>

        <div className="card-body">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 className="text-sm font-bold text-primary">
                Delete Account (`DELETE /auth/me`)
              </h4>
              <p className="text-xs text-muted mt-0.5 max-w-xl">
                Permanently delete your current account and linked profile records. Requires your current
                password to confirm. This action cannot be reversed.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                setDeleteError(null);
                setDeletePassword('');
                setIsDeleteModalOpen(true);
              }}
            >
              <Trash2 size={16} /> Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Account Deletion"
        subtitle="DELETE /auth/me"
        maxWidth="md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteAccountSubmit}
              disabled={isDeleting || !deletePassword}
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <span className="spinner-sm" /> Deleting...
                </span>
              ) : (
                'Permanently Delete Account'
              )}
            </button>
          </div>
        }
      >
        <form onSubmit={handleDeleteAccountSubmit} className="space-y-4">
          <div className="alert alert-danger">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={20} className="text-danger flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong>Warning:</strong> You are about to permanently delete your account (
                <code>{user?.email}</code>). A valid JWT alone cannot perform this action; you must confirm
                your current password.
              </div>
            </div>
          </div>

          {deleteError && (
            <div className="p-3 bg-danger-light border border-danger-border rounded-md text-xs text-danger font-medium">
              {deleteError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="delete-account-password">
              Current Password <span className="text-danger">*</span>
            </label>
            <div className="input-with-icon">
              <Lock size={17} className="input-icon" />
              <input
                id="delete-account-password"
                type="password"
                className="form-input"
                placeholder="Enter your current password..."
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  if (deleteError) setDeleteError(null);
                }}
                required
                autoFocus
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
