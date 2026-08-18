// Player state structure
import { TEAMS } from './constants.js';

export function createPlayerState(id = null) {
    return {
        id: id || crypto.randomUUID(),
        position: { x: 0, y: 1.8, z: 0 },
        rotation: { x: 0, y: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        health: 100,
        alive: true,
        team: TEAMS.NONE,
        weapon: 'sniper',
        ammo: 5,
        reserveAmmo: 30,
        score: 0,
        kills: 0,
        deaths: 0,
        headshots: 0,
        shotsFired: 0,
        shotsHit: 0,
        level: 1,
        xp: 0,
        displayName: 'Player',
        isBot: false,
        lastUpdateTime: Date.now(),
    };
}

export function serializePlayerState(state) {
    return {
        id: state.id,
        position: { ...state.position },
        rotation: { ...state.rotation },
        health: state.health,
        alive: state.alive,
        team: state.team,
        score: state.score,
        kills: state.kills,
        deaths: state.deaths,
        displayName: state.displayName,
        isBot: state.isBot,
    };
}

export function deserializePlayerState(data) {
    const state = createPlayerState(data.id);
    if (data.position) state.position = { ...data.position };
    if (data.rotation) state.rotation = { ...data.rotation };
    if (data.health !== undefined) state.health = data.health;
    if (data.alive !== undefined) state.alive = data.alive;
    if (data.team !== undefined) state.team = data.team;
    if (data.score !== undefined) state.score = data.score;
    if (data.kills !== undefined) state.kills = data.kills;
    if (data.deaths !== undefined) state.deaths = data.deaths;
    if (data.displayName) state.displayName = data.displayName;
    if (data.isBot !== undefined) state.isBot = data.isBot;
    return state;
}
