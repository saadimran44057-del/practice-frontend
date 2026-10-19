import { useState } from 'react';
import { api } from '../api.js';
import Modal from './Modal.jsx';

// Admin edits someone's name, email and (optionally) sets a new password
function EditUserModal({ person, onClose, onSaved, onUnauthorized }) {
  const [form, setForm] = useState({ name: person.name, email: person.email, password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.name.trim().length < 2) return setError('Name needs at least 2 characters.');
    if (!form.email.trim()) return setError('Email is required.');
    if (form.password && form.password.length < 6) {
      return setError('New password must be at least 6 characters.');
    }

    setSaving(true);
    try {
      const body = { name: form.name.trim(), email: form.email.trim() };
      if (form.password) body.password = form.password; // empty = keep the old password

      const data = await api(`/admin/users/${person.id}`, { method: 'PUT', body });
      onSaved(data.message);
    } catch (err) {
      if (err.status === 401) {
        onUnauthorized();
        return;
      }
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Edit user"
      description={`Change ${person.name}'s details or set a new password.`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="edit-user-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </>
      }
    >
      <form id="edit-user-form" className="stack" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="edit-name">Full name</label>
          <input id="edit-name" type="text" value={form.name} onChange={update('name')} />
        </div>

        <div className="field">
          <label htmlFor="edit-email">Email</label>
          <input id="edit-email" type="email" autoComplete="off" value={form.email} onChange={update('email')} />
        </div>

        <div className="field">
          <label htmlFor="edit-password">
            New password <span className="optional">Optional</span>
          </label>
          <div className="password-field">
            <input
              id="edit-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Leave empty to keep current"
              autoComplete="new-password"
              value={form.password}
              onChange={update('password')}
            />
            <button type="button" className="link" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <small className="hint">If you set one, tell them privately. Their old password stops working.</small>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
    </Modal>
  );
}

export default EditUserModal;