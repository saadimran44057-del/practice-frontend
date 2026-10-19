// Helpers to check what the logged-in user is allowed to do.
// user.permissions comes from the backend (login and /users/me).
// The backend checks permissions again on every request, so these only hide buttons.

export const can = (user, permission) => Boolean(user?.permissions?.includes(permission));

export const canAny = (user, permissions) => permissions.some((p) => can(user, p));

// Anyone with at least one of these sees the Admin link
export const PANEL_PERMISSIONS = ['dashboard.view', 'users.view', 'products.view', 'roles.manage'];

export const isAdminUser = (user) => user?.role?.name === 'admin';

// "manager" -> "Manager"
export const roleLabel = (role) =>
  role ? role.name.charAt(0).toUpperCase() + role.name.slice(1) : 'No role';