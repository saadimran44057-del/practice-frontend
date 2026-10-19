import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import Modal from './Modal.jsx';
import Avatar from './Avatar.jsx';
import RoleBadge from './RoleBadge.jsx';

function ProfileModal({ user, onClose, onSaved, onUnauthorized }) {
  const [name, setName] = useState(user.name);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(user.avatar || '');
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  // Load the latest profile from the server when the modal opens
  useEffect(() => {
    api('/users/me')
      .then((data) => {
        setName(data.user.name);
        setPreview(data.user.avatar || '');
      })
      .catch((err) => {
        if (err.status === 401) onUnauthorized();
      });
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Choose an image smaller than 2 MB.');
      e.target.value = '';
      return;
    }

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setRemoveAvatar(false);
    setError('');
  };

  const handleRemovePhoto = () => {
    setImageFile(null);
    setPreview('');
    setRemoveAvatar(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (name.trim().length < 2) {
      setError('Name needs at least 2 characters.');
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
      onSaved(data.user);
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

  const previewUser = { name: name || user.name, avatar: preview };

  return (
    <Modal
      title="Edit profile"
      description="This is how you appear across the app."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="profile-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </>
      }
    >
      <form id="profile-form" className="stack" onSubmit={handleSubmit} noValidate>
        <div className="profile-photo">
          <Avatar user={previewUser} size={80} />
          <div className="profile-photo-actions">
            <button type="button" className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}>
              {preview ? 'Change photo' : 'Upload photo'}
            </button>
            {preview && (
              <button type="button" className="link link-danger" onClick={handleRemovePhoto}>
                Remove
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleImageChange}
            hidden
          />
        </div>

        <div className="field">
          <label htmlFor="profile-name">Full name</label>
          <input id="profile-name" type="text" value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }} />
        </div>

        <div className="field">
          <label htmlFor="profile-email">Email</label>
          <input id="profile-email" type="email" value={user.email} disabled />
          <small className="hint">Email is used to sign in and can't be changed here.</small>
        </div>

        <div className="profile-role">
          <span>Role</span>
          <RoleBadge role={user.role} />
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
    </Modal>
  );
}

export default ProfileModal;