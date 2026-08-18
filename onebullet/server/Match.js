// Match - Server-authoritative match logic
const { v4: uuidv4 } = require('uuid');
const { WEAPONS } = require('../shared/weaponData.js');
const { CONSTANTS } = require('../shared/constants.js');

class Match {
    constructor(room) {
        this.room = room;
        this.server = room.server;
        this.players = new Map();
        this.state = 'waiting'; // waiting, playing, ending
        this.startTime = 0;
        this.endTime = 0;
        this.timer = room.timeLimit;
        this.scores = {};
        this.eliminations = [];
        this.pendingShots = new Map();
        
        // Rate limiting per player
        this.playerLastAction = new Map();
    }

    start() {
        this.state = 'playing';
        this.startTime = Date.now();
        
        // Initialize player states
        this.room.players.forEach((playerData, playerId) => {
            this.players.set(playerId, {
                id: playerId,
                displayName: playerData.displayName,
                health: 100,
                alive: true,
                score: 0,
                kills: 0,
                deaths: 0,
                position: { x: 0, y: 0, z: 0 },
                rotation: { y: 0 },
                weapon: {
                    ammo: WEAPONS.sniper.ammo,
                    reserveAmmo: WEAPONS.sniper.reserveAmmo,
                    state: 'idle',
                },
                lastShot: 0,
            });
            
            this.scores[playerId] = 0;
        });
        
        // Start game loop
        this.gameLoopInterval = setInterval(() => this.gameLoop(), 1000);
        
        // Broadcast match start
        this.room.broadcast('MATCH_STARTED', {
            map: this.room.map,
            mode: this.room.mode,
            players: Array.from(this.players.values()),
            timeLimit: this.room.timeLimit,
            scoreLimit: this.room.scoreLimit,
        });
    }

    gameLoop() {
        if (this.state !== 'playing') return;
        
        // Update timer
        this.timer--;
        if (this.timer <= 0) {
            this.endMatch('time');
            return;
        }
        
        // Broadcast periodic state updates (every 5 seconds or so)
        if (this.timer % 5 === 0) {
            this.broadcastState();
        }
        
        // Check win condition
        this.checkWinCondition();
    }

    processInput(playerId, input) {
        const player = this.players.get(playerId);
        if (!player || !player.alive) return;
        
        // Validate input rate
        const now = Date.now();
        const lastAction = this.playerLastAction.get(playerId) || 0;
        if (now - lastAction < 16) { // ~60 FPS max
            return;
        }
        this.playerLastAction.set(playerId, now);
        
        // Update player position/rotation from input
        if (input.position) {
            // Basic validation - don't allow teleporting
            const dx = input.position.x - player.position.x;
            const dz = input.position.z - player.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Max speed check (prevent flying/teleporting)
            const maxDistance = CONSTANTS.MOVE_SPEED * (CONSTANTS.SPRINT_MULTIPLIER || 1.5) * 0.1; // 100ms window
            
            if (distance <= maxDistance * 2) { // Some leniency
                player.position = input.position;
            }
        }
        
        if (input.rotation) {
            player.rotation = input.rotation;
        }
        
        // Broadcast snapshot to other players
        this.room.broadcast('PLAYER_SNAPSHOT', {
            playerId,
            position: player.position,
            rotation: player.rotation,
        }, playerId);
    }

