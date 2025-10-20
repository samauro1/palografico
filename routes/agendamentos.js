const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Listar agendamentos
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', status, data_inicio, data_fim } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    let queryParams = [];

    // Filtro por usuário (exceto admin)
    if (!isAdmin(req.user)) {
      queryParams.push(req.user.id);
      whereClause += ` AND a.usuario_id = $${queryParams.length}`;
    }

    if (search) {
      queryParams.push(`%${search}%`);
      whereClause += ` AND (a.nome ILIKE $${queryParams.length} OR a.cpf ILIKE $${queryParams.length} OR a.email ILIKE $${queryParams.length})`;
    }

    if (status) {
      queryParams.push(status);
      whereClause += ` AND a.status = $${queryParams.length}`;
    }

    if (data_inicio) {
      queryParams.push(data_inicio);
      whereClause += ` AND a.data_agendamento >= $${queryParams.length}`;
    }

    if (data_fim) {
      queryParams.push(data_fim);
      whereClause += ` AND a.data_agendamento <= $${queryParams.length}`;
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM agendamentos a 
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT 
        a.*,
        p.nome as paciente_nome,
        u.nome as usuario_nome,
        (
          SELECT aptidao 
          FROM avaliacoes 
          WHERE paciente_id = a.paciente_id AND aptidao IS NOT NULL
          ORDER BY data_aplicacao DESC, created_at DESC 
          LIMIT 1
        ) as ultima_aptidao
      FROM agendamentos a 
      LEFT JOIN pacientes p ON a.paciente_id = p.id
      LEFT JOIN usuarios u ON a.created_at = u.created_at
      ${whereClause}
      ORDER BY a.data_agendamento ASC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const dataResult = await query(dataQuery, [...queryParams, limit, offset]);

    res.json({
      data: {
        agendamentos: dataResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao listar agendamentos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar agendamento por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Montar query com filtro de usuário se não for admin
    let whereClause = 'WHERE a.id = $1';
    let queryParams = [id];

    if (!isAdmin(req.user)) {
      queryParams.push(req.user.id);
      whereClause += ' AND a.usuario_id = $2';
    }

    const result = await query(`
      SELECT 
        a.*,
        p.nome as paciente_nome, p.cpf as paciente_cpf
      FROM agendamentos a 
      LEFT JOIN pacientes p ON a.paciente_id = p.id
      ${whereClause}
    `, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Agendamento não encontrado ou você não tem permissão para acessá-lo'
      });
    }

    res.json({
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar agendamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Criar agendamento
router.post('/', async (req, res) => {
  try {
    const { 
      paciente_id, 
      nome, 
      cpf, 
      telefone, 
      email, 
      data_agendamento, 
      tipo_avaliacao, 
      observacoes,
      contexto,
      tipo_transito
    } = req.body;

    // Validar campos obrigatórios
    if (!nome || !data_agendamento) {
      return res.status(400).json({
        error: 'Nome e data de agendamento são obrigatórios'
      });
    }

    // Atribuir agendamento ao usuário logado
    const usuarioId = req.user.id;

    const result = await query(`
      INSERT INTO agendamentos (
        paciente_id, nome, cpf, telefone, email, 
        data_agendamento, tipo_avaliacao, observacoes, status,
        contexto, tipo_transito, categoria_cnh, usuario_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'agendado', $9, $10, $11, $12)
      RETURNING *
    `, [
      paciente_id || null,
      nome,
      cpf || null,
      telefone || null,
      email || null,
      data_agendamento,
      tipo_avaliacao || null,
      observacoes || null,
      contexto || null,
      tipo_transito || null,
      req.body.categoria_cnh || null,
      usuarioId
    ]);

    console.log(`✅ Agendamento criado e atribuído ao usuário ID ${usuarioId}`);

    res.status(201).json({
      message: 'Agendamento criado com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Criar múltiplos agendamentos (importação em lote)
router.post('/importar-lote', async (req, res) => {
  try {
    const { agendamentos, data_base, psicologo_info } = req.body;

    console.log('📥 Importação em lote recebida:', {
      totalAgendamentos: agendamentos?.length,
      data_base,
      primeiroAgendamento: agendamentos?.[0]
    });

    if (!agendamentos || !Array.isArray(agendamentos)) {
      console.log('❌ Lista de agendamentos inválida');
      return res.status(400).json({
        error: 'Lista de agendamentos é obrigatória'
      });
    }

    const resultados = {
      sucesso: 0,
      erros: 0,
      detalhes: []
    };

    // Atribuir todos os agendamentos ao usuário logado
    const usuarioId = req.user.id;

    for (const agend of agendamentos) {
      try {
        const result = await query(`
          INSERT INTO agendamentos (
            nome, cpf, telefone, email, 
            data_agendamento, tipo_avaliacao, observacoes, status,
            contexto, tipo_transito, categoria_cnh, usuario_id
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'agendado', $8, $9, $10, $11)
          RETURNING id, nome
        `, [
          agend.nome,
          agend.cpf || null,
          agend.telefone || null,
          agend.email || null,
          agend.data_agendamento,
          agend.tipo_avaliacao || null,
          agend.observacoes || null,
          agend.contexto || 'Trânsito',
          agend.tipo_transito || null,
          agend.categoria_cnh || null,
          usuarioId
        ]);

        resultados.sucesso++;
        resultados.detalhes.push({
          nome: agend.nome,
          status: 'sucesso',
          id: result.rows[0].id
        });
      } catch (error) {
        console.error('❌ Erro ao inserir agendamento:', agend.nome, error.message);
        resultados.erros++;
        resultados.detalhes.push({
          nome: agend.nome,
          status: 'erro',
          erro: error.message
        });
      }
    }

    res.json({
      message: `Importação concluída: ${resultados.sucesso} sucesso, ${resultados.erros} erros`,
      data: resultados
    });
  } catch (error) {
    console.error('Erro ao importar agendamentos:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar agendamento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      paciente_id, 
      nome, 
      cpf, 
      telefone, 
      email, 
      data_agendamento, 
      tipo_avaliacao, 
      observacoes,
      status,
      aptidao 
    } = req.body;

    // Verificar se o agendamento existe e se o usuário tem permissão
    let checkQuery = 'SELECT * FROM agendamentos WHERE id = $1';
    let checkParams = [id];

    if (!isAdmin(req.user)) {
      checkQuery += ' AND usuario_id = $2';
      checkParams.push(req.user.id);
    }

    const existingAgendamento = await query(checkQuery, checkParams);

    if (existingAgendamento.rows.length === 0) {
      return res.status(404).json({
        error: 'Agendamento não encontrado ou você não tem permissão para editá-lo'
      });
    }

    // Atualização parcial
    const agendamentoAtual = existingAgendamento.rows[0];
    const dadosAtualizados = {
      paciente_id: paciente_id !== undefined ? paciente_id : agendamentoAtual.paciente_id,
      nome: nome !== undefined ? nome : agendamentoAtual.nome,
      cpf: cpf !== undefined ? cpf : agendamentoAtual.cpf,
      telefone: telefone !== undefined ? telefone : agendamentoAtual.telefone,
      email: email !== undefined ? email : agendamentoAtual.email,
      data_agendamento: data_agendamento !== undefined ? data_agendamento : agendamentoAtual.data_agendamento,
      tipo_avaliacao: tipo_avaliacao !== undefined ? tipo_avaliacao : agendamentoAtual.tipo_avaliacao,
      observacoes: observacoes !== undefined ? observacoes : agendamentoAtual.observacoes,
      status: status !== undefined ? status : agendamentoAtual.status,
      aptidao: aptidao !== undefined ? aptidao : agendamentoAtual.aptidao
    };

    const result = await query(`
      UPDATE agendamentos 
      SET 
        paciente_id = $1,
        nome = $2,
        cpf = $3,
        telefone = $4,
        email = $5,
        data_agendamento = $6,
        tipo_avaliacao = $7,
        observacoes = $8,
        status = $9,
        aptidao = $10,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [
      dadosAtualizados.paciente_id,
      dadosAtualizados.nome,
      dadosAtualizados.cpf,
      dadosAtualizados.telefone,
      dadosAtualizados.email,
      dadosAtualizados.data_agendamento,
      dadosAtualizados.tipo_avaliacao,
      dadosAtualizados.observacoes,
      dadosAtualizados.status,
      dadosAtualizados.aptidao,
      id
    ]);

    res.json({
      message: 'Agendamento atualizado com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar agendamento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Montar query com filtro de usuário se não for admin
    let deleteQuery = 'DELETE FROM agendamentos WHERE id = $1';
    let deleteParams = [id];

    if (!isAdmin(req.user)) {
      deleteQuery += ' AND usuario_id = $2';
      deleteParams.push(req.user.id);
    }

    deleteQuery += ' RETURNING *';

    const result = await query(deleteQuery, deleteParams);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Agendamento não encontrado ou você não tem permissão para deletá-lo'
      });
    }

    res.json({
      message: 'Agendamento excluído com sucesso',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao excluir agendamento:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Converter agendamento em paciente
router.post('/:id/converter-paciente', async (req, res) => {
  try {
    const { id } = req.params;
    const { dados_adicionais } = req.body;

    console.log('🔄 Convertendo agendamento ID:', id);
    console.log('📋 Dados adicionais:', dados_adicionais);

    // Buscar agendamento e verificar permissão
    let checkQuery = 'SELECT * FROM agendamentos WHERE id = $1';
    let checkParams = [id];

    if (!isAdmin(req.user)) {
      checkQuery += ' AND usuario_id = $2';
      checkParams.push(req.user.id);
    }

    const agendamento = await query(checkQuery, checkParams);

    if (agendamento.rows.length === 0) {
      return res.status(404).json({
        error: 'Agendamento não encontrado ou você não tem permissão para convertê-lo'
      });
    }

    const agend = agendamento.rows[0];
    console.log('📋 Agendamento encontrado:', agend);

    // Verificar se já foi convertido
    if (agend.convertido_em_paciente) {
      return res.status(400).json({
        error: 'Este agendamento já foi convertido em paciente',
        paciente_id: agend.paciente_id
      });
    }

    // Preparar dados do paciente
    const dadosPaciente = {
      nome: agend.nome,
      cpf: agend.cpf || null,
      telefone: agend.telefone || null,
      email: agend.email || null,
      observacoes: agend.observacoes || null,
      contexto: dados_adicionais?.contexto || agend.contexto || null,
      escolaridade: dados_adicionais?.escolaridade || null,
      data_nascimento: dados_adicionais?.data_nascimento || null,
      endereco: dados_adicionais?.endereco || null,
      tipo_transito: dados_adicionais?.tipo_transito || agend.tipo_transito || null,
      categoria_cnh: dados_adicionais?.categoria_cnh || agend.categoria_cnh || null
    };

    console.log('💾 Criando paciente com dados:', dadosPaciente);

    // Normalizar CPF antes de salvar
    if (dadosPaciente.cpf && dadosPaciente.cpf.length === 11 && /^\d{11}$/.test(dadosPaciente.cpf)) {
      dadosPaciente.cpf = dadosPaciente.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      console.log('📝 CPF normalizado para:', dadosPaciente.cpf);
    }

    // Criar paciente com dados do agendamento
    // Atribuir ao mesmo usuário que criou o agendamento
    const usuarioId = agend.usuario_id || req.user.id;

    const pacienteResult = await query(`
      INSERT INTO pacientes (
        nome, cpf, telefone, email, observacoes,
        contexto, escolaridade, data_nascimento, endereco, tipo_transito, categoria_cnh, usuario_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      dadosPaciente.nome,
      dadosPaciente.cpf,
      dadosPaciente.telefone,
      dadosPaciente.email,
      dadosPaciente.observacoes,
      dadosPaciente.contexto,
      dadosPaciente.escolaridade,
      dadosPaciente.data_nascimento,
      dadosPaciente.endereco,
      dadosPaciente.tipo_transito,
      dadosPaciente.categoria_cnh,
      usuarioId
    ]);

    const novoPaciente = pacienteResult.rows[0];
    console.log(`✅ Paciente criado (ID: ${novoPaciente.id}) e atribuído ao usuário ID ${usuarioId}`);

    // Atualizar agendamento marcando como convertido
    await query(`
      UPDATE agendamentos 
      SET 
        paciente_id = $1,
        convertido_em_paciente = TRUE,
        status = 'realizado',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [novoPaciente.id, id]);

    res.json({
      message: 'Agendamento convertido em paciente com sucesso',
      data: {
        paciente: novoPaciente,
        agendamento_id: id
      }
    });
  } catch (error) {
    console.error('❌ Erro ao converter agendamento em paciente:', error);
    console.error('❌ Stack trace:', error.stack);
    
    // Verificar se é erro de CPF duplicado
    if (error.message && error.message.includes('duplicate key')) {
      return res.status(400).json({
        error: 'CPF já cadastrado. Vincule ao paciente existente.'
      });
    }
    
    // Verificar se é erro de coluna
    if (error.message && error.message.includes('column')) {
      return res.status(500).json({
        error: 'Erro de estrutura do banco de dados',
        detalhes: error.message
      });
    }
    
    res.status(500).json({
      error: 'Erro interno do servidor',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

