import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import passport from './config/passport';
import { config } from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { jobQueueService } from './services/jobQueue';
import { assetGenerationWorker } from './services/assetGenerationWorker';
import { llmOrchestrator } from './services/llmOrchestrator';
import { webSocketService } from './services/webSocketService';

// Global error handlers to catch unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  // Don't exit the process, just log
});

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
    },
  },
});
app.use('/api/', limiter);

// CORS configuration - support multiple frontend ports
app.use(cors({
  origin: [
    'http://localhost:5000',
    'http://localhost:5173',
    config.frontendUrl
  ],
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session middleware for OAuth
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Serve static assets
app.use('/api/assets', express.static('uploads/assets'));

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to GameForge API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Initialize job queue workers
    console.log('🔄 Initializing job queue workers...');
    await assetGenerationWorker.initialize();
    
    // LLM Orchestrator is automatically initialized on import
    console.log('🧠 LLM Orchestrator initialized');
    
    // Initialize WebSocket service
    console.log('🔌 Initializing WebSocket service...');
    webSocketService.initialize(server);
    
    server.listen(config.port, () => {
      console.log(`🚀 GameForge API server running on port ${config.port}`);
      console.log(`📝 Environment: ${config.nodeEnv}`);
      console.log(`🌐 CORS enabled for: ${config.frontendUrl}`);
      console.log(`💾 Database: ${config.databaseUrl ? 'Connected' : 'Not configured'}`);
      console.log(`⚡ Redis & Job Queue: Initialized`);
      console.log(`🧠 LLM Orchestrator: Ready`);
      console.log(`🔌 WebSocket: Ready`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  console.log(`📡 Received ${signal}, shutting down gracefully...`);
  
  try {
    // Shutdown WebSocket service first
    await webSocketService.shutdown();
    
    // Shutdown job queue service
    await jobQueueService.shutdown();
    
    // Close the HTTP server
    server.close(() => {
      console.log('🚀 HTTP server closed');
      process.exit(0);
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('❌ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
    
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;
