import { createStart, createCsrfMiddleware, createMiddleware } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'

const privatePages = createMiddleware().server(async ({ next }) => {
  setResponseHeader('Cache-Control', 'private, no-store')
  setResponseHeader('X-Content-Type-Options', 'nosniff')
  setResponseHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  return next()
})
export const startInstance = createStart(() => ({
  requestMiddleware: [
    privatePages,
    createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === 'serverFn' }),
  ],
}))
