/**
 * WebSocket Proxy for FreeSWITCH
 * Adds Sec-WebSocket-Protocol header in response for SIP.js compatibility
 */

const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');

const PROXY_PORT = 8083;
const FREESWITCH_WSS = 'wss://127.0.0.1:7443';

// Create HTTPS server with self-signed cert (for local testing)
const server = https.createServer({
  // Self-signed cert for testing - in production use proper cert
  cert: fs.readFileSync('/etc/ssl/certs/ssl-cert-snakeoil.pem', 'utf8'),
  key: fs.readFileSync('/etc/ssl/private/ssl-cert-snakeoil.key', 'utf8'),
  rejectUnauthorized: false,
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (clientWs, req) => {
  console.log('[Proxy] New client connection');
  
  // Extract Sec-WebSocket-Protocol from client request
  const clientProtocol = req.headers['sec-websocket-protocol'] || 'sip';
  
  // Connect to FreeSWITCH
  const freeswitchWs = new WebSocket(FREESWITCH_WSS, {
    rejectUnauthorized: false, // Accept self-signed cert
    headers: {
      'Sec-WebSocket-Protocol': clientProtocol,
    },
  });
  
  freeswitchWs.on('open', () => {
    console.log('[Proxy] Connected to FreeSWITCH');
    
    // Forward messages from client to FreeSWITCH
    clientWs.on('message', (data) => {
      if (freeswitchWs.readyState === WebSocket.OPEN) {
        freeswitchWs.send(data);
      }
    });
    
    // Forward messages from FreeSWITCH to client
    freeswitchWs.on('message', (data) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data);
      }
    });
  });
  
  freeswitchWs.on('error', (error) => {
    console.error('[Proxy] FreeSWITCH error:', error);
    clientWs.close(1006, 'FreeSWITCH connection failed');
  });
  
  freeswitchWs.on('close', () => {
    console.log('[Proxy] FreeSWITCH disconnected');
    clientWs.close();
  });
  
  clientWs.on('close', () => {
    console.log('[Proxy] Client disconnected');
    freeswitchWs.close();
  });
  
  clientWs.on('error', (error) => {
    console.error('[Proxy] Client error:', error);
    freeswitchWs.close();
  });
});

server.listen(PROXY_PORT, () => {
  console.log(`[Proxy] WebSocket proxy listening on port ${PROXY_PORT}`);
  console.log(`[Proxy] Forwarding to FreeSWITCH at ${FREESWITCH_WSS}`);
});

