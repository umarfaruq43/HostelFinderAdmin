import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { sendSmtpTestEmail, sendSystemAnnouncement, getUsers } from '../../api/adminServices';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  BellRing,
  MailCheck,
  Send,
  Server,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const NotificationsCenter: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  // SMTP Test State
  const [smtpRecipient, setSmtpRecipient] = useState(user?.email || 'admin@ochf.com');
  const [smtpResult, setSmtpResult] = useState<{
    status: 'success' | 'error';
    message: string;
    timestamp: string;
  } | null>(null);

  // Announcement State
  const [targetUserId, setTargetUserId] = useState('');
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceBody, setAnnounceBody] = useState('');

  // Fetch users for selector
  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users', 'quick-list'],
    queryFn: () => getUsers(),
  });

  // SMTP Test Mutation
  const smtpMutation = useMutation({
    mutationFn: (to: string) => sendSmtpTestEmail(to),
    onSuccess: (data) => {
      setSmtpResult({
        status: 'success',
        message: data.message || 'SMTP Test email dispatched successfully',
        timestamp: new Date().toLocaleTimeString(),
      });
      showToast('success', 'Test email dispatched via SMTP');
    },
    onError: (err: Error) => {
      setSmtpResult({
        status: 'error',
        message: err.message || 'SMTP delivery failed. Check mail server configuration.',
        timestamp: new Date().toLocaleTimeString(),
      });
      showToast('error', err.message || 'SMTP test email failed');
    },
  });

  // Announcement Mutation
  const announceMutation = useMutation({
    mutationFn: (data: { userId: string; title: string; body: string }) =>
      sendSystemAnnouncement(data),
    onSuccess: () => {
      showToast('success', 'System announcement dispatched successfully');
      setAnnounceTitle('');
      setAnnounceBody('');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to dispatch system announcement');
    },
  });

  const handleRunSmtpTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpRecipient) return;
    setSmtpResult(null);
    smtpMutation.mutate(smtpRecipient);
  };

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !announceTitle || !announceBody) {
      showToast('error', 'Please fill in all announcement fields');
      return;
    }
    announceMutation.mutate({
      userId: targetUserId,
      title: announceTitle.trim(),
      body: announceBody.trim(),
    });
  };

  const users = usersData?.users || [];

  return (
    <div className="section-container">
      <div className="grid-2-cols">
        {/* Card 1: SMTP Diagnostic Email Test */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <MailCheck size={18} className="text-teal" />
              <h3 className="card-title">SMTP Mail Server Diagnostics</h3>
            </div>
            <span className="badge badge-teal badge-sm">Health Check</span>
          </div>

          <div className="card-body">
            <p className="text-xs text-secondary leading-relaxed mb-4">
              Verify that the backend SMTP transport (Nodemailer / SendGrid / Amazon SES)
              credentials and outbound delivery pipeline are operational.
            </p>

            <form onSubmit={handleRunSmtpTest} className="space-y-4">
              <div className="form-group">
                <label className="form-label" htmlFor="smtp-to">
                  Recipient Test Address
                </label>
                <input
                  id="smtp-to"
                  type="email"
                  className="form-input"
                  placeholder="admin@example.com"
                  value={smtpRecipient}
                  onChange={(e) => setSmtpRecipient(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-secondary btn-block"
                disabled={smtpMutation.isPending || !smtpRecipient}
              >
                {smtpMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner-sm" /> Testing Outbound Mail...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Server size={16} /> Send SMTP Test Email
                  </span>
                )}
              </button>
            </form>

            {smtpResult && (
              <div
                className={`diagnostic-box mt-4 ${
                  smtpResult.status === 'success' ? 'diag-success' : 'diag-error'
                }`}
              >
                <div className="flex items-center gap-2">
                  {smtpResult.status === 'success' ? (
                    <CheckCircle2 size={18} className="text-success" />
                  ) : (
                    <AlertCircle size={18} className="text-danger" />
                  )}
                  <span className="font-semibold text-xs uppercase tracking-wider">
                    {smtpResult.status === 'success' ? 'Delivery Successful' : 'Delivery Failure'}
                  </span>
                  <span className="text-muted text-2xs ml-auto">{smtpResult.timestamp}</span>
                </div>
                <p className="text-xs mt-1.5 font-mono text-secondary">{smtpResult.message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: System Announcement Broadcast */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <BellRing size={18} className="text-purple" />
              <h3 className="card-title">Direct System Announcement</h3>
            </div>
            <span className="badge badge-purple badge-sm">Push & Email</span>
          </div>

          <div className="card-body">
            <p className="text-xs text-secondary leading-relaxed mb-4">
              Dispatch an official platform notice to an authenticated user. This triggers both
              in-app notifications and outbound email alert.
            </p>

            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div className="form-group">
                <label className="form-label" htmlFor="target-user">
                  Target User Account <span className="text-danger">*</span>
                </label>
                <select
                  id="target-user"
                  className="form-select"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  required
                >
                  <option value="">— Select Target User from Directory —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ? `${u.name} (${u.email})` : u.email} — [{u.role}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="system-announce-title">
                  Announcement Title <span className="text-danger">*</span>
                </label>
                <input
                  id="system-announce-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Policy Update: Campus Verification Required"
                  value={announceTitle}
                  onChange={(e) => setAnnounceTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="system-announce-body">
                  Announcement Body <span className="text-danger">*</span>
                </label>
                <textarea
                  id="system-announce-body"
                  className="form-textarea"
                  rows={3}
                  placeholder="Detail the announcement, maintenance timeframe, or requested compliance items..."
                  value={announceBody}
                  onChange={(e) => setAnnounceBody(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={
                  announceMutation.isPending || !targetUserId || !announceTitle || !announceBody
                }
              >
                {announceMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner-sm" /> Dispatching Broadcast...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Send size={16} /> Dispatch Announcement
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
