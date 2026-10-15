import Avatar from './Avatar.jsx';

function Topbar({ user, title, onProfile, onLogout }) {
  return (
    <header className="topbar">
      <h2>{title}</h2>
      <div className="topbar-right">
        <button type="button" className="profile-btn" onClick={onProfile}>
          <Avatar user={user} size={34} />
          <span>{user.name}</span>
        </button>
        <button type="button" className="btn btn-secondary" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}

export default Topbar;