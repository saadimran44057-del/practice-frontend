import { useEffect, useRef, useState } from 'react';
import { api, imageSrc } from '../api.js';
import Modal from './Modal.jsx';
import { IconImage, IconPlus, IconClose } from './Icons.jsx';

const MAX_SIZE = 2 * 1024 * 1024;
const MAX_EXTRA = 4; // main photo + 4 more

// Create and edit use the same modal. `product` is empty when creating.
function ProductModal({ product, onClose, onSaved, onUnauthorized }) {
  // After "Add product" saves, this holds the new product, so a retry updates it instead of adding twice
  const [current, setCurrent] = useState(product || null);
  const isEdit = Boolean(product);

  const [form, setForm] = useState({
    name: product?.name || '',
    price: product ? String(product.price) : '',
    stock: product ? String(product.stock ?? 0) : '0',
    description: product?.description || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(product?.image ? imageSrc(product.image) : '');

  // Extra photos: ones already saved, new ones picked now, and saved ones to remove
  const [savedExtras, setSavedExtras] = useState([]);
  const [newExtras, setNewExtras] = useState([]); // [{ file, preview }]
  const [removedIds, setRemovedIds] = useState([]);

  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);
  const extraInputRef = useRef(null);

  // Load the extra photos when editing
  useEffect(() => {
    if (!product) return;
    api(`/products/${product.id}/images`)
      .then((res) => setSavedExtras(res.data))
      .catch((err) => { if (err.status === 401) onUnauthorized(); });
  }, []);

  const extraCount = savedExtras.length + newExtras.length;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_SIZE) {
      setError('Choose an image smaller than 2 MB.');
      e.target.value = '';
      return;
    }

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleExtrasChange = (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (files.some((f) => f.size > MAX_SIZE)) {
      setError('Each photo must be smaller than 2 MB.');
      return;
    }
    const room = MAX_EXTRA - extraCount;
    if (files.length > room) {
      setError(`You can add ${room} more photo${room === 1 ? '' : 's'}.`);
    } else {
      setError('');
    }
    setNewExtras([...newExtras, ...files.slice(0, room).map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  };

  const removeSaved = (id) => {
    setSavedExtras(savedExtras.filter((img) => img.id !== id));
    setRemovedIds([...removedIds, id]);
  };

  const removeNew = (index) => setNewExtras(newExtras.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.name.trim().length < 3) {
      setError('Product name needs at least 3 characters.');
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      setError('Enter a price greater than 0.');
      return;
    }
    if (form.stock === '' || !Number.isInteger(Number(form.stock)) || Number(form.stock) < 0) {
      setError('Stock must be a whole number, 0 or more.');
      return;
    }

    setSaving(true);
    setError('');

    // Step 1: save the product itself
    let saved;
    try {
      const formData = new FormData();
      formData.append('name', form.name.trim());
      formData.append('price', form.price);
      formData.append('stock', form.stock);
      formData.append('description', form.description.trim());
      if (imageFile) formData.append('image', imageFile);

      const data = current
        ? await api(`/products/${current.id}`, { method: 'PUT', body: formData })
        : await api('/products', { method: 'POST', body: formData });
      saved = data.data;
      setCurrent(saved);
      setImageFile(null);
    } catch (err) {
      setSaving(false);
      if (err.status === 401) return onUnauthorized();
      setError(err.message);
      return;
    }

    // Step 2: the extra photos
    try {
      for (const id of removedIds) {
        await api(`/products/${saved.id}/images/${id}`, { method: 'DELETE' });
      }
      setRemovedIds([]);

      if (newExtras.length) {
        const photos = new FormData();
        newExtras.forEach((extra) => photos.append('images', extra.file));
        const res = await api(`/products/${saved.id}/images`, { method: 'POST', body: photos });
        setSavedExtras((list) => [...list, ...res.data]);
        setNewExtras([]);
      }
    } catch (err) {
      setSaving(false);
      if (err.status === 401) return onUnauthorized();
      setError(`The product was saved, but the extra photos were not: ${err.message}. Press save to try again.`);
      return;
    }

    setSaving(false);
    onSaved(saved, isEdit);
  };

  return (
    <Modal
      title={isEdit ? 'Edit product' : 'Add product'}
      description={isEdit ? 'Update the details customers see.' : 'Add a new item to your catalog.'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="product-form" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Add product'}
          </button>
        </>
      }
    >
      <form id="product-form" className="stack" onSubmit={handleSubmit} noValidate>
        <div className="image-picker">
          <button
            type="button"
            className={`image-drop ${preview ? 'has-image' : ''}`}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <img src={preview} alt="Product preview" />
            ) : (
              <span className="image-drop-empty">
                <IconImage />
                <span>Upload the main photo</span>
                <small>JPG, PNG or WEBP, up to 2 MB</small>
              </span>
            )}
          </button>
          {preview && (
            <button type="button" className="link" onClick={() => fileInputRef.current?.click()}>
              Replace main photo
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleImageChange}
            hidden
          />
        </div>

        <div className="field">
          <span className="field-label">
            More photos <span className="optional">Optional, up to {MAX_EXTRA}</span>
          </span>
          <div className="extra-photos">
            {savedExtras.map((img) => (
              <div key={img.id} className="extra-photo">
                <img src={imageSrc(img.url)} alt="" />
                <button type="button" aria-label="Remove photo" onClick={() => removeSaved(img.id)}><IconClose /></button>
              </div>
            ))}
            {newExtras.map((extra, i) => (
              <div key={extra.preview} className="extra-photo">
                <img src={extra.preview} alt="" />
                <button type="button" aria-label="Remove photo" onClick={() => removeNew(i)}><IconClose /></button>
              </div>
            ))}
            {extraCount < MAX_EXTRA && (
              <button type="button" className="extra-add" onClick={() => extraInputRef.current?.click()}>
                <IconPlus />
                <span>Add</span>
              </button>
            )}
          </div>
          <input
            ref={extraInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            multiple
            onChange={handleExtrasChange}
            hidden
          />
          <small className="hint">Buyers see these in a gallery on the product page.</small>
        </div>

        <div className="field">
          <label htmlFor="product-name">Name</label>
          <input id="product-name" name="name" type="text" placeholder="e.g. Dell Latitude 5420"
            value={form.name} onChange={handleChange} />
        </div>

        <div className="field">
          <label htmlFor="product-price">Price</label>
          <div className="input-prefix">
            <span>Rs</span>
            <input id="product-price" name="price" type="number" min="1" placeholder="85000"
              value={form.price} onChange={handleChange} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="product-stock">In stock</label>
          <input id="product-stock" name="stock" type="number" min="0" step="1" inputMode="numeric"
            value={form.stock} onChange={handleChange} />
          <small className="hint">How many you have to sell. POS sales and shop orders lower this.</small>
        </div>

        <div className="field">
          <label htmlFor="product-description">
            Description <span className="optional">Optional</span>
          </label>
          <textarea id="product-description" name="description" rows="3"
            placeholder="Condition, specs, what's in the box..."
            value={form.description} onChange={handleChange} />
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
    </Modal>
  );
}

export default ProductModal;