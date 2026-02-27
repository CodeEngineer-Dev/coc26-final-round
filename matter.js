const { MDecorative, MSolid, MHazard, MEntity, MPlayer, MEngine } = (() => {
    /** MBox: an AABB hitbox implementation.
     * 
     */
    class MBox {
        /** Constructs an instance of MBox.
         * 
         * @constructor
         * @param {number} x1 
         * @param {number} y1 
         * @param {number} x2 
         * @param {number} y2 
         */
        constructor(x1, y1, x2, y2) {
            this.engine = null;
            this.set(x1, y1, x2, y2);
        }
        
        /** Alternative to new MBox for width and height
         * 
         * @param {number} x 
         * @param {number} y 
         * @param {number} w 
         * @param {number} h 
         * @returns {void}
         */
        static fromWH(x, y, w, h) {
            return new MBox(x, y, x + w, y + h);
        }

        /** Sets the hitbox without creating a new instance.
         * 
         * @param {number} x1 
         * @param {number} y1 
         * @param {number} x2 
         * @param {number} y2 
         * @returns {void}
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
         * @returns {void}
         */
        setWH(x, y, w, h) {
            this.set(x, y, x + w, y + h);
        }

        /** Checks for collision with alternate MBox
         * 
         * @param {MBox} that 
         * @returns {boolean}
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
        /** Constructs an instance of MOBject.
         * 
         * @constructor
         * @param {MBox} dbox 
         * @param {(number, MObject) => SpriteRef} texturer
         */
        constructor(dbox, texturer) {
            // dbox: this is used for rendering optimization
            this.dbox = dbox;
            this.texturer = texturer;
        }
    }

    /** MDecorative: a decorative object purely for aesthetics, no function.
     * 
     */
    class MDecorative extends MObject {
        /** Constructs an instance of MDecorative.
         * 
         * @constructor
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         * @param {(number, MObject) => SpriteRef} texturer
         */
        constructor(x, y, w, h, texturer) {
            super(MBox.fromWH(x, y, w, h), texturer);
            this.x = x;
            this.y = y;
        }

        /** Renders the thing
         * 
         * @param {CanvasRenderingContext2D} ctx 
         * @param {MCamera} camera 
         * @param {number} t
         * @param {number} pixel
         * @returns {void}
         */
        render(ctx, camera, t, pixel) {
            const { x, y } = camera.worldToScreen(this.x, this.y);
            ctx.drawImage(this.texturer(t, this), x, y, pixel);
        }
    }

    /** MBody: anything with a hitbox.
     * 
     */
    class MBody extends MObject {
        /** Constructs an instance of MBody.
         * 
         * @constructor
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         * @param {(number, MObject) => SpriteRef} texturer
         */
        constructor(x, y, w, h, texturer) {
            super(MBox.fromWH(x, y, w, h), texturer);
            this.hbox = this.dbox;
            this.x = x;
            this.y = y;
        }

        /** Renders the thing
         * 
         * @param {CanvasRenderingContext2D} ctx 
         * @param {MCamera} camera 
         * @param {number} t
         * @param {number} pixel
         * @returns {void}
         */
        render(ctx, camera, t, pixel) {
            const { x, y } = camera.worldToScreen(this.x, this.y);
            this.texturer(t, this).draw(ctx, x, y, pixel);
        }
    }

    /** MSolid: anything that can be stood upon; a block.
     * 
     */
    class MSolid extends MBody {
        /** Constructs an instance of MSolid.
         * 
         * @constructor
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         * @param {(number, MObject) => SpriteRef} texturer
         */
        constructor(x, y, w, h, texturer) {
            super(x, y, w, h, texturer);
        }
    }

    /** MHazard: any static object that can kill you.
     * 
     */
    class MHazard extends MBody {
        /** Constructs an instance of MHazard.
         * 
         * @constructor
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         * @param {(number, MObject) => SpriteRef} texturer
         */
        constructor(x, y, w, h, texturer) {
            super(x, y, w, h, texturer);
        }
    }

    /** MEntity: any movable entity.
     * 
     */
    class MEntity extends MBody {
        /** Constructs an instance of MEntity.
         * 
         * @constructor
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         * @param {(number, MObject) => SpriteRef} texturer
         */
        constructor(x, y, w, h, maxHealth, texturer) {
            super(x, y, w, h, texturer);
            this.sx = x;
            this.sy = y;
            this.w = w;
            this.h = h;
            this.xv = 0;
            this.yv = 0;
            this.maxHealth = maxHealth;
            this.health = this.maxHealth;
        }

        /** Update hitbox
         * 
         * @returns {void}
         */
        updateHitbox() {
            this.hbox.setWH(this.x, this.y, this.w, this.h);
        }

        /** Goes through array, returns first element touching of type
         * 
         * @param {typeof MObject} type
         * @param {MWorld} world
         * @returns {MObject?}
         */
        touching(type, world) {
            return world.iterate(obj => {
                if (obj instanceof type && obj?.hbox?.collision?.(this.hbox)) return obj;
            });
        }

        /** Tick the game forward
         * 
         * @param {number} dt 
         * @param {Object} events
         * @param {{ hvel?: number, jump?: number }} [attributes={}]
         * @returns {void}
         */
        tick(dt, events, attributes={}) {
            const hvel = attributes.hvel ?? this.engine.hvel;
            const jump = attributes.jump ?? this.engine.jump;
            const { world, gravity, friction } = this.engine;
            const xAccel = -hvel * Math.log(friction);
            if (events.KeyA) {
                this.xv -= xAccel * dt;
            }
            if (events.KeyD) {
                this.xv += xAccel * dt;
            }
            this.xv *= Math.pow(friction, dt);
            this.x += this.xv * dt;
            this.updateHitbox();
            if (this.touching(MSolid, world)) {
                this.x -= this.xv * dt;
                this.xv = 0;
                this.updateHitbox();
            }
            this.yv += gravity * dt;
            this.y += this.yv * dt;
            this.updateHitbox();
            if (this.touching(MSolid, world)) {
                this.y -= this.yv * dt;
                this.yv = 0;
                if (events.KeyW) {
                    this.yv = -jump;
                }
                this.updateHitbox();
            }
            if (this.touching(MHazard, world)) {
                this.x = this.sx;
                this.y = this.sy;
                this.health = this.maxHealth;
                this.updateHitbox();
            }
        }
    }

    /** MPlayer: the player.
     * 
     */
    class MPlayer extends MEntity {
        /** Constructs an instance of MPlayer.
         * 
         * @constructor
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         * @param {(number, MObject) => SpriteRef} texturer
         */
        constructor(x, y, w, h, texturer) {
            super(x, y, w, h, 100, texturer);
        }

        /** Tick the game forward
         * 
         * @param {number} dt 
         * @param {Object} events
         * @returns {void}
         */
        tick(dt, events) {
            super.tick(dt, events);
        }
    }

    /** MWorld class.
     * 
     */
    class MWorld {
        /** Constructs an instance of MWorld.
         * 
         * @constructor
         */
        constructor(engine) {
            // z indexed array
            this.zia = {};
            this.indices = []; // important: must ALWAYS be in ascending order
            this.engine = engine;
        }

        /** Adds an object to the MWorld.
         * 
         * @param {MObject} obj 
         * @param {number} [z=0]
         * @returns {void}
         */
        add(obj, z=0) {
            if (!this.zia[z]) {
                this.zia[z] = [];
                // find the index at which to put z into indices
                let i = 0;
                while (i < this.indices.length && this.indices[i] < z) i ++;
                this.indices.splice(i, 0, z); // At index i, remove 0 elements, and insert z
            }
            this.zia[z].push(obj);
            obj.engine = this.engine;
        }

        /** Iterates through the z indexed array with a callback. If the callback
         * returns a value, it breaks and returns that value.
         * 
         * @param {MObject => any} callback 
         * @returns {any}
         */
        iterate(callback) {
            // go through in ASCENDING order
            for (const i of this.indices) {
                for (const obj of this.zia[i]) {
                    const retval = callback(obj);
                    if (typeof retval !== "undefined") return retval;
                }
            }
        }
    }

    /** MCamera class. Moves between world and screen, also determines if in view.
     * 
     */
    class MCamera {
        /** Constructs an instance of MCamera.
         * 
         * @constructor
         * @param {{ canvas: HTMLCanvasElement, tileSize?: number }} config 
         */
        constructor(config) {
            const { canvas, tileSize } = config;
            this.canvas = canvas;
            this.tsz = tileSize ?? 20;
            this.viewBox = new MBox(0, 0, 0, 0);
            this.focus(0, 0);
        }

        /** Gets canvas width and height. */
        get w() { return this.canvas.effectiveWidth ?? this.canvas.width; }
        get h() { return this.canvas.effectiveHeight ?? this.canvas.height; }

        /** Focus the camera at a particular (world) point.
         * 
         * @param {number} x 
         * @param {number} y 
         * @returns {void}
         */
        focus(x, y) {
            this.focusX = x;
            this.focusY = y;
            this.viewBox.setWH(
                this.focusX - this.w / this.tsz / 2,
                this.focusY - this.h / this.tsz / 2,
                this.w / this.tsz, this.h / this.tsz
            );
        }

        /** Focus the camera at the player.
         * 
         * @param {MPlayer} player 
         * @returns {void}
         */
        focusPlayer(player) {
            this.focus(player.x + player.w / 2, player.y + player.h / 2);
        }

        /** Returns true if the object is currently in view.
         * 
         * @param {*} obj 
         * @returns {boolean}
         */
        inView(obj) {
            return obj?.dbox?.collision?.(this.viewBox) ?? false;    
        }

        /** Takes world coordinates, returns screen coordinates.
         * 
         * @param {number} x 
         * @param {number} y 
         * @returns {{ x: number, y: number }}
         */
        worldToScreen(x, y) {
            return {
                x: (x - this.focusX) * this.tsz + this.w / 2,
                y: (y - this.focusY) * this.tsz + this.h / 2,
            };
        }

        /** Takes screen coordinates, returns world coordinates.
         * 
         * @param {number} x 
         * @param {number} y 
         * @returns {{ x: number, y: number }}
         */
        screenToWorld(x, y) {
            return {
                x: (x - this.w / 2) / this.tsz + this.focusX,
                y: (y - this.w / 2) / this.tsz + this.focusY,
            };
        }
    }

    /** MRenderer class. Handles rendering logic.
     * 
     */
    class MRenderer {
        /** Constructs an instance of MCamera.
         * 
         * @constructor
         * @param {MEngine} engine
         * @param {HTMLCanvasElement} canvas 
         * @param {number} [tileSize=36]
         * @param {number} [resolution=9]
         */
        constructor(engine, canvas, tileSize=36, resolution=9) {
            this.engine = engine;
            this.canvas = canvas;
            this.ctx = canvas.getContext("2d");
            this.tsz = tileSize;
            this.res = resolution;
            this.pixel = tileSize / resolution;
            this.camera = new MCamera({ canvas: this.canvas, tileSize: this.tsz });
        }

        /** Renders everything.
         * 
         * @returns {void}
         */
        render(t) {
            this.camera.focusPlayer(this.engine.player);
            this.engine.world.iterate(obj => {
                if (this.camera.inView(obj)) obj.render(this.ctx, this.camera, t, this.pixel);
            });
        }
    }

    /** MEngine class. Handles platforming logic.
     * 
     */
    class MEngine {
        /** Constructs an instance of MEngine.
         * 
         * @constructor
         * @param {{ gravity?: number, hvel?: number, friction?: number, jump?: number }} [config={}]
         */
        constructor(config={}) {
            const { gravity, hvel, friction, jump } = config;
            this.gravity = gravity ?? 80;
            this.hvel = hvel ?? 10;
            this.friction = friction ?? 0.000000001;
            this.jump = jump ?? 20;
            this.renderer = null;
            this.world = new MWorld(this);
            
        }

        /** Alternative to new MEngine.
         * 
         * @param {{ gravity?: number, hvel?: number, friction?: number, jump?: number }} [options={}]
         * @returns {MEngine}
         */
        static create(options={}) {
            return new MEngine(options);
        }

        /**
         * 
         * @param {number} sx 
         * @param {number} sy 
         * @param {number} w 
         * @param {number} h 
         * @param {(number, MObject) => SpriteRef} texturer 
         */
        createPlayer(sx, sy, w, h, texturer) {
            this.player = new MPlayer(sx, sy, w, h, texturer);
            // Everything layer 0 and below is behind the player
            // Everything layer 1 and above is above the player
            this.world.add(this.player, 1);
        }

        /** Set render configs
         * 
         * @param {HTMLCanvasElement} canvas
         * @param {number} tileSize
         * @param {number} resolution
         * @returns {MEngine}
         */
        setRenderConfig(canvas, tileSize, resolution) {
            this.renderer = new MRenderer(this, canvas, tileSize, resolution);
            return this;
        }



        /** Tick step forward
         * 
         * @param {number} t 
         * @param {number} dt 
         * @returns {void}
         */
        tick(t, dt, events) {
            this.renderer.render(t);
            this.player.tick(dt, events);
        }
    }
    return { MDecorative, MSolid, MHazard, MEntity, MPlayer, MEngine };
})();