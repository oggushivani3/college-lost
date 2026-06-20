import { API_URL } from './config';

// Helper for fetch
const fetchApi = async (endpoint, options = {}) => {
  const res = await fetch(`${API_URL}${endpoint}`, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed: ${res.status}`);
  }
  return await res.json();
};

export const upsertUser = async (userData) => {
  return fetchApi('/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
};

export const getUser = async (uid) => {
  try {
    return await fetchApi(`/users/${uid}`);
  } catch (err) {
    return null;
  }
};

export const getLeaderboard = async () => fetchApi('/users/leaderboard');

export const uploadImage = async (file) => {
  if (!file) return '';
  const formData = new FormData();
  formData.append('image', file);
  const data = await fetchApi('/upload', {
    method: 'POST',
    body: formData
  });
  return data.imageUrl || '';
};

// ─── Lost Items ──────────────────────────────────────────────────────────────
export const addLostItem = async (data) => fetchApi('/lost-items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

export const getLostItems = async (filters = {}) => {
  let url = '/lost-items';
  const query = new URLSearchParams(filters).toString();
  if (query) url += `?${query}`;
  return fetchApi(url);
};

export const updateLostItem = async (id, data) => fetchApi(`/items/lost/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

export const deleteLostItem = async (id) => fetchApi(`/items/lost/${id}`, { method: 'DELETE' });

// ─── Found Items ─────────────────────────────────────────────────────────────
export const addFoundItem = async (data) => fetchApi('/found-items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

export const getFoundItems = async (filters = {}) => {
  let url = '/found-items';
  const query = new URLSearchParams(filters).toString();
  if (query) url += `?${query}`;
  return fetchApi(url);
};

export const updateFoundItem = async (id, data) => fetchApi(`/items/found/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

export const deleteFoundItem = async (id) => fetchApi(`/items/found/${id}`, { method: 'DELETE' });

// ─── Claims ──────────────────────────────────────────────────────────────────
export const addClaim = async (data) => fetchApi('/claims', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

export const getClaims = async () => []; // Backend does not support GET all claims right now, use dashboard instead.

export const respondToClaim = async (claimId, response) => {
  // Map frontend status to backend expected action
  let action = response;
  if (response === 'Approved') action = 'Accept';
  if (response === 'Rejected') action = 'Reject';
  
  return fetchApi(`/claims/${claimId}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ response: action })
  });
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const addNotification = async (data) => {
  // Notifications are handled automatically by the backend now (e.g. during claim creation)
  return { id: `dummy-${Date.now()}` };
};

export const getNotifications = async (userId) => fetchApi(`/notifications/${userId}`);

export const markNotificationRead = async (notifId) => fetchApi(`/notifications/${notifId}/read`, { method: 'POST' });

export const subscribeNotifications = (userId, callback) => {
  // Fallback polling since SSE isn't implemented for notifications yet
  const interval = setInterval(async () => {
    try {
      const data = await getNotifications(userId);
      callback(data);
    } catch (e) {}
  }, 10000);
  return () => clearInterval(interval);
};

// ─── Comments (per item) ─────────────────────────────────────────────────────
export const addComment = async (itemId, data) => fetchApi(`/items/${itemId}/comments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

export const getComments = async (itemId) => fetchApi(`/items/${itemId}/comments`);

export const subscribeComments = (itemId, callback) => {
  // Fallback polling for comments
  const interval = setInterval(async () => {
    try {
      const data = await getComments(itemId);
      callback(data);
    } catch (e) {}
  }, 3000);
  return () => clearInterval(interval);
};

// ─── Dashboard Data ──────────────────────────────────────────────────────────
export const getUserDashboard = async (uid) => fetchApi(`/users/${uid}/dashboard`);

// ─── Analytics ───────────────────────────────────────────────────────────────
export const getAnalytics = async () => fetchApi('/admin/analytics');

// ─── QR Code (generate client-side) ──────────────────────────────────────────
export const generateQRCode = async (itemId) => {
  const url = `${window.location.origin}?item=${itemId}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
};
