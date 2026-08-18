// Network protocol definitions for ONEBULLET
export const PROTOCOL = {
    // Connection
    CONNECT: 'connect',
    WELCOME: 'welcome',
    CONNECTED: 'connected',
export const MESSAGE_TYPES = {
    // Connection
    CONNECT: 'connect',
    WELCOME: 'welcome',
    DISCONNECT: 'disconnect',
    
    // Player
    PLAYER_JOIN: 'playerJoin',
    PLAYER_LEAVE: 'playerLeave',
    PLAYER_STATE: 'playerState',
    PLAYER_SNAPSHOT: 'playerSnapshot',
    
    // Input
    INPUT: 'input',
    
    // Combat
    SHOOT: 'shoot',
    SHOT_RESULT: 'shotResult',
    DAMAGE: 'damage',
    ELIMINATION: 'elimination',
    
    // Match
    MATCH_STATE: 'matchState',
    MATCH_STARTING: 'matchStarting',
    MATCH_STARTED: 'matchStarted',
    MATCH_END: 'matchEnd',
    MATCH_ENDED: 'matchEnded',
    MATCH_START: 'matchStart',
    MATCH_END: 'matchEnd',
    
    // Score
    SCORE_UPDATE: 'scoreUpdate',
    
    // Network
    PING: 'ping',
    PONG: 'pong',
    
    // Chat
    CHAT_MESSAGE: 'chatMessage',
    
    // Lobby & Rooms
    LOBBY_STATE: 'lobbyState',
    ROOM_CREATE: 'roomCreate',
    ROOM_CREATED: 'roomCreated',
    // Lobby
    LOBBY_STATE: 'lobbyState',
    ROOM_CREATE: 'roomCreate',
    ROOM_JOIN: 'roomJoin',
    ROOM_LEAVE: 'roomLeave',
    ROOM_READY: 'roomReady',
    ROOM_START: 'roomStart',
    ROOM_CONFIG: 'roomConfig',
    ROOM_CLOSED: 'roomClosed',
    HOST_CHANGED: 'hostChanged',
    
    // Progression
    XP_UPDATE: 'xpUpdate',
    LEVEL_UP: 'levelUp',
    UNLOCK: 'unlock',
    
    // Loadout
    LOADOUT_UPDATE: 'loadoutUpdate',
    
    // Errors
    ERROR: 'error',
};

export const MESSAGE_TYPES = PROTOCOL; // Backwards compatibility

};

export function createMessage(type, data = {}) {
    return {
        type,
        data,
        timestamp: Date.now(),
    };
}

export function parseMessage(raw) {
    try {
        const msg = JSON.parse(raw);
        if (!msg.type || !MESSAGE_TYPES.hasOwnProperty(msg.type.toUpperCase().replace(/_/g, ''))) {
            return null;
        }
        return msg;
    } catch (e) {
        return null;
    }
}
