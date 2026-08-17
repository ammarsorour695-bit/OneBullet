// Mountain Base Map
import * as THREE from 'three';

export class MountainBaseMap {
    constructor(scene) {
        this.scene = scene;
        this.objects = [];
        this.spawnPoints = [
            { x: -30, y: 0, z: -30 }, { x: 30, y: 5, z: -30 },
            { x: -30, y: 5, z: 30 }, { x: 30, y: 5, z: 30 },
            { x: 0, y: 10, z: 0 }, { x: -40, y: 0, z: 0 },
            { x: 40, y: 0, z: 0 }, { x: 0, y: 0, z: -40 },
        ];
    }

    async build() {
        this.createGround();
        this.createMountains();
        this.createBase();
        this.createFog();
    }

    createGround() {
        const geo = new THREE.PlaneGeometry(150, 150, 60, 60);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const dist = Math.sqrt(x*x + y*y);
            pos.setZ(i, Math.sin(dist * 0.05) * 3 + Math.sin(x * 0.1) * Math.cos(y * 0.1) * 2);
        }
        geo.computeVertexNormals();
        
        const mat = new THREE.MeshStandardMaterial({ color: 0x8a9aaa, roughness: 0.9 });
        const ground = new THREE.Mesh(geo, mat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.objects.push(ground);
    }

    createMountains() {
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const dist = 60 + Math.random() * 20;
            const height = 20 + Math.random() * 15;
            
            const geo = new THREE.ConeGeometry(15 + Math.random() * 10, height, 6);
            const mat = new THREE.MeshStandardMaterial({ color: 0x6a7a8a, roughness: 0.95 });
            const mountain = new THREE.Mesh(geo, mat);
            mountain.position.set(Math.cos(angle) * dist, height/2, Math.sin(angle) * dist);
            this.scene.add(mountain);
            this.objects.push(mountain);
        }
    }

    createBase() {
        // Central facility
        const facility = new THREE.Group();
        const mainGeo = new THREE.BoxGeometry(20, 8, 15);
        const mainMat = new THREE.MeshStandardMaterial({ color: 0x5a6a7a });
        const main = new THREE.Mesh(mainGeo, mainMat);
        main.position.y = 4;
        main.castShadow = true;
        facility.add(main);
        
        // Radar dish
        const poleGeo = new THREE.CylinderGeometry(0.3, 0.3, 15, 8);
        const pole = new THREE.Mesh(poleGeo, mainMat);
        pole.position.set(0, 7.5, 0);
        facility.add(pole);
        
        const dishGeo = new THREE.SphereGeometry(3, 16, 8, 0, Math.PI * 2, 0, Math.PI/2);
        const dishMat = new THREE.MeshStandardMaterial({ color: 0x4a5a6a });
        const dish = new THREE.Mesh(dishGeo, dishMat);
        dish.position.set(0, 15, 0);
        dish.rotation.x = Math.PI;
        facility.add(dish);
        
        this.scene.add(facility);
        this.objects.push(facility);
    }

    createFog() {
        this.scene.fog = new THREE.FogExp2(0x8a9aaa, 0.012);
        this.scene.background = new THREE.Color(0x4a5a7a);
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
