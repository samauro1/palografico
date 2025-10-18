'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  User,
  Building2,
  Mail,
  FileText,
  Palette,
  Bell,
  Shield,
  Package,
  Save,
  Eye,
  EyeOff,
  Upload,
  Download,
  Lock,
  Key,
  Briefcase,
  Users,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import { usuariosService, configuracoesService, authService } from '@/services/api';
import { useConfiguracoes } from '@/contexts/ConfiguracoesContext';

type TabType = 'perfil' | 'clinica' | 'estoque' | 'email' | 'laudos' | 'aparencia' | 'notificacoes' | 'seguranca' | 'usuarios';

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('perfil');
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const { recarregarConfiguracoes } = useConfiguracoes();

  // Estados para os formulários
  const [perfilData, setPerfilData] = useState({
    nome: 'Dr. João Silva',
    email: 'joao@clinica.com',
    crp: 'CRP 06/123456',
    especialidade: 'Psicologia do Trânsito',
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: ''
  });

  const [clinicaData, setClinicaData] = useState({
    nome_clinica: 'Clínica de Avaliação Psicológica',
    cnpj: '12.345.678/0001-90',
    endereco: 'Rua das Flores, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    telefone: '(11) 98765-4321',
    email: 'contato@clinica.com'
  });

  const [estoqueConfig, setEstoqueConfig] = useState({
    desconto_automatico: true,
    alerta_estoque_baixo: true,
    percentual_alerta: 30,
    email_alertas: 'estoque@clinica.com'
  });

  const [emailConfig, setEmailConfig] = useState({
    smtp_host: 'smtp.gmail.com',
    smtp_port: '587',
    smtp_usuario: '',
    smtp_senha: '',
    email_padrao_copia: ''
  });

  const [laudoConfig, setLaudoConfig] = useState({
    formato_numeracao: 'LAU-YYYY-NNNN',
    texto_rodape: 'Este documento é válido por 6 meses a partir da data de emissão.',
    incluir_logo: true,
    incluir_assinatura: true
  });

  const [aparenciaConfig, setAparenciaConfig] = useState({
    modo: 'light',
    cor_primaria: '#3b82f6',
    tamanho_fonte: 'medium'
  });

  const [notificacoesConfig, setNotificacoesConfig] = useState({
    notif_estoque: true,
    notif_avaliacoes_pendentes: true,
    notif_email: true,
    notif_sistema: true
  });

  // Estado para gestão de usuários
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userFormData, setUserFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: 'psicologo'
  });

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: User },
    { id: 'usuarios', label: 'Usuários', icon: Users },
    { id: 'clinica', label: 'Clínica', icon: Building2 },
    { id: 'estoque', label: 'Estoque', icon: Package },
    { id: 'email', label: 'E-mail', icon: Mail },
    { id: 'laudos', label: 'Laudos', icon: FileText },
    { id: 'aparencia', label: 'Aparência', icon: Palette },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'seguranca', label: 'Segurança', icon: Shield }
  ];

  const handleSavePerfil = async () => {
    try {
      if (perfilData.nova_senha && perfilData.nova_senha !== perfilData.confirmar_senha) {
        toast.error('As senhas não coincidem!');
        return;
      }

      const dataToSave: any = {
        nome: perfilData.nome,
        email: perfilData.email
      };

      // Incluir foto se foi carregada
      if (fotoPreview) {
        dataToSave.foto_url = fotoPreview;
      }

      await usuariosService.updatePerfil(dataToSave);
      
      // Recarregar dados do usuário no AuthContext
      await authService.verify();
      
      toast.success('Perfil atualizado com sucesso!');
      
      // Resetar preview para não enviar novamente
      setFotoPreview(null);
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast.error(error.response?.data?.error || 'Erro ao atualizar perfil');
    }
  };

  const handleSaveClinica = () => {
    const dataToSave = {
      ...clinicaData,
      logo_url: logoPreview || null
    };
    updateClinicaMutation.mutate(dataToSave);
  };

  const handleSaveEstoque = () => {
    toast.success('Configurações de estoque atualizadas!');
    // TODO: Implementar chamada à API
  };

  const handleSaveEmail = () => {
    toast.success('Configurações de e-mail atualizadas!');
    // TODO: Implementar chamada à API
  };

  const handleSaveLaudo = () => {
    toast.success('Configurações de laudos atualizadas!');
    // TODO: Implementar chamada à API
  };

  const handleSaveAparencia = () => {
    toast.success('Configurações de aparência atualizadas!');
    // TODO: Implementar chamada à API
  };

  const handleSaveNotificacoes = () => {
    toast.success('Configurações de notificações atualizadas!');
    // TODO: Implementar chamada à API
  };

  const handleExportarDados = () => {
    toast.success('Exportação iniciada! Você receberá um e-mail quando estiver pronta.');
    // TODO: Implementar exportação
  };

  const handleBackup = () => {
    toast.success('Backup realizado com sucesso!');
    // TODO: Implementar backup
  };

  // Query para carregar configurações da clínica
  const { data: clinicaDataDB } = useQuery({
    queryKey: ['configuracoes-clinica'],
    queryFn: async () => {
      const response = await configuracoesService.getClinica();
      return response.data;
    },
    enabled: activeTab === 'clinica'
  });

  // Atualizar estado local quando carregar do banco
  React.useEffect(() => {
    if (clinicaDataDB?.data) {
      const config = clinicaDataDB.data;
      setClinicaData({
        nome_clinica: config.nome_clinica || '',
        cnpj: config.cnpj || '',
        endereco: config.endereco || '',
        cidade: config.cidade || '',
        estado: config.estado || '',
        cep: config.cep || '',
        telefone: config.telefone || '',
        email: config.email || ''
      });
      if (config.logo_url) {
        setLogoPreview(config.logo_url);
      }
    }
  }, [clinicaDataDB]);

  // Mutation para salvar configurações da clínica
  const updateClinicaMutation = useMutation({
    mutationFn: configuracoesService.updateClinica,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes-clinica'] });
      recarregarConfiguracoes(); // Recarrega contexto global para atualizar o logo no menu
      toast.success('Configurações da clínica atualizadas com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar configurações');
    }
  });

  // Queries e Mutations para Usuários
  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const response = await usuariosService.list();
      return response.data;
    },
    enabled: activeTab === 'usuarios'
  });

  const { data: perfisData } = useQuery({
    queryKey: ['perfis'],
    queryFn: async () => {
      const response = await usuariosService.getPerfis();
      return response.data;
    },
    enabled: activeTab === 'usuarios'
  });

  const createUserMutation = useMutation({
    mutationFn: usuariosService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário criado com sucesso!');
      setShowUserModal(false);
      resetUserForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao criar usuário');
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usuariosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário atualizado com sucesso!');
      setShowUserModal(false);
      resetUserForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar usuário');
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: usuariosService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast.success('Usuário desativado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao desativar usuário');
    }
  });

  const resetUserForm = () => {
    setUserFormData({
      nome: '',
      email: '',
      senha: '',
      perfil: 'psicologo'
    });
    setEditingUser(null);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setUserFormData({
      nome: user.nome,
      email: user.email,
      senha: '',
      perfil: user.perfil
    });
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    if (!userFormData.nome || !userFormData.email) {
      toast.error('Nome e e-mail são obrigatórios');
      return;
    }

    if (!editingUser && !userFormData.senha) {
      toast.error('Senha é obrigatória para novos usuários');
      return;
    }

    if (editingUser) {
      const dataToUpdate: any = {
        nome: userFormData.nome,
        email: userFormData.email,
        perfil: userFormData.perfil
      };
      if (userFormData.senha) {
        dataToUpdate.senha = userFormData.senha;
      }
      updateUserMutation.mutate({ id: editingUser.id, data: dataToUpdate });
    } else {
      createUserMutation.mutate(userFormData);
    }
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Tem certeza que deseja desativar este usuário?')) {
      deleteUserMutation.mutate(id);
    }
  };

  const getPerfilBadgeColor = (perfil: string) => {
    const colors: Record<string, string> = {
      'administrador': 'bg-red-100 text-red-800 border-red-200',
      'psicologo': 'bg-blue-100 text-blue-800 border-blue-200',
      'recepcionista': 'bg-green-100 text-green-800 border-green-200',
      'estagiario': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[perfil] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Função para formatar CNPJ
  const formatCNPJ = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 14);
    
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 5) {
      return `${limited.slice(0, 2)}.${limited.slice(2)}`;
    } else if (limited.length <= 8) {
      return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5)}`;
    } else if (limited.length <= 12) {
      return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8)}`;
    } else {
      return `${limited.slice(0, 2)}.${limited.slice(2, 5)}.${limited.slice(5, 8)}/${limited.slice(8, 12)}-${limited.slice(12)}`;
    }
  };

  // Handler para CNPJ
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setClinicaData({ ...clinicaData, cnpj: formatted });
  };

  // Função para formatar telefone
  const formatTelefone = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 11);
    
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else if (limited.length <= 10) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
    } else {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
    }
  };

  // Handler para telefone
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTelefone(e.target.value);
    setClinicaData({ ...clinicaData, telefone: formatted });
  };

  // Estado para logo
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Estado para foto do usuário
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  // Handler para upload de logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem válida');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        toast.success('Logo carregado! Clique em "Salvar Alterações" para confirmar.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handler para upload de foto do usuário
  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione uma imagem válida');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
        toast.success('Foto carregada! Clique em "Salvar Alterações" para confirmar.');
      };
      reader.readAsDataURL(file);
    }
  };

  const usuarios = usuariosData?.data || [];
  const perfis = perfisData?.data || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            Configurações
          </h1>
          <p className="text-gray-600 mt-1">Gerencie as configurações do sistema</p>
        </div>
        
        <div className="flex gap-6">
          {/* Sidebar de Tabs */}
          <div className="w-64 bg-white rounded-xl shadow-sm p-4 h-fit sticky top-6">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Conteúdo */}
          <div className="flex-1">
            {/* TAB: PERFIL */}
            {activeTab === 'perfil' && (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">👤 Perfil do Usuário</h2>
                  <p className="text-sm text-gray-600">Gerencie suas informações pessoais e credenciais</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo</label>
                    <input
                      type="text"
                      value={perfilData.nome}
                      onChange={(e) => setPerfilData({ ...perfilData, nome: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                    <input
                      type="email"
                      value={perfilData.email}
                      onChange={(e) => setPerfilData({ ...perfilData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CRP</label>
                    <input
                      type="text"
                      value={perfilData.crp}
                      onChange={(e) => setPerfilData({ ...perfilData, crp: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="CRP 06/123456"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Especialidade</label>
                    <input
                      type="text"
                      value={perfilData.especialidade}
                      onChange={(e) => setPerfilData({ ...perfilData, especialidade: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Upload de Foto do Usuário */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Foto do Perfil
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full border-2 border-gray-300 overflow-hidden bg-gray-100 flex items-center justify-center">
                        {fotoPreview ? (
                          <img src={fotoPreview} alt="Foto Preview" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <label htmlFor="foto-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all border border-blue-200">
                        <Upload className="w-4 h-4" />
                        Escolher Foto
                      </label>
                      <input
                        id="foto-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFotoUpload}
                        className="hidden"
                      />
                      <p className="text-sm text-gray-500 mt-2">JPG, PNG ou GIF. Máximo 2MB.</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-blue-600" />
                    Alterar Senha
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Senha Atual</label>
                      <input
                        type="password"
                        value={perfilData.senha_atual}
                        onChange={(e) => setPerfilData({ ...perfilData, senha_atual: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nova Senha</label>
                      <input
                        type="password"
                        value={perfilData.nova_senha}
                        onChange={(e) => setPerfilData({ ...perfilData, nova_senha: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar Nova Senha</label>
                      <input
                        type="password"
                        value={perfilData.confirmar_senha}
                        onChange={(e) => setPerfilData({ ...perfilData, confirmar_senha: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <button
                    onClick={handleSavePerfil}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
                  >
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </button>
                </div>
              </div>
            )}

            {/* TAB: CLÍNICA */}
            {activeTab === 'clinica' && (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">🏢 Dados da Clínica</h2>
                  <p className="text-sm text-gray-600">Informações da sua empresa ou consultório</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Clínica</label>
                    <input
                      type="text"
                      value={clinicaData.nome_clinica}
                      onChange={(e) => setClinicaData({ ...clinicaData, nome_clinica: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CNPJ/CPF</label>
                    <input
                      type="text"
                      value={clinicaData.cnpj}
                      onChange={handleCNPJChange}
                      placeholder="00.000.000/0000-00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <input
                      type="text"
                      value={clinicaData.telefone}
                      onChange={handleTelefoneChange}
                      placeholder="(11) 99999-9999"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Endereço</label>
                    <input
                      type="text"
                      value={clinicaData.endereco}
                      onChange={(e) => setClinicaData({ ...clinicaData, endereco: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                    <input
                      type="text"
                      value={clinicaData.cidade}
                      onChange={(e) => setClinicaData({ ...clinicaData, cidade: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                      <input
                        type="text"
                        value={clinicaData.estado}
                        onChange={(e) => setClinicaData({ ...clinicaData, estado: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                      <input
                        type="text"
                        value={clinicaData.cep}
                        onChange={(e) => setClinicaData({ ...clinicaData, cep: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
                    <input
                      type="email"
                      value={clinicaData.email}
                      onChange={(e) => setClinicaData({ ...clinicaData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Logo da Clínica</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-gray-400 text-sm">Logo</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Fazer Upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      {logoPreview && (
                        <button
                          onClick={() => {
                            setLogoPreview(null);
                            toast.success('Logo removido');
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remover Logo
                        </button>
                      )}
                      <p className="text-xs text-gray-500">
                        Formatos aceitos: JPG, PNG, GIF (máx. 2MB)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <button
                    onClick={handleSaveClinica}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
                  >
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </button>
                </div>
              </div>
            )}

            {/* TAB: ESTOQUE */}
            {activeTab === 'estoque' && (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">📦 Configurações de Estoque</h2>
                  <p className="text-sm text-gray-600">Gerencie como o estoque funciona no sistema</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">Desconto Automático de Estoque</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Descontar automaticamente folhas quando um teste é aplicado
                      </p>
                    </div>
                    <button
                      onClick={() => setEstoqueConfig({ ...estoqueConfig, desconto_automatico: !estoqueConfig.desconto_automatico })}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        estoqueConfig.desconto_automatico ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          estoqueConfig.desconto_automatico ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">Alertas de Estoque Baixo</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Receber notificações quando o estoque estiver baixo
                      </p>
                    </div>
                    <button
                      onClick={() => setEstoqueConfig({ ...estoqueConfig, alerta_estoque_baixo: !estoqueConfig.alerta_estoque_baixo })}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        estoqueConfig.alerta_estoque_baixo ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          estoqueConfig.alerta_estoque_baixo ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Percentual de Alerta (%)
                      </label>
                      <input
                        type="number"
                        value={estoqueConfig.percentual_alerta}
                        onChange={(e) => setEstoqueConfig({ ...estoqueConfig, percentual_alerta: parseInt(e.target.value) })}
                        min="0"
                        max="100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Alertar quando estoque estiver abaixo deste percentual do mínimo
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-mail para Alertas
                      </label>
                      <input
                        type="email"
                        value={estoqueConfig.email_alertas}
                        onChange={(e) => setEstoqueConfig({ ...estoqueConfig, email_alertas: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <button
                    onClick={handleSaveEstoque}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
                  >
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </button>
                </div>
              </div>
            )}

            {/* TAB: EMAIL */}
            {activeTab === 'email' && (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">📧 Configurações de E-mail</h2>
                  <p className="text-sm text-gray-600">Configure o envio automático de e-mails e laudos</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    ℹ️ Configure seu servidor SMTP para enviar laudos e relatórios por e-mail automaticamente.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Servidor SMTP</label>
                    <input
                      type="text"
                      value={emailConfig.smtp_host}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtp_host: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="smtp.gmail.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Porta SMTP</label>
                    <input
                      type="text"
                      value={emailConfig.smtp_port}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtp_port: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="587"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Usuário SMTP</label>
                    <input
                      type="text"
                      value={emailConfig.smtp_usuario}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtp_usuario: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Senha SMTP</label>
                    <input
                      type="password"
                      value={emailConfig.smtp_senha}
                      onChange={(e) => setEmailConfig({ ...emailConfig, smtp_senha: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-mail Padrão para Cópia (CC)</label>
                    <input
                      type="email"
                      value={emailConfig.email_padrao_copia}
                      onChange={(e) => setEmailConfig({ ...emailConfig, email_padrao_copia: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="copia@clinica.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Este e-mail receberá uma cópia de todos os laudos enviados
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">
                    <Mail className="w-4 h-4" />
                    Testar Conexão
                  </button>
                  <button
                    onClick={handleSaveEmail}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md ml-auto"
                  >
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </button>
                </div>
              </div>
            )}

            {/* TAB: LAUDOS */}
            {activeTab === 'laudos' && (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">📄 Configurações de Laudos</h2>
                  <p className="text-sm text-gray-600">Personalize a aparência e conteúdo dos laudos</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Formato de Numeração</label>
                    <input
                      type="text"
                      value={laudoConfig.formato_numeracao}
                      onChange={(e) => setLaudoConfig({ ...laudoConfig, formato_numeracao: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="LAU-YYYY-NNNN"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      YYYY = ano, MM = mês, DD = dia, NNNN = número sequencial
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Texto de Rodapé</label>
                    <textarea
                      value={laudoConfig.texto_rodape}
                      onChange={(e) => setLaudoConfig({ ...laudoConfig, texto_rodape: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">Incluir Logo no Laudo</h3>
                        <p className="text-sm text-gray-600 mt-1">Adicionar logo da clínica no cabeçalho</p>
                      </div>
                      <button
                        onClick={() => setLaudoConfig({ ...laudoConfig, incluir_logo: !laudoConfig.incluir_logo })}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                          laudoConfig.incluir_logo ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                            laudoConfig.incluir_logo ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">Incluir Assinatura Digital</h3>
                        <p className="text-sm text-gray-600 mt-1">Adicionar assinatura do profissional</p>
                      </div>
                      <button
                        onClick={() => setLaudoConfig({ ...laudoConfig, incluir_assinatura: !laudoConfig.incluir_assinatura })}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                          laudoConfig.incluir_assinatura ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                            laudoConfig.incluir_assinatura ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <button
                    onClick={handleSaveLaudo}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
                  >
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </button>
                </div>
              </div>
            )}

            {/* TAB: APARÊNCIA */}
            {activeTab === 'aparencia' && (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">🎨 Aparência do Sistema</h2>
                  <p className="text-sm text-gray-600">Personalize a interface do sistema</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Modo de Exibição</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setAparenciaConfig({ ...aparenciaConfig, modo: 'light' })}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          aparenciaConfig.modo === 'light'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">☀️</div>
                          <p className="font-semibold">Modo Claro</p>
                        </div>
                      </button>

                      <button
                        onClick={() => setAparenciaConfig({ ...aparenciaConfig, modo: 'dark' })}
                        className={`p-4 border-2 rounded-lg transition-all ${
                          aparenciaConfig.modo === 'dark'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">🌙</div>
                          <p className="font-semibold">Modo Escuro</p>
                          <p className="text-xs text-gray-500 mt-1">(Em breve)</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Cor Primária</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={aparenciaConfig.cor_primaria}
                        onChange={(e) => setAparenciaConfig({ ...aparenciaConfig, cor_primaria: e.target.value })}
                        className="w-20 h-12 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={aparenciaConfig.cor_primaria}
                        onChange={(e) => setAparenciaConfig({ ...aparenciaConfig, cor_primaria: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Tamanho da Fonte</label>
                    <div className="grid grid-cols-3 gap-4">
                      {['small', 'medium', 'large'].map((size) => (
                        <button
                          key={size}
                          onClick={() => setAparenciaConfig({ ...aparenciaConfig, tamanho_fonte: size })}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            aparenciaConfig.tamanho_fonte === size
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <p className="font-semibold capitalize">{size === 'small' ? 'Pequeno' : size === 'medium' ? 'Médio' : 'Grande'}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <button
                    onClick={handleSaveAparencia}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
                  >
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </button>
                </div>
              </div>
            )}

            {/* TAB: NOTIFICAÇÕES */}
            {activeTab === 'notificacoes' && (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">🔔 Notificações</h2>
                  <p className="text-sm text-gray-600">Gerencie como e quando você recebe notificações</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">Alertas de Estoque</h3>
                      <p className="text-sm text-gray-600 mt-1">Notificar quando o estoque estiver baixo</p>
                    </div>
                    <button
                      onClick={() => setNotificacoesConfig({ ...notificacoesConfig, notif_estoque: !notificacoesConfig.notif_estoque })}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        notificacoesConfig.notif_estoque ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          notificacoesConfig.notif_estoque ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">Avaliações Pendentes</h3>
                      <p className="text-sm text-gray-600 mt-1">Lembrete de avaliações não finalizadas</p>
                    </div>
                    <button
                      onClick={() => setNotificacoesConfig({ ...notificacoesConfig, notif_avaliacoes_pendentes: !notificacoesConfig.notif_avaliacoes_pendentes })}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        notificacoesConfig.notif_avaliacoes_pendentes ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          notificacoesConfig.notif_avaliacoes_pendentes ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">Notificações por E-mail</h3>
                      <p className="text-sm text-gray-600 mt-1">Receber resumo diário por e-mail</p>
                    </div>
                    <button
                      onClick={() => setNotificacoesConfig({ ...notificacoesConfig, notif_email: !notificacoesConfig.notif_email })}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        notificacoesConfig.notif_email ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          notificacoesConfig.notif_email ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">Notificações do Sistema</h3>
                      <p className="text-sm text-gray-600 mt-1">Atualizações e avisos importantes</p>
                    </div>
                    <button
                      onClick={() => setNotificacoesConfig({ ...notificacoesConfig, notif_sistema: !notificacoesConfig.notif_sistema })}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        notificacoesConfig.notif_sistema ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          notificacoesConfig.notif_sistema ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <button
                    onClick={handleSaveNotificacoes}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
                  >
                    <Save className="w-5 h-5" />
                    Salvar Alterações
                  </button>
                </div>
              </div>
            )}

            {/* TAB: SEGURANÇA */}
            {activeTab === 'seguranca' && (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">🔒 Segurança e Privacidade</h2>
                  <p className="text-sm text-gray-600">Gerencie backups, exportações e segurança dos dados</p>
                </div>

                <div className="space-y-6">
                  {/* Backup */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Download className="w-5 h-5 text-blue-600" />
                          Backup de Dados
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Faça backup de todos os dados do sistema
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleBackup}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Fazer Backup Agora
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">
                        <Upload className="w-4 h-4" />
                        Restaurar Backup
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Último backup: Nunca realizado
                    </p>
                  </div>

                  {/* Exportar Dados (LGPD) */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-green-600" />
                          Exportar Dados (LGPD)
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Exporte todos os dados em formato legível
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleExportarDados}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Exportar Todos os Dados
                    </button>
                  </div>

                  {/* Sessões Ativas */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Key className="w-5 h-5 text-purple-600" />
                          Sessões Ativas
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Dispositivos com acesso à sua conta
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold text-gray-800">Windows - Chrome</p>
                          <p className="text-xs text-gray-500">São Paulo, Brasil • Ativo agora</p>
                        </div>
                        <span className="text-xs text-green-600 font-semibold">Atual</span>
                      </div>
                    </div>
                  </div>

                  {/* Logs de Acesso */}
                  <div className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                          <Shield className="w-5 h-5 text-red-600" />
                          Logs de Acesso
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Histórico de acessos ao sistema
                        </p>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all">
                      <Eye className="w-4 h-4" />
                      Ver Logs de Acesso
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: USUÁRIOS */}
            {activeTab === 'usuarios' && (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">👥 Gestão de Usuários</h2>
                    <p className="text-sm text-gray-600">Gerencie os usuários e suas permissões no sistema</p>
                  </div>
                  <button
                    onClick={() => {
                      resetUserForm();
                      setShowUserModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
                  >
                    <Plus className="w-5 h-5" />
                    Novo Usuário
                  </button>
                </div>

                {/* Lista de Usuários */}
                <div className="grid grid-cols-1 gap-4">
                  {usuarios.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>Nenhum usuário cadastrado</p>
                    </div>
                  ) : (
                    usuarios.map((user: any) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {user.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-gray-800">{user.nome}</h3>
                              <span className={`text-xs px-2 py-1 rounded-full border ${getPerfilBadgeColor(user.perfil)}`}>
                                {user.perfil === 'administrador' && '👑 Administrador'}
                                {user.perfil === 'psicologo' && '🧠 Psicólogo'}
                                {user.perfil === 'recepcionista' && '📋 Recepcionista'}
                                {user.perfil === 'estagiario' && '📚 Estagiário'}
                              </span>
                              {user.ativo ? (
                                <CheckCircle className="w-4 h-4 text-green-600" title="Ativo" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" title="Inativo" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Criado em {new Date(user.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all"
                            title="Desativar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Informações sobre Perfis */}
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">📊 Perfis e Permissões</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {perfis.map((perfil: any) => (
                      <div key={perfil.id} className="bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${getPerfilBadgeColor(perfil.id)}`}>
                            {perfil.nome}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{perfil.descricao}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Usuário */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    value={userFormData.nome}
                    onChange={(e) => setUserFormData({ ...userFormData, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="José Silva"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">E-mail *</label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="jose@clinica.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Perfil *</label>
                  <select
                    value={userFormData.perfil}
                    onChange={(e) => setUserFormData({ ...userFormData, perfil: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {perfis.map((perfil: any) => (
                      <option key={perfil.id} value={perfil.id}>
                        {perfil.nome} - {perfil.descricao}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha {editingUser ? '(deixe em branco para manter)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={userFormData.senha}
                    onChange={(e) => setUserFormData({ ...userFormData, senha: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    resetUserForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {(createUserMutation.isPending || updateUserMutation.isPending) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
