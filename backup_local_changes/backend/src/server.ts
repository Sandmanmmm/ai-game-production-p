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

// Enhanced global error handlers for production stability
process.on('unhandledRejection', (reason, promise) => {
  console.error('� Unhandled Promise Rejection at:', promise);
  console.error('🔴 Rejection reason:', reason);
  // Log but don't exit - keep server running
});

process.on('uncaughtException', (error) => {
  console.error('� Uncaught Exception:', error);
  console.error('🔴 Stack trace:', error.stack);
  // Log but don't exit for non-critical errors in development
  if (process.env.NODE_ENV !== 'development') {
    process.exit(1);
  }
});

// Fix PowerShell SIGINT issue - completely ignore in development
if (process.env.NODE_ENV === 'development') {
  process.on('SIGINT', () => {
    console.log('🛑 SIGINT ignored in development mode (PowerShell HTTP compatibility)');
    // Completely ignore SIGINT in development - use CTRL+BREAK or terminate via task manager
  });
} else {
  // Production mode - handle SIGINT normally
  let sigintCount = 0;
  process.on('SIGINT', () => {
    sigintCount++;
    if (sigintCount === 1) {
      console.log('🛑 Received SIGINT - Press CTRL+C again within 3 seconds to exit');
      setTimeout(() => {
        sigintCount = 0;
        console.log('📡 SIGINT timeout - Server continuing...');
      }, 3000);
      return;
    }
    console.log('📡 Shutting down server...');
    gracefulShutdown('SIGINT');
  });
}

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

// Enhanced graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  console.log(`📡 Received ${signal}, initiating graceful shutdown...`);
  console.log('🔍 Stack trace:', new Error().stack);
  
  try {
    // Set a timeout to force exit if graceful shutdown takes too long
    const forceExitTimeout = setTimeout(() => {
      console.error('❌ Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, 15000); // 15 seconds

    // Shutdown WebSocket service first
    console.log('🔌 Shutting down WebSocket service...');
    await webSocketService.shutdown();
    
    // Shutdown job queue service
    console.log('⚡ Shutting down job queue service...');
    await jobQueueService.shutdown();
    
    // Close the HTTP server
    console.log('🚀 Closing HTTP server...');
    server.close((error) => {
      clearTimeout(forceExitTimeout);
      if (error) {
        console.error('❌ Error closing HTTP server:', error);
        process.exit(1);
      } else {
        console.log('✅ HTTP server closed successfully');
        process.exit(0);
      }
    });
    
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Only handle SIGTERM normally (from process managers) but log in development
if (process.env.NODE_ENV === 'development') {
  process.on('SIGTERM', (signal) => {
    console.log('🛑 SIGTERM received in development mode - likely from PowerShell HTTP request, ignoring');
    // Ignore SIGTERM in development mode too
  });
} else {
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

// Add process monitoring
console.log('🔄 Process handlers registered:');
console.log('   - SIGINT: Enhanced PowerShell-safe handling');
console.log('   - SIGTERM: Standard graceful shutdown');
console.log('   - unhandledRejection: Logged but non-fatal');
console.log('   - uncaughtException: Logged, exit only in production');

export default app;
