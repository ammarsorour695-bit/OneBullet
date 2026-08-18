// Shared constants for ONEBULLET
export const CONSTANTS = {
    // Player
    PLAYER_HEIGHT: 1.8,
    PLAYER_RADIUS: 0.5,
    MOVE_SPEED: 6,
    SPRINT_MULTIPLIER: 1.6,
    CROUCH_MULTIPLIER: 0.5,
    JUMP_FORCE: 8,
    GRAVITY: 20,
    
    // Weapon
    DAMAGE_HEADSHOT: 100,
    DAMAGE_BODY: 100,
    DAMAGE_LIMB: 80,
    FIRE_COOLDOWN: 1.5,
    RELOAD_TIME: 2.5,
    BOLT_TIME: 0.8,
    SCOPE_FOV: 20,
    DEFAULT_FOV: 75,
    
    // Game
    MATCH_TIME_LIMIT: 600,
    SCORE_LIMIT: 20,
    MAX_PLAYERS: 12,
    
    // Network
    TICK_RATE: 60,
    SNAPSHOT_RATE: 20,
    INTERPOLATION_DELAY: 100,
    
    // Hitboxes
    HITBOX_HEAD: 'head',
    HITBOX_BODY: 'body',
    HITBOX_LEFT_ARM: 'left_arm',
    HITBOX_RIGHT_ARM: 'right_arm',
    HITBOX_LEFT_LEG: 'left_leg',
    HITBOX_RIGHT_LEG: 'right_leg',
    
    // Weapon states
    WEAPON_STATE_IDLE: 'idle',
    WEAPON_STATE_AIMING: 'aiming',
    WEAPON_STATE_FIRING: 'firing',
    WEAPON_STATE_RECOILING: 'recoiling',
    WEAPON_STATE_BOLTING: 'bolting',
    WEAPON_STATE_RELOADING: 'reloading',
    WEAPON_STATE_DISABLED: 'disabled',
    
    // Match states
    MATCH_WAITING: 'waiting',
    MATCH_STARTING: 'starting',
    MATCH_PLAYING: 'playing',
    MATCH_ENDING: 'ending',
    MATCH_CLOSED: 'closed',
    
    // Difficulties
    DIFFICULTY_EASY: 'easy',
    DIFFICULTY_NORMAL: 'normal',
    DIFFICULTY_HARD: 'hard',
    DIFFICULTY_ELITE: 'elite',
    
    // Rarity
    RARITY_COMMON: 'common',
    RARITY_UNCOMMON: 'uncommon',
    RARITY_RARE: 'rare',
    RARITY_EPIC: 'epic',
    RARITY_LEGENDARY: 'legendary',
};

export const GAME_MODES = {
    FREE_FOR_ALL: 'freeForAll',
    TEAM_DEATHMATCH: 'teamDeathmatch',
    ELIMINATION: 'elimination',
    PRACTICE: 'practice',
};

export const TEAMS = {
    NONE: 0,
    ALPHA: 1,
    BRAVO: 2,
};
