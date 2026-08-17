// Desert Outpost Map
import * as THREE from 'three';

export class DesertOutpostMap {
    constructor(scene) {
        this.scene = scene;
        this.objects = [];
        this.spawnPoints = [
            { x: -30, y: 0, z: -30 },
            { x: 30, y: 0, z: -30 },
            { x: -30, y: 0, z: 30 },
            { x: 30, y: 0, z: 30 },
            { x: 0, y: 0, z: -40 },
            { x: 0, y: 0, z: 40 },
            { x: -40, y: 0, z: 0 },
            { x: 40, y: 0, z: 0 },
        ];
    }

    async build() {
        this.createGround();
        this.createBuildings();
        this.createProps();
        this.createLighting();
        this.createFog();
    }

    createGround() {
        const geo = new THREE.PlaneGeometry(150, 150, 50, 50);
        
        // Add some height variation
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            pos.setZ(i, Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5);
        }
        geo.computeVertexNormals();
        
        const mat = new THREE.MeshStandardMaterial({
            color: 0xd2b48c,
            roughness: 0.9,
            metalness: 0.1,
        });
        
        const ground = new THREE.Mesh(geo, mat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.objects.push(ground);
    }

    createBuildings() {
        // Main building
        this.createBuilding(0, 0, 20, 15, 8, 0x8b7355);
        
        // Watchtower
        this.createWatchtower(25, -25);
        this.createWatchtower(-25, 25);
        
        // Small structures
        this.createBuilding(35, 10, 8, 6, 4, 0x9c8464);
        this.createBuilding(-35, -15, 10, 8, 5, 0x8b7355);
        this.createBuilding(15, -35, 12, 8, 4, 0x9c8464);
    }

    createBuilding(x, z, width, depth, height, color) {
        const group = new THREE.Group();
        
        // Main structure
        const geo = new THREE.BoxGeometry(width, height, depth);
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
        const building = new THREE.Mesh(geo, mat);
        building.position.y = height / 2;
        building.castShadow = true;
        building.receiveShadow = true;
        group.add(building);
        
        // Roof details
        const roofGeo = new THREE.ConeGeometry(Math.min(width, depth) * 0.3, 2, 4);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x6b5344 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = height + 1;
        roof.rotation.y = Math.PI / 4;
        group.add(roof);
        
        // Windows
        const windowMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a2a, 
            emissive: 0x2a2a3a,
            emissiveIntensity: 0.3,
        });
        
        const windowGeo = new THREE.PlaneGeometry(2, 2);
        [-1, 1].forEach(dx => {
            const win = new THREE.Mesh(windowGeo, windowMat);
            win.position.set(dx * (width/2 + 0.1), height * 0.6, 0);
            win.rotation.y = dx > 0 ? -Math.PI/2 : Math.PI/2;
            group.add(win);
        });
        
        group.position.set(x, 0, z);
        this.scene.add(group);
        this.objects.push(group);
    }

    createWatchtower(x, z) {
        const group = new THREE.Group();
        
        // Tower base
        const baseGeo = new THREE.CylinderGeometry(2, 2.5, 8, 6);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 4;
        base.castShadow = true;
        group.add(base);
        
        // Platform
        const platGeo = new THREE.BoxGeometry(6, 0.3, 6);
        const plat = new THREE.Mesh(platGeo, baseMat);
        plat.position.y = 8;
        group.add(plat);
        
        // Railing
        const railGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
        const railMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a });
        [-2.5, 2.5].forEach(xo => {
            [-2.5, 2.5].forEach(zo => {
                const rail = new THREE.Mesh(railGeo, railMat);
                rail.position.set(xo, 8.5, zo);
                group.add(rail);
            });
        });
        
        // Ladder
        const ladderGeo = new THREE.BoxGeometry(0.3, 8, 0.1);
        const ladder = new THREE.Mesh(ladderGeo, railMat);
        ladder.position.set(2, 4, 0);
        group.add(ladder);
        
        group.position.set(x, 0, z);
        this.scene.add(group);
        this.objects.push(group);
    }

    createProps() {
        // Crates
        for (let i = 0; i < 15; i++) {
            const x = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;
            if (Math.abs(x) < 25 && Math.abs(z) < 15) continue; // Skip building area
            
            const crate = this.createCrate();
            crate.position.set(x, 0, z);
            crate.rotation.y = Math.random() * Math.PI;
            this.scene.add(crate);
            this.objects.push(crate);
        }
        
        // Barrels
        for (let i = 0; i < 10; i++) {
            const barrel = this.createBarrel();
            barrel.position.set(
                (Math.random() - 0.5) * 80,
                0,
                (Math.random() - 0.5) * 80
            );
            this.scene.add(barrel);
            this.objects.push(barrel);
        }
        
        // Rocks
        for (let i = 0; i < 20; i++) {
            const rock = this.createRock();
            rock.position.set(
                (Math.random() - 0.5) * 120,
                0,
                (Math.random() - 0.5) * 120
            );
            this.scene.add(rock);
            this.objects.push(rock);
        }
    }

    createCrate() {
        const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0x8b5a2b,
            roughness: 0.9,
        });
        const crate = new THREE.Mesh(geo, mat);
        crate.castShadow = true;
        return crate;
    }

    createBarrel() {
        const geo = new THREE.CylinderGeometry(0.4, 0.4, 1, 12);
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0x2a3a4a,
            roughness: 0.5,
            metalness: 0.7,
        });
        const barrel = new THREE.Mesh(geo, mat);
        barrel.castShadow = true;
        return barrel;
    }

    createRock() {
        const geo = new THREE.DodecahedronGeometry(Math.random() * 2 + 1, 1);
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0x6b5344,
            roughness: 0.9,
        });
        const rock = new THREE.Mesh(geo, mat);
        rock.castShadow = true;
        return rock;
    }

    createLighting() {
        // Already handled by Game class, but can add point lights here
    }

    createFog() {
        this.scene.fog = new THREE.FogExp2(0xd2b48c, 0.015);
        this.scene.background = new THREE.Color(0x87ceeb);
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
