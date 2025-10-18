const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Obter configurações da clínica
router.get('/clinica', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT * FROM configuracoes_clinica LIMIT 1
    `);

    if (result.rows.length === 0) {
      // Criar registro padrão se não existir
      const newConfig = await query(`
        INSERT INTO configuracoes_clinica (nome_clinica)
        VALUES ('Clínica de Avaliação Psicológica')
        RETURNING *
      `);
      return res.json({
        success: true,
        data: newConfig.rows[0]
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// Atualizar configurações da clínica
router.put('/clinica', authenticateToken, async (req, res) => {
  try {
    const {
      nome_clinica,
      cnpj,
      endereco,
      cidade,
      estado,
      cep,
      telefone,
      email,
      logo_url
    } = req.body;

    // Verificar se já existe configuração
    const existing = await query('SELECT id FROM configuracoes_clinica LIMIT 1');
    
    let result;
    if (existing.rows.length === 0) {
      // Criar nova
      result = await query(`
        INSERT INTO configuracoes_clinica 
        (nome_clinica, cnpj, endereco, cidade, estado, cep, telefone, email, logo_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [nome_clinica, cnpj, endereco, cidade, estado, cep, telefone, email, logo_url]);
    } else {
      // Atualizar existente
      result = await query(`
        UPDATE configuracoes_clinica
        SET nome_clinica = $1, cnpj = $2, endereco = $3, cidade = $4, 
            estado = $5, cep = $6, telefone = $7, email = $8, logo_url = $9,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $10
        RETURNING *
      `, [nome_clinica, cnpj, endereco, cidade, estado, cep, telefone, email, logo_url, existing.rows[0].id]);
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Configurações atualizadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

module.exports = router;

