//each room has a name "A" for instance. World Assembly is where each room goes
const roomTemplates = {

    A: [
        "####################",
        "#                  #",
        "#                  #",
        "#     ##            ",
        "#                  #",
        "#        ###       #",
        "#                  #",
        "#   ###            #",
        "#   #              #",
        "#             ##   #",
        "#     E            #",
        "#                  #",
        "#       @      ##  #",
        "#       @@@@       #",
        "#  ###              ",
        "#        e          ",
        "#   BBBB            ",
        "#     BB      K     ",
        "####################",
    ],

    B: [
        "####################",
        "                   #",
        "#                  #",
        "#         ###      #",
        "#                  #",
        "#    ##            #",
        "#                  #",
        "#              ##  #",
        "#                  #",
        "#   ####           #",
        "#                  #",
        "#                  #",
        "         ##        #",
        "                   #",
        "                   #",
        "                   #",
        "####################",
    ],

    C: [
        "####################",
        "#                  #",
        "#   ##             #",
        "#                  #",
        "#          ###      ",
        "#                  #",
        "#     ###          #",
        "#                  #",
        "#                   ",
        "#              ##  #",
        "#                  #",
        "#  ##              #",
        "#                  #",
        "#                  #",
        "#                  #",
        "#                  #",
        "####################",
    ],

    D: [
        "####################",
        "#                   ",
        "#                  #",
        "#        ##        #",
        "#                  #",
        "#  ##              #",
        "#                  #",
        "#           ###    #",
        "#                  #",
        "#    ##            #",
        "#                  #",
        "#              ##  #",
        "#                  #",
        "#                  #",
        "#                  #",
        "#                  #",
        "####################",
    ],

};

const worldAssembly = [ 
    "AB",
    "CD",
];


//autotiling!
function chooseTile(bitmap, row, col, tileMap) {
    const ch = bitmap[row][col];
    
    const solid = (r, c) => {
        if (r < 0 || r >= bitmap.length) return true;
        if (c < 0 || c >= (bitmap[r]?.length ?? 0)) return true;
        return bitmap[r][c] === ch;
    };

    //diagonals treat OOB as empty attempt to fix corners :/
    const solidDiag = (r, c) => {
        if (r < 0 || r >= bitmap.length) return false;
        if (c < 0 || c >= (bitmap[r]?.length ?? 0)) return false;
        return bitmap[r][c] === ch;
    };

    const N = solid(row-1, col);
    const E = solid(row, col+1);
    const S = solid(row+1, col);
    const W = solid(row, col-1);

    const NE = N && E && solidDiag(row-1, col+1);
    const SE = S && E && solidDiag(row+1, col+1);
    const SW = S && W && solidDiag(row+1, col-1);
    const NW = N && W && solidDiag(row-1, col-1);

    const key8 = (N ?'n':'y') + (NE?'n':'y') + (E ?'n':'y') + (SE?'n':'y')
               + (S ?'n':'y') + (SW?'n':'y') + (W ?'n':'y') + (NW?'n':'y');
    const key4 = key8[0] + key8[2] + key8[4] + key8[6];

    const def = tileMap[ch];
    return def?.tileset?.[key8] ?? def?.tileset?.[key4] ?? null;
}


/* 
    Build the world
*/
class WorldBuilder {
    constructor(engine, blockSize, tileMap) {
        this.engine = engine;
        this.blockSize = blockSize;

        // { char: { type, tileset } }
        this.tileMap = tileMap;
    }

