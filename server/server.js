import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { env } from './src/config/env.js'
import imagekitRoutes from './src/routes/imagekit.routes.js'

const app = express()

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin: env.clientUrl, credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(env.isProd ? 'combined' : 'dev'))

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SkillNest API is running',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  })
})

// ImageKit auth
app.use('/api/imagekit', imagekitRoutes)

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route not found: ${req.method} ${req.originalUrl}` },
  })
})

// Error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500
  if (!env.isProd) console.error(err)
  res.status(status).json({
    success: false,
    error: {
      message: err.message || 'Internal server error',
      ...(env.isProd ? {} : { stack: err.stack }),
    },
  })
})

const server = app.listen(env.port, () => {
  console.log(`🚀 SkillNest API running on http://localhost:${env.port}`)
  console.log(`   Environment: ${env.nodeEnv}`)
  console.log(`   Accepting requests from: ${env.clientUrl}`)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
  server.close(() => process.exit(1))
})
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
  server.close(() => process.exit(1))
})