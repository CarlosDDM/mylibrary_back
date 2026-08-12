module.exports = {
  apps: [
    {
      name: 'mylibrary-back',
      script: 'dist/main.js',
      exec_mode: 'cluster',
      instances: 1,
      time: true,
      merge_logs: true,
      listen_timeout: 30000,
      kill_timeout: 10000,
      exp_backoff_restart_delay: 1000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
