module.exports = {
  apps: [
    {
      name: 'vaspeak-dev',
      script: 'npm',
      args: 'run dev',
      cwd: './web-app',
      watch: false,
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'vaspeak-prod',
      script: 'npm',
      args: 'run preview -- --port 19300 --host',
      cwd: './web-app',
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
