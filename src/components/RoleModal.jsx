import { useState } from 'react';
import { api } from '../api.js';
import { isAdminUser } from '../permissions.js';
import Modal from './Modal.jsx';

// Create and edit a role. `role` is empty when creating.
function RoleModal({ user, role, permissionList, onClose, onSaved, onUnauthorized }) {
  const isEdit = Boolean(role);
  const amAdmin = isAdminUser(user);

  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [selected, setSelected] = useState(role?.permissions || []);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Group the checkboxes: Dashboard, Users, Products, Roles
  const groups = [...new Set(permissionList.map((p) => p.group))];

  // A non-admin can only give permissions they have themselves
  const canGive = (key) => amAdmin || user.permissions.includes(key);

  const toggle = (key) => {
    setSelected(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanName = name.trim().toLowerCase();
    if (cleanName.length < 2) {
      setError('Role name needs at least 2 characters.');
      return;
    }

    setSaving(true);
    try {
      const body = { name: cleanName, description: description.trim(), permissions: selected };
      const data = isEdit
        ? await api(`/admin/roles/${role.id}`, { method: 'PUT', body })
        : await api('/admin/roles', { method: 'POST', body });
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
      title={isEdit ? 'Edit role' : 'New role'}
      description="Tick what people with this role are allowed to do."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="role-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create role'}
          </button>
        </>
      }
    >
      <form id="role-form" className="stack" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="role-name">Name</label>
          <input id="role-name" type="text" placeholder="e.g. support" maxLength={30}
            value={name} onChange={(e) => { setName(e.target.value); setError(''); }} />
        </div>

        <div className="field">
          <label htmlFor="role-description">
            Description <span className="optional">Optional</span>
          </label>
          <input id="role-description" type="text" maxLength={200}
            placeholder="e.g. Answers customer questions and blocks spam accounts"
            value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="permission-groups">
          {groups.map((group) => (
            <fieldset key={group} className="permission-group">
              <legend>{group}</legend>
              {permissionList
                .filter((p) => p.group === group)
                .map((p) => (
                  <label key={p.key} className={`check ${canGive(p.key) ? '' : 'is-disabled'}`}>
                    <input
                      type="checkbox"
                      checked={selected.includes(p.key)}
                      disabled={!canGive(p.key)}
                      onChange={() => toggle(p.key)}
                    />
                    <span>{p.label}</span>
                  </label>
                ))}
            </fieldset>
          ))}
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
    </Modal>
  );
}

export default RoleModal;