const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Mapeamento de consumo de folhas por teste
const CONSUMO_ESTOQUE = {
  'memore': { quantidade: 1, descricao: '1 folha de Memore' },
  'mig': { quantidade: 1, descricao: '1 folha de MIG' },
  'r1': { quantidade: 1, descricao: '1 folha de R-1' },
  'ac': { quantidade: 1, descricao: '1 folha de AC' },
  'beta-iii': { quantidade: 1, descricao: '1 folha de BETA-III' },
  'bpa2': { quantidade: 1, descricao: '1 folha de BPA-2' },
  'mvt': { quantidade: 1, descricao: '1 folha de MVT' },
  'palografico': { quantidade: 1, descricao: '1 folha de Palográfico' },
  'rotas': { quantidade: 3, descricao: '3 folhas (Concentrada + Alternada + Dividida)' }
};

// Função para descontar estoque de um teste
async function descontarEstoqueTeste(tipoTeste, avaliacaoId, usuarioId) {
  try {
    console.log(`🔍 Iniciando desconto de estoque: tipo=${tipoTeste}, avaliacao=${avaliacaoId}, usuario=${usuarioId}`);
    
    const consumo = CONSUMO_ESTOQUE[tipoTeste];
    if (!consumo) {
      console.log(`⚠️ Tipo de teste '${tipoTeste}' não encontrado no mapeamento de estoque`);
      return { success: false, message: 'Teste não mapeado' };
    }
    
    console.log(`📋 Consumo mapeado: ${consumo.quantidade} folha(s) - ${consumo.descricao}`);

    // Buscar o ID do item de estoque pelo nome do teste
    const nomeTesteMap = {
      'memore': 'Memore - Memória',
      'mig': 'MIG - Avaliação Psicológica',
      'r1': 'R-1 - Raciocínio',
      'ac': 'AC - Atenção Concentrada',
      'beta-iii': 'BETA-III - Raciocínio Matricial',
      'bpa2': 'BPA-2 - Atenção',
      'mvt': 'MVT - Memória Visual',
      'palografico': 'Palográfico',
      'rotas': 'Rotas de Atenção'
    };

    const nomeTeste = nomeTesteMap[tipoTeste];
    if (!nomeTeste) {
      console.log(`⚠️ Nome de teste não encontrado para '${tipoTeste}'`);
      return { success: false, message: 'Nome de teste não encontrado' };
    }
    
    console.log(`🔍 Buscando no estoque: "${nomeTeste}"`);

    // Buscar item do estoque
    const estoqueResult = await query(
      'SELECT id, quantidade_atual FROM testes_estoque WHERE nome_teste = $1 AND ativo = true',
      [nomeTeste]
    );

    if (estoqueResult.rows.length === 0) {
      console.log(`⚠️ Item de estoque '${nomeTeste}' não encontrado`);
      return { success: false, message: 'Item de estoque não encontrado' };
    }

    const estoqueItem = estoqueResult.rows[0];
    console.log(`📊 Estoque encontrado: ID=${estoqueItem.id}, Quantidade Atual=${estoqueItem.quantidade_atual}`);
    
    const novaQuantidade = estoqueItem.quantidade_atual - consumo.quantidade;
    console.log(`🧮 Cálculo: ${estoqueItem.quantidade_atual} - ${consumo.quantidade} = ${novaQuantidade}`);

    if (novaQuantidade < 0) {
      console.log(`❌ Estoque insuficiente para ${nomeTeste}: atual=${estoqueItem.quantidade_atual}, necessário=${consumo.quantidade}`);
      return { 
        success: false, 
        message: `Estoque insuficiente de ${nomeTeste}. Disponível: ${estoqueItem.quantidade_atual}, Necessário: ${consumo.quantidade}` 
      };
    }

    // Atualizar estoque
    console.log(`💾 Atualizando estoque: ID=${estoqueItem.id}, Nova Quantidade=${novaQuantidade}`);
    await query(
      'UPDATE testes_estoque SET quantidade_atual = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [novaQuantidade, estoqueItem.id]
    );

    // Registrar movimentação vinculada à avaliação
    console.log(`📝 Registrando movimentação: teste_id=${estoqueItem.id}, avaliacao_id=${avaliacaoId}, quantidade=${consumo.quantidade}`);
    await query(`
      INSERT INTO movimentacoes_estoque (teste_id, tipo_movimentacao, quantidade, observacoes, usuario_id, avaliacao_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      estoqueItem.id,
      'saida',
      consumo.quantidade,
      `Aplicação de teste ${nomeTeste} - Avaliação #${avaliacaoId}`,
      usuarioId,
      avaliacaoId
    ]);

    console.log(`✅ Estoque descontado: ${nomeTeste} - ${consumo.quantidade} folha(s). Novo saldo: ${novaQuantidade}`);
    
    return { 
      success: true, 
      message: `Estoque atualizado: ${nomeTeste}`,
      quantidade_descontada: consumo.quantidade,
      novo_saldo: novaQuantidade
    };
  } catch (error) {
    console.error('❌ Erro ao descontar estoque:', error);
    return { success: false, message: error.message };
  }
}


