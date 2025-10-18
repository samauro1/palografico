'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/services/api';
import toast from 'react-hot-toast';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  register: (nome: string, email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        verifyToken();
      } else {
        // Auto-login para desenvolvimento
        autoLogin();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const autoLogin = async () => {
    try {
      // Tentar fazer login automático com usuário padrão
      const response = await api.post('/auth/login', { 
        email: 'admin@teste.com', 
        senha: '123456' 
      });
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      setUser(user);
      console.log('✅ Login automático realizado com sucesso');
    } catch (error) {
      console.log('⚠️ Login automático falhou, usuário precisa fazer login manual');
    } finally {
      setLoading(false);
    }
  };

  const verifyToken = async () => {
    try {
      const response = await api.get('/auth/verify');
      setUser(response.data.data || response.data.user);
    } catch (error: unknown) {
      console.error('Erro ao verificar token:', error);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, senha: string) => {
    try {
      const response = await api.post('/auth/login', { email, senha });
      const { user, token } = response.data;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
      setUser(user);
      
      toast.success('Login realizado com sucesso!');
      return { success: true };
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Erro ao fazer login';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (nome: string, email: string, senha: string) => {
    try {
      const response = await api.post('/auth/register', { nome, email, senha });
      const { user, token } = response.data;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
      }
      setUser(user);
      
      toast.success('Conta criada com sucesso!');
      return { success: true };
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Erro ao criar conta';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setUser(null);
    toast.success('Logout realizado com sucesso!');
  };

  const value: AuthContextType = {
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
