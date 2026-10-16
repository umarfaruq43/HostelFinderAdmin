import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  sendSmtpTestEmail,
  sendSystemAnnouncement,
  getUsers,
  uploadSingleDocument,
  uploadMultiplePhotos,
} from '../../api/adminServices';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import {
  BellRing,
  MailCheck,
  Send,
  Server,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Copy,
  Check,
  ExternalLink,
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

  // Media Upload Diagnostics State (Section 4)
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [uploadedDocUrl, setUploadedDocUrl] = useState<string | null>(null);
  const [multipleFiles, setMultipleFiles] = useState<File[]>([]);
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    showToast('info', 'File URL copied to clipboard');
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const uploadDocMutation = useMutation({
    mutationFn: (file: File) => uploadSingleDocument(file),
    onSuccess: (data) => {
      setUploadedDocUrl(data.url);
      showToast('success', 'Document uploaded successfully to Cloudinary / storage');
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Document upload failed');
    },
  });

  const uploadPhotosMutation = useMutation({
    mutationFn: (files: File[]) => uploadMultiplePhotos(files),
    onSuccess: (data) => {
      setUploadedPhotoUrls(data.urls || []);
      showToast('success', `Uploaded ${data.count || data.urls?.length || 0} photos successfully`);
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Multiple photos upload failed');
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

      {/* Card 3: Media & Document Upload Diagnostics (Section 4: Multer / Cloudinary) */}
      <div className="card mt-6">
        <div className="card-header">
          <div className="card-title-group">
            <UploadCloud size={18} className="text-teal" />
            <h3 className="card-title">Media & Document Upload Diagnostics (API v2)</h3>
          </div>
          <span className="badge badge-teal badge-sm">Multer & Cloudinary Pipeline</span>
        </div>

        <div className="card-body">
          <p className="text-xs text-secondary leading-relaxed mb-5">
            Test backend file uploading endpoints configured in API v2 (supports government ID documents,
            proof of ownership files, and property photography with Cloudinary storage and local disk fallback).
          </p>

          <div className="grid-2-cols gap-6">
            {/* 4.1 Single Document Upload */}
            <div className="p-4 rounded-lg bg-surface-raised border border-theme flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-xs flex items-center gap-1.5 text-primary">
                    <FileText size={15} className="text-teal" /> Single Document Upload (`POST /upload/single`)
                  </h4>
                  <span className="badge badge-neutral badge-xs">ID & Ownership</span>
                </div>
                <p className="text-2xs text-muted mb-3">
                  Upload a single document (Government ID or Property Proof of Ownership: PDF, PNG, JPG).
                </p>

                <div className="form-group mb-3">
                  <label className="form-label text-2xs" htmlFor="single-file-input">
                    Select Document
                  </label>
                  <input
                    id="single-file-input"
                    type="file"
                    className="form-input text-xs"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSingleFile(e.target.files[0]);
                      }
                    }}
                  />
                  {singleFile && (
                    <span className="text-2xs text-muted mt-1 block">
                      Selected: <strong>{singleFile.name}</strong> ({(singleFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  className="btn btn-secondary btn-block btn-sm"
                  onClick={() => singleFile && uploadDocMutation.mutate(singleFile)}
                  disabled={!singleFile || uploadDocMutation.isPending}
                >
                  {uploadDocMutation.isPending ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="spinner-sm" /> Uploading to Cloudinary...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <UploadCloud size={14} /> Upload Single Document
                    </span>
                  )}
                </button>

                {uploadedDocUrl && (
                  <div className="diagnostic-box mt-3 diag-success">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold text-2xs uppercase text-success flex items-center gap-1">
                        <CheckCircle2 size={12} /> Uploaded Successfully
                      </span>
                      <button
                        type="button"
                        className="btn-ghost-xs"
                        onClick={() => handleCopyUrl(uploadedDocUrl)}
                        title="Copy hosted URL"
                      >
                        {copiedUrl === uploadedDocUrl ? <Check size={11} className="text-success" /> : <Copy size={11} />}
                        <span>{copiedUrl === uploadedDocUrl ? 'Copied' : 'Copy URL'}</span>
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-2xs text-secondary truncate" title={uploadedDocUrl}>
                        {uploadedDocUrl}
                      </span>
                      <a
                        href={uploadedDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost-xs flex-shrink-0"
                      >
                        <ExternalLink size={11} /> Open
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 4.2 Multiple Photos Upload */}
            <div className="p-4 rounded-lg bg-surface-raised border border-theme flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-xs flex items-center gap-1.5 text-primary">
                    <ImageIcon size={15} className="text-purple" /> Multiple Photos (`POST /upload/multiple`)
                  </h4>
                  <span className="badge badge-purple badge-xs">Property Photos</span>
                </div>
                <p className="text-2xs text-muted mb-3">
                  Upload multiple hostel photography assets at once. Returns array of hosted image URLs.
                </p>

                <div className="form-group mb-3">
                  <label className="form-label text-2xs" htmlFor="multiple-files-input">
                    Select Multiple Photos
                  </label>
                  <input
                    id="multiple-files-input"
                    type="file"
                    multiple
                    className="form-input text-xs"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        setMultipleFiles(Array.from(e.target.files));
                      }
                    }}
                  />
                  {multipleFiles.length > 0 && (
                    <span className="text-2xs text-muted mt-1 block">
                      Selected <strong>{multipleFiles.length}</strong> photo{multipleFiles.length === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  className="btn btn-secondary btn-block btn-sm"
                  onClick={() => multipleFiles.length > 0 && uploadPhotosMutation.mutate(multipleFiles)}
                  disabled={multipleFiles.length === 0 || uploadPhotosMutation.isPending}
                >
                  {uploadPhotosMutation.isPending ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <span className="spinner-sm" /> Uploading {multipleFiles.length} Photos...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <UploadCloud size={14} /> Upload Photos ({multipleFiles.length})
                    </span>
                  )}
                </button>

                {uploadedPhotoUrls.length > 0 && (
                  <div className="diagnostic-box mt-3 diag-success">
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="font-semibold text-2xs uppercase text-success flex items-center gap-1">
                        <CheckCircle2 size={12} /> {uploadedPhotoUrls.length} Photos Uploaded
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {uploadedPhotoUrls.slice(0, 4).map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded border border-theme overflow-hidden h-14 bg-surface-sunken"
                          title={url}
                        >
                          <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                    {uploadedPhotoUrls.length > 4 && (
                      <span className="text-2xs text-muted block mt-1">
                        +{uploadedPhotoUrls.length - 4} more photos uploaded
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
