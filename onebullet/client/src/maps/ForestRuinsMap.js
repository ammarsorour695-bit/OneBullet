// Forest Ruins Map - Jungle environment with ancient ruins
import * as THREE from 'three';

export class ForestRuinsMap {
    constructor(scene) {
        this.scene = scene;
        this.spawnPoints = [];
        this.coverObjects = [];
        this.mapObjects = [];
        this.navMesh = null;
        
        // Materials
        this.groundMaterial = null;
        this.stoneMaterial = null;
        this.foliageMaterial = null;
        this.waterMaterial = null;
    }

    async build() {
        this.createMaterials();
        this.createTerrain();
        this.createRuins();
        this.createVegetation();
        this.createWaterFeatures();
        this.createSpawnPoints();
        this.createLighting();
        this.createSky();
        this.createParticles();
    }

    createMaterials() {
        // Ground material - jungle floor
        this.groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x3d5c3d,
            roughness: 0.9,
            metalness: 0.1,
        });

        // Stone material - ancient ruins
        this.stoneMaterial = new THREE.MeshStandardMaterial({
            color: 0x6a6a5a,
            roughness: 0.8,
            metalness: 0.2,
        });

        // Mossy stone
        this.mossStoneMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a5a4a,
            roughness: 0.85,
            metalness: 0.15,
        });

        // Foliage material
        this.foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d4a2d,
            roughness: 0.7,
            metalness: 0.0,
            side: THREE.DoubleSide,
        });

        // Water material
        this.waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a4a5a,
            roughness: 0.3,
            metalness: 0.8,
            transparent: true,
            opacity: 0.8,
        });
    }

    createTerrain() {
        // Main ground plane with slight variations
        const groundGeometry = new THREE.PlaneGeometry(200, 200, 50, 50);
        
        // Add height variation
        const positions = groundGeometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const z = positions[i + 1];
            // Gentle rolling terrain
            positions[i + 2] = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 3 + 
                              Math.sin(x * 0.1 + z * 0.1) * 1.5;
        }
        groundGeometry.computeVertexNormals();

        const ground = new THREE.Mesh(groundGeometry, this.groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.mapObjects.push(ground);

        // Create elevated areas
        this.createElevatedArea(-40, -40, 25, 8);
        this.createElevatedArea(50, 30, 20, 6);
        this.createElevatedArea(-30, 50, 15, 5);
    }

    createElevatedArea(x, z, radius, height) {
        const hillGeometry = new THREE.CylinderGeometry(radius, radius * 1.2, height, 8);
        const hill = new THREE.Mesh(hillGeometry, this.groundMaterial);
        hill.position.set(x, height / 2 - 1, z);
        hill.receiveShadow = true;
        this.scene.add(hill);
        this.mapObjects.push(hill);
    }

    createRuins() {
        // Central temple structure
        this.createTemple(0, 0);

        // Scattered ruin pieces
        this.createRuinPillar(-20, -15, 4);
        this.createRuinPillar(-18, -12, 3);
        this.createRuinPillar(25, -20, 3.5);
        this.createRuinPillar(30, -18, 2.5);
        
        this.createRuinWall(-30, 10, 8, 3);
        this.createRuinWall(-28, 10, 8, 3);
        this.createRuinWall(15, 25, 6, 2.5);
        
        this.createCollapsedStructure(40, -35);
        this.createCollapsedStructure(-45, 25);
        
        // Ancient archway
        this.createArchway(-10, 30);
        this.createArchway(35, 10);
    }

    createTemple(x, z) {
        const templeGroup = new THREE.Group();
        
        // Base platform
        const baseGeometry = new THREE.BoxGeometry(16, 1.5, 12);
        const base = new THREE.Mesh(baseGeometry, this.stoneMaterial);
        base.position.y = 0.75;
        base.castShadow = true;
        base.receiveShadow = true;
        templeGroup.add(base);

        // Steps
        for (let i = 0; i < 4; i++) {
            const stepGeometry = new THREE.BoxGeometry(14 - i * 2, 0.4, 3);
            const step = new THREE.Mesh(stepGeometry, this.stoneMaterial);
            step.position.set(0, 1.5 + i * 0.4, -7 + i * 1.5);
            step.castShadow = true;
            step.receiveShadow = true;
            templeGroup.add(step);
        }

        // Columns
        const columnPositions = [
            [-6, 0, -4], [6, 0, -4],
            [-6, 0, 4], [6, 0, 4],
        ];

        columnPositions.forEach(([cx, cz]) => {
            const columnGeometry = new THREE.CylinderGeometry(0.5, 0.6, 6, 8);
            const column = new THREE.Mesh(columnGeometry, this.mossStoneMaterial);
            column.position.set(cx, 4.5, cz);
            column.castShadow = true;
            column.receiveShadow = true;
            templeGroup.add(column);
        });

        // Roof
        const roofGeometry = new THREE.ConeGeometry(10, 4, 4);
        const roof = new THREE.Mesh(roofGeometry, this.mossStoneMaterial);
        roof.position.y = 8;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        templeGroup.add(roof);

        // Inner chamber
        const chamberGeometry = new THREE.BoxGeometry(8, 5, 8);
        const chamber = new THREE.Mesh(chamberGeometry, this.mossStoneMaterial);
        chamber.position.set(0, 4, 0);
        chamber.castShadow = true;
        templeGroup.add(chamber);

        templeGroup.position.set(x, 1.5, z);
        this.scene.add(templeGroup);
        this.mapObjects.push(templeGroup);
        this.coverObjects.push(templeGroup);
    }

    createRuinPillar(x, z, height) {
        const geometry = new THREE.CylinderGeometry(0.8, 1, height, 6);
        const pillar = new THREE.Mesh(geometry, this.mossStoneMaterial);
        pillar.position.set(x, height / 2, z);
        pillar.rotation.z = (Math.random() - 0.5) * 0.3;
        pillar.rotation.x = (Math.random() - 0.5) * 0.3;
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        this.scene.add(pillar);
        this.mapObjects.push(pillar);
        this.coverObjects.push(pillar);
    }

    createRuinWall(x, z, length, height) {
        const geometry = new THREE.BoxGeometry(length, height, 1);
        const wall = new THREE.Mesh(geometry, this.mossStoneMaterial);
        wall.position.set(x, height / 2, z);
        wall.rotation.y = (Math.random() - 0.5) * 0.5;
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.scene.add(wall);
        this.mapObjects.push(wall);
        this.coverObjects.push(wall);
    }

    createCollapsedStructure(x, z) {
        const group = new THREE.Group();
        
        // Scattered blocks
        for (let i = 0; i < 8; i++) {
            const size = 1 + Math.random() * 2;
            const blockGeometry = new THREE.BoxGeometry(size, size * 0.6, size);
            const block = new THREE.Mesh(blockGeometry, this.mossStoneMaterial);
            block.position.set(
                (Math.random() - 0.5) * 8,
                size * 0.3,
                (Math.random() - 0.5) * 8
            );
            block.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            block.castShadow = true;
            block.receiveShadow = true;
            group.add(block);
        }

        group.position.set(x, 0, z);
        this.scene.add(group);
        this.mapObjects.push(group);
        this.coverObjects.push(group);
    }

    createArchway(x, z) {
        const group = new THREE.Group();
        
        // Two pillars
        const pillarGeometry = new THREE.CylinderGeometry(0.7, 0.8, 5, 6);
        const leftPillar = new THREE.Mesh(pillarGeometry, this.mossStoneMaterial);
        leftPillar.position.set(-3, 2.5, 0);
        leftPillar.castShadow = true;
        group.add(leftPillar);

        const rightPillar = new THREE.Mesh(pillarGeometry, this.mossStoneMaterial);
        rightPillar.position.set(3, 2.5, 0);
        rightPillar.castShadow = true;
        group.add(rightPillar);

        // Arch top
        const archGeometry = new THREE.BoxGeometry(8, 1, 1.5);
        const arch = new THREE.Mesh(archGeometry, this.mossStoneMaterial);
        arch.position.set(0, 5, 0);
        arch.castShadow = true;
        group.add(arch);

        group.position.set(x, 0, z);
        this.scene.add(group);
        this.mapObjects.push(group);
        this.coverObjects.push(group);
    }

    createVegetation() {
        // Trees
        for (let i = 0; i < 40; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            
            // Avoid temple area
            if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
            
            this.createTree(x, z);
        }

        // Bushes and undergrowth
        for (let i = 0; i < 100; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;
            
            if (Math.abs(x) < 15 && Math.abs(z) < 15) continue;
            
            this.createBush(x, z);
        }

        // Vines on ruins
        this.createVines();
    }

    createTree(x, z) {
        const group = new THREE.Group();
        
        // Trunk
        const trunkHeight = 4 + Math.random() * 4;
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, trunkHeight, 6);
        const trunk = new THREE.Mesh(trunkGeometry, new THREE.MeshStandardMaterial({
            color: 0x4a3a2a,
            roughness: 0.9,
        }));
        trunk.position.y = trunkHeight / 2;
        trunk.castShadow = true;
        group.add(trunk);

        // Foliage
        const foliageGeometry = new THREE.SphereGeometry(2 + Math.random() * 1.5, 8, 8);
        const foliage = new THREE.Mesh(foliageGeometry, this.foliageMaterial);
        foliage.position.y = trunkHeight + 1;
        foliage.castShadow = true;
        group.add(foliage);

        group.position.set(x, 0, z);
        this.scene.add(group);
        this.mapObjects.push(group);
    }

    createBush(x, z) {
        const size = 0.5 + Math.random() * 1;
        const geometry = new THREE.SphereGeometry(size, 6, 6);
        const bush = new THREE.Mesh(geometry, this.foliageMaterial);
        bush.position.set(x, size * 0.5, z);
        bush.scale.y = 0.7;
        bush.castShadow = true;
        this.scene.add(bush);
        this.mapObjects.push(bush);
    }

    createVines() {
        // Add vine decorations to ruins
        const vineMaterial = new THREE.MeshStandardMaterial({
            color: 0x2d5a2d,
            roughness: 0.8,
        });

        // Simple vine strands on temple
        for (let i = 0; i < 12; i++) {
            const vineGeometry = new THREE.CylinderGeometry(0.1, 0.15, 3, 4);
            const vine = new THREE.Mesh(vineGeometry, vineMaterial);
            vine.position.set(
                -6 + Math.random() * 12,
                4 + Math.random() * 3,
                -4.5 + Math.random() * 0.5
            );
            vine.rotation.x = -0.3;
            this.scene.add(vine);
            this.mapObjects.push(vine);
        }
    }

    createWaterFeatures() {
        // Central water pool near temple
        const poolGeometry = new THREE.CircleGeometry(8, 16);
        const pool = new THREE.Mesh(poolGeometry, this.waterMaterial);
        pool.rotation.x = -Math.PI / 2;
        pool.position.set(15, 0.1, 15);
        this.scene.add(pool);
        this.mapObjects.push(pool);

        // Stream
        const streamShape = new THREE.Shape();
        streamShape.moveTo(0, 0);
        streamShape.bezierCurveTo(20, -10, 40, -20, 60, -30);
        streamShape.bezierCurveTo(50, -25, 30, -15, 0, 0);

        const streamGeometry = new THREE.ExtrudeGeometry(streamShape, {
            depth: 0.2,
            bevelEnabled: false,
        });
        const stream = new THREE.Mesh(streamGeometry, this.waterMaterial);
        stream.rotation.x = -Math.PI / 2;
        stream.position.set(-30, 0.15, -20);
        this.scene.add(stream);
        this.mapObjects.push(stream);
    }

    createSpawnPoints() {
        this.spawnPoints = [
            { x: -50, y: 2, z: -50 },  // Northwest corner
            { x: 50, y: 2, z: -50 },   // Northeast corner
            { x: -50, y: 2, z: 50 },   // Southwest corner
            { x: 50, y: 2, z: 50 },    // Southeast corner
            { x: 0, y: 3, z: -40 },    // North of temple
            { x: -40, y: 2, z: 0 },    // West side
            { x: 40, y: 2, z: 0 },     // East side
            { x: 0, y: 3, z: 40 },     // South of temple
        ];
    }

    createLighting() {
        // Ambient light - filtered through canopy
        const ambient = new THREE.AmbientLight(0x4a5a4a, 0.5);
        this.scene.add(ambient);

        // Directional light - sun rays through trees
        const sun = new THREE.DirectionalLight(0xffffcc, 0.8);
        sun.position.set(30, 60, 30);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 150;
        sun.shadow.camera.left = -60;
        sun.shadow.camera.right = 60;
        sun.shadow.camera.top = 60;
        sun.shadow.camera.bottom = -60;
        this.scene.add(sun);

        // Point lights for atmosphere
        const warmLight = new THREE.PointLight(0xffaa55, 0.5, 20);
        warmLight.position.set(0, 8, 0);
        this.scene.add(warmLight);
    }

    createSky() {
        // Jungle sky with fog
        this.scene.background = new THREE.Color(0x6a7a6a);
        this.scene.fog = new THREE.FogExp2(0x6a7a6a, 0.015);
    }

    createParticles() {
        // Floating spores/pollen particles
        const particleCount = 300;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 150;
            positions[i * 3 + 1] = Math.random() * 30;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 150;
            velocities.push({
                x: (Math.random() - 0.5) * 0.02,
                y: Math.random() * 0.02,
                z: (Math.random() - 0.5) * 0.02,
            });
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0xaacc88,
            size: 0.1,
            transparent: true,
            opacity: 0.6,
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        particles.userData.velocities = velocities;
        this.scene.add(particles);
        this.mapObjects.push(particles);

        // Animate particles
        const animate = () => {
            const positions = particles.geometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] += velocities[i].x;
                positions[i * 3 + 1] += velocities[i].y;
                positions[i * 3 + 2] += velocities[i].z;

                // Wrap around
                if (positions[i * 3] > 75) positions[i * 3] = -75;
                if (positions[i * 3] < -75) positions[i * 3] = 75;
                if (positions[i * 3 + 1] > 30) positions[i * 3 + 1] = 0;
                if (positions[i * 3 + 1] < 0) positions[i * 3 + 1] = 30;
                if (positions[i * 3 + 2] > 75) positions[i * 3 + 2] = -75;
                if (positions[i * 3 + 2] < -75) positions[i * 3 + 2] = 75;
            }
            particles.geometry.attributes.position.needsUpdate = true;
            requestAnimationFrame(animate);
        };
        animate();
    }

    getRandomSpawnPoint() {
        return this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
    }

    getSpawnPoints() {
        return [...this.spawnPoints];
    }

    dispose() {
        this.mapObjects.forEach(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.dispose());
                } else {
                    obj.material.dispose();
                }
            }
        });
        this.mapObjects = [];
    }
}
