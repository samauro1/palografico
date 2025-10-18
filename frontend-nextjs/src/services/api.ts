import axios from 'axios';
import { Patient, Avaliacao, TestResult, ApiResponse, PaginatedResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Serviços específicos
export const authService = {
  login: (email: string, senha: string) => api.post('/auth/login', { email, senha }),
  register: (nome: string, email: string, senha: string) => api.post('/auth/register', { nome, email, senha }),
  verify: () => api.get('/auth/verify'),
};

export const usuariosService = {
  list: () => api.get('/usuarios'),
  create: (data: any) => api.post('/usuarios', data),
  update: (id: string, data: any) => api.put(`/usuarios/${id}`, data),
  delete: (id: string) => api.delete(`/usuarios/${id}`),
  getPerfis: () => api.get('/usuarios/perfis/disponiveis'),
  getPermissoes: (perfil: string) => api.get(`/usuarios/permissoes/${perfil}`),
  updatePerfil: (data: any) => api.put('/usuarios/perfil/me', data),
};

export const configuracoesService = {
  getClinica: () => api.get('/configuracoes/clinica'),
  updateClinica: (data: any) => api.put('/configuracoes/clinica', data),
  // Backup e Restauração
  fazerBackup: () => api.post('/configuracoes/backup'),
  restaurarBackup: (arquivo: string) => api.post('/configuracoes/backup/restaurar', { arquivo }),
  listarBackups: () => api.get('/configuracoes/backups'),
  // Logs
  getLogs: (params?: { tipo?: string; limite?: number; offset?: number }) => 
    api.get('/configuracoes/logs', { params }),
  registrarLog: (tipo: string, descricao: string) => 
    api.post('/configuracoes/log', { tipo, descricao }),
};

export const pacientesService = {
  list: (params?: Record<string, unknown>) => api.get<{ data: { data: { pacientes: Patient[]; pagination: any } } }>('/pacientes', { params }),
  get: (id: string) => api.get<ApiResponse<Patient>>(`/pacientes/${id}`),
  create: (data: Partial<Patient>) => api.post<ApiResponse<Patient>>('/pacientes', data),
  update: (id: string, data: Partial<Patient>) => api.put<ApiResponse<Patient>>(`/pacientes/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/pacientes/${id}`),
};

export const avaliacoesService = {
  list: (params?: Record<string, unknown>) => api.get<{ data: PaginatedResponse<Avaliacao> }>('/avaliacoes', { params }),
  get: (id: string) => api.get<ApiResponse<Avaliacao>>(`/avaliacoes/${id}`),
  create: (data: Partial<Avaliacao>) => api.post<ApiResponse<Avaliacao>>('/avaliacoes', data),
  update: (id: string, data: Partial<Avaliacao>) => api.put<ApiResponse<Avaliacao>>(`/avaliacoes/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/avaliacoes/${id}`),
  getTestes: (id: string) => api.get<ApiResponse>(`/avaliacoes/${id}/testes`),
};

export const tabelasService = {
  list: () => api.get<ApiResponse>('/tabelas'),
  get: (tipo: string) => api.get<ApiResponse>(`/tabelas/${tipo}`),
  calculate: (tipo: string, data: Record<string, unknown>) => api.post<ApiResponse<TestResult>>(`/tabelas/${tipo}/calculate`, data),
};

export const estoqueService = {
  list: () => api.get<{ data: { data: Array<{ quantidade: number; estoqueMinimo: number }> } }>('/estoque'),
  get: (id: string) => api.get<ApiResponse>(`/estoque/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put<ApiResponse>(`/estoque/${id}`, data),
  addMovement: (data: Record<string, unknown>) => api.post<ApiResponse>('/estoque/movements', data),
  getMovements: (params?: Record<string, unknown>) => api.get<ApiResponse>('/estoque/movements', { params }),
};

export const relatoriosService = {
  generate: (data: Record<string, unknown>) => api.post<ApiResponse>('/relatorios/generate', data),
  get: (id: string) => api.get<ApiResponse>(`/relatorios/${id}`),
  list: (params?: Record<string, unknown>) => api.get<ApiResponse>('/relatorios', { params }),
};

export default api;
