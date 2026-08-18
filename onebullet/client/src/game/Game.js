// ONEBULLET - Main Game Class
import * as THREE from 'three';
import { Player } from '../player/Player.js';
import { WeaponSystem } from '../weapons/WeaponSystem.js';
import { InputHandler } from '../core/input/InputHandler.js';
import { BotManager } from '../bots/BotManager.js';
import { DesertOutpostMap } from '../maps/DesertOutpostMap.js';
import { IndustrialYardMap } from '../maps/IndustrialYardMap.js';
import { MountainBaseMap } from '../maps/MountainBaseMap.js';
import { CityRooftopsMap } from '../maps/CityRooftopsMap.js';
import { ForestRuinsMap } from '../maps/ForestRuinsMap.js';
import { GAME_MODES, CONSTANTS } from '../../shared/constants.js';

export class Game {
    constructor(app, config) {
        this.app = app;
        this.config = config;
        this.canvas = document.getElementById('gameCanvas');
        this.container = document.getElementById('gameContainer');
        
        // Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        // Game systems
        this.player = null;
        this.weaponSystem = null;
        this.inputHandler = null;
        this.botManager = null;
        this.currentMap = null;
        
        // Game state
        this.running = false;
        this.paused = false;
        this.matchTime = 0;
        this.scores = {};
        
        // Map registry
        this.mapBuilders = {
            desertOutpost: DesertOutpostMap,
            industrialYard: IndustrialYardMap,
            mountainBase: MountainBaseMap,
            cityRooftops: CityRooftopsMap,
            forestRuins: ForestRuinsMap,
        };
    }

    async start() {
        console.log('[Game] Starting...');
        
        try {
            this.initRenderer();
            this.initScene();
            this.initCamera();
            this.initLighting();
            
            // Load map
            await this.loadMap(this.config.map);
            
            // Initialize systems
            this.inputHandler = new InputHandler(this);
            this.weaponSystem = new WeaponSystem(this);
            this.player = new Player(this, true);
            this.botManager = new BotManager(this);
            
            // Spawn player
            this.spawnPlayer(this.player);
            
            // Spawn bots
            if (this.config.botCount > 0) {
                this.botManager.spawnBots(this.config.botCount, this.config.difficulty);
            }
            
            // Start match
            this.startMatch();
            
            // Event listeners
            window.addEventListener('resize', () => this.onResize());
            
            this.running = true;
            this.animate();
            
            console.log('[Game] Started successfully');
        } catch (error) {
            console.error('[Game] Failed to start:', error);
        }
    }

    initRenderer() {
        const settings = this.app.getStorageManager().getSettings();
        
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: settings.shadows,
            powerPreference: 'high-performance',
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = settings.shadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        this.onResize();
    }

    initScene() {
        this.scene = new THREE.Scene();
    }

    initCamera() {
        const settings = this.app.getStorageManager().getSettings();
        this.camera = new THREE.PerspectiveCamera(
            settings.fov,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 2, 0);
    }

    initLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);
        
        // Directional light (sun)
        const sun = new THREE.DirectionalLight(0xffffff, 1.0);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 200;
        sun.shadow.camera.left = -50;
        sun.shadow.camera.right = 50;
        sun.shadow.camera.top = 50;
        sun.shadow.camera.bottom = -50;
        this.scene.add(sun);
        
        // Hemisphere light for sky/ground color variation
        const hemi = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.3);
        this.scene.add(hemi);
    }

    async loadMap(mapId) {
        const MapBuilder = this.mapBuilders[mapId];
        if (!MapBuilder) {
            console.error('[Game] Unknown map:', mapId);
            return;
        }
        
        this.currentMap = new MapBuilder(this.scene);
        await this.currentMap.build();
    }

    spawnPlayer(player) {
        const spawnPoint = this.currentMap.getRandomSpawnPoint();
        player.spawn(spawnPoint);
        this.scene.add(player.mesh);
    }

    startMatch() {
        this.matchTime = this.config.timeLimit || 0;
        this.scores = { alpha: 0, bravo: 0 };
        this.updateHUD();
    }

    animate() {
        if (!this.running) return;
        
        requestAnimationFrame(() => this.animate());
        
        const delta = Math.min(this.clock.getDelta(), 0.1);
        
        if (!this.paused) {
            this.update(delta);
            this.render();
        }
    }

    update(delta) {
        // Update match timer
        if (this.config.timeLimit > 0) {
            this.matchTime -= delta;
            if (this.matchTime <= 0) {
                this.endMatch();
                return;
            }
        }
        
        // Update systems
        this.inputHandler.update(delta);
        this.player.update(delta);
        this.weaponSystem.update(delta);
        this.botManager.update(delta);
        
        // Check win condition
        this.checkWinCondition();
        
        // Update HUD
        this.updateHUD();
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    updateHUD() {
        const hud = this.app.getUIManager();
        
        // Timer
        if (this.config.timeLimit > 0) {
            const minutes = Math.floor(this.matchTime / 60);
            const seconds = Math.floor(this.matchTime % 60);
            document.getElementById('hudTimer').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Health
        document.getElementById('hudHealthFill').style.width = `${this.player.health}%`;
        document.getElementById('hudHealthText').textContent = Math.ceil(this.player.health);
        
        // Ammo
        const weapon = this.weaponManager.getCurrentWeapon();
        if (weapon) {
            document.getElementById('hudAmmoCurrent').textContent = weapon.ammo;
            document.getElementById('hudAmmoReserve').textContent = weapon.reserveAmmo;
        }
        
        // Score
        document.getElementById('hudScore').textContent = this.player.score;
        document.getElementById('hudKD').textContent = `${this.player.kills}/${this.player.deaths}`;
    }

    checkWinCondition() {
        if (this.config.scoreLimit > 0 && this.player.score >= this.config.scoreLimit) {
            this.endMatch();
        }
    }

    endMatch() {
        this.running = false;
        
        const won = this.player.score >= (this.config.scoreLimit || 0) ||
                    (this.config.timeLimit > 0 && this.player.score > this.botManager.getTotalKills());
        
        // Record match stats
        const storage = this.app.getStorageManager();
        storage.recordMatch(
            this.player.kills,
            this.player.deaths,
            this.player.headshots,
            this.player.shotsFired,
            this.player.shotsHit,
            won
        );
        
        // Calculate XP
        const xp = this.calculateXP(won);
        const result = storage.addXP(xp);
        
        // Show level up if applicable
        if (result.leveledUp) {
            const reward = storage.unlockLevelRewards(result.newLevel);
            this.app.getUIManager().showLevelUp(result.newLevel - 1, result.newLevel, reward?.id);
        }
        
        // Update missions
        storage.updateMissionProgress('daily', 'kills', this.player.kills);
        storage.updateMissionProgress('daily', 'headshots', this.player.headshots);
        storage.updateMissionProgress('daily', 'matches', 1);
        
        // Show match end screen
        const accuracy = this.player.shotsFired > 0 
            ? Math.round((this.player.shotsHit / this.player.shotsFired) * 100) 
            : 0;
        
        this.app.getUIManager().showMatchEnd({
            won,
            kills: this.player.kills,
            deaths: this.player.deaths,
            headshots: this.player.headshots,
            accuracy,
            xp,
        });
        
        // Return to menu after delay
        setTimeout(() => {
            this.destroy();
            document.getElementById('gameHUD').classList.add('hidden');
        }, 3000);
    }

    calculateXP(won) {
        let xp = 50; // Base participation
        xp += this.player.kills * 100;
        xp += this.player.headshots * 50;
        if (won) xp += 500;
        return xp;
    }

    onResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    destroy() {
        this.running = false;
        
        if (this.player) {
            this.scene.remove(this.player.mesh);
            this.player.dispose();
        }
        
        if (this.currentMap) {
            this.currentMap.dispose();
        }
        
        this.renderer.dispose();
        
        console.log('[Game] Destroyed');
    }
}
