// Online Game Session - Handles online multiplayer matches
import { NetworkClient } from '../networking/NetworkClient.js';
import { PROTOCOL } from '../../shared/protocol.js';
import { CONSTANTS } from '../../shared/constants.js';

export class OnlineGameSession {
    constructor(app, config) {
        this.app = app;
        this.config = config;
        this.network = new NetworkClient(app);
        
        // Game state
        this.matchState = 'waiting'; // waiting, starting, playing, ending
        this.players = new Map();
        this.localPlayerId = null;
        this.scores = {};
        this.matchTime = 0;
        this.timerInterval = null;
        
        // Three.js references (set by Game)
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Remote player meshes
        this.remotePlayers = new Map();
        
        // Bind network events
        this.setupNetworkHandlers();
    }

    async connect() {
        try {
            await this.network.connect();
            console.log('[OnlineGameSession] Connected to server');
            return true;
        } catch (error) {
            console.error('[OnlineGameSession] Connection failed:', error);
            return false;
        }
    }

    setupNetworkHandlers() {
        this.network.on('connected', (data) => {
            this.localPlayerId = data.playerId;
            console.log('[OnlineGameSession] Authenticated as:', data.displayName);
        });

        this.network.on('lobbyState', (data) => {
            console.log('[OnlineGameSession] Lobby state:', data);
            this.updateLobbyDisplay(data);
        });

        this.network.on('matchStarting', (data) => {
            console.log('[OnlineGameSession] Match starting in', data.countdown, 'seconds');
            this.matchState = 'starting';
            this.app.getUIManager().showMatchCountdown(data.countdown);
        });

        this.network.on('matchStarted', (data) => {
            console.log('[OnlineGameSession] Match started!', data);
            this.matchState = 'playing';
            this.initializeMatch(data);
        });

        this.network.on('matchEnded', (data) => {
            console.log('[OnlineGameSession] Match ended:', data);
            this.matchState = 'ending';
            this.endMatch(data);
        });

        this.network.on('playerSnapshot', (snapshot) => {
            this.updateRemotePlayer(snapshot);
        });

        this.network.on('shotResult', (result) => {
            this.handleShotResult(result);
        });

        this.network.on('elimination', (data) => {
            this.handleElimination(data);
        });

        this.network.on('scoreUpdate', (data) => {
            this.updateScore(data);
        });

        this.network.on('chatMessage', (data) => {
            this.displayChatMessage(data);
        });

        this.network.on('playerJoin', (player) => {
            console.log('[OnlineGameSession] Player joined:', player.displayName);
            this.addPlayer(player);
        });

        this.network.on('playerLeave', (data) => {
            console.log('[OnlineGameSession] Player left:', data.playerId);
            this.removePlayer(data.playerId);
        });
    }

