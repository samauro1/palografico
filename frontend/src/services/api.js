import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Serviços específicos
export const authService = {
  login: (email, senha) => api.post('/auth/login', { email, senha }),
  register: (nome, email, senha) => api.post('/auth/register', { nome, email, senha }),
  verify: () => api.get('/auth/verify'),
};

export const pacientesService = {
  list: (params) => api.get('/pacientes', { params }),
  get: (id) => api.get(`/pacientes/${id}`),
  create: (data) => api.post('/pacientes', data),
  update: (id, data) => api.put(`/pacientes/${id}`, data),
  delete: (id) => api.delete(`/pacientes/${id}`),
};

export const avaliacoesService = {
  list: (params) => api.get('/avaliacoes', { params }),
  get: (id) => api.get(`/avaliacoes/${id}`),
  create: (data) => api.post('/avaliacoes', data),
  update: (id, data) => api.put(`/avaliacoes/${id}`, data),
  delete: (id) => api.delete(`/avaliacoes/${id}`),
  getTestes: (id) => api.get(`/avaliacoes/${id}/testes`),
};

export const tabelasService = {
  list: () => api.get('/tabelas'),
  get: (tipo) => api.get(`/tabelas/${tipo}`),
  calculate: (tipo, data) => api.post(`/tabelas/${tipo}/calculate`, data),
};

export const estoqueService = {
  list: () => api.get('/estoque'),
  get: (id) => api.get(`/estoque/${id}`),
  update: (id, data) => api.put(`/estoque/${id}`, data),
  addMovement: (data) => api.post('/estoque/movements', data),
  getMovements: (params) => api.get('/estoque/movements', { params }),
};

export const relatoriosService = {
  generate: (data) => api.post('/relatorios/generate', data),
  get: (id) => api.get(`/relatorios/${id}`),
  list: (params) => api.get('/relatorios', { params }),
};

export default api;
