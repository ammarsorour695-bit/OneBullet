// Storage Manager - Handles localStorage for player data
export class StorageManager {
    constructor() {
        this.profile = null;
        this.settings = null;
        this.inventory = null;
        this.loadout = null;
        this.missions = null;
    }

    async load() {
        // Load profile
        const savedProfile = localStorage.getItem('onebullet_profile');
        if (savedProfile) {
            this.profile = JSON.parse(savedProfile);
        } else {
            this.profile = this.createDefaultProfile();
        }

        // Load settings
        const savedSettings = localStorage.getItem('onebullet_settings');
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
        } else {
            this.settings = this.createDefaultSettings();
        }

        // Load inventory
        const savedInventory = localStorage.getItem('onebullet_inventory');
        if (savedInventory) {
            this.inventory = JSON.parse(savedInventory);
        } else {
            this.inventory = this.createDefaultInventory();
        }

        // Load loadout
        const savedLoadout = localStorage.getItem('onebullet_loadout');
        if (savedLoadout) {
            this.loadout = JSON.parse(savedLoadout);
        } else {
            this.loadout = this.createDefaultLoadout();
        }

        // Load missions
        const savedMissions = localStorage.getItem('onebullet_missions');
        if (savedMissions) {
            this.missions = JSON.parse(savedMissions);
        } else {
            this.missions = this.createDailyMissions();
        }

