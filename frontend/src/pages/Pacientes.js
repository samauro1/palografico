import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { pacientesService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Pacientes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingPaciente, setEditingPaciente] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    idade: '',
    escolaridade: 'Ensino Fundamental'
  });

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    ['pacientes', currentPage, searchTerm],
    () => pacientesService.list({ 
      page: currentPage, 
      limit: 10, 
      search: searchTerm 
    }),
    {
      keepPreviousData: true
    }
  );

  const createMutation = useMutation(pacientesService.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('pacientes');
      toast.success('Paciente criado com sucesso!');
      setShowModal(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao criar paciente');
    }
  });

  const updateMutation = useMutation(
    ({ id, data }) => pacientesService.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('pacientes');
        toast.success('Paciente atualizado com sucesso!');
        setShowModal(false);
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao atualizar paciente');
      }
    }
  );

  const deleteMutation = useMutation(pacientesService.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('pacientes');
      toast.success('Paciente deletado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao deletar paciente');
    }
  });

  const resetForm = () => {
    setFormData({
      nome: '',
      cpf: '',
      idade: '',
      escolaridade: 'Ensino Fundamental'
    });
    setEditingPaciente(null);
  };

  const maskCPFInput = (value) => {
    // Mantém apenas dígitos e limita a 11
    let v = (value || '').replace(/\D/g, '').slice(0, 11);
    // Aplica máscara 000.000.000-00 conforme digitação
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, '$1.$2');
    return v;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingPaciente) {
      updateMutation.mutate({ id: editingPaciente.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (paciente) => {
    setEditingPaciente(paciente);
    setFormData({
      nome: paciente.nome,
      cpf: paciente.cpf,
      idade: paciente.idade.toString(),
      escolaridade: paciente.escolaridade
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja deletar este paciente?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleNewPaciente = () => {
    resetForm();
    setShowModal(true);
  };

  const formatCPF = (cpf) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

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
        <p className="text-red-600">Erro ao carregar pacientes</p>
      </div>
    );
  }

  const pacientes = data?.data?.data?.pacientes || [];
  const pagination = data?.data?.data?.pagination || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie os pacientes do sistema
          </p>
        </div>
        <button
          onClick={handleNewPaciente}
          className="btn-primary btn-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Paciente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar pacientes..."
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
                <th className="table-head">Nome</th>
                <th className="table-head">CPF</th>
                <th className="table-head">Idade</th>
                <th className="table-head">Escolaridade</th>
                <th className="table-head">Cadastrado em</th>
                <th className="table-head">Ações</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {pacientes.map((paciente) => (
                <tr key={paciente.id} className="table-row">
                  <td className="table-cell font-medium">{paciente.nome}</td>
                  <td className="table-cell">{formatCPF(paciente.cpf)}</td>
                  <td className="table-cell">{paciente.idade} anos</td>
                  <td className="table-cell">{paciente.escolaridade}</td>
                  <td className="table-cell text-gray-500">
                    {new Date(paciente.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(paciente)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(paciente.id)}
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

        {pacientes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhum paciente encontrado</p>
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
                    {editingPaciente ? 'Editar Paciente' : 'Novo Paciente'}
                  </h3>
                  
                  <div className="space-y-4">
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
                      <label className="label">CPF</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: maskCPFInput(e.target.value) })}
                        className="input"
                        placeholder="000.000.000-00"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="label">Idade</label>
                      <input
                        type="number"
                        value={formData.idade}
                        onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
                        className="input"
                        min="1"
                        max="120"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="label">Escolaridade</label>
                      <select
                        value={formData.escolaridade}
                        onChange={(e) => setFormData({ ...formData, escolaridade: e.target.value })}
                        className="input"
                        required
                      >
                        <option value="Ensino Fundamental">Ensino Fundamental</option>
                        <option value="Ensino Médio">Ensino Médio</option>
                        <option value="Ensino Superior">Ensino Superior</option>
                      </select>
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
                      editingPaciente ? 'Atualizar' : 'Criar'
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

export default Pacientes;
