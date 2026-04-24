module.exports = {
  apps: [
    {
      name: 'darwin-backend',
      cwd: './BackEnd',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    },
    {
      name: 'darwin-python-api',
      cwd: './PythonApi',
      script: 'darwin.py',
      interpreter: '/home/darwinnotbook/SFR3-Darwin-Notebook/PythonApi/venv/bin/python',
    },
    {
      name: 'darwin-expo-production',
      cwd: './FrontEnd',
      script: 'npx',
      args: 'expo start --no-dev --minify',
      env: {
        EXPO_PUBLIC_API_URL: 'http://37.59.111.34:5002',
        EXPO_PUBLIC_USER_API_URL: 'http://37.59.111.34:3001',
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
          PORT: 3002
      }
    },
    {
      name: 'darwin-status-monitor',
      cwd: './StatusService',
      script: 'monitor.js',
      env: {
          NODE_ENV: 'production'
      }
    }
  ]
};
