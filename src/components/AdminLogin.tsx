import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import '../css/AdminLogin.css';
import mayaBird from '../assets/images/maya-bird.png';
import PageLayout from '../shared/PageLayout';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Logging in with:', { email, password, rememberMe });
  };

  return (
    <PageLayout className="login-viewport">
      {/* Background Glow Accents */}
      <div className="glow-accent glow-top-left" />
      <div className="glow-accent glow-bottom-right" />

      <main className="login-card-wrapper">
        {/* Top Brand Banner */}
        <div className="card-top-header">
          <div className="brand-lockup">
            <img src={mayaBird} alt="MADA Logo" className="brand-logo-img" />
            <div className="brand-text-group">
              <span className="brand-title-text">MADA</span>
              <span className="brand-subtitle-text">MANAGEMENT SYSTEM</span>
            </div>
          </div>
          <div className="system-status-badge">
            <ShieldCheck size={13} />
            <span>Portal v1.0</span>
          </div>
        </div>

        {/* Welcome Headline */}
        <div className="card-welcome-section">
          <h2>Admin Sign In</h2>
          <p>Enter your credentials to access your dashboard</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="admin-form">
          {/* Email Address */}
          <div className="form-field">
            <label htmlFor="admin-email">Email Address</label>
            <div className="input-box">
              <Mail className="field-icon" size={18} />
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mada.gov.ph"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-field">
            <label htmlFor="admin-password">Password</label>
            <div className="input-box">
              <Lock className="field-icon" size={18} />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Controls Row */}
          <div className="form-options">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="checkbox-custom" />
              <span className="checkbox-label">Remember me</span>
            </label>

            <a href="#forgot-password" className="forgot-password-link">
              Forgot password?
            </a>
          </div>

          {/* Submit CTA */}
          <button type="submit" className="login-submit-btn">
            <span>Sign In to Dashboard</span>
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Card Footer */}
        <div className="card-bottom-footer">
          <p className="mada-tagline">Smarter Farms, Stronger Communities.</p>
          <div className="footer-support">
            <span>Need assistance?</span>{' '}
            <a href="#support" className="support-link">Contact Administrator</a>
          </div>
        </div>
      </main>
    </PageLayout>
  );
};

export default AdminLogin;