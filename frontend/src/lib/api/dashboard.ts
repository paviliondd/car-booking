const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Something went wrong');
  }

  return response.json();
}

export const dashboardApi = {
  // Stats
  getOverview: (period: string) => request(`/dashboard/overview?period=${period}`),
  getCarStatusSummary: () => request('/dashboard/car-status-summary'),
  getRevenueChart: (month: string) => request(`/dashboard/revenue-chart?month=${month}`),
  getTopServices: () => request('/dashboard/top-services'),
  getTopCars: (limit: number = 10) => request(`/dashboard/top-cars?limit=${limit}`),
  
  // Alerts & Notifications
  getNotifications: (limit: number = 5) => request(`/notifications?limit=${limit}`),
};
