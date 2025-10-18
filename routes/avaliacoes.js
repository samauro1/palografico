const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validate, avaliacaoSchema } = require('../middleware/validation');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Listar avaliações
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', paciente_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];

    if (search) {
      whereClause = 'WHERE a.numero_laudo ILIKE $1 OR p.nome ILIKE $1';
      queryParams.push(`%${search}%`);
    }

    if (paciente_id) {
      const paramIndex = queryParams.length + 1;
      whereClause += whereClause ? ` AND a.paciente_id = $${paramIndex}` : 'WHERE a.paciente_id = $1';
      queryParams.push(paciente_id);
    }

    const countQuery = `
      SELECT COUNT(*) 
      FROM avaliacoes a 
      JOIN pacientes p ON a.paciente_id = p.id 
      ${whereClause}
    `;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT 
        a.id, a.numero_laudo, a.data_aplicacao, a.aplicacao, 
        a.tipo_habilitacao, a.observacoes, a.aptidao, a.created_at,
        p.nome as paciente_nome, p.cpf as paciente_cpf,
        u.nome as usuario_nome
      FROM avaliacoes a 
      JOIN pacientes p ON a.paciente_id = p.id 
      JOIN usuarios u ON a.usuario_id = u.id
      ${whereClause}
      ORDER BY a.data_aplicacao DESC, a.created_at DESC 
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;

    const dataResult = await query(dataQuery, [...queryParams, limit, offset]);

    res.json({
      data: {
        avaliacoes: dataResult.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao listar avaliações:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar avaliação por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT 
        a.id, a.paciente_id, a.numero_laudo, a.data_aplicacao, a.aplicacao, 
        a.tipo_habilitacao, a.observacoes, a.aptidao, a.created_at,
        p.nome as paciente_nome, p.cpf as paciente_cpf, p.idade, p.escolaridade,
        u.nome as usuario_nome
      FROM avaliacoes a 
      JOIN pacientes p ON a.paciente_id = p.id 
      JOIN usuarios u ON a.usuario_id = u.id
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Avaliação não encontrada'
      });
    }

    res.json({
      avaliacao: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar avaliação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Criar avaliação
router.post('/', validate(avaliacaoSchema), async (req, res) => {
  try {
    const { paciente_id, numero_laudo, data_aplicacao, aplicacao, tipo_habilitacao, observacoes, aptidao } = req.body;
    const usuario_id = req.user.id;

    // Não mais verificar se laudo existe - agora um laudo pode ter múltiplas avaliações
    // Removida verificação de laudo único

    // Verificar se o paciente existe
    const paciente = await query(
      'SELECT id FROM pacientes WHERE id = $1',
      [paciente_id]
    );

    if (paciente.rows.length === 0) {
      return res.status(400).json({
        error: 'Paciente não encontrado'
      });
    }

    // Converter string vazia para null
    const aptidaoValue = aptidao && aptidao.trim() !== '' ? aptidao : null;
    
    console.log('📋 Criando avaliação com aptidão:', {
      aptidao_original: aptidao,
      aptidao_convertido: aptidaoValue,
      tipo_aptidao: typeof aptidaoValue
    });

    const result = await query(`
      INSERT INTO avaliacoes (paciente_id, usuario_id, numero_laudo, data_aplicacao, aplicacao, tipo_habilitacao, observacoes, aptidao) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING id, numero_laudo, data_aplicacao, aplicacao, tipo_habilitacao, observacoes, aptidao, created_at
    `, [paciente_id, usuario_id, numero_laudo, data_aplicacao, aplicacao, tipo_habilitacao, observacoes, aptidaoValue]);

    res.status(201).json({
      message: 'Avaliação criada com sucesso',
      avaliacao: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Atualizar avaliação
router.put('/:id', validate(avaliacaoSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { paciente_id, numero_laudo, data_aplicacao, aplicacao, tipo_habilitacao, observacoes, aptidao } = req.body;

    // Verificar se a avaliação existe
    const existingAvaliacao = await query(
      'SELECT id FROM avaliacoes WHERE id = $1',
      [id]
    );

    if (existingAvaliacao.rows.length === 0) {
      return res.status(404).json({
        error: 'Avaliação não encontrada'
      });
    }

    // Não mais verificar se laudo está em uso - agora múltiplas avaliações podem ter o mesmo laudo
    // Removida verificação de laudo único

    // Verificar se o paciente existe
    const paciente = await query(
      'SELECT id FROM pacientes WHERE id = $1',
      [paciente_id]
    );

    if (paciente.rows.length === 0) {
      return res.status(400).json({
        error: 'Paciente não encontrado'
      });
    }

    // Converter string vazia para null
    const aptidaoValue = aptidao && aptidao.trim() !== '' ? aptidao : null;

    const result = await query(`
      UPDATE avaliacoes 
      SET paciente_id = $1, numero_laudo = $2, data_aplicacao = $3, 
          aplicacao = $4, tipo_habilitacao = $5, observacoes = $6, 
          aptidao = $7, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $8 
      RETURNING id, numero_laudo, data_aplicacao, aplicacao, tipo_habilitacao, observacoes, aptidao, updated_at
    `, [paciente_id, numero_laudo, data_aplicacao, aplicacao, tipo_habilitacao, observacoes, aptidaoValue, id]);

    res.json({
      message: 'Avaliação atualizada com sucesso',
      avaliacao: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Deletar avaliação
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a avaliação existe
    const existingAvaliacao = await query(
      'SELECT id FROM avaliacoes WHERE id = $1',
      [id]
    );

    if (existingAvaliacao.rows.length === 0) {
      return res.status(404).json({
        error: 'Avaliação não encontrada'
      });
    }

    await query('DELETE FROM avaliacoes WHERE id = $1', [id]);

    res.json({
      message: 'Avaliação deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar avaliação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar testes realizados de uma avaliação
router.get('/:id/testes', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a avaliação existe
    const avaliacaoResult = await query(
      'SELECT id FROM avaliacoes WHERE id = $1',
      [id]
    );
    
    if (avaliacaoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    // Buscar todos os testes realizados para esta avaliação
    const testes = [];

    // Memore
    const memoreResult = await query(
      'SELECT * FROM resultados_memore WHERE avaliacao_id = $1',
      [id]
    );
    if (memoreResult.rows.length > 0) {
      testes.push({
        tipo: 'memore',
        nome: 'Memore - Memória',
        resultado: memoreResult.rows[0]
      });
    }

    // AC
    const acResult = await query(
      'SELECT * FROM resultados_ac WHERE avaliacao_id = $1',
      [id]
    );
    if (acResult.rows.length > 0) {
      testes.push({
        tipo: 'ac',
        nome: 'AC - Atenção Concentrada',
        resultado: acResult.rows[0]
      });
    }

    // BETA-III
    const betaResult = await query(
      'SELECT * FROM resultados_beta_iii WHERE avaliacao_id = $1',
      [id]
    );
    if (betaResult.rows.length > 0) {
      testes.push({
        tipo: 'beta-iii',
        nome: 'BETA-III - Raciocínio Matricial',
        resultado: betaResult.rows[0]
      });
    }

    // BPA-2
    const bpaResult = await query(
      'SELECT * FROM resultados_bpa2 WHERE avaliacao_id = $1 ORDER BY tipo_atencao',
      [id]
    );
    if (bpaResult.rows.length > 0) {
      // Agrupar resultados por modalidade
      const resultados = {};
      bpaResult.rows.forEach(row => {
        resultados[row.tipo_atencao.toLowerCase()] = row;
      });
      
      testes.push({
        tipo: 'bpa2',
        nome: 'BPA-2 - Atenção',
        resultado: resultados
      });
    }

    // Rotas
    const rotasResult = await query(
      'SELECT * FROM resultados_rotas WHERE avaliacao_id = $1',
      [id]
    );
    if (rotasResult.rows.length > 0) {
      testes.push({
        tipo: 'rotas',
        nome: 'Rotas de Atenção',
        resultado: rotasResult.rows[0]
      });
    }

    // MIG
    const migResult = await query(
      'SELECT * FROM resultados_mig WHERE avaliacao_id = $1',
      [id]
    );
    if (migResult.rows.length > 0) {
      testes.push({
        tipo: 'mig',
        nome: 'MIG - Avaliação Psicológica',
        resultado: migResult.rows[0]
      });
    }

    // MVT
    const mvtResult = await query(
      'SELECT * FROM resultados_mvt WHERE avaliacao_id = $1',
      [id]
    );
    if (mvtResult.rows.length > 0) {
      testes.push({
        tipo: 'mvt',
        nome: 'MVT - Memória Visual para o Trânsito',
        resultado: mvtResult.rows[0]
      });
    }

    // R-1
    const r1Result = await query(
      'SELECT * FROM resultados_r1 WHERE avaliacao_id = $1',
      [id]
    );
    if (r1Result.rows.length > 0) {
      testes.push({
        tipo: 'r1',
        nome: 'R-1 - Raciocínio',
        resultado: r1Result.rows[0]
      });
    }

    // Palográfico
    const palograficoResult = await query(
      'SELECT * FROM resultados_palografico WHERE avaliacao_id = $1',
      [id]
    );
    if (palograficoResult.rows.length > 0) {
      testes.push({
        tipo: 'palografico',
        nome: 'Palográfico',
        resultado: palograficoResult.rows[0]
      });
    }

    res.json({
      data: {
        testes
      }
    });
  } catch (error) {
    console.error('Erro ao buscar testes da avaliação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
