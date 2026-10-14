import { useState } from 'react';
import AuthPage from './components/AuthPage.jsx';
import ProductsPage from './components/ProductsPage.jsx';
import { getToken, clearToken } from './api.js';
import './App.css';

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return getToken() && savedUser ? JSON.parse(savedUser) : null;
  });

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem('user');
    setUser(null);
  };

  return user
    ? <ProductsPage user={user} onLogout={handleLogout} />
    : <AuthPage onLogin={handleLogin} />;
}

export default App;