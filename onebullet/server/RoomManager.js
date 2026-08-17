// Room Manager - Handles game rooms
const { v4: uuidv4 } = require('uuid');
const { Room } = require('./Room.js');

class RoomManager {
    constructor(server) {
        this.server = server;
        this.rooms = new Map();
        this.maxRooms = 100;
    }

    createRoom(host, config = {}) {
        if (this.rooms.size >= this.maxRooms) {
            this.server.send(host.ws, 'ERROR', { message: 'Server full' });
            return null;
        }

        const roomId = uuidv4().slice(0, 8).toUpperCase();
        const room = new Room(this.server, roomId, host, config);
        
        this.rooms.set(roomId, room);
        
        // Notify host
        this.server.send(host.ws, 'ROOM_CREATED', {
            roomId,
            roomCode: roomId,
        });

        console.log(`[RoomManager] Room created: ${roomId} by ${host.displayName}`);
        return room;
    }

    joinRoom(client, data) {
        const { roomId } = data;
        const room = this.rooms.get(roomId);

        if (!room) {
            this.server.send(client.ws, 'ERROR', { message: 'Room not found' });
            return false;
        }

        if (room.isFull()) {
            this.server.send(client.ws, 'ERROR', { message: 'Room is full' });
            return false;
        }

        if (room.state !== 'waiting' && room.state !== 'starting') {
            this.server.send(client.ws, 'ERROR', { message: 'Match in progress' });
            return false;
        }

        room.addPlayer(client);
        client.roomId = roomId;

        // Broadcast updated lobby state
        room.broadcastLobbyState();

        console.log(`[RoomManager] ${client.displayName} joined room ${roomId}`);
        return true;
    }

    leaveRoom(client) {
        if (!client.roomId) return;

        const room = this.rooms.get(client.roomId);
        if (room) {
            room.removePlayer(client);

            if (room.players.size === 0) {
                this.rooms.delete(client.roomId);
                console.log(`[RoomManager] Room ${client.roomId} closed (empty)`);
            } else {
                room.broadcastLobbyState();
                
                // If host left, assign new host
                if (room.hostId === client.id && room.players.size > 0) {
                    const newHost = Array.from(room.players.values())[0];
                    room.hostId = newHost.id;
                    room.broadcast('HOST_CHANGED', { playerId: newHost.id });
                }
            }
        }

        client.roomId = null;
    }

    setReady(client, ready) {
        if (!client.roomId) return;

        const room = this.rooms.get(client.roomId);
        if (room) {
            room.setPlayerReady(client.id, ready);
            room.broadcastLobbyState();
        }
    }

    startMatch(client) {
        if (!client.roomId) return;

        const room = this.rooms.get(client.roomId);
        if (!room) return;

        // Only host can start
        if (room.hostId !== client.id) {
            this.server.send(client.ws, 'ERROR', { message: 'Only host can start' });
            return;
        }

        // Check minimum players
        if (room.players.size < 2) {
            this.server.send(client.ws, 'ERROR', { message: 'Need at least 2 players' });
            return;
        }

        room.startMatch();
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    shutdown() {
        this.rooms.forEach(room => room.destroy());
        this.rooms.clear();
    }
}

module.exports = { RoomManager };
