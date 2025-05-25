import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Routes
import authRoutes from './routes/auth';
import agentRoutes from './routes/agents';
import onboardingRoutes from './routes/onboarding';
import widgetRoutes from './routes/widget';
import analysisRoutes from './routes/analysis';

// Middleware
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Prisma
export const prisma = new PrismaClient();

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Слишком много запросов, попробуйте снова позже'
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      frameAncestors: ["'self'", "*"],
      frameSrc: ["'self'", "*"],
    },
  },
  xFrameOptions: false, // Отключаем X-Frame-Options чтобы разрешить iframe
}));
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/analysis', analysisRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Подключение к базе данных установлено');
    
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('⏹️  Graceful shutdown...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('⏹️  Graceful shutdown...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer(); 