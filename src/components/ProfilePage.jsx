import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import Topbar from './Topbar.jsx';
import Avatar from './Avatar.jsx';

function ProfilePage({ user, onBack, onLogout, onUserUpdate }) {
  const [name, setName] = useState(user.name);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(user.avatar || '');
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  // Page khulte hi server se taaza profile lao
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api('/users/me');
        setName(data.user.name);
        setPreview(data.user.avatar || '');
        onUserUpdate(data.user);
      } catch (err) {
        if (err.status === 401) onLogout();
      }
    };
    loadProfile();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be smaller than 2 MB');
      e.target.value = '';
      return;
    }

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setRemoveAvatar(false);
    setError('');
    setMessage('');
  };

  const handleRemovePhoto = () => {
    setImageFile(null);
    setPreview('');
    setRemoveAvatar(true);
    setMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      if (imageFile) {
        formData.append('avatar', imageFile);
      } else if (removeAvatar) {
        formData.append('removeAvatar', 'true');
      }

      const data = await api('/users/me', { method: 'PUT', body: formData });

      onUserUpdate(data.user);
      setImageFile(null);
      setRemoveAvatar(false);
      setPreview(data.user.avatar || '');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setMessage('Profile updated successfully');
    } catch (err) {
      if (err.status === 401) {
        onLogout();
        return;
      }
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Preview ke liye: nayi chuni photo, purani photo, ya pehla letter
  const previewUser = { name: name || user.name, avatar: preview };

  return (
    <div className="page">
      <Topbar user={user} title="My Profile" onProfile={() => {}} onLogout={onLogout} />

      <main className="container narrow">
        <button type="button" className="link back-link" onClick={onBack}>
          &larr; Back to products
        </button>

        <section className="card">
          <div className="card-header">
            <h3>Edit Profile</h3>
            <p>Update your name and profile picture.</p>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <div className="profile-photo">
              <Avatar user={previewUser} size={96} />
              <div className="profile-photo-actions">
                <label className="btn btn-secondary file-btn">
                  {preview ? 'Change Photo' : 'Upload Photo'}
                  <input type="file" accept="image/png, image/jpeg, image/webp"
                    ref={fileInputRef} onChange={handleImageChange} hidden />
                </label>
                {preview && (
                  <button type="button" className="link danger" onClick={handleRemovePhoto}>
                    Remove photo
                  </button>
                )}
                <small className="hint">JPG, PNG or WEBP. Max 2 MB.</small>
              </div>
            </div>

            <div className="field">
              <label htmlFor="profile-name">Full Name</label>
              <input id="profile-name" type="text" value={name}
                onChange={(e) => { setName(e.target.value); setMessage(''); }} />
            </div>

            <div className="field">
              <label htmlFor="profile-email">Email</label>
              <input id="profile-email" type="email" value={user.email} disabled />
              <small className="hint">Email cannot be changed.</small>
            </div>

            <div className="field">
              <label>Role</label>
              <div><span className={`badge ${user.role === 'admin' ? 'badge-admin' : ''}`}>{user.role}</span></div>
            </div>

            {error && <p className="error">{error}</p>}
            {message && <p className="success">{message}</p>}

            <div className="actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default ProfilePage;