    initializeMatch(data) {
        // Set up match parameters
        this.config.map = data.map;
        this.config.mode = data.mode;
        
        // Initialize players
        data.players.forEach(player => {
            this.addPlayer(player);
        });
        
        // Start timer
        this.matchTime = this.config.timeLimit || 600;
        this.startTimer();
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            if (this.matchState === 'playing') {
                this.matchTime--;
                if (this.matchTime <= 0) {
                    this.endMatch({ reason: 'time' });
                }
            }
        }, 1000);
    }

    addPlayer(playerData) {
        const player = {
            id: playerData.id || playerData.playerId,
            displayName: playerData.displayName || playerData.name,
            level: playerData.level || 1,
            score: 0,
            kills: 0,
            deaths: 0,
            alive: true,
            position: { x: 0, y: 0, z: 0 },
            rotation: { y: 0 },
        };
        
        this.players.set(player.id, player);
        
        if (player.id !== this.localPlayerId) {
            this.createRemotePlayerMesh(player);
        }
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        this.removeRemotePlayerMesh(playerId);
    }

    createRemotePlayerMesh(playerData) {
        // Create a simple capsule mesh for remote players
        const geometry = new THREE.CapsuleGeometry(0.3, 1, 4, 8);
        const material = new THREE.MeshStandardMaterial({ 
            color: this.getPlayerColor(playerData.id),
            roughness: 0.5,
            metalness: 0.3,
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
            playerData.position.x || 0,
            (playerData.position.y || 0) + 0.9,
            playerData.position.z || 0
        );
        mesh.castShadow = true;
        
        // Add name tag
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, 256, 64);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(playerData.displayName, 128, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.y = 2.2;
        sprite.scale.set(3, 0.75, 1);
        mesh.add(sprite);
        
        if (this.scene) {
            this.scene.add(mesh);
        }
        
        this.remotePlayers.set(playerData.id, {
            mesh,
            targetPosition: new THREE.Vector3(
                playerData.position.x || 0,
                (playerData.position.y || 0) + 0.9,
                playerData.position.z || 0
            ),
            targetRotation: playerData.rotation?.y || 0,
        });
    }

    getPlayerColor(playerId) {
        // Generate consistent color from player ID
        const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colors = [0x4a90d9, 0xd94a4a, 0x4ad94a, 0xd9d94a, 0xd94ad9, 0x4ad9d9];
        return colors[hash % colors.length];
    }

    updateRemotePlayer(snapshot) {
        const remote = this.remotePlayers.get(snapshot.playerId);
        if (remote) {
            remote.targetPosition.set(
                snapshot.position.x,
                snapshot.position.y + 0.9,
                snapshot.position.z
            );
            remote.targetRotation = snapshot.rotation?.y || 0;
        }
    }

    removeRemotePlayerMesh(playerId) {
        const remote = this.remotePlayers.get(playerId);
        if (remote && this.scene) {
            this.scene.remove(remote.mesh);
            remote.mesh.geometry.dispose();
            remote.mesh.material.dispose();
        }
        this.remotePlayers.delete(playerId);
    }

    updateRemotePlayerMeshes(delta) {
        const lerpFactor = 10 * delta;
        
        this.remotePlayers.forEach((remote) => {
            if (remote.mesh) {
                // Smooth interpolation
                remote.mesh.position.lerp(remote.targetPosition, lerpFactor);
                
                // Smooth rotation
                const currentRot = remote.mesh.rotation.y;
                let diff = remote.targetRotation - currentRot;
                
                // Normalize angle difference
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                
                remote.mesh.rotation.y = currentRot + diff * lerpFactor;
            }
        });
    }

    handleShotResult(result) {
        console.log('[OnlineGameSession] Shot result:', result);
        
        if (result.shooterId === this.localPlayerId) {
            // Local player shot
            if (result.hit) {
                this.app.getAudioManager().play(result.isHeadshot ? 'headshot' : 'hit');
                this.app.getUIManager().showHitMarker(result.isHeadshot);
            }
        } else {
            // Another player shot
            if (result.targetId === this.localPlayerId) {
                // We got hit
                this.app.getAudioManager().play('hit');
                this.app.getUIManager().showDamageIndicator(result.hitbox);
            }
        }
    }

    handleElimination(data) {
        console.log('[OnlineGameSession] Elimination:', data);
        
        if (data.victimId === this.localPlayerId) {
            // We died
            this.app.getAudioManager().play('elimination');
        }
        
        if (data.killerId === this.localPlayerId) {
            // We killed someone
            this.app.getAudioManager().play('elimination');
        }
        
        // Update kill feed
        this.app.getUIManager().addKillFeedEntry({
            killer: data.killerName,
            victim: data.victimName,
            isHeadshot: data.isHeadshot,
        });
    }

    updateScore(data) {
        if (data.playerId) {
            const player = this.players.get(data.playerId);
            if (player) {
                player.score = data.score;
                player.kills = data.kills;
                player.deaths = data.deaths;
            }
        }
        
        // Update HUD
        if (data.playerId === this.localPlayerId) {
            this.app.getUIManager().updateScoreDisplay(data);
        }
    }

    displayChatMessage(data) {
        const messagesDiv = document.getElementById('lobbyChatMessages');
        if (!messagesDiv) return;
        
        const msgEl = document.createElement('div');
        msgEl.className = 'chat-message';
        const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        msgEl.innerHTML = `<span class="timestamp">[${time}]</span><span class="player-name">${data.playerName}:</span> ${data.message}`;
        messagesDiv.appendChild(msgEl);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    updateLobbyDisplay(data) {
        // Update lobby UI with current room state
        const playerList = document.getElementById('lobbyPlayerList');
        if (playerList) {
            playerList.innerHTML = '';
            data.players.forEach(player => {
                const el = document.createElement('div');
                el.className = 'lobby-player';
                el.innerHTML = `
                    <span class="player-name">${player.displayName}</span>
                    <span class="player-level">Lv.${player.level}</span>
                    <span class="player-ready ${player.ready ? 'ready' : ''}">${player.ready ? '✓' : ''}</span>
                `;
                playerList.appendChild(el);
            });
        }
    }

    sendInput(input) {
        if (this.matchState === 'playing') {
            this.network.sendInput(input);
        }
    }

    shoot(shotData) {
        if (this.matchState === 'playing') {
            return this.network.shoot(shotData);
        }
        return null;
    }

    sendChat(message) {
        this.network.sendChat(message);
    }

    setReady(ready) {
        this.network.setReady(ready);
    }

    startMatch() {
        this.network.startMatch();
    }

    leaveMatch() {
        this.network.leaveRoom();
        this.cleanup();
    }

    endMatch(results) {
        this.matchState = 'ending';
        this.stopTimer();
        
        // Calculate XP and rewards
        const localPlayer = this.players.get(this.localPlayerId);
        const won = results.reason === 'score' || 
                    (results.reason === 'time' && localPlayer && 
                     localPlayer.score >= this.getMaxScore());
        
        const xp = this.calculateXP(won, localPlayer);
        
        // Record stats locally
        if (localPlayer) {
            this.app.getStorageManager().recordMatch(
                localPlayer.kills || 0,
                localPlayer.deaths || 0,
                0, // headshots tracked separately
                0, // shots fired
                0, // shots hit
                won
            );
            
            const result = this.app.getStorageManager().addXP(xp);
            
            if (result.leveledUp) {
                const reward = this.app.getStorageManager().unlockLevelRewards(result.newLevel);
                this.app.getUIManager().showLevelUp(result.newLevel - 1, result.newLevel, reward?.id);
            }
        }
        
        // Show match end screen
        this.app.getUIManager().showMatchEnd({
            won,
            kills: localPlayer?.kills || 0,
            deaths: localPlayer?.deaths || 0,
            headshots: 0,
            accuracy: 0,
            xp,
        });
        
        // Return to menu after delay
        setTimeout(() => {
            this.cleanup();
            document.getElementById('gameHUD').classList.add('hidden');
        }, 3000);
    }

    getMaxScore() {
        return this.config.scoreLimit || 20;
    }

    calculateXP(won, player) {
        let xp = 50; // Base participation
        xp += (player?.kills || 0) * 100;
        if (won) xp += 500;
        return xp;
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    cleanup() {
        this.stopTimer();
        
        // Remove all remote player meshes
        this.remotePlayers.forEach((remote) => {
            if (this.scene && remote.mesh) {
                this.scene.remove(remote.mesh);
                remote.mesh.geometry.dispose();
                remote.mesh.material.dispose();
            }
        });
        this.remotePlayers.clear();
        this.players.clear();
        
        this.network.disconnect();
    }

    getPlayers() {
        return Array.from(this.players.values());
    }

    getPlayer(playerId) {
        return this.players.get(playerId);
    }

    getLocalPlayerId() {
        return this.localPlayerId;
    }

    getMatchState() {
        return this.matchState;
    }

    update(delta) {
        // Update remote player interpolation
        this.updateRemotePlayerMeshes(delta);
    }
}

// Import THREE at the top level
import * as THREE from 'three';
