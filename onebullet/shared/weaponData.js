// Weapon data definitions
import { CONSTANTS } from './constants.js';

export const WEAPONS = {
    sniper: {
        id: 'sniper',
        name: 'ONEBULLET',
        type: 'sniper',
        damage: {
            head: CONSTANTS.DAMAGE_HEADSHOT,
            body: CONSTANTS.DAMAGE_BODY,
            limb: CONSTANTS.DAMAGE_LIMB,
        },
        fireCooldown: CONSTANTS.FIRE_COOLDOWN,
        reloadTime: CONSTANTS.RELOAD_TIME,
        boltTime: CONSTANTS.BOLT_TIME,
        ammo: 5,
        maxAmmo: 5,
        reserveAmmo: 30,
        scopeFOV: CONSTANTS.SCOPE_FOV,
        recoil: {
            horizontal: 0.02,
            vertical: 0.15,
            recovery: 0.5,
        },
        sway: {
            amplitude: 0.001,
            frequency: 1.5,
        },
        bob: {
            amplitude: 0.02,
            frequency: 8,
        },
    },
};

export const SKINS = {
    weapons: {
        default: {
            id: 'default',
            name: 'Standard Issue',
            rarity: 'common',
            description: 'Standard military finish',
            colors: { primary: '#2a2a2a', secondary: '#4a4a4a', accent: '#6a6a6a' },
        },
        desertCamo: {
            id: 'desertCamo',
            name: 'Desert Camo',
            rarity: 'uncommon',
            description: 'Sand-colored tactical coating',
            colors: { primary: '#c2b280', secondary: '#8b7355', accent: '#d4c59a' },
        },
        nightOps: {
            id: 'nightOps',
            name: 'Night Ops',
            rarity: 'rare',
            description: 'Matte black for stealth operations',
            colors: { primary: '#1a1a1a', secondary: '#0a0a0a', accent: '#333333' },
        },
        arctic: {
            id: 'arctic',
            name: 'Arctic',
            rarity: 'rare',
            description: 'White winter camouflage',
            colors: { primary: '#e8e8e8', secondary: '#c0c0c0', accent: '#ffffff' },
        },
        carbon: {
            id: 'carbon',
            name: 'Carbon Fiber',
            rarity: 'epic',
            description: 'Lightweight carbon weave pattern',
            colors: { primary: '#1a1a1a', secondary: '#2a2a2a', accent: '#404040' },
        },
        neonCircuit: {
            id: 'neonCircuit',
            name: 'Neon Circuit',
            rarity: 'legendary',
            description: 'Glowing circuit patterns',
            colors: { primary: '#0a0a1a', secondary: '#1a0a2a', accent: '#00ffff' },
        },
        rust: {
            id: 'rust',
            name: 'Rusted Veteran',
            rarity: 'uncommon',
            description: 'Weathered and battle-worn',
            colors: { primary: '#8b4513', secondary: '#654321', accent: '#a0522d' },
        },
        ghost: {
            id: 'ghost',
            name: 'Ghost',
            rarity: 'epic',
            description: 'Ethereal translucent finish',
            colors: { primary: '#f0f0f0', secondary: '#d0d0d0', accent: '#ffffff' },
        },
        urban: {
            id: 'urban',
            name: 'Urban',
            rarity: 'common',
            description: 'City gray tactical',
            colors: { primary: '#5a5a5a', secondary: '#404040', accent: '#707070' },
        },
        sandstorm: {
            id: 'sandstorm',
            name: 'Sandstorm',
            rarity: 'rare',
            description: 'Desert storm inspired',
            colors: { primary: '#d2b48c', secondary: '#a0826d', accent: '#e8d5b7' },
        },
        void: {
            id: 'void',
            name: 'Void',
            rarity: 'legendary',
            description: 'Absorbs all light',
            colors: { primary: '#000000', secondary: '#0a0a0a', accent: '#1a0a1a' },
        },
    },
    players: {
        default: {
            id: 'default',
            name: 'Standard Operative',
            rarity: 'common',
            description: 'Basic tactical gear',
            colors: { primary: '#4a5a4a', secondary: '#3a4a3a', accent: '#5a6a5a' },
        },
        alpha: {
            id: 'alpha',
            name: 'Alpha Squad',
            rarity: 'uncommon',
            description: 'Elite unit markings',
            colors: { primary: '#3a4a5a', secondary: '#2a3a4a', accent: '#4a5a6a' },
        },
        bravo: {
            id: 'bravo',
            name: 'Bravo Team',
            rarity: 'uncommon',
            description: 'Special forces insignia',
            colors: { primary: '#5a4a3a', secondary: '#4a3a2a', accent: '#6a5a4a' },
        },
        specter: {
            id: 'specter',
            name: 'Specter',
            rarity: 'rare',
            description: 'Phantom operative',
            colors: { primary: '#2a2a3a', secondary: '#1a1a2a', accent: '#3a3a4a' },
        },
        viper: {
            id: 'viper',
            name: 'Viper',
            rarity: 'epic',
            description: 'Venomous striker',
            colors: { primary: '#1a3a1a', secondary: '#0a2a0a', accent: '#2a4a2a' },
        },
        phoenix: {
            id: 'phoenix',
            name: 'Phoenix',
            rarity: 'legendary',
            description: 'Risen from ashes',
            colors: { primary: '#5a2a2a', secondary: '#3a1a1a', accent: '#7a3a3a' },
        },
    },
};

export const CROSSHAIRS = {
    dot: { id: 'dot', name: 'Dot', type: 'dot' },
    circle: { id: 'circle', name: 'Circle', type: 'circle' },
    cross: { id: 'cross', name: 'Cross', type: 'cross' },
    sniper: { id: 'sniper', name: 'Sniper', type: 'sniper' },
    chevron: { id: 'chevron', name: 'Chevron', type: 'chevron' },
};

export const BANNERS = {
    recruit: { id: 'recruit', name: 'Recruit', rarity: 'common' },
    operative: { id: 'operative', name: 'Operative', rarity: 'uncommon' },
    veteran: { id: 'veteran', name: 'Veteran', rarity: 'rare' },
    elite: { id: 'elite', name: 'Elite', rarity: 'epic' },
    legend: { id: 'legend', name: 'Legend', rarity: 'legendary' },
    sharpshooter: { id: 'sharpshooter', name: 'Sharpshooter', rarity: 'epic' },
    headhunter: { id: 'headhunter', name: 'Headhunter', rarity: 'legendary' },
};

export const CHARMS = {
    none: { id: 'none', name: 'None', rarity: 'common' },
    dogtag: { id: 'dogtag', name: 'Dog Tag', rarity: 'common' },
    coin: { id: 'coin', name: 'Lucky Coin', rarity: 'uncommon' },
    feather: { id: 'feather', name: 'Eagle Feather', rarity: 'rare' },
    skull: { id: 'skull', name: 'Skull Charm', rarity: 'epic' },
    dragon: { id: 'dragon', name: 'Dragon Tooth', rarity: 'legendary' },
};

export const EMOTES = {
    none: { id: 'none', name: 'None' },
    wave: { id: 'wave', name: 'Wave' },
    salute: { id: 'salute', name: 'Salute' },
    taunt: { id: 'taunt', name: 'Taunt' },
    celebrate: { id: 'celebrate', name: 'Celebrate' },
};
