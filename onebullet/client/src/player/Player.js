// Player Class - Base player entity
import * as THREE from 'three';
import { CONSTANTS } from '../../shared/constants.js';

export class Player {
    constructor(game, isLocal = false) {
        this.game = game;
        this.isLocal = isLocal;
        
        // State
        this.health = 100;
        this.alive = true;
        this.score = 0;
        this.kills = 0;
        this.deaths = 0;
        this.headshots = 0;
        this.shotsFired = 0;
        this.shotsHit = 0;
        
        // Movement
        this.velocity = new THREE.Vector3();
        this.onGround = false;
        this.isSprinting = false;
        this.isCrouching = false;
        
        // Camera
        this.cameraOffset = new THREE.Vector3(0, CONSTANTS.PLAYER_HEIGHT - 0.2, 0);
        this.pitch = 0;
        this.yaw = 0;
        
        // Mesh
        this.mesh = this.createMesh();
        this.mesh.visible = false; // Hide own body for first-person
        
        // Hitboxes
        this.hitboxes = this.createHitboxes();
    }

    createMesh() {
        const group = new THREE.Group();
        
        // Simple body representation (for third-person/bots)
        const bodyGeo = new THREE.CapsuleGeometry(0.3, 1, 4, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a5a4a });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.9;
        body.castShadow = true;
        group.add(body);
        
        // Head
        const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xd4a574 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.7;
        head.castShadow = true;
        group.add(head);
        
        return group;
    }

    createHitboxes() {
        return {
            head: { name: 'head', size: new THREE.Vector3(0.25, 0.25, 0.25), offset: new THREE.Vector3(0, 1.7, 0), multiplier: 1.0 },
            body: { name: 'body', size: new THREE.Vector3(0.4, 0.6, 0.3), offset: new THREE.Vector3(0, 1.2, 0), multiplier: 1.0 },
            leftArm: { name: 'left_arm', size: new THREE.Vector3(0.15, 0.4, 0.15), offset: new THREE.Vector3(-0.35, 1.3, 0), multiplier: 0.8 },
            rightArm: { name: 'right_arm', size: new THREE.Vector3(0.15, 0.4, 0.15), offset: new THREE.Vector3(0.35, 1.3, 0), multiplier: 0.8 },
            leftLeg: { name: 'left_leg', size: new THREE.Vector3(0.18, 0.5, 0.18), offset: new THREE.Vector3(-0.15, 0.5, 0), multiplier: 0.8 },
            rightLeg: { name: 'right_leg', size: new THREE.Vector3(0.18, 0.5, 0.18), offset: new THREE.Vector3(0.15, 0.5, 0), multiplier: 0.8 },
        };
    }

    spawn(spawnPoint) {
        this.mesh.position.set(spawnPoint.x, spawnPoint.y || 0, spawnPoint.z);
        this.velocity.set(0, 0, 0);
        this.health = 100;
        this.alive = true;
        this.yaw = spawnPoint.rotation?.y || 0;
        this.pitch = 0;
        this.mesh.visible = !this.isLocal;
        
        // Reset weapon
        if (this.isLocal) {
            this.game.weaponManager.reset();
        }
    }

    update(delta) {
        if (!this.alive) return;
        
        this.applyPhysics(delta);
        this.updateCamera();
        this.updateHitboxes();
    }

    applyPhysics(delta) {
        // Gravity
        this.velocity.y -= CONSTANTS.GRAVITY * delta;
        
        // Apply velocity
        this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
        
        // Ground detection
        const groundY = this.getGroundHeight(this.mesh.position.x, this.mesh.position.z);
        const playerBottom = this.mesh.position.y;
        
        if (playerBottom <= groundY) {
            this.mesh.position.y = groundY;
            this.velocity.y = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
        
        // Friction
        if (this.onGround) {
            this.velocity.x *= 0.85;
            this.velocity.z *= 0.85;
        } else {
            this.velocity.x *= 0.95;
            this.velocity.z *= 0.95;
        }
    }

    getGroundHeight(x, z) {
        // Simplified ground check - maps should override this
        return 0;
    }

    move(direction, speed, delta) {
        if (!this.alive) return;
        
        // Get camera direction (only yaw for movement)
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        
        const right = new THREE.Vector3(1, 0, 0);
        right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
        
        // Calculate movement direction
        const moveDir = new THREE.Vector3();
        moveDir.addScaledVector(forward, -direction.z);
        moveDir.addScaledVector(right, direction.x);
        moveDir.normalize();
        
        // Apply speed modifiers
        let actualSpeed = speed;
        if (this.isSprinting) actualSpeed *= CONSTANTS.SPRINT_MULTIPLIER;
        if (this.isCrouching) actualSpeed *= CONSTANTS.CROUCH_MULTIPLIER;
        
        // Apply velocity
        this.velocity.x = moveDir.x * actualSpeed;
        this.velocity.z = moveDir.z * actualSpeed;
    }

    jump() {
        if (!this.onGround || !this.alive) return;
        this.velocity.y = CONSTANTS.JUMP_FORCE;
        this.onGround = false;
        
        if (this.isLocal) {
            this.game.app.getAudioManager().play('jump');
        }
    }

    rotateX(angle) {
        this.pitch += angle;
        this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.PI / 2 - 0.1);
    }

    rotateY(angle) {
        this.yaw += angle;
        this.mesh.rotation.y = this.yaw;
    }

    updateCamera() {
        if (!this.isLocal) return;
        
        const camera = this.game.camera;
        const pos = this.mesh.position.clone();
        pos.y += this.cameraOffset.y;
        
        if (this.isCrouching) {
            pos.y -= 0.4;
        }
        
        camera.position.copy(pos);
        camera.rotation.order = 'YXZ';
        camera.rotation.y = this.yaw;
        camera.rotation.x = this.pitch;
    }

    updateHitboxes() {
        Object.entries(this.hitboxes).forEach(([key, hitbox]) => {
            hitbox.worldPosition = this.mesh.position.clone().add(hitbox.offset);
        });
    }

    takeDamage(amount, hitboxName, attacker) {
        if (!this.alive) return false;
        
        const hitbox = Object.values(this.hitboxes).find(h => h.name === hitboxName);
        if (hitbox) {
            amount *= hitbox.multiplier;
        }
        
        this.health -= amount;
        
        if (this.health <= 0) {
            this.health = 0;
            this.die(attacker, hitboxName);
            return true;
        }
        
        return false;
    }

    die(killer, hitboxName) {
        this.alive = false;
        this.deaths++;
        
        // Play death sound
        if (this.isLocal) {
            this.game.app.getAudioManager().play('elimination');
        }
        
        // Respawn after delay
        setTimeout(() => this.respawn(), 2000);
    }

    respawn() {
        const spawnPoint = this.game.currentMap.getRandomSpawnPoint();
        this.spawn(spawnPoint);
    }

    getMoveSpeed() {
        return CONSTANTS.MOVE_SPEED;
    }

    setSprinting(value) {
        this.isSprinting = value && this.onGround && !this.isCrouching;
    }

    setCrouching(value) {
        this.isCrouching = value;
        if (value) {
            this.cameraOffset.y = CONSTANTS.PLAYER_HEIGHT - 0.6;
        } else {
            this.cameraOffset.y = CONSTANTS.PLAYER_HEIGHT - 0.2;
        }
    }

    dispose() {
        this.mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }
}
