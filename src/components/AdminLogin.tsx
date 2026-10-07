import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import '../css/AdminLogin.css';
import mayaBird from '../assets/images/maya-bird.png';
import PageLayout from '../shared/PageLayout';
import { supabase } from '../supabase/supabase-client.ts';

// Add the onLogin prop interface
interface AdminLoginProps {
  onLogin: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Add loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Call Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // If successful, trigger the onLogin callback
      if (data.user) {
        onLogin();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
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

        {/* Error Message Display */}
        {error && (
          <div style={{ color: '#ff4d4f', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
              <span className="checkbox-custom" />
              <span className="checkbox-label">Remember me</span>
            </label>

            <a href="#forgot-password" className="forgot-password-link">
              Forgot password?
            </a>
          </div>

          {/* Submit CTA */}
          <button type="submit" className="login-submit-btn" disabled={isLoading}>
            <span>{isLoading ? 'Signing In...' : 'Sign In to Dashboard'}</span>
            {!isLoading && <ArrowRight size={18} />}
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