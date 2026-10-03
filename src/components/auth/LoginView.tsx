import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, Lock, Mail, Server, ArrowRight, Sparkles } from 'lucide-react';
import { getBaseUrl, setBaseUrl, DEFAULT_BASE_URL } from '../../api/client';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('admin@ochf.com');
  const [password, setPassword] = useState('AdminPassword123!');
  const [baseUrlInput, setBaseUrlInput] = useState(getBaseUrl());
  const [showConfig, setShowConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (baseUrlInput !== getBaseUrl()) {
        setBaseUrl(baseUrlInput);
      }
      await login(email, password);
      showToast('success', 'Logged in as Admin successfully');
    } catch (err: unknown) {
      const errObj = err as Error;
      const msg = errObj?.message || 'Authentication failed. Please verify credentials.';
      setErrorMsg(msg);
      showToast('error', msg, 'Login Failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('admin@ochf.com');
    setPassword('AdminPassword123!');
    setBaseUrlInput(DEFAULT_BASE_URL);
    setErrorMsg(null);
  };

  return (
    <div className="login-page">
      <div className="login-backdrop-glow" />

      <div className="login-card">
        <div className="login-header">
          <div className="login-icon-box">
            <ShieldCheck size={36} className="text-purple-bright" />
          </div>
          <h2 className="login-title">OCHF Admin Portal</h2>
          <p className="login-subtitle">
            Off-Campus Hostel Finder Management & Moderation
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger mb-4">
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">
              Admin Email Address
            </label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="admin-email"
                type="email"
                className="form-input"
                placeholder="admin@ochf.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">
              Password
            </label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="admin-password"
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="login-tools">
            <button
              type="button"
              className="quick-fill-btn"
              onClick={fillDemoCredentials}
            >
              <Sparkles size={14} />
              Fill Demo Credentials
            </button>

            <button
              type="button"
              className="toggle-config-btn"
              onClick={() => setShowConfig(!showConfig)}
            >
              <Server size={14} />
              {showConfig ? 'Hide API URL' : 'API Endpoint'}
            </button>
          </div>

          {showConfig && (
            <div className="api-config-field">
              <label className="form-label" htmlFor="api-base-url">
                Backend Base URL
              </label>
              <input
                id="api-base-url"
                type="url"
                className="form-input text-xs font-mono"
                value={baseUrlInput}
                onChange={(e) => setBaseUrlInput(e.target.value)}
                placeholder="https://hostelfinderbe.onrender.com"
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg mt-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner-sm" /> Authenticating...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Access Admin Portal <ArrowRight size={18} />
              </span>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="login-footer-text">
            Protected internal moderation console. Authorized access only.
          </p>
        </div>
      </div>
    </div>
  );
};
