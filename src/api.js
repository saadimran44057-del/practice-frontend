const API_URL = 'http://localhost:8000/api';

export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const clearToken = () => localStorage.removeItem('token');

export const api = async (path, { method = 'GET', body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const message = data.errors
      ? data.errors.join(', ')
      : data.message || 'Something went wrong';
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
};