    processShot(playerId, shotData) {
        const player = this.players.get(playerId);
        if (!player || !player.alive) {
            this.sendError(playerId, 'Cannot shoot - invalid state');
            return;
        }
        
        // Rate limit check
        const now = Date.now();
        const fireCooldown = WEAPONS.sniper.fireCooldown * 1000;
        if (now - player.lastShot < fireCooldown * 0.8) { // Some leniency for latency
            this.sendError(playerId, 'Fire rate exceeded');
            return;
        }
        
        // Ammo check
        if (player.weapon.ammo <= 0) {
            this.sendError(playerId, 'No ammo');
            return;
        }
        
        // Consume ammo
        player.weapon.ammo--;
        player.lastShot = now;
        
        // Process hit detection server-side
        const result = this.resolveShot(playerId, shotData);
        
        // Send result to shooter
        this.server.send(
            Array.from(this.server.clients.values()).find(c => c.id === playerId)?.ws,
            'SHOT_RESULT',
            {
                shotId: shotData.shotId,
                ...result,
            }
        );
        
        // If hit, apply damage
        if (result.hit && result.targetId) {
            const target = this.players.get(result.targetId);
            if (target && target.alive) {
                const damage = result.isHeadshot ? 
                    WEAPONS.sniper.damage.head : 
                    WEAPONS.sniper.damage.body;
                
                const killed = this.applyDamage(target, damage, playerId, result.hitbox);
                
                // Broadcast elimination if killed
                if (killed) {
                    this.broadcastElimination(player, target, result.isHeadshot);
                } else {
                    // Send damage notification
                    const targetClient = Array.from(this.server.clients.values())
                        .find(c => c.id === result.targetId);
                    if (targetClient) {
                        this.server.send(targetClient.ws, 'DAMAGE', {
                            attackerId: playerId,
                            damage,
                            hitbox: result.hitbox,
                            health: target.health,
                        });
                    }
                }
            }
        }
        
        // Update score for hit
        if (result.hit) {
            player.score += 100;
            this.updateScore(playerId);
        }
    }

    resolveShot(shooterId, shotData) {
        const shooter = this.players.get(shooterId);
        if (!shooter) return { hit: false };
        
        const origin = shotData.origin;
        const direction = shotData.direction;
        
        // Normalize direction
        const len = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
        const dir = {
            x: direction.x / len,
            y: direction.y / len,
            z: direction.z / len,
        };
        
        // Check each player for hits
        let bestHit = null;
        let bestDist = Infinity;
        
        this.players.forEach((target, targetId) => {
            if (targetId === shooterId || !target.alive) return;
            
            // Simple hitbox check - cylinder approximation
            const dx = target.position.x - origin.x;
            const dy = target.position.y - origin.y;
            const dz = target.position.z - origin.z;
            
            // Project target position onto shot direction
            const t = dx * dir.x + dy * dir.y + dz * dir.z;
            
            if (t < 0) return; // Behind shooter
            
            // Closest point on ray to target
            const closestX = origin.x + dir.x * t;
            const closestY = origin.y + dir.y * t;
            const closestZ = origin.z + dir.z * t;
            
            // Distance from ray to target center
            const distX = target.position.x - closestX;
            const distY = target.position.y - closestY;
            const distZ = target.position.z - closestZ;
            const dist = Math.sqrt(distX * distX + distY * distY + distZ * distZ);
            
            // Hitbox radii (simplified)
            const headRadius = 0.3;
            const bodyRadius = 0.4;
            
            // Check headshot (higher priority)
            if (dist < headRadius && Math.abs(dy) < 1.5) {
                if (t < bestDist) {
                    bestDist = t;
                    bestHit = {
                        hit: true,
                        targetId,
                        isHeadshot: true,
                        hitbox: 'head',
                        distance: t,
                    };
                }
            }
            // Check body hit
            else if (dist < bodyRadius && t < bestDist) {
                bestDist = t;
                bestHit = {
                    hit: true,
                    targetId,
                    isHeadshot: false,
                    hitbox: 'body',
                    distance: t,
                };
            }
        });
        
        return bestHit || { hit: false };
    }

    applyDamage(target, amount, attackerId, hitbox) {
        target.health -= amount;
        
        if (target.health <= 0) {
            target.health = 0;
            target.alive = false;
            target.deaths++;
            
            // Award kill to attacker
            const attacker = this.players.get(attackerId);
            if (attacker) {
                attacker.kills++;
                attacker.score += 500; // Kill bonus
                
                // Headshot bonus
                if (hitbox === 'head') {
                    attacker.score += 100;
                }
                
                this.updateScore(attackerId);
            }
            
            // Schedule respawn
            setTimeout(() => this.respawnPlayer(target.id), 3000);
            
            return true; // Killed
        }
        
        return false; // Just damaged
    }

