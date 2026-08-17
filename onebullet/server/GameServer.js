// Game Server - Main server logic
const { v4: uuidv4 } = require('uuid');
const { RoomManager } = require('./RoomManager.js');
const { Matchmaking } = require('./Matchmaking.js');

class GameServer {
    constructor(wss) {
        this.wss = wss;
        this.clients = new Map();
        this.roomManager = new RoomManager(this);
        this.matchmaking = new Matchmaking(this);
        
        console.log('[GameServer] Initialized');
    }

    handleConnection(ws) {
        const clientId = uuidv4();
        
        const client = {
            id: clientId,
            ws: ws,
            playerId: null,
            roomId: null,
            displayName: `Player_${clientId.slice(0, 6)}`,
            level: 1,
            connectedAt: Date.now(),
            lastPing: Date.now(),
        };

        this.clients.set(clientId, client);
        console.log(`[GameServer] Client connected: ${clientId}`);

        // Send welcome message
        this.send(ws, 'WELCOME', { clientId, serverTime: Date.now() });

        ws.on('message', (data) => this.handleMessage(client, data));
        ws.on('close', () => this.handleDisconnect(client));
        ws.on('error', (err) => console.error('[GameServer] WebSocket error:', err));
    }

    handleMessage(client, raw) {
        try {
            const msg = JSON.parse(raw.toString());
            
            switch (msg.type) {
                case 'connect':
                    this.handleConnect(client, msg.data);
                    break;
                case 'roomCreate':
                    this.roomManager.createRoom(client, msg.data);
                    break;
                case 'roomJoin':
                    this.roomManager.joinRoom(client, msg.data);
                    break;
                case 'roomLeave':
                    this.roomManager.leaveRoom(client);
                    break;
                case 'roomReady':
                    this.roomManager.setReady(client, msg.data?.ready);
                    break;
                case 'roomStart':
                    this.roomManager.startMatch(client);
                    break;
                case 'chatMessage':
                    this.handleChat(client, msg.data);
                    break;
                case 'ping':
                    this.handlePing(client);
                    break;
                case 'input':
                    this.handleInput(client, msg.data);
                    break;
                case 'shoot':
                    this.handleShoot(client, msg.data);
                    break;
                default:
                    console.warn('[GameServer] Unknown message type:', msg.type);
            }
        } catch (err) {
            console.error('[GameServer] Message parse error:', err);
        }
    }

    handleConnect(client, data) {
        if (data.displayName) {
            client.displayName = data.displayName.substring(0, 20);
        }
        
        this.send(client.ws, 'CONNECTED', {
            playerId: client.id,
            displayName: client.displayName,
        });
        
        console.log(`[GameServer] Player ${client.displayName} connected`);
    }

    handleChat(client, data) {
        if (!client.roomId) return;
        
        const room = this.roomManager.getRoom(client.roomId);
        if (!room) return;
        
        // Rate limiting and validation
        const now = Date.now();
        if (client.lastChatTime && now - client.lastChatTime < 500) return;
        client.lastChatTime = now;
        
        const message = (data.message || '').substring(0, 200).trim();
        if (!message) return;
        
        // Broadcast to room
        room.broadcast('CHAT_MESSAGE', {
            playerId: client.id,
            playerName: client.displayName,
            message: message,
            timestamp: now,
        }, client.id);
    }

    handlePing(client) {
        const latency = Date.now() - client.lastPing;
        client.lastPing = Date.now();
        this.send(client.ws, 'PONG', { latency });
    }

    handleInput(client, data) {
        if (!client.roomId) return;
        
        const room = this.roomManager.getRoom(client.roomId);
        if (!room || !room.match) return;
        
        // Forward input to match for processing
        room.match.processInput(client.id, data);
    }

    handleShoot(client, data) {
        if (!client.roomId) return;
        
        const room = this.roomManager.getRoom(client.roomId);
        if (!room || !room.match) return;
        
        // Server-authoritative shot processing
        room.match.processShot(client.id, data);
    }

    handleDisconnect(client) {
        console.log(`[GameServer] Client disconnected: ${client.id}`);
        
        if (client.roomId) {
            this.roomManager.leaveRoom(client);
        }
        
        this.clients.delete(client.id);
    }

    send(ws, type, data = {}) {
        if (ws.readyState === 1) { // WebSocket.OPEN
            ws.send(JSON.stringify({ type, data, timestamp: Date.now() }));
        }
    }

    broadcast(type, data, excludeId = null) {
        this.clients.forEach((client) => {
            if (client.id !== excludeId) {
                this.send(client.ws, type, data);
            }
        });
    }

    shutdown() {
        console.log('[GameServer] Shutting down...');
        
        this.clients.forEach((client) => {
            client.ws.close();
        });
        
        this.roomManager.shutdown();
    }
}

module.exports = { GameServer };
