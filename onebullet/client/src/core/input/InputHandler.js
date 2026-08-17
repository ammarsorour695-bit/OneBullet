// Input Handler - Manages keyboard and mouse input
import * as THREE from 'three';

export class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = new Map();
        this.mouse = new THREE.Vector2();
        this.mouseDelta = new THREE.Vector2();
        this.isPointerLocked = false;
        
        this.sensitivity = 0.002;
        this.setupListeners();
    }

    setupListeners() {
        // Keyboard
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mousedown', (e) => this.onMouseDown(e));
        document.addEventListener('mouseup', (e) => this.onMouseUp(e));
        document.addEventListener('wheel', (e) => this.onWheel(e));
        
        // Pointer lock
        document.addEventListener('pointerlockchange', () => this.onPointerLockChange());
        
        // Click to lock
        this.game.canvas.addEventListener('click', () => {
            if (!this.isPointerLocked) {
                this.game.canvas.requestPointerLock();
            }
        });
    }

    onKeyDown(e) {
        this.keys.set(e.code, true);
        
        // Number keys for weapon switching
        if (e.code >= 'Digit1' && e.code <= 'Digit9') {
            const slot = parseInt(e.code.replace('Digit', '')) - 1;
            this.game.weaponManager.switchToSlot(slot);
        }
        
        // R for reload
        if (e.code === 'KeyR') {
            this.game.weaponManager.reload();
        }
    }

    onKeyUp(e) {
        this.keys.set(e.code, false);
    }

    onMouseMove(e) {
        if (!this.isPointerLocked) return;
        
        const settings = this.game.app.getStorageManager().getSettings();
        this.sensitivity = (settings.sensitivity / 50) * 0.002;
        
        this.mouseDelta.x = e.movementX * this.sensitivity;
        this.mouseDelta.y = e.movementY * this.sensitivity;
    }

    onMouseDown(e) {
        if (!this.isPointerLocked) return;
        
        if (e.button === 0) {
            this.game.weaponManager.startFire();
        } else if (e.button === 2) {
            this.game.weaponManager.startAim();
        }
    }

    onMouseUp(e) {
        if (e.button === 0) {
            this.game.weaponManager.stopFire();
        } else if (e.button === 2) {
            this.game.weaponManager.stopAim();
        }
    }

    onWheel(e) {
        // Zoom with scroll when aiming
        if (this.game.weaponManager.isAiming()) {
            this.game.weaponManager.adjustZoom(e.deltaY);
        }
    }

    onPointerLockChange() {
        this.isPointerLocked = document.pointerLockElement === this.game.canvas;
    }

    update(delta) {
        if (!this.isPointerLocked) return;
        
        const player = this.game.player;
        
        // Rotation from mouse
        player.rotateY(-this.mouseDelta.x);
        player.rotateX(-this.mouseDelta.y);
        this.mouseDelta.set(0, 0);
        
        // Movement
        const moveSpeed = player.getMoveSpeed();
        const direction = new THREE.Vector3();
        
        if (this.keys.get('KeyW')) direction.z -= 1;
        if (this.keys.get('KeyS')) direction.z += 1;
        if (this.keys.get('KeyA')) direction.x -= 1;
        if (this.keys.get('KeyD')) direction.x += 1;
        
        // Normalize diagonal movement
        if (direction.length() > 0) {
            direction.normalize();
        }
        
        // Sprint
        const isSprinting = this.keys.get('ShiftLeft') && direction.length() > 0;
        player.setSprinting(isSprinting);
        
        // Crouch
        const isCrouching = this.keys.get('ControlLeft');
        player.setCrouching(isCrouching);
        
        // Jump
        if (this.keys.get('Space')) {
            player.jump();
            this.keys.set('Space', false); // Prevent holding
        }
        
        // Apply movement
        player.move(direction, moveSpeed, delta);
    }

    getMovementInput() {
        const input = { x: 0, z: 0 };
        if (this.keys.get('KeyW')) input.z -= 1;
        if (this.keys.get('KeyS')) input.z += 1;
        if (this.keys.get('KeyA')) input.x -= 1;
        if (this.keys.get('KeyD')) input.x += 1;
        return input;
    }

    isMoving() {
        return this.keys.get('KeyW') || this.keys.get('KeyS') || 
               this.keys.get('KeyA') || this.keys.get('KeyD');
    }
}
