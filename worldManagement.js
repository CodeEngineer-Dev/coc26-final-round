//each room has a name "A" for instance. World Assembly is where each room goes
const roomTemplates = {

    // A: [
    //     "####################",
    //     "#                  #",
    //     "#                  #",
    //     "#     ##            ",
    //     "#                  #",
    //     "#        ###       #",
    //     "#                  #",
    //     "#   ###            #",
    //     "#   #              #",
    //     "#             ##   #",
    //     "#     E            #",
    //     "#                  #",
    //     "#       @      ##  #",
    //     "#       @@@@       #",
    //     "#  ###              ",
    //     "#        e          ",
    //     "#   BBBB            ",
    //     "#     BB  K         ",
    //     "####################",
    // ],
    A: /*{
        bitmap: */[
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
            "#              ##  #",
            "#       @@@@       #",
            "#  ###              ",
            "#                   ",
            "#   BBBB            ",
            "# e E BB  K     N   ",
            "####################",
        ],/*
        npcs: {
            N: {
                sprite: 'pakala',
                dialogue: [
                    "hiiiii",
                    "My name is classified",
                    ".",
                    "..",
                    "...",
                    "You don't know me son",
                ]
            },
        }
    },*/

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
        "########     #######",
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
        "#                   ",
        "#                   ",
        "#                   ",
        "####################",
    ],

    D: [
        "########     #######",
        "#                  #",
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
        "                   #",
        "                   #",
        "                   #",
        "####################",
    ],

};

const worldAssembly = [ 
    "AB",
    "CD",
];



/*
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
*//*
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

                const N = solid(row-1, col);
                const E = solid(row,col+1);
                const S = solid(row+1, col);
                const W = solid(row, col-1);

                const NE = N && E && solidDiag(row-1, col+1);
                const SE = S && E && solidDiag(row+1, col+1);
                const SW = S && W && solidDiag(row+1, col-1);
                const NW = N && W && solidDiag(row-1, col-1);
                const key8 = (N ? 'y' : 'n') + (NE ? 'y' : 'n')
                        + (E ? 'y' : 'n') + (SE ? 'y' : 'n')
                        + (S ? 'y' : 'n') + (SW ? 'y' : 'n')
                        + (W ? 'y' : 'n') + (NW ? 'y' : 'n');

                //cardinals only, for tilesets that don't have diagonal variants
                const key4 = key8[0] + key8[2] + key8[4] + key8[6];
                const sprite = (def.tileset[key8] ?? def.tileset[key4]) ?? def.tileset['nnnn'];
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
*//*
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

        //for transistions
        this._transitionCooldown = 0;
    }

    loadRoom(row, col) {
        const key = this._roomKey(row, col);
        if (!key) return;
        const room = this.templates[key];
        if (!room) return;

        this.curRow = row;
        this.curCol = col;

        //plain array or object with bitmap and npc defs
        const bitmap  = Array.isArray(room) ? room : room.bitmap;
        const npcDefs = Array.isArray(room) ? {}   : (room.npcs ?? {});

        const { widthUnits, heightUnits } = this.builder.build(bitmap);
        this.roomW = widthUnits;
        this.roomH = heightUnits;

        this.engine.roomBounds = { w: this.roomW, h: this.roomH };
        this.engine.graph = new PlatformGraph(bitmap, this.builder.tileMap);

        //enemy spawn stuffs
        if (this.onEnemySpawn) {
            for (let r = 0; r < bitmap.length; r++) {
                for (let c = 0; c < bitmap[r].length; c++) {
                    const ch = bitmap[r][c];
                    if (ch === 'E' || ch === 'e' || ch === 'K') {
                        this.onEnemySpawn(ch, c * this.builder.blockSize, r * this.builder.blockSize);
                    }
                }
            }
        }

        //destroy old NPCs
        this.engine.world.iterate(obj => {
            if (obj instanceof MNPC) obj.destroy();
        });

        //spawn NPCs from bitmap
        for (let r = 0; r < bitmap.length; r++) {
            for (let c = 0; c < bitmap[r].length; c++) {
                const ch  = bitmap[r][c];
                const def = npcDefs[ch];
                if (!def) continue;
                const npc = new MNPC(
                    c * this.builder.blockSize,
                    //coefficent here can be modified based on the sprites size. Might have to make this changeable if NL or honeyghost add more NPCs
                    (r + 1) * this.builder.blockSize - (def.h ?? 1.5),
                    def.dialogue,
                    def.sprite ?? 'pakala'
                );
                this.engine.world.add(npc, 0);
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
            this._transitionCooldown = 0.4;
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
        if (this._transitionCooldown > 0) return;
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

    _findClearPosition(player, startX, startY, stepX, stepY) {
        const maxSteps = 20;
        player.x = startX;
        player.y = startY;
        player.updateHitbox();

        for (let i = 0; i < maxSteps; i++) {
            if (!player.touching(MSolid, this.engine.world)) return;
            player.x += stepX;
            player.y += stepY;
            player.updateHitbox();
        }
    }

    _doTransition(player) {
        const savedX = player.x;
        const savedY = player.y;
        const e = this.engine.epsilon;

        switch (this._pending.dir) {
            case 'left': {
                this.loadRoom(this.curRow, this.curCol - 1);
                this.placePlayer(player, this.roomW - player.w, savedY);
                this._findClearPosition(player, player.x, player.y, -this.builder.blockSize, 0);
                break;
            }
            case 'right': {
                this.loadRoom(this.curRow, this.curCol + 1);
                this.placePlayer(player, 0, savedY);
                this._findClearPosition(player, player.x, player.y, this.builder.blockSize, 0);
                break;
            }
            case 'top': {
                this.loadRoom(this.curRow - 1, this.curCol);
                this.placePlayer(player, savedX, this.roomH - player.h);
                this._findClearPosition(player, player.x, player.y, 0, -this.builder.blockSize);
                break;
            }
            case 'bottom': {
                this.loadRoom(this.curRow + 1, this.curCol);
                this.placePlayer(player, savedX, 0);
                this._findClearPosition(player, player.x, player.y, 0, this.builder.blockSize);
                break;
            }
        }
    }
}*/

