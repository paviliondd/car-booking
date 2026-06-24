const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Lấy JWT token từ localStorage
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

export const api = {
  // Authentication
  auth: {
    login: (dto: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(dto) }),
    register: (dto: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(dto) }),
    me: () => request('/auth/me'),
    googleLogin: (email: string, name: string) => request('/auth/google', { method: 'POST', body: JSON.stringify({ email, name }) }),
    facebookLogin: (email: string, name: string) => request('/auth/facebook', { method: 'POST', body: JSON.stringify({ email, name }) }),
    upgradeOwner: (dto: { phone: string; idCardNo: string; address: string }) => request('/auth/upgrade-owner', { method: 'POST', body: JSON.stringify(dto) }),
    getOwnerRequests: () => request('/auth/owner-requests'),
    verifyOwner: (userId: string, approve: boolean) => request(`/auth/verify-owner/${userId}`, { method: 'POST', body: JSON.stringify({ approve }) }),
  },

  // Vehicles
  vehicles: {
    findAll: (brand?: string, seats?: number) => {
      const params = new URLSearchParams();
      if (brand) params.append('brand', brand);
      if (seats) params.append('seats', seats.toString());
      return request(`/vehicles?${params.toString()}`);
    },
    search: (startDate: string, endDate: string, brand?: string, seats?: number) => {
      const params = new URLSearchParams({ startDate, endDate });
      if (brand) params.append('brand', brand);
      if (seats) params.append('seats', seats.toString());
      return request(`/vehicles/search?${params.toString()}`);
    },
    findOne: (id: string) => request(`/vehicles/${id}`),
    getCalendar: (id: string) => request(`/vehicles/${id}/calendar`),
    getSuggestions: (brand: string, seats: number, startDate: string, endDate: string) => {
      const params = new URLSearchParams({ brand, seats: seats.toString(), startDate, endDate });
      return request(`/vehicles/suggestions?${params.toString()}`);
    },
    getMyCars: () => request('/vehicles/owner/my-cars'),
    create: (dto: any) => request('/vehicles', { method: 'POST', body: JSON.stringify(dto) }),
    update: (id: string, dto: any) => request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    updateStatus: (id: string, status: string) => request(`/vehicles/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: string) => request(`/vehicles/${id}`, { method: 'DELETE' }),
  },

  // Bookings
  bookings: {
    create: (dto: any) => request('/bookings', { method: 'POST', body: JSON.stringify(dto) }),
    track: (phone: string) => request(`/bookings/track?phone=${phone}`),
    findAll: () => request('/bookings'),
    getOwnerRequests: () => request('/bookings/owner/my-requests'),
    findOne: (id: string) => request(`/bookings/${id}`),
    updateStatus: (id: string, status: string) => request(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },

  // Contracts
  contracts: {
    get: (bookingId: string) => request(`/contracts/${bookingId}`),
    sign: (bookingId: string, renterSignature: string) => request(`/contracts/${bookingId}/sign`, { method: 'POST', body: JSON.stringify({ renterSignature }) }),
  },

  // Reviews
  reviews: {
    create: (dto: { vehicleId: string; rating: number; comment: string }) => request('/reviews', { method: 'POST', body: JSON.stringify(dto) }),
    findByVehicle: (vehicleId: string) => request(`/reviews/${vehicleId}`),
  },

  // Support Tickets
  tickets: {
    create: (dto: { subject: string; message: string }) => request('/tickets', { method: 'POST', body: JSON.stringify(dto) }),
    findAll: () => request('/tickets'),
    reply: (id: string, reply: string) => request(`/tickets/${id}/reply`, { method: 'PUT', body: JSON.stringify({ reply }) }),
  },

  // Chat
  chat: {
    getPartners: () => request('/chat/partners'),
    getHistory: (partnerId: string) => request(`/chat/history/${partnerId}`),
  },

  // Payments Mocking helpers for test
  payments: {
    simulateSuccess: (bookingId: string, transactionId: string, method: string) => 
      request(`/payments/simulate-success?bookingId=${bookingId}&transactionId=${transactionId}&method=${method}`),
  },

  // Analytics (Admin/Staff only)
  analytics: {
    dashboard: () => request('/analytics/dashboard'),
    financial: () => request('/analytics/financial'),
    topVehicles: () => request('/analytics/top-vehicles'),
  },

  // Maintenance (Admin/Staff only)
  maintenance: {
    findAll: () => request('/maintenance'),
    create: (dto: any) => request('/maintenance', { method: 'POST', body: JSON.stringify(dto) }),
    complete: (id: string, cost: number) => request(`/maintenance/${id}/complete`, { method: 'PATCH', body: JSON.stringify({ cost }) }),
    getAlerts: () => request('/maintenance/alerts'),
  },

  // Customers (Admin/Staff only)
  customers: {
    findAll: () => request('/customers'),
    findOne: (id: string) => request(`/customers/${id}`),
    update: (id: string, segment: string, notes?: string) => request(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify({ segment, notes }) }),
  },

  // Audit Logs (Admin only)
  auditLogs: {
    findAll: () => request('/audit-logs'),
  }
};
