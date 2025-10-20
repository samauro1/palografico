'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, FileText, User, Mail, Eye, Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { pacientesService, avaliacoesService } from '@/services/api';
import PhoneInputWithValidation from '@/components/PhoneInputWithValidation';
import EmailInputWithValidation from '@/components/EmailInputWithValidation';
import LaudoInput from '@/components/LaudoInput';
import { formatPhoneDisplay, generateWhatsAppLink } from '@/utils/phoneUtils';
import { formatDateToBrazilian, calculateAge } from '@/utils/dateUtils';
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
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [showDeleteTesteConfirm, setShowDeleteTesteConfirm] = useState(false);
  const [testeToDelete, setTesteToDelete] = useState<any>(null);
  const [expandedLaudo, setExpandedLaudo] = useState<string | null>(null);
  const [expandedLaudos, setExpandedLaudos] = useState<Set<string>>(new Set());
  const [testesData, setTestesData] = useState<any>({});

  const queryClient = useQueryClient();

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
    queryFn: () => {
      return avaliacoesService.list({ 
      page: 1, 
      limit: 100, 
        paciente_id: selectedPatient?.id 
      });
    },
    enabled: !!selectedPatient,
  });

  const pacientes = (data as any)?.data?.data?.pacientes || [];
  const pagination = (data as any)?.data?.data?.pagination;
  const avaliacoes = (avaliacoesData as any)?.data?.data?.avaliacoes || [];

  // useEffect para abrir modal automaticamente se houver ID na URL
  React.useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam && !showPatientDetail) {
      const pacienteId = parseInt(idParam);
      
      // Tentar buscar no cache primeiro
      let paciente = pacientes.find((p: Patient) => p.id === pacienteId);
      
      if (paciente) {
        console.log('✅ Paciente encontrado no cache, abrindo modal...', paciente);
        setSelectedPatient(paciente);
        setShowPatientDetail(true);
        // Limpar o parâmetro da URL após abrir o modal
        setTimeout(() => router.replace('/pacientes'), 100);
      } else if (!isLoading) {
        // Se não estiver no cache e os dados já carregaram, buscar da API
        console.log('🔍 Paciente não encontrado no cache, buscando da API...', pacienteId);
        pacientesService.get(pacienteId.toString()).then((response: any) => {
          console.log('📦 Resposta completa da API:', response);
          console.log('📦 response.data:', response?.data);
          console.log('📦 response.data.data:', response?.data?.data);
          
          // Tentar ambas as estruturas possíveis
          const pacienteData = response?.data?.data || response?.data;
          
          if (pacienteData && pacienteData.id) {
            console.log('✅ Paciente encontrado na API, abrindo modal...', pacienteData);
            setSelectedPatient(pacienteData);
            setShowPatientDetail(true);
            setTimeout(() => router.replace('/pacientes'), 100);
          } else {
            console.error('❌ Paciente não encontrado - response:', response);
            toast.error('Avaliado não encontrado');
            router.replace('/pacientes');
          }
        }).catch((error: any) => {
          console.error('❌ Erro ao buscar paciente:', error);
          console.error('❌ Detalhes do erro:', error.response?.data);
          toast.error('Erro ao carregar detalhes do avaliado');
          router.replace('/pacientes');
        });
      }
    }
  }, [searchParams, pacientes, isLoading, showPatientDetail, router]);
  
  // Agrupar avaliações por número de laudo (não por data)
  // Múltiplas avaliações com mesmo laudo = mesma avaliação aplicada em datas diferentes
  const avaliacoesAgrupadas = avaliacoes.reduce((grupos: any, avaliacao: Avaliacao) => {
    const laudo = avaliacao.numero_laudo;
    if (!grupos[laudo]) {
      grupos[laudo] = [];
    }
    grupos[laudo].push(avaliacao);
    return grupos;
  }, {});

  // Mutations
  const createMutation = useMutation({
    mutationFn: pacientesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      toast.success('Avaliado criado com sucesso!');
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao criar avaliado');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pacientesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      toast.success('Avaliado atualizado com sucesso!');
      resetForm();
      setShowEditModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar avaliado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: pacientesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      toast.success('Avaliado excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao excluir avaliado');
    },
  });

  const createAvaliacaoMutation = useMutation({
    mutationFn: avaliacoesService.create,
    onSuccess: async (response) => {
      // Invalidar e forçar refetch imediato
      await queryClient.invalidateQueries({ queryKey: ['avaliacoes-paciente'] });
      await queryClient.refetchQueries({ queryKey: ['avaliacoes-paciente'] });
      await queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      await queryClient.refetchQueries({ queryKey: ['pacientes'] });
      toast.success('Avaliação criada com sucesso!');
      
      // Limpar cache de testes para forçar recarregamento
      setTestesData({});
      
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
    onSuccess: async () => {
      // Invalidar e forçar refetch imediato de todas as queries relacionadas
      await queryClient.invalidateQueries({ queryKey: ['avaliacoes-paciente'] });
      await queryClient.refetchQueries({ queryKey: ['avaliacoes-paciente'] });
      await queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      await queryClient.refetchQueries({ queryKey: ['pacientes'] });
      toast.success('Avaliação excluída com sucesso!');
      setShowDeleteAvaliacaoConfirm(false);
      setAvaliacaoToDelete(null);
      // Limpar também o cache de testes
      setTestesData({});
      setExpandedLaudo(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao excluir avaliação');
    },
  });

  // Mutation para deletar teste individual
  const deleteTesteMutation = useMutation({
    mutationFn: async (teste: any) => {
      // TODO: Implementar API para deletar teste individual
      // Por enquanto, vamos simular
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avaliacoes-paciente'] });
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      setShowDeleteTesteConfirm(false);
      setTesteToDelete(null);
      toast.success('Resultado do teste excluído com sucesso!');
      
      // Recarregar testes do laudo atual
      if (expandedLaudo) {
        const laudoAtual = expandedLaudo;
        setExpandedLaudo(null);
        setTimeout(() => {
          handleToggleLaudo(laudoAtual);
        }, 100);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao excluir resultado do teste');
    },
  });

  const updateAptidaoMutation = useMutation({
    mutationFn: ({ id, aptidao }: { id: string; aptidao: string }) => 
      avaliacoesService.update(id, { aptidao }),
    onSuccess: async () => {
      // Invalidar e forçar refetch imediato de todas as queries relacionadas
      await queryClient.invalidateQueries({ queryKey: ['avaliacoes-paciente'] });
      await queryClient.refetchQueries({ queryKey: ['avaliacoes-paciente'] });
      await queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      await queryClient.refetchQueries({ queryKey: ['pacientes'] });
      toast.success('Aptidão atualizada com sucesso!');
      
      // Se há um laudo expandido, recarregar os testes
      if (expandedLaudo) {
        const laudoAtual = expandedLaudo;
        setExpandedLaudo(null);
        setTimeout(() => {
          handleToggleLaudo(laudoAtual);
        }, 100);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erro ao atualizar aptidão');
    },
  });

  // Função calculateAge agora vem do dateUtils

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
    
    // Converter data_nascimento para formato YYYY-MM-DD do input type="date"
    let dataNascimentoFormatada = '';
    if (paciente.data_nascimento) {
      const date = new Date(paciente.data_nascimento);
      // Garantir que a data seja válida
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dataNascimentoFormatada = `${year}-${month}-${day}`;
      }
    }
    
    setFormData({
      nome: paciente.nome,
      cpf: paciente.cpf,
      data_nascimento: dataNascimentoFormatada,
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
    if (window.confirm('Tem certeza que deseja excluir este avaliado?')) {
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
    const laudoNumber = selectedPatient.numero_laudo || `LAU-${currentYear}-${String(selectedPatient.id).padStart(4, '0')}`;
    
    // Redirecionar para página de testes com dados pré-preenchidos
    router.push(`/testes?paciente_id=${selectedPatient.id}&numero_laudo=${encodeURIComponent(laudoNumber)}`);
  };

  const handleDeleteAvaliacao = (avaliacao: Avaliacao) => {
    setAvaliacaoToDelete(avaliacao);
    setShowDeleteAvaliacaoConfirm(true);
  };

  const handleDeleteTeste = (teste: any) => {
    setTesteToDelete(teste);
    setShowDeleteTesteConfirm(true);
  };

  const handleToggleLaudo = async (laudo: string) => {
    const isCurrentlyExpanded = expandedLaudos.has(laudo);
    
    if (isCurrentlyExpanded) {
      // Recolher
      const newExpanded = new Set(expandedLaudos);
      newExpanded.delete(laudo);
      setExpandedLaudos(newExpanded);
    } else {
      // Expandir
      const newExpanded = new Set(expandedLaudos);
      newExpanded.add(laudo);
      setExpandedLaudos(newExpanded);
      
      // SEMPRE buscar testes novamente (não usar cache) para pegar atualizações
      const avaliacoesDoLaudo = avaliacoesAgrupadas[laudo];
      const todosOsTestes: any[] = [];
      
      try {
        for (const avaliacao of avaliacoesDoLaudo) {
          try {
            const response = await avaliacoesService.getTestes(avaliacao.id);
            const testes = (response as any)?.data?.data?.testes || [];
            
            testes.forEach((teste: any) => {
              todosOsTestes.push({
                ...teste,
                avaliacaoId: avaliacao.id,
                numeroLaudo: avaliacao.numero_laudo,
                dataAplicacao: avaliacao.data_aplicacao
              });
            });
          } catch (error: any) {
            console.error(`Erro ao buscar testes da avaliação ${avaliacao.numero_laudo}:`, error);
            // Se der erro em uma avaliação, continua com as outras
            if (error.response?.status !== 404) {
              // Se não for 404, pode ser um problema real
              console.warn('Erro ao buscar testes, mas continuando:', error.message);
            }
          }
        }
        
        // Atualizar o cache de testes
        setTestesData((prev: any) => ({
          ...prev,
          [laudo]: todosOsTestes
        }));
        
        if (todosOsTestes.length === 0) {
          toast('ℹ️ Nenhum teste encontrado para este laudo', {
            duration: 3000,
            icon: 'ℹ️'
          });
        }
      } catch (error) {
        console.error('Erro ao buscar testes:', error);
        toast.error('Erro ao carregar testes');
      }
    }
  };

  const confirmDeleteAvaliacao = () => {
    if (avaliacaoToDelete) {
      deleteAvaliacaoMutation.mutate(avaliacaoToDelete.id);
    }
  };

  const handleVerTodas = async () => {
    const todosLaudos = Object.keys(avaliacoesAgrupadas);
    
    // Se todos já estão expandidos, recolher todos
    const todosExpandidos = todosLaudos.every(laudo => expandedLaudos.has(laudo));
    
    if (todosExpandidos) {
      setExpandedLaudos(new Set());
      toast('Todas as avaliações foram recolhidas', { icon: '📋', duration: 2000 });
    } else {
      // Expandir todos de uma vez
      toast('⏳ Carregando todas as avaliações...', { icon: '⏳', duration: 2000 });
      
      // Criar um novo Set com todos os laudos
      const novosExpandidos = new Set(expandedLaudos);
      
      // Adicionar todos os laudos ao Set
      todosLaudos.forEach(laudo => novosExpandidos.add(laudo));
      setExpandedLaudos(novosExpandidos);
      
      // Buscar testes de todos os laudos que não foram buscados ainda
      for (const laudo of todosLaudos) {
        if (!testesData[laudo]) {
          const avaliacoesDoLaudo = avaliacoesAgrupadas[laudo];
          const todosOsTestes: any[] = [];
          
          try {
            for (const avaliacao of avaliacoesDoLaudo) {
              try {
                const response = await avaliacoesService.getTestes(avaliacao.id);
                const testes = (response as any)?.data?.data?.testes || [];
                
                testes.forEach((teste: any) => {
                  todosOsTestes.push({
                    ...teste,
                    avaliacaoId: avaliacao.id,
                    numeroLaudo: avaliacao.numero_laudo,
                    dataAplicacao: avaliacao.data_aplicacao
                  });
                });
              } catch (error: any) {
                console.error(`Erro ao buscar testes da avaliação ${avaliacao.numero_laudo}:`, error);
              }
            }
            
            setTestesData((prev: any) => ({
              ...prev,
              [laudo]: todosOsTestes
            }));
          } catch (error) {
            console.error('Erro ao buscar testes:', error);
          }
        }
      }
      
      toast.success('✅ Todas as avaliações foram expandidas!');
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
    { id: 'ac', name: 'AC - Atenção Concentrada' },
    { id: 'beta-iii', name: 'BETA-III - Raciocínio Matricial' },
    { id: 'bpa2', name: 'BPA-2 - Bateria Psicológica para Avaliação da Atenção' },
    { id: 'rotas', name: 'Rotas de Atenção' },
    { id: 'memore', name: 'MEMORE - Memória de Reconhecimento' },
    { id: 'mig', name: 'MIG - Memória Imediata Geral' },
    { id: 'mvt', name: 'MVT - Memória Visual para o Trânsito' },
    { id: 'r1', name: 'R-1 - Teste Não-Verbal de Inteligência' },
    { id: 'palografico', name: 'Palográfico' }
  ];

  if (isLoading) return <div className="flex justify-center items-center h-64">Carregando...</div>;
  if (error) return <div className="text-red-500">Erro ao carregar pacientes</div>;

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Avaliados e Avaliações</h1>
          <p className="text-gray-600">Gerencie avaliados e suas avaliações psicológicas</p>
        </div>

      {/* Lista de Avaliados */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar avaliados..."
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
              Novo Avaliado
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Avaliado
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
                    <div className="text-xs text-gray-500">
                      {paciente.numero_laudo || `ID: ${paciente.id}`}
                    </div>
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
                        className="text-green-600 hover:text-green-800 text-sm block whitespace-pre-line"
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

      {/* Modal de Detalhes do Avaliado */}
      {showPatientDetail && selectedPatient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalhes do Avaliado: {selectedPatient.nome}
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
                        `${formatDateToBrazilian(selectedPatient.data_nascimento)} (${calculateAge(selectedPatient.data_nascimento)} anos)` 
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
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
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

              {/* Avaliações do Avaliado */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-medium text-gray-900">Avaliações Realizadas</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={handleVerTodas}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {Object.keys(avaliacoesAgrupadas).every(laudo => expandedLaudos.has(laudo)) && Object.keys(avaliacoesAgrupadas).length > 0 ? 'Recolher Todas' : 'Ver Todas'}
                    </button>
                  <button
                    onClick={handleNewAvaliacao}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Nova Avaliação
                  </button>
                  </div>
                </div>

                {Object.keys(avaliacoesAgrupadas).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(avaliacoesAgrupadas).map(([laudo, avaliacoesArray]: [string, any]) => {
                      const avaliacoesDoLaudo = avaliacoesArray as Avaliacao[];
                      const isExpanded = expandedLaudos.has(laudo);
                      const testes = testesData[laudo] || [];
                      
                      // Pegar todas as datas únicas das avaliações deste laudo
                      const datas = [...new Set(avaliacoesDoLaudo.map(av => 
                        formatDateToBrazilian(av.data_aplicacao)
                      ))];
                      
                      // Pegar a última aptidão definida
                      const ultimaAptidao = avaliacoesDoLaudo.find(av => av.aptidao)?.aptidao;
                      
                      return (
                        <div key={laudo} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Cabeçalho do laudo */}
                          <div className="bg-blue-50 p-4">
                            <div className="flex justify-between items-center">
                          <div className="flex-1">
                                <h5 className="font-semibold text-gray-900 text-lg mb-2">📋 {laudo}</h5>
                                <div className="flex flex-wrap gap-2 items-center">
                                  <span className="text-sm text-gray-600">
                                    📅 Datas: {datas.join(', ')}
                                  </span>
                                  {ultimaAptidao && (
                                    <span className={`inline-flex items-center px-3 py-1 bg-white rounded-full text-sm font-medium ${
                                      ultimaAptidao === 'Apto' ? 'text-green-600' :
                                      ultimaAptidao === 'Inapto Temporário' ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                      {ultimaAptidao === 'Apto' && '✅ '}
                                      {ultimaAptidao === 'Inapto Temporário' && '⚠️ '}
                                      {ultimaAptidao === 'Inapto' && '❌ '}
                                      {ultimaAptidao}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleToggleLaudo(laudo)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm ml-4"
                              >
                                <Eye className="h-4 w-4" />
                                {isExpanded ? 'Ocultar Resultados' : 'Ver Resultados'}
                              </button>
                            </div>
                          </div>

                          {/* Resultados expandidos */}
                          {isExpanded && (
                            <div className="p-4 bg-white">
                              {testes.length > 0 ? (
                                <div className="space-y-4">
                                  {testes.map((teste: any, index: number) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                      <h6 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                        <span className="text-blue-600">🧪</span>
                                        {teste.nome}
                                        <span className="text-sm text-gray-500 font-normal">
                                          - {teste.created_at ? 
                                            new Date(teste.created_at).toLocaleString('pt-BR', {
                                              day: '2-digit',
                                              month: '2-digit', 
                                              year: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                              timeZone: 'America/Sao_Paulo'
                                            }) : 
                                            formatDateToBrazilian(teste.dataAplicacao)
                                          }
                                        </span>
                                        <button
                                          onClick={() => handleDeleteTeste(teste)}
                                          className="ml-auto text-red-500 hover:text-red-700 p-1"
                                          title="Excluir este resultado"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </h6>
                                      
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {/* AC */}
                                        {teste.tipo === 'ac' && (
                                          <>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Acertos</p>
                                              <p className="text-lg font-semibold text-green-600">{teste.resultado.acertos}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Percentil</p>
                                              <p className="text-lg font-semibold text-blue-600">{teste.resultado.percentil}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Classificação</p>
                                              <p className="text-lg font-semibold text-purple-600">{teste.resultado.classificacao}</p>
                                            </div>
                                            {teste.tabela_normativa && (
                                              <div className="col-span-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <p className="text-xs text-blue-800">
                                                  <strong>📊 Tabela:</strong> {teste.tabela_normativa}
                                                </p>
                                              </div>
                                            )}
                                          </>
                                        )}

                                        {/* MIG */}
                                        {teste.tipo === 'mig' && (
                                          <>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Acertos</p>
                                              <p className="text-lg font-semibold text-green-600">{teste.resultado.acertos}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Percentil</p>
                                              <p className="text-lg font-semibold text-blue-600">{teste.resultado.percentil}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">QI</p>
                                              <p className="text-lg font-semibold text-indigo-600">{teste.resultado.qi}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Classificação</p>
                                              <p className="text-lg font-semibold text-purple-600">{teste.resultado.classificacao}</p>
                                            </div>
                                            {teste.tabela_normativa && (
                                              <div className="col-span-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <p className="text-xs text-blue-800">
                                                  <strong>📊 Tabela:</strong> {teste.tabela_normativa}
                                                </p>
                                              </div>
                                            )}
                                          </>
                                        )}

                                        {/* MEMORE */}
                                        {teste.tipo === 'memore' && (
                                          <>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Acertos</p>
                                              <p className="text-lg font-semibold text-green-600">{teste.resultado.acertos}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Erros</p>
                                              <p className="text-lg font-semibold text-red-600">{teste.resultado.erros}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Percentil</p>
                                              <p className="text-lg font-semibold text-blue-600">{teste.resultado.percentil}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Classificação</p>
                                              <p className="text-lg font-semibold text-purple-600">{teste.resultado.classificacao}</p>
                                            </div>
                                            {teste.tabela_normativa && (
                                              <div className="col-span-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <p className="text-xs text-blue-800">
                                                  <strong>📊 Tabela:</strong> {teste.tabela_normativa}
                                                </p>
                                              </div>
                                            )}
                                          </>
                                        )}

                                        {/* BPA-2 */}
                                        {teste.tipo === 'bpa2' && (
                                          <>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Acertos</p>
                                              <p className="text-lg font-semibold text-green-600">{teste.resultado.acertos}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Erros</p>
                                              <p className="text-lg font-semibold text-red-600">{teste.resultado.erros}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Percentil</p>
                                              <p className="text-lg font-semibold text-blue-600">{teste.resultado.percentil}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Classificação</p>
                                              <p className="text-lg font-semibold text-purple-600">{teste.resultado.classificacao}</p>
                                            </div>
                                            {teste.tabela_normativa && (
                                              <div className="col-span-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <p className="text-xs text-blue-800">
                                                  <strong>📊 Tabela:</strong> {teste.tabela_normativa}
                                                </p>
                                              </div>
                                            )}
                                          </>
                                        )}

                                        {/* R-1 */}
                                        {teste.tipo === 'r1' && (
                                          <>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Acertos</p>
                                              <p className="text-lg font-semibold text-green-600">{teste.resultado.acertos}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Percentil</p>
                                              <p className="text-lg font-semibold text-blue-600">{teste.resultado.percentil}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">QI</p>
                                              <p className="text-lg font-semibold text-indigo-600">{teste.resultado.qi}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Classificação</p>
                                              <p className="text-lg font-semibold text-purple-600">{teste.resultado.classificacao}</p>
                                            </div>
                                            {teste.tabela_normativa && (
                                              <div className="col-span-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <p className="text-xs text-blue-800">
                                                  <strong>📊 Tabela:</strong> {teste.tabela_normativa}
                                                </p>
                                              </div>
                                            )}
                                          </>
                                        )}

                                        {/* MVT */}
                                        {teste.tipo === 'mvt' && (
                                          <>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Acertos</p>
                                              <p className="text-lg font-semibold text-green-600">{teste.resultado.acertos}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Erros</p>
                                              <p className="text-lg font-semibold text-red-600">{teste.resultado.erros}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Percentil</p>
                                              <p className="text-lg font-semibold text-blue-600">{teste.resultado.percentil}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Classificação</p>
                                              <p className="text-lg font-semibold text-purple-600">{teste.resultado.classificacao}</p>
                                            </div>
                                            {teste.tabela_normativa && (
                                              <div className="col-span-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <p className="text-xs text-blue-800">
                                                  <strong>📊 Tabela:</strong> {teste.tabela_normativa}
                                                </p>
                                              </div>
                                            )}
                                          </>
                                        )}

                                        {/* PALOGRÁFICO */}
                                        {teste.tipo === 'palografico' && (
                                          <>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Acertos</p>
                                              <p className="text-lg font-semibold text-green-600">{teste.resultado.acertos}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Erros</p>
                                              <p className="text-lg font-semibold text-red-600">{teste.resultado.erros}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Percentil</p>
                                              <p className="text-lg font-semibold text-blue-600">{teste.resultado.percentil}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Classificação</p>
                                              <p className="text-lg font-semibold text-purple-600">{teste.resultado.classificacao}</p>
                                            </div>
                                            {teste.tabela_normativa && (
                                              <div className="col-span-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <p className="text-xs text-blue-800">
                                                  <strong>📊 Tabela:</strong> {teste.tabela_normativa}
                                                </p>
                                              </div>
                                            )}
                                          </>
                                        )}

                                        {/* BETA-III */}
                                        {teste.tipo === 'beta-iii' && (
                                          <>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Acertos</p>
                                              <p className="text-lg font-semibold text-green-600">{teste.resultado.acertos}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Percentil</p>
                                              <p className="text-lg font-semibold text-blue-600">{teste.resultado.percentil}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-md">
                                              <p className="text-xs text-gray-500">Classificação</p>
                                              <p className="text-lg font-semibold text-purple-600">{teste.resultado.classificacao}</p>
                                            </div>
                                            {teste.tabela_normativa && (
                                              <div className="col-span-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <p className="text-xs text-blue-800">
                                                  <strong>📊 Tabela:</strong> {teste.tabela_normativa}
                                                </p>
                                              </div>
                                            )}
                                          </>
                                        )}

                                        {/* ROTAS - Array de resultados (A, C, D) */}
                                        {teste.tipo === 'rotas' && Array.isArray(teste.resultado) && (
                                          <div className="col-span-3 space-y-3">
                                            {teste.resultado.map((rota: any, idx: number) => (
                                              <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <h5 className="font-semibold text-gray-800 mb-3">
                                                  Atenção {rota.rota_tipo === 'A' ? 'Alternada' : rota.rota_tipo === 'C' ? 'Concentrada' : 'Dividida'} ({rota.rota_tipo})
                                                </h5>
                                                <div className="grid grid-cols-3 gap-3">
                                                  <div className="bg-white p-2 rounded-md">
                                                    <p className="text-xs text-gray-500">Acertos</p>
                                                    <p className="text-sm font-semibold text-green-600">{rota.acertos}</p>
                                                  </div>
                                                  <div className="bg-white p-2 rounded-md">
                                                    <p className="text-xs text-gray-500">Erros</p>
                                                    <p className="text-sm font-semibold text-red-600">{rota.erros}</p>
                                                  </div>
                                                  <div className="bg-white p-2 rounded-md">
                                                    <p className="text-xs text-gray-500">Omissões</p>
                                                    <p className="text-sm font-semibold text-orange-600">{rota.omissoes}</p>
                                                  </div>
                                                  <div className="bg-white p-2 rounded-md">
                                                    <p className="text-xs text-gray-500">PB</p>
                                                    <p className="text-sm font-semibold text-indigo-600">{rota.pb}</p>
                                                  </div>
                                                  <div className="bg-white p-2 rounded-md">
                                                    <p className="text-xs text-gray-500">Percentil</p>
                                                    <p className="text-sm font-semibold text-blue-600">{rota.percentil || '-'}</p>
                                                  </div>
                                                  <div className="bg-white p-2 rounded-md">
                                                    <p className="text-xs text-gray-500">Classificação</p>
                                                    <p className="text-sm font-semibold text-purple-600">{rota.classificacao || '-'}</p>
                                                  </div>
                                                </div>
                                              </div>
                                            ))}
                                            
                                            {/* Tabela Normativa Usada */}
                                            {teste.tabela_normativa && (
                                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                                                <p className="text-xs text-blue-800">
                                                  <strong>📊 Tabela Normativa:</strong> {teste.tabela_normativa}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* Outros testes - mostrar campos disponíveis */}
                                        {!['ac', 'mig', 'beta-iii', 'rotas'].includes(teste.tipo) && (
                                          <>
                                            {Object.entries(teste.resultado).map(([key, value]: [string, any]) => {
                                              if (['id', 'avaliacao_id', 'created_at', 'updated_at', 'tabela_normativa_id', 'tabela_normativa_nome'].includes(key)) return null;
                                              
                                              // Se o valor for um objeto, converter para string legível
                                              let displayValue = value;
                                              if (typeof value === 'object' && value !== null) {
                                                displayValue = JSON.stringify(value, null, 2);
                                              }
                                              
                                              return (
                                                <div key={key} className="bg-white p-3 rounded-md">
                                                  <p className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                                                  <p className="text-lg font-semibold text-gray-700">{displayValue}</p>
                                                </div>
                                              );
                                            })}
                                            {teste.tabela_normativa && (
                                              <div className="col-span-full bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <p className="text-xs text-blue-800">
                                                  <strong>📊 Tabela:</strong> {teste.tabela_normativa}
                                                </p>
                                              </div>
                                            )}
                                          </>
                                        )}
                            </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-center py-4">Carregando testes...</p>
                              )}

                              {/* Seleção de Aptidão e Botões de ação */}
                              <div className="mt-6 border-t border-gray-200 pt-4">
                                {/* Usar a primeira avaliação do laudo para aptidão (todas compartilham) */}
                                {(() => {
                                  const primeiraAvaliacao = avaliacoesDoLaudo[0];
                                  const ultimaAptidaoDefinida = avaliacoesDoLaudo.find(av => av.aptidao)?.aptidao;
                                  
                                  return (
                                    <div>
                                      <div className="flex items-center justify-between gap-4 mb-4">
                                        <div className="flex-1">
                                          <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Aptidão do Laudo {laudo}
                                          </label>
                            <div className="flex gap-2">
                              <button
                                              onClick={() => {
                                                // Atualizar todas as avaliações do laudo
                                                avaliacoesDoLaudo.forEach((av: Avaliacao) => {
                                                  updateAptidaoMutation.mutate({ id: av.id, aptidao: 'Apto' });
                                                });
                                              }}
                                              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                                                ultimaAptidaoDefinida === 'Apto'
                                                  ? 'bg-green-600 text-white'
                                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                              }`}
                                            >
                                              ✅ Apto
                              </button>
                              <button
                                              onClick={() => {
                                                // Atualizar todas as avaliações do laudo
                                                avaliacoesDoLaudo.forEach((av: Avaliacao) => {
                                                  updateAptidaoMutation.mutate({ id: av.id, aptidao: 'Inapto Temporário' });
                                                });
                                              }}
                                              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                                                ultimaAptidaoDefinida === 'Inapto Temporário'
                                                  ? 'bg-yellow-600 text-white'
                                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                              }`}
                                            >
                                              ⚠️ Inapto Temporário
                                            </button>
                                            <button
                                              onClick={() => {
                                                // Atualizar todas as avaliações do laudo
                                                avaliacoesDoLaudo.forEach((av: Avaliacao) => {
                                                  updateAptidaoMutation.mutate({ id: av.id, aptidao: 'Inapto' });
                                                });
                                              }}
                                              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                                                ultimaAptidaoDefinida === 'Inapto'
                                                  ? 'bg-red-600 text-white'
                                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                              }`}
                                            >
                                              ❌ Inapto
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Botões de exclusão por data */}
                                      <div className="flex gap-2 justify-end">
                                        {avaliacoesDoLaudo.map((avaliacao: Avaliacao) => (
                                          <button
                                            key={avaliacao.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAvaliacao(avaliacao);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                                            title={`Excluir avaliação de ${new Date(avaliacao.data_aplicacao).toLocaleDateString('pt-BR')}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                            Excluir {new Date(avaliacao.data_aplicacao).toLocaleDateString('pt-BR')}
                              </button>
                                        ))}
                            </div>
                          </div>
                                  );
                                })()}
                        </div>
                      </div>
                          )}
                        </div>
                      );
                    })}
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
                  Editar Avaliado
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

      {/* Modal de Edição/Criação de Avaliado */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingPatient ? 'Editar Avaliado' : 'Novo Avaliado'}
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
                      value={formData.data_nascimento || ''}
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
                      value={formData.contexto || ''}
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
                    <label className="block text-sm font-medium text-gray-700">Escolaridade</label>
                    <select
                      value={formData.escolaridade || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, escolaridade: e.target.value }))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      value={formData.tipo_transito || ''}
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
                    value={formData.endereco || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <textarea
                    value={formData.observacoes || ''}
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

      {/* Modal de Confirmação de Exclusão de Teste Individual */}
      {showDeleteTesteConfirm && testeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmar Exclusão</h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir o resultado do teste <strong>{testeToDelete.nome}</strong>?
              <br /><br />
              <span className="text-sm text-gray-500">
                Data/Hora: {testeToDelete.created_at ? 
                  new Date(testeToDelete.created_at).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'America/Sao_Paulo'
                  }) : 
                  formatDateToBrazilian(testeToDelete.dataAplicacao)
                }
              </span>
              <br /><br />
              <strong className="text-red-600">Esta ação não pode ser desfeita.</strong>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteTesteConfirm(false);
                  setTesteToDelete(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteTesteMutation.mutate(testeToDelete)}
                disabled={deleteTesteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {deleteTesteMutation.isPending ? (
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