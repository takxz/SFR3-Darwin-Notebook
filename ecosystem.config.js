module.exports = {
  apps: [
    {
      name: 'darwin-backend',
      cwd: './BackEnd',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'darwin-python-api',
      cwd: './PythonApi',
      script: 'darwin.py',
      interpreter: '/home/darwinnotbook/SFR3-Darwin-Notebook/PythonApi/venv/bin/python',
    },
    {
      name: 'darwin-expo-develop',
      cwd: './FrontEnd',
      script: 'npx',
      args: 'expo start --no-dev',
      env: {
        // You can force the host if needed
        // EXPO_PACKAGER_HOSTNAME: 'votre-domaine.com'
      }
    },
    {
      name: 'darwin-landing-page',
      cwd: './LandingPage',
      script: 'node',
      args: 'server.js',
      env: {
          PORT: 3000
      }
    }
  ]
};
