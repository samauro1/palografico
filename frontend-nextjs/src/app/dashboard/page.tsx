'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  ClipboardList, 
  TestTube, 
  Package,
  AlertTriangle,
  RefreshCw,
  Calendar,
  CheckCircle,
  UserX,
  TrendingDown
} from 'lucide-react';
import { pacientesService, avaliacoesService, estoqueService, agendamentosService } from '@/services/api';
// import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import Layout from '@/components/Layout';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isDark } = useTheme();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['pacientes-count'] });
    queryClient.invalidateQueries({ queryKey: ['avaliacoes-count'] });
    queryClient.invalidateQueries({ queryKey: ['estoque-low'] });
    queryClient.invalidateQueries({ queryKey: ['agendamentos-stats'] });
    queryClient.invalidateQueries({ queryKey: ['aptidao-stats'] });
  };

  const { data: pacientes, isLoading: pacientesLoading } = useQuery({
    queryKey: ['pacientes-count'],
    queryFn: () => pacientesService.list({ limit: 1 }),
    select: (response) => {
      return (response as any)?.data?.data?.pagination?.total || 0;
    },
    refetchOnWindowFocus: false,
    staleTime: 0
  });

  const { data: avaliacoes, isLoading: avaliacoesLoading } = useQuery({
    queryKey: ['avaliacoes-count'],
    queryFn: () => avaliacoesService.list({ limit: 1 }),
    select: (response) => {
      return response?.data?.data?.pagination?.total || 0;
    },
    refetchOnWindowFocus: false,
    staleTime: 0
  });

  const { data: estoqueBaixo, isLoading: estoqueLoading } = useQuery({
    queryKey: ['estoque-low'],
    queryFn: () => estoqueService.list(),
    select: (response) => {
      const itens = response?.data?.data?.data || [];
      return itens.filter((item) => item.quantidade <= item.estoqueMinimo).length;
    },
    refetchOnWindowFocus: false,
    staleTime: 0
  });

  // Query para estatísticas de agendamentos do mês atual
  const { data: agendamentosStats, isLoading: agendamentosLoading } = useQuery({
    queryKey: ['agendamentos-stats'],
    queryFn: async () => {
      const response = await agendamentosService.list({});
      const agendamentos = (response as any)?.data?.data?.agendamentos || [];
      
      // Filtrar agendamentos do mês atual
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      
      const agendamentosMes = agendamentos.filter((ag: any) => {
        const dataAg = new Date(ag.data_agendamento);
        return dataAg >= inicioMes && dataAg <= fimMes;
      });
      
      const totalAgendados = agendamentosMes.length;
      const avaliados = agendamentosMes.filter((ag: any) => ag.paciente_id).length;
      const ausentes = totalAgendados - avaliados;
      const percentualFalta = totalAgendados > 0 ? ((ausentes / totalAgendados) * 100).toFixed(1) : 0;
      
      return {
        totalAgendados,
        avaliados,
        ausentes,
        percentualFalta
      };
    },
    refetchOnWindowFocus: false,
    staleTime: 0
  });

  // Query para estatísticas de aptidão
  const { data: aptidaoStats, isLoading: aptidaoLoading } = useQuery({
    queryKey: ['aptidao-stats'],
    queryFn: async () => {
      // Buscar TODAS as avaliações (limit alto) para calcular estatísticas corretas
      const response = await avaliacoesService.list({ limit: 10000 });
      const avaliacoes = (response as any)?.data?.data?.avaliacoes || [];
      
      const aptos = avaliacoes.filter((av: any) => av.aptidao === 'Apto').length;
      const inaptos = avaliacoes.filter((av: any) => 
        av.aptidao === 'Inapto' || av.aptidao === 'Inapto Temporário'
      ).length;
      const total = aptos + inaptos;
      const percentualInaptidao = total > 0 ? ((inaptos / total) * 100).toFixed(1) : 0;
      
      return {
        aptos,
        inaptos,
        total,
        percentualInaptidao
      };
    },
    refetchOnWindowFocus: false,
    staleTime: 0
  });

  const statsRow1 = [
    {
      name: 'Total de Avaliados',
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
    }
  ];

  const statsRow2 = [
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
    { name: 'Adicionar Pessoa', href: '/pacientes', icon: Users, color: 'bg-blue-500' },
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
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
            <p className={`${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Visão geral do sistema de avaliação psicológica</p>
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
        {/* Primeira Linha de Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {statsRow1.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                onClick={() => router.push(stat.href)}
                className={`relative overflow-hidden rounded-lg ${isDark ? 'bg-dark-800' : 'bg-white'} px-4 py-5 shadow hover:shadow-md transition-shadow cursor-pointer`}
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
                      <dd className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Estatísticas de Aptidão */}
        {!aptidaoLoading && aptidaoStats && aptidaoStats.total > 0 && (
          <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} shadow rounded-lg`}>
            <div className="px-4 py-5 sm:p-6">
              <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                ✅ Resultados de Aptidão
              </h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Total Aptos */}
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-dark-700 border-dark-600' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center">
                    <CheckCircle className={`h-8 w-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Total Aptos</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {aptidaoStats.aptos}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total Inaptos */}
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-dark-700 border-dark-600' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center">
                    <UserX className={`h-8 w-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Total Inaptos</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {aptidaoStats.inaptos}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Percentual de Inaptidão */}
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-dark-700 border-dark-600' : 'bg-orange-50 border-orange-200'}`}>
                  <div className="flex items-center">
                    <TrendingDown className={`h-8 w-8 ${isDark ? 'text-orange-400' : 'text-orange-600'}`} />
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>% de Inaptidão</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {aptidaoStats.percentualInaptidao}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Segunda Linha de Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {statsRow2.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                onClick={() => router.push(stat.href)}
                className={`relative overflow-hidden rounded-lg ${isDark ? 'bg-dark-800' : 'bg-white'} px-4 py-5 shadow hover:shadow-md transition-shadow cursor-pointer`}
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
                      <dd className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
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

        {/* Estatísticas de Agendamentos do Mês */}
        {!agendamentosLoading && agendamentosStats && agendamentosStats.totalAgendados > 0 && (
          <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} shadow rounded-lg`}>
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  📅 Agendamentos do Mês ({new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })})
                </h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total Agendados */}
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-dark-700 border-dark-600' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-center">
                    <Calendar className={`h-8 w-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Total Agendados</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {agendamentosStats.totalAgendados}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Avaliados */}
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-dark-700 border-dark-600' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center">
                    <CheckCircle className={`h-8 w-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Avaliados</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {agendamentosStats.avaliados}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ausentes */}
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-dark-700 border-dark-600' : 'bg-yellow-50 border-yellow-200'}`}>
                  <div className="flex items-center">
                    <UserX className={`h-8 w-8 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Ausentes</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {agendamentosStats.ausentes}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Percentual de Falta */}
                <div className={`p-4 rounded-lg border ${isDark ? 'bg-dark-700 border-dark-600' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center">
                    <TrendingDown className={`h-8 w-8 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Taxa de Falta</p>
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {agendamentosStats.percentualFalta}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                    Taxa de Comparecimento
                  </span>
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {agendamentosStats.totalAgendados > 0 
                      ? ((agendamentosStats.avaliados / agendamentosStats.totalAgendados) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className={`w-full ${isDark ? 'bg-dark-600' : 'bg-gray-200'} rounded-full h-2.5`}>
                  <div 
                    className="bg-green-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${agendamentosStats.totalAgendados > 0 
                        ? (agendamentosStats.avaliados / agendamentosStats.totalAgendados) * 100
                        : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} shadow rounded-lg`}>
          <div className="px-4 py-5 sm:p-6">
            <h3 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>Ações Rápidas</h3>
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
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
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
