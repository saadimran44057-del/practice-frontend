import { useState } from 'react';
import { api } from '../api.js';
import { roleLabel } from '../permissions.js';
import Modal from './Modal.jsx';

// Admin creates an account for someone else and picks their role
function AddUserModal({ roles, onClose, onSaved, onUnauthorized }) {
  // Start on the normal "user" role
  const defaultRole = roles.find((r) => r.name === 'user') || roles[0];

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    roleId: defaultRole ? String(defaultRole.id) : '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setError('');
  };

  const selectedRole = roles.find((r) => String(r.id) === form.roleId);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.name.trim().length < 2) return setError('Name needs at least 2 characters.');
    if (!form.email.trim()) return setError('Email is required.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');

    setSaving(true);
    try {
      const data = await api('/admin/users', {
        method: 'POST',
        body: { ...form, roleId: form.roleId ? Number(form.roleId) : undefined },
      });
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
      title="Add user"
      description="Create an account and choose what this person can do."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="add-user-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Adding...' : 'Add user'}
          </button>
        </>
      }
    >
      <form id="add-user-form" className="stack" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="new-name">Full name</label>
          <input id="new-name" type="text" placeholder="e.g. Ali Khan"
            value={form.name} onChange={update('name')} />
        </div>

        <div className="field">
          <label htmlFor="new-email">Email</label>
          <input id="new-email" type="email" placeholder="ali@example.com" autoComplete="off"
            value={form.email} onChange={update('email')} />
        </div>

        <div className="field">
          <label htmlFor="new-password">Password</label>
          <input id="new-password" type="password" placeholder="At least 6 characters"
            autoComplete="new-password" value={form.password} onChange={update('password')} />
          <small className="hint">Share it with them privately. They can change it later with Forgot password.</small>
        </div>

        <div className="field">
          <label htmlFor="new-role">Role</label>
          <select id="new-role" className="select" value={form.roleId} onChange={update('roleId')}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{roleLabel(r)}</option>
            ))}
          </select>
          {selectedRole && (
            <small className="hint">
              {selectedRole.isAdmin
                ? 'Full access to everything, including roles.'
                : selectedRole.permissions.length === 0
                  ? 'Regular account with no admin panel access.'
                  : `${selectedRole.permissions.length} admin permission${selectedRole.permissions.length === 1 ? '' : 's'}.`}
            </small>
          )}
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
    </Modal>
  );
}

export default AddUserModal;