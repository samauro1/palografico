import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Settings, Shield, Database, Bell } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Configuracoes = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'perfil', name: 'Perfil', icon: User },
    { id: 'sistema', name: 'Sistema', icon: Settings },
    { id: 'seguranca', name: 'Segurança', icon: Shield },
    { id: 'banco', name: 'Banco de Dados', icon: Database },
    { id: 'notificacoes', name: 'Notificações', icon: Bell }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'perfil':
        return <PerfilTab user={user} />;
      case 'sistema':
        return <SistemaTab />;
      case 'seguranca':
        return <SegurancaTab />;
      case 'banco':
        return <BancoTab />;
      case 'notificacoes':
        return <NotificacoesTab />;
      default:
        return <PerfilTab user={user} />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie as configurações do sistema
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="card">
            <div className="card-content">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PerfilTab = ({ user }) => {
  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Implementar atualização do perfil
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Informações do Perfil</h3>
        <p className="text-sm text-gray-500">
          Atualize suas informações pessoais
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Nome completo</label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="input"
            required
          />
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input"
            required
          />
        </div>

        <div className="pt-4">
          <button type="submit" className="btn-primary btn-md">
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
};

const SistemaTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Configurações do Sistema</h3>
        <p className="text-sm text-gray-500">
          Configurações gerais do sistema
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
          <div>
            <h4 className="font-medium text-gray-900">Manutenção Automática</h4>
            <p className="text-sm text-gray-500">Executar limpeza automática do banco de dados</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
          <div>
            <h4 className="font-medium text-gray-900">Backup Automático</h4>
            <p className="text-sm text-gray-500">Fazer backup automático dos dados</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
          <div>
            <h4 className="font-medium text-gray-900">Logs Detalhados</h4>
            <p className="text-sm text-gray-500">Registrar logs detalhados das operações</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

const SegurancaTab = () => {
  const [senhaData, setSenhaData] = useState({
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Implementar alteração de senha
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Segurança</h3>
        <p className="text-sm text-gray-500">
          Gerencie as configurações de segurança da sua conta
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Senha Atual</label>
          <input
            type="password"
            value={senhaData.senha_atual}
            onChange={(e) => setSenhaData({ ...senhaData, senha_atual: e.target.value })}
            className="input"
            required
          />
        </div>

        <div>
          <label className="label">Nova Senha</label>
          <input
            type="password"
            value={senhaData.nova_senha}
            onChange={(e) => setSenhaData({ ...senhaData, nova_senha: e.target.value })}
            className="input"
            required
            minLength="6"
          />
        </div>

        <div>
          <label className="label">Confirmar Nova Senha</label>
          <input
            type="password"
            value={senhaData.confirmar_senha}
            onChange={(e) => setSenhaData({ ...senhaData, confirmar_senha: e.target.value })}
            className="input"
            required
          />
        </div>

        <div className="pt-4">
          <button type="submit" className="btn-primary btn-md">
            Alterar Senha
          </button>
        </div>
      </form>
    </div>
  );
};

const BancoTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Banco de Dados</h3>
        <p className="text-sm text-gray-500">
          Informações e operações do banco de dados
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 border border-gray-200 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2">Status do Banco</h4>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Conectado</span>
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-md">
          <h4 className="font-medium text-gray-900 mb-2">Informações</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Tipo:</strong> PostgreSQL</p>
            <p><strong>Versão:</strong> 14.0</p>
            <p><strong>Host:</strong> localhost:5432</p>
            <p><strong>Database:</strong> sistema_avaliacao_psicologica</p>
          </div>
        </div>

        <div className="space-y-2">
          <button className="btn-outline btn-md w-full">
            Fazer Backup
          </button>
          <button className="btn-outline btn-md w-full">
            Restaurar Backup
          </button>
          <button className="btn-outline btn-md w-full text-red-600 hover:text-red-700">
            Limpar Dados de Teste
          </button>
        </div>
      </div>
    </div>
  );
};

const NotificacoesTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Notificações</h3>
        <p className="text-sm text-gray-500">
          Configure as notificações do sistema
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
          <div>
            <h4 className="font-medium text-gray-900">Estoque Baixo</h4>
            <p className="text-sm text-gray-500">Notificar quando estoque estiver baixo</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
          <div>
            <h4 className="font-medium text-gray-900">Novas Avaliações</h4>
            <p className="text-sm text-gray-500">Notificar sobre novas avaliações</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
          <div>
            <h4 className="font-medium text-gray-900">Relatórios</h4>
            <p className="text-sm text-gray-500">Notificar quando relatórios forem gerados</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default Configuracoes;
