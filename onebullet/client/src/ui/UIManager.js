// UI Manager - Handles all UI interactions
export class UIManager {
    constructor(app) {
        this.app = app;
        this.currentScreen = 'mainMenu';
        this.screens = new Map();
    }

    async init() {
        this.setupScreens();
        this.setupEventListeners();
        this.showScreen('mainMenu');
        console.log('[UIManager] Initialized');
    }

    setupScreens() {
        this.screens.set('mainMenu', document.getElementById('mainMenu'));
        this.screens.set('onlineLobby', document.getElementById('onlineLobby'));
        this.screens.set('localSetup', document.getElementById('localSetup'));
        this.screens.set('loadoutScreen', document.getElementById('loadoutScreen'));
        this.screens.set('inventoryScreen', document.getElementById('inventoryScreen'));
        this.screens.set('missionsScreen', document.getElementById('missionsScreen'));
        this.screens.set('profileScreen', document.getElementById('profileScreen'));
        this.screens.set('settingsScreen', document.getElementById('settingsScreen'));
        this.screens.set('matchmakingScreen', document.getElementById('matchmakingScreen'));
        this.screens.set('loadingScreen', document.getElementById('loadingScreen'));
        this.screens.set('gameHUD', document.getElementById('gameHUD'));
        this.screens.set('matchEndScreen', document.getElementById('matchEndScreen'));
    }

    setupEventListeners() {
        // Main menu buttons
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleAction(action);
            });
        });

        // Local setup
        document.getElementById('localBotCount').addEventListener('input', (e) => {
            document.getElementById('localBotCountValue').textContent = e.target.value;
        });

        document.getElementById('localStartBtn').addEventListener('click', () => {
            this.startLocalMatch();
        });

        // Lobby chat
        const chatInput = document.getElementById('lobbyChatInput');
        const chatSend = document.getElementById('lobbyChatSend');
        
        if (chatInput && chatSend) {
            chatSend.addEventListener('click', () => this.sendChatMessage());
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendChatMessage();
            });
        }

        // Settings sliders
        document.querySelectorAll('.settings-section input[type="range"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const setting = e.target.id.replace('setting', '');
                const value = e.target.type === 'checkbox' ? e.target.checked : parseInt(e.target.value);
                this.app.getStorageManager().updateSettings({ [setting.charAt(0).toLowerCase() + setting.slice(1)]: value });
            });
        });
    }

    handleAction(action) {
        const audio = this.app.getAudioManager();
        audio.play('uiClick');

        switch (action) {
            case 'playOnline':
                this.showScreen('matchmakingScreen');
                setTimeout(() => this.showScreen('onlineLobby'), 1500);
                break;
            case 'playLocal':
                this.showScreen('localSetup');
                break;
            case 'loadout':
                this.showScreen('loadoutScreen');
                break;
            case 'skins':
                this.showScreen('inventoryScreen');
                break;
            case 'missions':
                this.showScreen('missionsScreen');
                break;
            case 'profile':
                this.showScreen('profileScreen');
                this.updateProfileDisplay();
                break;
            case 'settings':
                this.showScreen('settingsScreen');
                break;
            case 'backToMenu':
                this.showScreen('mainMenu');
                this.app.updatePlayerInfo();
                break;
        }
    }

    showScreen(screenName) {
        this.screens.forEach((screen, name) => {
            if (screen) {
                screen.classList.toggle('hidden', name !== screenName);
            }
        });
        this.currentScreen = screenName;
    }

    startLocalMatch() {
        const config = {
            map: document.getElementById('localMapSelect').value,
            mode: document.getElementById('localModeSelect').value,
            botCount: parseInt(document.getElementById('localBotCount').value),
            difficulty: document.getElementById('localDifficulty').value,
            timeLimit: parseInt(document.getElementById('localTimeLimit').value),
            scoreLimit: parseInt(document.getElementById('localScoreLimit').value),
        };

        this.showScreen('loadingScreen');
        
        const loadingFill = document.getElementById('loadingFill');
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            loadingFill.style.width = `${progress}%`;
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    this.app.startLocalMatch(config);
                    this.showScreen('gameHUD');
                }, 500);
            }
        }, 100);
    }

    sendChatMessage() {
        const input = document.getElementById('lobbyChatInput');
        const message = input.value.trim();
        if (!message) return;

        const messagesDiv = document.getElementById('lobbyChatMessages');
        const msgEl = document.createElement('div');
        msgEl.className = 'chat-message';
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        msgEl.innerHTML = `<span class="timestamp">[${time}]</span><span class="player-name">${this.app.getStorageManager().getProfile().displayName}:</span> ${message}`;
        messagesDiv.appendChild(msgEl);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        input.value = '';
    }

    updateProfileDisplay() {
        const profile = this.app.getStorageManager().getProfile();
        document.getElementById('profileName').textContent = profile.displayName;
        document.getElementById('profileLevel').textContent = `Level ${profile.level}`;
        document.getElementById('statKills').textContent = profile.totalKills;
        document.getElementById('statDeaths').textContent = profile.totalDeaths;
        document.getElementById('statMatches').textContent = profile.totalMatches;
        document.getElementById('statWins').textContent = profile.totalWins;
        document.getElementById('statHeadshots').textContent = profile.totalHeadshots;
        
        const accuracy = profile.totalShotsFired > 0 
            ? Math.round((profile.totalShotsHit / profile.totalShotsFired) * 100) 
            : 0;
        document.getElementById('statAccuracy').textContent = `${accuracy}%`;
    }

    showMatchEnd(results) {
        document.getElementById('matchEndTitle').textContent = results.won ? 'VICTORY' : 'DEFEAT';
        document.getElementById('matchEndTitle').className = results.won ? 'victory' : 'defeat';
        document.getElementById('endKills').textContent = results.kills;
        document.getElementById('endDeaths').textContent = results.deaths;
        document.getElementById('endHeadshots').textContent = results.headshots;
        document.getElementById('endAccuracy').textContent = `${results.accuracy}%`;
        document.getElementById('endXP').textContent = `+${results.xp}`;
        
        this.showScreen('matchEndScreen');
    }

    showLevelUp(fromLevel, toLevel, reward) {
        document.getElementById('levelUpFrom').textContent = fromLevel;
        document.getElementById('levelUpTo').textContent = toLevel;
        document.getElementById('levelUpReward').textContent = reward ? `+ ${reward} Unlocked!` : '';
        
        const notif = document.getElementById('levelUpNotification');
        notif.classList.remove('hidden');
        this.app.getAudioManager().play('levelUp');
        
        setTimeout(() => {
            notif.classList.add('hidden');
        }, 3000);
    }
}
