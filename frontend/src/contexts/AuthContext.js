import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await api.get('/auth/verify');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, senha) => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      
      toast.success('Login realizado com sucesso!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao fazer login';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (nome, email, senha) => {
    try {
      const response = await api.post('/auth/register', { nome, email, senha });
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      
      toast.success('Conta criada com sucesso!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao criar conta';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success('Logout realizado com sucesso!');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
