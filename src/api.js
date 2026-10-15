export const SERVER_URL = 'http://localhost:8000';
const API_URL = `${SERVER_URL}/api`;

// Image ka poora link: Cloudinary wali (https://...) waisi hi, purani local par server ka address
export const imageSrc = (image) => {
  if (!image) return '';
  return image.startsWith('http') ? image : `${SERVER_URL}${image}`;
};

export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const clearToken = () => localStorage.removeItem('token');

export const api = async (path, { method = 'GET', body } = {}) => {
  const isFormData = body instanceof FormData;
  const headers = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let requestBody;
  if (body) {
    requestBody = isFormData ? body : JSON.stringify(body);
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: requestBody,
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