//you don't know me son
// ok bro why did you NOT put this in the frickin matter.js arrow
// the heck are you doing -xyzyyxx
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

class MNPC extends MDecorative {
    static TALK_RADIUS = 4;
    static ANIM_FPS = 3;
    static DEBUG_RADIUS = false;

    constructor(x, y, dialogue = [], spriteKey = 'pakala') {
        super(x, y, 2, 3, (t, self) => {
            const frames = gfx.props.npcs[self.spriteKey];
            if (!frames) return gfx.props.npcs.pakala[0];
            
            //handle both animated arr and static 
            if (Array.isArray(frames)) {
                return frames[Math.floor(t * MNPC.ANIM_FPS) % frames.length];
            }
            return frames;
        });

        this.spriteKey = spriteKey;
        this.dialogue = dialogue;
        this.dialogueIndex = -1;
        this.inRange = false;
        this._prevSpace = false;

        //html junk ask arrow
        const overlay = document.getElementById('overlay');

        this._bubble = document.createElement('div');
        this._bubble.className = 'npc-bubble';
        this._bubble.style.display = 'none';
        overlay.appendChild(this._bubble);

        this._prompt = document.createElement('div');
        this._prompt.className = 'npc-prompt';
        this._prompt.textContent = 'SPACE to talk';
        this._prompt.style.display = 'none';
        overlay.appendChild(this._prompt);
    }

    tick(dt) {
        const player = this.engine?.player;
        if (!player) return;

        const events    = this.engine.events ?? {};
        const spaceNow  = !!events.Space;
        const spaceJust = spaceNow && !this._prevSpace;
        this._prevSpace = spaceNow;

        //proximity check
        const cx = this.x + 1, cy = this.y + 1.5;
        const px = player.x + player.w / 2, py = player.y + player.h / 2;
        const dist = Math.hypot(px - cx, py - cy);
        this.inRange = dist <= MNPC.TALK_RADIUS;

        // lose dialogue if player walks away
        if (!this.inRange) {
            this.dialogueIndex = -1;
        }

        //advance n' open n' close on space
        if (this.inRange && spaceJust) {
            if (this.dialogueIndex === -1) {
                this.dialogueIndex = 0;
            }
             else {
                this.dialogueIndex++;
                if (this.dialogueIndex >= this.dialogue.length) {
                    this.dialogueIndex = -1;
                }
            }
        }

        this._syncHTML();
    }

    _syncHTML() {
        if (!this.engine?.renderer) return;
        const camera = this.engine.renderer.camera;

        //pos both elements above the NPC's head
        const { x: sx, y: sy } = camera.worldToScreen(this.x + 1, this.y - 0.3);

        const talking = this.dialogueIndex >= 0 &&
                        this.dialogueIndex < this.dialogue.length;

        //yap bubble, I HATE modifying CSS with JS
        if (talking) {
            const line = this.dialogue[this.dialogueIndex];
            const progress = `${this.dialogueIndex + 1} / ${this.dialogue.length}`;
            this._bubble.innerHTML =
                `${line.replace(/\n/g, '<br>')}`+
                `<span class="npc-progress">${progress} &nbsp;[SPACE]</span>`;
            this._bubble.style.left = `${sx}px`;
            this._bubble.style.top = `${sy}px`;
            this._bubble.style.display = 'block';
        } else {
            this._bubble.style.display = 'none';
        }

        //proximity prompt stuffs
        if (this.inRange && !talking && this.dialogue.length > 0) {
            this._prompt.style.left = `${sx}px`;
            this._prompt.style.top = `${sy - 4}px`;
            this._prompt.style.display = 'block';
        } 
        else {
            this._prompt.style.display = 'none';
        }
    }

    render(ctx, camera, t, pixel) {
        super.render(ctx, camera, t, pixel);

        //for debug stuffs
        if (MNPC.DEBUG_RADIUS) {
            const { x, y } = camera.worldToScreen(this.x + 1, this.y + 1.5);
            ctx.save();
            ctx.strokeStyle = 'rgba(255,0,0,0.7)';
            ctx.lineWidth = 2;
            //I will forever use this (found out about it last month)
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(x, y, MNPC.TALK_RADIUS * camera.tsz, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    //call this when room is bye bye so we don't get 10 missed calls from the DOM
    destroy() {
        this._bubble?.remove();
        this._prompt?.remove();
    }
}