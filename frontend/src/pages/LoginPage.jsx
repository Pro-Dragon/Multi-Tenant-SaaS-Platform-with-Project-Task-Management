import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subdomain, setSubdomain] = useState('demo');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Don't send subdomain for superadmin (superadmin@system.com has no tenant)
      const subdomainToUse = email === 'superadmin@system.com' ? undefined : subdomain;
      await login(email, password, subdomainToUse);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <h2>Login</h2>
        {error && <div className="alert error" role="alert">{error}</div>}
        <form onSubmit={handleSubmit} className="grid">
          <div className="form-group">
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Tenant Subdomain (optional)</label>
            <input className="input" type="text" value={subdomain} onChange={(e) => setSubdomain(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary full-width">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="link-muted" style={{ marginTop: 12 }}>
          <a href="/register">Don't have an account? Register</a>
        </p>
        <div className="card" style={{ marginTop: 16 }}>
          <h4 style={{ marginTop: 0, marginBottom: 8 }}>Demo Credentials</h4>
          <p style={{ margin: '4px 0' }}><strong>Super Admin:</strong> superadmin@system.com / Admin@123</p>
          <p style={{ margin: '4px 0' }}><strong>Tenant Admin:</strong> admin@demo.com / Demo@123</p>
          <p style={{ margin: '4px 0' }}><strong>User:</strong> user1@demo.com / User@123</p>
        </div>
      </div>
    </div>
  );
}