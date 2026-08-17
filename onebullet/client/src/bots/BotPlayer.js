// Bot Player - AI-controlled player
import { Player } from '../player/Player.js';
import * as THREE from 'three';

export class BotPlayer extends Player {
    constructor(game, settings) {
        super(game, false);
        this.settings = settings;
        this.isBot = true;
        
        // AI state
        this.state = 'patrol';
        this.target = null;
        this.patrolPoint = null;
        this.reactionTimer = 0;
        this.shootTimer = 0;
        this.moveTimer = 0;
        this.kills = 0;
        
        // Generate bot name
        this.displayName = this.generateName();
        
        // Show bot mesh (third person)
        this.mesh.visible = true;
    }

    generateName() {
        const prefixes = ['Shadow', 'Ghost', 'Viper', 'Phantom', 'Specter', 'Raven', 'Falcon', 'Wolf'];
        const suffixes = ['Strike', 'Hunter', 'Sniper', 'Ops', 'One', 'X', 'Prime', 'Alpha'];
        return prefixes[Math.floor(Math.random() * prefixes.length)] + 
               suffixes[Math.floor(Math.random() * suffixes.length)];
    }

    update(delta) {
        if (!this.alive) return;
        
        super.update(delta);
        
        // Update AI
        this.updateAI(delta);
        
        // Update hitboxes for raycasting
        this.updateHitboxes();
        
        // Create hitbox meshes for rendering/debugging
        this.createHitboxMeshes();
    }

    updateAI(delta) {
        // Find target (player or other bots)
        if (!this.target || !this.target.alive) {
            this.findTarget();
        }
        
        // State machine
        switch (this.state) {
            case 'patrol':
                this.updatePatrol(delta);
                break;
            case 'search':
                this.updateSearch(delta);
                break;
            case 'combat':
                this.updateCombat(delta);
                break;
        }
        
        // Random chance to detect player
        if (!this.target && this.game.player && this.game.player.alive) {
            const dist = this.mesh.position.distanceTo(this.game.player.mesh.position);
            const canSee = this.canSeeTarget(this.game.player);
            
            if (canSee && dist < 50) {
                const detectionChance = delta / this.settings.reactionTime;
                if (Math.random() < detectionChance) {
                    this.target = this.game.player;
                    this.state = 'combat';
                }
            }
        }
        
        // React to shots heard
        // (simplified - would need sound propagation system)
    }

    findTarget() {
        // Prioritize player
        if (this.game.player && this.game.player.alive) {
            const dist = this.mesh.position.distanceTo(this.game.player.mesh.position);
            if (dist < 60 && this.canSeeTarget(this.game.player)) {
                this.target = this.game.player;
                this.state = 'combat';
                return;
            }
        }
        
        // Look for other bots
        this.target = null;
        let closestDist = 40;
        
        this.game.botManager.bots.forEach(bot => {
            if (bot === this || !bot.alive) return;
            
            const dist = this.mesh.position.distanceTo(bot.mesh.position);
            if (dist < closestDist && this.canSeeTarget(bot)) {
                closestDist = dist;
                this.target = bot;
                this.state = 'combat';
            }
        });
        
        if (!this.target) {
            this.state = 'patrol';
        }
    }

    canSeeTarget(target) {
        const direction = new THREE.Vector3();
        direction.subVectors(target.mesh.position, this.mesh.position);
        direction.normalize();
        
        // Check if target is in front of bot
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.mesh.quaternion);
        
        const angle = forward.angleTo(direction);
        return angle < Math.PI / 3; // 60 degree FOV
    }

    updatePatrol(delta) {
        // Pick a patrol point if we don't have one
        if (!this.patrolPoint || this.moveTimer <= 0) {
            this.pickNewPatrolPoint();
        }
        
        // Move towards patrol point
        if (this.patrolPoint) {
            const direction = new THREE.Vector3();
            direction.subVectors(this.patrolPoint, this.mesh.position);
            direction.y = 0;
            
            if (direction.length() > 2) {
                direction.normalize();
                this.move(direction, this.settings.moveSpeed * 3, delta);
                
                // Rotate towards movement direction
                this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
            } else {
                this.moveTimer -= delta;
                if (this.moveTimer <= 0) {
                    this.patrolPoint = null;
                }
            }
        }
    }

    pickNewPatrolPoint() {
        const spawnPoints = this.game.currentMap.spawnPoints;
        const point = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
        this.patrolPoint = new THREE.Vector3(point.x, 0, point.z);
        this.moveTimer = 2 + Math.random() * 3;
    }

    updateSearch(delta) {
        // Look around last known position
        this.mesh.rotation.y += delta * 0.5;
        this.moveTimer -= delta;
        
        if (this.moveTimer <= 0) {
            this.state = 'patrol';
        }
    }

    updateCombat(delta) {
        if (!this.target || !this.target.alive) {
            this.state = 'patrol';
            return;
        }
        
        const dist = this.mesh.position.distanceTo(this.target.mesh.position);
        const canSee = this.canSeeTarget(this.target);
        
        if (!canSee) {
            this.state = 'search';
            this.moveTimer = 2;
            return;
        }
        
        // Face target
        const direction = new THREE.Vector3();
        direction.subVectors(this.target.mesh.position, this.mesh.position);
        this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
        
        // Strafe occasionally
        if (Math.random() < 0.02) {
            const strafeDir = new THREE.Vector3(1, 0, 0);
            strafeDir.applyQuaternion(this.mesh.quaternion);
            this.move(strafeDir, 2, delta);
        }
        
        // Shoot with accuracy delay
        this.shootTimer -= delta;
        if (this.shootTimer <= 0 && canSee) {
            this.attemptShot();
            this.shootTimer = 1.5 + Math.random(); // Bolt action delay
        }
    }

    attemptShot() {
        if (!this.target) return;
        
        // Calculate aim error based on difficulty
        const maxError = (1 - this.settings.accuracy) * 0.1;
        const aimError = new THREE.Vector3(
            (Math.random() - 0.5) * maxError,
            (Math.random() - 0.5) * maxError,
            (Math.random() - 0.5) * maxError
        );
        
        // Raycast from bot to target
        const origin = this.mesh.position.clone().add(new THREE.Vector3(0, 1.7, 0));
        const direction = new THREE.Vector3();
        direction.subVectors(this.target.mesh.position, origin);
        direction.add(aimError);
        direction.normalize();
        
        // Simple hit check
        const hitRoll = Math.random();
        if (hitRoll < this.settings.accuracy) {
            // Hit!
            const headshotRoll = Math.random();
            const isHeadshot = headshotRoll < 0.3; // 30% headshot rate
            
            const damage = isHeadshot ? 100 : 100; // One-shot anyway
            const killed = this.target.takeDamage(damage, isHeadshot ? 'head' : 'body', this);
            
            if (killed) {
                this.kills++;
                this.game.app.getAudioManager().play('elimination');
            } else {
                this.game.app.getAudioManager().play('hit');
            }
        }
        
        // Play shoot sound
        this.game.app.getAudioManager().play('shoot');
    }

    createHitboxMeshes() {
        // Optional: Create visible hitboxes for debugging
        // For now, keep it simple
    }

    takeDamage(amount, hitboxName, attacker) {
        const result = super.takeDamage(amount, hitboxName, attacker);
        
        if (result && attacker === this.game.player) {
            // Bot knows who shot them
            this.target = attacker;
            this.state = 'combat';
        }
        
        return result;
    }

    die(killer, hitboxName) {
        super.die(killer, hitboxName);
        
        if (killer === this.game.player) {
            this.game.player.score += 100;
        }
    }
}
