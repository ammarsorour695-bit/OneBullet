// Game rules and validation
import { CONSTANTS, GAME_MODES } from './constants.js';

export const GAME_RULES = {
    [GAME_MODES.FREE_FOR_ALL]: {
        name: 'Free For All',
        description: 'Every player for themselves',
        teamsEnabled: false,
        scoreLimit: 20,
        timeLimit: 600,
        winCondition: 'firstToScore',
        respawnEnabled: true,
        respawnTime: 3,
    },
    [GAME_MODES.TEAM_DEATHMATCH]: {
        name: 'Team Deathmatch',
        description: 'Alpha vs Bravo - Most eliminations wins',
        teamsEnabled: true,
        teamCount: 2,
        scoreLimit: 30,
        timeLimit: 600,
        winCondition: 'firstToScore',
        respawnEnabled: true,
        respawnTime: 3,
    },
    [GAME_MODES.ELIMINATION]: {
        name: 'Elimination',
        description: 'One life per round',
        teamsEnabled: false,
        lives: 1,
        roundsToWin: 5,
        timeLimit: 120,
        winCondition: 'lastStanding',
        respawnEnabled: false,
        respawnTime: 0,
    },
    [GAME_MODES.PRACTICE]: {
        name: 'Practice',
        description: 'Train against bots',
        teamsEnabled: false,
        scoreLimit: 0,
        timeLimit: 0,
        winCondition: 'none',
        respawnEnabled: true,
        respawnTime: 1,
    },
};

export function validateShot(shotData, playerState, weaponData) {
    const errors = [];
    
    // Validate ammo
    if (playerState.ammo <= 0) {
        errors.push('no_ammo');
    }
    
    // Validate alive state
    if (!playerState.alive) {
        errors.push('player_dead');
    }
    
    // Validate weapon state (simplified check)
    if (playerState.weapon !== weaponData.id) {
        errors.push('weapon_mismatch');
    }
    
    // Validate fire rate (basic rate limiting)
    const now = Date.now();
    const minFireInterval = 1000 / (60 / weaponData.fireCooldown);
    if (playerState.lastShotTime && (now - playerState.lastShotTime) < minFireInterval * 0.8) {
        errors.push('fire_rate_exceeded');
    }
    
    // Validate shot direction (basic sanity check)
    if (shotData.direction) {
        const dir = shotData.direction;
        const mag = Math.sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
        if (mag < 0.1 || mag > 2) {
            errors.push('invalid_direction');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}

export function validateMovement(inputData, playerState) {
    const errors = [];
    
    // Validate movement speed
    const maxSpeed = CONSTANTS.MOVE_SPEED * CONSTANTS.SPRINT_MULTIPLIER * 1.5;
    if (inputData.velocity) {
        const vel = inputData.velocity;
        const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
        if (speed > maxSpeed) {
            errors.push('speed_exceeded');
        }
    }
    
    // Validate position bounds (map-specific, simplified here)
    if (inputData.position) {
        const pos = inputData.position;
        if (Math.abs(pos.x) > 200 || Math.abs(pos.z) > 200) {
            errors.push('out_of_bounds');
        }
        if (pos.y < -10 || pos.y > 100) {
            errors.push('invalid_height');
        }
    }
    
    return {
        valid: errors.length === 0,
        errors,
    };
}

export function calculateXP(killType, headshot, winner, matchResult) {
    let xp = 0;
    
    // Base elimination XP
    xp += 100;
    
    // Headshot bonus
    if (headshot) {
        xp += 50;
    }
    
    // Kill type bonuses
    if (killType === 'longshot') {
        xp += 25;
    }
    
    // Win bonus
    if (winner) {
        xp += 500;
    }
    
    // Match completion
    if (matchResult === 'victory') {
        xp += 200;
    } else if (matchResult === 'participation') {
        xp += 50;
    }
    
    return xp;
}

export function getLevelRequirement(level) {
    // Exponential XP curve
    return Math.floor(100 * Math.pow(1.15, level - 1));
}

export function getTotalXPForLevel(level) {
    let total = 0;
    for (let i = 1; i < level; i++) {
        total += getLevelRequirement(i);
    }
    return total;
}

export function getLevelFromXP(xp) {
    let level = 1;
    let remaining = xp;
    
    while (remaining >= getLevelRequirement(level)) {
        remaining -= getLevelRequirement(level);
        level++;
        if (level > 100) break; // Max level cap
    }
    
    return { level, remaining };
}
