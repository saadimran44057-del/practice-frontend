import { useState } from 'react';
import AuthPage from './components/AuthPage.jsx';
import ProductsPage from './components/ProductsPage.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import { getToken, clearToken } from './api.js';
import './App.css';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return getToken() && savedUser ? JSON.parse(savedUser) : null;
  });

  // Kaunsa page dikhana hai: 'products' ya 'profile'
  const [view, setView] = useState('products');

  const handleLogin = (userData) => {
    setUser(userData);
    setView('products');
  };

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem('user');
    setUser(null);
  };

  // Profile update hone par naya naam/photo har jagah dikhe
  const handleUserUpdate = (updatedUser) => {
    const merged = { ...user, ...updatedUser };
    setUser(merged);
    localStorage.setItem('user', JSON.stringify(merged));
  };

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  if (view === 'profile') {
    return (
      <ProfilePage
        user={user}
        onBack={() => setView('products')}
        onLogout={handleLogout}
        onUserUpdate={handleUserUpdate}
      />
    );
  }

  return (
    <ProductsPage
      user={user}
      onLogout={handleLogout}
      onOpenProfile={() => setView('profile')}
    />
  );
}

export default App;