    respawnPlayer(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;
        
        player.health = 100;
        player.alive = true;
        player.weapon.ammo = WEAPONS.sniper.ammo;
        
        // Get random spawn point (would come from map data)
        player.position = this.getRandomSpawnPosition();
        
        // Notify player
        const client = Array.from(this.server.clients.values()).find(c => c.id === playerId);
        if (client) {
            this.server.send(client.ws, 'RESPAWN', {
                position: player.position,
                health: player.health,
            });
        }
        
        // Broadcast respawn
        this.room.broadcast('PLAYER_RESPAWN', {
            playerId,
            position: player.position,
        });
    }

    getRandomSpawnPosition() {
        // Default spawn positions - maps should override
        const spawns = [
            { x: -10, y: 0, z: -10 },
            { x: 10, y: 0, z: -10 },
            { x: -10, y: 0, z: 10 },
            { x: 10, y: 0, z: 10 },
            { x: 0, y: 0, z: 0 },
        ];
        return spawns[Math.floor(Math.random() * spawns.length)];
    }

    broadcastElimination(killer, victim, isHeadshot) {
        this.room.broadcast('ELIMINATION', {
            killerId: killer.id,
            killerName: killer.displayName,
            victimId: victim.id,
            victimName: victim.displayName,
            isHeadshot,
            killerScore: killer.score,
        });
        
        this.eliminations.push({
            killerId: killer.id,
            victimId: victim.id,
            isHeadshot,
            timestamp: Date.now(),
        });
    }

    updateScore(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;
        
        this.scores[playerId] = player.score;
        
        this.room.broadcast('SCORE_UPDATE', {
            playerId,
            score: player.score,
            kills: player.kills,
            deaths: player.deaths,
        });
    }

    broadcastState() {
        this.room.broadcast('MATCH_STATE', {
            timer: this.timer,
            scores: this.scores,
            players: Array.from(this.players.values()).map(p => ({
                id: p.id,
                displayName: p.displayName,
                health: p.health,
                alive: p.alive,
                score: p.score,
                kills: p.kills,
                deaths: p.deaths,
            })),
        });
    }

    checkWinCondition() {
        // Check score limit
        if (this.room.scoreLimit > 0) {
            this.players.forEach((player) => {
                if (player.score >= this.room.scoreLimit) {
                    this.endMatch('score', player.id);
                }
            });
        }
        
        // Check last player standing (for elimination mode)
        if (this.room.mode === 'elimination') {
            const alivePlayers = Array.from(this.players.values()).filter(p => p.alive);
            if (alivePlayers.length <= 1) {
                const winner = alivePlayers[0];
                this.endMatch('elimination', winner?.id);
            }
        }
    }

    endMatch(reason, winnerId = null) {
        if (this.state === 'ending') return;
        
        this.state = 'ending';
        this.endTime = Date.now();
        
        clearInterval(this.gameLoopInterval);
        
        // Determine winner
        let winner = null;
        if (winnerId) {
            winner = this.players.get(winnerId);
        } else if (reason === 'time' || reason === 'score') {
            // Find player with highest score
            let maxScore = -1;
            this.players.forEach((player) => {
                if (player.score > maxScore) {
                    maxScore = player.score;
                    winner = player;
                }
            });
        }
        
        // Compile results
        const results = {
            reason,
            winnerId: winner?.id,
            winnerName: winner?.displayName,
            scores: Array.from(this.players.values()).map(p => ({
                playerId: p.id,
                displayName: p.displayName,
                score: p.score,
                kills: p.kills,
                deaths: p.deaths,
            })).sort((a, b) => b.score - a.score),
            eliminations: this.eliminations,
        };
        
        // Send to room
        this.room.endMatch(results);
    }

    sendError(playerId, message) {
        const client = Array.from(this.server.clients.values()).find(c => c.id === playerId);
        if (client) {
            this.server.send(client.ws, 'ERROR', { message });
        }
    }

    destroy() {
        this.state = 'ended';
        
        if (this.gameLoopInterval) {
            clearInterval(this.gameLoopInterval);
        }
        
        this.players.clear();
        this.pendingShots.clear();
    }
}

module.exports = { Match };
