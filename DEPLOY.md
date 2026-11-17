# NitroCopy — Deploy no VPS

## Pré-requisitos no VPS
- Node.js 18+ (via nvm ou nodesource)
- PM2 (`npm install -g pm2`)
- Git instalado

---

## 1. Criar repositório no GitHub (fazer uma vez)

No seu computador local:

```bash
# Crie um repositório PRIVADO em github.com e copie a URL, depois:
cd "C:\Users\Jhonatan Egevarth\nitrocopy"
git remote add origin https://github.com/SEU_USUARIO/nitrocopy.git
git push -u origin master
```

---

## 2. Configurar o VPS (primeira vez)

SSH no VPS e execute:

```bash
# Clone o projeto
mkdir -p /var/www/nitrocopy
cd /var/www/nitrocopy
git clone https://github.com/SEU_USUARIO/nitrocopy.git app
cd app

# Instale dependências
npm ci

# Build
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Copie assets estáticos para standalone
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
cp -r knowledge .next/standalone/knowledge

# Crie o ecosystem.config.js com suas credenciais reais
cp ecosystem.config.example.js ecosystem.config.js
nano ecosystem.config.js   # edite com as credenciais reais do Supabase
```

### Conteúdo do ecosystem.config.js no VPS:
```javascript
module.exports = {
  apps: [{
    name: "nitrocopy",
    script: ".next/standalone/server.js",
    cwd: "/var/www/nitrocopy/app",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      PORT: 3000,
      HOSTNAME: "127.0.0.1",
      NEXT_PUBLIC_SUPABASE_URL: "https://XXXXX.supabase.co",   // ← REAL
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJ...",                  // ← REAL
      SUPABASE_SERVICE_ROLE_KEY: "eyJ...",                      // ← REAL
      AI_PROVIDER: "venice",
    },
    max_memory_restart: "512M",
    restart_delay: 3000,
  }],
};
```

```bash
# Inicie o app com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # siga as instruções para sobreviver ao reboot
```

---

## 3. Schema do banco (fazer uma vez no Supabase)

1. Abra o [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá em **SQL Editor**
3. Cole o conteúdo de `supabase-schema.sql` e execute

---

## 4. Configurar Nginx (apontar domínio)

```nginx
server {
    listen 80;
    server_name SEU_DOMINIO.com www.SEU_DOMINIO.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Ative o SSL com Certbot
certbot --nginx -d SEU_DOMINIO.com -d www.SEU_DOMINIO.com
```

---

## 5. Deploys futuros (após mudanças no código)

No seu computador local:
```bash
cd "C:\Users\Jhonatan Egevarth\nitrocopy"
git add .
git commit -m "descrição da mudança"
git push
```

No VPS:
```bash
cd /var/www/nitrocopy/app
./deploy.sh
```

---

## Variáveis de ambiente do .env.local (scripts de análise local)

```
NEXT_PUBLIC_SUPABASE_URL=https://XXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SCRIPT_AI_API_KEY=sk-...
SCRIPT_AI_PROVIDER=openai
```
