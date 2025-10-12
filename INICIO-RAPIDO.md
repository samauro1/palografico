# 🚀 Início Rápido - Sistema de Avaliação Psicológica

## ⚡ Instalação e Configuração

### 1. Pré-requisitos
- Node.js 16+ instalado
- PostgreSQL 12+ instalado e rodando

### 2. Configuração do Banco de Dados

#### Linux/Mac:
```bash
# Criar banco de dados
createdb sistema_avaliacao_psicologica

# Ou usando psql:
psql -U postgres
CREATE DATABASE sistema_avaliacao_psicologica;
\q
```

#### Windows:
```powershell
# Usar o script automático (recomendado)
npm run db:create

# Ou usar pgAdmin (interface gráfica)
# Ou usar psql se estiver no PATH
psql -U postgres -c "CREATE DATABASE sistema_avaliacao_psicologica;"
```

### 3. Instalação das Dependências
```bash
# Instalar dependências do backend
npm install

# Instalar dependências do frontend
cd frontend
npm install
cd ..
```

### 4. Configuração do Ambiente
```bash
# Copiar arquivo de configuração
cp env.example .env

# Editar configurações (opcional - padrões funcionam para desenvolvimento)
# nano .env
```

### 5. Configuração do Banco
```bash
# Executar migrações e popular banco (cria banco + migra + popula)
npm run setup

# Ou passo a passo:
npm run db:create  # Criar banco
npm run migrate    # Executar migrações  
npm run seed       # Popular banco
```

### 6. Iniciar o Sistema

#### Opção 1: Iniciar tudo de uma vez (Recomendado)
```bash
npm run dev:full
```

#### Opção 2: Iniciar separadamente
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🌐 Acessar o Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 🔐 Login Padrão

- **Email**: admin@sistema.com
- **Senha**: admin123

## 📋 Funcionalidades Disponíveis

### ✅ Implementado
- [x] Dashboard com estatísticas
- [x] Gerenciamento de pacientes
- [x] Criação de avaliações
- [x] 9 testes psicológicos com cálculos automáticos
- [x] Controle de estoque
- [x] Geração de relatórios
- [x] Configurações do sistema
- [x] Autenticação JWT
- [x] Base de dados PostgreSQL

### 🧪 Testes Disponíveis
1. AC - Atenção Concentrada
2. BETA-III - Raciocínio Matricial
3. BPA-2 - Atenção
4. Rotas de Atenção
5. MIG - Avaliação Psicológica
6. MVT - Memória Visual para o Trânsito
7. R-1 - Raciocínio
8. Memore - Memória
9. Palográfico

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev          # Apenas backend
npm run dev:full     # Backend + Frontend

# Banco de dados
npm run migrate      # Executar migrações
npm run seed         # Popular banco com dados iniciais
npm run setup        # Migrar + popular banco

# Produção
npm run build        # Build do frontend
npm start            # Iniciar em produção
```

## 🔧 Solução de Problemas

### Erro: "Rota não encontrada"
- ✅ **Resolvido**: Adicionada rota raiz "/" no servidor
- Acesse http://localhost:3001 para ver a API
- Acesse http://localhost:3000 para o frontend

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
pg_ctl status

# Verificar configurações no .env
cat .env
```

### Erro de dependências
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Porta já em uso
```bash
# Verificar processos usando as portas
lsof -i :3000
lsof -i :3001

# Matar processo se necessário
kill -9 <PID>
```

## 📊 Estrutura do Projeto

```
sistema-avaliacao-psicologica/
├── 📁 backend/
│   ├── config/          # Configurações do banco
│   ├── middleware/      # Middlewares (auth, validation)
│   ├── routes/          # Rotas da API
│   └── scripts/         # Migrações e seed
├── 📁 frontend/
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas da aplicação
│   │   └── services/    # Serviços de API
│   └── public/          # Arquivos estáticos
├── 📄 server.js         # Servidor principal
├── 📄 package.json      # Dependências do backend
└── 📄 README.md         # Documentação completa
```

## 🎯 Próximos Passos

1. **Testar o sistema**: Faça login e explore as funcionalidades
2. **Adicionar pacientes**: Cadastre alguns pacientes de teste
3. **Realizar avaliações**: Crie avaliações e teste os cálculos
4. **Explorar relatórios**: Gere diferentes tipos de relatórios
5. **Configurar estoque**: Adicione movimentações de estoque

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no terminal
2. Consulte o README.md completo
3. Verifique se todas as dependências estão instaladas
4. Confirme se o PostgreSQL está rodando

---

**🎉 Sistema pronto para uso!**