    build(bitmap) {
        this._clearWorld();

        let maxCols = 0;

        for (let row = 0; row < bitmap.length; row++) {
            const line = bitmap[row];
            if (line.length > maxCols) maxCols = line.length;

            for (let col = 0; col < line.length; col++) {
                const ch = line[col];
                const def = this.tileMap[ch];
                if (!def) continue;

                //pick sprite first before constructuing object
                const solid = (r, c) => {
                    if (r < 0 || r >= bitmap.length) return true;
                    if (c < 0 || c >= (bitmap[r]?.length ?? 0)) return true;
                    return bitmap[r][c] === ch;
                };

                //diagonals treat out-of-bounds as empty, not solid
                const solidDiag = (r, c) => {
                    if (r < 0 || r >= bitmap.length) return false;
                    if (c < 0 || c >= (bitmap[r]?.length ?? 0)) return false;
                    return bitmap[r][c] === ch;
                };

                const N  = solid(row-1, col);
                const E  = solid(row,col+1);
                const S  = solid(row+1, col);
                const W  = solid(row, col-1);

                const NE = N && E && solidDiag(row-1, col+1);
                const SE = S && E && solidDiag(row+1, col+1);
                const SW = S && W && solidDiag(row+1, col-1);
                const NW = N && W && solidDiag(row-1, col-1);
                const key8 = (N  ? 'n' : 'y') + (NE ? 'n' : 'y')
                        + (E  ? 'n' : 'y') + (SE ? 'n' : 'y')
                        + (S  ? 'n' : 'y') + (SW ? 'n' : 'y')
                        + (W  ? 'n' : 'y') + (NW ? 'n' : 'y');

                //cardinals only, for tilesets that don't have diagonal variants
                const key4 = key8[0] + key8[2] + key8[4] + key8[6];

                const sprite = def.tileset[key8] ?? def.tileset[key4] ?? def.tileset['yyyy'];

                if (!sprite) {
                    //remove later
                    console.error(`WorldBuilder: missing sprite key "${key}" for '${ch}' at (${col},${row})`);
                    continue;
                }

                const x = col * this.blockSize;
                const y = row * this.blockSize;

                //sprite is captured in the closure
                const obj = new def.type(x, y, this.blockSize, this.blockSize, () => sprite);
                this.engine.world.add(obj, 0);
            }
        }

        return {
            widthUnits: maxCols * this.blockSize,
            heightUnits: bitmap.length * this.blockSize,
        };
    }

    _clearWorld() {
        const player = this.engine.player;
        this.engine.world.zia = {};
        this.engine.world.indices = [];
        if (player) this.engine.world.add(player, 1);
    }
}


/* 
    Manage world transitions
*/
class WorldManager {
    constructor(engine, roomTemplates, worldAssembly, builder) {
        this.engine = engine;
        this.templates = roomTemplates;
        this.assembly = worldAssembly;
        this.builder = builder;

        this.curRow = 0;
        this.curCol = 0;
        this.roomW = 0;
        this.roomH = 0;

        this._pending = null;
    }

    loadRoom(row, col) {
        const key = this._roomKey(row, col);
        if (!key) return;
        const bitmap = this.templates[key];
        if (!bitmap) return;

        this.curRow = row;
        this.curCol = col;

        const { widthUnits, heightUnits } = this.builder.build(bitmap);
        this.roomW = widthUnits;
        this.roomH = heightUnits;

        this.engine.roomBounds = { w: this.roomW, h: this.roomH };

        //build or even rebuild nav graph for the new room
        this.engine.graph = new PlatformGraph(bitmap, this.builder.tileMap);

        if (this.onEnemySpawn) {
            for (let row = 0; row < bitmap.length; row++) {
                for (let col = 0; col < bitmap[row].length; col++) {
                    const ch = bitmap[row][col];
                    if (ch === 'E' || ch === 'e' || ch === 'K') {
                        this.onEnemySpawn(ch, col * this.builder.blockSize, row * this.builder.blockSize);
                    }
                }
            }
        }
    }

    placePlayer(player, x, y) {
        player.x = x;
        player.y = y;
        player.sx = x;
        player.sy = y;
        player.xv = 0;
        player.yv = 0;
        player.updateHitbox?.();
    }
    
    hasPending() {
        if (!this._pending) this._detectEdge(this.engine.player);
        return !!this._pending;
    }

    getPendingDir() {
        if (!this._pending) this._detectEdge(this.engine.player);
        return this._pending?.dir ?? null;
    }

    execute(player) {
        if (!this._pending) this._detectEdge(player);
        if (this._pending) {
            const dir = this._pending.dir;
            this._doTransition(player);
            this.transition?.start(dir);
            this._pending = null;
        }
    }

