# Gerenciador de Requisitos

Gerenciador de requisitos de projetos.

## Tecnologias

- **Frontend**: React + Vite + Tailwind v4
- **Backend**: Express.js + Prisma (SQLite) + JWT + Swagger

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- npm 9 ou superior

---

## Como colocar o projeto para rodar

### 1. Clonar o repositório

```bash
git clone https://github.com/eduardahey/ReqTrack
cd reqtrack
```

### 2. Configurar e rodar o Backend

Crie o arquivo `backend/.env` com as seguintes variáveis:

```bash
# backend/.env
DATABASE_URL="file:./dev.db"
JWT_SECRET="string-secreta"
JWT_EXPIRES_IN="7d"
PORT=3333

# Usadas para envio de e-mail (verificação de cadastro, convites, recuperação de senha)
RESEND_API_KEY="sua-api-key-do-resend"
RESEND_FROM_EMAIL="ReqTrack <onboarding@resend.dev>"
```

Depois, instale as dependências e suba o banco:

```bash
cd backend

# 1. Instalar dependências
npm install

# 2. Gerar o Prisma Client
npx prisma generate --schema=src/prisma/schema.prisma

# 3. Criar o banco de dados e rodar as migrations
npx prisma migrate dev --schema=src/prisma/schema.prisma

# 4. Rodar o servidor em modo desenvolvimento
npm run dev
```

- API: http://localhost:3333
- Swagger: http://localhost:3333/api/docs
- Health check: http://localhost:3333/api/health

Outros comandos úteis do backend:

```bash
npm start          # roda o servidor sem hot-reload (produção)
npm run db:studio  # abre o Prisma Studio para inspecionar o banco
npm run db:migrate # cria/aplica uma nova migration em desenvolvimento
```

### 3. Configurar e rodar o Frontend

Em um novo terminal:

```bash
cd frontend

# 1. Instalar dependências
npm install

# 2. Rodar o dev server
npm run dev
```

- App: http://localhost:5173

Outros comandos úteis do frontend:

```bash
npm run build    # gera o build de produção em frontend/dist
npm run preview  # serve o build de produção localmente
```

> O frontend espera o backend rodando em `http://localhost:3333` (ver `frontend/vite.config.js` para o proxy de `/api`).

---

## Estrutura de Pastas

```
reqtrack/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuração de libs (Swagger)
│   │   ├── controllers/      # Lógica de negócio, um arquivo por recurso
│   │   ├── lib/               # Prisma Client singleton
│   │   ├── middlewares/       # authenticate (JWT), requireProjectAccess (RBAC), asyncHandler (erros)
│   │   ├── routes/             # Definição de rotas + docs Swagger (delegam aos controllers)
│   │   ├── services/           # Integrações externas (envio de e-mail via Resend)
│   │   ├── prisma/             # schema.prisma + migrations + dev.db
│   │   └── server.js           # Entry point + 404 handler + error handler global
│   ├── .env                    # Variáveis de ambiente (não versionado)
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Componentes reutilizáveis
│   │   ├── contexts/           # AuthContext (JWT)
│   │   ├── hooks/              # Custom hooks (ex: usePagination)
│   │   ├── pages/              # Telas da aplicação
│   │   ├── services/           # Axios + interceptors
│   │   ├── utils/              # Funções utilitárias puras
│   │   ├── App.jsx             # Rotas React Router
│   │   └── main.jsx
│   └── package.json
│
├── docs/                        # documentacao-tecnica.md + export estático do Swagger (api-docs.html)
├── .gitignore
└── README.md
```

Cada recurso do backend (workspace, project, requirement, stakeholder, userStory,
meeting, activity, passwordRecovery, emailVerification, workspaceMember,
workspaceInvite, auth) segue o padrão `routes/<recurso>.routes.js` →
`controllers/<recurso>.controller.js`, e todos compartilham a mesma instância do
Prisma Client exportada por `lib/prisma.js`.

