// ONEBULLET - Main Entry Point
import { Game } from './game/Game.js';
import { UIManager } from './ui/UIManager.js';
import { AudioManager } from './core/audio/AudioManager.js';
import { StorageManager } from './core/storage/StorageManager.js';

class OneBulletApp {
    constructor() {
        this.game = null;
        this.uiManager = null;
        this.audioManager = null;
        this.storageManager = null;
        this.initialized = false;
    }

    async init() {
        try {
            console.log('[ONEBULLET] Initializing...');
            
            // Initialize storage manager first
            this.storageManager = new StorageManager();
            await this.storageManager.load();
            
            // Initialize audio manager
            this.audioManager = new AudioManager();
            await this.audioManager.init();
            
            // Initialize UI manager
            this.uiManager = new UIManager(this);
            await this.uiManager.init();
            
            // Update player info display
            this.updatePlayerInfo();
            
            this.initialized = true;
            console.log('[ONEBULLET] Initialization complete');
            
        } catch (error) {
            console.error('[ONEBULLET] Initialization failed:', error);
            this.showError('Failed to initialize game. Please refresh the page.');
        }
    }

    updatePlayerInfo() {
        const profile = this.storageManager.getProfile();
        
        document.getElementById('menuPlayerName').textContent = profile.displayName || 'Operative';
        document.getElementById('menuPlayerLevel').textContent = `Level ${profile.level}`;
        
        const xpRequired = this.getXPForLevel(profile.level);
        const xpProgress = (profile.xp / xpRequired) * 100;
        document.getElementById('menuXPFill').style.width = `${Math.min(xpProgress, 100)}%`;
    }

    getXPForLevel(level) {
        return Math.floor(100 * Math.pow(1.15, level - 1));
    }

    showError(message) {
        alert(message);
    }

    startLocalMatch(config) {
        if (this.game) {
            this.game.destroy();
        }
        
        this.game = new Game(this, config);
        this.game.start();
    }

    startOnlineMatch(roomId) {
        if (this.game) {
            this.game.destroy();
        }
        
        // Will be implemented with networking
        console.log('Starting online match in room:', roomId);
    }

    getStorageManager() {
        return this.storageManager;
    }

    getAudioManager() {
        return this.audioManager;
    }

    getUIManager() {
        return this.uiManager;
    }
}

// Create global app instance
window.onebullet = new OneBulletApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.onebullet.init());
} else {
    window.onebullet.init();
}
