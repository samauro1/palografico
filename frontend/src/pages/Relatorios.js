import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { FileText, Download, Calendar, User, BarChart3 } from 'lucide-react';
import { relatoriosService, pacientesService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Relatorios = () => {
  const [showModal, setShowModal] = useState(false);
  const [relatorioData, setRelatorioData] = useState({
    tipo_relatorio: 'geral',
    data_inicio: '',
    data_fim: '',
    paciente_id: '',
    teste_tipo: ''
  });

  const { data: relatorios, isLoading } = useQuery(
    'relatorios',
    () => relatoriosService.list({ limit: 50 }),
    {
      select: (data) => data.data.relatorios
    }
  );

  const { data: pacientes } = useQuery(
    'pacientes-relatorios',
    () => pacientesService.list({ limit: 1000 }),
    {
      select: (data) => data.data.pacientes
    }
  );

  const generateMutation = useMutation(relatoriosService.generate, {
    onSuccess: (data) => {
      toast.success('Relatório gerado com sucesso!');
      setShowModal(false);
      setRelatorioData({
        tipo_relatorio: 'geral',
        data_inicio: '',
        data_fim: '',
        paciente_id: '',
        teste_tipo: ''
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao gerar relatório');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const data = { ...relatorioData };
    
    // Remover campos vazios
    Object.keys(data).forEach(key => {
      if (data[key] === '') {
        delete data[key];
      }
    });

    generateMutation.mutate(data);
  };

  const handleInputChange = (field, value) => {
    setRelatorioData({
      ...relatorioData,
      [field]: value
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTipoRelatorioLabel = (tipo) => {
    const labels = {
      'geral': 'Relatório Geral',
      'paciente': 'Relatório de Paciente',
      'teste': 'Relatório de Teste',
      'estoque': 'Relatório de Estoque'
    };
    return labels[tipo] || tipo;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gere e visualize relatórios do sistema
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary btn-md"
        >
          <FileText className="h-4 w-4 mr-2" />
          Gerar Relatório
        </button>
      </div>

      {/* Lista de relatórios */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Relatórios Gerados</h3>
          <p className="card-description">
            Histórico de relatórios criados no sistema
          </p>
        </div>
        <div className="card-content">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr className="table-row">
                  <th className="table-head">Tipo</th>
                  <th className="table-head">Gerado por</th>
                  <th className="table-head">Data/Hora</th>
                  <th className="table-head">Ações</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {relatorios?.map((relatorio) => (
                  <tr key={relatorio.id} className="table-row">
                    <td className="table-cell">
                      <span className="badge badge-secondary">
                        {getTipoRelatorioLabel(relatorio.tipo_relatorio)}
                      </span>
                    </td>
                    <td className="table-cell">{relatorio.usuario_nome}</td>
                    <td className="table-cell">
                      {formatDate(relatorio.created_at)}
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          title="Visualizar"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-800"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {relatorios?.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum relatório gerado ainda</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de geração */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Gerar Relatório
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="label">Tipo de Relatório</label>
                      <select
                        value={relatorioData.tipo_relatorio}
                        onChange={(e) => handleInputChange('tipo_relatorio', e.target.value)}
                        className="input"
                        required
                      >
                        <option value="geral">Relatório Geral</option>
                        <option value="paciente">Relatório de Paciente</option>
                        <option value="teste">Relatório de Teste</option>
                        <option value="estoque">Relatório de Estoque</option>
                      </select>
                    </div>

                    {relatorioData.tipo_relatorio === 'paciente' && (
                      <div>
                        <label className="label">Paciente</label>
                        <select
                          value={relatorioData.paciente_id}
                          onChange={(e) => handleInputChange('paciente_id', e.target.value)}
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
                    )}

                    {relatorioData.tipo_relatorio === 'teste' && (
                      <div>
                        <label className="label">Tipo de Teste</label>
                        <select
                          value={relatorioData.teste_tipo}
                          onChange={(e) => handleInputChange('teste_tipo', e.target.value)}
                          className="input"
                          required
                        >
                          <option value="">Selecione um teste</option>
                          <option value="ac">AC - Atenção Concentrada</option>
                          <option value="beta-iii">BETA-III - Raciocínio Matricial</option>
                          <option value="bpa2">BPA-2 - Atenção</option>
                          <option value="rotas">Rotas de Atenção</option>
                          <option value="mig">MIG - Avaliação Psicológica</option>
                          <option value="mvt">MVT - Memória Visual</option>
                          <option value="r1">R-1 - Raciocínio</option>
                          <option value="memore">Memore - Memória</option>
                        </select>
                      </div>
                    )}

                    {(relatorioData.tipo_relatorio === 'geral' || relatorioData.tipo_relatorio === 'teste') && (
                      <>
                        <div>
                          <label className="label">Data Início</label>
                          <input
                            type="date"
                            value={relatorioData.data_inicio}
                            onChange={(e) => handleInputChange('data_inicio', e.target.value)}
                            className="input"
                          />
                        </div>
                        
                        <div>
                          <label className="label">Data Fim</label>
                          <input
                            type="date"
                            value={relatorioData.data_fim}
                            onChange={(e) => handleInputChange('data_fim', e.target.value)}
                            className="input"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={generateMutation.isLoading}
                    className="btn-primary btn-md sm:ml-3"
                  >
                    {generateMutation.isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Gerar Relatório'
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
    </div>
  );
};

export default Relatorios;
