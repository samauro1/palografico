const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, pacienteSchema } = require('../middleware/validation');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Listar pacientes
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];

    if (search) {
      // Busca flexível: nome, CPF formatado ou CPF sem formatação
      const cleanSearch = search.replace(/\D/g, ''); // Remove formatação
      const formattedSearch = cleanSearch.length === 11 ? 
        cleanSearch.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : search;
      
      whereClause = 'WHERE nome ILIKE $1 OR cpf ILIKE $1 OR cpf ILIKE $2';
      queryParams.push(`%${search}%`, `%${formattedSearch}%`);
    }

    const countQuery = `SELECT COUNT(*) FROM pacientes ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT id, nome, cpf, idade, escolaridade, created_at, updated_at 
      FROM pacientes 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const dataResult = await query(dataQuery, [...queryParams, limit, offset]);

    res.json({
      data: {
        pacientes: dataResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao listar pacientes:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar paciente por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT id, nome, cpf, idade, escolaridade, created_at, updated_at FROM pacientes WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Paciente não encontrado'
      });
    }

    res.json({
      paciente: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar paciente:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Criar paciente
router.post('/', validate(pacienteSchema), async (req, res) => {
  try {
    const { nome, cpf, idade, escolaridade } = req.body;

    console.log('📝 Dados recebidos:', { nome, cpf, idade, escolaridade });

    // Verificar se o CPF já existe
    const existingPaciente = await query(
      'SELECT id FROM pacientes WHERE cpf = $1',
      [cpf]
    );

    if (existingPaciente.rows.length > 0) {
      console.log('❌ CPF já existe:', cpf);
      return res.status(400).json({
        error: 'CPF já está em uso'
      });
    }

    const result = await query(
      'INSERT INTO pacientes (nome, cpf, idade, escolaridade) VALUES ($1, $2, $3, $4) RETURNING id, nome, cpf, idade, escolaridade, created_at, updated_at',
      [nome, cpf, idade, escolaridade]
    );

    res.status(201).json({
      message: 'Paciente criado com sucesso',
      paciente: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar paciente:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar paciente
router.put('/:id', validate(pacienteSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cpf, idade, escolaridade } = req.body;

    // Verificar se o paciente existe
    const existingPaciente = await query(
      'SELECT id FROM pacientes WHERE id = $1',
      [id]
    );

    if (existingPaciente.rows.length === 0) {
      return res.status(404).json({
        error: 'Paciente não encontrado'
      });
    }

    // Verificar se o CPF já está em uso por outro paciente
    const cpfCheck = await query(
      'SELECT id FROM pacientes WHERE cpf = $1 AND id != $2',
      [cpf, id]
    );

    if (cpfCheck.rows.length > 0) {
      return res.status(400).json({
        error: 'CPF já está em uso por outro paciente'
      });
    }

    const result = await query(
      'UPDATE pacientes SET nome = $1, cpf = $2, idade = $3, escolaridade = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, nome, cpf, idade, escolaridade, created_at, updated_at',
      [nome, cpf, idade, escolaridade, id]
    );

    res.json({
      message: 'Paciente atualizado com sucesso',
      paciente: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar paciente:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar paciente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o paciente existe
    const existingPaciente = await query(
      'SELECT id FROM pacientes WHERE id = $1',
      [id]
    );

    if (existingPaciente.rows.length === 0) {
      return res.status(404).json({
        error: 'Paciente não encontrado'
      });
    }

    // Verificar se há avaliações associadas
    const avaliacoes = await query(
      'SELECT id FROM avaliacoes WHERE paciente_id = $1',
      [id]
    );

    if (avaliacoes.rows.length > 0) {
      return res.status(400).json({
        error: 'Não é possível deletar paciente com avaliações associadas'
      });
    }

    await query('DELETE FROM pacientes WHERE id = $1', [id]);

    res.json({
      message: 'Paciente deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar paciente:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
