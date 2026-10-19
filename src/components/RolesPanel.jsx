import { useState } from 'react';
import { api } from '../api.js';
import { roleLabel } from '../permissions.js';
import RoleModal from './RoleModal.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import { IconPlus, IconEdit, IconTrash } from './Icons.jsx';

// The "Roles" tab: list of roles, create / edit / delete
function RolesPanel({ user, roles, permissionList, onChanged, notify, onLogout }) {
  // null = closed, {} = new role, { role } = edit
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Turn 'users.block' into its label, e.g. "Block and unblock users"
  const labelFor = (key) => permissionList.find((p) => p.key === key)?.label || key;

  const handleSaved = (message) => {
    setModal(null);
    notify(message);
    onChanged();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api(`/admin/roles/${deleteTarget.id}`, { method: 'DELETE' });
      notify('Role deleted');
      onChanged();
    } catch (err) {
      if (err.status === 401) return onLogout();
      notify(err.message, 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <section>
      <div className="section-head">
        <p className="section-intro">
          Roles decide what people can see and do in the admin panel. Everyone who signs up gets the
          <strong> User</strong> role.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setModal({})}>
          <IconPlus /> New role
        </button>
      </div>

      <div className="role-list">
        {roles.map((role) => {
          // Someone who isn't admin can't edit their own role
          const isOwnRole = role.id === user.role?.id && !role.isAdmin;
          const locked = role.isSystem || isOwnRole;

          return (
            <article key={role.id} className="role-card">
              <div className="role-card-head">
                <div>
                  <h3>
                    {roleLabel(role)}
                    {role.isSystem && <span className="tag">Built in</span>}
                  </h3>
                  {role.description && <p className="role-desc">{role.description}</p>}
                </div>

                {!locked && (
                  <div className="row-actions">
                    <button type="button" className="icon-button" aria-label={`Edit ${role.name}`}
                      onClick={() => setModal({ role })}>
                      <IconEdit />
                    </button>
                    <button type="button" className="icon-button icon-button-danger"
                      aria-label={`Delete ${role.name}`} onClick={() => setDeleteTarget(role)}>
                      <IconTrash />
                    </button>
                  </div>
                )}
              </div>

              <div className="role-meta">
                {role.userCount === 1 ? '1 user' : `${role.userCount} users`}
                <span aria-hidden="true"> · </span>
                {role.isAdmin
                  ? 'All permissions'
                  : role.permissions.length === 0
                    ? 'No admin access'
                    : `${role.permissions.length} permission${role.permissions.length === 1 ? '' : 's'}`}
              </div>

              {!role.isAdmin && role.permissions.length > 0 && (
                <ul className="chips">
                  {role.permissions.map((p) => (
                    <li key={p} className="chip">{labelFor(p)}</li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>

      {modal && (
        <RoleModal
          user={user}
          role={modal.role}
          permissionList={permissionList}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          onUnauthorized={onLogout}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete the ${deleteTarget.name} role?`}
          message={
            deleteTarget.userCount > 0
              ? `${deleteTarget.userCount} user(s) still have this role. Give them another role first, or the delete will be refused.`
              : 'This role will be removed permanently.'
          }
          confirmLabel="Delete role"
          busyLabel="Deleting..."
          busy={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </section>
  );
}

export default RolesPanel;