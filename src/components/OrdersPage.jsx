import { useEffect, useState } from 'react';
import { api, imageSrc } from '../api.js';
import Topbar from './Topbar.jsx';
import OrderModal, { STATUS_LABELS, paymentShort } from './OrderModal.jsx';
import { can } from '../permissions.js';

const LIMIT = 10;
const FILTERS = ['all', 'pending', 'shipped', 'delivered', 'cancelled'];

const formatPrice = (price) => `Rs ${Number(price).toLocaleString('en-PK')}`;
const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const itemsSummary = (items) => {
  const shown = items.slice(0, 2).map((i) => `${i.quantity} × ${i.name}`).join(', ');
  return items.length > 2 ? `${shown}, +${items.length - 2} more` : shown;
};

// Two lists: what I bought, and orders customers placed for my products
function OrdersPage({ user, onLogout, onEditProfile, onNavigate, notify }) {
  const [tab, setTab] = useState('mine'); // 'mine' or 'received'
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState(null);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openOrder, setOpenOrder] = useState(null);

  const seeAll = can(user, 'orders.view');

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ page, limit: LIMIT });
      if (status !== 'all') query.set('status', status);
      const res = await api(`/orders/${tab === 'mine' ? 'mine' : 'received'}?${query}`);
      setOrders(res.data);
      setCounts(res.counts);
      setPagination(res.pagination);
    } catch (err) {
      if (err.status === 401) return onLogout();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [tab, status, page]);

  const switchTab = (next) => {
    setTab(next);
    setStatus('all');
    setPage(1);
    setCounts(null);
  };

  const handleUpdated = (order, message) => {
    setOpenOrder(order);
    notify(message);
    loadOrders();
  };

  const emptyText = () => {
    if (status !== 'all') return `No ${STATUS_LABELS[status].toLowerCase()} orders.`;
    return tab === 'mine' ? "You haven't bought anything yet." : 'No customer orders yet.';
  };

  return (
    <div className="page">
      <Topbar user={user} view="orders" onNavigate={onNavigate} onEditProfile={onEditProfile} onLogout={onLogout} />

      <main className="container">
        <div className="page-head">
          <div className="page-title"><h1>Orders</h1></div>
          <div className="tabs" role="tablist" aria-label="Which orders">
            <button type="button" role="tab" aria-selected={tab === 'mine'}
              className={`tab ${tab === 'mine' ? 'active' : ''}`} onClick={() => switchTab('mine')}>
              My purchases
            </button>
            <button type="button" role="tab" aria-selected={tab === 'received'}
              className={`tab ${tab === 'received' ? 'active' : ''}`} onClick={() => switchTab('received')}>
              {seeAll ? 'All customer orders' : 'Customer orders'}
            </button>
          </div>
        </div>

        <div className="filter-chips" role="group" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`filter-chip ${status === f ? 'active' : ''}`}
              aria-pressed={status === f}
              onClick={() => { setStatus(f); setPage(1); }}
            >
              {f === 'all' ? 'All' : STATUS_LABELS[f]}
              {counts && <span>{counts[f]}</span>}
            </button>
          ))}
        </div>

        {error && (
          <div className="notice">
            <span>Couldn't load orders: {error}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadOrders}>Try again</button>
          </div>
        )}

        <div className="table-card">
          <div className="table-scroll">
            <table className="data-table orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Items</th>
                  <th>{tab === 'mine' ? 'Seller' : 'Customer'}</th>
                  {tab === 'received' && seeAll && <th>Seller</th>}
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="num">Total</th>
                  <th className="cell-action"><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="table-empty">Loading...</td></tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="table-empty">
                      {emptyText()}{' '}
                      {tab === 'mine' && status === 'all' && (
                        <button type="button" className="link" onClick={() => onNavigate('shop')}>Go to the shop</button>
                      )}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id}>
                      <td className="nowrap">
                        <div className="cell-stack">
                          <strong>#{order.id}</strong>
                          <small>{formatDate(order.createdAt)}</small>
                        </div>
                      </td>
                      <td>
                        <div className="cell-product">
                          {order.items[0]?.image
                            ? <img className="thumb" src={imageSrc(order.items[0].image)} alt="" />
                            : <span className="thumb thumb-empty">{order.items[0]?.name.charAt(0)}</span>}
                          <span className="sale-items">{itemsSummary(order.items)}</span>
                        </div>
                      </td>
                      <td className="nowrap">
                        {tab === 'mine' ? order.seller?.name : (order.buyer?.name || 'Deleted account')}
                        {tab === 'received' && <small className="cell-sub">{order.city}</small>}
                      </td>
                      {tab === 'received' && seeAll && <td className="nowrap">{order.seller?.name}</td>}
                      <td className="nowrap"><span className="muted-text">{paymentShort(order)}</span></td>
                      <td><span className={`status status-${order.status}`}>{STATUS_LABELS[order.status]}</span></td>
                      <td className="num nowrap"><strong>{formatPrice(order.total)}</strong></td>
                      <td className="cell-action">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpenOrder(order)}>
                          {tab === 'received' && ['pending', 'shipped'].includes(order.status) ? 'Manage' : 'View'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="table-foot">
              <span>Page {page} of {pagination.totalPages}</span>
              <div className="table-foot-actions">
                <button type="button" className="btn btn-secondary btn-sm" disabled={page === 1 || loading}
                  onClick={() => setPage(page - 1)}>Previous</button>
                <button type="button" className="btn btn-secondary btn-sm"
                  disabled={page === pagination.totalPages || loading} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {openOrder && (
        <OrderModal
          key={`${openOrder.id}-${openOrder.status}`}
          order={openOrder}
          mode={tab === 'mine' ? 'buyer' : 'seller'}
          canManage={openOrder.sellerId === user.id || can(user, 'orders.manage')}
          onClose={() => setOpenOrder(null)}
          onUpdated={handleUpdated}
          onReview={(productId) => onNavigate('product', productId)}
          onUnauthorized={onLogout}
        />
      )}
    </div>
  );
}

export default OrdersPage;