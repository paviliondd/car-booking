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
  weekendPrice: number;
  holidayPrice: number;
  penaltyRate: number;
  status: string;
  images: string[];
  seats: number;
  year: number;
  transmission: string;
  fuel: string;
  color?: string;
  pickupLocation?: string;
  videoUrl?: string | null;
  limitKmPerDay?: number | null;
  overLimitFee?: number | null;
  terms?: string | null;
  latitude?: number;
  longitude?: number;
  owner?: { id: string; name: string } | null;
  [key: string]: unknown;
};
export type VehicleInput = {
  plateNumber: string;
  brand: string;
  model: string;
  year: number;
  seats: number;
  transmission: string;
  fuel: string;
  color: string;
  dailyPrice: number;
  weekendPrice: number;
  holidayPrice: number;
  penaltyRate: number;
  images: string[];
  videoUrl?: string;
  limitKmPerDay?: number;
  overLimitFee?: number;
  terms?: string;
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
export type CustomerRecord = { id: string; fullName: string; phone: string; idCardNo: string; segment: 'REGULAR' | 'VIP' | 'BLACKLIST'; notes?: string | null; user?: AuthUser | null; bookings?: Booking[] };
export type CustomerUpdateInput = Pick<CustomerRecord, 'fullName' | 'phone' | 'idCardNo' | 'segment'> & { notes?: string };
export type BookingQuote = {
  available: true;
  vehicleId: string;
  totalDays: number;
  basePrice: number;
  priceDetails: Array<{ date: string; price: number; type: string }>;
  discountAmount: number;
  insuranceFee: number;
  totalPrice: number;
  depositPercent: number;
  depositAmount: number;
  couponMessage?: string | null;
};
export type MaintenanceRecord = { id: string; vehicleId: string; type: string; scheduledDate: string; completedDate?: string | null; cost: number; description?: string | null; vehicle?: Vehicle };
export type FinancialRecord = { vehicleId: string; plateNumber: string; brand: string; model: string; revenue: number; maintenanceCost: number; otherExpense: number; totalCost: number; netProfit: number; occupancyRate: number };
export type AuditRecord = { id: string; action: string; targetTable: string; targetId: string; oldValue?: unknown; newValue?: unknown; createdAt: string; user?: Pick<AuthUser, 'id' | 'email' | 'name' | 'role'> | null };
export type TicketRecord = { id: string; subject: string; message: string; status: string; reply?: string | null; repliedAt?: string | null; createdAt: string; user?: Pick<AuthUser, 'id' | 'email' | 'name'> };
type JsonObject = Record<string, unknown>;
export type ContractData = { id: string; terms: string; renterSignature?: string | null };
export type ContractResponse = { contract: ContractData; booking: Booking & { vehicle: Vehicle; customer: NonNullable<Booking['customer']> } };
export type CustomerDocumentKeys = {
  idCardFront: string | null;
  idCardBack: string | null;
  driverLicense: string | null;
};

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
    const fallback =
      response.status === 403
        ? 'Tài khoản hiện tại không có quyền thực hiện thao tác này.'
        : response.status === 401
          ? 'Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.'
          : 'Đã có lỗi xảy ra. Vui lòng thử lại.';
    const message =
      errorData.message === 'Forbidden resource'
        ? fallback
        : errorData.message || fallback;
    throw new Error(message);
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
    availableNow: (brand?: string, seats?: number) => {
      const params = new URLSearchParams();
      if (brand) params.append('brand', brand);
      if (seats) params.append('seats', seats.toString());
      return request<Vehicle[]>(`/vehicles/available-now?${params.toString()}`);
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
    create: (dto: VehicleInput) => request<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(dto) }),
    update: (id: string, dto: Partial<VehicleInput>) => request<Vehicle>(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    updateStatus: (id: string, status: string) => request<Vehicle>(`/vehicles/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: string) => request<JsonObject>(`/vehicles/${id}`, { method: 'DELETE' }),
  },

  storage: {
    uploadVehicleImage: (file: File) => {
      const body = new FormData();
      body.append('file', file);
      return request<{ key: string; url: string }>('/storage/vehicle-image', { method: 'POST', body });
    },
    uploadCustomerDocuments: (files: { idCardFront: File; idCardBack: File; driverLicense: File }) => {
      const body = new FormData();
      body.append('idCardFront', files.idCardFront);
      body.append('idCardBack', files.idCardBack);
      body.append('driverLicense', files.driverLicense);
      return request<CustomerDocumentKeys>('/storage/customer-documents', { method: 'POST', body });
    },
  },

  // Bookings
  bookings: {
    quote: (dto: { vehicleId: string; startDate: string; endDate: string; insuranceType: 'NONE' | 'BASIC' | 'PREMIUM'; depositPercent: 30 | 50; couponCode?: string }) => request<BookingQuote>('/bookings/quote', { method: 'POST', body: JSON.stringify(dto) }),
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
    create: (dto: { subject: string; message: string }) => request<TicketRecord>('/tickets', { method: 'POST', body: JSON.stringify(dto) }),
    findAll: () => request<TicketRecord[]>('/tickets'),
    reply: (id: string, reply: string) => request<TicketRecord>(`/tickets/${id}/reply`, { method: 'PUT', body: JSON.stringify({ reply }) }),
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
    financial: () => request<FinancialRecord[]>('/analytics/financial'),
    topVehicles: () => request<JsonObject[]>('/analytics/top-vehicles'),
  },

  // Maintenance (Admin/Staff only)
  maintenance: {
    findAll: () => request<MaintenanceRecord[]>('/maintenance'),
    create: (dto: unknown) => request<MaintenanceRecord>('/maintenance', { method: 'POST', body: JSON.stringify(dto) }),
    complete: (id: string, cost: number) => request<MaintenanceRecord>(`/maintenance/${id}/complete`, { method: 'PATCH', body: JSON.stringify({ cost }) }),
    getAlerts: () => request<MaintenanceRecord[]>('/maintenance/alerts'),
  },

  // Customers (Admin/Staff only)
  customers: {
    findAll: () => request<CustomerRecord[]>('/customers'),
    findOne: (id: string) => request<CustomerRecord>(`/customers/${id}`),
    update: (id: string, dto: CustomerUpdateInput) => request<CustomerRecord>(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
  },

  // Audit Logs (Admin only)
  auditLogs: {
    findAll: () => request<AuditRecord[]>('/audit-logs'),
  }
};
