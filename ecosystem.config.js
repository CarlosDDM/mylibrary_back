module.exports = {
  apps: [
    {
      name: 'mylibrary-back',
      script: 'dist/main.js',
      exec_mode: 'cluster',
      instances: 'max',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
