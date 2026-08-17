// ONEBULLET Server - Main Entry Point
const http = require('http');
const WebSocket = require('ws');
const { GameServer } = require('./GameServer.js');

const PORT = process.env.PORT || 3000;

// Create HTTP server for static files and health check
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200);
        res.end('OK');
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server, path: '/ws' });

// Create game server instance
const gameServer = new GameServer(wss);

wss.on('connection', (ws, req) => {
    console.log('[Server] New connection');
    gameServer.handleConnection(ws);
});

server.listen(PORT, () => {
    console.log(`[Server] ONEBULLET server running on port ${PORT}`);
    console.log(`[Server] WebSocket endpoint: ws://localhost:${PORT}/ws`);
});

process.on('SIGINT', () => {
    console.log('[Server] Shutting down...');
    gameServer.shutdown();
    server.close(() => {
        console.log('[Server] Closed');
        process.exit(0);
    });
});
