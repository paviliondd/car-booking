const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER' | 'OWNER';
  isVerifiedOwner?: boolean;
  ownerRequestAt?: string | null;
};

export type AuthResponse = { accessToken: string; user: AuthUser };
export type Vehicle = {
  id: string;
  ownerId?: string | null;
  brand: string;
  model: string;
  plateNumber: string;
  dailyPrice: number;
  status: string;
  images: string[];
  seats: number;
  year?: number;
  transmission: string;
  fuel: string;
  color?: string;
  pickupLocation?: string;
  latitude?: number;
  longitude?: number;
  owner?: { id: string; name: string } | null;
  [key: string]: unknown;
};
export type Booking = {
  id: string;
  bookingNumber: string;
  totalPrice: number;
  status: string;
  vehicle?: Vehicle;
  customer?: { fullName: string; phone: string; user?: AuthUser | null };
  startDate?: string;
  endDate?: string;
  depositAmount?: number | null;
  pickupLocation?: string;
  payment?: { status: string } | null;
  [key: string]: unknown;
};
export type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
};
export type ChatPartner = { id: string; name: string; email: string };
type JsonObject = Record<string, unknown>;
export type ContractData = { id: string; terms: string; renterSignature?: string | null };
export type ContractResponse = { contract: ContractData; booking: Booking & { vehicle: Vehicle; customer: NonNullable<Booking['customer']> } };

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

  return response.json() as Promise<T>;
}

export const api = {
  // Authentication
  auth: {
    login: (dto: { email: string; password: string }) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(dto) }),
    register: (dto: { email: string; password: string; name: string; phone?: string }) => request<AuthUser>('/auth/register', { method: 'POST', body: JSON.stringify(dto) }),
    me: () => request<AuthUser>('/auth/me'),
    googleLogin: (credential: string) => request<AuthResponse>('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
    upgradeOwner: (dto: { phone: string; idCardNo: string; address: string }) => request('/auth/upgrade-owner', { method: 'POST', body: JSON.stringify(dto) }),
    getOwnerRequests: () => request<AuthUser[]>('/auth/owner-requests'),
    verifyOwner: (userId: string, approve: boolean) => request<AuthUser>(`/auth/verify-owner/${userId}`, { method: 'POST', body: JSON.stringify({ approve }) }),
  },

  // Vehicles
  vehicles: {
    findAll: (brand?: string, seats?: number) => {
      const params = new URLSearchParams();
      if (brand) params.append('brand', brand);
      if (seats) params.append('seats', seats.toString());
      return request<Vehicle[]>(`/vehicles?${params.toString()}`);
    },
    search: (startDate: string, endDate: string, brand?: string, seats?: number) => {
      const params = new URLSearchParams({ startDate, endDate });
      if (brand) params.append('brand', brand);
      if (seats) params.append('seats', seats.toString());
      return request<Vehicle[]>(`/vehicles/search?${params.toString()}`);
    },
    findOne: (id: string) => request<Vehicle>(`/vehicles/${id}`),
    getCalendar: (id: string) => request<JsonObject[]>(`/vehicles/${id}/calendar`),
    getSuggestions: (brand: string, seats: number, startDate: string, endDate: string) => {
      const params = new URLSearchParams({ brand, seats: seats.toString(), startDate, endDate });
      return request<Vehicle[]>(`/vehicles/suggestions?${params.toString()}`);
    },
    getMyCars: () => request<Vehicle[]>('/vehicles/owner/my-cars'),
    create: (dto: unknown) => request<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(dto) }),
    update: (id: string, dto: unknown) => request<Vehicle>(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    updateStatus: (id: string, status: string) => request<Vehicle>(`/vehicles/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: string) => request<JsonObject>(`/vehicles/${id}`, { method: 'DELETE' }),
  },

  // Bookings
  bookings: {
    create: (dto: unknown) => request<{ booking: Booking; paymentUrl: string; transactionId: string }>('/bookings', { method: 'POST', body: JSON.stringify(dto) }),
    track: (phone: string) => request<Booking[]>(`/bookings/track?phone=${encodeURIComponent(phone)}`),
    findAll: () => request<Booking[]>('/bookings'),
    getOwnerRequests: () => request<Booking[]>('/bookings/owner/my-requests'),
    findOne: (id: string) => request<Booking>(`/bookings/${id}`),
    updateStatus: (id: string, status: string) => request<Booking>(`/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },

  // Contracts
  contracts: {
    get: (bookingId: string) => request<ContractResponse>(`/contracts/${bookingId}`),
    sign: (bookingId: string, renterSignature: string) => request<JsonObject>(`/contracts/${bookingId}/sign`, { method: 'POST', body: JSON.stringify({ renterSignature }) }),
  },

  // Reviews
  reviews: {
    create: (dto: { vehicleId: string; rating: number; comment: string }) => request<JsonObject>('/reviews', { method: 'POST', body: JSON.stringify(dto) }),
    findByVehicle: (vehicleId: string) => request<JsonObject[]>(`/reviews/${vehicleId}`),
  },

  // Support Tickets
  tickets: {
    create: (dto: { subject: string; message: string }) => request<JsonObject>('/tickets', { method: 'POST', body: JSON.stringify(dto) }),
    findAll: () => request<JsonObject[]>('/tickets'),
    reply: (id: string, reply: string) => request<JsonObject>(`/tickets/${id}/reply`, { method: 'PUT', body: JSON.stringify({ reply }) }),
  },

  // Chat
  chat: {
    getPartners: () => request<ChatPartner[]>('/chat/partners'),
    getHistory: (partnerId: string) => request<ChatMessage[]>(`/chat/history/${partnerId}`),
    sendMessage: (receiverId: string, message: string) => request<ChatMessage>('/chat/message', { method: 'POST', body: JSON.stringify({ receiverId, message }) }),
  },

  // Analytics (Admin/Staff only)
  analytics: {
    dashboard: () => request<JsonObject>('/analytics/dashboard'),
    financial: () => request<JsonObject>('/analytics/financial'),
    topVehicles: () => request<JsonObject[]>('/analytics/top-vehicles'),
  },

  // Maintenance (Admin/Staff only)
  maintenance: {
    findAll: () => request<JsonObject[]>('/maintenance'),
    create: (dto: unknown) => request<JsonObject>('/maintenance', { method: 'POST', body: JSON.stringify(dto) }),
    complete: (id: string, cost: number) => request<JsonObject>(`/maintenance/${id}/complete`, { method: 'PATCH', body: JSON.stringify({ cost }) }),
    getAlerts: () => request<JsonObject[]>('/maintenance/alerts'),
  },

  // Customers (Admin/Staff only)
  customers: {
    findAll: () => request<JsonObject[]>('/customers'),
    findOne: (id: string) => request<JsonObject>(`/customers/${id}`),
    update: (id: string, segment: string, notes?: string) => request<JsonObject>(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify({ segment, notes }) }),
  },

  // Audit Logs (Admin only)
  auditLogs: {
    findAll: () => request<JsonObject[]>('/audit-logs'),
  }
};
