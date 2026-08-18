// Weapon Manager - Handles weapon systems
import * as THREE from 'three';
import { SniperRifle } from './SniperRifle.js';
import { WEAPONS } from '../../shared/weaponData.js';

export class WeaponManager {
    constructor(game) {
        this.game = game;
        this.weapons = new Map();
        this.currentWeapon = null;
        this.weaponSlot = 0;
        
        // Initialize weapons
        this.initWeapons();
    }

    initWeapons() {
        // Create sniper rifle
        const sniper = new SniperRifle(this.game);
        this.weapons.set('sniper', sniper);
        this.currentWeapon = sniper;
    }

    getCurrentWeapon() {
        return this.currentWeapon;
    }

    update(delta) {
        if (this.currentWeapon) {
            this.currentWeapon.update(delta);
        }
    }

    startFire() {
        if (this.currentWeapon && this.currentWeapon.canFire()) {
            this.currentWeapon.fire();
        }
    }

    stopFire() {
        if (this.currentWeapon) {
            this.currentWeapon.stopFire();
        }
    }

    startAim() {
        if (this.currentWeapon) {
            this.currentWeapon.startAim();
        }
    }

    stopAim() {
        if (this.currentWeapon) {
            this.currentWeapon.stopAim();
        }
    }

    isAiming() {
        return this.currentWeapon?.isAiming() ?? false;
    }

    adjustZoom(delta) {
        if (this.currentWeapon) {
            this.currentWeapon.adjustZoom(delta);
        }
    }

    reload() {
        if (this.currentWeapon) {
            this.currentWeapon.reload();
        }
    }

    switchToSlot(slot) {
        // For now we only have one weapon, but this enables future expansion
        if (slot === 0 && this.weapons.has('sniper')) {
            this.currentWeapon = this.weapons.get('sniper');
        }
    }

    reset() {
        if (this.currentWeapon) {
            this.currentWeapon.reset();
        }
    }

    // Hit detection
    fireHitscan(origin, direction) {
        const raycaster = new THREE.Raycaster();
        raycaster.set(origin, direction.normalize());
        raycaster.far = 500;

        // Collect all hitboxes from all players
        const hitboxMeshes = [];
        const hitboxData = [];

        // Check bots
        if (this.game.botManager) {
            this.game.botManager.bots.forEach(bot => {
                if (!bot.alive || bot === this.game.player) return;
                
                Object.entries(bot.hitboxes).forEach(([key, hitbox]) => {
                    if (hitbox.mesh) {
                        hitboxMeshes.push(hitbox.mesh);
                        hitboxData.push({ hitbox, owner: bot });
                    }
                });
            });
        }

        const intersects = raycaster.intersectObjects(hitboxMeshes, true);

        if (intersects.length > 0) {
            const hit = intersects[0];
            const data = hitboxData.find(d => d.hitbox.mesh === hit.object);
            
            if (data) {
                return {
                    hit: true,
                    target: data.owner,
                    hitboxName: data.hitbox.name,
                    isHeadshot: data.hitbox.name === 'head',
                    distance: hit.distance,
                };
            }
        }

        return { hit: false };
    }
}
