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
      
      whereClause = 'WHERE p.nome ILIKE $1 OR p.cpf ILIKE $1 OR p.cpf ILIKE $2';
      queryParams.push(`%${search}%`, `%${formattedSearch}%`);
    }

    const countQuery = `SELECT COUNT(*) FROM pacientes p ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT 
        p.id, p.nome, p.cpf, p.idade, p.data_nascimento, p.numero_laudo, p.contexto, 
        p.tipo_transito, p.escolaridade, p.telefone, p.email, p.endereco, p.observacoes, 
        p.created_at, p.updated_at,
        (
          SELECT aptidao 
          FROM avaliacoes 
          WHERE paciente_id = p.id AND aptidao IS NOT NULL
          ORDER BY data_aplicacao DESC, created_at DESC 
          LIMIT 1
        ) as ultima_aptidao
      FROM pacientes p
      ${whereClause}
      ORDER BY p.created_at DESC 
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
      'SELECT id, nome, cpf, idade, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefone, email, endereco, observacoes, created_at, updated_at FROM pacientes WHERE id = $1',
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
    const { nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefone, email, endereco, observacoes } = req.body;

    console.log('📝 Dados recebidos:', { nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefone, email, endereco, observacoes });

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

    // Validar formato do número de laudo: LAU-(ano)-xxxx
    if (numero_laudo) {
      const laudoRegex = /^LAU-\d{4}-\d{4}$/;
      if (!laudoRegex.test(numero_laudo)) {
        return res.status(400).json({
          error: 'Número de laudo deve seguir o formato LAU-YYYY-XXXX (ex: LAU-2025-1234)'
        });
      }

      // Verificar se o número de laudo já existe - NÃO PERMITE DUPLICATAS
      const existingLaudo = await query(
        'SELECT id, nome, cpf FROM pacientes WHERE numero_laudo = $1',
        [numero_laudo]
      );

      if (existingLaudo.rows.length > 0) {
        const existing = existingLaudo.rows[0];
        return res.status(400).json({
          error: 'Número de laudo já está em uso',
          details: {
            existing_patient: {
              nome: existing.nome,
              cpf: existing.cpf,
              numero_laudo: numero_laudo
            }
          }
        });
      }
    }

    // Verificar se o telefone já existe - AVISAR MAS PERMITIR
    if (telefone) {
      const existingPhone = await query(
        'SELECT id, nome, cpf, telefone FROM pacientes WHERE telefone = $1',
        [telefone]
      );

      if (existingPhone.rows.length > 0 && !req.body.allow_duplicate_phone) {
        const existing = existingPhone.rows[0];
        return res.status(400).json({
          error: 'Telefone já está associado a outro paciente',
          details: {
            existing_patient: {
              nome: existing.nome,
              cpf: existing.cpf,
              telefone: existing.telefone
            }
          }
        });
      }
    }

    // Verificar se o email já existe - AVISAR MAS PERMITIR
    if (email) {
      const existingEmail = await query(
        'SELECT id, nome, cpf, email FROM pacientes WHERE email = $1',
        [email]
      );

      if (existingEmail.rows.length > 0 && !req.body.allow_duplicate_email) {
        const existing = existingEmail.rows[0];
        return res.status(400).json({
          error: 'Email já está associado a outro paciente',
          details: {
            existing_patient: {
              nome: existing.nome,
              cpf: existing.cpf,
              email: existing.email
            }
          }
        });
      }
    }

    // Verificar se há telefone ou email duplicado para adicionar observação
    if (telefone && req.body.allow_duplicate_phone) {
      const existingPhone = await query(
        'SELECT nome FROM pacientes WHERE telefone = $1',
        [telefone]
      );
      if (existingPhone.rows.length > 0) {
        const existingName = existingPhone.rows[0].nome;
        observacoes = observacoes ? 
          `${observacoes}\n\nNúmero de telefone associado a mais pessoas: ${existingName}` :
          `Número de telefone associado a mais pessoas: ${existingName}`;
      }
    }

    if (email && req.body.allow_duplicate_email) {
      const existingEmail = await query(
        'SELECT nome FROM pacientes WHERE email = $1',
        [email]
      );
      if (existingEmail.rows.length > 0) {
        const existingName = existingEmail.rows[0].nome;
        observacoes = observacoes ? 
          `${observacoes}\n\nEmail associado a mais pessoas: ${existingName}` :
          `Email associado a mais pessoas: ${existingName}`;
      }
    }

    const result = await query(
      'INSERT INTO pacientes (nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefone, email, endereco, observacoes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefone, email, endereco, observacoes, created_at, updated_at',
      [nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefone, email, endereco, observacoes]
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
    const { nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefone, email, endereco, observacoes } = req.body;

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
      'UPDATE pacientes SET nome = $1, cpf = $2, data_nascimento = $3, numero_laudo = $4, contexto = $5, tipo_transito = $6, escolaridade = $7, telefone = $8, email = $9, endereco = $10, observacoes = $11, updated_at = CURRENT_TIMESTAMP WHERE id = $12 RETURNING id, nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefone, email, endereco, observacoes, created_at, updated_at',
      [nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefone, email, endereco, observacoes, id]
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
