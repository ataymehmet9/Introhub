module.exports = {
  apps: [
    {
      name: 'introhub-web',
      script: 'pnpm',
      args: 'start:prod',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'introhub-worker',
      script: 'pnpm',
      args: 'start:worker',
      env: {
        NODE_ENV: 'production',
        WORKER_CONCURRENCY: 2,
      },
      instances: 1, // Start with 1, scale as needed with: pm2 scale introhub-worker 3
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/worker-error.log',
      out_file: './logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}

// Made with Bob
