/**
 * Centralized API Client & Service Wrapper
 * ----------------------------------------
 * Configures Axios instance with automatic JWT Bearer token headers,
 * request/response interceptors, and typed API helper methods.
 */

import axios from 'axios';

// Base Axios HTTP Client
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token from localStorage to Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('last_mile_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Intercept 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear expired token if unauthorized
      localStorage.removeItem('last_mile_token');
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication API Endpoints
 */
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (payload: { name: string; email: string; password: string; phone: string }) =>
    api.post('/auth/register', payload),
  demoLogin: (role: 'ADMIN' | 'AGENT' | 'CUSTOMER') =>
    api.post('/auth/demo-login', { role }),
  getMe: () => api.get('/auth/me'),
};

/**
 * Zone Management & Spatial Detection API Endpoints
 */
export const zoneApi = {
  getAll: () => api.get('/zones'),
  getById: (id: string) => api.get(`/zones/${id}`),
  detectPoint: (coords: { longitude: number; latitude: number }) =>
    api.post('/zones/detect', coords),
  create: (data: any) => api.post('/zones', data),
  update: (id: string, data: any) => api.put(`/zones/${id}`, data),
  seedSamples: () => api.post('/zones/seed', {}),
};

/**
 * Rate Cards & Pricing Simulator API Endpoints
 */
export const rateApi = {
  getActiveCard: () => api.get('/rates/active'),
  getAllCards: () => api.get('/rates'),
  simulate: (payload: any) => api.post('/rates/simulate', payload),
  seedDefault: () => api.post('/rates/seed', {}),
  updateCard: (id: string, data: any) => api.put(`/rates/${id}`, data),
};

/**
 * Order Management & Tracking API Endpoints
 */
export const orderApi = {
  create: (payload: any) => api.post('/orders', payload),
  getAll: (params?: Record<string, any>) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  trackByCode: (trackingId: string) => api.get(`/orders/track/${trackingId}`),
  autoAssign: (id: string) => api.post(`/orders/${id}/auto-assign`, {}),
  manualAssign: (id: string, agentId: string) =>
    api.post(`/orders/${id}/assign`, { agentId }),
  updateStatus: (id: string, payload: { status: string; failureReasonCode?: string; notes?: string }) =>
    api.patch(`/orders/${id}/status`, payload),
  reschedule: (id: string, payload: any) =>
    api.post(`/orders/${id}/reschedule`, payload),
};

/**
 * Delivery Agent Management API Endpoints
 */
export const agentApi = {
  getAll: () => api.get('/agents'),
  updateStatus: (payload: { longitude?: number; latitude?: number; status?: string }) =>
    api.put('/agents/status', payload),
};

/**
 * Agentic AI Address Resolution API Endpoints
 */
export const aiApi = {
  parseAddress: (rawAddress: string) => api.post('/ai/parse-address', { rawAddress }),
};
