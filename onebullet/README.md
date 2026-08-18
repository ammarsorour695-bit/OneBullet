# ONEBULLET - Tactical Sniper Arena

A complete browser-based FPS featuring one-shot sniper combat with both local and online multiplayer modes.

## Features

### Core Gameplay
- **One-Shot Combat**: Every shot counts - headshots and body shots are lethal
- **Precision Sniping**: Bolt-action sniper rifle with realistic mechanics
- **Multiple Game Modes**: Free For All, Team Deathmatch, Elimination, Practice
- **Skill-Based Movement**: Sprint, crouch, jump with physics-based controls

### Maps (4 Unique Environments)
1. **Desert Outpost** - Sandy military base with watchtowers and bunkers
2. **Industrial Yard** - Urban industrial complex with containers and cranes
3. **Mountain Base** - Elevated terrain with long sightlines
4. **City Rooftops** - Vertical urban warfare environment

### Online Multiplayer
- **Authoritative Server**: Server-side hit detection and anti-cheat
- **Real-Time Networking**: WebSocket-based with interpolation and prediction
- **Room System**: Create private rooms or join public matches
- **Matchmaking**: Automatic queue system for finding games
- **Lobby Chat**: Communicate with players before matches

### Progression System
- **50 Levels**: Earn XP through gameplay to level up
- **Unlockable Skins**: 11 weapon skins and 6 player skins
- **Cosmetic Customization**: Crosshairs, charms, banners, emotes
- **Daily Missions**: Complete challenges for bonus XP
- **Statistics Tracking**: Comprehensive career stats

### Bot AI (Local Mode)
- **4 Difficulty Levels**: Easy, Normal, Hard, Elite
- **Smart Behavior**: Patrol, search, take cover, relocate
- **Perception System**: Bots react to shots and player presence

### Polish & Quality of Life
- **Responsive UI**: Clean, modern interface with animations
- **Audio System**: Full sound effects and ambient audio
- **Visual Effects**: Muzzle flash, bullet trails, hit markers
- **Settings**: Sensitivity, FOV, graphics quality options
- **Save System**: Persistent progression via localStorage

## Project Structure

```
onebullet/
├── client/                 # Frontend game client
│   ├── index.html         # Main HTML file
│   ├── src/
│   │   ├── main.js        # Application entry point
│   │   ├── game/          # Game session classes
│   │   │   ├── Game.js           # Local game session
│   │   │   └── OnlineGameSession.js
│   │   ├── player/        # Player entities
│   │   │   └── Player.js
│   │   ├── weapons/       # Weapon systems
│   │   │   ├── WeaponManager.js
│   │   │   └── SniperRifle.js
│   │   ├── bots/          # Bot AI
│   │   │   ├── BotManager.js
│   │   │   └── BotPlayer.js
│   │   ├── maps/          # Map definitions
│   │   │   ├── DesertOutpostMap.js
│   │   │   ├── IndustrialYardMap.js
│   │   │   ├── MountainBaseMap.js
│   │   │   └── CityRooftopsMap.js
│   │   ├── networking/    # Online multiplayer
│   │   │   └── NetworkClient.js
│   │   ├── ui/            # User interface
│   │   │   └── UIManager.js
│   │   └── core/          # Core systems
│   │       ├── input/     # Input handling
│   │       ├── audio/     # Audio management
│   │       ├── storage/   # Save system
│   │       ├── engine/    # Game engine
│   │       ├── renderer/  # Three.js rendering
│   │       ├── camera/    # Camera control
│   │       └── effects/   # Visual effects
│   └── styles/            # CSS stylesheets
│       ├── main.css
│       ├── menu.css
│       ├── hud.css
│       └── lobby.css
├── server/                # Backend server
│   ├── index.js          # Server entry point
│   ├── GameServer.js     # Main server logic
│   ├── RoomManager.js    # Room management
│   ├── Room.js           # Individual room
│   ├── Match.js          # Match logic (authoritative)
│   └── Matchmaking.js    # Queue system
├── shared/               # Shared code
│   ├── constants.js      # Game constants
│   ├── protocol.js       # Network protocol
│   ├── weaponData.js     # Weapon definitions
│   ├── playerState.js    # Player state schema
│   ├── mapData.js        # Map data structures
│   └── gameRules.js      # Game rules
└── package.json
```

