import React from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { 
  Users, 
  ClipboardList, 
  TestTube, 
  Package,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { pacientesService, avaliacoesService, estoqueService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries('pacientes-count');
    queryClient.invalidateQueries('avaliacoes-count');
    queryClient.invalidateQueries('estoque-low');
  };
  const { data: pacientes, isLoading: pacientesLoading } = useQuery(
    'pacientes-count',
    () => pacientesService.list({ limit: 1 }),
    {
      select: (response) => {
        console.log('Dashboard - response completa:', response);
        console.log('Dashboard - response.data:', response?.data);
        console.log('Dashboard - response.data.data:', response?.data?.data);
        console.log('Dashboard - pagination:', response?.data?.data?.pagination);
        console.log('Dashboard - total pacientes:', response?.data?.data?.pagination?.total);
        return response?.data?.data?.pagination?.total || 0;
      },
      refetchOnWindowFocus: false,
      staleTime: 0
    }
  );

  const { data: avaliacoes, isLoading: avaliacoesLoading } = useQuery(
    'avaliacoes-count',
    () => avaliacoesService.list({ limit: 1 }),
    {
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
    }
  );

  const { data: estoque, isLoading: estoqueLoading } = useQuery(
    'estoque-low',
    () => estoqueService.list(),
    {
      select: (response) => {
        console.log('Dashboard - response estoque:', response);
        console.log('Dashboard - response.data estoque:', response?.data);
        console.log('Dashboard - response.data.data estoque:', response?.data?.data);
        const list = response?.data?.data?.estoque || [];
        console.log('Dashboard - lista estoque:', list);
        const items = list.filter(item => (item.quantidade_atual || 0) <= (item.quantidade_minima || 0));
        console.log('Dashboard - itens estoque baixo:', items.length);
        return items.length;
      },
      refetchOnWindowFocus: false,
      staleTime: 0
    }
  );

  const stats = [
    {
      name: 'Total de Pacientes',
      value: pacientes || 0,
      icon: Users,
      color: 'bg-blue-500',
      loading: pacientesLoading
    },
    {
      name: 'Avaliações Realizadas',
      value: avaliacoes || 0,
      icon: ClipboardList,
      color: 'bg-green-500',
      loading: avaliacoesLoading
    },
    {
      name: 'Testes Disponíveis',
      value: '9',
      icon: TestTube,
      color: 'bg-purple-500',
      loading: false
    },
    {
      name: 'Itens com Estoque Baixo',
      value: estoque || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      loading: estoqueLoading
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'avaliacao',
      description: 'Nova avaliação realizada para João Silva',
      time: '2 horas atrás',
      icon: ClipboardList
    },
    {
      id: 2,
      type: 'paciente',
      description: 'Paciente Maria Santos cadastrada',
      time: '4 horas atrás',
      icon: Users
    },
    {
      id: 3,
      type: 'estoque',
      description: 'Estoque de teste AC atualizado',
      time: '6 horas atrás',
      icon: Package
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Visão geral do sistema de avaliação psicológica
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn-outline btn-sm flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card hover:shadow-hover transition-all duration-300 animate-fade-in cursor-pointer transform hover:scale-105">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-lg ${stat.color} shadow-md`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900 mt-1">
                        {stat.loading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          stat.value
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activities */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Atividades Recentes</h3>
            <p className="card-description">
              Últimas ações realizadas no sistema
            </p>
          </div>
          <div className="card-content">
            <div className="flow-root">
              <ul className="-mb-8">
                {recentActivities.map((activity, activityIdx) => {
                  const Icon = activity.icon;
                  return (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== recentActivities.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                              <Icon className="h-4 w-4 text-gray-600" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                {activity.description}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {activity.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Ações Rápidas</h3>
            <p className="card-description">
              Acesso rápido às funcionalidades principais
            </p>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-2 gap-4">
              <button className="btn-outline btn-md flex flex-col items-center p-6 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group" onClick={() => navigate('/pacientes')}>
                <Users className="h-10 w-10 text-blue-500 mb-3 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700">Novo Paciente</span>
              </button>
              <button className="btn-outline btn-md flex flex-col items-center p-6 hover:border-green-500 hover:bg-green-50 transition-all duration-200 group" onClick={() => navigate('/avaliacoes')}>
                <ClipboardList className="h-10 w-10 text-green-500 mb-3 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-semibold text-gray-700 group-hover:text-green-700">Nova Avaliação</span>
              </button>
              <button className="btn-outline btn-md flex flex-col items-center p-6 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group" onClick={() => navigate('/testes')}>
                <TestTube className="h-10 w-10 text-purple-500 mb-3 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-semibold text-gray-700 group-hover:text-purple-700">Realizar Teste</span>
              </button>
              <button className="btn-outline btn-md flex flex-col items-center p-6 hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 group" onClick={() => navigate('/estoque')}>
                <Package className="h-10 w-10 text-orange-500 mb-3 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-700">Gerenciar Estoque</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
