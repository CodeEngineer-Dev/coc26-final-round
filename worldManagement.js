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
        "#                  #",
        "#                  #",
        "#              ##  #",
        "#                  #",
        "#  ###             #",
        "#                  #",
        "#                  #",
        "#------            #",
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
        "#        ##        #",
        "#                  #",
        "#                  #",
        "#             -----#",
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
        "#---               #",
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
        "#       ----       #",
        "#                  #",
        "####################",
    ],

};

/**
 * World assembly grid
 * */
const worldAssembly = [
    ["A", "B"],
    ["C", "D"],
];



class WorldBuilder {
    /**
     * @param {MEngine} engine
     * @param {number}  [blockSize=1]  - world-unit size of each tile character
     * @param {(t, obj) => SpriteRef} [solidTexturer]
     * @param {(t, obj) => SpriteRef} [hazardTexturer]
     */
    constructor(engine, blockSize = 1, solidTexturer = null, hazardTexturer = null) {
        this.engine = engine;
        this.blockSize = blockSize;
        this.solidTexturer = solidTexturer ?? (() => {
            throw new Error("WorldBuilder: no solidTexturer set");
        });
        this.hazardTexturer = hazardTexturer ?? (() => {
            throw new Error("WorldBuilder: no hazardTexturer set");
        });
    }

    /**
     * Parses a bitmap room and loads it into engine.world.
     * Wipes any existing world objects first (except the player).
     *
     * @param {string[]} bitmap - array of strings
     * @returns {{ widthUnits: number, heightUnits: number }}
     */
    build(bitmap) {
        const {
            engine,
            blockSize
        } = this;

        //wipe world, keeping the player on layer 1
        const player = engine.player;
        engine.world.zia = {};
        engine.world.indices = [];
        if (player) engine.world.add(player, 1);

        let maxCols = 0;

        for (let row = 0; row < bitmap.length; row++) {
            const line = bitmap[row];
            for (let col = 0; col < line.length; col++) {
                const ch = line[col];
                const x = col * blockSize;
                const y = row * blockSize;

                switch (ch) {
                    case "#": {
                        engine.world.add(
                            new MSolid(x, y, blockSize, blockSize, this.solidTexturer),
                            0
                        );
                        break;
                    }
                    case "-": {
                        engine.world.add(
                            new MHazard(x, y, blockSize, blockSize, this.hazardTexturer),
                            0
                        );
                        break;
                    }
                }
            }
            if (line.length > maxCols) maxCols = line.length;
        }

        return {
            widthUnits: maxCols * blockSize,
            heightUnits: bitmap.length * blockSize,
        };
    }
}


class WorldManager {
    /**
     * @param {MEngine}   engine
     * @param {Object}    roomTemplates  - key → string[] bitmap map
     * @param {string[][]} worldAssembly - 2-D grid of room keys
     * @param {WorldBuilder} builder
     */
    constructor(engine, roomTemplates, worldAssembly, builder) {
        this.engine = engine;
        this.templates = roomTemplates;
        this.assembly = worldAssembly;
        this.builder = builder;

        //current position in the assembly grid
        this.curRow = 0;
        this.curCol = 0;

        //dimensions of the currently loaded room (world units)
        this.roomW = 0;
        this.roomH = 0;

        //internal transition flags
        this._pending = null; //{ dir:'left'|'right'|'top'|'bottom' }
    }

    /** Returns the room key at a given assembly position, or null. */
    getRoomKey(row, col) {
        if (row < 0 || row >= this.assembly.length) return null;
        if (col < 0 || col >= this.assembly[row].length) return null;
        return this.assembly[row][col] || null;
    }

    get leftKey() {
        return this.getRoomKey(this.curRow, this.curCol - 1);
    }
    get rightKey() {
        return this.getRoomKey(this.curRow, this.curCol + 1);
    }
    get topKey() {
        return this.getRoomKey(this.curRow - 1, this.curCol);
    }
    get bottomKey() {
        return this.getRoomKey(this.curRow + 1, this.curCol);
    }

    /**
     * Loads the room at the given assembly position.
     * @param {number} row
     * @param {number} col
     */
    loadRoom(row, col) {
        const key = this.getRoomKey(row, col);
        if (!key) {
            //console.warn(`WorldManager: no room at [${row}, ${col}]`);
            return;
        }
        const bitmap = this.templates[key];
        if (!bitmap) {
            //console.warn(`WorldManager: unknown room key "${key}"`);
            return;
        }

        this.curRow = row;
        this.curCol = col;

        const {
            widthUnits,
            heightUnits
        } = this.builder.build(bitmap);
        this.roomW = widthUnits;
        this.roomH = heightUnits;
    }

    /**
     * Sets the player's starting position after loading a room.
     * @param {MPlayer} player
     * @param {number}  x  - world-unit x
     * @param {number}  y  - world-unit y
     */
    placePlayer(player, x, y) {
        player.x = x;
        player.y = y;
        player.xv = 0;
        player.yv = 0;
        player.updateHitbox?.();
    }
    /**
     * Call once per frame. Checks whether the player has walked
     * off an edge, queues a transition, then executes it.
     *
     * @param {MPlayer} player
     */
    execute(player) {
        if (!this._pending) {
            this._detectEdge(player);
        }

        if (this._pending) {
            this._doTransition(player);
            this._pending = null;
        }
    }

    /** Checks all four edges and flags the first one hit. */
    _detectEdge(player) {
        const {
            roomW,
            roomH
        } = this;

        if (player.x + player.w < 0 && this.leftKey) {
            this._pending = {
                dir: 'left'
            };
            return;
        }
        if (player.x > roomW && this.rightKey) {
            this._pending = {
                dir: 'right'
            };
            return;
        }
        if (player.y + player.h < 0 && this.topKey) {
            this._pending = {
                dir: 'top'
            };
            return;
        }
        if (player.y > roomH && this.bottomKey) {
            this._pending = {
                dir: 'bottom'
            };
            return;
        }
    }

    /** Loads the adjacent room and repositions the player at the matching edge. */
    _doTransition(player) {
        // save player position relative to the current room so we can
        // carry the axis that doesn't change through the doorway
        const savedX = player.x;
        const savedY = player.y;

        switch (this._pending.dir) {
            case 'left': {
                this.loadRoom(this.curRow, this.curCol - 1);
                this.placePlayer(player,
                    this.roomW - player.w,
                    savedY
                );
                break;
            }
            case 'right': {
                this.loadRoom(this.curRow, this.curCol + 1);
                this.placePlayer(player,
                    0,
                    savedY
                );
                break;
            }
            case 'top': {
                this.loadRoom(this.curRow - 1, this.curCol);
                this.placePlayer(player,
                    savedX,
                    this.roomH - player.h
                );
                break;
            }
            case 'bottom': {
                this.loadRoom(this.curRow + 1, this.curCol);
                this.placePlayer(player,
                    savedX,
                    0
                );
                break;
            }
        }
    }
}