// Listar todas as tabelas normativas
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT id, nome, tipo, versao, criterio, descricao, ativa, created_at 
      FROM tabelas_normativas 
      WHERE ativa = true 
      ORDER BY nome
    `);

    res.json({
      tabelas: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar tabelas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Buscar tabela específica
router.get('/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params;

    // Buscar tabela normativa
    const tabelaResult = await query(`
      SELECT id, nome, tipo, versao, ativa 
      FROM tabelas_normativas 
      WHERE tipo = $1 AND ativa = true
    `, [tipo]);

    if (tabelaResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Tabela normativa não encontrada'
      });
    }

    const tabela = tabelaResult.rows[0];
    let normas = [];

    // Buscar normas específicas baseadas no tipo
    switch (tipo) {
      case 'ac':
        const acResult = await query(`
          SELECT classificacao, percentil, fundamental_min, fundamental_max, 
                 medio_min, medio_max, superior_min, superior_max
          FROM normas_ac 
          WHERE tabela_id = $1 
          ORDER BY percentil DESC
        `, [tabela.id]);
        normas = acResult.rows;
        break;

      case 'beta-iii':
        const betaResult = await query(`
          SELECT acertos_min, acertos_max, percentil, classificacao
          FROM normas_beta_iii 
          WHERE tabela_id = $1 
          ORDER BY acertos_min
        `, [tabela.id]);
        normas = betaResult.rows;
        break;

      case 'bpa2':
        const bpaResult = await query(`
          SELECT tipo_atencao, criterio, valor_criterio, pontos_min, pontos_max, percentil, classificacao
          FROM normas_bpa2 
          WHERE tabela_id = $1 
          ORDER BY tipo_atencao, pontos_min
        `, [tabela.id]);
        normas = bpaResult.rows;
        break;

      case 'rotas':
        const rotasResult = await query(`
          SELECT rota_tipo, pontos_min, pontos_max, percentil, classificacao
          FROM normas_rotas 
          WHERE tabela_id = $1 
          ORDER BY rota_tipo, pontos_min
        `, [tabela.id]);
        normas = rotasResult.rows;
        break;

      case 'mig':
        const migResult = await query(`
          SELECT tipo_avaliacao, acertos_min, acertos_max, percentil, classificacao
          FROM normas_mig 
          WHERE tabela_id = $1 
          ORDER BY tipo_avaliacao, acertos_min
        `, [tabela.id]);
        normas = migResult.rows;
        break;

      case 'mvt':
        const mvtResult = await query(`
          SELECT tipo_cnh, resultado_min, resultado_max, percentil, classificacao
          FROM normas_mvt 
          WHERE tabela_id = $1 
          ORDER BY tipo_cnh, resultado_min
        `, [tabela.id]);
        normas = mvtResult.rows;
        break;

      case 'r1':
        const r1Result = await query(`
          SELECT escolaridade, acertos_min, acertos_max, percentil, classificacao
          FROM normas_r1 
          WHERE tabela_id = $1 
          ORDER BY escolaridade, acertos_min
        `, [tabela.id]);
        normas = r1Result.rows;
        break;

      case 'memore':
        const memoreResult = await query(`
          SELECT resultado_min, resultado_max, percentil, classificacao
          FROM normas_memore 
          WHERE tabela_id = $1 
          ORDER BY resultado_min
        `, [tabela.id]);
        normas = memoreResult.rows;
        break;

      default:
        return res.status(400).json({
          error: 'Tipo de tabela não suportado'
        });
    }

    res.json({
      tabela,
      normas
    });
  } catch (error) {
    console.error('Erro ao buscar tabela:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Calcular resultado baseado nas normas
router.post('/:tipo/calculate', async (req, res) => {
  try {
    const { tipo } = req.params;
    const dados = req.body;

    // Buscar tabela normativa
    let tabelaId;
    
    // Se tabela_id foi fornecido no body, usar ele
    if (dados.tabela_id) {
      const tabelaResult = await query(`
        SELECT id FROM tabelas_normativas 
        WHERE id = $1 AND tipo = $2 AND ativa = true
      `, [dados.tabela_id, tipo]);
      
      if (tabelaResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Tabela normativa não encontrada'
        });
      }
      
      tabelaId = tabelaResult.rows[0].id;
    } else {
      // Caso contrário, buscar a primeira tabela ativa do tipo
      const tabelaResult = await query(`
        SELECT id FROM tabelas_normativas 
        WHERE tipo = $1 AND ativa = true
      `, [tipo]);

      if (tabelaResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Tabela normativa não encontrada'
        });
      }

      tabelaId = tabelaResult.rows[0].id;
    }
    let resultado = {};

    switch (tipo) {
      case 'ac':
        resultado = await calcularAC(tabelaId, dados);
        break;
      case 'beta-iii':
        resultado = await calcularBetaIII(tabelaId, dados);
        break;
      case 'bpa2':
        resultado = await calcularBPA2(tabelaId, dados);
        break;
      case 'rotas':
        resultado = await calcularRotas(tabelaId, dados);
        break;
      case 'mig':
        resultado = await calcularMIG(tabelaId, dados);
        break;
      case 'mvt':
        resultado = await calcularMVT(tabelaId, dados);
        break;
      case 'r1':
        resultado = await calcularR1(tabelaId, dados);
        break;
      case 'memore':
        resultado = await calcularMemore(tabelaId, dados);
        break;
      default:
        return res.status(400).json({
          error: 'Tipo de cálculo não suportado'
        });
    }

    // Se a análise for vinculada, salvar no banco de dados
    console.log('🔍 Verificando salvamento:', {
      analysisType: dados.analysisType,
      hasPatientData: !!dados.patientData,
      hasFoundPatient: !!(dados.patientData && dados.patientData.foundPatient)
    });
    
    if (dados.analysisType === 'linked' && dados.patientData && dados.patientData.foundPatient) {
      try {
        console.log('💾 Salvando resultado vinculado...');
        console.log('📋 Dados do paciente:', dados.patientData.foundPatient);
        console.log('📋 Dados da avaliação:', {
          data_avaliacao: dados.patientData.data_avaliacao,
          numero_laudo: dados.patientData.numero_laudo
        });
        
        // Criar ou buscar avaliação
        const avaliacao = await criarOuBuscarAvaliacao(
          dados.patientData.foundPatient, 
          req.user.id,
          dados.patientData.data_avaliacao,
          dados.patientData.numero_laudo
        );
        
        console.log('📋 Avaliação encontrada/criada:', avaliacao);
        
        // Salvar resultado específico do teste
        console.log('📊 Resultado a ser salvo:', resultado);
        const descontarEstoque = dados.descontarEstoque !== false; // Por padrão true
        console.log('📦 Flag descontarEstoque recebida do frontend:', dados.descontarEstoque);
        console.log('📦 Flag descontarEstoque processada:', descontarEstoque);
        console.log('📦 Usuario ID:', req.user.id);
        await salvarResultadoTeste(tipo, avaliacao.id, dados, resultado, descontarEstoque, req.user.id);
        
        resultado.avaliacao_id = avaliacao.id;
        resultado.salvo = true;
        console.log(`✅ Resultado do teste ${tipo} salvo na avaliação ${avaliacao.id}`);
      } catch (error) {
        console.error('❌ Erro ao salvar resultado vinculado:', error);
        // Continua retornando o resultado mesmo se não conseguir salvar
      }
    } else {
      console.log('⚠️ Não salvando - análise não vinculada ou dados incompletos');
    }

    res.json({
      resultado
    });
  } catch (error) {
    console.error('Erro ao calcular resultado:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// Funções auxiliares para salvar resultados vinculados
async function criarOuBuscarAvaliacao(paciente, usuarioId, dataAvaliacao, numeroLaudo) {
  // Usar a data fornecida ou a data atual como fallback
  const data = dataAvaliacao || new Date().toISOString().split('T')[0];
  
  // Verificar se já existe uma avaliação para este paciente + laudo + data
  // Um laudo pode ter múltiplas avaliações em datas diferentes
  const avaliacaoExistente = await query(`
    SELECT id FROM avaliacoes 
    WHERE paciente_id = $1 AND numero_laudo = $2 AND DATE(data_aplicacao) = $3
    ORDER BY created_at DESC 
    LIMIT 1
  `, [paciente.id, numeroLaudo, data]);
  
  if (avaliacaoExistente.rows.length > 0) {
    console.log('📋 Avaliação existente encontrada:', avaliacaoExistente.rows[0]);
    return avaliacaoExistente.rows[0];
  }
  
  // Criar nova avaliação
  // Agora o mesmo laudo pode ter múltiplas avaliações (sem constraint UNIQUE)
  const laudo = numeroLaudo || `LAU-${new Date().getFullYear()}-${String(paciente.id).padStart(4, '0')}-${String(Date.now()).slice(-4)}`;
  
  console.log('📝 Criando nova avaliação:', { paciente_id: paciente.id, numero_laudo: laudo, data });
  
  const novaAvaliacao = await query(`
    INSERT INTO avaliacoes (paciente_id, usuario_id, numero_laudo, data_aplicacao, aplicacao, tipo_habilitacao)
    VALUES ($1, $2, $3, $4, 'Individual', 'Psicológica')
    RETURNING id
  `, [paciente.id, usuarioId, laudo, data]);
  
  console.log('✅ Nova avaliação criada:', novaAvaliacao.rows[0]);
  return novaAvaliacao.rows[0];
}

async function salvarResultadoTeste(tipo, avaliacaoId, dados, resultado, descontarEstoque = true, usuarioId = null) {
  switch (tipo) {
    case 'mig':
      console.log('💾 Salvando MIG:', {
        avaliacaoId,
        tipo_avaliacao: 'geral',
        acertos: dados.acertos,
        percentil: resultado.percentil,
        classificacao: resultado.classificacao
      });
      
      await query(`
        INSERT INTO resultados_mig (avaliacao_id, tipo_avaliacao, acertos, percentil, classificacao)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        avaliacaoId,
        'geral', // tipo_avaliacao obrigatório
        dados.acertos,
        resultado.percentil,
        resultado.classificacao
      ]);
      break;
    case 'memore':
      await query(`
        INSERT INTO resultados_memore (avaliacao_id, vp, vn, fn, fp, resultado_final, percentil, classificacao)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        avaliacaoId,
        dados.vp,
        dados.vn,
        dados.fn,
        dados.fp,
        resultado.resultado_final || 0,
        resultado.percentil,
        resultado.classificacao
      ]);
      break;
    case 'ac':
      console.log('💾 Salvando AC:', {
        avaliacaoId,
        acertos: dados.acertos,
        erros: dados.erros,
        omissoes: dados.omissoes,
        pb: resultado.pb,
        percentil: resultado.percentil,
        classificacao: resultado.classificacao
      });
      
      await query(`
        INSERT INTO resultados_ac (avaliacao_id, acertos, erros, omissoes, pb, percentil, classificacao)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        avaliacaoId,
        dados.acertos,
        dados.erros,
        dados.omissoes,
        resultado.pb,
        resultado.percentil,
        resultado.classificacao
      ]);
      break;
    case 'beta-iii':
      console.log('💾 Salvando BETA-III:', {
        avaliacaoId,
        acertos: dados.acertos,
        erros: dados.erros || 0,
        omissao: dados.omissao || 0,
        resultado_final: resultado.resultado_final,
        percentil: resultado.percentil,
        classificacao: resultado.classificacao
      });
      
      await query(`
        INSERT INTO resultados_beta_iii (avaliacao_id, acertos, erros, omissao, resultado_final, percentil, classificacao)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        avaliacaoId,
        dados.acertos,
        dados.erros || 0,
        dados.omissao || 0,
        resultado.resultado_final || 0, // Fallback para evitar null
        resultado.percentil,
        resultado.classificacao
      ]);
      break;
    case 'bpa2':
      await query(`
        INSERT INTO resultados_bpa2 (avaliacao_id, tipo_atencao, acertos, erros, omissoes, pontos, percentil, classificacao)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        avaliacaoId,
        'Sustentada',
        dados.acertos_sustentada,
        dados.erros_sustentada,
        dados.omissoes_sustentada,
        resultado.sustentada.pontos,
        resultado.sustentada.percentil,
        resultado.sustentada.classificacao
      ]);
      
      await query(`
        INSERT INTO resultados_bpa2 (avaliacao_id, tipo_atencao, acertos, erros, omissoes, pontos, percentil, classificacao)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        avaliacaoId,
        'Alternada',
        dados.acertos_alternada,
        dados.erros_alternada,
        dados.omissoes_alternada,
        resultado.alternada.pontos,
        resultado.alternada.percentil,
        resultado.alternada.classificacao
      ]);
      
      await query(`
        INSERT INTO resultados_bpa2 (avaliacao_id, tipo_atencao, acertos, erros, omissoes, pontos, percentil, classificacao)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        avaliacaoId,
        'Dividida',
        dados.acertos_dividida,
        dados.erros_dividida,
        dados.omissoes_dividida,
        resultado.dividida.pontos,
        resultado.dividida.percentil,
        resultado.dividida.classificacao
      ]);
      
      await query(`
        INSERT INTO resultados_bpa2 (avaliacao_id, tipo_atencao, acertos, erros, omissoes, pontos, percentil, classificacao)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        avaliacaoId,
        'Geral',
        0, // Não há acertos/erros/omissões para a média geral
        0,
        0,
        resultado.geral.pontos,
        resultado.geral.percentil,
        resultado.geral.classificacao
      ]);
      break;
    case 'palografico':
      await query(`
        INSERT INTO resultados_palografico (avaliacao_id, produtividade, nor, distancia_media, media_tamanho_palos, 
          impulsividade, media_distancia_linhas, media_margem_esquerda, media_margem_direita, 
          media_margem_superior, porcentagem_ganchos, media_inclinacao, media_direcao_linhas, total_emotividade)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        avaliacaoId,
        dados.produtividade,
        dados.nor,
        dados.distancia_media,
        dados.media_tamanho_palos,
        dados.impulsividade,
        dados.media_distancia_linhas,
        dados.media_margem_esquerda,
        dados.media_margem_direita,
        dados.media_margem_superior,
        dados.porcentagem_ganchos,
        dados.media_inclinacao,
        dados.media_direcao_linhas,
        dados.total_emotividade
      ]);
      break;
    case 'rotas':
      // Salvar resultados para cada tipo de rota
      for (const [tipoRota, dadosRota] of Object.entries(resultado)) {
        if (tipoRota === 'geral') continue; // Pular o resultado geral
        
        await query(`
          INSERT INTO resultados_rotas (avaliacao_id, rota_tipo, acertos, erros, omissoes, pb, percentil, classificacao)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          avaliacaoId,
          tipoRota.toUpperCase(),
          dadosRota.acertos,
          dadosRota.erros,
          dadosRota.omissoes,
          dadosRota.pb,
          dadosRota.percentil,
          dadosRota.classificacao
        ]);
      }
      break;
    case 'r1':
      console.log('💾 Salvando R-1:', {
        avaliacaoId,
        acertos: dados.acertos,
        percentil: resultado.percentil,
        classificacao: resultado.classificacao
      });
      
      await query(`
        INSERT INTO resultados_r1 (avaliacao_id, acertos, percentil, classificacao)
        VALUES ($1, $2, $3, $4)
      `, [
        avaliacaoId,
        dados.acertos,
        resultado.percentil,
        resultado.classificacao
      ]);
      break;
    case 'mvt':
      console.log('💾 Salvando MVT:', {
        avaliacaoId,
        acertos: dados.acertos,
        erros: dados.erros,
        tempo: dados.tempo,
        percentil: resultado.percentil,
        classificacao: resultado.classificacao
      });
      
      await query(`
        INSERT INTO resultados_mvt (avaliacao_id, acertos, erros, tempo, percentil, classificacao)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        avaliacaoId,
        dados.acertos,
        dados.erros || 0,
        dados.tempo || 0,
        resultado.percentil,
        resultado.classificacao
      ]);
      break;
    // Adicionar outros testes conforme necessário
  }

  // Descontar estoque se habilitado
  if (descontarEstoque && usuarioId) {
    console.log(`📦 Descontando estoque para teste ${tipo}...`);
    const resultadoEstoque = await descontarEstoqueTeste(tipo, avaliacaoId, usuarioId);
    if (resultadoEstoque.success) {
      console.log(`✅ ${resultadoEstoque.message} - Descontado: ${resultadoEstoque.quantidade_descontada} folha(s)`);
    } else {
      console.log(`⚠️ Não foi possível descontar estoque: ${resultadoEstoque.message}`);
    }
  } else if (!descontarEstoque) {
    console.log(`ℹ️ Desconto de estoque desabilitado pelo usuário para teste ${tipo}`);
  }
}

