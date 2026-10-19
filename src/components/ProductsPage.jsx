import { useEffect, useState } from 'react';
import { api, imageSrc } from '../api.js';
import Topbar from './Topbar.jsx';
import ProductModal from './ProductModal.jsx';
import ConfirmDialog from './ConfirmDialog.jsx';
import HeroSlider from './HeroSlider.jsx';
import { IconPlus, IconSearch, IconClose, IconEdit, IconTrash } from './Icons.jsx';
import { can } from '../permissions.js';

const LIMIT = 8;

const formatPrice = (price) => `Rs ${Number(price).toLocaleString('en-PK')}`;

// "12 in stock", "Only 3 left" or "Out of stock"
function StockTag({ stock }) {
  if (stock <= 0) return <span className="stock-tag stock-out">Out of stock</span>;
  if (stock <= 5) return <span className="stock-tag stock-low">Only {stock} left</span>;
  return <span className="stock-tag">{stock} in stock</span>;
}

function ProductsPage({ user, onLogout, onEditProfile, onNavigate, notify }) {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // null = closed, {} = add, { product } = edit
  const [productModal, setProductModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Newest products with a photo, for the slider at the top
  const [heroSlides, setHeroSlides] = useState([]);

  // What this user may do with other people's products
  const canSeeAll = can(user, 'products.view');
  const canEditAny = can(user, 'products.edit');
  const canDeleteAny = can(user, 'products.delete');

  const loadProducts = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const query = new URLSearchParams({ page, limit: LIMIT, search });
      const data = await api(`/products?${query}`);
      setProducts(data.data);
      setPagination(data.pagination);
    } catch (err) {
      if (err.status === 401) {
        onLogout();
        return;
      }
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHero = async () => {
    try {
      const data = await api('/products?limit=20');
      setHeroSlides(data.data.filter((p) => p.image).slice(0, 5));
    } catch {
      // The slider is extra; the grid below shows any real error
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, search]);

  useEffect(() => {
    loadHero();
  }, []);

  // Same rule as the cards: your own unblocked products, or anyone's with products.edit
  const canEditProduct = (p) => (p.userId === user.id && !p.isBlocked) || canEditAny;

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

  const handleSaved = async (saved, isEdit) => {
    setProductModal(null);
    notify(isEdit ? 'Product updated' : 'Product added');
    loadHero();
    if (!isEdit && page !== 1) {
      setPage(1);
    } else {
      await loadProducts();
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api(`/products/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      notify('Product deleted');
      loadHero();
      if (products.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await loadProducts();
      }
    } catch (err) {
      if (err.status === 401) {
        onLogout();
        return;
      }
      setDeleteTarget(null);
      notify(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const countLabel = pagination.total === 1 ? '1 item' : `${pagination.total} items`;

  return (
    <div className="page">
      <Topbar
        user={user}
        view="products"
        onNavigate={onNavigate}
        onEditProfile={onEditProfile}
        onLogout={onLogout}
      />

      <main className="container">
        {/* Only when there's at least one product with a photo */}
        {heroSlides.length > 0 && (
          <HeroSlider
            user={user}
            slides={heroSlides}
            canEdit={canEditProduct}
            onEdit={(product) => setProductModal({ product })}
          />
        )}

        <div className="page-head">
          <div className="page-title">
            <h1>Products</h1>
            {!loading && <span className="count">{countLabel}</span>}
          </div>

          <div className="page-actions">
            <label className="search">
              <IconSearch />
              <input
                type="search"
                placeholder="Search products"
                aria-label="Search products"
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

            <button type="button" className="btn btn-primary" onClick={() => setProductModal({})}>
              <IconPlus /> Add product
            </button>
          </div>
        </div>

        {loadError && (
          <div className="notice">
            <span>Couldn't load products: {loadError}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadProducts}>
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="product-card skeleton" aria-hidden="true">
                <div className="product-image" />
                <div className="product-info">
                  <div className="skeleton-line" />
                  <div className="skeleton-line short" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 && !loadError ? (
          <div className="empty">
            {search ? (
              <>
                <h2>No products match "{search}"</h2>
                <p>Check the spelling or try a shorter search.</p>
                <button type="button" className="btn btn-secondary" onClick={() => setSearchInput('')}>
                  Clear search
                </button>
              </>
            ) : (
              <>
                <h2>Your catalog is empty</h2>
                <p>Add your first product with a photo, price and description.</p>
                <button type="button" className="btn btn-primary" onClick={() => setProductModal({})}>
                  <IconPlus /> Add product
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid">
            {products.map((p) => {
              const isMine = p.userId === user.id;
              const showEdit = canEditProduct(p);
              const showDelete = isMine || canDeleteAny;

              return (
              <article key={p.id} className={`product-card ${p.isBlocked ? 'is-blocked' : ''}`}>
                <div className="product-image">
                  {p.image ? (
                    <img src={imageSrc(p.image)} alt={p.name} loading="lazy" />
                  ) : (
                    <span className="product-image-empty" aria-hidden="true">
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="product-info">
                  <h3 title={p.name}>{p.name}</h3>
                  <StockTag stock={p.stock} />
                  {p.isBlocked && <span className="status status-blocked">Blocked by admin</span>}
                  {p.description && <p className="product-desc">{p.description}</p>}
                  {canSeeAll && !isMine && p.User && <p className="product-owner">Listed by {p.User.name}</p>}

                  <div className="product-foot">
                    <span className="price">{formatPrice(p.price)}</span>
                    <div className="product-actions">
                      {showEdit && (
                        <button type="button" className="icon-button" aria-label={`Edit ${p.name}`}
                          onClick={() => setProductModal({ product: p })}>
                          <IconEdit />
                        </button>
                      )}
                      {showDelete && (
                        <button type="button" className="icon-button icon-button-danger"
                          aria-label={`Delete ${p.name}`} onClick={() => setDeleteTarget(p)}>
                          <IconTrash />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        )}

        {pagination.totalPages > 1 && !loading && (
          <nav className="pagination" aria-label="Pagination">
            <button type="button" className="btn btn-secondary btn-sm" disabled={page === 1}
              onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>Page {page} of {pagination.totalPages}</span>
            <button type="button" className="btn btn-secondary btn-sm"
              disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </nav>
        )}
      </main>

      {productModal && (
        <ProductModal
          product={productModal.product}
          onClose={() => setProductModal(null)}
          onSaved={handleSaved}
          onUnauthorized={onLogout}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete product?"
          message={`"${deleteTarget.name}" and its photo will be removed permanently.`}
          confirmLabel="Delete product"
          busyLabel="Deleting..."
          busy={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export default ProductsPage;