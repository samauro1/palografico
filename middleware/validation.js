const Joi = require('joi');

// Validação de usuário
const userSchema = Joi.object({
  nome: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(6).required()
});

// Validação de login
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  senha: Joi.string().required()
});

// Validação de paciente
const pacienteSchema = Joi.object({
  nome: Joi.string().min(2).max(255).required(),
  cpf: Joi.string().pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/).required(),
  idade: Joi.number().integer().min(1).max(120).required(),
  escolaridade: Joi.string().valid('Ensino Fundamental', 'Ensino Médio', 'Ensino Superior').required()
});

// Validação de avaliação
const avaliacaoSchema = Joi.object({
  paciente_id: Joi.number().integer().positive().required(),
  numero_laudo: Joi.string().min(1).max(20).required(),
  data_aplicacao: Joi.date().required(),
  aplicacao: Joi.string().valid('Coletiva', 'Individual').required(),
  tipo_habilitacao: Joi.string().valid('1ª Habilitação', 'Renovação/Mudança de categoria', 'Motorista Profissional').required(),
  observacoes: Joi.string().max(3000).optional()
});

// Validação de resultados AC
const resultadoACSchema = Joi.object({
  acertos: Joi.number().integer().min(0).required(),
  erros: Joi.number().integer().min(0).required(),
  omissoes: Joi.number().integer().min(0).required()
});

// Validação de resultados BETA-III
const resultadoBetaIIISchema = Joi.object({
  acertos: Joi.number().integer().min(0).max(25).required(),
  erros: Joi.number().integer().min(0).required(),
  omissao: Joi.number().integer().min(0).required()
});

// Validação de resultados BPA-2
const resultadoBPA2Schema = Joi.object({
  tipo_atencao: Joi.string().valid('concentrada', 'alternada', 'dividida').required(),
  acertos: Joi.number().integer().min(0).required(),
  erros: Joi.number().integer().min(0).required(),
  omissoes: Joi.number().integer().min(0).required()
});

// Validação de resultados Rotas
const resultadoRotasSchema = Joi.object({
  rota_tipo: Joi.string().valid('c', 'a', 'd').required(),
  acertos: Joi.number().integer().min(0).required(),
  erros: Joi.number().integer().min(0).required(),
  omissoes: Joi.number().integer().min(0).required()
});

// Validação de resultados MIG
const resultadoMIGSchema = Joi.object({
  tipo_avaliacao: Joi.string().valid('primeiraHabilitacao', 'renovacaoMudanca', 'motoristaProfissional').required(),
  acertos: Joi.number().integer().min(0).max(28).required()
});

// Validação de resultados MVT
const resultadoMVTSchema = Joi.object({
  acertos: Joi.number().integer().min(0).max(22).required(),
  erros: Joi.number().integer().min(0).required(),
  omissao: Joi.number().integer().min(0).required()
});

// Validação de resultados R-1
const resultadoR1Schema = Joi.object({
  acertos: Joi.number().integer().min(0).max(40).required()
});

// Validação de resultados Memore
const resultadoMemoreSchema = Joi.object({
  vp: Joi.number().integer().min(0).required(),
  vn: Joi.number().integer().min(0).required(),
  fn: Joi.number().integer().min(0).required(),
  fp: Joi.number().integer().min(0).required()
});

// Validação de estoque
const estoqueSchema = Joi.object({
  nome_teste: Joi.string().min(1).max(100).required(),
  quantidade_atual: Joi.number().integer().min(0).required(),
  quantidade_minima: Joi.number().integer().min(0).required()
});

// Validação de movimentação de estoque
const movimentacaoEstoqueSchema = Joi.object({
  teste_id: Joi.number().integer().positive().required(),
  tipo_movimentacao: Joi.string().valid('entrada', 'saida').required(),
  quantidade: Joi.number().integer().positive().required(),
  observacoes: Joi.string().max(500).optional()
});

// Middleware de validação
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.body = value;
    next();
  };
};

module.exports = {
  validate,
  userSchema,
  loginSchema,
  pacienteSchema,
  avaliacaoSchema,
  resultadoACSchema,
  resultadoBetaIIISchema,
  resultadoBPA2Schema,
  resultadoRotasSchema,
  resultadoMIGSchema,
  resultadoMVTSchema,
  resultadoR1Schema,
  resultadoMemoreSchema,
  estoqueSchema,
  movimentacaoEstoqueSchema
};