// Funções de cálculo específicas
async function calcularAC(tabelaId, dados) {
  const { acertos, erros, omissoes, escolaridade } = dados;
  const pb = acertos - erros - omissoes;

  // Verificar se os valores são razoáveis
  if (pb < 0) {
    return { pb, percentil: null, classificacao: 'Valores inválidos (PB negativo)' };
  }

  const result = await query(`
    SELECT classificacao, percentil 
    FROM normas_ac 
    WHERE tabela_id = $1 AND 
    (
      ($2 = 'Ensino Fundamental' AND $3 BETWEEN fundamental_min AND fundamental_max) OR
      ($2 = 'Ensino Médio' AND $3 BETWEEN medio_min AND medio_max) OR
      ($2 = 'Ensino Superior' AND $3 BETWEEN superior_min AND superior_max)
    )
  `, [tabelaId, escolaridade, pb]);

  if (result.rows.length === 0) {
    return { pb, percentil: null, classificacao: 'Fora da faixa normativa' };
  }

  return {
    pb,
    percentil: result.rows[0].percentil,
    classificacao: result.rows[0].classificacao
  };
}

async function calcularBetaIII(tabelaId, dados) {
  const { acertos } = dados;
  const resultadoFinal = (acertos / 25) * 100;

  const result = await query(`
    SELECT percentil, classificacao 
    FROM normas_beta_iii 
    WHERE tabela_id = $1 AND $2 BETWEEN acertos_min AND acertos_max
  `, [tabelaId, acertos]);

  if (result.rows.length === 0) {
    return { resultadoFinal, percentil: null, classificacao: 'Fora da faixa normativa' };
  }

  return {
    resultadoFinal,
    percentil: result.rows[0].percentil,
    classificacao: result.rows[0].classificacao
  };
}

async function calcularBPA2(tabelaId, dados) {
  const { 
    acertos_sustentada, erros_sustentada, omissoes_sustentada,
    acertos_alternada, erros_alternada, omissoes_alternada,
    acertos_dividida, erros_dividida, omissoes_dividida
  } = dados;

  // Calcular pontos para cada modalidade (acertos - erros - omissões)
  const pontos_sustentada = acertos_sustentada - erros_sustentada - omissoes_sustentada;
  const pontos_alternada = acertos_alternada - erros_alternada - omissoes_alternada;
  const pontos_dividida = acertos_dividida - erros_dividida - omissoes_dividida;

  // Calcular média geral (atenção geral)
  const pontos_geral = (pontos_sustentada + pontos_alternada + pontos_dividida) / 3;

  // Buscar classificação para cada modalidade
  const resultados = {};

  // Atenção Sustentada
  const resultSustentada = await query(`
    SELECT percentil, classificacao 
    FROM normas_bpa2 
    WHERE tabela_id = $1 AND tipo_atencao = 'Sustentada' 
    AND $2 BETWEEN pontos_min AND pontos_max
  `, [tabelaId, pontos_sustentada]);

  resultados.sustentada = {
    pontos: pontos_sustentada,
    percentil: resultSustentada.rows.length > 0 ? resultSustentada.rows[0].percentil : null,
    classificacao: resultSustentada.rows.length > 0 ? resultSustentada.rows[0].classificacao : 'Fora da faixa normativa'
  };

  // Atenção Alternada
  const resultAlternada = await query(`
    SELECT percentil, classificacao 
    FROM normas_bpa2 
    WHERE tabela_id = $1 AND tipo_atencao = 'Alternada' 
    AND $2 BETWEEN pontos_min AND pontos_max
  `, [tabelaId, pontos_alternada]);

  resultados.alternada = {
    pontos: pontos_alternada,
    percentil: resultAlternada.rows.length > 0 ? resultAlternada.rows[0].percentil : null,
    classificacao: resultAlternada.rows.length > 0 ? resultAlternada.rows[0].classificacao : 'Fora da faixa normativa'
  };

  // Atenção Dividida
  const resultDividida = await query(`
    SELECT percentil, classificacao 
    FROM normas_bpa2 
    WHERE tabela_id = $1 AND tipo_atencao = 'Dividida' 
    AND $2 BETWEEN pontos_min AND pontos_max
  `, [tabelaId, pontos_dividida]);

  resultados.dividida = {
    pontos: pontos_dividida,
    percentil: resultDividida.rows.length > 0 ? resultDividida.rows[0].percentil : null,
    classificacao: resultDividida.rows.length > 0 ? resultDividida.rows[0].classificacao : 'Fora da faixa normativa'
  };

  // Atenção Geral (média dos percentis)
  const percentil_geral = Math.round((resultados.sustentada.percentil + resultados.alternada.percentil + resultados.dividida.percentil) / 3);
  
  // Determinar classificação geral baseada no percentil médio
  let classificacao_geral;
  if (percentil_geral >= 95) classificacao_geral = 'Superior';
  else if (percentil_geral >= 85) classificacao_geral = 'Acima da Média';
  else if (percentil_geral >= 75) classificacao_geral = 'Média Superior';
  else if (percentil_geral >= 50) classificacao_geral = 'Média';
  else if (percentil_geral >= 25) classificacao_geral = 'Média Inferior';
  else if (percentil_geral >= 15) classificacao_geral = 'Abaixo da Média';
  else classificacao_geral = 'Inferior';

  resultados.geral = {
    pontos: Math.round(pontos_geral * 100) / 100, // Arredondar para 2 casas decimais
    percentil: percentil_geral,
    classificacao: classificacao_geral
  };

  return resultados;
}

