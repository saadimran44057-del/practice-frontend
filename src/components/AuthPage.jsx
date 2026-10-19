import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { api, setToken } from '../api.js';
import ForgotPassword from './ForgotPassword.jsx';

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login', 'signup' or 'forgot'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body = isSignup
        ? form
        : { email: form.email, password: form.password };

      const data = await api(`/auth/${mode}`, { method: 'POST', body });

      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Google checked who the person is and gave us a "credential".
  // The backend verifies it and returns our own token, same as normal login.
  const handleGoogle = async (response) => {
    setError('');
    setLoading(true);
    try {
      const data = await api('/auth/google', { method: 'POST', body: { credential: response.credential } });
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(isSignup ? 'login' : 'signup');
    setError('');
  };

  // Show the reset password screen
  if (mode === 'forgot') {
    return <ForgotPassword onBack={() => { setMode('login'); setError(''); }} />;
  }

  return (
    <div className="auth-page">
      <div className="auth-wrap">
      <span className="brand auth-brand">catalog</span>
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="subtitle">
          {isSignup ? 'Start managing your product catalog.' : 'Log in to manage your products.'}
        </p>

        {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <>
            <div className="google-button">
              <GoogleLogin
                onSuccess={handleGoogle}
                onError={() => setError('Google sign-in was cancelled or failed. Please try again.')}
                text={isSignup ? 'signup_with' : 'continue_with'}
                theme="filled_black"
                shape="pill"
                width="320"
              />
            </div>
            <div className="or-divider"><span>or use your email</span></div>
          </>
        )}

        {isSignup && (
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" type="text" placeholder="Enter your name"
              value={form.name} onChange={handleChange} />
          </div>
        )}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="Enter your email"
            value={form.email} onChange={handleChange} />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" placeholder="Min 6 characters"
            value={form.password} onChange={handleChange} />
        </div>

        {!isSignup && (
          <div className="forgot-row">
            <button type="button" className="link" onClick={() => { setMode('forgot'); setError(''); }}>
              Forgot password?
            </button>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <button type="submit" className="btn btn-primary full" disabled={loading}>
          {loading ? 'Please wait...' : isSignup ? 'Create account' : 'Log in'}
        </button>

        <p className="switch">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="link" onClick={switchMode}>
            {isSignup ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </form>
      </div>
    </div>
  );
}

export default AuthPage;