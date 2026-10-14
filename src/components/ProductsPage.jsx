import { useEffect, useState } from 'react';
import { api } from '../api.js';

const emptyForm = { name: '', price: '', description: '' };
const LIMIT = 5;

function ProductsPage({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApiError = (err) => {
    if (err.status === 401) {
      onLogout();
      return;
    }
    setError(err.message);
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page, limit: LIMIT, search });
      const data = await api(`/products?${query}`);
      setProducts(data.data);
      setPagination(data.pagination);
    } catch (err) {
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, search]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.price) {
      setError('Name and price are required');
      return;
    }

    setSaving(true);
    const wasEditing = editId;

    try {
      const body = {
        name: form.name,
        price: Number(form.price),
        description: form.description,
      };

      if (wasEditing) {
        await api(`/products/${wasEditing}`, { method: 'PUT', body });
      } else {
        await api('/products', { method: 'POST', body });
      }

      setForm(emptyForm);
      setEditId(null);
      setError('');

      if (!wasEditing && page !== 1) {
        setPage(1);
      } else {
        await loadProducts();
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      price: String(product.price),
      description: product.description || '',
    });
    setEditId(product.id);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditId(null);
    setError('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;

    try {
      await api(`/products/${id}`, { method: 'DELETE' });

      if (editId === id) handleCancel();

      if (products.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await loadProducts();
      }
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="page">
      <header className="topbar">
        <h2>My Products</h2>
        <div className="topbar-right">
          <span>Hi, {user.name}</span>
          <button className="btn btn-secondary" onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="container">
        <section className="card">
          <div className="card-header">
            <h3>{editId ? 'Edit Product' : 'Add Product'}</h3>
            <p>{editId ? 'Update the details below.' : 'Fill in the details to add a new product.'}</p>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <div className="row">
              <div className="field">
                <label htmlFor="name">Product Name</label>
                <input id="name" name="name" type="text" placeholder="e.g. Dell Laptop"
                  value={form.name} onChange={handleChange} />
              </div>

              <div className="field">
                <label htmlFor="price">Price (Rs)</label>
                <input id="price" name="price" type="number" placeholder="e.g. 85000"
                  value={form.price} onChange={handleChange} />
              </div>
            </div>

            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" rows="3"
                placeholder="Optional details..."
                value={form.description} onChange={handleChange} />
            </div>

            {error && <p className="error">{error}</p>}

            <div className="actions">
              {editId && (
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editId ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </form>
        </section>

        <section className="card">
          <div className="card-header list-header">
            <div>
              <h3>Product List</h3>
              <p>{pagination.total} product(s) found</p>
            </div>

            <form className="search" onSubmit={handleSearch}>
              <input type="text" placeholder="Search by name..."
                value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
              <button type="submit" className="btn btn-primary">Search</button>
              {search && (
                <button type="button" className="btn btn-secondary" onClick={clearSearch}>
                  Clear
                </button>
              )}
            </form>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Description</th>
                  <th className="center">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="empty">Loading...</td></tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty">
                      {search ? `No products match "${search}"` : 'No products yet. Add one above.'}
                    </td>
                  </tr>
                ) : (
                  products.map((p, index) => (
                    <tr key={p.id}>
                      <td>{(page - 1) * LIMIT + index + 1}</td>
                      <td className="name">{p.name}</td>
                      <td>Rs {Number(p.price).toLocaleString()}</td>
                      <td className="desc" title={p.description}>{p.description || '-'}</td>
                      <td>
                        <div className="icon-group">
                          <button className="icon-btn edit" onClick={() => handleEdit(p)} aria-label="Edit product">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>
                          <button className="icon-btn delete" onClick={() => handleDelete(p.id)} aria-label="Delete product">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
                              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" />
                              <path d="M8 6V4h8v2" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6M14 11v6" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-secondary" disabled={page === 1}
                onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <span>Page {page} of {pagination.totalPages}</span>
              <button className="btn btn-secondary" disabled={page === pagination.totalPages}
                onClick={() => setPage(page + 1)}>
                Next
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default ProductsPage;