async function calcularRotas(tabelaId, dados) {
  const resultados = {};
  
  // Calcular para cada tipo de rota (A, D, C)
  const tiposRota = [
    { tipo: 'A', prefixo: 'rota_a' },
    { tipo: 'D', prefixo: 'rota_d' },
    { tipo: 'C', prefixo: 'rota_c' }
  ];

  for (const rota of tiposRota) {
    const acertos = dados[`acertos_${rota.prefixo}`] || 0;
    const erros = dados[`erros_${rota.prefixo}`] || 0;
    const omissoes = dados[`omissoes_${rota.prefixo}`] || 0;
    const pb = acertos - erros - omissoes;

    const result = await query(`
      SELECT percentil, classificacao 
      FROM normas_rotas 
      WHERE tabela_id = $1 AND rota_tipo = $2 AND $3 BETWEEN pontos_min AND pontos_max
    `, [tabelaId, rota.tipo, pb]);

    if (result.rows.length === 0) {
      resultados[rota.tipo.toLowerCase()] = { 
        acertos, 
        erros, 
        omissoes, 
        pb, 
        percentil: null, 
        classificacao: 'Fora da faixa normativa' 
      };
    } else {
      resultados[rota.tipo.toLowerCase()] = {
        acertos,
        erros,
        omissoes,
        pb,
        percentil: result.rows[0].percentil,
        classificacao: result.rows[0].classificacao
      };
    }
  }

  // Calcular MGA (Medida Geral de Atenção) - soma dos PBs
  const mga = Object.values(resultados).reduce((sum, rota) => sum + rota.pb, 0);
  
  // Buscar classificação para MGA (usando a mesma lógica da rota C como referência)
  const mgaResult = await query(`
    SELECT percentil, classificacao 
    FROM normas_rotas 
    WHERE tabela_id = $1 AND rota_tipo = 'C' AND $2 BETWEEN pontos_min AND pontos_max
  `, [tabelaId, mga]);

  if (mgaResult.rows.length === 0) {
    resultados.geral = { 
      mga, 
      percentil: null, 
      classificacao: 'Fora da faixa normativa' 
    };
  } else {
    resultados.geral = {
      mga,
      percentil: mgaResult.rows[0].percentil,
      classificacao: mgaResult.rows[0].classificacao
    };
  }

  return resultados;
}

async function calcularMIG(tabelaId, dados) {
  const { tipo_avaliacao, idade, escolaridade, acertos: acertosRaw } = dados;
  
  // Garantir que acertos seja um número inteiro
  const acertos = parseInt(acertosRaw);
  
  if (isNaN(acertos)) {
    console.error('❌ MIG: Acertos inválido:', acertosRaw);
    return { 
      acertos: 0,
      percentil: null, 
      classificacao: 'Fora da faixa normativa',
      qi: null
    };
  }

  // Determinar o tipo_avaliacao baseado na tabela selecionada
  let tipoAvaliacao = 'geral'; // padrão
  
  // Buscar informações da tabela para determinar o tipo correto
  const tabelaInfo = await query(`
    SELECT criterio, nome FROM tabelas_normativas WHERE id = $1
  `, [tabelaId]);
  
  if (tabelaInfo.rows.length > 0) {
    const criterio = tabelaInfo.rows[0].criterio;
    const nome = tabelaInfo.rows[0].nome;
    
    // Mapear baseado no nome da tabela para maior precisão
    if (nome.includes('Geral') || nome.includes('Tabela Geral')) {
      tipoAvaliacao = 'geral';
    } else if (nome.includes('15-25')) {
      tipoAvaliacao = 'geral';
    } else if (nome.includes('26-35')) {
      tipoAvaliacao = 'geral';
    } else if (nome.includes('36-45')) {
      tipoAvaliacao = 'geral';
    } else if (nome.includes('46-55')) {
      tipoAvaliacao = 'geral';
    } else if (nome.includes('56-64')) {
      tipoAvaliacao = 'geral';
    } else if (nome.includes('Ensino Fundamental')) {
      tipoAvaliacao = 'geral';
    } else if (nome.includes('Ensino Médio')) {
      tipoAvaliacao = 'geral';
    } else if (nome.includes('Ensino Superior')) {
      tipoAvaliacao = 'geral';
    } else if (nome.includes('Primeira Habilitação')) {
      tipoAvaliacao = 'geral';
    } else if (nome.includes('Renovação') || nome.includes('Mudança')) {
      tipoAvaliacao = 'geral';
    } else if (nome.includes('Profissional')) {
      tipoAvaliacao = 'geral';
    }
  }

  console.log(`🔍 MIG Calculation - Tabela ID: ${tabelaId}, Tipo Avaliação: ${tipoAvaliacao}, Acertos: ${acertos} (tipo: ${typeof acertos})`);

  // Buscar percentil e classificação na tabela selecionada
  // Se houver múltiplos percentis para o mesmo número de acertos, usar o MAIOR (mais favorável)
  const result = await query(`
    SELECT percentil, classificacao 
    FROM normas_mig 
    WHERE tabela_id = $1 AND tipo_avaliacao = $2 AND $3 BETWEEN acertos_min AND acertos_max
    ORDER BY percentil DESC
    LIMIT 1
  `, [tabelaId, tipoAvaliacao, acertos]);

  console.log(`📊 MIG Query Result - Linhas encontradas: ${result.rows.length}`);
  if (result.rows.length > 0) {
    console.log(`   Percentil: ${result.rows[0].percentil}, Classificação: ${result.rows[0].classificacao}`);
  }

  if (result.rows.length === 0) {
    console.error(`❌ MIG: Nenhuma norma encontrada para Tabela ${tabelaId}, Acertos ${acertos}`);
    return { 
      acertos,
      percentil: null, 
      classificacao: 'Fora da faixa normativa',
      qi: null
    };
  }

  // Buscar QI na tabela de conversão
  const qiTableResult = await query(`
    SELECT id FROM tabelas_normativas 
    WHERE tipo = 'mig' AND nome LIKE '%Conversão QI%' AND ativa = true
    LIMIT 1
  `);

  let qi = null;
  if (qiTableResult.rows.length > 0) {
    const qiTableId = qiTableResult.rows[0].id;
    const qiResult = await query(`
      SELECT qi, classificacao as qi_classificacao
      FROM normas_mig 
      WHERE tabela_id = $1 AND tipo_avaliacao = 'qi' AND $2 BETWEEN acertos_min AND acertos_max
      LIMIT 1
    `, [qiTableId, acertos]);

    if (qiResult.rows.length > 0) {
      qi = qiResult.rows[0].qi;
    }
  }

  return {
    acertos,
    percentil: result.rows[0].percentil,
    classificacao: result.rows[0].classificacao,
    qi
  };
}

async function calcularMVT(tabelaId, dados) {
  const { tipo_cnh, acertos, erros, omissao } = dados;
  const resultadoFinal = (acertos / (acertos + erros + omissao)) * 100;

  const result = await query(`
    SELECT percentil, classificacao 
    FROM normas_mvt 
    WHERE tabela_id = $1 AND tipo_cnh = $2 AND $3 BETWEEN resultado_min AND resultado_max
  `, [tabelaId, tipo_cnh, resultadoFinal]);

  if (result.rows.length === 0) {
    return { resultadoFinal, percentil: null, classificacao: 'Fora da faixa normativa' };
  }

  return {
    resultadoFinal,
    percentil: result.rows[0].percentil,
    classificacao: result.rows[0].classificacao
  };
}

