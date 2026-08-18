// Weapon System - Extended weapon types and management
import * as THREE from 'three';
import { CONSTANTS } from '../../shared/constants.js';
import { WEAPON_DATA } from '../../../shared/weaponData.js';

export class WeaponSystem {
    constructor(game) {
        this.game = game;
        this.weapons = new Map();
        this.currentWeaponIndex = 0;
        this.weaponSlot = 0; // 0: Sniper, 1: Secondary, 2: Melee
        this.isSwitching = false;
        this.switchCooldown = 0;
        
        this.initWeapons();
    }

    initWeapons() {
        // Initialize all available weapons
        this.weapons.set('sniper', new SniperRifle(this.game));
        this.weapons.set('pistol', new Pistol(this.game));
        this.weapons.set('knife', new Knife(this.game));
    }

    getCurrentWeapon() {
        const weaponId = this.getWeaponIdForSlot(this.weaponSlot);
        return this.weapons.get(weaponId);
    }

    getWeaponIdForSlot(slot) {
        if (slot === 0) return 'sniper';
        if (slot === 1) return 'pistol';
        return 'knife';
    }

    switchToSlot(slot) {
        if (this.isSwitching || this.switchCooldown > 0) return false;
        if (slot < 0 || slot > 2) return false;
        
        this.weaponSlot = slot;
        this.isSwitching = true;
        this.switchCooldown = 0.3;
        
        const weapon = this.getCurrentWeapon();
        weapon.onEquip();
        
        // Trigger weapon switch animation
        this.game.player.animateWeaponSwitch();
        
        return true;
    }

    switchToNextWeapon() {
        let newSlot = this.weaponSlot + 1;
        if (newSlot > 2) newSlot = 0;
        this.switchToSlot(newSlot);
    }

    switchToPreviousWeapon() {
        let newSlot = this.weaponSlot - 1;
        if (newSlot < 0) newSlot = 2;
        this.switchToSlot(newSlot);
    }

    update(delta) {
        if (this.switchCooldown > 0) {
            this.switchCooldown -= delta;
            if (this.switchCooldown <= 0) {
                this.isSwitching = false;
            }
        }

        // Update current weapon
        const weapon = this.getCurrentWeapon();
        if (weapon) {
            weapon.update(delta);
        }
    }

    fire() {
        const weapon = this.getCurrentWeapon();
        if (weapon && !this.isSwitching) {
            return weapon.fire();
        }
        return false;
    }

    aim() {
        const weapon = this.getCurrentWeapon();
        if (weapon) {
            weapon.aim();
        }
    }

    unAim() {
        const weapon = this.getCurrentWeapon();
        if (weapon) {
            weapon.unAim();
        }
    }

    reload() {
        const weapon = this.getCurrentWeapon();
        if (weapon) {
            return weapon.reload();
        }
        return false;
    }

    inspect() {
        const weapon = this.getCurrentWeapon();
        if (weapon) {
            weapon.inspect();
        }
    }

    drop() {
        // Could implement weapon dropping in future
        console.log('[WeaponSystem] Drop not implemented');
    }

    getAmmo() {
        const weapon = this.getCurrentWeapon();
        if (weapon) {
            return {
                current: weapon.ammo,
                reserve: weapon.reserveAmmo,
                type: weapon.ammoType
            };
        }
        return { current: 0, reserve: 0, type: 'none' };
    }

    setSkin(skinId) {
        this.weapons.forEach((weapon, id) => {
            weapon.setSkin(skinId);
        });
    }
}

// Base Weapon Class
export class BaseWeapon {
    constructor(game, data) {
        this.game = game;
        this.data = data;
        this.state = 'IDLE';
        this.ammo = data.maxAmmo;
        this.reserveAmmo = data.maxReserve;
        this.cooldown = 0;
        this.isAiming = false;
        this.skinId = 'default';
        
        // Animation states
        this.recoil = 0;
        this.sway = 0;
        this.bob = 0;
        this.bobTime = 0;
        
        // Effects
        this.muzzleFlash = null;
        this.trailMaterial = null;
    }

