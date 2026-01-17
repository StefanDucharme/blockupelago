# Blockupelago

A web-based Blockudoku puzzle game with [Archipelago](https://archipelago.gg/) multiworld randomizer integration.

## Playable online at:
https://stefanducharme.github.io/blockupelago/

## Features

- **Blockudoku Gameplay**: Place polyomino pieces on a 9x9 grid, clear rows/columns/3x3 boxes to score points
- **Archipelago Integration**: Connect to Archipelago multiworld servers to receive items and send location checks
- **Progressive Piece Unlocks**: Start with basic pieces and unlock more complex shapes through Archipelago
- **Ability System**: Unlock special abilities (Rotate, Undo, Remove Block, Hold) as you progress
- **Score Multipliers**: Receive score boost items to increase your points
- **Free Play Mode**: Play without restrictions with all pieces available and gem-based abilities
- **Mobile Touch Support**: Optimized touch controls for mobile play with offset piece preview
- **Theme Customization**: Multiple color themes to personalize your experience

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (comes with Node.js)
- [Archipelago](https://github.com/ArchipelagoMW/Archipelago/releases) (only required to generate or host a game)

## Getting Started

### 1. Get the code

**Option A: Clone with Git**
```bash
git clone https://github.com/StefanDucharme/blockupelago.git
cd blockupelago
```

**Option B: Download without Git**
1. Go to the GitHub repository page
2. Click the green **Code** button
3. Select **Download ZIP**
4. Extract the ZIP file to a folder on your computer
5. Open a terminal/command prompt and navigate to the `blockupelago` folder:
   ```bash
   cd path/to/blockupelago
   ```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`


## Archipelago Local Testing & Setup

### 1. Build the APWorld file

Open a terminal and run:

```powershell
cd E:\repo\personal\blockupelago\apworld
python build_apworld.py
```

This creates `blockupelago.apworld` in the `apworld` folder.

### 2. Install the APWorld in Archipelago

1. Open `ArchipelagoLauncher.exe`
2. Click **"Install APWorld"**
3. Select the `blockupelago.apworld` file you just built
4. Restart the Launcher if prompted

### 3. Create a Test YAML

Copy the example YAML to the Archipelago `Players` folder:

```powershell
copy apworld\blockupelago.yaml <ARCHIPELAGO_PATH>\Players\
```

Or create `Players/blockupelago.yaml` with:

```yaml
see yaml file in apworld folder
```

### 4. Generate a Game

1. In the Archipelago Launcher, click **"Generate"**
2. It will use YAML files from your Players folder
3. The generated `.archipelago` file appears in the `output/` folder

### 5. Start the Server

**Using the Launcher:**
1. Open `ArchipelagoLauncher.exe`
2. Click "Host"
3. Select your generated `.archipelago` file from `output/`



The server will display:
```
Server running on port 38281
```

### 6. Start the Blockupelago Client

In a new terminal:

```powershell
cd E:\repo\personal\blockupelago
npm run dev
```

Open http://localhost:3000 in your browser.

### 7. Connect

1. Click on the **Archipelago** tab in the right panel
2. Enter connection details:
   - **Host**: `localhost`
   - **Port**: `38281`
   - **Slot**: `TestPlayer` (must match your YAML `name` field)
   - **Password**: (leave empty unless you set one)
3. Click **Connect**

### Game Options

| Option                | Range   | Default | Description                        |
|---------------BlockupelagoP1` (must match your YAML `name` field)
   - **Password**: (leave empty unless you set one)
3. Click **Connect**

### Game Options

Configure your Blockupelago multiworld experience with these YAML options:

| Option                    | Range   | Default | Description                                  |
|---------------------------|---------|---------|----------------------------------------------|
| `starting_piece_slots`    | 2-3     | 3       | Number of piece slots at game start          |
| `starting_abilities`      | 0-4     | 0       | Starting uses for all abilities              |
| `rotate_uses_in_pool`     | 1-10    | 10      | Rotate Ability items in pool                 |
| `undo_uses_in_pool`       | 1-10    | 10      | Undo Ability items in pool                   |
| `remove_blocks_in_pool`   | 1-10    | 10      | Remove Block items in pool                   |
| `hold_uses_in_pool`       | 1-10    | 10      | Hold Ability items in pool                   |
| `mirror_uses_in_pool`     | 1-10    | 10      | Mirror Ability items in pool                 |
| `shrink_uses_in_pool`     | 1-10    | 3       | Shrink Ability items in pool                 |
| `score_multipliers_in_pool` | 0-20  | 10      | Score Multiplier items in pool               |
| `goal_score`              | 10000-100000 | 30000 | Score required to complete the game    |
| `death_link`              | true/false | false | Enable DeathLink (game over = everyone dies) |

### Location Checks

Blockupelago sends checks to Archipelago when you reach milestones:
pieces unlocked. You can play continuously, collecting gems to use abilities, and tracking your high scores.

### Archipelago Mode
1. Click the **Archipelago** tab in the right panel
2. Enter your server details:
   - **Host**: The Archipelago server address (e.g., `archipelago.gg` or `localhost`)
   - **Port**: Server port (default: `38281`)
   - **Player Name**: Your slot name from the multiworld
   - **Password**: Room password (if required)
3. Click **Connect**

In Archipelago Mode:
- Start with only 3 basic pieces (Tromino L, Tetromino T, Tetromino L)
- Unlock additional piece types as you receive items from other players
- Abilities (Rotate, Undo, Remove Block, Hold, Mirror, Shrink) are granted through items
- Score multipliers stack to boost your point gains
- Reach the goal score to complete your game and send victory
- Switching modes resets all progress

### Free Play Customization

In Free Play mode, the **Settings** tab provides extensive customization:

**Piece Generation**:
- **Piece Size Ratio** (0-100%): Control the balance of small vs. large pieces. 0% = mostly large pieces, 100% = mostly small pieces
- **Disabled Shapes**: Toggle off specific piece types to prevent them from appearing

**Gem Settings**:
- **Gem Spawn Ratio** (0-100%): Set how frequently gems spawn when clearing lines/boxes

**Free Abilities**: Make any ability usable without gem cost
- Toggle free use for: Rotate, Undo, Remove Block, Hold, Mirror, Shrink

These settings persist across sessions and only affect Free Play mode.

### Items You Can Receive

**Piece Unlocks** (18 types):
- Single Block, Domino I
- Tromino I, Tromino L
- Tetromino I, O, T, L, S
- Pentomino I, L, P, U, W, Plus
- 3x3 Corner, T-Shape, Cross

**Abilities**:
- **Rotate Ability** - Rotate pieces before placing
- **Undo Ability** - Undo your last move
- **Remove Block** - Remove a single block from the grid
- **Hold Ability** - Drag a piece to the hold area for later use (costs gems in free play)
- **Mirror Ability** - Flip pieces horizontally before placing
- **Shrink Ability** - Shrink any piece into a single block

**Upgrades**:
- **4th Piece Slot** - Increase piece slots from 3 to 4
- **5th Piece Slot** - Increase piece slots from 4 to 5
- **Score Multiplier +10%** - Permanent 10% score boost
- **Score Multiplier +25%** - Permanent 25% score boost
- **Score Multiplier +50%** - Permanent 50% score boost

### │   ├── BlockudokuBoard.vue    # Main game board
│   │   ├── ScrollableGrid.vue     # Piece selection grid
│   │   └── ThemePicker.vue        # Theme selector
│   ├── composables/        # Vue composables
│   │   ├── useArchipelago.ts      # AP connection & events
│   │   ├── useArchipelagoItems.ts # Item/location definitions
│   │   ├── useBlockudoku.ts       # Game logic
│   │   ├── usePersistence.ts      # LocalStorage management
│   │   └── useTheme.ts            # Theme system
│   ├── pages/              # Page components
│   │   └── index.vue              # Main game page
│   ├── plugins/            # Nuxt plugins
│   │   ├── archipelago.client.ts  # AP client setup
│   │   └── sleekplan.client.ts    # Feedback widget
│   └── utils/              # Utility functions
│       ├── blockudoku.ts          # Game rules & piece shapes
│       └── themes.ts              # Theme definitions
├── apworld/                # Archipelago world files
│   ├── blockupelago/       # Python world implementation
│   │   ├── __init__.py            # World definition
│   │   ├── Items.py               # Item definitions
│   │   ├── Locations.py           # Location checks
│   │   ├── Options.py             # YAML options
│   │   └── Regions.py             # Region setup
│   ├── build_apworld.py    # APWorld packaging script
│   └── Blockupelago.yamll with X
- **Shift + Click** or **Click again**: Erase a cell

## Development

### Tech Stack
- [Nuxt 4](https://nuxt.com/) - Vue.js framework
- [Vue 3](https://vuejs.org/) - Frontend framework
- [Tailwind CSS 4](https://tailwindcss.com/) - Styling
- [archipelago.js](https://github.com/ThePhar/archipelago.js) - Archipelago client library

### Project Structure
```
blockupelago/
├── app/                    # Nuxt application
│   ├── components/         # Vue components
│   ├── composables/        # Vue composables (game logic, AP integration)
│   ├── pages/              # Page components
│   └── plugins/            # Nuxt plugins (AP client setup)
├── apworld/                # Archipelago world files
│   ├── blockupelago/           # Python world implementation
│   ├── build_apworld.py    # APWorld packaging script
│   └── blockupelago.yaml       # Example player YAML
└── README.md               # This file
```

### Scripts

```bash
# Start development server
npm run dev

# To generate static site for hosting
npm run generate

# Build APWorld
cd apworld && python build_apworld.py
```

## License

MIT
