// Industrial Yard Map
import * as THREE from 'three';

export class IndustrialYardMap {
    constructor(scene) {
        this.scene = scene;
        this.objects = [];
        this.spawnPoints = [
            { x: -35, y: 0, z: -35 }, { x: 35, y: 0, z: -35 },
            { x: -35, y: 0, z: 35 }, { x: 35, y: 0, z: 35 },
            { x: 0, y: 0, z: -45 }, { x: 0, y: 0, z: 45 },
            { x: -45, y: 0, z: 0 }, { x: 45, y: 0, z: 0 },
        ];
    }

    async build() {
        this.createGround();
        this.createContainers();
        this.createStructures();
        this.createFog();
    }

    createGround() {
        const geo = new THREE.PlaneGeometry(160, 160);
        const mat = new THREE.MeshStandardMaterial({ color: 0x5a6a7a, roughness: 0.8 });
        const ground = new THREE.Mesh(geo, mat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.objects.push(ground);
    }

    createContainers() {
        const colors = [0xc44024, 0x2d5aa0, 0x3d8b3d, 0xd4af37, 0x8b7355];
        
        for (let i = 0; i < 40; i++) {
            const container = this.createContainer(colors[Math.floor(Math.random() * colors.length)]);
            container.position.set(
                (Math.random() - 0.5) * 120,
                0,
                (Math.random() - 0.5) * 120
            );
            container.rotation.y = Math.floor(Math.random() * 4) * Math.PI / 2;
            this.scene.add(container);
            this.objects.push(container);
        }
    }

    createContainer(color) {
        const group = new THREE.Group();
        const geo = new THREE.BoxGeometry(10, 3, 3);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.5 });
        const container = new THREE.Mesh(geo, mat);
        container.castShadow = true;
        container.receiveShadow = true;
        group.add(container);
        return group;
    }

    createStructures() {
        // Warehouse
        const warehouse = new THREE.Group();
        const wallGeo = new THREE.BoxGeometry(40, 10, 1);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a5a6a });
        
        [-20, 20].forEach(x => {
            const wall = new THREE.Mesh(wallGeo, wallMat);
            wall.position.set(x, 5, 0);
            wall.castShadow = true;
            warehouse.add(wall);
        });
        
        const roofGeo = new THREE.ConeGeometry(30, 5, 4);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 12;
        roof.rotation.y = Math.PI / 4;
        warehouse.add(roof);
        
        warehouse.position.set(0, 0, -40);
        this.scene.add(warehouse);
        this.objects.push(warehouse);
    }

    createFog() {
        this.scene.fog = new THREE.FogExp2(0x5a6a7a, 0.02);
        this.scene.background = new THREE.Color(0x6a7a8a);
    }

    getRandomSpawnPoint() {
        return this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
    }

    dispose() {
        this.objects.forEach(obj => {
            obj.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            this.scene.remove(obj);
        });
    }
}
