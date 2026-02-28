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
        "#                  #",
        "#                  #",
        "#       @      ##  #",
        "#       @@@@       #",
        "#  ###              ",
        "#             @     ",
        "#   BBBB      @@@   ",
        "#     BB            ",
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
    const solid = (r, c) => (bitmap[r]?.[c] ?? ' ') in tileMap;
    const key = (solid(row - 1, col) ? 'n' : 'y') +
        (solid(row, col + 1) ? 'n' : 'y') +
        (solid(row + 1, col) ? 'n' : 'y') +
        (solid(row, col - 1) ? 'n' : 'y');
    const ch = bitmap[row][col];
    const def = tileMap[ch];
    return def?.tileset?.[key] ?? null;
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
                const solid = (r, c) => (bitmap[r]?.[c] ?? ' ') in this.tileMap;
                const key = (solid(row - 1, col) ? 'n' : 'y') +
                    (solid(row, col + 1) ? 'n' : 'y') +
                    (solid(row + 1, col) ? 'n' : 'y') +
                    (solid(row, col - 1) ? 'n' : 'y');
                const sprite = def.tileset[key] ?? def.tileset['yyyy'];

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

        this.engine.roomBounds = { 
            w: this.roomW, 
            h: this.roomH 
        };
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

    execute(player) {
        if (!this._pending) this._detectEdge(player);
        if (this._pending) {
            this._doTransition(player);
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