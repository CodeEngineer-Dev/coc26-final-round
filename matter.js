/** MBox: an AABB hitbox implementation.
 * 
 */
class MBox {
    /** Constructs an image of MBox.
     * 
     * @constructor
     * @param {number} x1 
     * @param {number} y1 
     * @param {number} x2 
     * @param {number} y2 
     */
    constructor(x1, y1, x2, y2) {
        this.set(x1, y1, x2, y2);
    }
    
    /** Alternative to new MBox for width and height
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} w 
     * @param {number} h 
     */
    fromWH(x, y, w, h) {
        return new MBox(x, y, x + w, y + h);
    }

    /** Sets the hitbox without creating a new instance.
     * 
     * @param {number} x1 
     * @param {number} y1 
     * @param {number} x2 
     * @param {number} y2 
     */
    set(x1, y1, x2, y2) {
        // Doing this makes the math easier later on
        this.x1 = Math.min(x1, x2);
        this.y1 = Math.min(y1, y2);
        this.x2 = Math.max(x1, x2);
        this.y2 = Math.max(y1, y2);
    }

    /** Sets the hitbox without creating a new instance, for width and height.
     * 
     * @param {number} x
     * @param {number} y 
     * @param {number} w 
     * @param {number} h 
     */
    setWH(x, y, w, h) {
        this.set(x, y, x + w, y + h);
    }

    /** Checks for collision with alternate MBox
     * 
     * @param {MBox} that 
     * @returns 
     */
    collision(that) {
        return (
            this.x1 <= that.x2 && that.x1 <= this.x2 &&
            this.y1 <= that.y2 && that.y1 <= this.y2
        );
    }
}

/** MObject: a general object that is rendered.
 * 
 */
class MObject {
    /** Constructs an image of MOBject.
     * 
     * @constructor
     * @param {MBox} dbox 
     * @param {CanvasImageSource} texture
     */
    constructor(dbox, texture) {
        // dbox: this is used for rendering optimization
        this.dbox = dbox;
        this.texture = texture;
    }
}

/** MDecorative: a decorative object purely for aesthetics, no function.
 * 
 */
class MDecorative extends MObject {
    /** Constructs an image of MDecorative.
     * 
     * @constructor
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {CanvasImageSource} texture
     */
    constructor(x, y, w, h, texture) {
        super(MBox.fromWH(x, y, w, h), texture);
        this.x = x;
        this.y = y;
    }

    /** Renders the thing
     * 
     * @param {CanvasRenderingContext2D} ctx 
     * @param {MCamera} camera 
     */
    render(ctx, camera) {
        const { x, y } = camera.worldToScreen(this.x, this.y);
        ctx.drawImage(this.texture, x, y);
    }
}

/** MBody: anything with a hitbox.
 * 
 */
class MBody extends MObject {
    /** Constructs an image of MBody.
     * 
     * @constructor
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {CanvasImageSource} texture
     */
    constructor(x, y, w, h, texture) {
        super(MBox.fromWH(x, y, w, h), texture);
        this.hbox = this.dbox;
        this.x = x;
        this.y = y;
    }

    /** Renders the thing
     * 
     * @param {CanvasRenderingContext2D} ctx 
     * @param {MCamera} camera 
     */
    render(ctx, camera) {
        const { x, y } = camera.worldToScreen(this.x, this.y);
        ctx.drawImage(this.texture, x, y);
    }
}

/** MSolid: anything that can be stood upon; a block.
 * 
 */
class MSolid extends MBody {
    /** Constructs an image of MSolid.
     * 
     * @constructor
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {CanvasImageSource} texture
     */
    constructor(x, y, w, h, texture) {
        super(x, y, w, h, texture);
    }
}

/** MSolid: anything that can be stood upon; a block.
 * 
 */
class MSolid extends MBody {
    /** Constructs an image of MSolid.
     * 
     * @constructor
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {CanvasImageSource} texture
     */
    constructor(x, y, w, h, texture) {
        super(x, y, w, h, texture);
    }
}

/** MHazard: any static object that can kill you.
 * 
 */
class MHazard extends MBody {
    /** Constructs an image of MHazard.
     * 
     * @constructor
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {CanvasImageSource} texture
     */
    constructor(x, y, w, h, texture) {
        super(x, y, w, h, texture);
    }
}

/** MPlayer: the player.
 * 
 */
class MPlayer extends MBody {
    /** Constructs an image of MPlayer.
     * 
     * @constructor
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {CanvasImageSource} texture
     */
    constructor(x, y, w, h, texture) {
        super(x, y, w, h, texture);
        this.sx = x;
        this.sy = y;
        this.w = w;
        this.h = h;
        this.xv = 0;
        this.yv = 0;
    }

    /** Update hitbox
     * 
     */
    updateHitbox() {
        this.hbox.setWH(this.x, this.y, this.w, this.h);
    }

    /** Goes through array, returns first element touching of type
     * 
     * @param {typeof MObject} type
     * @param {MObject[]} arr 
     */
    touching(arr) {

    }

    /** Tick the game forward
     * 
     * @param {number} dt 
     * @param {Object} keys
     * @param {MEngine} engine 
     */
    tick(dt, keys, engine) {
        const { world, gravity, hvel, friction, jump } = engine.world;
        const objs = world.objs;
        const xAccel = hvel * Math.log(friction) * delta;
        if (keys.KeyA) {
            this.xv -= xAccel;
        }
        if (keys.KeyD) {
            this.xv += xAccel;
        }
        this.x += this.xv;
        this.xv *= friction;
        
    }
}

/** MEngine class. Handles platforming logic.
 * 
 */
class MEngine {
    /** Constructs an instance of MEngine.
     * 
     * @constructor
     * @param {{ gravity?: number, hvel?: number, friction?: number, jump?: number }} options 
     */
    constructor(options) {
        const { g, h, f, j } = options;
        this.gravity = g ?? 1;
        this.hvel = h ?? 1;
        this.friction = f ?? 0.5;
        this.jump = j ?? 5;

        this.epsilon = 0.001;
    }

    /** Alternative to new MEngine.
     * 
     * @param {{ gravity?: number, hvel?: number, friction?: number, jump?: number }} options 
     * @returns 
     */
    create(options) {
        return new MEngine(options);
    }
}

//matter js setuip
const { 
    Engine: MEngine, 
    Bodies: MBodies, 
    Body: MBody,
    World: MWorld, 
    Events: MEvents
} = Matter;

const mEngine = MEngine.create({ 
    gravity: { 
        x: 0, 
        y: 0 
    } 
});
const mWorld = mEngine.world;

const mContacts = { 
    grounded: false, 
    left: false, 
    right: false,
     ceiling: false 
};
let mPlayerBody = null;
let mBlockBodies = [];
let mCpuBodies = [];

function _syncContacts(event) {
    for (const pair of event.pairs) {
        if (!mPlayerBody) continue;
        if (pair.bodyA !== mPlayerBody && pair.bodyB !== mPlayerBody) continue;

        const isA = pair.bodyA === mPlayerBody;
        const n = pair.collision.normal;
        const nx = isA ?  n.x : -n.x;
        const ny = isA ?  n.y : -n.y;

        if (ny >  0.5) mContacts.grounded = true;
        if (ny < -0.5) mContacts.ceiling = true;
        if (nx < -0.5) mContacts.left = true;
        if (nx >  0.5) mContacts.right = true;
    }
}
MEvents.on(mEngine, 'collisionStart',  _syncContacts);
MEvents.on(mEngine, 'collisionActive', _syncContacts);