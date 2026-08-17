// Audio Manager - Handles all game audio
export class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.sounds = new Map();
        this.initialized = false;
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0.8;

            this.musicGain = this.audioContext.createGain();
            this.musicGain.connect(this.masterGain);
            this.musicGain.gain.value = 0.5;

            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.connect(this.masterGain);
            this.sfxGain.gain.value = 0.8;

            // Generate procedural sounds
            this.generateSounds();
            
            this.initialized = true;
            console.log('[AudioManager] Initialized');
        } catch (error) {
            console.warn('[AudioManager] Audio initialization failed:', error);
        }
    }

    generateSounds() {
        // Generate synthesized sound effects
        this.sounds.set('shoot', this.createShootSound());
        this.sounds.set('bolt', this.createBoltSound());
        this.sounds.set('reload', this.createReloadSound());
        this.sounds.set('hit', this.createHitSound());
        this.sounds.set('elimination', this.createEliminationSound());
        this.sounds.set('headshot', this.createHeadshotSound());
        this.sounds.set('footstep', this.createFootstepSound());
        this.sounds.set('jump', this.createJumpSound());
        this.sounds.set('uiClick', this.createUIClickSound());
        this.sounds.set('uiHover', this.createUIHoverSound());
        this.sounds.set('levelUp', this.createLevelUpSound());
    }

    createShootSound() {
        return () => {
            if (!this.initialized) return;
            const t = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            const noise = this.createNoiseBuffer();
            const noiseNode = this.audioContext.createBufferSource();
            noiseNode.buffer = noise;
            
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(3000, t);
            filter.frequency.exponentialRampToValueAtTime(500, t + 0.15);

            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.5, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

            noiseNode.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);
            noiseNode.start(t);
            noiseNode.stop(t + 0.2);
        };
    }

    createBoltSound() {
        return () => {
            if (!this.initialized) return;
            const t = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, t);
            
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.1);
        };
    }

    createReloadSound() {
        return () => {
            if (!this.initialized) return;
            const t = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.linearRampToValueAtTime(600, t + 0.1);
            
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.3);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.3);
        };
    }

    createHitSound() {
        return () => {
            if (!this.initialized) return;
            const t = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(800, t);
            
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.1);
        };
    }

    createEliminationSound() {
        return () => {
            if (!this.initialized) return;
            const t = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);
            
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.3);
        };
    }

    createHeadshotSound() {
        return () => {
            if (!this.initialized) return;
            const t = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, t);
            
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.15);
        };
    }

    createFootstepSound() {
        return () => {
            if (!this.initialized) return;
            const t = this.audioContext.currentTime;
            const noise = this.createNoiseBuffer();
            const noiseNode = this.audioContext.createBufferSource();
            noiseNode.buffer = noise;
            
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 500;

            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

            noiseNode.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);
            noiseNode.start(t);
            noiseNode.stop(t + 0.05);
        };
    }

    createJumpSound() {
        return () => {
            if (!this.initialized) return;
            const t = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.linearRampToValueAtTime(400, t + 0.1);
            
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.linearRampToValueAtTime(0, t + 0.15);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.15);
        };
    }

    createUIClickSound() {
        return () => {
            if (!this.initialized) return;
            const t = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, t);
            
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.1, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.05);
        };
    }

    createUIHoverSound() {
        return () => {
            if (!this.initialized) return;
            const t = this.audioContext.currentTime;
            const osc = this.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, t);
            
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.03);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + 0.03);
        };
    }

    createLevelUpSound() {
        return () => {
            if (!this.initialized) return;
            const t = this.audioContext.currentTime;
            
            [0, 0.1, 0.2].forEach((offset, i) => {
                const osc = this.audioContext.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523 + i * 131, t + offset);
                
                const gain = this.audioContext.createGain();
                gain.gain.setValueAtTime(0.2, t + offset);
                gain.gain.exponentialRampToValueAtTime(0.01, t + offset + 0.3);

                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(t + offset);
                osc.stop(t + offset + 0.3);
            });
        };
    }

    createNoiseBuffer() {
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    play(soundName) {
        const sound = this.sounds.get(soundName);
        if (sound) {
            sound();
        }
    }

    setMasterVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.value = value / 100;
        }
    }

    setMusicVolume(value) {
        if (this.musicGain) {
            this.musicGain.gain.value = value / 100;
        }
    }

    setSFXVolume(value) {
        if (this.sfxGain) {
            this.sfxGain.gain.value = value / 100;
        }
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}
