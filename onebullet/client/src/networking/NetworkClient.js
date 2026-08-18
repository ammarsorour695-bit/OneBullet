// Network Client - Handles all WebSocket communication
import { PROTOCOL } from '../../shared/protocol.js';
import { CONSTANTS } from '../../shared/constants.js';

export class NetworkClient {
    constructor(app) {
        this.app = app;
        this.ws = null;
        this.connected = false;
        this.clientId = null;
        this.playerId = null;
        this.roomId = null;
        this.latency = 0;
        
        // Message handlers
        this.handlers = new Map();
        
        // Snapshot buffering for interpolation
        this.playerSnapshots = [];
        this.snapshotBufferTime = 100; // ms
        
        // Pending actions for reconciliation
        this.pendingShots = [];
        
        // Reconnect handling
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect() {
        return new Promise((resolve, reject) => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            console.log('[NetworkClient] Connecting to:', wsUrl);
            
            this.ws = new WebSocket(wsUrl);
            
            this.ws.onopen = () => {
                console.log('[NetworkClient] Connected');
                this.connected = true;
                this.reconnectAttempts = 0;
                
                // Send connect message
                this.send(PROTOCOL.CONNECT, {
                    displayName: this.app.getStorageManager().getProfile().displayName,
                });
                
                resolve();
            };
            
            this.ws.onclose = (event) => {
                console.log('[NetworkClient] Disconnected', event.code, event.reason);
                this.connected = false;
                
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
                } else {
                    this.app.getUIManager().showError('Lost connection to server');
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('[NetworkClient] Error:', error);
                reject(error);
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const msg = JSON.parse(event.data);
                    this.handleMessage(msg);
                } catch (err) {
                    console.error('[NetworkClient] Parse error:', err);
                }
            };
        });
    }

    handleMessage(msg) {
        const { type, data, timestamp } = msg;
        
        // Calculate latency from server timestamp
        if (timestamp) {
            this.latency = Date.now() - timestamp;
        }
        
        switch (type) {
            case PROTOCOL.WELCOME:
                this.clientId = data.clientId;
                console.log('[NetworkClient] Received welcome, ID:', this.clientId);
                break;
                
            case PROTOCOL.CONNECTED:
                this.playerId = data.playerId;
                console.log('[NetworkClient] Connected as:', data.displayName);
                this.emit('connected', data);
                break;
                
            case PROTOCOL.ROOM_CREATED:
                this.roomId = data.roomId;
                this.emit('roomCreated', data);
                break;
                
            case PROTOCOL.LOBBY_STATE:
                this.emit('lobbyState', data);
                break;
                
            case PROTOCOL.PLAYER_JOIN:
                this.emit('playerJoin', data.player);
                break;
                
            case PROTOCOL.PLAYER_LEAVE:
                this.emit('playerLeave', data);
                break;
                
            case PROTOCOL.MATCH_STARTING:
                this.emit('matchStarting', data);
                break;
                
            case PROTOCOL.MATCH_STARTED:
                this.emit('matchStarted', data);
                break;
                
            case PROTOCOL.MATCH_ENDED:
                this.emit('matchEnded', data);
                break;
                
            case PROTOCOL.PLAYER_SNAPSHOT:
                this.handlePlayerSnapshot(data);
                break;
                
            case PROTOCOL.SHOT_RESULT:
                this.handleShotResult(data);
                break;
                
            case PROTOCOL.DAMAGE:
                this.emit('damage', data);
                break;
                
            case PROTOCOL.ELIMINATION:
                this.emit('elimination', data);
                break;
                
            case PROTOCOL.SCORE_UPDATE:
                this.emit('scoreUpdate', data);
                break;
                
            case PROTOCOL.CHAT_MESSAGE:
                this.emit('chatMessage', data);
                break;
                
            case PROTOCOL.PONG:
                this.latency = data.latency;
                this.emit('ping', data);
                break;
                
            case PROTOCOL.ERROR:
                console.error('[NetworkClient] Server error:', data.message);
                this.emit('error', data);
                break;
                
            default:
                console.warn('[NetworkClient] Unknown message type:', type);
        }
    }

    handlePlayerSnapshot(snapshot) {
        // Store snapshot for interpolation
        this.playerSnapshots.push({
            time: Date.now(),
            ...snapshot
        });
        
        // Keep buffer manageable
        if (this.playerSnapshots.length > 20) {
            this.playerSnapshots.shift();
        }
        
        this.emit('playerSnapshot', snapshot);
    }

    handleShotResult(result) {
        // Find matching pending shot
        const index = this.pendingShots.findIndex(s => s.id === result.shotId);
        if (index >= 0) {
            this.pendingShots.splice(index, 1);
        }
        
        this.emit('shotResult', result);
    }

    send(type, data = {}) {
        if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('[NetworkClient] Cannot send, not connected');
            return false;
        }
        
        const msg = {
            type,
            data,
            timestamp: Date.now()
        };
        
        this.ws.send(JSON.stringify(msg));
        return true;
    }

    // Game actions
    joinRoom(roomId) {
        this.send(PROTOCOL.ROOM_JOIN, { roomId });
    }

    leaveRoom() {
        this.send(PROTOCOL.ROOM_LEAVE, {});
        this.roomId = null;
    }

    setReady(ready) {
        this.send(PROTOCOL.ROOM_READY, { ready });
    }

    startMatch() {
        this.send(PROTOCOL.ROOM_START, {});
    }

    sendInput(input) {
        this.send(PROTOCOL.INPUT, input);
    }

    shoot(shotData) {
        const shotId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Store pending shot for reconciliation
        this.pendingShots.push({
            id: shotId,
            ...shotData,
            time: Date.now()
        });
        
        this.send(PROTOCOL.SHOOT, {
            shotId,
            ...shotData
        });
        
        return shotId;
    }

    sendChat(message) {
        this.send(PROTOCOL.CHAT_MESSAGE, { message });
    }

    ping() {
        this.send(PROTOCOL.PING, {});
    }

    // Event system
    on(event, callback) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
        }
        this.handlers.get(event).push(callback);
    }

    off(event, callback) {
        if (this.handlers.has(event)) {
            const handlers = this.handlers.get(event);
            const index = handlers.indexOf(callback);
            if (index >= 0) {
                handlers.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.handlers.has(event)) {
            this.handlers.get(event).forEach(cb => cb(data));
        }
    }

    // Get interpolated player state
    getInterpolatedState(playerId, time) {
        const targetTime = time - this.snapshotBufferTime;
        const snapshots = this.playerSnapshots.filter(s => s.playerId === playerId);
        
        if (snapshots.length < 2) return null;
        
        // Find surrounding snapshots
        let before = null;
        let after = null;
        
        for (let i = 0; i < snapshots.length - 1; i++) {
            if (snapshots[i].time <= targetTime && snapshots[i + 1].time >= targetTime) {
                before = snapshots[i];
                after = snapshots[i + 1];
                break;
            }
        }
        
        if (!before || !after) return after || before;
        
        // Interpolate
        const t = (targetTime - before.time) / (after.time - before.time);
        
        return {
            position: {
                x: before.position.x + (after.position.x - before.position.x) * t,
                y: before.position.y + (after.position.y - before.position.y) * t,
                z: before.position.z + (after.position.z - before.position.z) * t,
            },
            rotation: {
                y: before.rotation.y + (after.rotation.y - before.rotation.y) * t,
            }
        };
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
    }
}
