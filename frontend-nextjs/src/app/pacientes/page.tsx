'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, FileText, User, Mail, Eye, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { pacientesService, avaliacoesService } from '@/services/api';
import PhoneInputWithValidation from '@/components/PhoneInputWithValidation';
import EmailInputWithValidation from '@/components/EmailInputWithValidation';
import LaudoInput from '@/components/LaudoInput';
import { formatPhoneDisplay, generateWhatsAppLink } from '@/utils/phoneUtils';
import Layout from '@/components/Layout';

interface Patient {
  id: string;
  nome: string;
  cpf: string;
  idade?: number;
  data_nascimento?: string;
  numero_laudo?: string;
  contexto?: string;
  tipo_transito?: string;
  escolaridade?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

interface Avaliacao {
  id: string;
  numero_laudo: string;
  data_aplicacao: string;
  aplicacao: string;
  tipo_habilitacao: string;
  observacoes?: string;
  aptidao?: string;
  created_at: string;
  paciente_nome: string;
  paciente_cpf: string;
  usuario_nome: string;
}

const PacientesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDetail, setShowPatientDetail] = useState(false);
  const [allowDuplicatePhone, setAllowDuplicatePhone] = useState(false);
  const [allowDuplicateEmail, setAllowDuplicateEmail] = useState(false);
  const [showNewAvaliacao, setShowNewAvaliacao] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    data_nascimento: '',
    numero_laudo: '',
    contexto: '',
    tipo_transito: '',
    escolaridade: '',
    telefone: '',
    email: '',
    endereco: '',
    observacoes: ''
  });
  const [avaliacaoData, setAvaliacaoData] = useState({
    numero_laudo: '',
    data_aplicacao: new Date().toISOString().split('T')[0],
    aplicacao: 'Individual',
    tipo_habilitacao: '1ª Habilitação',
    observacoes: '',
    aptidao: '',
    testes_selecionados: [] as string[]
  });
  const [showDeleteAvaliacaoConfirm, setShowDeleteAvaliacaoConfirm] = useState(false);
  const [avaliacaoToDelete, setAvaliacaoToDelete] = useState<Avaliacao | null>(null);

  const queryClient = useQueryClient();
  const router = useRouter();

  // Buscar pacientes
  const { data, isLoading, error } = useQuery({
    queryKey: ['pacientes', currentPage, searchTerm],
    queryFn: () => pacientesService.list({ 
      page: currentPage, 
      limit: 10, 
      search: searchTerm 
    }),
    placeholderData: (previousData) => previousData,
  });

  // Buscar avaliações do paciente selecionado
  const { data: avaliacoesData } = useQuery({
    queryKey: ['avaliacoes-paciente', selectedPatient?.id],
    queryFn: () => avaliacoesService.list({ 
      page: 1, 
      limit: 100, 
      search: selectedPatient?.nome || '' 
    }),
    enabled: !!selectedPatient,
  });

  const pacientes = (data as any)?.data?.data?.pacientes || [];
  const pagination = (data as any)?.data?.data?.pagination;
  const avaliacoes = (avaliacoesData as any)?.data?.data?.avaliacoes || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: pacientesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      toast.success('Paciente criado com sucesso!');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao criar paciente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pacientesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      toast.success('Paciente atualizado com sucesso!');
      resetForm();
      setShowEditModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar paciente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: pacientesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      toast.success('Paciente excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao excluir paciente');
    },
  });

  const createAvaliacaoMutation = useMutation({
    mutationFn: avaliacoesService.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes-paciente'] });
      toast.success('Avaliação criada com sucesso!');
      
      // Redirecionar para página de testes com dados vinculados E testes pré-selecionados
      const avaliacaoId = (response as any).data?.avaliacao?.id;
      if (avaliacaoId && selectedPatient) {
        const testesParam = avaliacaoData.testes_selecionados.length > 0 
          ? `&testes=${avaliacaoData.testes_selecionados.join(',')}` 
          : '';
        router.push(`/testes?avaliacao_id=${avaliacaoId}&paciente_id=${selectedPatient.id}&numero_laudo=${avaliacaoData.numero_laudo}${testesParam}`);
      } else {
        setShowNewAvaliacao(false);
        resetAvaliacaoForm();
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao criar avaliação');
    },
  });

  const deleteAvaliacaoMutation = useMutation({
    mutationFn: avaliacoesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes-paciente'] });
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      toast.success('Avaliação excluída com sucesso!');
      setShowDeleteAvaliacaoConfirm(false);
      setAvaliacaoToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao excluir avaliação');
    },
  });

  const calculateAge = (dataNascimento: string): number => {
    const today = new Date();
    const birthDate = new Date(dataNascimento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const abreviarEscolaridade = (escolaridade: string): string => {
    if (!escolaridade) return '-';
    const map: Record<string, string> = {
      'E. Fundamental': 'F',
      'E. Médio': 'M',
      'E. Superior': 'S',
      'Pós-Graduação': 'PG',
      'Não Escolarizado': 'NE'
    };
    return map[escolaridade] || escolaridade.substring(0, 2);
  };

  // Função para formatar CPF
  const formatCPF = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11);
    
    // Aplica a formatação: 000.000.000-00
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 6) {
      return `${limited.slice(0, 3)}.${limited.slice(3)}`;
    } else if (limited.length <= 9) {
      return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6)}`;
    } else {
      return `${limited.slice(0, 3)}.${limited.slice(3, 6)}.${limited.slice(6, 9)}-${limited.slice(9)}`;
    }
  };

  // Handler para CPF
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setFormData(prev => ({ ...prev, cpf: formatted }));
  };


  const resetForm = () => {
    setFormData({
      nome: '',
      cpf: '',
      data_nascimento: '',
      numero_laudo: '',
      contexto: '',
      tipo_transito: '',
      escolaridade: '',
      telefone: '',
      email: '',
      endereco: '',
      observacoes: ''
    });
    setEditingPatient(null);
    setAllowDuplicatePhone(false);
    setAllowDuplicateEmail(false);
  };

  const resetAvaliacaoForm = () => {
    setAvaliacaoData({
      numero_laudo: '',
      data_aplicacao: new Date().toISOString().split('T')[0],
      aplicacao: 'Individual',
      tipo_habilitacao: '1ª Habilitação',
      observacoes: '',
      testes_selecionados: []
    });
  };

  const handleEdit = (paciente: Patient) => {
    setEditingPatient(paciente);
    setFormData({
      nome: paciente.nome,
      cpf: paciente.cpf,
      data_nascimento: paciente.data_nascimento || '',
      numero_laudo: paciente.numero_laudo || '',
      contexto: paciente.contexto || '',
      tipo_transito: paciente.tipo_transito || '',
      escolaridade: paciente.escolaridade || '',
      telefone: paciente.telefone || '',
      email: paciente.email || '',
      endereco: paciente.endereco || '',
      observacoes: paciente.observacoes || ''
    });
    setShowEditModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      allow_duplicate_phone: allowDuplicatePhone,
      allow_duplicate_email: allowDuplicateEmail
    };
    
    if (editingPatient) {
      updateMutation.mutate({ id: editingPatient.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este paciente?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePatientClick = (paciente: Patient) => {
    setSelectedPatient(paciente);
    setShowPatientDetail(true);
    setShowNewAvaliacao(false);
  };

  const handleNewAvaliacao = () => {
    if (!selectedPatient) return;
    
    // Gerar número de laudo automaticamente baseado no ID do paciente
    const currentYear = new Date().getFullYear();
    const laudoNumber = `LAU-${currentYear}-${String(selectedPatient.id).padStart(4, '0')}`;
    
    // Determinar tipo de habilitação baseado no contexto do paciente
    let tipoHabilitacao = '1ª Habilitação';
    if (selectedPatient.contexto === 'Trânsito' && selectedPatient.tipo_transito) {
      tipoHabilitacao = selectedPatient.tipo_transito;
    }
    
    setAvaliacaoData(prev => ({
      ...prev,
      numero_laudo: laudoNumber,
      tipo_habilitacao: tipoHabilitacao
    }));
    
    setShowNewAvaliacao(true);
  };

  const handleDeleteAvaliacao = (avaliacao: Avaliacao) => {
    setAvaliacaoToDelete(avaliacao);
    setShowDeleteAvaliacaoConfirm(true);
  };

  const confirmDeleteAvaliacao = () => {
    if (avaliacaoToDelete) {
      deleteAvaliacaoMutation.mutate(avaliacaoToDelete.id);
    }
  };

  const handleAvaliacaoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      toast.error('Nenhum paciente selecionado');
      return;
    }
    
    // Remover o campo testes_selecionados do objeto enviado ao backend
    // O backend não espera esse campo no schema de validação
    const { testes_selecionados, ...avaliacaoDataWithoutTests } = avaliacaoData;
    
    const dataToSubmit = {
      ...avaliacaoDataWithoutTests,
      paciente_id: parseInt(selectedPatient.id),
      observacoes: avaliacaoData.observacoes || undefined
    };
    
    createAvaliacaoMutation.mutate(dataToSubmit);
  };

  const handleTestToggle = (testId: string) => {
    setAvaliacaoData(prev => ({
      ...prev,
      testes_selecionados: prev.testes_selecionados.includes(testId)
        ? prev.testes_selecionados.filter(id => id !== testId)
        : [...prev.testes_selecionados, testId]
    }));
  };

  const availableTests = [
    { id: 'mig', name: 'MIG - Memória Imediata Geral' },
    { id: 'memore', name: 'MEMORE - Memória de Reconhecimento' },
    { id: 'ac', name: 'AC - Atenção Concentrada' },
    { id: 'beta-iii', name: 'BETA-III - Bateria de Testes de Inteligência' },
    { id: 'bpa-2', name: 'BPA-2 - Bateria de Provas de Atenção' },
    { id: 'rotas', name: 'Rotas de Atenção' },
    { id: 'palografico', name: 'Palográfico' }
  ];

  if (isLoading) return <div className="flex justify-center items-center h-64">Carregando...</div>;
  if (error) return <div className="text-red-500">Erro ao carregar pacientes</div>;

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pacientes e Avaliações</h1>
          <p className="text-gray-600">Gerencie pacientes e suas avaliações psicológicas</p>
        </div>

      {/* Lista de Pacientes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar pacientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Paciente
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Paciente
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  CPF
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Idade
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contexto
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Esc
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contato
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Resultado
                </th>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pacientes.map((paciente: Patient) => (
                <tr 
                  key={paciente.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handlePatientClick(paciente)}
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900 max-w-[180px] truncate" title={paciente.nome}>
                      {paciente.nome}
                    </div>
                    <div className="text-xs text-gray-500">ID: {paciente.id}</div>
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900">
                    {paciente.cpf}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-900 text-center font-medium">
                    {paciente.data_nascimento ? calculateAge(paciente.data_nascimento) : '-'}
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm text-gray-900">{paciente.contexto || '-'}</div>
                    {paciente.tipo_transito && (
                      <div className="text-xs text-gray-500 truncate max-w-[120px]" title={paciente.tipo_transito}>
                        {paciente.tipo_transito.substring(0, 18)}{paciente.tipo_transito.length > 18 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-center">
                    <span 
                      className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded font-semibold text-xs"
                      title={paciente.escolaridade || 'Não informado'}
                    >
                      {abreviarEscolaridade(paciente.escolaridade)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {paciente.telefone && (
                      <a
                        href={generateWhatsAppLink(paciente.telefone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800 text-sm block"
                        title="WhatsApp"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {formatPhoneDisplay(paciente.telefone)}
                      </a>
                    )}
                    {paciente.email && (
                      <a
                        href={`mailto:${paciente.email}`}
                        className="text-blue-600 hover:text-blue-800 text-xs block truncate max-w-[140px]"
                        title={paciente.email}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {paciente.email}
                      </a>
                    )}
                    {!paciente.telefone && !paciente.email && '-'}
                  </td>
                  <td className="px-2 py-3 text-center">
                    {(paciente as any).ultima_aptidao ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                        (paciente as any).ultima_aptidao === 'Apto' 
                          ? 'bg-green-100 text-green-800'
                          : (paciente as any).ultima_aptidao === 'Inapto Temporário'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {(paciente as any).ultima_aptidao === 'Apto' && <CheckCircle className="h-3.5 w-3.5" />}
                        {(paciente as any).ultima_aptidao === 'Inapto Temporário' && <AlertCircle className="h-3.5 w-3.5" />}
                        {(paciente as any).ultima_aptidao === 'Inapto' && <XCircle className="h-3.5 w-3.5" />}
                        {(paciente as any).ultima_aptidao === 'Apto' ? 'Apto' : (paciente as any).ultima_aptidao === 'Inapto Temporário' ? 'Inap.T' : 'Inap.'}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-center">
                    <div className="flex justify-center items-center gap-1.5">
                      {(paciente as any).ultima_aptidao && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toast('📧 Funcionalidade de envio será implementada em breve', {
                              icon: '🚀',
                              duration: 3000
                            });
                          }}
                          className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all"
                          title="Enviar Resultado"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(paciente);
                        }}
                        className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(paciente.id);
                        }}
                        className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                        title="Deletar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {((currentPage - 1) * 10) + 1} a {Math.min(currentPage * 10, pagination.total)} de {pagination.total} resultados
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-sm">
                Página {currentPage} de {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Paciente */}
      {showPatientDetail && selectedPatient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalhes do Paciente: {selectedPatient.nome}
                </h3>
                <button
                  onClick={() => setShowPatientDetail(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Fechar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPatient.nome}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CPF</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPatient.cpf}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedPatient.data_nascimento ? 
                        `${new Date(selectedPatient.data_nascimento).toLocaleDateString('pt-BR')} (${calculateAge(selectedPatient.data_nascimento)} anos)` 
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contexto</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPatient.contexto || '-'}</p>
                    {selectedPatient.tipo_transito && (
                      <p className="mt-1 text-sm text-gray-600">{selectedPatient.tipo_transito}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Escolaridade</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPatient.escolaridade || '-'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefone</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedPatient.telefone ? (
                        <a
                          href={generateWhatsAppLink(selectedPatient.telefone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 hover:underline"
                        >
                          {formatPhoneDisplay(selectedPatient.telefone)}
                        </a>
                      ) : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">E-mail</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPatient.email || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Endereço</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPatient.endereco || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número do Laudo</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPatient.numero_laudo || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Observações</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPatient.observacoes || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Avaliações do Paciente */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-medium text-gray-900">Avaliações Realizadas</h4>
                  <button
                    onClick={handleNewAvaliacao}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Nova Avaliação
                  </button>
                </div>

                {avaliacoes.length > 0 ? (
                  <div className="space-y-2">
                    {avaliacoes.map((avaliacao: Avaliacao) => (
                      <div key={avaliacao.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{avaliacao.numero_laudo}</h5>
                            <p className="text-sm text-gray-600">
                              {new Date(avaliacao.data_aplicacao).toLocaleDateString('pt-BR')} - {avaliacao.aplicacao}
                            </p>
                            <p className="text-sm text-gray-600">{avaliacao.tipo_habilitacao}</p>
                            {avaliacao.aptidao && (
                              <p className={`text-sm font-medium mt-1 ${
                                avaliacao.aptidao === 'Apto' ? 'text-green-600' :
                                avaliacao.aptidao === 'Inapto Temporário' ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {avaliacao.aptidao === 'Apto' && '✅ '}
                                {avaliacao.aptidao === 'Inapto Temporário' && '⚠️ '}
                                {avaliacao.aptidao === 'Inapto' && '❌ '}
                                {avaliacao.aptidao}
                              </p>
                            )}
                            {avaliacao.observacoes && (
                              <p className="text-sm text-gray-500 mt-1">{avaliacao.observacoes}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-xs text-gray-400">
                              {new Date(avaliacao.created_at).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => router.push(`/avaliacoes/${avaliacao.id}`)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                                title="Ver resultados"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Ver Resultados
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAvaliacao(avaliacao);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                                title="Excluir avaliação"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma avaliação realizada ainda</p>
                    <p className="text-sm">Clique em &quot;Nova Avaliação&quot; para começar</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPatientDetail(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    handleEdit(selectedPatient);
                    setShowPatientDetail(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Editar Paciente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Avaliação */}
      {showNewAvaliacao && selectedPatient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Nova Avaliação - {selectedPatient.nome}
                </h3>
                <button
                  onClick={() => setShowNewAvaliacao(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Fechar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAvaliacaoSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número do Laudo</label>
                    <input
                      type="text"
                      value={avaliacaoData.numero_laudo}
                      onChange={(e) => setAvaliacaoData(prev => ({ ...prev, numero_laudo: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Aplicação</label>
                    <input
                      type="date"
                      value={avaliacaoData.data_aplicacao}
                      onChange={(e) => setAvaliacaoData(prev => ({ ...prev, data_aplicacao: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Aplicação</label>
                    <select
                      value={avaliacaoData.aplicacao}
                      onChange={(e) => setAvaliacaoData(prev => ({ ...prev, aplicacao: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Individual">Individual</option>
                      <option value="Coletiva">Coletiva</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Habilitação</label>
                    <select
                      value={avaliacaoData.tipo_habilitacao}
                      onChange={(e) => setAvaliacaoData(prev => ({ ...prev, tipo_habilitacao: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="1ª Habilitação">1ª Habilitação</option>
                      <option value="Renovação">Renovação</option>
                      <option value="Adição/Mudança de Categoria">Adição/Mudança de Categoria</option>
                      <option value="Curso Escolar">Curso Escolar</option>
                      <option value="Instrutor">Instrutor</option>
                      <option value="Segunda via">Segunda via</option>
                      <option value="Reincidente">Reincidente</option>
                      <option value="EAR - Exerce Atividade Remunerada">EAR - Exerce Atividade Remunerada</option>
                      <option value="Cassação">Cassação</option>
                      <option value="Reg. Estrangeiro">Reg. Estrangeiro</option>
                      <option value="Psicológica">Psicológica</option>
                    </select>
                  </div>
                </div>

                {/* Aptidão (para contexto de Trânsito) */}
                {selectedPatient?.contexto === 'Trânsito' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Observação de Aptidão</label>
                    <select
                      value={avaliacaoData.aptidao}
                      onChange={(e) => setAvaliacaoData(prev => ({ ...prev, aptidao: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sem observação</option>
                      <option value="Apto">Apto</option>
                      <option value="Inapto Temporário">Inapto Temporário</option>
                      <option value="Inapto">Inapto</option>
                    </select>
                  </div>
                )}

                {/* Seleção de Testes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Testes a Aplicar</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {availableTests.map((test) => (
                      <label key={test.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={avaliacaoData.testes_selecionados.includes(test.id)}
                          onChange={() => handleTestToggle(test.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{test.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <textarea
                    value={avaliacaoData.observacoes}
                    onChange={(e) => setAvaliacaoData(prev => ({ ...prev, observacoes: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Observações sobre a avaliação..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewAvaliacao(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createAvaliacaoMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {createAvaliacaoMutation.isPending ? 'Criando...' : 'Criar Avaliação'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição/Criação de Paciente */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingPatient ? 'Editar Paciente' : 'Novo Paciente'}
                </h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Fechar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome Completo *</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CPF *</label>
                    <input
                      type="text"
                      value={formData.cpf}
                      onChange={handleCPFChange}
                      placeholder="000.000.000-00"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                    <input
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_nascimento: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número do Laudo</label>
                    <LaudoInput
                      value={formData.numero_laudo}
                      onChange={(value) => setFormData(prev => ({ ...prev, numero_laudo: value }))}
                      placeholder="Digite 4 números (ex: 1234)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Digite exatamente 4 números (ex: 1234). Será completado com zeros automaticamente se necessário. O formato LAU-{new Date().getFullYear()}-XXXX será aplicado automaticamente.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contexto</label>
                    <select
                      value={formData.contexto}
                      onChange={(e) => setFormData(prev => ({ ...prev, contexto: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione o contexto</option>
                      <option value="Clínico">Clínico</option>
                      <option value="Organizacional">Organizacional</option>
                      <option value="Trânsito">Trânsito</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Escolaridade *</label>
                    <select
                      value={formData.escolaridade}
                      onChange={(e) => setFormData(prev => ({ ...prev, escolaridade: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecione a escolaridade</option>
                      <option value="E. Fundamental">E. Fundamental</option>
                      <option value="E. Médio">E. Médio</option>
                      <option value="E. Superior">E. Superior</option>
                      <option value="Pós-Graduação">Pós-Graduação</option>
                      <option value="Não Escolarizado">Não Escolarizado</option>
                    </select>
                  </div>
                </div>

                {formData.contexto === 'Trânsito' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Trânsito</label>
                    <select
                      value={formData.tipo_transito}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo_transito: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="1ª Habilitação">1ª Habilitação</option>
                      <option value="Renovação">Renovação</option>
                      <option value="Adição/Mudança de Categoria">Adição/Mudança de Categoria</option>
                      <option value="Curso Escolar">Curso Escolar</option>
                      <option value="Instrutor">Instrutor</option>
                      <option value="Segunda via">Segunda via</option>
                      <option value="Reincidente">Reincidente</option>
                      <option value="EAR - Exerce Atividade Remunerada">EAR - Exerce Atividade Remunerada</option>
                      <option value="Cassação">Cassação</option>
                      <option value="Reg. Estrangeiro">Reg. Estrangeiro</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefone</label>
                    <PhoneInputWithValidation
                      value={formData.telefone}
                      onChange={(value) => setFormData(prev => ({ ...prev, telefone: value }))}
                      onDuplicateConfirm={(confirmed) => setAllowDuplicatePhone(confirmed)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">E-mail</label>
                    <EmailInputWithValidation
                      value={formData.email}
                      onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
                      onDuplicateConfirm={(confirmed) => setAllowDuplicateEmail(confirmed)}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Endereço</label>
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Observações sobre o paciente..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {createMutation.isPending || updateMutation.isPending 
                      ? (editingPatient ? 'Atualizando...' : 'Criando...') 
                      : (editingPatient ? 'Atualizar' : 'Criar')
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Avaliação */}
      {showDeleteAvaliacaoConfirm && avaliacaoToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir a avaliação <strong>{avaliacaoToDelete.numero_laudo}</strong>?
              <br /><br />
              <span className="text-sm text-gray-500">
                Data: {new Date(avaliacaoToDelete.data_aplicacao).toLocaleDateString('pt-BR')}
                <br />
                Tipo: {avaliacaoToDelete.tipo_habilitacao}
              </span>
              <br /><br />
              <strong className="text-red-600">Esta ação não pode ser desfeita.</strong>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteAvaliacaoConfirm(false);
                  setAvaliacaoToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteAvaliacao}
                disabled={deleteAvaliacaoMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {deleteAvaliacaoMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Excluir
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
};

export default PacientesPage;