async function calcularR1(tabelaId, dados) {
  const { escolaridade, acertos } = dados;

  const result = await query(`
    SELECT percentil, classificacao 
    FROM normas_r1 
    WHERE tabela_id = $1 AND escolaridade = $2 AND $3 BETWEEN acertos_min AND acertos_max
  `, [tabelaId, escolaridade, acertos]);

  if (result.rows.length === 0) {
    return { percentil: null, classificacao: 'Fora da faixa normativa' };
  }

  return {
    percentil: result.rows[0].percentil,
    classificacao: result.rows[0].classificacao
  };
}

async function calcularMemore(tabelaId, dados) {
  console.log('🔍 Calculando MEMORE:', { tabelaId, dados });
  
  // Normaliza entradas indefinidas/strings vazias para 0 e força número inteiro
  const toInt = (v) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : 0;
  };

  const vp = toInt(dados.vp);
  const vn = toInt(dados.vn);
  const fn = toInt(dados.fn);
  const fp = toInt(dados.fp);

  const resultadoFinal = vp + vn - fn - fp;
  
  console.log('📊 Resultado final calculado:', resultadoFinal);

  try {
    const result = await query(`
      SELECT percentil, classificacao 
      FROM normas_memore 
      WHERE tabela_id = $1 AND $2 BETWEEN resultado_min AND resultado_max
      ORDER BY percentil DESC
      LIMIT 1
    `, [tabelaId, resultadoFinal]);

    console.log('📋 Resultado da query:', result.rows);

    if (result.rows.length > 0) {
      return {
        resultadoFinal,
        percentil: result.rows[0].percentil,
        classificacao: result.rows[0].classificacao
      };
    }

    // Fallback: calcular percentil/classificação por interpolação baseada no nome da tabela
    console.log('⚠️ Nenhuma norma encontrada para o resultado:', resultadoFinal);
    console.log('🔄 Iniciando fallback por interpolação...');
    const info = await query(`SELECT nome FROM tabelas_normativas WHERE id = $1`, [tabelaId]);
    const nomeTabela = info.rows[0]?.nome || '';
    console.log('📋 Nome da tabela para fallback:', nomeTabela);

    function classFromPercentil(p) {
      if (p >= 95) return 'Superior';
      if (p >= 80) return 'Médio superior';
      if (p >= 30) return 'Médio';
      if (p >= 10) return 'Médio inferior';
      return 'Inferior';
    }

    function buildInterpolator(pointsRaw) {
      const ebToP = new Map();
      for (const pt of pointsRaw) {
        const prev = ebToP.get(pt.eb);
        if (prev == null || pt.p > prev) ebToP.set(pt.eb, pt.p);
      }
      const points = Array.from(ebToP.entries()).map(([eb, p]) => ({ eb, p })).sort((a, b) => a.eb - b.eb);
      return function interp(eb) {
        if (points.length === 0) return 0;
        if (eb <= points[0].eb) return points[0].p;
        if (eb >= points[points.length - 1].eb) return points[points.length - 1].p;
        for (let i = 0; i < points.length - 1; i++) {
          const a = points[i];
          const b = points[i + 1];
          if (eb === a.eb) return a.p;
          if (eb > a.eb && eb < b.eb) {
            const t = (eb - a.eb) / (b.eb - a.eb);
            const val = a.p + t * (b.p - a.p);
            return Math.round(val / 5) * 5;
          }
          if (eb === b.eb) return b.p;
        }
        return points[points.length - 1].p;
      };
    }

            // Pontos Tabela 7 (Trânsito) - Dados oficiais atualizados
            const t7Points = [
              { eb: -4, p: 1 }, { eb: 0, p: 5 }, { eb: 2, p: 10 }, { eb: 4, p: 15 }, { eb: 6, p: 20 }, { eb: 7, p: 25 },
              { eb: 8, p: 30 }, { eb: 8, p: 35 }, { eb: 10, p: 40 }, { eb: 10, p: 45 }, { eb: 12, p: 50 }, { eb: 14, p: 55 },
              { eb: 14, p: 60 }, { eb: 16, p: 65 }, { eb: 16, p: 70 }, { eb: 16, p: 75 }, { eb: 18, p: 80 }, { eb: 20, p: 85 },
              { eb: 22, p: 90 }, { eb: 22, p: 95 }, { eb: 24, p: 99 }
            ];
    // Tabela 10 - Normas gerais (amostra total) do MEMORE (dados oficiais atualizados)
    // Média 11, DP 6,26, n=1.444
    const t10Points = [
      { eb: -8, p: 1 }, { eb: 0, p: 5 }, { eb: 2, p: 10 }, { eb: 4, p: 15 }, { eb: 6, p: 20 }, { eb: 6, p: 25 },
      { eb: 8, p: 30 }, { eb: 8, p: 35 }, { eb: 10, p: 40 }, { eb: 10, p: 45 }, { eb: 12, p: 50 }, { eb: 12, p: 55 },
      { eb: 12, p: 60 }, { eb: 14, p: 65 }, { eb: 14, p: 70 }, { eb: 16, p: 75 }, { eb: 16, p: 80 }, { eb: 18, p: 85 },
      { eb: 20, p: 90 }, { eb: 22, p: 95 }, { eb: 24, p: 99 }
    ];

    // Tabela 8 - Normas do MEMORE em função da escolaridade (dados oficiais atualizados)
    // Fundamental: Média 5,60, DP 5,75, n=60
    const escFundPoints = [
      { eb: -8, p: 1 }, { eb: -4, p: 5 }, { eb: -2, p: 10 }, { eb: 0, p: 15 }, { eb: 2, p: 20 }, { eb: 2, p: 25 },
      { eb: 2, p: 30 }, { eb: 4, p: 35 }, { eb: 4, p: 40 }, { eb: 4, p: 45 }, { eb: 4, p: 50 }, { eb: 6, p: 55 },
      { eb: 6, p: 60 }, { eb: 8, p: 65 }, { eb: 10, p: 70 }, { eb: 10, p: 75 }, { eb: 10, p: 80 }, { eb: 12, p: 85 },
      { eb: 12, p: 90 }, { eb: 16, p: 95 }, { eb: 18, p: 99 }
    ];
    // Médio: Média 10,95, DP 6,37, n=501
    const escMedPoints = [
      { eb: -4, p: 1 }, { eb: 0, p: 5 }, { eb: 2, p: 10 }, { eb: 4, p: 15 }, { eb: 4, p: 20 }, { eb: 6, p: 25 },
      { eb: 8, p: 30 }, { eb: 8, p: 35 }, { eb: 10, p: 40 }, { eb: 10, p: 45 }, { eb: 10, p: 50 }, { eb: 12, p: 55 },
      { eb: 12, p: 60 }, { eb: 14, p: 65 }, { eb: 14, p: 70 }, { eb: 16, p: 75 }, { eb: 16, p: 80 }, { eb: 18, p: 85 },
      { eb: 22, p: 90 }, { eb: 24, p: 95 }, { eb: 24, p: 99 }
    ];
    // Superior: Média 11,38, DP 6,07, n=883
    const escSupPoints = [
      { eb: -6, p: 1 }, { eb: 0, p: 5 }, { eb: 4, p: 10 }, { eb: 4, p: 15 }, { eb: 6, p: 20 }, { eb: 8, p: 25 },
      { eb: 8, p: 30 }, { eb: 10, p: 35 }, { eb: 10, p: 40 }, { eb: 12, p: 45 }, { eb: 12, p: 50 }, { eb: 12, p: 55 },
      { eb: 14, p: 60 }, { eb: 14, p: 65 }, { eb: 16, p: 70 }, { eb: 16, p: 75 }, { eb: 18, p: 80 }, { eb: 20, p: 85 },
      { eb: 20, p: 90 }, { eb: 24, p: 95 }, { eb: 24, p: 99 }
    ];

    // Tabela 9 - Normas do MEMORE em função da faixa etária (dados oficiais atualizados)
    // 14-24: Média 12,11, DP 5,71, n=822
    const id14_24 = [
      { eb: -4, p: 1 }, { eb: -2, p: 5 }, { eb: 4, p: 10 }, { eb: 6, p: 15 }, { eb: 8, p: 20 }, { eb: 8, p: 25 },
      { eb: 10, p: 30 }, { eb: 10, p: 35 }, { eb: 12, p: 40 }, { eb: 12, p: 45 }, { eb: 12, p: 50 }, { eb: 14, p: 55 },
      { eb: 14, p: 60 }, { eb: 14, p: 65 }, { eb: 16, p: 70 }, { eb: 16, p: 75 }, { eb: 16, p: 80 }, { eb: 18, p: 85 },
      { eb: 20, p: 90 }, { eb: 20, p: 95 }, { eb: 24, p: 99 }
    ];
    // 25-34: Média 11,85, DP 6,59, n=314
    const id25_34 = [
      { eb: -4, p: 1 }, { eb: -2, p: 5 }, { eb: 0, p: 10 }, { eb: 2, p: 15 }, { eb: 4, p: 20 }, { eb: 4, p: 25 },
      { eb: 8, p: 30 }, { eb: 8, p: 35 }, { eb: 10, p: 40 }, { eb: 10, p: 45 }, { eb: 12, p: 50 }, { eb: 12, p: 55 },
      { eb: 14, p: 60 }, { eb: 14, p: 65 }, { eb: 16, p: 70 }, { eb: 16, p: 75 }, { eb: 18, p: 80 }, { eb: 20, p: 85 },
      { eb: 20, p: 90 }, { eb: 24, p: 95 }, { eb: 24, p: 99 }
    ];
    // 35-44: Média 7,60, DP 5,85, n=188
    const id35_44 = [
      { eb: -4, p: 1 }, { eb: -2, p: 5 }, { eb: 0, p: 10 }, { eb: 0, p: 15 }, { eb: 2, p: 20 }, { eb: 2, p: 25 },
      { eb: 4, p: 30 }, { eb: 4, p: 35 }, { eb: 6, p: 40 }, { eb: 6, p: 45 }, { eb: 8, p: 50 }, { eb: 8, p: 55 },
      { eb: 10, p: 60 }, { eb: 10, p: 65 }, { eb: 10, p: 70 }, { eb: 12, p: 75 }, { eb: 12, p: 80 }, { eb: 14, p: 85 },
      { eb: 16, p: 90 }, { eb: 16, p: 95 }, { eb: 20, p: 99 }
    ];
    // 45-54: Média 6,12, DP 5,30, n=93
    const id45_54 = [
      { eb: -4, p: 1 }, { eb: -2, p: 5 }, { eb: 0, p: 10 }, { eb: 0, p: 15 }, { eb: 0, p: 20 }, { eb: 0, p: 25 },
      { eb: 2, p: 30 }, { eb: 3, p: 35 }, { eb: 4, p: 40 }, { eb: 4, p: 45 }, { eb: 4, p: 50 }, { eb: 6, p: 55 },
      { eb: 7, p: 60 }, { eb: 8, p: 65 }, { eb: 8, p: 70 }, { eb: 10, p: 75 }, { eb: 11, p: 80 }, { eb: 12, p: 85 },
      { eb: 14, p: 90 }, { eb: 15, p: 95 }, { eb: 22, p: 99 }
    ];
    // 55-64: Média 6,12, DP 5,73, n=17
    const id55_64 = [
      { eb: -4, p: 1 }, { eb: -1, p: 5 }, { eb: 0, p: 10 }, { eb: 0, p: 15 }, { eb: 0, p: 20 }, { eb: 0, p: 25 },
      { eb: 2, p: 30 }, { eb: 3, p: 35 }, { eb: 4, p: 40 }, { eb: 4, p: 45 }, { eb: 4, p: 50 }, { eb: 6, p: 55 },
      { eb: 7, p: 60 }, { eb: 8, p: 65 }, { eb: 8, p: 70 }, { eb: 10, p: 75 }, { eb: 11, p: 80 }, { eb: 12, p: 85 },
      { eb: 14, p: 90 }, { eb: 15, p: 95 }, { eb: 22, p: 99 }
    ];

    const interpT7 = buildInterpolator(t7Points);
    const interpT10 = buildInterpolator(t10Points);
    const interpEscFund = buildInterpolator(escFundPoints);
    const interpEscMed = buildInterpolator(escMedPoints);
    const interpEscSup = buildInterpolator(escSupPoints);
    const interp14_24 = buildInterpolator(id14_24);
    const interp25_34 = buildInterpolator(id25_34);
    const interp35_44 = buildInterpolator(id35_44);
    const interp45_54 = buildInterpolator(id45_54);
    const interp55_64 = buildInterpolator(id55_64);

    let percentilCalc = null;
    if (nomeTabela.includes('Trânsito') || nomeTabela.includes('transito')) {
      percentilCalc = interpT7(resultadoFinal);
      console.log('✅ Usando Tabela 7 (Trânsito), percentil:', percentilCalc);
    } else if (nomeTabela.includes('Geral')) {
      percentilCalc = interpT10(resultadoFinal);
      console.log('✅ Usando Tabela 10 (Geral), percentil:', percentilCalc);
    } else if (nomeTabela.includes('Escolaridade') && !nomeTabela.includes('Trânsito')) {
      // Para tabelas de escolaridade (Tabela 8), usar a tabela médio como padrão
      // pois é a mais representativa (n=501 vs n=60 fundamental e n=883 superior)
      percentilCalc = interpEscMed(resultadoFinal);
      console.log('✅ Usando Tabela 8 (Escolaridade - Médio como padrão), percentil:', percentilCalc);
    } else if (nomeTabela.includes('Escolaridade') && nomeTabela.includes('Fundamental')) {
      percentilCalc = interpEscFund(resultadoFinal);
      console.log('✅ Usando Tabela 8 (Escolaridade Fundamental), percentil:', percentilCalc);
    } else if (nomeTabela.includes('Escolaridade') && nomeTabela.includes('Médio')) {
      percentilCalc = interpEscMed(resultadoFinal);
      console.log('✅ Usando Tabela 8 (Escolaridade Médio), percentil:', percentilCalc);
    } else if (nomeTabela.includes('Escolaridade') && nomeTabela.includes('Superior')) {
      percentilCalc = interpEscSup(resultadoFinal);
      console.log('✅ Usando Tabela 8 (Escolaridade Superior), percentil:', percentilCalc);
    } else if (nomeTabela.includes('Idade') && !nomeTabela.includes('Trânsito')) {
      // Para tabelas de idade (Tabela 9), usar a faixa 14-24 como padrão
      // pois é a mais representativa (n=822 vs outras faixas menores)
      percentilCalc = interp14_24(resultadoFinal);
      console.log('✅ Usando Tabela 9 (Idade - 14-24 como padrão), percentil:', percentilCalc);
    } else if (nomeTabela.includes('Idade') && nomeTabela.includes('14') && nomeTabela.includes('24')) {
      percentilCalc = interp14_24(resultadoFinal);
      console.log('✅ Usando Tabela 9 (Idade 14-24), percentil:', percentilCalc);
    } else if (nomeTabela.includes('Idade') && nomeTabela.includes('25') && nomeTabela.includes('34')) {
      percentilCalc = interp25_34(resultadoFinal);
      console.log('✅ Usando Tabela 9 (Idade 25-34), percentil:', percentilCalc);
    } else if (nomeTabela.includes('Idade') && nomeTabela.includes('35') && nomeTabela.includes('44')) {
      percentilCalc = interp35_44(resultadoFinal);
      console.log('✅ Usando Tabela 9 (Idade 35-44), percentil:', percentilCalc);
    } else if (nomeTabela.includes('Idade') && nomeTabela.includes('45') && nomeTabela.includes('54')) {
      percentilCalc = interp45_54(resultadoFinal);
      console.log('✅ Usando Tabela 9 (Idade 45-54), percentil:', percentilCalc);
    } else if (nomeTabela.includes('Idade') && nomeTabela.includes('55') && nomeTabela.includes('64')) {
      percentilCalc = interp55_64(resultadoFinal);
      console.log('✅ Usando Tabela 9 (Idade 55-64), percentil:', percentilCalc);
    }

    if (percentilCalc !== null) {
      const classificacaoFinal = classFromPercentil(percentilCalc);
      console.log('✅ Fallback concluído - Percentil:', percentilCalc, 'Classificação:', classificacaoFinal);
      return {
        resultadoFinal,
        percentil: percentilCalc,
        classificacao: classificacaoFinal
      };
    }

    console.log('⚠️ Nenhuma norma encontrada e sem fallback aplicável para:', nomeTabela);
    return { resultadoFinal, percentil: null, classificacao: 'Fora da faixa normativa' };
  } catch (error) {
    console.error('❌ Erro na query MEMORE:', error);
    throw error;
  }
}

