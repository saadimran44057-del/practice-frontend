import { useState } from 'react';
import { api, imageSrc } from '../api.js';
import Modal from './Modal.jsx';
import { IconMapPin } from './Icons.jsx';

const formatPrice = (price) => `Rs ${Number(price).toLocaleString('en-PK')}`;
const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

export const STATUS_LABELS = {
  pending: 'Pending',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const paymentText = (order) => {
  if (order.paymentMethod === 'card') {
    return `Card •••• ${order.cardLast4}${order.paymentStatus === 'refunded' ? ', refunded' : ', paid'}`;
  }
  return order.paymentStatus === 'paid' ? 'Cash on delivery, paid' : 'Cash on delivery, not paid yet';
};

// Short version for the orders table: "Card · Paid", "Cash · Unpaid"
export const paymentShort = (order) => {
  const method = order.paymentMethod === 'card' ? 'Card' : 'Cash';
  const state = { paid: 'Paid', unpaid: 'Unpaid', refunded: 'Refunded' }[order.paymentStatus];
  return `${method} · ${state}`;
};

// Placed -> Shipped -> Delivered
function StatusSteps({ status }) {
  if (status === 'cancelled') {
    return <p className="order-cancelled">This order was cancelled. Any stock went back to the seller.</p>;
  }
  const steps = ['pending', 'shipped', 'delivered'];
  const reached = steps.indexOf(status);
  return (
    <ol className="order-steps">
      {steps.map((step, i) => (
        <li key={step} className={i <= reached ? 'is-done' : ''} aria-current={i === reached ? 'step' : undefined}>
          <span className="order-step-dot" />
          {step === 'pending' ? 'Placed' : STATUS_LABELS[step]}
        </li>
      ))}
    </ol>
  );
}

// mode: 'buyer' (my purchases) or 'seller' (orders for my products)
function OrderModal({ order, mode, canManage, onClose, onUpdated, onReview, onUnauthorized }) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (path, body) => {
    setBusy(true);
    setError('');
    try {
      const res = await api(path, { method: 'PATCH', body });
      setConfirmingCancel(false);
      onUpdated(res.data, res.message);
    } catch (err) {
      if (err.status === 401) return onUnauthorized();
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const setStatus = (status) => run(`/orders/${order.id}/status`, { status });
  const cancel = () =>
    mode === 'seller' ? setStatus('cancelled') : run(`/orders/${order.id}/cancel`);

  const isSeller = mode === 'seller' && canManage;
  const canCancel = isSeller
    ? ['pending', 'shipped'].includes(order.status)
    : order.status === 'pending';
  const nextStep = isSeller && { pending: 'shipped', shipped: 'delivered' }[order.status];

  let footer;
  if (confirmingCancel) {
    footer = (
      <>
        <span className="footer-question">Cancel this order?</span>
        <button type="button" className="btn btn-secondary" onClick={() => setConfirmingCancel(false)} data-autofocus>
          Keep order
        </button>
        <button type="button" className="btn btn-danger" onClick={cancel} disabled={busy}>
          {busy ? 'Cancelling...' : 'Yes, cancel'}
        </button>
      </>
    );
  } else {
    footer = (
      <>
        {canCancel && (
          <button type="button" className="btn btn-outline-danger footer-left" onClick={() => setConfirmingCancel(true)}>
            Cancel order
          </button>
        )}
        <button type="button" className="btn btn-secondary" onClick={onClose} data-autofocus={nextStep ? undefined : true}>
          Close
        </button>
        {nextStep && (
          <button type="button" className="btn btn-primary" onClick={() => setStatus(nextStep)} disabled={busy} data-autofocus>
            {busy ? 'Saving...' : nextStep === 'shipped' ? 'Mark as shipped' : 'Mark as delivered'}
          </button>
        )}
      </>
    );
  }

  return (
    <Modal title={`Order #${order.id}`} description={formatDateTime(order.createdAt)} onClose={onClose} footer={footer}>
      <div className="stack">
        <StatusSteps status={order.status} />

        <ul className="order-items">
          {order.items.map((item) => (
            <li key={item.id}>
              <span className="summary-thumb">
                {item.image ? <img src={imageSrc(item.image)} alt="" /> : item.name.charAt(0)}
              </span>
              <div className="order-item-info">
                <strong>{item.name}</strong>
                <span>{item.quantity} × {formatPrice(item.price)}</span>
                {mode === 'buyer' && order.status === 'delivered' && item.productId && (
                  <button type="button" className="link" onClick={() => onReview(item.productId)}>
                    Rate and review
                  </button>
                )}
              </div>
              <span className="summary-amount">{formatPrice(item.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="order-facts">
          <div className="order-fact-total"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
          <div><dt>Payment</dt><dd>{paymentText(order)}</dd></div>
          {mode === 'seller'
            ? <div><dt>Customer</dt><dd>{order.buyer?.name || 'Deleted account'}</dd></div>
            : <div><dt>Seller</dt><dd>{order.seller?.name}</dd></div>}
        </dl>

        <div className="order-address">
          <h3>Delivery</h3>
          <p>
            <strong>{order.fullName}</strong><br />
            {order.address}<br />
            {order.city}{order.postalCode ? ` ${order.postalCode}` : ''}<br />
            <a href={`tel:${order.phone.replace(/\s/g, '')}`}>{order.phone}</a>
          </p>
          {order.latitude != null && (
            <a className="map-link" href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
              target="_blank" rel="noreferrer">
              <IconMapPin /> Open pinned location in Maps
            </a>
          )}
          {order.note && <p className="order-note">“{order.note}”</p>}
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}

export default OrderModal;