// Profile photo ho to photo, warna naam ka pehla letter
function Avatar({ user, size = 36 }) {
    const style = { width: size, height: size, fontSize: size * 0.42 };
  
    if (user.avatar) {
      return <img src={user.avatar} alt={user.name} className="avatar" style={style} />;
    }
  
    return (
      <div className="avatar avatar-letter" style={style}>
        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
      </div>
    );
  }
  
  export default Avatar;