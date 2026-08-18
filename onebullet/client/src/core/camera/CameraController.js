// Camera Controller - First Person Camera
import * as THREE from 'three';

export class CameraController {
    constructor(camera, sensitivity = 0.002) {
        this.camera = camera;
        this.sensitivity = sensitivity;
        this.pitch = 0;
        this.yaw = 0;
        this.minPitch = -Math.PI / 2 + 0.01;
        this.maxPitch = Math.PI / 2 - 0.01;
        
        // Smooth camera
        this.targetPitch = 0;
        this.targetYaw = 0;
        this.smoothing = 0.1;
    }

    rotate(deltaX, deltaY) {
        this.yaw -= deltaX * this.sensitivity;
        this.pitch -= deltaY * this.sensitivity;
        
        // Clamp pitch
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
        
        // Apply rotation
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
    }

    setPosition(x, y, z) {
        this.camera.position.set(x, y, z);
    }

    getPosition() {
        return this.camera.position.clone();
    }

    getDirection() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return direction;
    }

    setSensitivity(value) {
        this.sensitivity = value;
    }
}
