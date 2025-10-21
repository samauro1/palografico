const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { validate, pacienteSchema } = require('../middleware/validation');
const RenachProcessor = require('../utils/renachProcessor');

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

    // Filtro por usuário (exceto admin)
    if (!isAdmin(req.user)) {
      whereClause = 'WHERE p.usuario_id = $1';
      queryParams.push(req.user.id);
    }

    if (search) {
      // Busca flexível: nome, CPF formatado ou CPF sem formatação
      const cleanSearch = search.replace(/\D/g, ''); // Remove formatação
      const formattedSearch = cleanSearch.length === 11 ? 
        cleanSearch.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : search;
      
      const searchCondition = `(p.nome ILIKE $${queryParams.length + 1} OR p.cpf ILIKE $${queryParams.length + 1} OR p.cpf ILIKE $${queryParams.length + 2})`;
      whereClause = whereClause ? `${whereClause} AND ${searchCondition}` : `WHERE ${searchCondition}`;
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
        p.numero_renach, p.sexo, p.categoria_cnh, p.nome_pai, p.nome_mae, 
        p.naturalidade, p.nacionalidade, p.rg, p.orgao_expedidor_rg, p.uf_rg, 
        p.tipo_documento_rg, p.resultado_exame, p.data_exame, p.numero_laudo_renach, 
        p.crp_renach, p.credenciado_renach, p.regiao_renach,
        p.logradouro, p.numero_endereco, p.bairro, p.cep, p.municipio,
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

    // Montar query com filtro de usuário se não for admin
    let queryText = `SELECT id, nome, cpf, idade, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefone, email, endereco, observacoes, 
                     created_at, updated_at, usuario_id,
                     numero_renach, sexo, categoria_cnh, nome_pai, nome_mae, 
                     naturalidade, nacionalidade, rg, orgao_expedidor_rg, uf_rg, 
                     tipo_documento_rg, resultado_exame, data_exame, numero_laudo_renach, 
                     crp_renach, credenciado_renach, regiao_renach,
                     logradouro, numero_endereco, bairro, cep, municipio
                     FROM pacientes WHERE id = $1`;
    let queryParams = [id];

    if (!isAdmin(req.user)) {
      queryText += ' AND usuario_id = $2';
      queryParams.push(req.user.id);
    }

    const result = await query(queryText, queryParams);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Paciente não encontrado ou você não tem permissão para acessá-lo'
      });
    }

    res.json({
      data: result.rows[0]
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
    let { nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefone, email, endereco, observacoes } = req.body;

    // Normalizar campos vazios: converter strings vazias para null
    if (data_nascimento === '' || data_nascimento === undefined) data_nascimento = null;
    if (escolaridade === '' || escolaridade === undefined) escolaridade = null;
    if (numero_laudo === '' || numero_laudo === undefined) numero_laudo = null;
    if (contexto === '' || contexto === undefined) contexto = null;
    if (tipo_transito === '' || tipo_transito === undefined) tipo_transito = null;
    if (telefone === '' || telefone === undefined) telefone = null;
    if (email === '' || email === undefined) email = null;
    if (endereco === '' || endereco === undefined) endereco = null;
    if (observacoes === '' || observacoes === undefined) observacoes = null;

    console.log('📝 Dados recebidos:', { nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefone, email, endereco, observacoes });
    
    // Processar múltiplos telefones se necessário
    let telefonesProcessados = telefone;
    if (telefone && (telefone.includes(' ') || telefone.includes('/')) && !telefone.includes('(')) {
      // Detecta formatos "2345-6854 9484-3428" ou "2345-6854 / 9484-3428"
      console.log('📱 Detectado múltiplos telefones:', telefone);
      
      let telefones = [];
      
      // Se tem barra, dividir por barra
      if (telefone.includes('/')) {
        telefones = telefone.split('/').map(tel => tel.trim());
      } else {
        // Se tem espaço, dividir por espaço
        telefones = telefone.split(' ').map(tel => tel.trim());
      }
      
      const telefonesProcessados = telefones.map(tel => {
        const numerico = tel.replace(/\D/g, '');
        // Se tem 8 dígitos, adiciona DDD 11
        if (numerico.length === 8) {
          return `11${numerico}`;
        }
        // Se tem 9 dígitos, adiciona DDD 11  
        if (numerico.length === 9) {
          return `11${numerico}`;
        }
        return numerico;
      }).filter(tel => tel.length >= 8);
      
      // Salva como JSON string para múltiplos telefones
      telefonesProcessados = JSON.stringify(telefonesProcessados);
      console.log('📱 Telefones processados:', telefonesProcessados);
    }

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

      // Verificar se o número de laudo já existe PARA ESTE USUÁRIO
      // Cada usuário tem sua própria numeração de laudos
      const existingLaudo = await query(
        'SELECT id, nome, cpf FROM pacientes WHERE numero_laudo = $1 AND usuario_id = $2',
        [numero_laudo, req.user.id]
      );

      if (existingLaudo.rows.length > 0) {
        const existing = existingLaudo.rows[0];
        return res.status(400).json({
          error: 'Você já possui um paciente com este número de laudo',
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

    // Verificar se o telefone já existe PARA ESTE USUÁRIO - AVISAR MAS PERMITIR
    if (telefone) {
      const existingPhone = await query(
        'SELECT id, nome, cpf, telefone FROM pacientes WHERE telefone = $1 AND usuario_id = $2',
        [telefone, req.user.id]
      );

      if (existingPhone.rows.length > 0 && !req.body.allow_duplicate_phone) {
        const existing = existingPhone.rows[0];
        return res.status(400).json({
          error: 'Você já possui outro paciente com este telefone',
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

    // Verificar se o email já existe PARA ESTE USUÁRIO - AVISAR MAS PERMITIR
    if (email) {
      const existingEmail = await query(
        'SELECT id, nome, cpf, email FROM pacientes WHERE email = $1 AND usuario_id = $2',
        [email, req.user.id]
      );

      if (existingEmail.rows.length > 0 && !req.body.allow_duplicate_email) {
        const existing = existingEmail.rows[0];
        return res.status(400).json({
          error: 'Você já possui outro paciente com este email',
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

    // Atribuir paciente ao usuário logado
    const usuarioId = req.user.id;

    const result = await query(
      'INSERT INTO pacientes (nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefone, email, endereco, observacoes, usuario_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id, nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefone, email, endereco, observacoes, usuario_id, created_at, updated_at',
      [nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefonesProcessados, email, endereco, observacoes, usuarioId]
    );

    console.log(`✅ Paciente criado e atribuído ao usuário ID ${usuarioId}`);

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
    console.log('📝 PUT /pacientes/:id - Body recebido:', JSON.stringify(req.body, null, 2));
    let { nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefone, email, endereco, observacoes } = req.body;
    
    // Normalizar CPF: garantir formato 000.000.000-00
    if (cpf && typeof cpf === 'string' && cpf.length === 11 && /^\d{11}$/.test(cpf)) {
      cpf = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      console.log('📝 CPF normalizado de', req.body.cpf, 'para', cpf);
    } else {
      console.log('📝 CPF já está formatado ou inválido:', cpf);
    }

    // Normalizar campos vazios: converter strings vazias para null
    if (data_nascimento === '' || data_nascimento === undefined) {
      data_nascimento = null;
      console.log('📝 Data de nascimento vazia, convertida para null');
    }
    if (escolaridade === '' || escolaridade === undefined) {
      escolaridade = null;
    }
    if (numero_laudo === '' || numero_laudo === undefined) {
      numero_laudo = null;
    }
    if (contexto === '' || contexto === undefined) {
      contexto = null;
    }
    if (tipo_transito === '' || tipo_transito === undefined) {
      tipo_transito = null;
    }
    if (telefone === '' || telefone === undefined) {
      telefone = null;
    }
    if (email === '' || email === undefined) {
      email = null;
    }
    if (endereco === '' || endereco === undefined) {
      endereco = null;
    }
    if (observacoes === '' || observacoes === undefined) {
      observacoes = null;
    }

    // Verificar se o paciente existe e se o usuário tem permissão para editá-lo
    let checkQuery = 'SELECT id, usuario_id FROM pacientes WHERE id = $1';
    let checkParams = [id];

    if (!isAdmin(req.user)) {
      checkQuery += ' AND usuario_id = $2';
      checkParams.push(req.user.id);
    }

    const existingPaciente = await query(checkQuery, checkParams);

    if (existingPaciente.rows.length === 0) {
      return res.status(404).json({
        error: 'Paciente não encontrado ou você não tem permissão para editá-lo'
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

    // Verificar se o número de laudo já existe PARA ESTE USUÁRIO
    if (numero_laudo) {
      const laudoCheck = await query(
        'SELECT id, nome FROM pacientes WHERE numero_laudo = $1 AND usuario_id = $2 AND id != $3',
        [numero_laudo, req.user.id, id]
      );

      if (laudoCheck.rows.length > 0) {
        return res.status(400).json({
          error: 'Você já possui outro paciente com este número de laudo',
          details: {
            existing_patient: laudoCheck.rows[0].nome
          }
        });
      }
    }

    // Processar múltiplos telefones se necessário
    let telefonesProcessados = telefone;
    if (telefone && (telefone.includes(' ') || telefone.includes('/')) && !telefone.includes('(')) {
      // Detecta formatos "2345-6854 9484-3428" ou "2345-6854 / 9484-3428"
      console.log('📱 Detectado múltiplos telefones na atualização:', telefone);
      
      let telefones = [];
      
      // Se tem barra, dividir por barra
      if (telefone.includes('/')) {
        telefones = telefone.split('/').map(tel => tel.trim());
      } else {
        // Se tem espaço, dividir por espaço
        telefones = telefone.split(' ').map(tel => tel.trim());
      }
      
      const telefonesProcessados = telefones.map(tel => {
        const numerico = tel.replace(/\D/g, '');
        // Se tem 8 dígitos, adiciona DDD 11
        if (numerico.length === 8) {
          return `11${numerico}`;
        }
        // Se tem 9 dígitos, adiciona DDD 11  
        if (numerico.length === 9) {
          return `11${numerico}`;
        }
        return numerico;
      }).filter(tel => tel.length >= 8);
      
      // Salva como JSON string para múltiplos telefones
      telefonesProcessados = JSON.stringify(telefonesProcessados);
      console.log('📱 Telefones processados na atualização:', telefonesProcessados);
    }

    const result = await query(
      'UPDATE pacientes SET nome = $1, cpf = $2, data_nascimento = $3, numero_laudo = $4, contexto = $5, tipo_transito = $6, escolaridade = $7, telefone = $8, email = $9, endereco = $10, observacoes = $11, updated_at = CURRENT_TIMESTAMP WHERE id = $12 RETURNING id, nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefone, email, endereco, observacoes, created_at, updated_at',
      [nome, cpf, data_nascimento, numero_laudo, contexto, tipo_transito, escolaridade, telefonesProcessados, email, endereco, observacoes, id]
    );

    res.json({
      message: 'Paciente atualizado com sucesso',
      paciente: result.rows[0]
    });
  } catch (error) {
    console.error('❌ ERRO ao atualizar paciente:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Mensagem:', error.message);
    res.status(500).json({
      error: 'Erro interno do servidor',
      detalhes: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Deletar paciente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se o paciente existe e se o usuário tem permissão para deletá-lo
    let checkQuery = 'SELECT id, usuario_id FROM pacientes WHERE id = $1';
    let checkParams = [id];

    if (!isAdmin(req.user)) {
      checkQuery += ' AND usuario_id = $2';
      checkParams.push(req.user.id);
    }

    const existingPaciente = await query(checkQuery, checkParams);

    if (existingPaciente.rows.length === 0) {
      return res.status(404).json({
        error: 'Paciente não encontrado ou você não tem permissão para deletá-lo'
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

// Upload de arquivo RENACH (PDF em base64)
router.put('/:id/renach', async (req, res) => {
  try {
    const { id } = req.params;
    const { renach_arquivo } = req.body;

    // Verificar permissão
    if (!isAdmin(req.user)) {
      const paciente = await query(
        'SELECT usuario_id FROM pacientes WHERE id = $1',
        [id]
      );
      
      if (paciente.rows.length === 0) {
        return res.status(404).json({ error: 'Paciente não encontrado' });
      }
      
      if (paciente.rows[0].usuario_id !== req.user.id) {
        return res.status(403).json({ error: 'Sem permissão para atualizar este paciente' });
      }
    }

    // Processar RENACH para extrair dados automaticamente
    const processor = new RenachProcessor();
    const processResult = await processor.processRenach(renach_arquivo);
    
    console.log('📊 Resultado do processamento:', {
      success: processResult.success,
      hasFoto: !!processResult.data?.foto,
      fotoLength: processResult.data?.foto?.length,
      dataKeys: Object.keys(processResult.data || {})
    });
    
    let renach_foto = null;
    let extractedData = {};
    
    if (processResult.success) {
      renach_foto = processResult.data.foto;
      extractedData = processResult.data;
      
      console.log('✅ RENACH foto extraída:', renach_foto ? `Sim (${renach_foto.substring(0, 50)}...)` : 'Não');
      
      // Atualizar dados do paciente com informações extraídas
      if (Object.keys(extractedData).length > 0) {
        const updateFields = [];
        const updateValues = [];
        let paramCount = 1;
        
        // Buscar dados atuais do paciente para evitar sobrescrever
        const currentPatient = await query(
          'SELECT cpf, nome FROM pacientes WHERE id = $1',
          [id]
        );
        
        // Mapear todos os campos extraídos para colunas do banco
        // Não atualizar CPF ou nome se já existirem
        const fieldMapping = {
          numero_renach: 'numero_renach',
          // nome: 'nome', // Comentado: não sobrescrever nome existente
          // cpf: 'cpf', // Comentado: não sobrescrever CPF existente
          data_nascimento: 'data_nascimento',
          sexo: 'sexo',
          categoria_cnh: 'categoria_cnh',
          nome_pai: 'nome_pai',
          nome_mae: 'nome_mae',
          naturalidade: 'naturalidade',
          nacionalidade: 'nacionalidade',
          logradouro: 'logradouro',
          numero_endereco: 'numero_endereco',
          bairro: 'bairro',
          cep: 'cep',
          municipio: 'municipio',
          resultado_exame: 'resultado_exame',
          data_exame: 'data_exame',
          numero_laudo_renach: 'numero_laudo_renach',
          crp_renach: 'crp_renach',
          credenciado_renach: 'credenciado_renach',
          regiao_renach: 'regiao_renach',
          rg: 'rg',
          orgao_expedidor_rg: 'orgao_expedidor_rg',
          uf_rg: 'uf_rg',
          tipo_documento_rg: 'tipo_documento_rg'
        };
        
        // Adicionar campos que existem nos dados extraídos
        for (const [extractedField, dbField] of Object.entries(fieldMapping)) {
          if (extractedData[extractedField]) {
            updateFields.push(`${dbField} = $${paramCount++}`);
            updateValues.push(extractedData[extractedField]);
          }
        }
        
        // Atualizar endereço completo se temos dados de endereço
        if (extractedData.logradouro || extractedData.bairro || extractedData.municipio) {
          const enderecoCompleto = [
            extractedData.logradouro,
            extractedData.numero_endereco,
            extractedData.bairro,
            extractedData.municipio,
            extractedData.cep
          ].filter(Boolean).join(', ');
          
          if (enderecoCompleto) {
            updateFields.push(`endereco = $${paramCount++}`);
            updateValues.push(enderecoCompleto);
          }
        }
        
        if (updateFields.length > 0) {
          updateValues.push(id);
          await query(
            `UPDATE pacientes SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`,
            updateValues
          );
        }
      }
    }

    // Salvar RENACH no banco
    console.log('💾 Salvando RENACH:', {
      arquivoLength: renach_arquivo?.length,
      fotoLength: renach_foto?.length,
      pacienteId: id
    });
    
    await query(
      `UPDATE pacientes 
       SET renach_arquivo = $1, 
           renach_foto = $2,
           renach_data_upload = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [renach_arquivo, renach_foto, id]
    );
    
    console.log('✅ RENACH salvo no banco com sucesso!');

    res.json({
      message: 'Arquivo RENACH salvo com sucesso',
      data: {
        renach_data_upload: new Date(),
        extracted_data: extractedData,
        processing_success: processResult.success
      }
    });
  } catch (error) {
    console.error('❌ Erro ao salvar arquivo RENACH:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Mensagem:', error.message);
    res.status(500).json({
      error: 'Erro ao salvar arquivo RENACH',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Obter arquivo RENACH
router.get('/:id/renach', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar permissão
    if (!isAdmin(req.user)) {
      const paciente = await query(
        'SELECT usuario_id FROM pacientes WHERE id = $1',
        [id]
      );
      
      if (paciente.rows.length === 0) {
        return res.status(404).json({ error: 'Paciente não encontrado' });
      }
      
      if (paciente.rows[0].usuario_id !== req.user.id) {
        return res.status(403).json({ error: 'Sem permissão para visualizar este paciente' });
      }
    }

    const result = await query(
      'SELECT renach_arquivo, renach_foto, renach_data_upload FROM pacientes WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }

    res.json({
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar arquivo RENACH:', error);
    res.status(500).json({
      error: 'Erro ao buscar arquivo RENACH'
    });
  }
});

module.exports = router;
