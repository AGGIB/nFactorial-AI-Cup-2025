import axios, { AxiosResponse } from 'axios';
import { ApiResponse, User, Agent, OnboardingData } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Создаем экземпляр axios с базовой конфигурацией
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена авторизации
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Только очищаем localStorage, но НЕ делаем принудительный редирект
      // AuthContext обработает это и перенаправит пользователя
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Можно отправить кастомное событие для уведомления AuthContext
      window.dispatchEvent(new Event('auth-logout'));
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (email: string, password: string, name?: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = await api.post('/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  },

  login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  me: async (): Promise<ApiResponse<{ user: User }>> => {
    const response: AxiosResponse<ApiResponse<{ user: User }>> = await api.get('/auth/me');
    return response.data;
  },
};

// Onboarding API
export const onboardingAPI = {
  createAgent: async (data: OnboardingData): Promise<ApiResponse<{ agent: Agent }>> => {
    const response: AxiosResponse<ApiResponse<{ agent: Agent }>> = await api.post('/onboarding', data);
    return response.data;
  },

  validateUrl: async (url: string): Promise<ApiResponse<{ isValid: boolean; status?: number; error?: string }>> => {
    const response: AxiosResponse<ApiResponse<{ isValid: boolean; status?: number; error?: string }>> = await api.get('/onboarding/validate-url', {
      params: { url },
    });
    return response.data;
  },
};

// Agents API
export const agentsAPI = {
  getAll: async (): Promise<ApiResponse<{ agents: Agent[] }>> => {
    const response: AxiosResponse<ApiResponse<{ agents: Agent[] }>> = await api.get('/agents');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<{ agent: Agent }>> => {
    const response: AxiosResponse<ApiResponse<{ agent: Agent }>> = await api.get(`/agents/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<Agent>): Promise<ApiResponse<{ agent: Agent }>> => {
    const response: AxiosResponse<ApiResponse<{ agent: Agent }>> = await api.put(`/agents/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const response: AxiosResponse<ApiResponse> = await api.delete(`/agents/${id}`);
    return response.data;
  },

  getWidgetCode: async (id: string): Promise<ApiResponse<{ widgetCode: string; script: string }>> => {
    const response: AxiosResponse<ApiResponse<{ widgetCode: string; script: string }>> = await api.get(`/agents/${id}/widget-code`);
    return response.data;
  },

  analyze: async (id: string): Promise<ApiResponse<{ agent: Agent }>> => {
    const response: AxiosResponse<ApiResponse<{ agent: Agent }>> = await api.post(`/agents/${id}/analyze`);
    return response.data;
  },
};

export const analysisAPI = {
  createAgent: (data: OnboardingData) => api.post('/onboarding', data),
  analyzeWebsite: (url: string) => api.get(`/onboarding/validate-url?url=${encodeURIComponent(url)}`),
  analyzePage: (data: { url: string; agentId?: string }) => api.post('/analysis/page', data),
  captureScreenshot: (data: { url: string }) => api.post('/analysis/screenshot', data),
  analyzeWithContext: (data: { url: string; question: string; agentId?: string; sessionId?: string }) => api.post('/analysis/context', data),
};

export default api; 