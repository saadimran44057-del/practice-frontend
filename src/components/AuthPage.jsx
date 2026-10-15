import { useState } from 'react';
import { api, setToken } from '../api.js';
import ForgotPassword from './ForgotPassword.jsx';

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login', 'signup' ya 'forgot'
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

  const switchMode = () => {
    setMode(isSignup ? 'login' : 'signup');
    setError('');
  };

  // Forgot password wala page
  if (mode === 'forgot') {
    return <ForgotPassword onBack={() => { setMode('login'); setError(''); }} />;
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>{isSignup ? 'Create Account' : 'Welcome Back'}</h1>
        <p className="subtitle">
          {isSignup ? 'Sign up to manage your products' : 'Login to your account'}
        </p>

        {isSignup && (
          <div className="field">
            <label htmlFor="name">Full Name</label>
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
          {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
        </button>

        <p className="switch">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" className="link" onClick={switchMode}>
            {isSignup ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </form>
    </div>
  );
}

export default AuthPage;