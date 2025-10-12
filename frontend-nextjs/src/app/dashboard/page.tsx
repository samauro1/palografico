'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  ClipboardList, 
  TestTube, 
  Package,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { pacientesService, avaliacoesService, estoqueService } from '@/services/api';
// import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['pacientes-count'] });
    queryClient.invalidateQueries({ queryKey: ['avaliacoes-count'] });
    queryClient.invalidateQueries({ queryKey: ['estoque-low'] });
  };

  const { data: pacientes, isLoading: pacientesLoading } = useQuery({
    queryKey: ['pacientes-count'],
    queryFn: () => pacientesService.list({ limit: 1 }),
    select: (response) => {
      console.log('Dashboard - response completa:', response);
      console.log('Dashboard - response.data:', response?.data);
      console.log('Dashboard - response.data.data:', response?.data?.data);
      console.log('Dashboard - pagination:', (response as any)?.data?.data?.pagination);
      console.log('Dashboard - total pacientes:', (response as any)?.data?.data?.pagination?.total);
      return (response as any)?.data?.data?.pagination?.total || 0;
    },
    refetchOnWindowFocus: false,
    staleTime: 0
  });

  const { data: avaliacoes, isLoading: avaliacoesLoading } = useQuery({
    queryKey: ['avaliacoes-count'],
    queryFn: () => avaliacoesService.list({ limit: 1 }),
    select: (response) => {
      console.log('Dashboard - response avaliações:', response);
      console.log('Dashboard - response.data avaliações:', response?.data);
      console.log('Dashboard - response.data.data avaliações:', response?.data?.data);
      console.log('Dashboard - pagination avaliações:', response?.data?.data?.pagination);
      console.log('Dashboard - total avaliações:', response?.data?.data?.pagination?.total);
      return response?.data?.data?.pagination?.total || 0;
    },
    refetchOnWindowFocus: false,
    staleTime: 0
  });

  const { data: estoqueBaixo, isLoading: estoqueLoading } = useQuery({
    queryKey: ['estoque-low'],
    queryFn: () => estoqueService.list(),
    select: (response) => {
      console.log('Estoque baixo - response:', response);
      console.log('Estoque baixo - data.data:', response?.data?.data);
      console.log('Estoque baixo - data.data.data:', response?.data?.data?.data);
      const itens = response?.data?.data?.data || [];
      return itens.filter((item) => item.quantidade <= item.estoqueMinimo).length;
    },
    refetchOnWindowFocus: false,
    staleTime: 0
  });

  const stats = [
    {
      name: 'Total de Pacientes',
      value: pacientesLoading ? '...' : pacientes,
      icon: Users,
      color: 'bg-blue-500',
      href: '/pacientes'
    },
    {
      name: 'Avaliações Realizadas',
      value: avaliacoesLoading ? '...' : avaliacoes,
      icon: ClipboardList,
      color: 'bg-green-500',
      href: '/avaliacoes'
    },
    {
      name: 'Testes Disponíveis',
      value: '8',
      icon: TestTube,
      color: 'bg-purple-500',
      href: '/testes'
    },
    {
      name: 'Itens com Estoque Baixo',
      value: estoqueLoading ? '...' : estoqueBaixo,
      icon: Package,
      color: (estoqueBaixo || 0) > 0 ? 'bg-red-500' : 'bg-gray-500',
      href: '/estoque'
    }
  ];

  const quickActions = [
    { name: 'Novo Paciente', href: '/pacientes', icon: Users, color: 'bg-blue-500' },
    { name: 'Nova Avaliação', href: '/avaliacoes', icon: ClipboardList, color: 'bg-green-500' },
    { name: 'Realizar Teste', href: '/testes', icon: TestTube, color: 'bg-purple-500' },
    { name: 'Ver Relatórios', href: '/relatorios', icon: ClipboardList, color: 'bg-indigo-500' }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Visão geral do sistema de avaliação psicológica</p>
          </div>
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                onClick={() => router.push(stat.href)}
                className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-md ${stat.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
                {stat.name === 'Itens com Estoque Baixo' && (estoqueBaixo || 0) > 0 && (
                  <div className="absolute top-2 right-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.name}
                    onClick={() => router.push(action.href)}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    <div className={`p-2 rounded-md ${action.color} mr-3`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {action.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(estoqueBaixo || 0) > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Atenção: Estoque Baixo
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    {estoqueBaixo} {(estoqueBaixo || 0) === 1 ? 'item está' : 'itens estão'} com estoque baixo. 
                    <button
                      onClick={() => router.push('/estoque')}
                      className="ml-1 font-medium underline hover:text-red-600"
                    >
                      Ver detalhes
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
