// Room - Individual game room
const { Match } = require('./Match.js');

class Room {
    constructor(server, roomId, host, config) {
        this.server = server;
        this.roomId = roomId;
        this.hostId = host.id;
        this.players = new Map();
        this.maxPlayers = config.maxPlayers || 8;
        this.map = config.map || 'desertOutpost';
        this.mode = config.mode || 'freeForAll';
        this.timeLimit = config.timeLimit || 600;
        this.scoreLimit = config.scoreLimit || 20;
        
        this.state = 'waiting'; // waiting, starting, playing, ending, closed
        this.match = null;
        this.readyPlayers = new Set();
        
        // Add host to players
        this.addPlayer(host);
    }

    addPlayer(client) {
        if (this.players.size >= this.maxPlayers) return false;
        
        const playerData = {
            id: client.id,
            displayName: client.displayName,
            level: client.level,
            ready: false,
            joinedAt: Date.now(),
        };
        
        this.players.set(client.id, playerData);
        
        // Notify others
        this.broadcast('PLAYER_JOIN', { player: playerData }, client.id);
        
        // Send current state to new player
        this.sendLobbyState(client);
        
        return true;
    }

    removePlayer(client) {
        this.players.delete(client.id);
        this.readyPlayers.delete(client.id);
        
        this.broadcast('PLAYER_LEAVE', { playerId: client.id });
    }

    setPlayerReady(playerId, ready) {
        const player = this.players.get(playerId);
        if (player) {
            player.ready = ready;
            if (ready) {
                this.readyPlayers.add(playerId);
            } else {
                this.readyPlayers.delete(playerId);
            }
        }
    }

    isFull() {
        return this.players.size >= this.maxPlayers;
    }

    startMatch() {
        if (this.state !== 'waiting') return;
        
        this.state = 'starting';
        this.broadcast('MATCH_STARTING', { 
            map: this.map,
            mode: this.mode,
            countdown: 5,
        });
        
        // Start match after countdown
        setTimeout(() => {
            this.launchMatch();
        }, 5000);
    }

    launchMatch() {
        this.state = 'playing';
        this.match = new Match(this);
        this.match.start();
        
        this.broadcast('MATCH_STARTED', {
            map: this.map,
            mode: this.mode,
            players: Array.from(this.players.values()),
        });
    }

    endMatch(results) {
        this.state = 'ending';
        this.broadcast('MATCH_ENDED', results);
        
        setTimeout(() => {
            this.state = 'waiting';
            this.match = null;
            this.readyPlayers.clear();
            this.broadcastLobbyState();
        }, 10000);
    }

    broadcast(type, data, excludeId = null) {
        this.players.forEach((player, playerId) => {
            if (playerId !== excludeId) {
                const client = Array.from(this.server.clients.values()).find(c => c.id === playerId);
                if (client && client.ws) {
                    this.server.send(client.ws, type, data);
                }
            }
        });
    }

    broadcastLobbyState() {
        this.broadcast('LOBBY_STATE', {
            roomId: this.roomId,
            hostId: this.hostId,
            map: this.map,
            mode: this.mode,
            maxPlayers: this.maxPlayers,
            players: Array.from(this.players.values()),
            state: this.state,
        });
    }

    sendLobbyState(client) {
        this.server.send(client.ws, 'LOBBY_STATE', {
            roomId: this.roomId,
            hostId: this.hostId,
            map: this.map,
            mode: this.mode,
            maxPlayers: this.maxPlayers,
            players: Array.from(this.players.values()),
            state: this.state,
        });
    }

    destroy() {
        this.state = 'closed';
        if (this.match) {
            this.match.destroy();
        }
        this.broadcast('ROOM_CLOSED', { roomId: this.roomId });
    }
}

module.exports = { Room };