        console.log('[StorageManager] Data loaded');
    }

    save() {
        localStorage.setItem('onebullet_profile', JSON.stringify(this.profile));
        localStorage.setItem('onebullet_settings', JSON.stringify(this.settings));
        localStorage.setItem('onebullet_inventory', JSON.stringify(this.inventory));
        localStorage.setItem('onebullet_loadout', JSON.stringify(this.loadout));
        localStorage.setItem('onebullet_missions', JSON.stringify(this.missions));
    }

    createDefaultProfile() {
        return {
            displayName: 'Operative',
            level: 1,
            xp: 0,
            totalKills: 0,
            totalDeaths: 0,
            totalMatches: 0,
            totalWins: 0,
            totalHeadshots: 0,
            totalShotsFired: 0,
            totalShotsHit: 0,
            favoriteWeapon: 'sniper',
            favoriteMap: 'desertOutpost',
            createdAt: Date.now(),
            lastPlayed: Date.now(),
        };
    }

    createDefaultSettings() {
        return {
            sensitivity: 50,
            fov: 75,
            shadows: true,
            particles: true,
            masterVolume: 80,
            musicVolume: 50,
            sfxVolume: 80,
            autoReload: true,
            hitMarkers: true,
            crosshair: 'dot',
        };
    }

    createDefaultInventory() {
        return {
            weaponSkins: ['default'],
            playerSkins: ['default'],
            charms: ['none'],
            banners: ['recruit'],
            crosshairs: ['dot', 'circle', 'cross', 'sniper', 'chevron'],
            emotes: ['none'],
        };
    }

    createDefaultLoadout() {
        return {
            weaponSkin: 'default',
            playerSkin: 'default',
            charm: 'none',
            banner: 'recruit',
            crosshair: 'dot',
            emote: 'none',
        };
    }

    createDailyMissions() {
        const missions = [
            {
                id: 'daily_1',
                type: 'daily',
                name: 'First Blood',
                description: 'Get 3 eliminations',
                target: 3,
                progress: 0,
                completed: false,
                reward: { type: 'xp', amount: 100 },
                expiresAt: this.getEndOfDay(),
            },
            {
                id: 'daily_2',
                type: 'daily',
                name: 'Sharpshooter',
                description: 'Get 2 headshots',
                target: 2,
                progress: 0,
                completed: false,
                reward: { type: 'xp', amount: 150 },
                expiresAt: this.getEndOfDay(),
            },
            {
                id: 'daily_3',
                type: 'daily',
                name: 'Participation',
                description: 'Play 2 matches',
                target: 2,
                progress: 0,
                completed: false,
                reward: { type: 'xp', amount: 75 },
                expiresAt: this.getEndOfDay(),
            },
        ];
        return { daily: missions, weekly: [] };
    }

    getEndOfDay() {
        const now = new Date();
        now.setHours(23, 59, 59, 999);
        return now.getTime();
    }

    // Getters
    getProfile() {
        return this.profile;
    }

    getSettings() {
        return this.settings;
    }

    getInventory() {
        return this.inventory;
    }

    getLoadout() {
        return this.loadout;
    }

    getMissions() {
        return this.missions;
    }

    // Update methods
    updateProfile(updates) {
        Object.assign(this.profile, updates);
        this.save();
    }

    updateSettings(updates) {
        Object.assign(this.settings, updates);
        this.save();
    }

    addXP(amount) {
        this.profile.xp += amount;
        
        // Check for level up
        const xpRequired = Math.floor(100 * Math.pow(1.15, this.profile.level - 1));
        let leveledUp = false;
        let newLevel = this.profile.level;
        
        while (this.profile.xp >= xpRequired) {
            this.profile.xp -= xpRequired;
            newLevel++;
            leveledUp = true;
        }
        
        if (leveledUp) {
            this.profile.level = newLevel;
            // Unlock rewards for new level
            this.unlockLevelRewards(newLevel);
        }
        
        this.save();
        return { leveledUp, newLevel: leveledUp ? newLevel : null };
    }

    unlockLevelRewards(level) {
        // Unlock skins at certain levels
        const unlocks = {
            2: { type: 'weaponSkin', id: 'urban' },
            3: { type: 'weaponSkin', id: 'desertCamo' },
            5: { type: 'playerSkin', id: 'alpha' },
            7: { type: 'weaponSkin', id: 'nightOps' },
            10: { type: 'playerSkin', id: 'specter' },
            15: { type: 'weaponSkin', id: 'arctic' },
            20: { type: 'playerSkin', id: 'viper' },
            25: { type: 'weaponSkin', id: 'carbon' },
            30: { type: 'playerSkin', id: 'phoenix' },
            40: { type: 'weaponSkin', id: 'ghost' },
            50: { type: 'weaponSkin', id: 'neonCircuit' },
        };

        if (unlocks[level]) {
            const unlock = unlocks[level];
            const collection = this.inventory[unlock.type + 's'];
            if (!collection.includes(unlock.id)) {
                collection.push(unlock.id);
                this.save();
                return unlock;
            }
        }
        return null;
    }

    recordMatch(kills, deaths, headshots, shotsFired, shotsHit, won) {
        this.profile.totalMatches++;
        this.profile.totalKills += kills;
        this.profile.totalDeaths += deaths;
        this.profile.totalHeadshots += headshots;
        this.profile.totalShotsFired += shotsFired;
        this.profile.totalShotsHit += shotsHit;
        
        if (won) {
            this.profile.totalWins++;
        }
        
        this.profile.lastPlayed = Date.now();
        this.save();
    }

    updateMissionProgress(missionType, stat, amount) {
        const missions = this.missions[missionType];
        if (!missions) return;

        missions.forEach(mission => {
            if (mission.completed) return;
            
            let match = false;
            if (stat === 'kills' && mission.description.includes('elimination')) match = true;
            if (stat === 'headshots' && mission.description.includes('headshot')) match = true;
            if (stat === 'matches' && mission.description.includes('match')) match = true;
            
            if (match) {
                mission.progress = Math.min(mission.progress + amount, mission.target);
                if (mission.progress >= mission.target) {
                    mission.completed = true;
                    // Grant reward
                    if (mission.reward.type === 'xp') {
                        this.addXP(mission.reward.amount);
                    }
                }
            }
        });
        
        this.save();
    }

    hasItem(type, id) {
        const collection = this.inventory[type + 's'];
        return collection && collection.includes(id);
    }

    equipItem(type, id) {
        if (!this.hasItem(type, id)) return false;
        
        switch (type) {
            case 'weaponSkin':
                this.loadout.weaponSkin = id;
                break;
            case 'playerSkin':
                this.loadout.playerSkin = id;
                break;
            case 'charm':
                this.loadout.charm = id;
                break;
            case 'banner':
                this.loadout.banner = id;
                break;
            case 'crosshair':
                this.loadout.crosshair = id;
                break;
            case 'emote':
                this.loadout.emote = id;
                break;
        }
        
        this.save();
        return true;
    }
}
