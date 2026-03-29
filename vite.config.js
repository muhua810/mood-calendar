import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// 支持多平台部署：Cloudflare Pages / GitHub Pages / Vercel
// 默认 '/' (Cloudflare/Vercel 自定义域名)，通过环境变量覆盖
export default defineConfig({
  base: process.env.VITE_BASE_URL || '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    // 超过 500KB 的 chunk 发出警告
    chunkSizeWarningLimit: 500,
    // 生产环境不生成 source map
    sourcemap: false,
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 代码分割：将大型依赖单独拆包，减少首屏体积
    rollupOptions: {
      output: {
        // 文件名带 hash 以支持长期缓存
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Recharts 及其 D3 依赖 — 仅统计页使用
            if (id.includes('recharts') || id.includes('d3-') || id.includes('internmap') || id.includes('delaunator') || id.includes('robust-predicates')) {
              return 'vendor-charts'
            }
            // React Router — 路由相关
            if (id.includes('react-router')) {
              return 'vendor-router'
            }
            // React 核心 — 首屏必须
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react'
            }
            // date-fns — 多处使用但不大
            if (id.includes('date-fns')) {
              return 'vendor-date'
            }
            // DOMPurify — 仅记录页使用
            if (id.includes('dompurify')) {
              return 'vendor-sanitize'
            }
            // 其他 node_modules 兜底
            return 'vendor-misc'
          }
        },
      },
    },
  },
})
