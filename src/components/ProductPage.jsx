import { useEffect, useState } from 'react';
import { api, imageSrc } from '../api.js';
import { useCart } from '../CartContext.jsx';
import Topbar from './Topbar.jsx';
import Avatar from './Avatar.jsx';
import { Stars, StarInput } from './Stars.jsx';
import { IconArrowLeft, IconChevronLeft, IconChevronRight } from './Icons.jsx';

const formatPrice = (price) => `Rs ${Number(price).toLocaleString('en-PK')}`;
const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Big photo with thumbnails underneath
function Gallery({ name, photos }) {
  const [index, setIndex] = useState(0);
  const count = photos.length;
  const go = (next) => setIndex((next + count) % count);

  if (count === 0) {
    return (
      <div className="gallery">
        <div className="gallery-main">
          <div className="product-image-empty">{name.charAt(0).toUpperCase()}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery">
      <div
        className="gallery-main"
        tabIndex={count > 1 ? 0 : undefined}
        aria-label={count > 1 ? 'Photos, use the arrow keys to change' : undefined}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(index + 1);
          if (e.key === 'ArrowLeft') go(index - 1);
        }}
      >
        <img src={imageSrc(photos[index])} alt={`${name}, photo ${index + 1} of ${count}`} />
        {count > 1 && (
          <>
            <button type="button" className="gallery-arrow gallery-prev" aria-label="Previous photo" onClick={() => go(index - 1)}>
              <IconChevronLeft />
            </button>
            <button type="button" className="gallery-arrow gallery-next" aria-label="Next photo" onClick={() => go(index + 1)}>
              <IconChevronRight />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="gallery-thumbs">
          {photos.map((photo, i) => (
            <button
              key={photo}
              type="button"
              className={`gallery-thumb ${i === index ? 'is-active' : ''}`}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => setIndex(i)}
            >
              <img src={imageSrc(photo)} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Average, total and the 5 to 1 star bars
function RatingSummary({ product, breakdown }) {
  return (
    <div className="rating-summary">
      <div className="rating-big">
        <strong>{product.ratingCount > 0 ? product.ratingAvg.toFixed(1) : '–'}</strong>
        <Stars value={product.ratingAvg} size={18} />
        <span>{product.ratingCount} review{product.ratingCount === 1 ? '' : 's'}</span>
      </div>
      <ul className="rating-bars">
        {[5, 4, 3, 2, 1].map((n) => {
          const count = breakdown[n] || 0;
          const percent = product.ratingCount ? Math.round((count / product.ratingCount) * 100) : 0;
          return (
            <li key={n}>
              <span>{n} ★</span>
              <span className="rating-bar"><span style={{ width: `${percent}%` }} /></span>
              <span className="rating-bar-count">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Write or edit my review
function ReviewForm({ productId, myReview, onSaved, onLogout }) {
  const [rating, setRating] = useState(myReview?.rating || 0);
  const [comment, setComment] = useState(myReview?.comment || '');
  const [editing, setEditing] = useState(!myReview);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError('Choose 1 to 5 stars.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = await api(`/shop/products/${productId}/reviews`, {
        method: 'POST',
        body: { rating, comment },
      });
      setEditing(false);
      onSaved(data.message);
    } catch (err) {
      if (err.status === 401) return onLogout();
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    setError('');
    try {
      await api(`/shop/products/${productId}/reviews`, { method: 'DELETE' });
      setRating(0);
      setComment('');
      setEditing(true);
      onSaved('Review deleted');
    } catch (err) {
      if (err.status === 401) return onLogout();
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="review-box">
        <p className="review-box-title">You reviewed this product</p>
        <div className="review-actions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit review</button>
          <button type="button" className="link link-danger" onClick={remove} disabled={saving}>Delete</button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <form className="review-box stack" onSubmit={save}>
      <p className="review-box-title">{myReview ? 'Edit your review' : 'Rate this product'}</p>
      <StarInput value={rating} onChange={(n) => { setRating(n); setError(''); }} />
      <div className="field">
        <label htmlFor="review-comment">
          Your review <span className="optional">Optional</span>
        </label>
        <textarea
          id="review-comment"
          rows="3"
          maxLength={1000}
          placeholder="What did you like or not like?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="review-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : myReview ? 'Save review' : 'Post review'}
        </button>
        {myReview && (
          <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
        )}
      </div>
    </form>
  );
}

// One product: photos, details, add to cart, reviews
function ProductPage({ user, productId, onLogout, onEditProfile, onNavigate, notify }) {
  const { cart, addToCart } = useCart();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);

  const load = async () => {
    setError('');
    try {
      const res = await api(`/shop/products/${productId}`);
      setData(res.data);
    } catch (err) {
      if (err.status === 401) return onLogout();
      setError(err.message);
    }
  };

  useEffect(() => {
    setData(null);
    setQuantity(1);
    load();
  }, [productId]);

  const topbar = (
    <Topbar user={user} view="shop" onNavigate={onNavigate} onEditProfile={onEditProfile} onLogout={onLogout} />
  );

  const backLink = (
    <button type="button" className="back-link" onClick={() => onNavigate('shop')}>
      <IconArrowLeft /> Back to shop
    </button>
  );

  if (error) {
    return (
      <div className="page">
        {topbar}
        <main className="container">
          {backLink}
          <div className="empty">
            <h2>{error === 'Product not found' ? 'This product is not available' : "Couldn't load this product"}</h2>
            <p>{error === 'Product not found' ? 'It may have been removed by the seller.' : error}</p>
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('shop')}>Browse the shop</button>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page">
        {topbar}
        <main className="container">
          {backLink}
          <p className="muted">Loading...</p>
        </main>
      </div>
    );
  }

  const { product, reviews, breakdown, myReview, canReview } = data;
  const isMine = product.userId === user.id;
  const photos = [product.image, ...product.images.map((img) => img.url)].filter(Boolean);
  const inCart = cart.find((line) => line.productId === product.id)?.quantity || 0;
  const canAdd = product.stock - inCart;

  const handleAdd = (goToCart) => {
    const added = addToCart(product, quantity);
    if (added && goToCart) onNavigate('cart');
    setQuantity(1);
  };

  return (
    <div className="page">
      {topbar}

      <main className="container">
        {backLink}

        <div className="product-detail">
          <Gallery name={product.name} photos={photos} />

          <div className="product-detail-info">
            <h1>{product.name}</h1>

            <a href="#reviews" className="rating-line">
              <Stars value={product.ratingAvg} size={16} />
              {product.ratingCount > 0
                ? <span>{product.ratingAvg.toFixed(1)} · {product.ratingCount} review{product.ratingCount === 1 ? '' : 's'}</span>
                : <span>No reviews yet</span>}
            </a>

            <p className="detail-price">{formatPrice(product.price)}</p>

            <p className={`stock-tag ${product.stock <= 0 ? 'stock-out' : product.stock <= 5 ? 'stock-low' : ''}`}>
              {product.stock <= 0 ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left` : `${product.stock} in stock`}
            </p>

            {product.description && <p className="detail-desc">{product.description}</p>}

            <div className="seller-line">
              <Avatar user={product.User} size={36} />
              <div>
                <span>Sold by</span>
                <strong>{isMine ? 'You' : product.User.name}</strong>
              </div>
            </div>

            {isMine ? (
              <p className="detail-note">This is your product. Buyers see this page. You can sell it in person from the POS.</p>
            ) : product.stock <= 0 ? (
              <p className="detail-note">Sold out for now. Check back later.</p>
            ) : (
              <div className="buy-box">
                <div className="qty qty-lg" role="group" aria-label="Quantity">
                  <button type="button" aria-label="One less" onClick={() => setQuantity(Math.max(quantity - 1, 1))} disabled={quantity <= 1}>−</button>
                  <span aria-live="polite">{quantity}</span>
                  <button type="button" aria-label="One more" onClick={() => setQuantity(quantity + 1)} disabled={quantity >= canAdd}>+</button>
                </div>
                <button type="button" className="btn btn-secondary" onClick={() => handleAdd(false)} disabled={canAdd <= 0}>
                  Add to cart
                </button>
                <button type="button" className="btn btn-primary" onClick={() => handleAdd(true)} disabled={canAdd <= 0}>
                  Buy now
                </button>
                {inCart > 0 && (
                  <p className="buy-box-note">
                    {inCart} in your cart{canAdd <= 0 ? ', that is all the stock' : ''}.{' '}
                    <button type="button" className="link" onClick={() => onNavigate('cart')}>View cart</button>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <section className="reviews" id="reviews" aria-labelledby="reviews-title">
          <h2 id="reviews-title">Reviews</h2>

          <div className="reviews-layout">
            <div className="reviews-side">
              <RatingSummary product={product} breakdown={breakdown} />

              {canReview ? (
                <ReviewForm
                  key={myReview?.id || 'new'}
                  productId={product.id}
                  myReview={myReview}
                  onLogout={onLogout}
                  onSaved={(message) => { notify(message); load(); }}
                />
              ) : !isMine && (
                <p className="detail-note">Only customers who received this product can review it.</p>
              )}
            </div>

            {reviews.length === 0 ? (
              <p className="muted reviews-empty">No reviews yet.</p>
            ) : (
              <ul className="review-list">
                {reviews.map((r) => (
                  <li key={r.id} className="review">
                    <div className="review-head">
                      <Avatar user={r.User} size={32} />
                      <div>
                        <strong>{r.userId === user.id ? 'You' : r.User?.name}</strong>
                        <span>{formatDate(r.updatedAt)}</span>
                      </div>
                    </div>
                    <Stars value={r.rating} size={14} />
                    {r.comment && <p>{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default ProductPage;