    _roomKey(row, col) {
        if (row < 0 || row >= this.assembly.length) return null;
        const rowStr = this.assembly[row];
        if (col < 0 || col >= rowStr.length) return null;
        const key = rowStr[col];
        return key === ' ' ? null : key;
    }

    get _leftKey() {
        return this._roomKey(this.curRow, this.curCol - 1);
    }
    get _rightKey() {
        return this._roomKey(this.curRow, this.curCol + 1);
    }
    get _topKey() {
        return this._roomKey(this.curRow - 1, this.curCol);
    }
    get _bottomKey() {
        return this._roomKey(this.curRow + 1, this.curCol);
    }

    _detectEdge(player) {
        if (player.x + player.w < 0 && this._leftKey) {
            this._pending = {
                dir: 'left'
            };
            return;
        }
        if (player.x > this.roomW && this._rightKey) {
            this._pending = {
                dir: 'right'
            };
            return;
        }
        if (player.y + player.h < 0 && this._topKey) {
            this._pending = {
                dir: 'top'
            };
            return;
        }
        if (player.y > this.roomH && this._bottomKey) {
            this._pending = {
                dir: 'bottom'
            };
            return;
        }
    }

    _doTransition(player) {
        const savedX = player.x;
        const savedY = player.y;

        switch (this._pending.dir) {
            case 'left': {
                this.loadRoom(this.curRow, this.curCol - 1);
                this.placePlayer(player, this.roomW - player.w, savedY);
                break;
            }
            case 'right': {
                this.loadRoom(this.curRow, this.curCol + 1);
                this.placePlayer(player, 0, savedY);
                break;
            }
            case 'top': {
                this.loadRoom(this.curRow - 1, this.curCol);
                this.placePlayer(player, savedX, this.roomH - player.h);
                break;
            }
            case 'bottom': {
                this.loadRoom(this.curRow + 1, this.curCol);
                this.placePlayer(player, savedX, 0);
                break;
            }
        }
    }
}

//you don't know me son
class MCheckpoint extends MDecorative {
    static ACTIVATE_RADIUS = 3;
    static LIGHT_UP_DURATION = 0.7;
    static ANIM_FPS = 6;

    constructor(x, y) {
        super(x, y, 2, 4, (t, self) => {
            if (self.state === 'lighting') {
                const frames = gfx.props.misc.totemLightUp;
                const frame = Math.min(
                    frames.length - 1,
                    Math.floor(self.stateTime / MCheckpoint.LIGHT_UP_DURATION * frames.length)
                );
                return frames[frame];
            }
            if (self.state === 'on') {
                const frames = gfx.props.misc.totemOn;
                return frames[Math.floor(t * MCheckpoint.ANIM_FPS) % frames.length];
            }
            return gfx.props.misc.totemOff[0];
        });
        this.state = 'off';
        this.stateTime = 0;
    }

    tick(dt) {
        this.stateTime += dt;
        const player = this.engine?.player;
        if (!player) return;

        if (this.state === 'off') {
            const dx = (player.x + player.w / 2) - this.x;
            const dy = (player.y + player.h / 2) - this.y;
            if (Math.sqrt(dx * dx + dy * dy) <= MCheckpoint.ACTIVATE_RADIUS) {
                this._activate(player);
            }
        } else if (this.state === 'lighting' && this.stateTime >= MCheckpoint.LIGHT_UP_DURATION) {
            this.state = 'on';
            this.stateTime = 0;
        }
    }

    _activate(player) {
        //turn off every other checkpoint in the world
        this.engine.world.iterate(obj => {
            if (obj instanceof MCheckpoint && obj !== this) {
                obj.state = 'off';
                obj.stateTime = 0;
            }
        });

        this.state = 'lighting';
        this.stateTime = 0;

        //reposition the player's respawn point to the base of this totem
        player.sx = this.x + 1 - player.w / 2;
        player.sy = this.y + 4  - player.h;
    }
}