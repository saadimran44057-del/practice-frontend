import { roleLabel } from '../permissions.js';

// Small coloured pill with the role name
function RoleBadge({ role }) {
  let variant = 'badge-staff';
  if (role?.name === 'admin') variant = 'badge-admin';
  if (role?.name === 'user') variant = '';

  return <span className={`badge ${variant}`}>{roleLabel(role)}</span>;
}

export default RoleBadge;