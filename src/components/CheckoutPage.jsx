import { useEffect, useState } from 'react';
import { api, imageSrc } from '../api.js';
import { useCart } from '../CartContext.jsx';
import Topbar from './Topbar.jsx';
import { IconArrowLeft, IconCheck, IconMapPin } from './Icons.jsx';

const formatPrice = (price) => `Rs ${Number(price).toLocaleString('en-PK')}`;
const mapsLink = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;

// "4242424242424242" -> "4242 4242 4242 4242"
const formatCardNumber = (value) => value.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
// "1230" -> "12/30"
const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
};

function CheckoutPage({ user, onLogout, onEditProfile, onNavigate }) {
  const { cart, clearCart } = useCart();

  const [shipping, setShipping] = useState({ fullName: user.name, phone: '', address: '', city: '', postalCode: '' });
  const [note, setNote] = useState('');
  const [saveAddress, setSaveAddress] = useState(true);
  const [pin, setPin] = useState(null); // { latitude, longitude }
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const [payment, setPayment] = useState('cod');
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '' });

  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placedOrders, setPlacedOrders] = useState(null);

  // Fill the form with the address from last time
  useEffect(() => {
    api('/orders/address')
      .then((res) => { if (res.data) setShipping((current) => ({ ...current, ...res.data })); })
      .catch((err) => { if (err.status === 401) onLogout(); });
  }, []);

  const handleShipping = (e) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
    setError('');
  };

  // Ask the browser where the buyer is, so the seller can open it in Maps
  const pinLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Your browser cannot share location.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPin({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocationError(err.code === 1
          ? 'Location permission was blocked. You can still order with the address only.'
          : "Couldn't get your location. You can still order with the address only.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);

  const validate = () => {
    if (shipping.fullName.trim().length < 3) return 'Enter the full name for delivery.';
    if (!/^[0-9+\-\s]{10,15}$/.test(shipping.phone.trim())) return 'Enter a valid phone number, e.g. 0300 1234567.';
    if (shipping.address.trim().length < 5) return 'Enter the street address.';
    if (shipping.city.trim().length < 2) return 'Enter the city.';
    if (payment === 'card') {
      if (card.number.replace(/\D/g, '').length < 13) return 'Enter the card number.';
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) return 'Enter the expiry as MM/YY.';
      if (!/^\d{3,4}$/.test(card.cvc)) return 'Enter the 3 or 4 digit CVC.';
    }
    return '';
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setPlacing(true);
    setError('');
    try {
      const res = await api('/orders', {
        method: 'POST',
        body: {
          items: cart.map((line) => ({ productId: line.productId, quantity: line.quantity })),
          shipping: { ...shipping, ...pin },
          note,
          saveAddress,
          paymentMethod: payment,
          card: payment === 'card' ? card : undefined,
        },
      });
      setPlacedOrders(res.data);
      clearCart();
      window.scrollTo(0, 0);
    } catch (err) {
      if (err.status === 401) return onLogout();
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  const topbar = (
    <Topbar user={user} view="cart" onNavigate={onNavigate} onEditProfile={onEditProfile} onLogout={onLogout} />
  );

  // ----- Thank you screen -----
  if (placedOrders) {
    const paidTotal = placedOrders.reduce((sum, o) => sum + o.total, 0);
    return (
      <div className="page">
        {topbar}
        <main className="container">
          <div className="placed card">
            <span className="placed-icon"><IconCheck /></span>
            <h1>Thank you, your order is placed</h1>
            <p>
              {placedOrders.length === 1
                ? `Order #${placedOrders[0].id}`
                : `Orders ${placedOrders.map((o) => `#${o.id}`).join(', ')}`}{' '}
              · {formatPrice(paidTotal)} ·{' '}
              {placedOrders[0].paymentMethod === 'card'
                ? `paid by card ending ${placedOrders[0].cardLast4}`
                : 'pay cash on delivery'}
            </p>
            <p className="muted">
              Delivering to {placedOrders[0].address}, {placedOrders[0].city}. The seller will mark it as shipped.
            </p>
            <div className="placed-actions">
              <button type="button" className="btn btn-primary" onClick={() => onNavigate('orders')}>Track my orders</button>
              <button type="button" className="btn btn-secondary" onClick={() => onNavigate('shop')}>Continue shopping</button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="page">
        {topbar}
        <main className="container">
          <div className="empty">
            <h2>Your cart is empty</h2>
            <p>Add something to your cart before checking out.</p>
            <button type="button" className="btn btn-primary" onClick={() => onNavigate('shop')}>Go to the shop</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      {topbar}

      <main className="container">
        <button type="button" className="back-link" onClick={() => onNavigate('cart')}>
          <IconArrowLeft /> Back to cart
        </button>

        <div className="page-head">
          <div className="page-title"><h1>Checkout</h1></div>
        </div>

        <form className="checkout-layout" onSubmit={placeOrder} noValidate>
          <div className="checkout-main">
            <section className="card checkout-section" aria-labelledby="delivery-title">
              <h2 id="delivery-title">Delivery address</h2>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="ship-name">Full name</label>
                  <input id="ship-name" name="fullName" autoComplete="name" value={shipping.fullName} onChange={handleShipping} />
                </div>
                <div className="field">
                  <label htmlFor="ship-phone">Phone</label>
                  <input id="ship-phone" name="phone" type="tel" autoComplete="tel" placeholder="0300 1234567"
                    value={shipping.phone} onChange={handleShipping} />
                </div>
                <div className="field field-wide">
                  <label htmlFor="ship-address">Street address</label>
                  <input id="ship-address" name="address" autoComplete="street-address" placeholder="House, street, area"
                    value={shipping.address} onChange={handleShipping} />
                </div>
                <div className="field">
                  <label htmlFor="ship-city">City</label>
                  <input id="ship-city" name="city" autoComplete="address-level2" placeholder="Lahore"
                    value={shipping.city} onChange={handleShipping} />
                </div>
                <div className="field">
                  <label htmlFor="ship-postal">Postal code <span className="optional">Optional</span></label>
                  <input id="ship-postal" name="postalCode" autoComplete="postal-code" inputMode="numeric"
                    value={shipping.postalCode} onChange={handleShipping} />
                </div>
              </div>

              <div className="location-row">
                {pin ? (
                  <p className="location-pinned">
                    <IconMapPin /> Location pinned.{' '}
                    <a href={mapsLink(pin.latitude, pin.longitude)} target="_blank" rel="noreferrer">Check it on the map</a>
                    {' · '}
                    <button type="button" className="link link-danger" onClick={() => setPin(null)}>Remove</button>
                  </p>
                ) : (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={pinLocation} disabled={locating}>
                    <IconMapPin /> {locating ? 'Finding you...' : 'Pin my current location'}
                  </button>
                )}
                <span className="hint">Optional. Helps the rider find you.</span>
                {locationError && <p className="hint location-error">{locationError}</p>}
              </div>

              <div className="field">
                <label htmlFor="ship-note">Note for the seller <span className="optional">Optional</span></label>
                <input id="ship-note" maxLength={300} placeholder="e.g. Call before coming, gate is on the side street"
                  value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              <label className="check">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                Save this address for next time
              </label>
            </section>

            <section className="card checkout-section" aria-labelledby="payment-title">
              <h2 id="payment-title">Payment</h2>
              <div className="pay-options" role="radiogroup" aria-labelledby="payment-title">
                <label className={`pay-option ${payment === 'cod' ? 'is-selected' : ''}`}>
                  <input type="radio" name="payment" value="cod" checked={payment === 'cod'}
                    onChange={() => { setPayment('cod'); setError(''); }} />
                  <span>
                    <strong>Cash on delivery</strong>
                    <small>Pay the rider when your order arrives</small>
                  </span>
                </label>
                <label className={`pay-option ${payment === 'card' ? 'is-selected' : ''}`}>
                  <input type="radio" name="payment" value="card" checked={payment === 'card'}
                    onChange={() => { setPayment('card'); setError(''); }} />
                  <span>
                    <strong>Debit or credit card</strong>
                    <small>Pay now</small>
                  </span>
                </label>
              </div>

              {payment === 'card' && (
                <div className="card-fields">
                  <div className="field field-wide">
                    <label htmlFor="card-number">Card number</label>
                    <input id="card-number" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242"
                      value={card.number} onChange={(e) => { setCard({ ...card, number: formatCardNumber(e.target.value) }); setError(''); }} />
                  </div>
                  <div className="field">
                    <label htmlFor="card-expiry">Expiry</label>
                    <input id="card-expiry" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY"
                      value={card.expiry} onChange={(e) => { setCard({ ...card, expiry: formatExpiry(e.target.value) }); setError(''); }} />
                  </div>
                  <div className="field">
                    <label htmlFor="card-cvc">CVC</label>
                    <input id="card-cvc" inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4}
                      value={card.cvc} onChange={(e) => { setCard({ ...card, cvc: e.target.value.replace(/\D/g, '') }); setError(''); }} />
                  </div>
                  <p className="hint field-wide">
                    Practice mode, no real money is charged. Use 4242 4242 4242 4242 with any future date.
                    4000 0000 0000 0002 shows a declined card.
                  </p>
                </div>
              )}
            </section>
          </div>

          <aside className="summary card">
            <h2>Your order</h2>
            <ul className="summary-lines">
              {cart.map((line) => (
                <li key={line.productId}>
                  <span className="summary-thumb">
                    {line.image ? <img src={imageSrc(line.image)} alt="" /> : line.name.charAt(0)}
                    <span className="summary-qty">{line.quantity}</span>
                  </span>
                  <span className="summary-name">{line.name}</span>
                  <span className="summary-amount">{formatPrice(line.price * line.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="summary-rows">
              <div><dt>Delivery</dt><dd>Free</dd></div>
              <div className="summary-total"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
            </dl>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary full btn-lg" disabled={placing}>
              {placing ? 'Placing order...' : payment === 'card' ? `Pay ${formatPrice(total)}` : 'Place order'}
            </button>
          </aside>
        </form>
      </main>
    </div>
  );
}

export default CheckoutPage;