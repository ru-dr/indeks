import { Elysia } from 'elysia'
import { openapi } from '@elysiajs/openapi'

export const app = new Elysia({ prefix: '/api' })
    .get('/health', () => ({ status: 'ok', message: 'INDEKS is running', timestamp: Date.now() }))
    .use(openapi())