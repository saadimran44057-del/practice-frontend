import { useEffect, useRef, useState } from 'react';
import Avatar from './Avatar.jsx';
import { IconChevronDown, IconUser, IconLogout, IconCart } from './Icons.jsx';
import { canAny, PANEL_PERMISSIONS } from '../permissions.js';
import { useCart } from '../CartContext.jsx';

function Topbar({ user, view, onNavigate, onEditProfile, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { cart } = useCart();
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  // Everyone gets these. Staff also get Admin
  const links = [
    { id: 'shop', label: 'Shop' },
    { id: 'products', label: 'Products' },
    { id: 'pos', label: 'POS' },
    { id: 'sales', label: 'Sales' },
    { id: 'orders', label: 'Orders' },
    ...(canAny(user, PANEL_PERMISSIONS) ? [{ id: 'admin', label: 'Admin' }] : []),
  ];

  // Close the menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;

    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-left">
          <span className="brand">catalog</span>

          <nav className="nav" aria-label="Main">
            {links.map((link) => (
              <button
                key={link.id}
                type="button"
                className={`nav-link ${view === link.id ? 'active' : ''}`}
                aria-current={view === link.id ? 'page' : undefined}
                onClick={() => onNavigate(link.id)}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="topbar-right">
          <button
            type="button"
            className={`cart-button ${view === 'cart' ? 'active' : ''}`}
            onClick={() => onNavigate('cart')}
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
          >
            <IconCart />
            {cartCount > 0 && <span className="cart-count">{cartCount > 99 ? '99+' : cartCount}</span>}
          </button>

          <div className="user-menu" ref={menuRef}>
            <button
              type="button"
              className="user-button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <Avatar user={user} size={32} />
              <span className="user-name">{user.name}</span>
              <IconChevronDown />
            </button>

            {menuOpen && (
              <div className="menu" role="menu">
                <div className="menu-head">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  className="menu-item"
                  onClick={() => { setMenuOpen(false); onEditProfile(); }}
                >
                  <IconUser /> Edit profile
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="menu-item"
                  onClick={() => { setMenuOpen(false); onLogout(); }}
                >
                  <IconLogout /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;