const API_URL = 'http://localhost:3000/api';

export const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  
  headers.append('Content-Type', 'application/json');
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'API Request Failed');
  }

  return data;
};

// Auth
export const login = (data: any) => request('/login', { method: 'POST', body: JSON.stringify(data) });
export const register = (data: any) => request('/register', { method: 'POST', body: JSON.stringify(data) });
export const getProfile = () => request('/user/profile');

// Member
export const getLeaderboard = () => request('/leaderboard');
export const redeemProduct = (productId: number) => request('/user/redeem', { method: 'POST', body: JSON.stringify({ productId }) });
export const getHistory = () => request('/user/history');
export const getProducts = () => request('/products');
export const scanQR = (token: string) => request('/user/qr/scan', { method: 'POST', body: JSON.stringify({ token }) });

// Admin
export const getAdminUsers = () => request('/admin/users');
export const getAdminHistory = () => request('/admin/history');
export const grantPoints = (userId: number, points: number) => request('/admin/grant-points', { method: 'POST', body: JSON.stringify({ userId, points }) });
export const addProduct = (data: any) => request('/admin/products', { method: 'POST', body: JSON.stringify(data) });
export const getAdminProducts = () => request('/admin/products');
export const updateProductStatus = (id: number, is_active: boolean) => request(`/admin/products/${id}/status`, { method: 'PUT', body: JSON.stringify({ is_active }) });
export const deleteProduct = (id: number) => request(`/admin/products/${id}`, { method: 'DELETE' });
export const getAdminSettings = () => request('/admin/settings');
export const toggleQR = (active: boolean, points: number) => request('/admin/qr/toggle', { method: 'POST', body: JSON.stringify({ active, points }) });
