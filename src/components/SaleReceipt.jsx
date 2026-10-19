import Modal from './Modal.jsx';

const formatPrice = (price) => `Rs ${Number(price).toLocaleString('en-PK')}`;
const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

// Shows one sale: what was sold, the total and how it was paid.
// Used after checkout on the POS and from the Sales page.
function SaleReceipt({ sale, onClose, actionLabel, onAction }) {
  const change = sale.cashReceived != null ? sale.cashReceived - sale.total : null;

  return (
    <Modal
      title={`Sale #${sale.id}`}
      description={formatDateTime(sale.createdAt)}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} data-autofocus={onAction ? undefined : true}>
            Close
          </button>
          {onAction && (
            <button type="button" className="btn btn-primary" onClick={onAction} data-autofocus>
              {actionLabel}
            </button>
          )}
        </>
      }
    >
      <ul className="receipt-lines">
        {sale.items.map((item) => (
          <li key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <span>{item.quantity} × {formatPrice(item.price)}</span>
            </div>
            <span className="receipt-amount">{formatPrice(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <dl className="receipt-totals">
        <div className="receipt-total">
          <dt>Total</dt>
          <dd>{formatPrice(sale.total)}</dd>
        </div>
        <div>
          <dt>Paid by</dt>
          <dd>{sale.paymentMethod === 'card' ? 'Card' : 'Cash'}</dd>
        </div>
        {change !== null && (
          <>
            <div>
              <dt>Cash received</dt>
              <dd>{formatPrice(sale.cashReceived)}</dd>
            </div>
            <div>
              <dt>Change</dt>
              <dd>{formatPrice(change)}</dd>
            </div>
          </>
        )}
        {sale.User && (
          <div>
            <dt>Sold by</dt>
            <dd>{sale.User.name}</dd>
          </div>
        )}
      </dl>
    </Modal>
  );
}

export default SaleReceipt;
