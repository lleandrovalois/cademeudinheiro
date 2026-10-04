# 💰 Cadê Meu Dinheiro? • Controle Financeiro Inteligente

Aplicação Web moderna, responsiva (*mobile-first*) e completa para gestão e controle financeiro pessoal, despesas fixas, compras parceladas no cartão e metas de economia.

---

## 📱 Destaques da Aplicação

- **Design Mobile-First:** Barra de navegação inferior (*Bottom Navigation*), botão flutuante (*FAB*) e modais em formato *Bottom Sheet*.
- **Dashboard Interativo:** Saldo geral, receitas, despesas, economia do mês e gráficos nativos em SVG (Fluxo de caixa e distribuição por categorias).
- **Lançamentos & Extrato:** Filtros avançados, busca em tempo real e alternância rápida de status (*Pago* / *Pendente*).
- **Despesas Fixas & Recorrentes:** Checklist mensal de contas (Aluguel, Internet, Assinaturas) com alerta de vencimento e quitação automática com 1 toque.
- **Compras Parceladas:** Acompanhamento de faturas e parcelamentos no cartão com barra de progresso, projeção de quitação e antecipação de parcelas com efeito de confetes.
- **Tetos de Orçamento & Metas:** Alertas visuais de limite de gastos por categoria e acompanhamento de metas com aportes.
- **Privacidade & Temas:** Modo de ocultação de valores (`••••••`) e suporte a tema escuro/claro.
- **Arquitetura Híbrida (Local-First + Nuvem):** Funciona 100% offline via `localStorage` e possui integração pronta com banco de dados em nuvem via **Supabase**.

---

## 🛠️ Tecnologias Utilizadas

- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 19, TypeScript)
- **Estilização:** Vanilla CSS moderno (Design System customizado com Glassmorphism)
- **Ícones & Efeitos:** [Lucide React](https://lucide.dev/) e Canvas Confetti
- **Persistência & Nuvem:** LocalStorage (Offline) + [Supabase](https://supabase.com) (PostgreSQL / RLS)
- **Infraestrutura & Container:** Docker multi-stage (Node.js 22 Alpine Standalone) + Docker Compose

---

## 💻 Como Rodar Localmente

1. Clone o repositório:
```bash
git clone https://github.com/lleandrovalois/cademeudinheiro.git
cd cademeudinheiro
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## 🐳 Deploy no Servidor (Hostinger VPS - Ubuntu 24.04 com Docker)

### Passo 1: Conectar na sua VPS via SSH
No seu terminal local:
```bash
ssh root@SEU_IP_DA_VPS
```

### Passo 2: Clonar o Repositório
```bash
git clone https://github.com/lleandrovalois/cademeudinheiro.git
cd cademeudinheiro
```

### Passo 3: Executar o Deploy com 1 Comando
O projeto inclui o script `deploy.sh` que instala o Docker (caso ainda não esteja instalado no Ubuntu 24.04) e sobe o container:

```bash
chmod +x deploy.sh
./deploy.sh
```

Pronto! Sua aplicação estará rodando em segundo plano na porta **3000** (`http://SEU_IP_DA_VPS:3000`).

---

### Passo 4: Configurar Domínio e SSL Gratuito (Opcional - Nginx Reverso)

Se quiser apontar um domínio (ex: `financeiro.seudominio.com.br`) com HTTPS:

1. Instale o Nginx e Certbot:
```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

2. Crie a configuração do site:
```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/cademeudinheiro
sudo nano /etc/nginx/sites-available/cademeudinheiro
# Altere 'seudominio.com.br' para o seu domínio real
```

3. Ative o site e reinicie o Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/cademeudinheiro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. Emita o certificado SSL HTTPS gratuito:
```bash
sudo certbot --nginx -d seu_dominio.com.br
```

---

## 🗄️ Esquema do Banco de Dados (Supabase)

Para sincronizar com o Supabase, utilize o script SQL disponível em:
[`supabase/schema.sql`](./supabase/schema.sql)

Cole e execute o conteúdo no **SQL Editor** do seu painel Supabase.
