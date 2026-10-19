import { useEffect, useState } from 'react';
import { api, imageSrc } from '../api.js';
import Topbar from './Topbar.jsx';
import SaleReceipt from './SaleReceipt.jsx';
import { IconSearch, IconClose, IconTrash } from './Icons.jsx';

const formatPrice = (price) => `Rs ${Number(price).toLocaleString('en-PK')}`;

// Point of sale: pick your own products, build a cart, take payment.
function PosPage({ user, onLogout, onEditProfile, onNavigate, notify }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // cart: [{ product, quantity }]
  const [cart, setCart] = useState([]);
  const [payment, setPayment] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState(null);

  // Only my own products that are in stock and not blocked
  const loadProducts = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const query = new URLSearchParams({ mine: 'true', inStock: 'true', limit: 50, search, sortBy: 'name', order: 'ASC' });
      const data = await api(`/products?${query}`);
      setProducts(data.data);
    } catch (err) {
      if (err.status === 401) return onLogout();
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search]);

  // Search as you type, but wait until typing pauses
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ----- Cart -----
  const inCart = (id) => cart.find((line) => line.product.id === id)?.quantity || 0;

  const addToCart = (product) => {
    setCheckoutError('');
    if (inCart(product.id) >= product.stock) {
      notify(`Only ${product.stock} of "${product.name}" in stock`, 'error');
      return;
    }
    setCart((current) =>
      current.some((line) => line.product.id === product.id)
        ? current.map((line) =>
            line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line
          )
        : [...current, { product, quantity: 1 }]
    );
  };

  const setQuantity = (id, quantity) => {
    setCheckoutError('');
    setCart((current) =>
      current
        .map((line) =>
          line.product.id === id
            ? { ...line, quantity: Math.min(Math.max(quantity, 0), line.product.stock) }
            : line
        )
        .filter((line) => line.quantity > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
    setCashReceived('');
    setCheckoutError('');
  };

  const total = cart.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const cash = Number(cashReceived);
  const change = payment === 'cash' && cashReceived !== '' ? cash - total : null;

  // ----- Checkout -----
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (payment === 'cash' && cashReceived !== '' && cash < total) {
      setCheckoutError('Cash received is less than the total.');
      return;
    }

    setSaving(true);
    setCheckoutError('');
    try {
      const data = await api('/sales', {
        method: 'POST',
        body: {
          items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
          paymentMethod: payment,
          cashReceived: payment === 'cash' && cashReceived !== '' ? cash : undefined,
        },
      });
      setReceipt(data.data);
      clearCart();
      loadProducts(); // stock went down
    } catch (err) {
      if (err.status === 401) return onLogout();
      setCheckoutError(err.message);
      loadProducts(); // stock may have changed since the page loaded
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <Topbar user={user} view="pos" onNavigate={onNavigate} onEditProfile={onEditProfile} onLogout={onLogout} />

      <main className="container pos">
        <section className="pos-products" aria-label="Products">
          <div className="page-head">
            <div className="page-title">
              <h1>Point of sale</h1>
            </div>
            <label className="search">
              <IconSearch />
              <input
                type="search"
                placeholder="Search your products"
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
          </div>

          {loadError && (
            <div className="notice">
              <span>Couldn't load products: {loadError}</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={loadProducts}>Try again</button>
            </div>
          )}

          {loading && products.length === 0 ? (
            <p className="muted">Loading products...</p>
          ) : products.length === 0 && !loadError ? (
            <div className="empty">
              {search ? (
                <>
                  <h2>No products match "{search}"</h2>
                  <p>Only your own products that are in stock show here.</p>
                </>
              ) : (
                <>
                  <h2>Nothing to sell yet</h2>
                  <p>Add stock to your products on the Products page, then they will show here.</p>
                  <button type="button" className="btn btn-primary" onClick={() => onNavigate('products')}>
                    Go to products
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="pos-grid">
              {products.map((p) => {
                const left = p.stock - inCart(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className="pos-tile"
                    onClick={() => addToCart(p)}
                    disabled={left <= 0}
                    aria-label={`Add ${p.name}, ${formatPrice(p.price)}, ${left} left`}
                  >
                    <span className="pos-tile-image">
                      {p.image ? (
                        <img src={imageSrc(p.image)} alt="" loading="lazy" />
                      ) : (
                        <span className="product-image-empty">{p.name.charAt(0).toUpperCase()}</span>
                      )}
                      {inCart(p.id) > 0 && <span className="pos-tile-count">{inCart(p.id)}</span>}
                    </span>
                    <span className="pos-tile-info">
                      <strong>{p.name}</strong>
                      <span className="pos-tile-meta">
                        <span className="price">{formatPrice(p.price)}</span>
                        <span className={left <= 5 ? 'stock-low' : ''}>{left} left</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <aside className="pos-cart" id="cart" aria-label="Cart">
          <div className="pos-cart-head">
            <h2>Current sale</h2>
            {cart.length > 0 && (
              <button type="button" className="link link-danger" onClick={clearCart}>Clear</button>
            )}
          </div>

          {cart.length === 0 ? (
            <p className="pos-cart-empty">Tap a product to add it here.</p>
          ) : (
            <ul className="pos-lines">
              {cart.map(({ product, quantity }) => (
                <li key={product.id} className="pos-line">
                  <div className="pos-line-name">
                    <strong>{product.name}</strong>
                    <span>{formatPrice(product.price)} each</span>
                  </div>
                  <div className="qty" role="group" aria-label={`Quantity of ${product.name}`}>
                    <button type="button" aria-label="One less" onClick={() => setQuantity(product.id, quantity - 1)}>−</button>
                    <span aria-live="polite">{quantity}</span>
                    <button
                      type="button"
                      aria-label="One more"
                      onClick={() => setQuantity(product.id, quantity + 1)}
                      disabled={quantity >= product.stock}
                    >
                      +
                    </button>
                  </div>
                  <span className="pos-line-total">{formatPrice(product.price * quantity)}</span>
                  <button
                    type="button"
                    className="icon-button icon-button-danger"
                    aria-label={`Remove ${product.name}`}
                    onClick={() => setQuantity(product.id, 0)}
                  >
                    <IconTrash />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="pos-summary">
            <div className="pos-total">
              <span>Total{itemCount > 0 && ` (${itemCount} item${itemCount === 1 ? '' : 's'})`}</span>
              <strong>{formatPrice(total)}</strong>
            </div>

            <div className="tabs pos-pay" role="radiogroup" aria-label="Payment method">
              {['cash', 'card'].map((method) => (
                <button
                  key={method}
                  type="button"
                  role="radio"
                  aria-checked={payment === method}
                  className={`tab ${payment === method ? 'active' : ''}`}
                  onClick={() => { setPayment(method); setCheckoutError(''); }}
                >
                  {method === 'cash' ? 'Cash' : 'Card'}
                </button>
              ))}
            </div>

            {payment === 'cash' && (
              <div className="field">
                <label htmlFor="cash-received">
                  Cash received <span className="optional">Optional</span>
                </label>
                <div className="input-prefix">
                  <span>Rs</span>
                  <input
                    id="cash-received"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder={total ? String(total) : '0'}
                    value={cashReceived}
                    onChange={(e) => { setCashReceived(e.target.value); setCheckoutError(''); }}
                  />
                </div>
                {change !== null && change >= 0 && (
                  <p className="pos-change">Change to give: <strong>{formatPrice(change)}</strong></p>
                )}
              </div>
            )}

            {checkoutError && <p className="form-error" role="alert">{checkoutError}</p>}

            <button
              type="button"
              className="btn btn-primary full pos-checkout"
              onClick={handleCheckout}
              disabled={cart.length === 0 || saving}
            >
              {saving ? 'Completing...' : cart.length === 0 ? 'Complete sale' : `Complete sale, ${formatPrice(total)}`}
            </button>
          </div>
        </aside>

        {/* Phones: a bar that jumps to the cart */}
        {cart.length > 0 && (
          <a href="#cart" className="pos-mobile-bar">
            <span>{itemCount} item{itemCount === 1 ? '' : 's'}</span>
            <strong>{formatPrice(total)}</strong>
            <span>View sale</span>
          </a>
        )}
      </main>

      {receipt && (
        <SaleReceipt
          sale={receipt}
          onClose={() => setReceipt(null)}
          actionLabel="New sale"
          onAction={() => setReceipt(null)}
        />
      )}
    </div>
  );
}

export default PosPage;