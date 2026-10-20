import { useEffect, useState } from 'react';
import AuthPage from './components/AuthPage.jsx';
import ProductsPage from './components/ProductsPage.jsx';
import AdminPage from './components/AdminPage.jsx';
import PosPage from './components/PosPage.jsx';
import SalesPage from './components/SalesPage.jsx';
import ShopPage from './components/ShopPage.jsx';
import ProductPage from './components/ProductPage.jsx';
import CartPage from './components/CartPage.jsx';
import CheckoutPage from './components/CheckoutPage.jsx';
import OrdersPage from './components/OrdersPage.jsx';
import ProfileModal from './components/ProfileModal.jsx';
import Toast from './components/Toast.jsx';
import { api, getToken, clearToken } from './api.js';
import { canAny, PANEL_PERMISSIONS } from './permissions.js';
import { CartContext } from './CartContext.jsx';
import './App.css';
import './shop.css';

// Each user has their own cart saved in the browser
const readCart = (userId) => {
  try {
    return JSON.parse(localStorage.getItem(`cart-${userId}`)) || [];
  } catch {
    return [];
  }
};

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return getToken() && savedUser ? JSON.parse(savedUser) : null;
  });
  // Which page to show: 'shop', 'product', 'cart', 'checkout', 'orders',
  // 'products', 'pos', 'sales' or 'admin'
  const [view, setView] = useState('shop');
  // The product open on the 'product' page
  const [productId, setProductId] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [cart, setCart] = useState(() => (user ? readCart(user.id) : []));

  // Hide the toast after 3 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = (message, type = 'success') => setToast({ message, type, id: Date.now() });

  // Get fresh user details (role and permissions) when the app opens,
  // because the admin may have changed this user's role since they logged in
  useEffect(() => {
    if (!getToken()) return;
    api('/users/me')
      .then((data) => {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      })
      .catch((err) => {
        if (err.status === 401 || err.status === 403) handleLogout();
      });
  }, []);

  const navigate = (nextView, id = null) => {
    setView(nextView);
    setProductId(id);
    window.scrollTo(0, 0);
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setCart(readCart(userData.id));
    navigate('shop');
  };

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem('user');
    setProfileOpen(false);
    setCart([]);
    setView('shop');
    setUser(null);
  };

  const handleProfileSaved = (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    setUser(merged);
    localStorage.setItem('user', JSON.stringify(merged));
    setProfileOpen(false);
    notify('Profile updated');
  };

  // ----- Cart -----
  // Change the cart and save it in the browser
  const saveCart = (next) => {
    setCart(next);
    localStorage.setItem(`cart-${user.id}`, JSON.stringify(next));
  };

  // product comes from the shop (it has stock and the seller in product.User)
  const addToCart = (product, quantity = 1) => {
    const line = cart.find((l) => l.productId === product.id);
    const already = line ? line.quantity : 0;
    if (already + quantity > product.stock) {
      notify(already ? `You already have all ${product.stock} in your cart` : `Only ${product.stock} in stock`, 'error');
      return false;
    }

    const fresh = {
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      stock: product.stock,
      sellerId: product.userId,
      sellerName: product.User?.name || '',
      quantity: already + quantity,
    };
    saveCart(line ? cart.map((l) => (l.productId === product.id ? fresh : l)) : [...cart, fresh]);
    notify(`Added to cart: ${product.name}`);
    return true;
  };

  // 0 removes the line
  const setQuantity = (id, quantity) => {
    saveCart(
      cart
        .map((l) => (l.productId === id ? { ...l, quantity: Math.min(quantity, l.stock) } : l))
        .filter((l) => l.quantity > 0)
    );
  };

  const cartValue = { cart, addToCart, setQuantity, replaceCart: saveCart, clearCart: () => saveCart([]) };

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }
  
  // Shared props for every page
  const pageProps = {
    user,
    onLogout: handleLogout,
    onEditProfile: () => setProfileOpen(true),
    onNavigate: navigate,
    notify,
  };

  const renderPage = () => {
    if (view === 'admin' && canAny(user, PANEL_PERMISSIONS)) return <AdminPage {...pageProps} />;
    if (view === 'products') return <ProductsPage {...pageProps} />;
    if (view === 'pos') return <PosPage {...pageProps} />;
    if (view === 'sales') return <SalesPage {...pageProps} />;
    if (view === 'product' && productId) return <ProductPage {...pageProps} productId={productId} />;
    if (view === 'cart') return <CartPage {...pageProps} />;
    if (view === 'checkout') return <CheckoutPage {...pageProps} />;
    if (view === 'orders') return <OrdersPage {...pageProps} />;
    return <ShopPage {...pageProps} />;
  };

  return (
    <CartContext.Provider value={cartValue}>
      {renderPage()}

      {profileOpen && (
        <ProfileModal
          user={user}
          onClose={() => setProfileOpen(false)}
          onSaved={handleProfileSaved}
          onUnauthorized={handleLogout}
        />
      )}

      <Toast key={toast?.id} toast={toast} />
    </CartContext.Provider>
  );
}

export default App;