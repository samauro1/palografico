import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Edit, Trash2, TestTube } from 'lucide-react';
import { avaliacoesService, pacientesService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Avaliacoes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingAvaliacao, setEditingAvaliacao] = useState(null);
  const [formData, setFormData] = useState({
    paciente_id: '',
    numero_laudo: '',
    data_aplicacao: '',
    aplicacao: 'Coletiva',
    tipo_habilitacao: '1ª Habilitação',
    observacoes: ''
  });
  
  // Estados para Nova Avaliação
  const [showNovaAvaliacaoModal, setShowNovaAvaliacaoModal] = useState(false);
  const [avaliacaoType, setAvaliacaoType] = useState('patient'); // 'patient' ou 'anonymous'
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [currentTest, setCurrentTest] = useState(null);

  const queryClient = useQueryClient();

  // Estado para armazenar testes realizados por avaliação
  const [testesRealizados, setTestesRealizados] = useState({});
  const [showResultadosModal, setShowResultadosModal] = useState(false);
  const [testeSelecionado, setTesteSelecionado] = useState(null);

  const { data, isLoading, error } = useQuery(
    ['avaliacoes', currentPage, searchTerm],
    () => avaliacoesService.list({ 
      page: currentPage, 
      limit: 10, 
      search: searchTerm 
    }),
    {
      keepPreviousData: true
    }
  );

  const { data: pacientes } = useQuery(
    'pacientes-list',
    () => pacientesService.list({ limit: 1000 }),
    {
      select: (data) => data.data.pacientes
    }
  );

  // Buscar pacientes
  const { data: pacientesData } = useQuery(
    ['pacientes-search', patientSearch],
    () => pacientesService.list({ search: patientSearch, limit: 10 }),
    {
      enabled: patientSearch.length >= 3 && avaliacaoType === 'patient',
      select: (data) => data?.data?.data?.pacientes || []
    }
  );

  const createMutation = useMutation(avaliacoesService.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('avaliacoes');
      toast.success('Avaliação criada com sucesso!');
      setShowModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao criar avaliação');
    }
  });

  const updateMutation = useMutation(
    ({ id, data }) => avaliacoesService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('avaliacoes');
        toast.success('Avaliação atualizada com sucesso!');
        setShowModal(false);
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao atualizar avaliação');
      }
    }
  );

  const deleteMutation = useMutation(avaliacoesService.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('avaliacoes');
      toast.success('Avaliação deletada com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao deletar avaliação');
    }
  });

  const resetForm = () => {
    setFormData({
      paciente_id: '',
      numero_laudo: '',
      data_aplicacao: '',
      aplicacao: 'Coletiva',
      tipo_habilitacao: '1ª Habilitação',
      observacoes: ''
    });
    setEditingAvaliacao(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingAvaliacao) {
      updateMutation.mutate({ id: editingAvaliacao.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (avaliacao) => {
    setEditingAvaliacao(avaliacao);
    setFormData({
      paciente_id: avaliacao.paciente_id || '',
      numero_laudo: avaliacao.numero_laudo,
      data_aplicacao: avaliacao.data_aplicacao,
      aplicacao: avaliacao.aplicacao,
      tipo_habilitacao: avaliacao.tipo_habilitacao,
      observacoes: avaliacao.observacoes || ''
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja deletar esta avaliação?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleNewAvaliacao = () => {
    setShowNovaAvaliacaoModal(true);
    setAvaliacaoType('patient');
    setSelectedPatient(null);
    setPatientSearch('');
    setCurrentTest(null);
  };


  // Lista de testes disponíveis
  const availableTests = [
    { id: 'memore', nome: 'Memore - Memória', descricao: 'Avaliação da capacidade de memória' },
    { id: 'ac', nome: 'AC - Atenção Concentrada', descricao: 'Avaliação da capacidade de atenção concentrada' },
    { id: 'beta-iii', nome: 'BETA-III - Raciocínio Matricial', descricao: 'Avaliação do raciocínio lógico e matricial' },
    { id: 'bpa2', nome: 'BPA-2 - Atenção', descricao: 'Avaliação de diferentes tipos de atenção' },
    { id: 'rotas', nome: 'Rotas de Atenção', descricao: 'Avaliação de atenção através de rotas' },
    { id: 'mig', nome: 'MIG - Avaliação Psicológica', descricao: 'Avaliação psicológica para habilitação' },
    { id: 'mvt', nome: 'MVT - Memória Visual para o Trânsito', descricao: 'Avaliação da memória visual relacionada ao trânsito' },
    { id: 'r1', nome: 'R-1 - Raciocínio', descricao: 'Avaliação do raciocínio geral' },
    { id: 'palografico', nome: 'Palográfico', descricao: 'Avaliação da personalidade através da escrita' }
  ];

  const handleTestSelect = (test) => {
    setCurrentTest(test);
  };


  const handlePatientSelect = (paciente) => {
    setSelectedPatient(paciente);
    setPatientSearch('');
  };

  // Lista de todos os testes disponíveis
  const todosTestes = [
    { id: 'memore', nome: 'Memore' },
    { id: 'ac', nome: 'AC' },
    { id: 'beta-iii', nome: 'BETA-III' },
    { id: 'bpa2', nome: 'BPA-2' },
    { id: 'rotas', nome: 'Rotas' },
    { id: 'mig', nome: 'MIG' },
    { id: 'mvt', nome: 'MVT' },
    { id: 'r1', nome: 'R-1' },
    { id: 'palografico', nome: 'Palográfico' }
  ];

  // Função para buscar testes realizados de uma avaliação
  const buscarTestesRealizados = async (avaliacaoId) => {
    try {
      const response = await avaliacoesService.getTestes(avaliacaoId);
      const testes = response.data.data.testes || [];
      
      setTestesRealizados(prev => ({
        ...prev,
        [avaliacaoId]: testes
      }));
    } catch (error) {
      console.error('Erro ao buscar testes realizados:', error);
    }
  };

  // Função para obter o status dos testes de uma avaliação
  const getTestesStatus = (avaliacaoId) => {
    const testesDaAvaliacao = testesRealizados[avaliacaoId] || [];
    const testesRealizadosIds = testesDaAvaliacao.map(t => t.tipo);
    
    return todosTestes.map(teste => ({
      id: teste.id,
      nome: teste.nome,
      status: testesRealizadosIds.includes(teste.id) ? 'Concluído' : 'Pendente',
      resultado: testesDaAvaliacao.find(t => t.tipo === teste.id)?.resultado || null
    }));
  };

  // Função para mostrar resultados de um teste
  const handleVerResultados = (teste) => {
    setTesteSelecionado(teste);
    setShowResultadosModal(true);
  };

  const avaliacoes = useMemo(() => data?.data?.data?.avaliacoes || [], [data]);
  const pagination = data?.data?.data?.pagination || {};

  // Buscar testes realizados quando as avaliações carregam
  useEffect(() => {
    if (avaliacoes.length > 0) {
      avaliacoes.forEach(avaliacao => {
        buscarTestesRealizados(avaliacao.id);
      });
    }
  }, [avaliacoes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erro ao carregar avaliações</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avaliações</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie as avaliações psicológicas realizadas
          </p>
        </div>
        <button
          onClick={handleNewAvaliacao}
          className="btn-primary btn-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Avaliação
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar avaliações..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="input pl-10"
        />
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr className="table-row">
                <th className="table-head">Nº Laudo</th>
                <th className="table-head">Paciente</th>
                <th className="table-head">Data</th>
                <th className="table-head">Aplicação</th>
                <th className="table-head">Tipo</th>
                <th className="table-head">Testes Realizados</th>
                <th className="table-head">Avaliador</th>
                <th className="table-head">Ações</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {avaliacoes.map((avaliacao) => (
                <tr key={avaliacao.id} className="table-row">
                  <td className="table-cell font-medium">{avaliacao.numero_laudo}</td>
                  <td className="table-cell">{avaliacao.paciente_nome}</td>
                  <td className="table-cell">
                    {new Date(avaliacao.data_aplicacao).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="table-cell">{avaliacao.aplicacao}</td>
                  <td className="table-cell">{avaliacao.tipo_habilitacao}</td>
                  <td className="table-cell">
                    <div className="flex flex-wrap gap-1">
                      {getTestesStatus(avaliacao.id).map((teste, index) => (
                        <button
                          key={index}
                          onClick={() => teste.status === 'Concluído' && handleVerResultados(teste)}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            teste.status === 'Concluído'
                              ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                              : 'bg-yellow-100 text-yellow-800 cursor-default'
                          }`}
                          title={teste.status === 'Concluído' ? 'Clique para ver resultados' : 'Teste não realizado'}
                        >
                          <TestTube className="h-3 w-3 mr-1" />
                          {teste.nome}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="table-cell">{avaliacao.usuario_nome}</td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(avaliacao)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(avaliacao.id)}
                        className="text-red-600 hover:text-red-800"
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

        {avaliacoes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma avaliação encontrada</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {((currentPage - 1) * 10) + 1} a {Math.min(currentPage * 10, pagination.total)} de {pagination.total} resultados
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn-outline btn-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-3 py-2 text-sm">
              Página {currentPage} de {pagination.pages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === pagination.pages}
              className="btn-outline btn-sm disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingAvaliacao ? 'Editar Avaliação' : 'Nova Avaliação'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="label">Paciente</label>
                      <select
                        value={formData.paciente_id}
                        onChange={(e) => setFormData({ ...formData, paciente_id: e.target.value })}
                        className="input"
                        required
                      >
                        <option value="">Selecione um paciente</option>
                        {pacientes?.map((paciente) => (
                          <option key={paciente.id} value={paciente.id}>
                            {paciente.nome} - {paciente.cpf}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="label">Número do Laudo</label>
                      <input
                        type="text"
                        value={formData.numero_laudo}
                        onChange={(e) => setFormData({ ...formData, numero_laudo: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="label">Data de Aplicação</label>
                      <input
                        type="date"
                        value={formData.data_aplicacao}
                        onChange={(e) => setFormData({ ...formData, data_aplicacao: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="label">Aplicação</label>
                      <select
                        value={formData.aplicacao}
                        onChange={(e) => setFormData({ ...formData, aplicacao: e.target.value })}
                        className="input"
                        required
                      >
                        <option value="Coletiva">Coletiva</option>
                        <option value="Individual">Individual</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="label">Tipo de Habilitação</label>
                      <select
                        value={formData.tipo_habilitacao}
                        onChange={(e) => setFormData({ ...formData, tipo_habilitacao: e.target.value })}
                        className="input"
                        required
                      >
                        <option value="1ª Habilitação">1ª Habilitação</option>
                        <option value="Renovação/Mudança de categoria">Renovação/Mudança de categoria</option>
                        <option value="Motorista Profissional">Motorista Profissional</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="label">Observações</label>
                      <textarea
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                        className="input"
                        rows="3"
                        placeholder="Observações adicionais..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={createMutation.isLoading || updateMutation.isLoading}
                    className="btn-primary btn-md sm:ml-3"
                  >
                    {(createMutation.isLoading || updateMutation.isLoading) ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      editingAvaliacao ? 'Atualizar' : 'Criar'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary btn-md mt-3 sm:mt-0"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Avaliação */}
      {showNovaAvaliacaoModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Nova Avaliação</h3>
                <button
                  onClick={() => setShowNovaAvaliacaoModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Fechar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {!currentTest ? (
                <div className="space-y-6">
                  {/* Tipo de Avaliação */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Tipo de Avaliação</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="avaliacaoType"
                          value="patient"
                          checked={avaliacaoType === 'patient'}
                          onChange={(e) => setAvaliacaoType(e.target.value)}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900">Vinculada a Paciente</div>
                          <div className="text-sm text-gray-500">Buscar por CPF, nome ou laudo</div>
                        </div>
                      </label>
                      
                      <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="avaliacaoType"
                          value="anonymous"
                          checked={avaliacaoType === 'anonymous'}
                          onChange={(e) => setAvaliacaoType(e.target.value)}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900">Avaliação Anônima</div>
                          <div className="text-sm text-gray-500">Sem vinculação a paciente específico</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Busca de Paciente (se vinculada) */}
                  {avaliacaoType === 'patient' && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Buscar Paciente</h4>
                      <div className="relative">
                        <input
                          type="text"
                          value={patientSearch}
                          onChange={(e) => setPatientSearch(e.target.value)}
                          placeholder="Digite CPF, nome ou número do laudo..."
                          className="input w-full"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* Resultados da busca */}
                      {patientSearch.length >= 3 && pacientesData && pacientesData.length > 0 && !selectedPatient && (
                        <div className="mt-2 border rounded-lg bg-white shadow-lg max-h-48 overflow-y-auto">
                          {pacientesData.map((paciente) => (
                            <button
                              key={paciente.id}
                              onClick={() => handlePatientSelect(paciente)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{paciente.nome}</div>
                              <div className="text-sm text-gray-500">
                                CPF: {paciente.cpf} | Idade: {paciente.idade} anos | {paciente.escolaridade}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {patientSearch.length >= 3 && pacientesData && pacientesData.length === 0 && (
                        <div className="mt-2 p-3 text-center text-gray-500 bg-gray-50 rounded-lg">
                          Nenhum paciente encontrado
                        </div>
                      )}
                      
                      {selectedPatient && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-green-800">Paciente selecionado:</h5>
                              <p className="text-green-700">
                                <strong>Nome:</strong> {selectedPatient.nome} | 
                                <strong> CPF:</strong> {selectedPatient.cpf} | 
                                <strong> Idade:</strong> {selectedPatient.idade} anos
                              </p>
                            </div>
                            <button
                              onClick={() => setSelectedPatient(null)}
                              className="text-green-600 hover:text-green-800"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Seleção de Testes */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Testes a Aplicar</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {availableTests.map((test) => (
                        <button
                          key={test.id}
                          onClick={() => handleTestSelect(test)}
                          className="p-3 border rounded-lg text-left hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{test.nome}</div>
                          <div className="text-sm text-gray-500 mt-1">{test.descricao}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => setShowNovaAvaliacaoModal(false)}
                      className="btn-outline btn-md"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={async () => {
                        if (avaliacaoType === 'patient' && !selectedPatient) {
                          alert('Selecione um paciente para continuar');
                          return;
                        }
                        
                        try {
                          // Criar avaliação no banco
                          const avaliacaoData = {
                            paciente_id: selectedPatient?.id || null,
                            numero_laudo: `LAU-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
                            data_aplicacao: new Date().toISOString().split('T')[0],
                            aplicacao: 'Individual',
                            tipo_habilitacao: 'Psicológica',
                            observacoes: avaliacaoType === 'anonymous' ? 'Avaliação anônima' : ''
                          };
                          
                          await avaliacoesService.create(avaliacaoData);
                          
                          // Fechar modal e atualizar lista
                          setShowNovaAvaliacaoModal(false);
                          queryClient.invalidateQueries('avaliacoes');
                          
                          alert('Avaliação criada com sucesso!');
                        } catch (error) {
                          console.error('Erro ao criar avaliação:', error);
                          alert('Erro ao criar avaliação. Tente novamente.');
                        }
                      }}
                      className="btn-primary btn-md"
                    >
                      Criar Avaliação
                    </button>
                  </div>
                </div>
              ) : (
                /* Interface do Teste Selecionado */
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">{currentTest.nome}</h4>
                    <button
                      onClick={() => setCurrentTest(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ← Voltar
                    </button>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-blue-800">
                      <strong>Teste:</strong> {currentTest.descricao}
                    </p>
                    {selectedPatient && (
                      <p className="text-blue-700 mt-1">
                        <strong>Paciente:</strong> {selectedPatient.nome} ({selectedPatient.cpf})
                      </p>
                    )}
                  </div>

                  <div className="text-center py-8">
                    <TestTube className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Redirecionando para a página de testes...
                    </p>
                    <button
                      onClick={() => {
                        // Construir URL com parâmetros
                        const params = new URLSearchParams();
                        params.set('test', currentTest.id);
                        
                        if (selectedPatient) {
                          params.set('patient_id', selectedPatient.id);
                          params.set('patient_name', selectedPatient.nome);
                          params.set('patient_cpf', selectedPatient.cpf);
                          params.set('analysis_type', 'linked');
                        } else {
                          params.set('analysis_type', 'anonymous');
                        }
                        
                        // Redirecionar para a página de testes
                        window.location.href = `/testes?${params.toString()}`;
                      }}
                      className="btn-primary btn-md"
                    >
                      Ir para Teste
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resultados do Teste */}
      {showResultadosModal && testeSelecionado && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Resultados - {testeSelecionado.nome}
                </h3>
                <button
                  onClick={() => setShowResultadosModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Fechar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {testeSelecionado.resultado && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Dados do Resultado:</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(testeSelecionado.resultado).map(([key, value]) => {
                        // Pular campos de sistema
                        if (['id', 'avaliacao_id', 'created_at', 'tipo_atencao'].includes(key)) return null;
                        
                        // Formatar chaves para exibição
                        const label = key
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase());
                        
                        // Verificar se é um objeto aninhado (como no BPA-2)
                        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                          return (
                            <div key={key} className="col-span-2">
                              <h5 className="font-medium text-gray-700 mb-2">{label}:</h5>
                              <div className="ml-4 space-y-1">
                                {Object.entries(value).map(([subKey, subValue]) => (
                                  <div key={subKey} className="flex justify-between">
                                    <span className="text-sm text-gray-600">
                                      {subKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                                    </span>
                                    <span className="text-sm text-gray-900">
                                      {typeof subValue === 'number' 
                                        ? subValue.toFixed(2) 
                                        : String(subValue)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        
                        return (
                          <div key={key} className="flex justify-between">
                            <span className="text-sm font-medium text-gray-600">{label}:</span>
                            <span className="text-sm text-gray-900">
                              {typeof value === 'number' 
                                ? value.toFixed(2) 
                                : String(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {testeSelecionado.resultado?.percentil && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Classificação:</h4>
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl font-bold text-blue-900">
                        {testeSelecionado.resultado.percentil}º Percentil
                      </div>
                      <div className="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">
                        {testeSelecionado.resultado.classificacao || 'N/A'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowResultadosModal(false)}
                  className="btn-primary btn-md"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Avaliacoes;
