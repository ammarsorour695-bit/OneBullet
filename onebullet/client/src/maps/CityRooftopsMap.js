// City Rooftops Map
import * as THREE from 'three';

export class CityRooftopsMap {
    constructor(scene) {
        this.scene = scene;
        this.objects = [];
        this.spawnPoints = [
            { x: -25, y: 10, z: -25 }, { x: 25, y: 10, z: -25 },
            { x: -25, y: 5, z: 25 }, { x: 25, y: 5, z: 25 },
            { x: 0, y: 15, z: 0 }, { x: -35, y: 0, z: 0 },
            { x: 35, y: 0, z: 0 }, { x: 0, y: 0, z: -35 },
        ];
    }

    async build() {
        this.createGround();
        this.createBuildings();
        this.createProps();
        this.createFog();
    }

    createGround() {
        // Street level (death plane visually)
        const geo = new THREE.PlaneGeometry(200, 200);
        const mat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, roughness: 0.9 });
        const ground = new THREE.Mesh(geo, mat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        this.scene.add(ground);
        this.objects.push(ground);
    }

    createBuildings() {
        const heights = [10, 15, 8, 12, 6];
        const positions = [
            [-30, -30], [30, -30], [-30, 30], [30, 30],
            [-40, 0], [40, 0], [0, -40], [0, 40],
        ];
        
        positions.forEach((pos, i) => {
            const height = heights[i % heights.length];
            const building = this.createBuilding(20, height, 20);
            building.position.set(pos[0], 0, pos[1]);
            this.scene.add(building);
            this.objects.push(building);
        });
        
        // Central tower
        const tower = this.createBuilding(12, 25, 12);
        tower.position.set(0, 0, 0);
        this.scene.add(tower);
        this.objects.push(tower);
    }

    createBuilding(width, height, depth) {
        const group = new THREE.Group();
        
        const geo = new THREE.BoxGeometry(width, height, depth);
        const mat = new THREE.MeshStandardMaterial({ color: 0x4a5a6a, roughness: 0.7 });
        const building = new THREE.Mesh(geo, mat);
        building.position.y = height / 2;
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);
        
        // Windows
        const winMat = new THREE.MeshStandardMaterial({ color: 0x1a2a3a, emissive: 0x3a4a5a, emissiveIntensity: 0.5 });
        const winGeo = new THREE.PlaneGeometry(2, 3);
        
        for (let y = 2; y < height - 2; y += 4) {
            for (let x = -width/2 + 3; x < width/2 - 2; x += 5) {
                const win = new THREE.Mesh(winGeo, winMat);
                win.position.set(x, y, depth/2 + 0.1);
                group.add(win);
            }
        }
        
        return group;
    }

    createProps() {
        // AC units, vents, etc on rooftops
        for (let i = 0; i < 15; i++) {
            const ac = new THREE.Mesh(
                new THREE.BoxGeometry(2, 1.5, 2),
                new THREE.MeshStandardMaterial({ color: 0x3a4a5a })
            );
            ac.position.set(
                (Math.random() - 0.5) * 60,
                10 + Math.random() * 5,
                (Math.random() - 0.5) * 60
            );
            ac.castShadow = true;
            this.scene.add(ac);
            this.objects.push(ac);
        }
    }

    createFog() {
        this.scene.fog = new THREE.FogExp2(0x5a6a7a, 0.018);
        this.scene.background = new THREE.Color(0x3a4a5a);
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
