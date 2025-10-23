import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  // 构建优化
  build: {
    // 启用代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          utils: ['axios']
        }
      }
    },
    // 压缩选项
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // 资源内联阈值
    assetsInlineLimit: 4096
  },
  // 模块预加载配置 - 替换已弃用的polyfillModulePreload
  modulePreload: {
    polyfill: true
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: '0.0.0.0', // 监听所有网络接口，允许外部访问
    port: process.env.VITE_PORT || 5173,
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: process.env.VITE_API_TARGET || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        // 添加缓存头
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // 为图片添加缓存头
            if (req.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              proxyRes.headers['Cache-Control'] = 'public, max-age=31536000' // 1年
              proxyRes.headers['Expires'] = new Date(Date.now() + 31536000000).toUTCString()
            }
          })
        }
      }
    }
  },
  preview: {
    host: '0.0.0.0', // 预览模式也监听所有网络接口
    port: process.env.VITE_PORT || 5173,
    strictPort: false, // 允许端口自动调整
    cors: true, // 启用CORS
    // 完全禁用Host检查 - 使用更激进的方法
    disableHostCheck: true,
    // 允许所有主机访问 - 使用数组形式更可靠
    allowedHosts: ['all', 'localhost', '0.0.0.0', '127.0.0.1', 'www.laidaidai.xyz'],
    // 强制设置为生产环境模式
    define: {
      'import.meta.env.PROD': true
    },
    // 添加中间件来完全绕过Host检查
    middlewareMode: false,
    // 禁用所有安全检查
    server: {
      hmr: false
    }
  }
})
