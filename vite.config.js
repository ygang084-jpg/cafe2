import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 새 빌드가 올라오면 서비스워커를 자동 갱신한다.
      registerType: 'autoUpdate',
      // SW 등록 코드는 플러그인이 index.html에 자동 주입한다.
      injectRegister: 'auto',
      // 매니페스트에서 참조하지 않지만 캐시/설치에 쓰이는 정적 파일들.
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: '우리 동네 카페 지도',
        short_name: '카페지도',
        description: '엑셀 카페 목록을 지도에 표시하고 방문 소감을 기록하는 서비스',
        start_url: '/',
        display: 'standalone',
        lang: 'ko',
        // 테마/배경색은 현재 헤더에 맞춤: 배경은 흰 헤더 바(#ffffff),
        // 테마색은 헤더의 브랜드 강조색 emerald-600(#059669).
        theme_color: '#059669',
        background_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            // 홈 화면 아이콘을 마스크 형태로도 쓸 수 있게(선택).
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 앱 셸(HTML/JS/CSS/아이콘)만 프리캐시해 설치·초기 로딩을 빠르게 한다.
        // 카카오맵·Supabase 등 외부 요청은 캐시하지 않는다(온라인에서만 동작).
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
