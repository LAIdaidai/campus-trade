#!/usr/bin/env node

// 自定义Vite预览启动脚本，完全禁用Host检查
import { preview } from 'vite'
import { resolveConfig } from 'vite'

// 设置环境变量，禁用Host检查
process.env.VITE_DISABLE_HOST_CHECK = 'true'
process.env.NODE_ENV = 'production'

const config = await resolveConfig({}, 'build')

// 修改配置，完全禁用Host检查并添加代理
config.preview = {
  ...config.preview,
  host: '0.0.0.0',
  port: process.env.VITE_PORT || 5173,
  strictPort: false,
  cors: true,
  // 完全禁用Host检查 - 使用多种方法确保生效
  disableHostCheck: true,
  // 允许所有主机访问 - 使用数组形式更可靠
  allowedHosts: ['all', 'localhost', '0.0.0.0', '127.0.0.1', 'www.laidaidai.xyz'],
  // 强制设置为生产环境模式
  define: {
    'import.meta.env.PROD': true
  },
  // 添加代理配置
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
}

// 添加中间件来完全绕过Host检查
config.preview.middlewareMode = false
config.preview.server = {
  hmr: false
}

// 启动预览服务器
const server = await preview(config)

console.log(`🚀 前端服务已启动:`)
console.log(`   本地访问: http://localhost:${config.preview.port}`)
console.log(`   外部访问: http://0.0.0.0:${config.preview.port}`)
console.log(`   Host检查: 已禁用`)
console.log(`   允许的主机: ${config.preview.allowedHosts.join(', ')}`)
console.log(`   代理配置: /api 和 /uploads 已配置`)
