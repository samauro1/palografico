import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Package, Plus, Minus, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { estoqueService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Estoque = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [movementType, setMovementType] = useState('entrada');
  const [movementData, setMovementData] = useState({
    quantidade: '',
    observacoes: ''
  });

  const queryClient = useQueryClient();

  const { data: estoque, isLoading } = useQuery(
    'estoque',
    () => estoqueService.list(),
    {
      select: (data) => data.data.data.estoque
    }
  );

  const { data: estoqueBaixo } = useQuery(
    'estoque-baixo',
    () => estoqueService.get('low-stock'),
    {
      select: (data) => {
        console.log('Estoque baixo - response:', data);
        console.log('Estoque baixo - data.data:', data?.data);
        console.log('Estoque baixo - data.data.data:', data?.data?.data);
        return data?.data?.data?.estoque || [];
      }
    }
  );

  const movementMutation = useMutation(estoqueService.addMovement, {
    onSuccess: () => {
      queryClient.invalidateQueries('estoque');
      toast.success('Movimentação registrada com sucesso!');
      setShowModal(false);
      setMovementData({ quantidade: '', observacoes: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao registrar movimentação');
    }
  });

  const handleMovement = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedItem) return;

    movementMutation.mutate({
      teste_id: selectedItem.id,
      tipo_movimentacao: movementType,
      quantidade: parseInt(movementData.quantidade),
      observacoes: movementData.observacoes
    });
  };

  const getStatusColor = (item) => {
    if (item.quantidade_atual <= item.quantidade_minima) {
      return 'text-red-600 bg-red-50';
    } else if (item.quantidade_atual <= item.quantidade_minima * 1.5) {
      return 'text-yellow-600 bg-yellow-50';
    }
    return 'text-green-600 bg-green-50';
  };

  const getStatusText = (item) => {
    if (item.quantidade_atual <= item.quantidade_minima) {
      return 'Estoque Baixo';
    } else if (item.quantidade_atual <= item.quantidade_minima * 1.5) {
      return 'Atenção';
    }
    return 'Normal';
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Controle de Estoque</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie o estoque de testes psicológicos
        </p>
      </div>

      {/* Alertas de estoque baixo */}
      {estoqueBaixo && estoqueBaixo.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Atenção: {estoqueBaixo.length} item(ns) com estoque baixo
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {estoqueBaixo.map((item) => (
                    <li key={item.id}>
                      {item.nome_teste}: {item.quantidade_atual} unidades 
                      (mínimo: {item.quantidade_minima})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estoque atual */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Estoque Atual</h3>
          <p className="card-description">
            Quantidade atual de cada teste disponível
          </p>
        </div>
        <div className="card-content">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr className="table-row">
                  <th className="table-head">Teste</th>
                  <th className="table-head">Quantidade Atual</th>
                  <th className="table-head">Quantidade Mínima</th>
                  <th className="table-head">Status</th>
                  <th className="table-head">Ações</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {estoque?.map((item) => (
                  <tr key={item.id} className="table-row">
                    <td className="table-cell font-medium">{item.nome_teste}</td>
                    <td className="table-cell">{item.quantidade_atual}</td>
                    <td className="table-cell">{item.quantidade_minima}</td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item)}`}>
                        {getStatusText(item)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setMovementType('entrada');
                            handleMovement(item);
                          }}
                          className="text-green-600 hover:text-green-800"
                          title="Entrada"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setMovementType('saida');
                            handleMovement(item);
                          }}
                          className="text-red-600 hover:text-red-800"
                          title="Saída"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-blue-500">
                  <Package className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Itens</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {estoque?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-green-500">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total em Estoque</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {estoque?.reduce((sum, item) => sum + item.quantidade_atual, 0) || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 rounded-md bg-red-500">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Estoque Baixo</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {estoqueBaixo?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de movimentação */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {movementType === 'entrada' ? 'Entrada no Estoque' : 'Saída do Estoque'}
                  </h3>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <strong>Teste:</strong> {selectedItem.nome_teste}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Quantidade Atual:</strong> {selectedItem.quantidade_atual}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="label">Quantidade</label>
                      <input
                        type="number"
                        min="1"
                        value={movementData.quantidade}
                        onChange={(e) => setMovementData({ ...movementData, quantidade: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="label">Observações</label>
                      <textarea
                        value={movementData.observacoes}
                        onChange={(e) => setMovementData({ ...movementData, observacoes: e.target.value })}
                        className="input"
                        rows="3"
                        placeholder="Motivo da movimentação..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={movementMutation.isLoading}
                    className={`btn-md sm:ml-3 ${
                      movementType === 'entrada' 
                        ? 'btn-primary' 
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {movementMutation.isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      movementType === 'entrada' ? 'Registrar Entrada' : 'Registrar Saída'
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

export default Estoque;