Todas as rotas de `requirement`, `stakeholder`, `userStory`, `meeting` e `activity`
passam por dois middlewares em sequência: `authenticate` (valida o JWT) e
`requireProjectAccess` (garante que o usuário autenticado é membro do workspace
dono daquele `projectId` — sem isso, qualquer usuário logado poderia acessar
projetos de outros workspaces). Os controllers em si não têm `try/catch`
manual: eles são envolvidos por `asyncHandler` no momento em que a rota é
registrada, o que encaminha qualquer rejeição de Promise para o middleware de
erro global definido em `server.js`, que mapeia erros conhecidos do Prisma
(`P2025` → 404, `P2002` → 409) e cai para 500 nos demais casos — sem isso, uma
falha assíncrona não tratada poderia derrubar o processo inteiro.

Para uma descrição mais detalhada da arquitetura, dos componentes principais,
das bibliotecas utilizadas e de como os tópicos da disciplina foram aplicados,
veja [`docs/documentacao-tecnica.md`](docs/documentacao-tecnica.md).

---

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/auth/register | Cria workspace + admin |
| POST | /api/auth/login | Login |
| PUT | /api/auth/me | Atualiza perfil do usuário autenticado |
| GET | /api/workspaces | Lista workspaces do usuário |
| GET | /api/workspaces/:id | Detalhe do workspace |
| PUT | /api/workspaces/:id | Atualiza workspace |
| DELETE | /api/workspaces/:id | Remove workspace |
| GET | /api/workspaces/:id/members | Lista membros e convites do workspace |
| PUT | /api/workspaces/:id/members/:memberId | Atualiza cargo de um membro |
| DELETE | /api/workspaces/:id/members/:memberId | Remove membro do workspace |
| POST | /api/workspaces/:id/invites | Convida participante por e-mail |
| POST | /api/workspaces/:id/invites/:inviteId/resend | Reenvia convite |
| DELETE | /api/workspaces/:id/invites/:inviteId | Cancela convite |
| GET | /api/workspaces/:id/projects | Lista projetos |
| POST | /api/workspaces/:id/projects | Cria projeto |
| PUT | /api/workspaces/:id/projects/:id | Atualiza projeto |
| DELETE | /api/workspaces/:id/projects/:id | Remove projeto |
| GET | /api/projects/:id/requirements | Lista requisitos |
| POST | /api/projects/:id/requirements | Cria requisito |
| PUT | /api/projects/:id/requirements/:id | Atualiza requisito |
| DELETE | /api/projects/:id/requirements/:id | Remove requisito |
| GET | /api/projects/:id/stakeholders | Lista stakeholders |
| POST | /api/projects/:id/stakeholders | Cria stakeholder |
| PUT | /api/projects/:id/stakeholders/:id | Atualiza stakeholder |
| DELETE | /api/projects/:id/stakeholders/:id | Remove stakeholder |
| GET | /api/projects/:id/user-stories | Lista histórias |
| POST | /api/projects/:id/user-stories | Cria história |
| PUT | /api/projects/:id/user-stories/:id | Atualiza história |
| DELETE | /api/projects/:id/user-stories/:id | Remove história |
| GET | /api/projects/:id/meetings | Lista reuniões |
| POST | /api/projects/:id/meetings | Cria reunião |
| PUT | /api/projects/:id/meetings/:id | Atualiza reunião |
| DELETE | /api/projects/:id/meetings/:id | Remove reunião |
| GET | /api/projects/:id/activities | Lista atividades recentes do projeto |
| POST | /api/password-recovery/request | Solicita código de recuperação de senha |
| POST | /api/password-recovery/verify | Verifica código de recuperação |
| POST | /api/password-recovery/reset | Redefine a senha |
| POST | /api/password-recovery/resend | Reenvia código de recuperação |
| POST | /api/email-verification/send | Reenvia código de verificação de cadastro |
| POST | /api/email-verification/confirm | Confirma cadastro e cria o workspace |
| POST | /api/workspace-invites/lookup | Verifica um convite pelo e-mail e código |
| POST | /api/workspace-invites/accept | Aceita convite e cria a conta |

A lista completa e interativa está sempre disponível no Swagger (`/api/docs`) com o servidor rodando.
