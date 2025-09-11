import express from 'express';

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
});

const app = express();

// Minimal middleware
app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
  console.log('🩺 Health check requested');
  try {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  console.log('🧪 Test endpoint requested');
  res.json({ message: 'Test successful' });
});

const port = 3002;

app.listen(port, () => {
  console.log(`🚀 Minimal server running on port ${port}`);
  console.log('📋 Available endpoints:');
  console.log('   GET /api/health');
  console.log('   GET /api/test');
});

export default app;
