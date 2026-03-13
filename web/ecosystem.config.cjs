module.exports = {
  apps: [
    {
      name: 'vaspeak-prod',
      script: 'npm',
      args: 'run preview -- --port 19300 --host',
      cwd: './web',
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'vaspeak-dev',
      script: 'npm',
      args: 'run dev -- --port 19301 --host',
      cwd: './web',
      watch: false,
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
