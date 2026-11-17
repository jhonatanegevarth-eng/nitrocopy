// PM2 ecosystem — NitroCopy
// Uso: pm2 start ecosystem.config.js
//      pm2 save && pm2 startup (para sobreviver ao reboot)
//
// FONTE DO PROVIDER:
//   A escolha de provider (openai/venice) vem do banco de dados (user_settings.ai_provider).
//   O env AI_PROVIDER funciona como fallback quando o usuário não definiu nas Configurações.
//   Preencha AI_PROVIDER com o default do sistema — o usuário pode sobrescrever nas Configurações.

module.exports = {
  apps: [
    {
      name: "nitrocopy",
      script: ".next/standalone/server.js",
      cwd: "/var/www/nitrocopy/app",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1",

        // Supabase — obrigatório
        NEXT_PUBLIC_SUPABASE_URL: "https://XXXXX.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJ...",
        SUPABASE_SERVICE_ROLE_KEY: "eyJ...",

        // Default do sistema para provider de IA.
        // O usuário pode sobrescrever por conta em Configurações (user_settings.ai_provider).
        // Cascata: DB > AI_PROVIDER > "openai" (hardcoded em provider.ts)
        AI_PROVIDER: "venice",
      },
      max_memory_restart: "512M",
      restart_delay: 3000,
    },
  ],
};
