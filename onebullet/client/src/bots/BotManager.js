// Bot Manager - Handles AI bots
import { BotPlayer } from './BotPlayer.js';

export class BotManager {
    constructor(game) {
        this.game = game;
        this.bots = [];
        this.difficultySettings = {
            easy: { accuracy: 0.3, reactionTime: 1.5, moveSpeed: 0.7 },
            normal: { accuracy: 0.5, reactionTime: 0.8, moveSpeed: 1.0 },
            hard: { accuracy: 0.7, reactionTime: 0.4, moveSpeed: 1.2 },
            elite: { accuracy: 0.85, reactionTime: 0.2, moveSpeed: 1.3 },
        };
    }

    spawnBots(count, difficulty = 'normal') {
        const settings = this.difficultySettings[difficulty];
        
        for (let i = 0; i < count; i++) {
            const bot = new BotPlayer(this.game, settings);
            const spawnPoint = this.game.currentMap.getRandomSpawnPoint();
            bot.spawn(spawnPoint);
            this.game.scene.add(bot.mesh);
            this.bots.push(bot);
        }
    }

    update(delta) {
        this.bots.forEach(bot => {
            if (bot.alive) {
                bot.update(delta);
            }
        });
    }

    getTotalKills() {
        return this.bots.reduce((sum, bot) => sum + bot.kills, 0);
    }

    dispose() {
        this.bots.forEach(bot => {
            this.game.scene.remove(bot.mesh);
            bot.dispose();
        });
        this.bots = [];
    }
}
