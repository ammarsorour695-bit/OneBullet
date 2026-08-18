// Matchmaking - Basic queue system for finding matches
const { v4: uuidv4 } = require('uuid');

class Matchmaking {
    constructor(server) {
        this.server = server;
        this.queues = new Map(); // mode -> Set of playerIds
        
        // Queue configurations
        this.queueConfigs = {
            freeForAll: {
                minPlayers: 2,
                maxPlayers: 8,
                timeout: 30000, // 30 seconds
            },
            teamDeathmatch: {
                minPlayers: 4,
                maxPlayers: 10,
                timeout: 45000,
            },
            elimination: {
                minPlayers: 3,
                maxPlayers: 8,
                timeout: 30000,
            },
        };
        
        // Player queue data
        this.playerQueueData = new Map(); // playerId -> { mode, joinedAt }
        
        console.log('[Matchmaking] Initialized');
    }

    joinQueue(playerId, mode = 'freeForAll') {
        const client = this.server.clients.get(playerId);
        if (!client) return false;
        
        // Already in queue?
        if (this.playerQueueData.has(playerId)) {
            this.server.send(client.ws, 'ERROR', { message: 'Already in queue' });
            return false;
        }
        
        // Get or create queue
        if (!this.queues.has(mode)) {
            this.queues.set(mode, new Set());
        }
        
        const queue = this.queues.get(mode);
        queue.add(playerId);
        
        this.playerQueueData.set(playerId, {
            mode,
            joinedAt: Date.now(),
        });
        
        // Notify player
        this.server.send(client.ws, 'QUEUE_JOINED', {
            mode,
            position: queue.size,
        });
        
        console.log(`[Matchmaking] ${playerId} joined ${mode} queue`);
        
        // Check if we can start a match
        this.checkQueue(mode);
        
        // Set timeout check
        setTimeout(() => this.checkQueueTimeout(playerId, mode), 
            this.queueConfigs[mode]?.timeout || 30000);
        
        return true;
    }

    leaveQueue(playerId) {
        const data = this.playerQueueData.get(playerId);
        if (!data) return;
        
        const queue = this.queues.get(data.mode);
        if (queue) {
            queue.delete(playerId);
        }
        
        this.playerQueueData.delete(playerId);
        
        const client = this.server.clients.get(playerId);
        if (client) {
            this.server.send(client.ws, 'QUEUE_LEFT', { mode: data.mode });
        }
        
        console.log(`[Matchmaking] ${playerId} left ${data.mode} queue`);
    }

    checkQueue(mode) {
        const queue = this.queues.get(mode);
        if (!queue || queue.size === 0) return;
        
        const config = this.queueConfigs[mode];
        if (!config) return;
        
        // Check if we have enough players
        if (queue.size >= config.minPlayers) {
            this.startMatch(mode, config);
        }
    }

    checkQueueTimeout(playerId, mode) {
        const data = this.playerQueueData.get(playerId);
        if (!data || data.mode !== mode) return;
        
        // Still in queue?
        const queue = this.queues.get(mode);
        if (!queue || !queue.has(playerId)) return;
        
        const elapsed = Date.now() - data.joinedAt;
        const timeout = this.queueConfigs[mode]?.timeout || 30000;
        
        if (elapsed >= timeout) {
            // Timeout - try to find any available game or notify
            const client = this.server.clients.get(playerId);
            if (client) {
                this.server.send(client.ws, 'QUEUE_TIMEOUT', {
                    message: 'Match not found, try again later',
                });
            }
            
            this.leaveQueue(playerId);
        }
    }

    startMatch(mode, config) {
        const queue = this.queues.get(mode);
        if (!queue || queue.size < config.minPlayers) return;
        
        // Take players from queue
        const players = Array.from(queue).slice(0, config.maxPlayers);
        if (players.length < config.minPlayers) return;
        
        players.forEach(id => queue.delete(id));
        
        // Create room with these players
        const room = this.server.roomManager.createRoom(
            { id: players[0], ws: null }, // Host placeholder
            {
                mode,
                maxPlayers: config.maxPlayers,
                map: this.selectMap(),
                timeLimit: 600,
                scoreLimit: 20,
            }
        );
        
        if (!room) return;
        
        // Add all players to room
        players.forEach((playerId, index) => {
            const client = this.server.clients.get(playerId);
            if (client) {
                // Clear queue data
                this.playerQueueData.delete(playerId);
                
                // First player becomes host
                if (index === 0) {
                    room.hostId = playerId;
                }
                
                // Add to room
                room.addPlayer(client);
                
                // Notify player
                this.server.send(client.ws, 'MATCH_FOUND', {
                    roomId: room.roomId,
                    mode,
                    map: room.map,
                });
            }
        });
        
        console.log(`[Matchmaking] Started ${mode} match with ${players.length} players in room ${room.roomId}`);
        
        // Auto-start after brief delay
        setTimeout(() => {
            if (room.state === 'waiting') {
                room.startMatch();
            }
        }, 5000);
    }

    selectMap() {
        const maps = ['desertOutpost', 'industrialYard', 'mountainBase', 'cityRooftops'];
        return maps[Math.floor(Math.random() * maps.length)];
    }

    getQueueStatus(playerId) {
        const data = this.playerQueueData.get(playerId);
        if (!data) return null;
        
        const queue = this.queues.get(data.mode);
        return {
            mode: data.mode,
            position: Array.from(queue).indexOf(playerId) + 1,
            total: queue?.size || 0,
            estimatedTime: Math.max(0, data.joinedAt + 30000 - Date.now()),
        };
    }

    shutdown() {
        this.queues.clear();
        this.playerQueueData.clear();
    }
}

module.exports = { Matchmaking };
