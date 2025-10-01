import { Elysia } from 'elysia'

export const app = new Elysia({ prefix: '/api' })
    .get('/health', () => ({ status: 'ok', message: 'INDEKS is running', timestamp: Date.now() }))