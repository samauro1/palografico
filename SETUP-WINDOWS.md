# 🪟 Configuração no Windows

## ⚡ Instalação Rápida no Windows

### 1. Pré-requisitos

#### Instalar Node.js
- Baixe em: https://nodejs.org/
- Instale a versão LTS (recomendada)

#### Instalar PostgreSQL
- Baixe em: https://www.postgresql.org/download/windows/
- Durante a instalação:
  - Anote a senha do usuário `postgres`
  - Mantenha a porta padrão `5432`
  - Deixe marcado "Add PostgreSQL to PATH" (opcional)

### 2. Verificar Instalações
```powershell
# Verificar Node.js
node --version
npm --version

# Verificar PostgreSQL (se adicionado ao PATH)
psql --version
```

### 3. Configurar o Projeto
```powershell
# 1. Instalar dependências do backend
npm install

# 2. Instalar dependências do frontend
cd frontend
npm install
cd ..

# 3. Copiar configurações
copy env.example .env
```

### 4. Configurar Banco de Dados

#### Opção 1: Usando o Script Automático (Recomendado)
```powershell
# Criar banco e configurar tudo
npm run setup
```

#### Opção 2: Manual
```powershell
# 1. Criar banco
npm run db:create

# 2. Executar migrações
npm run migrate

# 3. Popular com dados iniciais
npm run seed
```

#### Opção 3: Usando pgAdmin (Interface Gráfica)
1. Abra o pgAdmin
2. Conecte ao servidor PostgreSQL
3. Clique com botão direito em "Databases"
4. Selecione "Create" > "Database"
5. Nome: `sistema_avaliacao_psicologica`
6. Clique em "Save"

#### Opção 4: Usando psql (Linha de Comando)
```powershell
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco
CREATE DATABASE sistema_avaliacao_psicologica;

# Sair
\q
```

### 5. Iniciar o Sistema

#### Opção 1: Início Completo
```powershell
npm run dev:full
```

#### Opção 2: Início Separado
```powershell
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🔧 Solução de Problemas no Windows

### Erro: "PostgreSQL não encontrado"
```powershell
# Verificar se o serviço está rodando
Get-Service -Name "*postgres*"

# Iniciar serviço se necessário
Start-Service -Name "postgresql-x64-14"  # Ajuste o nome conforme sua versão
```

### Erro: "Porta já em uso"
```powershell
# Verificar processos usando as portas
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Matar processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F
```

### Erro: "Permissão negada"
```powershell
# Executar PowerShell como Administrador
# Ou ajustar permissões do PostgreSQL
```

### Erro: "Banco não existe"
```powershell
# Verificar se PostgreSQL está rodando
Get-Service -Name "*postgres*"

# Verificar configurações no .env
type .env
```

## 📋 Configurações do .env

```env
# Configurações do Servidor
PORT=3001
NODE_ENV=development

# Configurações do Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistema_avaliacao_psicologica
DB_USER=postgres
DB_PASSWORD=sua_senha_do_postgres

# Configurações de Segurança
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
```

## 🎯 Comandos Úteis no Windows

```powershell
# Desenvolvimento
npm run dev          # Apenas backend
npm run dev:full     # Backend + Frontend

# Banco de dados
npm run db:create    # Criar banco
npm run migrate      # Executar migrações
npm run seed         # Popular banco
npm run setup        # Tudo de uma vez

# Limpeza
npm run clean        # Limpar node_modules (se existir)
```

## 🌐 Acessos

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **Login**: admin@sistema.com / admin123

## 📞 Suporte Windows

### Verificar Logs
```powershell
# Logs do PostgreSQL
Get-EventLog -LogName Application -Source "PostgreSQL" -Newest 10

# Logs do Node.js (aparecem no terminal)
```

### Reiniciar Serviços
```powershell
# Reiniciar PostgreSQL
Restart-Service -Name "postgresql-x64-14"

# Reiniciar Node.js
# Ctrl+C no terminal e executar novamente
```

### Desinstalar e Reinstalar
```powershell
# Desinstalar PostgreSQL
# Painel de Controle > Programas > Desinstalar

# Limpar projeto
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force frontend\node_modules
```

---

**🎉 Sistema configurado no Windows!**
