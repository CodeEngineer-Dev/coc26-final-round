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
            //the horror of destructoring, to add a break or to not add a break
            const { 
                x, 
                y 
            } = camera.worldToScreen(this.x, this.y);
            this.texturer(t, this).draw(ctx, x, y, pixel, this.facing ?? 1);
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
            this.w = w;
            this.h = h;
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
            const sprite = this.texturer(t, this);

            //offset so sprite is centered on hitbox
            const offsetX = (this.w * camera.tsz - sprite.w * pixel) / 2;
            const offsetY = (this.h * camera.tsz - sprite.h * pixel) / 2;

            sprite.draw(ctx, x + offsetX, y + offsetY, pixel, this.facing ?? 1);
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
            this.grounded = false;
            this.y += this.yv * dt;
            this.updateHitbox();
            if (this.touching(MSolid, world)) {
                this.grounded = true;
                this.y -= this.yv * dt;
                if (events.KeyW && this.yv > 0) {
                    this.yv = -jump;
                } else {
                    this.yv = 0;
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

    class MBall extends MEntity {
        constructor(player) {
            super(
                player.x + player.w / 2,
                player.y + player.h / 2,
                0, 0, 1, (t, object) => gfx.player.idle[0]
            );
            this.x = player.x + player.w / 2;
            this.y = player.y + player.h / 2;
            this.xv = 0;
            this.yv = 0;
        }
        render(ctx, camera, t, pixel) {
            const { x, y } = camera.worldToScreen(this.x, this.y);
            const sprite = this.texturer(t, this);
    
            //offset so sprite is centered on hitbox
            const offsetX = (this.w * camera.tsz - sprite.w * pixel) / 2;
            const offsetY = (this.h * camera.tsz - sprite.h * pixel) / 2;

            sprite.draw(ctx, x + offsetX, y + offsetY, pixel, this.facing ?? 1);
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
            this.state = 'idle';
            this.facing = 1;
            this.groundPounding = false;
            this.groundPoundTime = 0;
            this.impactTime = null;
            this.prevKeyS = false;
        }

        /** Tick the game forward
         * 
         * @param {number} dt 
         * @param {Object} events
         * @returns {void}
         */ 
        tick(dt, events) {
            const canGroundPound = !this.grounded && !this.groundPounding && (this.airTime ?? 0) > 0.1;
            const keySJustPressed = events.KeyS && !this.prevKeyS; 

            if (canGroundPound && keySJustPressed) {
                this.groundPounding = true;
                this.groundPoundTime = 0;
                this.impactTime = null;
                this.yv = this.engine.jump * this.engine.groundPoundMult;
            }

            this.prevKeyS = events.KeyS;

            if (this.groundPounding) this.groundPoundTime += dt;
            if (this.impactTime !== null) this.impactTime += dt;

            const physEvents = this.groundPounding
                ? { ...events, KeyW: false, KeyA: false, KeyD: false }
                : events;

            super.tick(dt, physEvents);

            if (events.Mouse) {
                this.engine.world.add(new MBall(this), 100);
            }

            if (events.KeyA) this.facing = -1;
            if (events.KeyD) this.facing = 1;

            if (this.groundPounding && this.grounded) {
                this.groundPounding = false;
                this.impactTime = 0;
                this.engine.onGroundPound?.();
            }

            const impactDuration = 0.4;
            if (this.impactTime !== null && this.impactTime > impactDuration) {
                this.impactTime = null;
            }

            if (this.groundPounding) {
                this.state = 'groundpound';
            } else if (this.impactTime !== null) {
                this.state = 'groundpoundimpact';
            } else if (!this.grounded) {
                this.airTime = (this.airTime ?? 0) + dt;
                this.state = this.yv < 0 ? 'jump' : 'fall';
            } else {
                this.airTime = 0;
                this.state = Math.abs(this.xv) > 0.5 ? 'run' : 'idle';
            }
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
            this.baseTsz = this.tsz;
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
        
        /** Focusconstrain to room bounds, zoom in if room is smaller than viewport.
         *
         * @param {MPlayer} player
         * @param {number} roomW  room width  in world units
         * @param {number} roomH  room height in world units
         */
        focusPlayerConstrained(player, roomW, roomH) {
            const cx = player.x + player.w / 2;
            const cy = player.y + player.h / 2;

            //zoom in if the room is too small to fill the canvas at baseTsz
            const tszX = this.w / roomW;
            const tszY = this.h / roomH;
            this.tsz = Math.max(this.baseTsz, tszX, tszY);

            //visible world area at the (possibly zoomed) tsz
            const vw = this.w / this.tsz;
            const vh = this.h / this.tsz;

            //clamp so the view never shows outside [0, roomW] x [0, roomH]
            const fx = Math.max(vw / 2, Math.min(roomW - vw / 2, cx));
            const fy = Math.max(vh / 2, Math.min(roomH - vh / 2, cy));

            this.focus(fx, fy);
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
        
        /** Renders everything except the player */
        renderScene(t) {
            const rb = this.engine.roomBounds;
            if (rb) {
                this.camera.focusPlayerConstrained(this.engine.player, rb.w, rb.h);
            } else {
                this.camera.focusPlayer(this.engine.player);
            }
            this.pixel = this.camera.tsz / this.res;
            this.engine.world.iterate(obj => {
                if (obj instanceof MPlayer) return; // skip player — fixes clip in snapshot
                if (this.camera.inView(obj)) obj.render(this.ctx, this.camera, t, this.pixel);
            });
        }

        /** Renders only the player */
        renderPlayer(t) {
            const player = this.engine.player;
            if (this.camera.inView(player))
                player.render(this.ctx, this.camera, t, this.pixel);
        }

        /** */
        render(t) {
            this.renderScene(t);
            this.renderPlayer(t);
            if (this.debug) { 
                this.engine.world.iterate(obj => {
                    const hbox = obj.hbox ?? obj.dbox;
                    if (!hbox) return;
                    const topLeft  = this.camera.worldToScreen(hbox.x1, hbox.y1);
                    const botRight = this.camera.worldToScreen(hbox.x2, hbox.y2);
                    this.ctx.save();
                    this.ctx.strokeStyle = "red";
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(
                        topLeft.x, topLeft.y,
                        botRight.x - topLeft.x,
                        botRight.y - topLeft.y
                    );
                    this.ctx.restore();
                });
            }
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
            const { gravity, hvel, friction, jump, groundPoundMult } = config;
            this.gravity = gravity ?? 80;
            this.hvel = hvel ?? 10;
            this.friction = friction ?? 0.000000001;
            this.jump = jump ?? 20;
            this.groundPoundMult = groundPoundMult ?? 2;
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