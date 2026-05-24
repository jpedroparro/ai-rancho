#!/bin/bash
set -e
echo "🌿 Configurando Irancho..."
npm install
echo "📦 Criando banco de dados..."
npx prisma db push
echo "🌱 Populando dados de demonstração..."
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
echo ""
echo "✅ Tudo pronto!"
echo ""
echo "▶️  Para iniciar: npm run dev"
echo "🌐 Acesse: http://localhost:3000"
echo "📧 Login: demo@irancho.com"
echo "🔑 Senha: demo123"
