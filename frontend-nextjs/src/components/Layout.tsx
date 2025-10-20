'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useConfiguracoes } from '@/contexts/ConfiguracoesContext';
import { useTheme } from '@/contexts/ThemeContext';
import Logo from './Logo';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  TestTube,
  Package,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Sun,
  Moon,
  Calendar
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { configuracoes } = useConfiguracoes();
  const { isDark, toggleTheme } = useTheme();
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Agenda', href: '/agenda', icon: Calendar },
    { name: 'Avaliados e Avaliações', href: '/pacientes', icon: Users },
    { name: 'Testes', href: '/testes', icon: TestTube },
    { name: 'Estoque', href: '/estoque', icon: Package },
    { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
  ];

  const isActive = (href: string) => {
    return pathname === href;
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-950' : 'bg-gray-50'}`}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className={`fixed inset-y-0 left-0 flex w-64 flex-col ${isDark ? 'bg-dark-900' : 'bg-white'}`}>
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              {configuracoes?.logo_url ? (
                <img 
                  src={configuracoes.logo_url} 
                  alt="Logo da Clínica" 
                  className="h-10 w-10 rounded-lg object-cover border-2 border-blue-200"
                />
              ) : (
                <Logo size="sm" />
              )}
              <h1 className="text-xl font-bold text-gray-900">Sistema de Avaliação</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? isDark 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-100 text-blue-900'
                      : isDark
                        ? 'text-dark-200 hover:bg-dark-700 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {configuracoes?.logo_url ? (
                  <img 
                    src={configuracoes.logo_url} 
                    alt="Logo da Clínica" 
                    className="h-10 w-10 rounded-full object-cover border-2 border-blue-200"
                  />
                ) : (
                  <User className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.nome}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className={`flex flex-col flex-grow ${isDark ? 'bg-dark-900 border-dark-700' : 'bg-white border-gray-200'} border-r`}>
          <div className="flex h-16 items-center px-4">
            <div className="flex items-center gap-3">
              {configuracoes?.logo_url ? (
                <img 
                  src={configuracoes.logo_url} 
                  alt="Logo da Clínica" 
                  className="h-10 w-10 rounded-lg object-cover border-2 border-blue-200"
                />
              ) : (
                <Logo size="sm" />
              )}
              <h1 className="text-xl font-bold text-gray-900">Sistema de Avaliação</h1>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? isDark 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-100 text-blue-900'
                      : isDark
                        ? 'text-dark-200 hover:bg-dark-700 hover:text-white'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {configuracoes?.logo_url ? (
                  <img 
                    src={configuracoes.logo_url} 
                    alt="Logo da Clínica" 
                    className="h-12 w-12 rounded-full object-cover border-2 border-blue-200"
                  />
                ) : (
                  <User className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.nome}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-3 flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className={`sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b ${isDark ? 'border-dark-700 bg-dark-900' : 'border-gray-200 bg-white'} px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8`}>
          <button
            type="button"
            className={`-m-2.5 p-2.5 ${isDark ? 'text-dark-200' : 'text-gray-700'} lg:hidden`}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className={`hidden lg:block lg:h-6 lg:w-px ${isDark ? 'lg:bg-dark-600' : 'lg:bg-gray-200'}`} />
              <div className="flex items-center gap-x-3">
                {/* Botão de Tema */}
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-dark-700 hover:bg-dark-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                  title={isDark ? 'Modo Claro' : 'Modo Escuro'}
                >
                  {isDark ? (
                    <Sun className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600" />
                  )}
                </button>
                
                {user?.foto_url ? (
                  <img 
                    src={user.foto_url} 
                    alt="Foto do Usuário" 
                    className="h-10 w-10 rounded-full object-cover border-2 border-blue-200"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                )}
                <span className={`text-sm ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>Bem-vindo, {user?.nome}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className={`py-6 ${isDark ? 'bg-dark-950' : 'bg-gray-50'}`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
