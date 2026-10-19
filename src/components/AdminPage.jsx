import { useEffect, useState } from 'react';
import { api, imageSrc } from '../api.js';
import { can, isAdminUser, roleLabel } from '../permissions.js';
import Topbar from './Topbar.jsx';
import Avatar from './Avatar.jsx';
import RoleBadge from './RoleBadge.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import RolesPanel from './RolesPanel.jsx';
import AddUserModal from './AddUserModal.jsx';
import EditUserModal from './EditUserModal.jsx';
import { IconSearch, IconClose, IconPlus } from './Icons.jsx';

const LIMIT = 10;

const formatPrice = (price) => `Rs ${Number(price).toLocaleString('en-PK')}`;
const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function StatusPill({ blocked }) {
  return (
    <span className={`status ${blocked ? 'status-blocked' : 'status-active'}`}>
      {blocked ? 'Blocked' : 'Active'}
    </span>
  );
}

function AdminPage({ user, onLogout, onEditProfile, onNavigate, notify }) {
  const amAdmin = isAdminUser(user);

  // Only show the tabs this user has permission for
  const tabs = [
    can(user, 'users.view') && { id: 'users', label: 'Users' },
    can(user, 'products.view') && { id: 'products', label: 'Products' },
    can(user, 'roles.manage') && { id: 'roles', label: 'Roles' },
  ].filter(Boolean);

  const [stats, setStats] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissionList, setPermissionList] = useState([]);
  const [tab, setTab] = useState(tabs[0]?.id || null);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // The action waiting for confirmation: block, change role or delete
  const [target, setTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editPerson, setEditPerson] = useState(null);
  // Returns true if we were logged out
  const handleAuthError = (err) => {
    if (err.status === 401) {
      onLogout();
      return true;
    }
    return false;
  };

  const loadStats = async () => {
    if (!can(user, 'dashboard.view')) return;
    try {
      const data = await api('/admin/stats');
      setStats(data.data);
    } catch (err) {
      handleAuthError(err);
    }
  };

  const loadRoles = async () => {
    if (!can(user, 'users.view') && !can(user, 'roles.manage')) return;
    try {
      const data = await api('/admin/roles');
      setRoles(data.data);
      setPermissionList(data.permissions);
    } catch (err) {
      handleAuthError(err);
    }
  };

  const loadRows = async () => {
    if (tab !== 'users' && tab !== 'products') return;
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ page, limit: LIMIT, search, status });
      if (tab === 'users' && roleFilter !== 'all') query.set('roleId', roleFilter);
      const data = await api(`/admin/${tab}?${query}`);
      setRows(data.data);
      setPagination(data.pagination);
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadRoles();
  }, []);

  useEffect(() => {
    loadRows();
  }, [tab, page, search, status, roleFilter]);

  // Search as you type, but wait until typing pauses
  useEffect(() => {
    const timer = setTimeout(() => {
      const value = searchInput.trim();
      if (value !== search) {
        setPage(1);
        setSearch(value);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const switchTab = (next) => {
    if (next === tab) return;
    setRows([]);
    setTab(next);
    setPage(1);
    setSearchInput('');
    setSearch('');
    setStatus('all');
    setRoleFilter('all');
  };

  // ----- Same safety rules as the backend, so we only show buttons that will work -----
  const roleById = (id) => roles.find((r) => r.id === id);

  const canManageUser = (u) => {
    if (u.id === user.id) return false; // not yourself
    const targetRole = roleById(u.roleId);
    if (targetRole?.isAdmin) return false; // never an admin
    if (!amAdmin && targetRole && targetRole.permissions.length > 0) return false; // staff: admin only
    return true;
  };

  // Roles this user is allowed to hand out
  const assignableRoles = roles.filter((r) => {
    if (amAdmin) return true;
    if (r.isAdmin) return false;
    return r.permissions.every((p) => user.permissions.includes(p));
  });

  // ----- Actions -----
  const runAction = async () => {
    const { kind, item, role } = target;
    setSaving(true);
    try {
      if (kind === 'block-user' || kind === 'block-product') {
        const blocked = !item.isBlocked;
        const path = kind === 'block-user' ? 'users' : 'products';
        await api(`/admin/${path}/${item.id}/block`, { method: 'PATCH', body: { blocked } });
        notify(`${kind === 'block-user' ? 'User' : 'Product'} ${blocked ? 'blocked' : 'unblocked'}`);
      }

      if (kind === 'role') {
        const data = await api(`/admin/users/${item.id}/role`, { method: 'PATCH', body: { roleId: role.id } });
        notify(data.message);
      }

      if (kind === 'delete-user') {
        await api(`/admin/users/${item.id}`, { method: 'DELETE' });
        notify('User deleted');
      }

      setTarget(null);
      loadStats();
      loadRoles();
      loadRows();
    } catch (err) {
      if (!handleAuthError(err)) {
        setTarget(null);
        notify(err.message, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  // Text and button for the confirm dialog
  const dialogText = () => {
    if (!target) return {};
    const { kind, item, role } = target;

    if (kind === 'block-user') {
      return item.isBlocked
        ? { title: `Unblock ${item.name}?`, message: 'They will be able to log in and use the app again.', label: 'Unblock user', variant: 'primary' }
        : { title: `Block ${item.name}?`, message: "They won't be able to log in or use the app until you unblock them. Their products stay in the catalog.", label: 'Block user', variant: 'danger' };
    }
    if (kind === 'block-product') {
      return item.isBlocked
        ? { title: `Unblock "${item.name}"?`, message: 'The owner will be able to edit this product again.', label: 'Unblock product', variant: 'primary' }
        : { title: `Block "${item.name}"?`, message: "The owner will see it marked as blocked and won't be able to edit it.", label: 'Block product', variant: 'danger' };
    }
    if (kind === 'role') {
      const access = role.permissions.length
        ? `They'll get ${role.permissions.length} permission${role.permissions.length === 1 ? '' : 's'} in the admin panel.`
        : "They won't have any admin panel access.";
      return { title: `Make ${item.name} ${roleLabel(role).toLowerCase()}?`, message: access, label: 'Change role', variant: 'primary' };
    }
    if (kind === 'delete-user') {
      const products = item.productCount === 1 ? '1 product' : `${item.productCount} products`;
      return {
        title: `Delete ${item.name}?`,
        message: `Their account and ${products} will be removed permanently. This can't be undone.`,
        label: 'Delete user',
        variant: 'danger',
      };
    }
    return {};
  };

  const text = dialogText();
  const showUserActions = can(user, 'users.edit') || can(user, 'users.block') || can(user, 'users.delete');  return (
    <div className="page">
      <Topbar
        user={user}
        view="admin"
        onNavigate={onNavigate}
        onEditProfile={onEditProfile}
        onLogout={onLogout}
      />

      <main className="container">
        <div className="page-head">
          <div className="page-title">
            <h1>Admin</h1>
            <RoleBadge role={user.role} />
          </div>

          {tab === 'users' && can(user, 'users.create') && (
            <button type="button" className="btn btn-primary" onClick={() => setAddUserOpen(true)}>
              <IconPlus /> Add user
            </button>
          )}
        </div>

        {/* Overview numbers */}
        {can(user, 'dashboard.view') && (
          <section className="stats" aria-label="Overview">
            <div className="stat">
              <span className="stat-value">{stats ? stats.totalUsers : '–'}</span>
              <span className="stat-label">Registered users</span>
              {stats && <span className="stat-note">{stats.newUsersThisWeek} joined this week</span>}
            </div>
            <div className="stat">
              <span className="stat-value">{stats ? stats.totalProducts : '–'}</span>
              <span className="stat-label">Products listed</span>
            </div>
            <div className="stat">
              <span className="stat-value">{stats ? stats.blockedProducts : '–'}</span>
              <span className="stat-label">Blocked products</span>
            </div>
            <div className="stat">
              <span className="stat-value">{stats ? stats.blockedUsers : '–'}</span>
              <span className="stat-label">Blocked users</span>
            </div>
          </section>
        )}

        {tabs.length === 0 ? (
          !can(user, 'dashboard.view') && (
            <div className="empty">
              <h2>No admin access</h2>
              <p>Your role doesn't include any admin permissions. Ask an admin if you need access.</p>
            </div>
          )
        ) : (
          <>
            {/* Tabs and filters */}
            <div className="admin-toolbar">
              <div className="tabs" role="tablist">
                {tabs.map((t) => (
                  <button key={t.id} type="button" role="tab" aria-selected={tab === t.id}
                    className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => switchTab(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>

              {tab !== 'roles' && (
                <div className="page-actions">
                  <label className="search">
                    <IconSearch />
                    <input
                      type="search"
                      placeholder={tab === 'users' ? 'Search name or email' : 'Search products'}
                      aria-label="Search"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                    />
                    {searchInput && (
                      <button type="button" className="search-clear" aria-label="Clear search"
                        onClick={() => setSearchInput('')}>
                        <IconClose />
                      </button>
                    )}
                  </label>

                  {tab === 'users' && (
                    <select
                      className="select"
                      aria-label="Filter by role"
                      value={roleFilter}
                      onChange={(e) => { setPage(1); setRoleFilter(e.target.value); }}
                    >
                      <option value="all">All roles</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{roleLabel(r)}</option>
                      ))}
                    </select>
                  )}

                  <select
                    className="select"
                    aria-label="Filter by status"
                    value={status}
                    onChange={(e) => { setPage(1); setStatus(e.target.value); }}
                  >
                    <option value="all">Any status</option>
                    <option value="active">Active</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              )}
            </div>

            {tab === 'roles' ? (
              <RolesPanel
                user={user}
                roles={roles}
                permissionList={permissionList}
                onChanged={() => { loadRoles(); }}
                notify={notify}
                onLogout={onLogout}
              />
            ) : (
              <>
                {error && (
                  <div className="notice">
                    <span>Couldn't load {tab}: {error}</span>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={loadRows}>
                      Try again
                    </button>
                  </div>
                )}

                <div className="table-card">
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        {tab === 'users' ? (
                          <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th className="num">Products</th>
                            <th>Joined</th>
                            <th>Status</th>
                            {showUserActions && <th className="cell-action"><span className="sr-only">Actions</span></th>}
                          </tr>
                        ) : (
                          <tr>
                            <th>Product</th>
                            <th>Owner</th>
                            <th className="num">Price</th>
                            <th>Added</th>
                            <th>Status</th>
                            {can(user, 'products.block') && <th className="cell-action"><span className="sr-only">Actions</span></th>}
                          </tr>
                        )}
                      </thead>

                      <tbody>
                        {loading ? (
                          <tr><td colSpan="6" className="table-empty">Loading...</td></tr>
                        ) : rows.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="table-empty">
                              {search || status !== 'all' || roleFilter !== 'all'
                                ? 'Nothing matches these filters.'
                                : `No ${tab} yet.`}
                            </td>
                          </tr>
                        ) : tab === 'users' ? (
                          rows.map((u) => {
                            const manageable = canManageUser(u);
                            const isMe = u.id === user.id;

                            return (
                              <tr key={u.id}>
                                <td>
                                  <div className="cell-user">
                                    <Avatar user={u} size={36} />
                                    <div>
                                      <strong>{u.name}{isMe && <span className="you"> (you)</span>}</strong>
                                      <span>{u.email}</span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  {can(user, 'users.assignRole') && manageable ? (
                                    <select
                                      className="select select-sm"
                                      aria-label={`Role for ${u.name}`}
                                      value={u.roleId || ''}
                                      onChange={(e) => {
                                        const role = roleById(Number(e.target.value));
                                        if (role) setTarget({ kind: 'role', item: u, role });
                                      }}
                                    >
                                      {/* Keep the current role visible even if this user can't assign it */}
                                      {!assignableRoles.some((r) => r.id === u.roleId) && u.Role && (
                                        <option value={u.roleId} disabled>{roleLabel(u.Role)}</option>
                                      )}
                                      {assignableRoles.map((r) => (
                                        <option key={r.id} value={r.id}>{roleLabel(r)}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <RoleBadge role={u.Role} />
                                  )}
                                </td>
                                <td className="num">{u.productCount}</td>
                                <td className="nowrap">{formatDate(u.createdAt)}</td>
                                <td><StatusPill blocked={u.isBlocked} /></td>
                                {showUserActions && (
                                  <td className="cell-action">
                                    {manageable ? (
                                      <div className="row-actions">
                                        {can(user, 'users.block') && (
                                          <button type="button"
                                            className={`btn btn-sm ${u.isBlocked ? 'btn-secondary' : 'btn-outline-danger'}`}
                                            onClick={() => setTarget({ kind: 'block-user', item: u })}>
                                            {u.isBlocked ? 'Unblock' : 'Block'}
                                          </button>
                                        )}
                                        {can(user, 'users.delete') && (
                                          <button type="button" className="btn btn-sm btn-danger"
                                            onClick={() => setTarget({ kind: 'delete-user', item: u })}>
                                            Delete
                                          </button>
                                        )}
                                                                                {can(user, 'users.edit') && (
                                          <button type="button" className="btn btn-sm btn-secondary"
                                            onClick={() => setEditPerson(u)}>
                                            Edit
                                          </button>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="muted">–</span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        ) : (
                          rows.map((p) => (
                            <tr key={p.id}>
                              <td>
                                <div className="cell-product">
                                  {p.image ? (
                                    <img src={imageSrc(p.image)} alt="" className="thumb" />
                                  ) : (
                                    <span className="thumb thumb-empty">{p.name.charAt(0).toUpperCase()}</span>
                                  )}
                                  <strong>{p.name}</strong>
                                </div>
                              </td>
                              <td>
                                <div className="cell-stack">
                                  <span>{p.User ? p.User.name : 'Unknown'}</span>
                                  {p.User && <small>{p.User.email}</small>}
                                </div>
                              </td>
                              <td className="num nowrap">{formatPrice(p.price)}</td>
                              <td className="nowrap">{formatDate(p.createdAt)}</td>
                              <td><StatusPill blocked={p.isBlocked} /></td>
                              {can(user, 'products.block') && (
                                <td className="cell-action">
                                  <button type="button"
                                    className={`btn btn-sm ${p.isBlocked ? 'btn-secondary' : 'btn-outline-danger'}`}
                                    onClick={() => setTarget({ kind: 'block-product', item: p })}>
                                    {p.isBlocked ? 'Unblock' : 'Block'}
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {pagination.totalPages > 1 && (
                    <div className="table-foot">
                      <span>Page {page} of {pagination.totalPages}</span>
                      <div className="table-foot-actions">
                        <button type="button" className="btn btn-secondary btn-sm" disabled={page === 1 || loading}
                          onClick={() => setPage(page - 1)}>
                          Previous
                        </button>
                        <button type="button" className="btn btn-secondary btn-sm"
                          disabled={page === pagination.totalPages || loading} onClick={() => setPage(page + 1)}>
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {addUserOpen && (
        <AddUserModal
          roles={assignableRoles}
          onClose={() => setAddUserOpen(false)}
          onSaved={(message) => {
            setAddUserOpen(false);
            notify(message);
            loadStats();
            loadRoles();
            if (page !== 1) setPage(1);
            else loadRows();
          }}
          onUnauthorized={onLogout}
        />
      )}

{editPerson && (
        <EditUserModal
          person={editPerson}
          onClose={() => setEditPerson(null)}
          onSaved={(message) => {
            setEditPerson(null);
            notify(message);
            loadRows();
          }}
          onUnauthorized={onLogout}
        />
      )}

      {target && (
        <ConfirmDialog
          title={text.title}
          message={text.message}
          confirmLabel={text.label}
          busyLabel="Saving..."
          variant={text.variant}
          busy={saving}
          onConfirm={runAction}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  );
}

export default AdminPage;