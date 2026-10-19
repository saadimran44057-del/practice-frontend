import { useEffect, useState } from 'react';
import { api, imageSrc } from '../api.js';
import { useCart } from '../CartContext.jsx';
import Topbar from './Topbar.jsx';
import { Stars } from './Stars.jsx';
import { IconSearch, IconClose } from './Icons.jsx';

const LIMIT = 12;

const SORTS = [
  { id: 'newest', label: 'Newest' },
  { id: 'price_asc', label: 'Price: low to high' },
  { id: 'price_desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Top rated' },
];

const formatPrice = (price) => `Rs ${Number(price).toLocaleString('en-PK')}`;

// Everyone's products, for buyers
function ShopPage({ user, onLogout, onEditProfile, onNavigate }) {
  const { addToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ page, limit: LIMIT, search, sort });
      const data = await api(`/shop/products?${query}`);
      setProducts(data.data);
      setPagination(data.pagination);
    } catch (err) {
      if (err.status === 401) return onLogout();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [page, search, sort]);

  // Search as you type, but wait until typing pauses
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  return (
    <div className="page">
      <Topbar user={user} view="shop" onNavigate={onNavigate} onEditProfile={onEditProfile} onLogout={onLogout} />

      <main className="container">
        <div className="page-head">
          <div className="page-title">
            <h1>Shop</h1>
            {!loading && <span className="count">{pagination.total} products</span>}
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
                <button type="button" className="search-clear" aria-label="Clear search" onClick={() => setSearchInput('')}>
                  <IconClose />
                </button>
              )}
            </label>
            <select
              className="select"
              aria-label="Sort products"
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
            >
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="notice">
            <span>Couldn't load products: {error}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadProducts}>Try again</button>
          </div>
        )}

        {loading && products.length === 0 ? (
          <div className="grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="product-card skeleton" aria-hidden="true">
                <div className="product-image" />
                <div className="product-info">
                  <div className="skeleton-line" />
                  <div className="skeleton-line short" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 && !error ? (
          <div className="empty">
            <h2>{search ? `Nothing matches "${search}"` : 'The shop is empty'}</h2>
            <p>{search ? 'Try a different word.' : 'When sellers add products, they show up here.'}</p>
            {search && (
              <button type="button" className="btn btn-secondary" onClick={() => setSearchInput('')}>Clear search</button>
            )}
          </div>
        ) : (
          <div className="grid">
            {products.map((p) => {
              const isMine = p.userId === user.id;
              const soldOut = p.stock <= 0;
              return (
                <article key={p.id} className="product-card shop-card">
                  {/* The photo opens the product too. The name below is the keyboard way in */}
                  <button
                    type="button"
                    className="shop-card-open"
                    onClick={() => onNavigate('product', p.id)}
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <div className="product-image">
                      {p.image ? (
                        <img src={imageSrc(p.image)} alt="" loading="lazy" />
                      ) : (
                        <div className="product-image-empty">{p.name.charAt(0).toUpperCase()}</div>
                      )}
                      {soldOut && <span className="shop-card-flag">Sold out</span>}
                    </div>
                  </button>

                  <div className="product-info">
                    <h3 title={p.name}>
                      <button type="button" className="shop-card-name" onClick={() => onNavigate('product', p.id)}>
                        {p.name}
                      </button>
                    </h3>
                    <span className="product-owner">by {isMine ? 'you' : p.User?.name}</span>
                    <div className="rating-line">
                      {p.ratingCount > 0 ? (
                        <>
                          <Stars value={p.ratingAvg} size={14} />
                          <span>{p.ratingAvg.toFixed(1)} ({p.ratingCount})</span>
                        </>
                      ) : (
                        <span className="muted">No reviews yet</span>
                      )}
                    </div>
                    <div className="product-foot">
                      <span className="price">{formatPrice(p.price)}</span>
                      {!isMine && !soldOut && (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => addToCart(p)}>
                          Add to cart
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button type="button" className="btn btn-secondary btn-sm" disabled={page === 1 || loading}
              onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>Page {page} of {pagination.totalPages}</span>
            <button type="button" className="btn btn-secondary btn-sm"
              disabled={page === pagination.totalPages || loading} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default ShopPage;