// ==================== MEMORE - Seed oficial (Tabelas 7 e 10) ====================
// Cria/atualiza as tabelas normativas oficiais do MEMORE e popula as normas por EB
router.post('/memore/seed-official', async (req, res) => {
  try {
    // Helper: criar (se não existir) e retornar id da tabela normativa
    async function ensureTabela(nome, criterio) {
      const found = await query(
        `SELECT id FROM tabelas_normativas WHERE nome = $1 AND tipo = 'memore' AND ativa = true`,
        [nome]
      );
      if (found.rows.length > 0) return found.rows[0].id;
      const created = await query(
        `INSERT INTO tabelas_normativas (nome, tipo, versao, criterio, descricao, ativa, created_at)
         VALUES ($1, 'memore', '1.0', $2, 'Tabela oficial MEMORE', true, NOW()) RETURNING id`,
        [nome, criterio]
      );
      return created.rows[0].id;
    }

    // Helper: apaga normas prévias de uma tabela
    async function clearNormas(tabelaId) {
      await query(`DELETE FROM normas_memore WHERE tabela_id = $1`, [tabelaId]);
    }

    // Helper: classificação por percentil
    function classFromPercentil(p) {
      if (p >= 95) return 'Superior';
      if (p >= 80) return 'Médio superior';
      if (p >= 30) return 'Médio';
      if (p >= 10) return 'Médio inferior';
      return 'Inferior';
    }

    // Helper: interpolar percentil a partir de pontos [ { eb, p } ]
    function buildInterpolator(pointsRaw) {
      // consolidar por EB usando o maior percentil para EB duplicados
      const ebToP = new Map();
      for (const pt of pointsRaw) {
        const prev = ebToP.get(pt.eb);
        if (prev == null || pt.p > prev) ebToP.set(pt.eb, pt.p);
      }
      const points = Array.from(ebToP.entries())
        .map(([eb, p]) => ({ eb, p }))
        .sort((a, b) => a.eb - b.eb);

      return function interp(eb) {
        if (eb <= points[0].eb) return points[0].p;
        if (eb >= points[points.length - 1].eb) return points[points.length - 1].p;
        for (let i = 0; i < points.length - 1; i++) {
          const a = points[i];
          const b = points[i + 1];
          if (eb === a.eb) return a.p;
          if (eb > a.eb && eb < b.eb) {
            const t = (eb - a.eb) / (b.eb - a.eb);
            const val = a.p + t * (b.p - a.p);
            // arredondar ao múltiplo de 5 mais próximo (mantém consistência com tabela)
            return Math.round(val / 5) * 5;
          }
          if (eb === b.eb) return b.p;
        }
        return points[points.length - 1].p;
      };
    }

    // Tabela 7 – Trânsito (Escolaridade)
    const t7Points = [
      { eb: -4, p: 1 },
      { eb: 0, p: 5 },
      { eb: 2, p: 10 },
      { eb: 4, p: 15 },
      { eb: 6, p: 20 },
      { eb: 7, p: 25 },
      { eb: 8, p: 30 },
      { eb: 8, p: 35 },
      { eb: 10, p: 40 },
      { eb: 10, p: 45 },
      { eb: 12, p: 50 },
      { eb: 14, p: 55 },
      { eb: 14, p: 60 },
      { eb: 16, p: 65 },
      { eb: 16, p: 70 },
      { eb: 16, p: 75 },
      { eb: 18, p: 80 },
      { eb: 20, p: 85 },
      { eb: 22, p: 90 },
      { eb: 22, p: 95 },
      { eb: 24, p: 99 }
    ];
    const interpT7 = buildInterpolator(t7Points);

    // Tabela 10 – Geral (Amostra total)
    const t10Points = [
      { eb: -8, p: 1 },
      { eb: 0, p: 5 },
      { eb: 2, p: 10 },
      { eb: 4, p: 15 },
      { eb: 6, p: 20 },
      { eb: 6, p: 25 },
      { eb: 8, p: 30 },
      { eb: 8, p: 35 },
      { eb: 10, p: 40 },
      { eb: 10, p: 45 },
      { eb: 12, p: 50 },
      { eb: 12, p: 55 },
      { eb: 12, p: 60 },
      { eb: 14, p: 65 },
      { eb: 14, p: 70 },
      { eb: 16, p: 75 },
      { eb: 16, p: 80 },
      { eb: 18, p: 85 },
      { eb: 20, p: 90 },
      { eb: 22, p: 95 },
      { eb: 24, p: 99 }
    ];
    const interpT10 = buildInterpolator(t10Points);

    // ======= Garantir tabelas e IDs =======
    const tabelaGeralId = await ensureTabela('MEMORE - Geral', 'Geral');
    // Transito: usar 116 se existir
    let tabelaTransitoId = 116;
    const check116 = await query(`SELECT id FROM tabelas_normativas WHERE id = 116`);
    if (check116.rows.length === 0) {
      tabelaTransitoId = await ensureTabela('MEMORE - Trânsito - Escolaridade', 'Escolaridade');
    }
    // Escolaridade por nível (3 tabelas)
    const tabelaEscFundId = await ensureTabela('MEMORE - Escolaridade - Fundamental', 'Escolaridade');
    const tabelaEscMedId = await ensureTabela('MEMORE - Escolaridade - Médio', 'Escolaridade');
    const tabelaEscSupId = await ensureTabela('MEMORE - Escolaridade - Superior', 'Escolaridade');
    // Idade por faixa (5 tabelas)
    const tabelaId14_24 = await ensureTabela('MEMORE - Idade - 14 a 24', 'Idade');
    const tabelaId25_34 = await ensureTabela('MEMORE - Idade - 25 a 34', 'Idade');
    const tabelaId35_44 = await ensureTabela('MEMORE - Idade - 35 a 44', 'Idade');
    const tabelaId45_54 = await ensureTabela('MEMORE - Idade - 45 a 54', 'Idade');
    const tabelaId55_64 = await ensureTabela('MEMORE - Idade - 55 a 64', 'Idade');

    // Limpar normas anteriores
    await Promise.all([
      clearNormas(tabelaGeralId),
      clearNormas(tabelaTransitoId),
      clearNormas(tabelaEscFundId),
      clearNormas(tabelaEscMedId),
      clearNormas(tabelaEscSupId),
      clearNormas(tabelaId14_24),
      clearNormas(tabelaId25_34),
      clearNormas(tabelaId35_44),
      clearNormas(tabelaId45_54),
      clearNormas(tabelaId55_64)
    ]);

    // ======= Inserir normas MEMORE - Geral (Tabela 10) =======
    const inserts = [];
    for (let eb = -8; eb <= 24; eb++) {
      const pG = interpT10(eb);
      const cG = classFromPercentil(pG);
      inserts.push(query(
        `INSERT INTO normas_memore (tabela_id, resultado_min, resultado_max, percentil, classificacao)
         VALUES ($1, $2, $2, $3, $4)`,
        [tabelaGeralId, eb, pG, cG]
      ));
    }

    // ======= Inserir normas MEMORE - Trânsito (Tabela 7) =======
    for (let eb = -8; eb <= 24; eb++) {
      const pT = interpT7(eb);
      const cT = classFromPercentil(pT);
      inserts.push(query(
        `INSERT INTO normas_memore (tabela_id, resultado_min, resultado_max, percentil, classificacao)
         VALUES ($1, $2, $2, $3, $4)`,
        [tabelaTransitoId, eb, pT, cT]
      ));
    }

    // ======= Inserir normas MEMORE - Escolaridade (Tabela 8) =======
    const escFundPoints = [
      { eb: -8, p: 1 }, { eb: -4, p: 5 },
      { eb: -2, p: 10 }, { eb: 0, p: 15 }, { eb: 2, p: 20 }, { eb: 2, p: 25 }, { eb: 2, p: 30 }, { eb: 4, p: 35 }, { eb: 4, p: 40 }, { eb: 4, p: 45 },
      { eb: 4, p: 50 }, { eb: 6, p: 55 }, { eb: 6, p: 60 }, { eb: 8, p: 65 }, { eb: 10, p: 70 },
      { eb: 10, p: 75 }, { eb: 10, p: 80 }, { eb: 12, p: 85 }, { eb: 12, p: 90 },
      { eb: 16, p: 95 }, { eb: 18, p: 99 }
    ];
    const escMedPoints = [
      { eb: -4, p: 1 }, { eb: 0, p: 5 },
      { eb: 2, p: 10 }, { eb: 4, p: 15 }, { eb: 4, p: 20 }, { eb: 6, p: 25 }, { eb: 8, p: 30 }, { eb: 8, p: 35 }, { eb: 10, p: 40 }, { eb: 10, p: 45 },
      { eb: 10, p: 50 }, { eb: 12, p: 55 }, { eb: 12, p: 60 }, { eb: 14, p: 65 }, { eb: 14, p: 70 },
      { eb: 16, p: 75 }, { eb: 16, p: 80 }, { eb: 18, p: 85 }, { eb: 22, p: 90 },
      { eb: 24, p: 95 }, { eb: 24, p: 99 }
    ];
    const escSupPoints = [
      { eb: -6, p: 1 }, { eb: 0, p: 5 },
      { eb: 4, p: 10 }, { eb: 4, p: 15 }, { eb: 6, p: 20 }, { eb: 8, p: 25 }, { eb: 8, p: 30 }, { eb: 10, p: 35 }, { eb: 10, p: 40 }, { eb: 12, p: 45 },
      { eb: 12, p: 50 }, { eb: 12, p: 55 }, { eb: 14, p: 60 }, { eb: 14, p: 65 }, { eb: 16, p: 70 },
      { eb: 16, p: 75 }, { eb: 18, p: 80 }, { eb: 20, p: 85 }, { eb: 20, p: 90 },
      { eb: 24, p: 95 }, { eb: 24, p: 99 }
    ];
    const interpEscFund = buildInterpolator(escFundPoints);
    const interpEscMed = buildInterpolator(escMedPoints);
    const interpEscSup = buildInterpolator(escSupPoints);
    for (let eb = -8; eb <= 24; eb++) {
      const pef = interpEscFund(eb); inserts.push(query(`INSERT INTO normas_memore (tabela_id, resultado_min, resultado_max, percentil, classificacao) VALUES ($1,$2,$2,$3,$4)`, [tabelaEscFundId, eb, pef, classFromPercentil(pef)]));
      const pem = interpEscMed(eb); inserts.push(query(`INSERT INTO normas_memore (tabela_id, resultado_min, resultado_max, percentil, classificacao) VALUES ($1,$2,$2,$3,$4)`, [tabelaEscMedId, eb, pem, classFromPercentil(pem)]));
      const pes = interpEscSup(eb); inserts.push(query(`INSERT INTO normas_memore (tabela_id, resultado_min, resultado_max, percentil, classificacao) VALUES ($1,$2,$2,$3,$4)`, [tabelaEscSupId, eb, pes, classFromPercentil(pes)]));
    }

    // ======= Inserir normas MEMORE - Idade (Tabela 9) =======
    const id14_24 = [
      { eb: -4, p: 1 }, { eb: -2, p: 5 },
      { eb: 4, p: 10 }, { eb: 6, p: 15 }, { eb: 8, p: 20 }, { eb: 8, p: 25 }, { eb: 10, p: 30 }, { eb: 10, p: 35 }, { eb: 12, p: 40 }, { eb: 12, p: 45 },
      { eb: 12, p: 50 }, { eb: 14, p: 55 }, { eb: 14, p: 60 }, { eb: 14, p: 65 }, { eb: 16, p: 70 },
      { eb: 16, p: 75 }, { eb: 16, p: 80 }, { eb: 18, p: 85 }, { eb: 20, p: 90 },
      { eb: 20, p: 95 }, { eb: 24, p: 99 }
    ];
    const id25_34 = [
      { eb: -4, p: 1 }, { eb: -2, p: 5 },
      { eb: 0, p: 10 }, { eb: 2, p: 15 }, { eb: 4, p: 20 }, { eb: 4, p: 25 }, { eb: 8, p: 30 }, { eb: 8, p: 35 }, { eb: 10, p: 40 }, { eb: 10, p: 45 },
      { eb: 12, p: 50 }, { eb: 12, p: 55 }, { eb: 14, p: 60 }, { eb: 14, p: 65 }, { eb: 16, p: 70 },
      { eb: 16, p: 75 }, { eb: 18, p: 80 }, { eb: 20, p: 85 }, { eb: 20, p: 90 },
      { eb: 24, p: 95 }, { eb: 24, p: 99 }
    ];
    const id35_44 = [
      { eb: -4, p: 1 }, { eb: -2, p: 5 },
      { eb: 0, p: 10 }, { eb: 0, p: 15 }, { eb: 2, p: 20 }, { eb: 2, p: 25 }, { eb: 4, p: 30 }, { eb: 4, p: 35 }, { eb: 6, p: 40 }, { eb: 6, p: 45 },
      { eb: 8, p: 50 }, { eb: 8, p: 55 }, { eb: 10, p: 60 }, { eb: 10, p: 65 }, { eb: 10, p: 70 },
      { eb: 12, p: 75 }, { eb: 12, p: 80 }, { eb: 14, p: 85 }, { eb: 16, p: 90 },
      { eb: 16, p: 95 }, { eb: 20, p: 99 }
    ];
    const id45_54 = [
      { eb: -4, p: 1 }, { eb: -2, p: 5 },
      { eb: 0, p: 10 }, { eb: 0, p: 15 }, { eb: 0, p: 20 }, { eb: 0, p: 25 }, { eb: 2, p: 30 }, { eb: 3, p: 35 }, { eb: 4, p: 40 }, { eb: 4, p: 45 },
      { eb: 4, p: 50 }, { eb: 6, p: 55 }, { eb: 7, p: 60 }, { eb: 8, p: 65 }, { eb: 8, p: 70 },
      { eb: 10, p: 75 }, { eb: 11, p: 80 }, { eb: 12, p: 85 }, { eb: 14, p: 90 },
      { eb: 15, p: 95 }, { eb: 22, p: 99 }
    ];
    const id55_64 = [
      { eb: -4, p: 1 }, { eb: -1, p: 5 },
      { eb: 0, p: 10 }, { eb: 0, p: 15 }, { eb: 0, p: 20 }, { eb: 0, p: 25 }, { eb: 2, p: 30 }, { eb: 3, p: 35 }, { eb: 4, p: 40 }, { eb: 4, p: 45 },
      { eb: 4, p: 50 }, { eb: 6, p: 55 }, { eb: 7, p: 60 }, { eb: 8, p: 65 }, { eb: 8, p: 70 },
      { eb: 10, p: 75 }, { eb: 11, p: 80 }, { eb: 12, p: 85 }, { eb: 14, p: 90 },
      { eb: 15, p: 95 }, { eb: 22, p: 99 }
    ];
    const interp14_24 = buildInterpolator(id14_24);
    const interp25_34 = buildInterpolator(id25_34);
    const interp35_44 = buildInterpolator(id35_44);
    const interp45_54 = buildInterpolator(id45_54);
    const interp55_64 = buildInterpolator(id55_64);
    for (let eb = -8; eb <= 24; eb++) {
      const p1 = interp14_24(eb); inserts.push(query(`INSERT INTO normas_memore (tabela_id, resultado_min, resultado_max, percentil, classificacao) VALUES ($1,$2,$2,$3,$4)`, [tabelaId14_24, eb, p1, classFromPercentil(p1)]));
      const p2 = interp25_34(eb); inserts.push(query(`INSERT INTO normas_memore (tabela_id, resultado_min, resultado_max, percentil, classificacao) VALUES ($1,$2,$2,$3,$4)`, [tabelaId25_34, eb, p2, classFromPercentil(p2)]));
      const p3 = interp35_44(eb); inserts.push(query(`INSERT INTO normas_memore (tabela_id, resultado_min, resultado_max, percentil, classificacao) VALUES ($1,$2,$2,$3,$4)`, [tabelaId35_44, eb, p3, classFromPercentil(p3)]));
      const p4 = interp45_54(eb); inserts.push(query(`INSERT INTO normas_memore (tabela_id, resultado_min, resultado_max, percentil, classificacao) VALUES ($1,$2,$2,$3,$4)`, [tabelaId45_54, eb, p4, classFromPercentil(p4)]));
      const p5 = interp55_64(eb); inserts.push(query(`INSERT INTO normas_memore (tabela_id, resultado_min, resultado_max, percentil, classificacao) VALUES ($1,$2,$2,$3,$4)`, [tabelaId55_64, eb, p5, classFromPercentil(p5)]));
    }

    await Promise.all(inserts);

    res.json({
      ok: true,
      tabelas: {
        geral: tabelaGeralId,
        transito: tabelaTransitoId,
        escolaridade: {
          fundamental: tabelaEscFundId,
          medio: tabelaEscMedId,
          superior: tabelaEscSupId
        },
        idade: {
          '14_24': tabelaId14_24,
          '25_34': tabelaId25_34,
          '35_44': tabelaId35_44,
          '45_54': tabelaId45_54,
          '55_64': tabelaId55_64
        }
      }
    });
  } catch (error) {
    console.error('❌ Erro no seed oficial MEMORE:', error);
    res.status(500).json({ error: 'Erro no seed oficial MEMORE' });
  }
});

module.exports = router;
