# 🌿 Irancho — Sistema de Gestão de Fazenda

Sistema completo para gestão de fazendas com módulos de animais, leite, vendas, despesas, funcionários e financeiro.

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- npm

### Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Criar banco de dados e popular dados demo
npx prisma db push
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# 3. Iniciar o servidor
npm run dev
```

Acesse: **http://localhost:3000**

### Login Demo
- **Email:** demo@irancho.com  
- **Senha:** demo123

---

## 📦 Módulos

| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | Visão geral: animais, produção de leite, receitas, despesas |
| **Animais** | Cadastro e gestão de leiteiras, ovelhas e bovinos |
| **Leite** | Registro diário de produção (manhã/tarde) |
| **Vendas** | Registro de vendas de leite, animais, lã e carne |
| **Despesas** | Controle de gastos por categoria |
| **Funcionários** | Cadastro e controle de pagamentos |
| **Financeiro** | Relatórios gráficos de receita vs despesas |

## 🛠 Stack

- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Recharts
- **Backend:** Next.js API Routes
- **Banco de dados:** SQLite + Prisma ORM
- **Autenticação:** NextAuth.js

## 🐳 Docker

```bash
docker-compose up --build
```

## ⚙️ Variáveis de Ambiente

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="sua-chave-secreta"
NEXTAUTH_URL="http://localhost:3000"
```
