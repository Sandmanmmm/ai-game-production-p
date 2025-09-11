const http = require('http');

console.log('🚀 Starting ultra-minimal HTTP server...');

const server = http.createServer((req, res) => {
  console.log(`📥 Request received: ${req.method} ${req.url}`);
  
  try {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    }));
    console.log('✅ Response sent successfully');
  } catch (error) {
    console.error('❌ Error sending response:', error);
  }
});

server.on('error', (error) => {
  console.error('🚨 Server error:', error);
});

server.on('close', () => {
  console.log('⚠️ Server closed');
});

process.on('SIGINT', () => {
  console.log('📡 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('📡 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

const PORT = 3003;
server.listen(PORT, () => {
  console.log(`🚀 Ultra-minimal server running on port ${PORT}`);
  console.log(`🔗 Test with: curl http://localhost:${PORT}/`);
});

console.log('✅ Server setup complete');
