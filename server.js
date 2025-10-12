const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const pacientesRoutes = require('./routes/pacientes');
const avaliacoesRoutes = require('./routes/avaliacoes');
const tabelasRoutes = require('./routes/tabelas');
const estoqueRoutes = require('./routes/estoque');
const relatoriosRoutes = require('./routes/relatorios');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet());
app.use(compression());

// Confiar em proxy local (evita warnings do rate-limiter em dev)
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite de 100 requests por IP
  message: 'Muitas tentativas de acesso. Tente novamente em alguns minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Middleware de logging
app.use(morgan('combined'));

// Middleware de CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://seudominio.com'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));

// Middleware para parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos do frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/build')));
}

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/avaliacoes', avaliacoesRoutes);
app.use('/api/tabelas', tabelasRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/relatorios', relatoriosRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    message: 'Sistema de Avaliação Psicológica API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      pacientes: '/api/pacientes',
      avaliacoes: '/api/avaliacoes',
      tabelas: '/api/tabelas',
      estoque: '/api/estoque',
      relatorios: '/api/relatorios',
      health: '/api/health'
    },
    documentation: 'Consulte o README.md para mais informações'
  });
});

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.details || err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Token inválido ou expirado'
    });
  }
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Em produção, servir o frontend para todas as rotas não-API
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
  });
} else {
  // Em desenvolvimento, retornar erro 404 para rotas não encontradas
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Rota não encontrada',
      path: req.originalUrl,
      message: 'Em desenvolvimento, use o frontend em http://localhost:3000'
    });
  });
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
