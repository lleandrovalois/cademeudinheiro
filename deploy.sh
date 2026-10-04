#!/usr/bin/env bash
# ====================================================================
# Script de Deploy Automático para Hostinger VPS (Ubuntu 24.04 LTS)
# Projeto: Cadê Meu Dinheiro (FinControl)
# ====================================================================

set -e

echo "🚀 Iniciando deploy do Cadê Meu Dinheiro..."

# 1. Verifica se Docker está instalado no Ubuntu 24.04
if ! command -v docker &> /dev/null; then
    echo "📦 Docker não encontrado. Instalando Docker no Ubuntu 24.04..."
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo systemctl enable --now docker
    echo "✅ Docker instalado com sucesso!"
fi

# 2. Configura arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env a partir de .env.example..."
    cp .env.example .env
fi

# 3. Executa o build e inicia o container com Docker Compose
echo "🔨 Compilando e iniciando os containers..."
docker compose down || true
docker compose up -d --build

# 4. Status da aplicação
echo "🎉 Deploy concluído com sucesso!"
docker compose ps
echo ""
echo "👉 Aplicação disponível na porta 3000 do seu IP da VPS (ex: http://SEU_IP:3000)"
echo "💡 Para visualizar os logs em tempo real, use: docker compose logs -f"