## Installation

### Prerequisites
- Node.js 16+ 
- Modern web browser (Chrome, Firefox, Edge)

### Setup

```bash
cd onebullet
npm install
```

## Running the Game

### Start the Server

```bash
npm start
```

The server will run on `http://localhost:3000` with WebSocket endpoint at `ws://localhost:3000/ws`.

### Play Local Mode

1. Open `client/index.html` in your browser
2. Click "PLAY LOCAL"
3. Configure match settings (map, mode, bot count, difficulty)
4. Click "START MATCH"

### Play Online Mode

1. Open `client/index.html` in your browser
2. Click "PLAY ONLINE"
3. Wait for matchmaking or create/join a room
4. Ready up and start the match

## Adding Content

### Adding a New Map

1. Create a new file in `client/src/maps/YourMapName.js`
2. Extend the base map structure:

```javascript
import * as THREE from 'three';

export class YourMapName {
    constructor(scene) {
        this.scene = scene;
        this.spawnPoints = [];
    }

    async build() {
        // Add geometry, lighting, props
        this.setupLighting();
        this.setupGeometry();
        this.setupSpawnPoints();
    }

    getRandomSpawnPoint() {
        return this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
    }

    dispose() {
        // Clean up resources
    }
}
```

3. Register the map in `client/src/game/Game.js`:

```javascript
import { YourMapName } from '../maps/YourMapName.js';

// In constructor
this.mapBuilders = {
    ...
    yourMapName: YourMapName,
};
```

4. Add map selection option in `client/index.html`

### Adding a New Weapon Skin

1. Add skin definition in `shared/weaponData.js`:

```javascript
yourSkin: {
    id: 'yourSkin',
    name: 'Your Skin Name',
    rarity: 'rare',
    description: 'Description here',
    colors: { primary: '#hexcolor', secondary: '#hexcolor', accent: '#hexcolor' },
},
```

2. Add unlock level in `StorageManager.js`:

```javascript
const unlocks = {
    ...
    8: { type: 'weaponSkin', id: 'yourSkin' },
};
```

### Adding a New Game Mode

1. Add mode constant in `shared/constants.js`:

```javascript
export const GAME_MODES = {
    ...
    YOUR_MODE: 'yourMode',
};
```

2. Implement mode logic in `server/Match.js`:

```javascript
checkWinCondition() {
    if (this.room.mode === 'yourMode') {
        // Your win condition logic
    }
}
```

3. Add UI options in `client/index.html`

## Network Architecture

### Client-Server Protocol

All communication uses JSON over WebSocket:

```json
{
    "type": "messageType",
    "data": { ... },
    "timestamp": 1234567890
}
```

### Key Message Types

- **Connection**: `connect`, `welcome`, `connected`
- **Rooms**: `roomCreate`, `roomJoin`, `lobbyState`
- **Match**: `matchStarting`, `matchStarted`, `matchEnded`
- **Combat**: `shoot`, `shotResult`, `damage`, `elimination`
- **Chat**: `chatMessage`
- **Network**: `ping`, `pong`

### Server Authority

The server validates and processes:
- Shot hits and damage
- Player eliminations
- Score updates
- Match results
- Chat messages (rate limiting, validation)

## Performance Considerations

- Object pooling for bullets and effects
- Frustum culling for rendering
- Efficient raycasting for hit detection
- Snapshot interpolation for smooth remote players
- Rate limiting for network messages

## Browser Compatibility

Tested on:
- Chrome 90+
- Firefox 88+
- Edge 90+

Minimum requirements:
- WebGL 2.0 support
- WebSocket support
- ES6 module support

## Development

### Debugging

Enable verbose logging:
```javascript
// In browser console
localStorage.setItem('onebullet_debug', 'true');
```

### Hot Reload

For development, use a static file server with live reload:
```bash
npx serve client/
```

## Security Notes

- Client is untrusted - all important logic is server-side
- Rate limiting prevents spam attacks
- Input validation on all network messages
- No sensitive data stored client-side

## License

ISC

## Credits

ONEBULLET is an original tactical sniper arena game.
All assets, code, and designs are created specifically for this project.
