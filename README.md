# AI.Rancho — Gestao Rural Inteligente

Sistema completo de gestao pecuaria para fazendas que trabalham com gado leiteiro, Nelore/corte e ovinos. Desenvolvido com foco em UX e baseado em praticas cientificas da pecuaria brasileira (Embrapa, FAMACHA, curva de lactacao de Wood).

## Login Demo

| Campo | Valor |
|-------|-------|
| **URL** | http://localhost:3000 |
| **Email** | demo@airancho.com |
| **Senha** | demo123 |

---

## Modulos

### Rebanho (por tipo)

| Modulo | Funcionalidades |
|--------|----------------|
| **Gado de Leite** | Lista com DEL (Dias em Lactacao), producao do dia, alerta quando DEL > 305 dias (secagem) |
| **Nelore / Corte** | Rebanho com pesagens, GPD calculado, destaque de animais prontos para venda (>= 480 kg) |
| **Ovinos** | Rebanho, registros de tosquia (peso + qualidade da la), avaliacao FAMACHA escala 1-5 |

### Producao

| Modulo | Funcionalidades |
|--------|----------------|
| **Leite** | Lancamento diario manha/tarde, grafico de producao, aba de estoque com saldo em tempo real, saidas manuais (descarte, consumo proprio) |
| **Reproducao** | IATF, diagnostico de gestacao, partos, secagem — filtros por tipo |
| **Sanitario** | Vacinas, tratamentos, vermifugacoes, controle de carencia, agendamento |

### Financeiro

| Modulo | Funcionalidades |
|--------|----------------|
| **Vendas** | Venda de leite (valida saldo), venda de animal com selecao e baixa automatica, venda de la e carne |
| **Despesas** | Registro por categoria (alimentacao, medicamentos, equipamentos, mao de obra) |
| **Financeiro** | DRE grafico, receita vs despesas por mes, margem de lucro |

### Gestao

| Modulo | Funcionalidades |
|--------|----------------|
| **Dashboard** | Resumo executivo — animais, leite do dia, receita, despesas, grafico do mes |
| **Funcionarios** | Cadastro, pagamentos (salario, bonus, adiantamento) |
| **Estoque** | Insumos (racao, medicamentos, equipamentos, combustivel) com alerta de estoque baixo |
| **Agenda** | Calendario de eventos (vacinacao, pesagem, parto, venda) |
| **Metas** | Definicao e acompanhamento de metas por periodo |
| **Relatorios** | Export CSV: vendas, leite, estoque, pesagens, sanitario, reproducao |

---

## Regras de Negocio

- **Venda de leite** — sistema valida saldo disponivel; bloqueia a venda se quantidade > saldo em estoque
- **Venda de animal** — selecione os animais no formulario; todos sao automaticamente marcados como VENDIDO
- **Producao de leite** — cada lancamento alimenta o estoque automaticamente
- **FAMACHA** — escores 1-2 (OK), 3 (monitorar), 4-5 (vermifugar obrigatoriamente)
- **DEL** — vacas com DEL > 305 dias recebem alerta de secagem no modulo Gado de Leite
- **GPD** — calculado automaticamente entre as duas ultimas pesagens do animal

---

## Inicio Rapido

### Pre-requisitos
- Node.js 18+
- npm

### Instalacao

```bash
# 1. Clonar e instalar
git clone https://github.com/jpedroparro/ai-rancho.git
cd ai-rancho
npm install

# 2. Configurar variaveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas chaves

# 3. Iniciar servidor
npm run dev
```

Acesse **http://localhost:3000** e clique em **Popular Dados Demo** (ou POST /api/seed).

### Variaveis de Ambiente

```env
NEXTAUTH_SECRET=sua-chave-secreta-aqui
NEXTAUTH_URL=http://localhost:3000
```

---

## Testes

```bash
npm test
```

**75 testes** cobrindo os servicos principais:

| Suite | Testes |
|-------|--------|
| milk-stock.service | 7 — saldo, entradas, saidas, bloqueio sem saldo, isolamento por fazenda |
| weight.service | 5 — criacao, GPD, atualizacao do animal |
| health.service | 5 — criacao, calculo de carencia, delecao |
| reproduction.service | 4 — inseminacao, diagnostico, ordenacao |
| shearing.service | 4 — tosquia, qualidade de la, defaults |
| Demais suites | 50 — animals, milk, sales, goals, inventory, production-cost |

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | Next.js 14 (App Router), React 18, Recharts |
| **Backend** | Next.js API Routes (serverless) |
| **Banco de dados** | SQLite via sql.js (arquivo dev.db) |
| **Autenticacao** | NextAuth.js v4 (credentials + JWT) |
| **Linguagem** | TypeScript |
| **Testes** | Jest + ts-jest |

---

## Estrutura

```
src/
  app/
    (app)/          # Paginas protegidas
      dashboard/
      dairy/        # Gado de leite
      beef/         # Nelore / corte
      sheep/        # Ovinos
      milk/         # Producao + estoque
      reproduction/
      health/       # Sanitario
      sales/
      expenses/
      financial/
      reports/
      ...
    api/            # API Routes
  lib/
    repositories/   # Acesso ao banco
    services/       # Regras de negocio
    __tests__/      # Testes Jest
  components/
    layout/         # Sidebar, Header
```

---

## Multi-fazenda

O sistema suporta multiplas fazendas por usuario. Selecione a fazenda ativa no seletor do cabecalho — todos os dados sao filtrados automaticamente.

