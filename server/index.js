import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import connect from './db.js'
import aiRouter from './routes/ai.js'
import profilesRouter from './routes/profiles.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', /\.vercel\.app$/],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}))
app.use(express.json({ limit: '1mb' }))

app.use('/api/auth',  authRoutes)


if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
    next()
  })
}


app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }))
app.use('/api/profiles', profilesRouter)
app.use('/api', aiRouter)


app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))

app.use((err, _req, res, _next) => {
  console.error('[Server Error]', err)
  res.status(500).json({ error: 'Internal server error' })
})


connect().then(() => {
  app.listen(PORT, () => {
    console.log(`TDC server running on port ${PORT}`)
    console.log(`GROQ key present: ${!!process.env.GROQ_API_KEY}`)
    console.log(`Email configured: ${!!process.env.EMAIL_USER}`)
    console.log(`MongoDB URI set:  ${!!process.env.MONGO_URI}`)
  })
})