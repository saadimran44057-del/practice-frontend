import { useEffect, useState } from 'react';
import { api, imageSrc } from '../api.js';
import { useCart } from '../CartContext.jsx';
import Topbar from './Topbar.jsx';
import { IconTrash } from './Icons.jsx';

const formatPrice = (price) => `Rs ${Number(price).toLocaleString('en-PK')}`;

function CartPage({ user, onLogout, onEditProfile, onNavigate }) {
  const { cart, setQuantity, replaceCart } = useCart();
  const [notice, setNotice] = useState('');

  // Prices and stock may have changed since things were added: check again
  useEffect(() => {
    if (cart.length === 0) return;
    let cancelled = false;

    Promise.allSettled(cart.map((line) => api(`/shop/products/${line.productId}`))).then((results) => {
      if (cancelled) return;
      const changes = [];
      const fresh = [];

      results.forEach((result, i) => {
        const line = cart[i];
        if (result.status === 'rejected') {
          // Only remove it if the product is really gone (404). Other errors: keep it
          if (result.reason.status === 404) {
            changes.push(`"${line.name}" is no longer available and was removed`);
          } else {
            changes.push(`Couldn't check "${line.name}": ${result.reason.message}`);
            fresh.push(line);
          }
          return;
        }
        const p = result.value.data.product;
        if (p.stock <= 0) {
          changes.push(`"${p.name}" sold out and was removed`);
          return;
        }
        const quantity = Math.min(line.quantity, p.stock);
        if (quantity < line.quantity) changes.push(`Only ${p.stock} left of "${p.name}", quantity lowered`);
        if (p.price !== line.price) changes.push(`The price of "${p.name}" changed to ${formatPrice(p.price)}`);
        fresh.push({ ...line, name: p.name, price: p.price, image: p.image, stock: p.stock, quantity });
      });

      if (changes.length) {
        replaceCart(fresh);
        setNotice(changes.join('. ') + '.');
      }
    });

    return () => { cancelled = true; };
  }, []);

  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const sellerCount = new Set(cart.map((line) => line.sellerId)).size;

  return (
    <div className="page">
      <Topbar user={user} view="cart" onNavigate={onNavigate} onEditProfile={onEditProfile} onLogout={onLogout} />

      <main className="container">
        <div className="page-head">
          <div className="page-title">
            <h1>Your cart</h1>
            {itemCount > 0 && <span className="count">{itemCount} item{itemCount === 1 ? '' : 's'}</span>}
          </div>
        </div>

        {notice && <p className="notice notice-info" role="status">{notice}</p>}

        {cart.length === 0 ? (
          <div className="empty">
            <h2>Your cart is empty</h2>
            <p>Find something you like in the shop.</p>
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('shop')}>Go to the shop</button>
          </div>
        ) : (
          <div className="checkout-layout">
            <ul className="cart-lines card">
              {cart.map((line) => (
                <li key={line.productId} className="cart-line">
                  <button type="button" className="cart-thumb" onClick={() => onNavigate('product', line.productId)}
                    aria-label={`View ${line.name}`}>
                    {line.image ? <img src={imageSrc(line.image)} alt="" /> : <span>{line.name.charAt(0)}</span>}
                  </button>
                  <div className="cart-line-info">
                    <button type="button" className="cart-line-name" onClick={() => onNavigate('product', line.productId)}>
                      {line.name}
                    </button>
                    <span>by {line.sellerName} · {formatPrice(line.price)} each</span>
                  </div>
                  <div className="qty" role="group" aria-label={`Quantity of ${line.name}`}>
                    <button type="button" aria-label="One less" onClick={() => setQuantity(line.productId, line.quantity - 1)}>−</button>
                    <span aria-live="polite">{line.quantity}</span>
                    <button type="button" aria-label="One more" onClick={() => setQuantity(line.productId, line.quantity + 1)}
                      disabled={line.quantity >= line.stock}>+</button>
                  </div>
                  <span className="cart-line-total">{formatPrice(line.price * line.quantity)}</span>
                  <button type="button" className="icon-button icon-button-danger" aria-label={`Remove ${line.name}`}
                    onClick={() => setQuantity(line.productId, 0)}>
                    <IconTrash />
                  </button>
                </li>
              ))}
            </ul>

            <aside className="summary card">
              <h2>Summary</h2>
              <dl className="summary-rows">
                <div><dt>Items ({itemCount})</dt><dd>{formatPrice(total)}</dd></div>
                <div><dt>Delivery</dt><dd>Free</dd></div>
                <div className="summary-total"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
              </dl>
              {sellerCount > 1 && (
                <p className="hint">These items come from {sellerCount} sellers, so they arrive as {sellerCount} separate orders.</p>
              )}
              <button type="button" className="btn btn-primary full btn-lg" onClick={() => onNavigate('checkout')}>
                Checkout
              </button>
              <button type="button" className="link summary-continue" onClick={() => onNavigate('shop')}>Continue shopping</button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default CartPage;