    onEquip() {
        this.state = 'IDLE';
        this.cooldown = 0.5;
    }

    update(delta) {
        if (this.cooldown > 0) {
            this.cooldown -= delta;
        }

        // Update animations
        this.updateAnimations(delta);
    }

    updateAnimations(delta) {
        const player = this.game.player;
        
        // Weapon bob when moving
        if (player.velocity.length() > 0.1 && this.state !== 'RELOADING') {
            this.bobTime += delta * 15;
            this.bob = Math.sin(this.bobTime) * 0.02;
        } else {
            this.bob *= 0.9;
        }

        // Recoil recovery
        if (this.recoil > 0) {
            this.recoil -= delta * 5;
            if (this.recoil < 0) this.recoil = 0;
        }

        // Sway when aiming
        if (this.isAiming) {
            this.sway = Math.sin(Date.now() * 0.002) * 0.001;
        } else {
            this.sway *= 0.95;
        }
    }

    fire() {
        if (this.state === 'RELOADING' || this.state === 'BOLTING') return false;
        if (this.cooldown > 0) return false;
        if (this.ammo <= 0) {
            this.onDryFire();
            return false;
        }

        this.ammo--;
        this.cooldown = this.data.fireRate;
        this.state = 'FIRING';
        
        this.onFire();
        
        setTimeout(() => {
            if (this.state === 'FIRING') {
                this.state = 'IDLE';
            }
        }, 100);

        return true;
    }

    onFire() {
        // Override in subclasses
    }

    onDryFire() {
        this.game.audioManager.play('dryFire');
    }

    aim() {
        if (this.state === 'RELOADING') return;
        this.isAiming = true;
        this.state = 'AIMING';
    }

    unAim() {
        this.isAiming = false;
        if (this.state === 'AIMING') {
            this.state = 'IDLE';
        }
    }

    reload() {
        if (this.state === 'RELOADING') return false;
        if (this.ammo >= this.data.maxAmmo) return false;
        if (this.reserveAmmo <= 0) return false;

        this.state = 'RELOADING';
        this.game.audioManager.play('reload');
        
        setTimeout(() => {
            this.completeReload();
        }, this.data.reloadTime * 1000);

        return true;
    }

    completeReload() {
        const needed = this.data.maxAmmo - this.ammo;
        const take = Math.min(needed, this.reserveAmmo);
        
        this.ammo += take;
        this.reserveAmmo -= take;
        this.state = 'IDLE';
    }

    inspect() {
        if (this.state === 'RELOADING') return;
        this.state = 'INSPECTING';
        
        setTimeout(() => {
            if (this.state === 'INSPECTING') {
                this.state = 'IDLE';
            }
        }, 2000);
    }

    setSkin(skinId) {
        this.skinId = skinId;
        this.applySkin();
    }

    applySkin() {
        // Override in subclasses to apply visual changes
    }

    getZoomLevel() {
        return this.isAiming ? (this.data.zoom || 1) : 1;
    }
}

// Sniper Rifle
class SniperRifle extends BaseWeapon {
    constructor(game) {
        super(game, WEAPON_DATA.sniper);
        this.boltAction = false;
        this.scopeTransition = 0;
    }

    onFire() {
        this.game.audioManager.play('sniperFire');
        this.recoil = 0.15;
        this.createMuzzleFlash();
        this.createBulletTrail();
        
        // Bolt action required
        this.boltAction = true;
        this.state = 'BOLTING';
        
        this.game.audioManager.play('bolt');
        setTimeout(() => {
            this.boltAction = false;
            if (this.state === 'BOLTING') {
                this.state = 'IDLE';
            }
        }, 600);

        // Notify for hit detection
        if (this.game.networkClient) {
            this.game.networkClient.sendShot();
        } else {
            this.game.checkHit();
        }
    }

