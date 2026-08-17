// Sniper Rifle Weapon Class
import * as THREE from 'three';
import { CONSTANTS } from '../../shared/constants.js';
import { WEAPONS, SKINS } from '../../shared/weaponData.js';

export class SniperRifle {
    constructor(game) {
        this.game = game;
        this.data = WEAPONS.sniper;
        
        // State
        this.state = CONSTANTS.WEAPON_STATE_IDLE;
        this.ammo = this.data.ammo;
        this.reserveAmmo = this.data.reserveAmmo;
        this.lastFireTime = 0;
        this.reloadProgress = 0;
        this.boltProgress = 0;
        
        // Aiming
        this.isAimingDownSights = false;
        this.aimProgress = 0;
        this.currentFOV = CONSTANTS.DEFAULT_FOV;
        this.targetFOV = CONSTANTS.DEFAULT_FOV;
        
        // Recoil & sway
        this.recoilRecovery = 0;
        this.swayTime = 0;
        this.bobTime = 0;
        
        // Visuals
        this.mesh = this.createMesh();
        this.muzzleFlash = null;
        this.trailPoints = [];
        
        // Load skin
        this.applySkin();
    }

    createMesh() {
        const group = new THREE.Group();
        
        // Main body
        const bodyGeo = new THREE.BoxGeometry(0.15, 0.12, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.3,
            metalness: 0.8,
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);
        
        // Barrel
        const barrelGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8);
        const barrelMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            roughness: 0.2,
            metalness: 0.9,
        });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.5;
        barrel.position.y = 0.05;
        group.add(barrel);
        
        // Scope
        const scopeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8);
        const scopeMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1a,
            roughness: 0.2,
            metalness: 0.9,
        });
        const scope = new THREE.Mesh(scopeGeo, scopeMat);
        scope.rotation.x = Math.PI / 2;
        scope.position.y = 0.1;
        scope.position.z = -0.1;
        group.add(scope);
        
        // Stock
        const stockGeo = new THREE.BoxGeometry(0.1, 0.15, 0.3);
        const stockMat = new THREE.MeshStandardMaterial({ 
            color: 0x3d2817,
            roughness: 0.8,
        });
        const stock = new THREE.Mesh(stockGeo, stockMat);
        stock.position.z = 0.45;
        stock.position.y = -0.05;
        group.add(stock);
        
        // Magazine
        const magGeo = new THREE.BoxGeometry(0.08, 0.2, 0.12);
        const magMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
        const mag = new THREE.Mesh(magGeo, magMat);
        mag.position.y = -0.12;
        mag.position.z = 0.1;
        group.add(mag);
        
        return group;
    }

    applySkin() {
        const loadout = this.game.app.getStorageManager().getLoadout();
        const skinData = SKINS.weapons[loadout.weaponSkin] || SKINS.weapons.default;
        
        if (skinData.colors) {
            this.mesh.children.forEach(child => {
                if (child.material) {
                    child.material.color.set(skinData.colors.primary);
                }
            });
        }
    }

    update(delta) {
        this.swayTime += delta;
        this.bobTime += delta;
        
        // Update state machine
        switch (this.state) {
            case CONSTANTS.WEAPON_STATE_RECOILING:
                this.recoilRecovery += delta * this.data.recoil.recovery;
                if (this.recoilRecovery >= 1) {
                    this.state = CONSTANTS.WEAPON_STATE_IDLE;
                    this.recoilRecovery = 0;
                }
                break;
                
            case CONSTANTS.WEAPON_STATE_BOLTING:
                this.boltProgress += delta / this.data.boltTime;
                if (this.boltProgress >= 1) {
                    this.state = CONSTANTS.WEAPON_STATE_IDLE;
                    this.boltProgress = 0;
                }
                break;
                
            case CONSTANTS.WEAPON_STATE_RELOADING:
                this.reloadProgress += delta / this.data.reloadTime;
                if (this.reloadProgress >= 1) {
                    this.finishReload();
                }
                break;
        }
        
        // Update aim
        if (this.isAimingDownSights) {
            this.aimProgress = Math.min(this.aimProgress + delta * 5, 1);
            this.targetFOV = this.data.scopeFOV;
        } else {
            this.aimProgress = Math.max(this.aimProgress - delta * 5, 0);
            this.targetFOV = CONSTANTS.DEFAULT_FOV;
        }
        
        // Smooth FOV transition
        this.currentFOV += (this.targetFOV - this.currentFOV) * delta * 10;
        this.updateCameraFOV();
        
        // Update visual position
        this.updateWeaponPosition();
    }

    updateCameraFOV() {
        if (this.game.camera) {
            this.game.camera.fov = this.currentFOV;
            this.game.camera.updateProjectionMatrix();
        }
    }

    updateWeaponPosition() {
        // Calculate sway and bob
        const swayX = Math.sin(this.swayTime * this.data.sway.frequency) * this.data.sway.amplitude;
        const swayY = Math.cos(this.swayTime * this.data.sway.frequency * 0.5) * this.data.sway.amplitude * 0.5;
        
        // Bob when moving
        let bobY = 0;
        if (this.game.inputHandler?.isMoving() && this.game.player.onGround) {
            bobY = Math.sin(this.bobTime * this.data.bob.frequency) * this.data.bob.amplitude;
        }
        
        // Apply recoil
        const recoilOffset = (1 - this.recoilRecovery) * 0.1;
        
        // Position weapon in front of camera
        const camera = this.game.camera;
        const basePos = new THREE.Vector3(0.3, -0.25, -0.5);
        
        // Apply transformations
        basePos.x += swayX;
        basePos.y += swayY + bobY + recoilOffset;
        
        // Lerp based on aim
        const aimedPos = basePos.clone().multiplyScalar(0.7);
        basePos.lerp(aimedPos, this.aimProgress);
        
        this.mesh.position.copy(basePos);
        this.mesh.rotation.set(0, 0, 0);
        
        // Add to scene if not already
        if (!this.mesh.parent && camera) {
            camera.add(this.mesh);
        }
    }

    canFire() {
        const now = Date.now();
        return this.state === CONSTANTS.WEAPON_STATE_IDLE && 
               this.ammo > 0 && 
               (now - this.lastFireTime) >= this.data.fireCooldown * 1000;
    }

    fire() {
        if (!this.canFire()) {
            if (this.ammo <= 0) {
                this.playDryFire();
            }
            return;
        }
        
        this.ammo--;
        this.lastFireTime = Date.now();
        this.state = CONSTANTS.WEAPON_STATE_RECOILING;
        this.recoilRecovery = 0;
        
        // Play sounds
        this.game.app.getAudioManager().play('shoot');
        
        // Create muzzle flash
        this.createMuzzleFlash();
        
        // Perform hit scan
        this.performShot();
        
        // Auto bolt action
        setTimeout(() => {
            if (this.state === CONSTANTS.WEAPON_STATE_RECOILING) {
                this.state = CONSTANTS.WEAPON_STATE_BOLTING;
                this.boltProgress = 0;
                this.game.app.getAudioManager().play('bolt');
            }
        }, this.data.fireCooldown * 1000 * 0.5);
        
        // Auto reload if empty
        if (this.ammo <= 0 && this.game.app.getStorageManager().getSettings().autoReload) {
            setTimeout(() => this.reload(), this.data.boltTime * 1000);
        }
    }

    performShot() {
        const camera = this.game.camera;
        const origin = camera.position.clone();
        
        // Get shooting direction
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);
        
        // Add slight spread
        const spread = 0.001 * (1 - this.aimProgress);
        direction.x += (Math.random() - 0.5) * spread;
        direction.y += (Math.random() - 0.5) * spread;
        direction.normalize();
        
        // Create bullet trail
        this.createBulletTrail(origin, direction);
        
        // Check for hits
        const result = this.game.weaponManager.fireHitscan(origin, direction);
        
        this.game.player.shotsFired++;
        
        if (result.hit) {
            this.game.player.shotsHit++;
            this.game.player.score += 100;
            
            if (result.isHeadshot) {
                this.game.player.headshots++;
                this.game.app.getAudioManager().play('headshot');
            } else {
                this.game.app.getAudioManager().play('hit');
            }
            
            // Show hit marker
            this.showHitMarker(result.isHeadshot);
            
            // Damage target
            const damage = result.isHeadshot ? this.data.damage.head : this.data.damage.body;
            const killed = result.target.takeDamage(damage, result.hitbox.name, this.game.player);
            
            if (killed) {
                this.game.player.kills++;
                this.game.app.getAudioManager().play('elimination');
            }
        }
    }

    createMuzzleFlash() {
        if (this.muzzleFlash) {
            this.mesh.remove(this.muzzleFlash);
        }
        
        const flashGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const flashMat = new THREE.MeshBasicMaterial({ 
            color: 0xffffaa,
            transparent: true,
            opacity: 1,
        });
        this.muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
        this.muzzleFlash.position.z = -0.8;
        this.muzzleFlash.position.y = 0.05;
        this.mesh.add(this.muzzleFlash);
        
        // Fade out
        setTimeout(() => {
            if (this.muzzleFlash) {
                this.mesh.remove(this.muzzleFlash);
                this.muzzleFlash = null;
            }
        }, 50);
    }

    createBulletTrail(origin, direction) {
        const points = [origin];
        const end = origin.clone().add(direction.multiplyScalar(100));
        points.push(end);
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.8,
        });
        
        const line = new THREE.Line(geometry, material);
        this.game.scene.add(line);
        
        // Fade out
        setTimeout(() => {
            this.game.scene.remove(line);
            geometry.dispose();
            material.dispose();
        }, 100);
    }

    showHitMarker(isHeadshot) {
        const marker = document.getElementById('hudHitMarker');
        marker.classList.remove('hidden');
        if (isHeadshot) {
            marker.classList.add('headshot');
        }
        setTimeout(() => {
            marker.classList.add('hidden');
            marker.classList.remove('headshot');
        }, 150);
    }

    playDryFire() {
        // Click sound for dry fire
        this.game.app.getAudioManager().play('bolt');
    }

    startAim() {
        this.isAimingDownSights = true;
        this.state = this.state === CONSTANTS.WEAPON_STATE_IDLE ? 
                     CONSTANTS.WEAPON_STATE_AIMING : this.state;
    }

    stopAim() {
        this.isAimingDownSights = false;
        if (this.state === CONSTANTS.WEAPON_STATE_AIMING) {
            this.state = CONSTANTS.WEAPON_STATE_IDLE;
        }
    }

    adjustZoom(delta) {
        if (!this.isAimingDownSights) return;
        
        const zoomStep = 2;
        if (delta > 0) {
            this.targetFOV = Math.min(this.targetFOV + zoomStep, 40);
        } else {
            this.targetFOV = Math.max(this.targetFOV - zoomStep, 10);
        }
    }

    reload() {
        if (this.state !== CONSTANTS.WEAPON_STATE_IDLE || 
            this.ammo === this.data.maxAmmo || 
            this.reserveAmmo <= 0) {
            return;
        }
        
        this.state = CONSTANTS.WEAPON_STATE_RELOADING;
        this.reloadProgress = 0;
        this.game.app.getAudioManager().play('reload');
    }

    finishReload() {
        const needed = this.data.maxAmmo - this.ammo;
        const available = Math.min(needed, this.reserveAmmo);
        
        this.ammo += available;
        this.reserveAmmo -= available;
        this.state = CONSTANTS.WEAPON_STATE_IDLE;
    }

    stopFire() {
        // For semi-auto, nothing special needed
    }

    reset() {
        this.ammo = this.data.ammo;
        this.reserveAmmo = this.data.reserveAmmo;
        this.state = CONSTANTS.WEAPON_STATE_IDLE;
        this.recoilRecovery = 0;
        this.boltProgress = 0;
        this.reloadProgress = 0;
    }
}
