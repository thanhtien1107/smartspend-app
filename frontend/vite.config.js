const { defineConfig, loadEnv } = require('vite');
const vue = require('@vitejs/plugin-vue');
const path = require('path');

module.exports = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_API_PROXY_TARGET || `http://localhost:${env.PORT || 4000}`;

  return {
    root: path.resolve(__dirname, 'src'),
    envDir: path.resolve(__dirname, '..'),
    publicDir: path.resolve(__dirname, 'public'),
    plugins: [vue()],
    server: {
      port: Number(env.VITE_DEV_PORT || 5173),
      strictPort: false,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false
        },
        '/test': {
          target: backendTarget,
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      outDir: path.resolve(__dirname, 'public', 'vue-dist'),
      emptyOutDir: true
    }
  };
});
