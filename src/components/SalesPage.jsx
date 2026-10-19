import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Topbar from './Topbar.jsx';
import SaleReceipt from './SaleReceipt.jsx';

const LIMIT = 10;

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: 'all', label: 'All time' },
];

const formatPrice = (price) => `Rs ${Number(price).toLocaleString('en-PK')}`;
const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

// "2 × Camera, 1 × Vase" (first two lines, then "+3 more")
const itemsSummary = (items) => {
  const shown = items.slice(0, 2).map((i) => `${i.quantity} × ${i.name}`).join(', ');
  return items.length > 2 ? `${shown}, +${items.length - 2} more` : shown;
};

// History of every sale made on the POS
function SalesPage({ user, onLogout, onEditProfile, onNavigate }) {
  const [range, setRange] = useState('today');
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openSale, setOpenSale] = useState(null);

  const loadSales = async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ range, page, limit: LIMIT });
      const data = await api(`/sales?${query}`);
      setSales(data.data);
      setSummary(data.summary);
      setPagination(data.pagination);
    } catch (err) {
      if (err.status === 401) return onLogout();
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [range, page]);

  // Staff who can see everyone's sales get a "Sold by" column
  const showSeller = sales.some((s) => s.User);
  const rangeLabel = RANGES.find((r) => r.id === range).label.toLowerCase();

  return (
    <div className="page">
      <Topbar user={user} view="sales" onNavigate={onNavigate} onEditProfile={onEditProfile} onLogout={onLogout} />

      <main className="container">
        <div className="page-head">
          <div className="page-title">
            <h1>Sales</h1>
          </div>
          <div className="tabs" role="tablist" aria-label="Time range">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={range === r.id}
                className={`tab ${range === r.id ? 'active' : ''}`}
                onClick={() => { setRange(r.id); setPage(1); }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <section className="stats stats-3" aria-label="Summary">
          <div className="stat">
            <span className="stat-value">{summary ? formatPrice(summary.revenue) : '–'}</span>
            <span className="stat-label">Revenue, {rangeLabel}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{summary ? summary.salesCount : '–'}</span>
            <span className="stat-label">Sales</span>
          </div>
          <div className="stat">
            <span className="stat-value">{summary ? summary.itemsSold : '–'}</span>
            <span className="stat-label">Items sold</span>
          </div>
        </section>

        {error && (
          <div className="notice">
            <span>Couldn't load sales: {error}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadSales}>Try again</button>
          </div>
        )}

        <div className="table-card">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sale</th>
                  <th>Time</th>
                  <th>Items</th>
                  {showSeller && <th>Sold by</th>}
                  <th>Paid by</th>
                  <th className="num">Total</th>
                  <th className="cell-action"><span className="sr-only">Details</span></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="table-empty">Loading...</td></tr>
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="table-empty">
                      {range === 'all' ? 'No sales yet.' : range === 'today' ? 'No sales today.' : `No sales in the last ${rangeLabel}.`}{' '}
                      <button type="button" className="link" onClick={() => onNavigate('pos')}>Open the POS</button>
                    </td>
                  </tr>
                ) : (
                  sales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="nowrap"><strong>#{sale.id}</strong></td>
                      <td className="nowrap">{formatDateTime(sale.createdAt)}</td>
                      <td className="sale-items">{itemsSummary(sale.items)}</td>
                      {showSeller && <td className="nowrap">{sale.User?.name || '–'}</td>}
                      <td>
                        <span className="badge">{sale.paymentMethod === 'card' ? 'Card' : 'Cash'}</span>
                      </td>
                      <td className="num nowrap"><strong>{formatPrice(sale.total)}</strong></td>
                      <td className="cell-action">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpenSale(sale)}>
                          View
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
                  onClick={() => setPage(page - 1)}>
                  Previous
                </button>
                <button type="button" className="btn btn-secondary btn-sm"
                  disabled={page === pagination.totalPages || loading} onClick={() => setPage(page + 1)}>
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {openSale && <SaleReceipt sale={openSale} onClose={() => setOpenSale(null)} />}
    </div>
  );
}

export default SalesPage;