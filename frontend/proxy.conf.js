const PROXY_CONFIG = [
  {
    context: ['/api/**'],
    target: 'http://localhost:8080',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
    bypass: function (req, res, proxyOptions) {
      // If the request accepts HTML, it's likely a browser navigation request
      // that should be handled by Angular router, not proxied to the API
      if (req.headers.accept && req.headers.accept.indexOf('html') !== -1) {
        console.log('Bypassing proxy for browser request:', req.url);
        return '/index.html';
      }
      // For API requests (JSON/XML), continue with proxy
      return null;
    },
    onProxyRes: function (proxyRes, req, res) {
      // Add CORS headers to all responses
      proxyRes.headers['Access-Control-Allow-Origin'] = '*';
      proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
      
      console.log('Proxy response:', req.method, req.url, '→', proxyRes.statusCode);
    },
    onProxyReq: function (proxyReq, req, res) {
      console.log('Proxying request:', req.method, req.url);
    },
    onError: function (err, req, res) {
      console.error('Proxy error for', req.method, req.url, ':', err.message);
      
      // Send a proper error response instead of HTML
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Proxy Error', 
          message: 'Failed to connect to backend server',
          details: err.message 
        }));
      }
    }
  }
];

module.exports = PROXY_CONFIG; 