    createMuzzleFlash() {
        // Create muzzle flash effect
        const flash = new THREE.PointLight(0xffaa00, 2, 5);
        flash.position.set(0.5, -0.3, -1);
        this.game.scene.add(flash);
        
        setTimeout(() => {
            this.game.scene.remove(flash);
        }, 50);
    }

    createBulletTrail() {
        // Create bullet trail effect
        const playerPos = this.game.player.getPosition();
        const direction = this.game.player.getLookDirection();
        
        const trailGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array([
            playerPos.x, playerPos.y, playerPos.z,
            playerPos.x + direction.x * 100,
            playerPos.y + direction.y * 100,
            playerPos.z + direction.z * 100,
        ]);
        
        trailGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const trailMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffff00, 
            transparent: true, 
            opacity: 0.6 
        });
        
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        this.game.scene.add(trail);
        
        setTimeout(() => {
            this.game.scene.remove(trail);
            trailGeometry.dispose();
            trailMaterial.dispose();
        }, 200);
    }

    aim() {
        if (this.state === 'RELOADING' || this.state === 'BOLTING') return;
        this.isAiming = true;
        this.state = 'AIMING';
        
        // Scope transition animation
        const hud = document.getElementById('hudScope');
        if (hud) {
            hud.classList.remove('hidden');
        }
    }

    unAim() {
        this.isAiming = false;
        if (this.state === 'AIMING') {
            this.state = 'IDLE';
        }
        
        const hud = document.getElementById('hudScope');
        if (hud) {
            hud.classList.add('hidden');
        }
    }

    getZoomLevel() {
        return this.isAiming ? 8 : 1;
    }
}

// Pistol (Secondary)
class Pistol extends BaseWeapon {
    constructor(game) {
        super(game, WEAPON_DATA.pistol);
    }

    onFire() {
        this.game.audioManager.play('pistolFire');
        this.recoil = 0.05;
        this.createMuzzleFlash();
        
        if (this.game.networkClient) {
            this.game.networkClient.sendShot();
        } else {
            this.game.checkHit();
        }
    }

    createMuzzleFlash() {
        const flash = new THREE.PointLight(0xffaa00, 1, 3);
        flash.position.set(0.3, -0.2, -0.5);
        this.game.scene.add(flash);
        
        setTimeout(() => {
            this.game.scene.remove(flash);
        }, 50);
    }

    getZoomLevel() {
        return this.isAiming ? 1.5 : 1;
    }
}

// Knife (Melee)
class Knife extends BaseWeapon {
    constructor(game) {
        super(game, WEAPON_DATA.knife);
        this.swinging = false;
    }

    fire() {
        if (this.state === 'SWINGING' || this.cooldown > 0) return false;
        
        this.cooldown = this.data.fireRate;
        this.state = 'SWINGING';
        this.swinging = true;
        
        this.game.audioManager.play('knifeSwing');
        
        // Check melee hit
        setTimeout(() => {
            this.checkMeleeHit();
            this.swinging = false;
            if (this.state === 'SWINGING') {
                this.state = 'IDLE';
            }
        }, 300);

        return true;
    }

    checkMeleeHit() {
        // Simple melee range check
        const playerPos = this.game.player.getPosition();
        const lookDir = this.game.player.getLookDirection();
        
        // Check for enemies in melee range
        const range = 2.5;
        const hitBox = new THREE.Box3();
        hitBox.setFromCenterAndSize(
            new THREE.Vector3(
                playerPos.x + lookDir.x * range,
                playerPos.y,
                playerPos.z + lookDir.z * range
            ),
            new THREE.Vector3(1, 2, 1)
        );

        // Check bots
        if (this.game.botManager) {
            this.game.botManager.bots.forEach(bot => {
                if (bot.alive) {
                    const botBox = new THREE.Box3().setFromObject(bot.mesh);
                    if (hitBox.intersectsBox(botBox)) {
                        bot.takeDamage(50, this.game.player, 'melee');
                    }
                }
            });
        }
    }

    getZoomLevel() {
        return 1;
    }
}
