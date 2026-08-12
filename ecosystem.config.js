module.exports = {
  apps: [
    {
      name: 'mylibrary-back',
      script: 'dist/main.js',
      exec_mode: 'cluster',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
