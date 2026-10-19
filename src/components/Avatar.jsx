// Show the profile photo, or the first letter of the name
function Avatar({ user, size = 36 }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) };

  if (user.avatar) {
    return <img src={user.avatar} alt="" className="avatar" style={style} referrerPolicy="no-referrer" />;
  }

  return (
    <div className="avatar avatar-letter" style={style} aria-hidden="true">
      {user.name ? user.name.charAt(0).toUpperCase() : '?'}
    </div>
  );
}

export default Avatar;