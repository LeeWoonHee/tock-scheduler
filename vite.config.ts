import { defineConfig, loadEnv } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { createRequire } from 'node:module'

export default defineConfig(({ mode, command }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  let authInstalled = false
  try {
    createRequire(import.meta.url).resolve('better-auth')
    authInstalled = true
  } catch {
    if (command === 'build')
      console.warn(
        'Better Auth가 설치되지 않았습니다. OAuth 검증과 배포 전 npm install을 실행하세요.',
      )
  }
  return {
    resolve: { tsconfigPaths: true },
    plugins: [
      tailwindcss(),
      tanstackStart(),
      ...(command === 'build' ? [nitro({ traceDeps: authInstalled ? ['better-auth*'] : [] })] : []),
      react(),
    ],
  }
})
