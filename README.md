# Sistema de Avaliação Psicológica

Sistema moderno e completo para avaliação psicológica com base de dados PostgreSQL, desenvolvido com Node.js + Express no backend e React no frontend.

## 🚀 Características

- **Interface Moderna**: Design responsivo e intuitivo
- **Base de Dados**: PostgreSQL com tabelas normativas migradas
- **Autenticação Segura**: JWT com refresh tokens
- **API RESTful**: Endpoints completos para todas as funcionalidades
- **Testes Psicológicos**: 9 testes implementados com cálculos automáticos
- **Controle de Estoque**: Gestão completa de testes
- **Relatórios**: Geração de relatórios em tempo real
- **Validação**: Validação robusta de dados
- **Segurança**: Rate limiting, CORS, Helmet

## 📋 Testes Implementados

1. **AC - Atenção Concentrada**
2. **BETA-III - Raciocínio Matricial**
3. **BPA-2 - Atenção**
4. **Rotas de Atenção**
5. **MIG - Avaliação Psicológica**
6. **MVT - Memória Visual para o Trânsito**
7. **R-1 - Raciocínio**
8. **Memore - Memória**
9. **Palográfico**

## 🛠️ Tecnologias

### Backend
- Node.js + Express
- PostgreSQL
- JWT para autenticação
- bcryptjs para hash de senhas
- Joi para validação
- Helmet para segurança
- CORS
- Rate limiting

### Frontend
- React 18
- React Router
- React Query
- Tailwind CSS
- Lucide React (ícones)
- Axios
- React Hook Form
- React Hot Toast

## 📦 Instalação

### Pré-requisitos
- Node.js 16+
- PostgreSQL 12+
- npm ou yarn

### 1. Clone o repositório
```bash
git clone <repository-url>
cd sistema-avaliacao-psicologica
```

### 2. Instale as dependências do backend
```bash
npm install
```

### 3. Instale as dependências do frontend
```bash
cd frontend
npm install
cd ..
```

### 4. Configure o banco de dados
```bash
# Crie o banco de dados PostgreSQL
createdb sistema_avaliacao_psicologica

# Configure as variáveis de ambiente
cp env.example .env
# Edite o arquivo .env com suas configurações
```

### 5. Execute as migrações
```bash
npm run migrate
```

### 6. Popule o banco com dados iniciais
```bash
npm run seed
```

### 7. Inicie o servidor
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🔧 Configuração

### Variáveis de Ambiente (.env)
```env
# Servidor
PORT=3001
NODE_ENV=development

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sistema_avaliacao_psicologica
DB_USER=postgres
DB_PASSWORD=password

# Segurança
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais
- `usuarios` - Usuários do sistema
- `pacientes` - Pacientes avaliados
- `avaliacoes` - Avaliações realizadas
- `tabelas_normativas` - Tabelas de normas
- `testes_estoque` - Controle de estoque
- `movimentacoes_estoque` - Histórico de movimentações

### Tabelas de Resultados
- `resultados_ac`
- `resultados_beta_iii`
- `resultados_bpa2`
- `resultados_rotas`
- `resultados_mig`
- `resultados_mvt`
- `resultados_r1`
- `resultados_memore`
- `resultados_palografico`

### Tabelas Normativas
- `normas_ac`
- `normas_beta_iii`
- `normas_bpa2`
- `normas_rotas`
- `normas_mig`
- `normas_mvt`
- `normas_r1`
- `normas_memore`

## 🔐 Autenticação

O sistema utiliza JWT para autenticação. Usuário padrão criado no seed:
- **Email**: admin@sistema.com
- **Senha**: admin123

## 📱 Funcionalidades

### Dashboard
- Visão geral do sistema
- Estatísticas em tempo real
- Atividades recentes
- Ações rápidas

### Pacientes
- Cadastro e gerenciamento
- Busca e filtros
- Histórico de avaliações

### Avaliações
- Criação de novas avaliações
- Vinculação com pacientes
- Controle de laudos

### Testes
- Interface para realização de testes
- Cálculo automático de resultados
- Classificação baseada em normas

### Estoque
- Controle de quantidade
- Movimentações (entrada/saída)
- Alertas de estoque baixo

### Relatórios
- Relatório geral
- Relatório por paciente
- Relatório por teste
- Relatório de estoque

### Configurações
- Perfil do usuário
- Configurações do sistema
- Segurança
- Banco de dados
- Notificações

## 🚀 Deploy

### Produção
```bash
# Build do frontend
cd frontend
npm run build

# Iniciar servidor de produção
cd ..
NODE_ENV=production npm start
```

### Docker (Opcional)
```dockerfile
# Dockerfile para backend
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 📈 Melhorias Implementadas

### Última Atualização (2025):
1. **Migração para PostgreSQL**: Todas as tabelas normativas agora estão no banco
2. **Interface Moderna**: Design responsivo e intuitivo com Tailwind CSS
3. **Autenticação Segura**: JWT em vez de credenciais hardcoded
4. **Validação Robusta**: Validação de dados em backend e frontend
5. **API RESTful**: Endpoints organizados e documentados
6. **Controle de Estoque**: Sistema completo de gestão
7. **Relatórios**: Geração automática de relatórios
8. **Segurança**: Rate limiting, CORS, Helmet
9. **Performance**: Índices no banco, cache com React Query
10. **Manutenibilidade**: Código organizado e documentado
11. **UI/UX Aprimorado**: Animações suaves, efeitos hover, gradientes modernos
12. **Feedback Visual**: Cores verde/laranja para acertos/erros nos testes
13. **Responsividade Total**: Funciona perfeitamente em mobile, tablet e desktop
14. **Limpeza de Código**: Removidos arquivos HTML antigos e backups desnecessários
15. **Componentes Modernos**: Loading spinner aprimorado, cards interativos, botões com gradiente

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através de:
- Email: suporte@sistema.com
- Issues: [GitHub Issues](https://github.com/seu-usuario/sistema-avaliacao-psicologica/issues)

## 🎯 Roadmap

- [ ] Implementar testes automatizados
- [ ] Adicionar mais tipos de relatórios
- [ ] Implementar notificações por email
- [ ] Adicionar exportação para PDF
- [ ] Implementar backup automático
- [ ] Adicionar auditoria de ações
- [ ] Implementar roles e permissões
- [ ] Adicionar API de integração externa
