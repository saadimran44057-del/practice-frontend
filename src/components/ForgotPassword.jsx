import { useState } from 'react';
import { api } from '../api.js';

function ForgotPassword({ onBack }) {
  const [step, setStep] = useState('email'); // 'email' ya 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: email par OTP bhejo
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const data = await api('/auth/forgot-password', { method: 'POST', body: { email } });
      setMessage(data.message);
      setStep('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: OTP aur naya password bhejo
  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!/^\d{6}$/.test(otp)) {
      setError('OTP must be 6 digits');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const data = await api('/auth/reset-password', {
        method: 'POST',
        body: { email, otp, newPassword },
      });
      setMessage(data.message);
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Reset Password</h1>

        {step === 'email' && (
          <form className="auth-form" onSubmit={handleSendOtp}>
            <p className="subtitle">Enter your email and we will send you a 6 digit code</p>

            <div className="field">
              <label htmlFor="fp-email">Email</label>
              <input id="fp-email" type="email" placeholder="Enter your email"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="btn btn-primary full" disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form className="auth-form" onSubmit={handleReset}>
            <p className="subtitle">Enter the code sent to <strong>{email}</strong></p>

            {message && <p className="success">{message}</p>}

            <div className="field">
              <label htmlFor="otp">6 Digit OTP</label>
              <input id="otp" type="text" inputMode="numeric" maxLength={6} placeholder="123456"
                className="otp-input"
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
            </div>

            <div className="field">
              <label htmlFor="new-password">New Password</label>
              <input id="new-password" type="password" placeholder="Min 6 characters"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input id="confirm-password" type="password" placeholder="Type it again"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="btn btn-primary full" disabled={loading}>
              {loading ? 'Please wait...' : 'Reset Password'}
            </button>

            <p className="switch">
              Didn't get the code?{' '}
              <button type="button" className="link" onClick={handleSendOtp} disabled={loading}>
                Resend OTP
              </button>
            </p>
          </form>
        )}

        {step === 'done' && (
          <div className="auth-form">
            <p className="success">{message}</p>
            <button type="button" className="btn btn-primary full" onClick={onBack}>
              Go to Login
            </button>
          </div>
        )}

        {step !== 'done' && (
          <p className="switch">
            <button type="button" className="link" onClick={onBack}>Back to Login</button>
          </p>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;