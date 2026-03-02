const { MDecorative, MSolid, MHazard, MEntity, MPlayer, MEnemy, MEngine } = (() => {
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
            this.contactCooldown = 0;
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

        /** Goes through array, returns all elements touching of type
         * 
         * @param {typeof MObject} type
         * @param {MWorld} world
         * @returns {MObject[]}
         */
        touchingAll(type, world) {
            const out = [];
            world.iterate(obj => {
                if (obj instanceof type && obj?.hbox?.collision?.(this.hbox)) out.push(obj);
            });
            return out;
        }

        /** Tick the entity forward   
         * 
         * @param {number} dt 
         * @param {Object} events
         * @param {{ hvel?: number, jump?: number }} [attributes={}]
         * @returns {void}
         */
        tick(dt, events, attributes={}) {
            const hvel = attributes.hvel ?? this.engine.hvel;
            const jump = attributes.jump ?? this.engine.jump;
            const friction = attributes.friction ?? this.engine.friction;
            const gravity = attributes.gravity ?? this.engine.gravity;
            const world = this.engine.world;
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
        constructor(player, xv, yv) {
            super(
                player.x + player.w / 2,
                player.y + player.h / 2,
                0, 0, 1, (t, object) => gfx.player.idle[0]
            );
            this.x = player.x + player.w / 2;
            this.y = player.y + player.h / 2;
            this.px = this.x;
            this.py = this.y;
            this.xv = xv;
            this.yv = yv;
            this.engine = player.engine;
            this.dead = false;
        }
        render(ctx, camera, t, pixel) {
            const { x, y } = camera.worldToScreen(this.x, this.y);
            const sprite = this.texturer(t, this);
    
            //offset so sprite is centered on hitbox
            const offsetX = (this.w * camera.tsz - sprite.w * pixel) / 2;
            const offsetY = (this.h * camera.tsz - sprite.h * pixel) / 2;

            sprite.draw(ctx, x + offsetX, y + offsetY, pixel, this.facing ?? 1);
        }
        /** Tick the ball forward   
         * 
         * @param {number} dt 
         * @returns {void}
         */
        tick(dt) {
            this.px = this.x;
            this.py = this.y;
            const { world, gravity } = this.engine;
            this.x += this.xv * dt;
            this.updateHitbox();
            const xt = this.touching(MSolid, world);
            if (xt) {
                // doing this makes things MUCH more convenient
                // when teleporting
                if (this.xv > 0) {
                    this.x = xt.hbox.x1;
                } else {
                    this.x = xt.hbox.x2;
                }
                this.dead = true;
            }
            this.yv += gravity * dt;
            this.y += this.yv * dt;
            this.updateHitbox();
            const yt = this.touching(MSolid, world);
            if (yt) {
                if (this.yv > 0) {
                    this.y = yt.hbox.y1;
                } else {
                    this.y = yt.hbox.y2;
                }
                this.dead = true;
            }
            this.updateHitbox();
            if (this.touching(MHazard, world)) {
                this.dead = true;
            }
        }
    }

    /** MPlayer: the player.
     * 
     */
    class MPlayer extends MEntity {
        static throwFactor = 10;

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
            this.dragging = false;
            this.dragInitX = 0;
            this.dragInitY = 0;
            this.dragX = 0;
            this.dragY = 0;
            this.ball = null;
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
            this.ball?.tick?.(dt, {}, { friction: 1 });

            if (events.Mouse && !eventsPrev.Mouse && !this.ball) {
                this.dragging = true;
                this.dragInitX = events.MouseX;
                this.dragInitY = events.MouseY;
                this.dragX = events.MouseX;
                this.dragY = events.MouseY;
            } else if (events.Mouse && this.dragging) {
                this.dragX = events.MouseX;
                this.dragY = events.MouseY;
            } else if (!events.Mouse && this.dragging) {
                this.dragging = false;
                const tsz = this.engine.renderer.camera.tsz;
                this.ball = new MBall(this,
                    (this.dragX - this.dragInitX) / tsz * this.constructor.throwFactor,
                    (this.dragY - this.dragInitY) / tsz * this.constructor.throwFactor,
                );
            } else if ((events.Mouse && this.ball) || this.ball?.dead) {
                const epsilon = this.engine.epsilon;
                if (this.ball.xv > 0) {
                    this.x = this.ball.hbox.x2 - this.w - epsilon;
                } else {
                    this.x = this.ball.hbox.x1 + epsilon;
                }
                if (this.ball.yv > 0) {
                    this.y = this.ball.hbox.y2 - this.h - epsilon;
                } else {
                    this.y = this.ball.hbox.y1 + epsilon;
                }
                this.updateHitbox();

                /*
                const solidsTouched = this.touchingAll(MSolid, this.engine.world);
                const collisions = [];
                
                // this is a mechanic originating from xyzyyxx's platformer engine
                // adapted to this situation
                for (const s of solidsTouched) {
                    // this is an array for the four directions the ball could've
                    // collided with the solid
                    const collCandidates = [];

                    // logic: rt gets the time at which it was collided
                    // ry gets the ball's y position at the time, to verify if it's
                    // legit and not off the segment
                    const rt = antilerp(this.ball.px, this.ball.x, s.hbox.x1);
                    const ry = lerp(this.ball.py, this.ball.y, rt);
                    if (rt >= 0 && rt <= 1 && ry >= s.hbox.y1 && ry <= s.hbox.y2) {
                        collCandidates.push({ t: rt, solid: s, side: "r" });
                    }

                    // same for all 4 sides
                    // down
                    const dt = antilerp(this.ball.py, this.ball.y, s.hbox.y1);
                    const dx = lerp(this.ball.px, this.ball.x, dt);
                    if (dt >= 0 && dt <= 1 && dx >= s.hbox.x1 && dx <= s.hbox.x2) {
                        collCandidates.push({ t: dt, solid: s, side: "d" });
                    }

                    // left
                    const lt = antilerp(this.ball.px, this.ball.x, s.hbox.x2);
                    const ly = lerp(this.ball.py, this.ball.y, rt);
                    if (lt >= 0 && lt <= 1 && ly >= s.hbox.y1 && ly <= s.hbox.y2) {
                        collCandidates.push({ t: lt, solid: s, side: "l" });
                    }

                    // up
                    const ut = antilerp(this.ball.py, this.ball.y, s.hbox.y2);
                    const ux = lerp(this.ball.ux, this.ball.x, ut);
                    if (ut >= 0 && ut <= 1 && ux >= s.hbox.x1 && ux <= s.hbox.x2) {
                        collCandidates.push({ t: ut, solid: s, side: "u" });
                    }
                    window.console.log(this.ball, s, collCandidates);
                    // add to collisions the first of the four
                    collisions.push(collCandidates.reduce((min, current) => {
                        if (!min || min.t > current.t) {
                            return current;
                        } else {
                            return min;
                        }
                    }));
                }

                // sort collisions by earliest to latest
                collisions.sort((a, b) => a.t - b.t);

                for (const coll in collisions) {
                    if (this.hbox.collide(coll.solid.hbox)) {
                        switch (coll.side) {
                            case "r": this.x = coll.solid.x - this.w; break;
                            case "d": this.y = coll.solid.y - this.h; break;
                            case "l": this.x = coll.solid.x + coll.solid.w; window.console.log(coll); break;
                            case "u": this.y = coll.solid.y + coll.solid.h; break;
                        }
                        this.updateHitbox();
                    }
                }*/

                this.ball = null;
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

        /** Renders the thing
         * 
         * @param {CanvasRenderingContext2D} ctx 
         * @param {MCamera} camera 
         * @param {number} t
         * @param {number} pixel
         * @returns {void}
         */
        render(ctx, camera, t, pixel) {
            super.render(ctx, camera, t, pixel);
            this.ball?.render?.(ctx, camera, t, pixel);
            if (this.dragging) {
                const { x, y } = camera.worldToScreen(
                    this.x + this.w / 2,
                    this.y + this.h / 2
                );
                ctx.save();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(
                    x + this.dragX - this.dragInitX,
                    y + this.dragY - this.dragInitY
                );
                ctx.stroke();
                ctx.restore();
            }
        }
        
    }

    /** base class for all enemies extend this with `extends MEnemy`.
     *  AI subclasses signal movement via _moveLeft / _moveRight / _jumpQueued
     *  flags set inside ai(dt), which are consumed each physics tick.
     */
    class MEnemy extends MEntity {
        /**
         * @param {number} x
         * @param {number} y
         * @param {number} w
         * @param {number} h
         * @param {number} maxHealth
         * @param {(number, MEnemy) => SpriteRef} texturer
         */
        constructor(x, y, w, h, maxHealth, texturer) {
            super(x, y, w, h, maxHealth, texturer);
            this.state = 'idle';
            this.facing = 1;
            this.dead = false;
            this.stateTime = 0;
            
            //physics intent flags set in ai(), consumed in tick()
            this._moveLeft = false;
            this._moveRight = false;
            this._jumpQueued = false;

            this._path = null;
            this._pathTimer = 0;
            this._pathStuck = 0;
        }

        /** Override in subclasses to implement AI behaviour.
         *  Set this._moveLeft / _moveRight / _jumpQueued as needed.
         * @param {number} dt
         */
        ai(dt) {
            const dist = this._playerDist();

            if (!this.chaseMode && dist <= this.aggroRange)  this.chaseMode = true;
            if (this.chaseMode  && dist >  this.deAggroRange) this.chaseMode = false;

            if (this.chaseMode) {this._updatePath(dt, 0.5); 

                if (this._path?.length) {
                    this._followPath(dt);
                } 
                else {  
                    const hDir = this._playerHDir();
                    if (hDir ===  1) this._moveRight = true;
                    if (hDir === -1) this._moveLeft = true;
                    this.facing = hDir || this.facing;
                }
            } else {
                if (this.patrolDir === 1) this._moveRight = true;
                else this._moveLeft  = true;
                this.facing = this.patrolDir;

                if (this.grounded && Math.abs(this.xv) < 0.15) {
                    this.stallTimer += dt;
                    if (this.stallTimer > 0.25) { this.patrolDir *= -1; this.stallTimer = 0; }
                } else { this.stallTimer = 0; }

                this.jumpCooldown -= dt;
                if (this.grounded && this.jumpCooldown <= 0) {
                    this._jumpQueued  = true;
                    this.jumpCooldown = 1.5 + Math.random() * 2;
                }
            }

            this.state = this.grounded ? 'idle' : 'jump';
        }
        
        /** Returns signed horizontal distance to player (positive = player is right). */
        _playerDX() {
            const p = this.engine?.player;
            if (!p) return 0;
            return (p.x + p.w / 2) - (this.x + this.w / 2);
        }

        /** Returns signed vertical distance to player (positive = player is below). */
        _playerDY() {
            const p = this.engine?.player;
            if (!p) return 0;
            return (p.y + p.h / 2) - (this.y + this.h / 2);
        }

        /** Returns Euclidean distance to player. */
        _playerDist() {
            const dx = this._playerDX(), dy = this._playerDY();
            return Math.sqrt(dx * dx + dy * dy);
        }

        /** Returns true if player is within `range` world units. */
        _playerInRange(range) {
            return this._playerDist() <= range;
        }

        /** Returns -1 / 0 / 1: which horizontal direction the player is in. */
        _playerHDir() {
            const dx = this._playerDX();
            return dx === 0 ? 0 : (dx > 0 ? 1 : -1);
        }
        
        /**
         * Requests a fresh path to the player via the engine's graph.
         * it has interval to keep it fast
         * @param {number} dt
         * @param {number} [interval=0.5]
         */
        _updatePath(dt, interval = 0.5) {
            this._pathTimer -= dt;
            if (this._pathTimer > 0) return;
            this._pathTimer = interval;

            const p = this.engine?.player;
            const g = this.engine?.graph;
            if (!p || !g) return;

            this._path = g.findPath(this.x, this.y, p.x, p.y);
        }

        /**
         * Follows the current path one step at a time.
         * Sets _moveLeft / _moveRight / _jumpQueued so MEntity.tick() handles physics.
         * @param {number} dt
         */
        _followPath(dt) {
            if (!this._path?.length) return;

            const step = this._path[0];
            const targetX = step.c + 0.5; 
            const myX = this.x + this.w / 2;
            const dx = targetX - myX;

            //steer horizontally toward waypoint
            if (Math.abs(dx) > 0.12) {
                if (dx > 0) this._moveRight = true;
                else this._moveLeft  = true;
                this.facing = dx > 0 ? 1 : -1;
            }

            //fire jump when the step requires it and we are on the ground
            if (step.jump && this.grounded) this._jumpQueued = true;

            //stuck detection
            if (this.grounded && Math.abs(this.xv) < 0.1 && Math.abs(dx) > 0.4) {
                this._pathStuck += dt;
                if (this._pathStuck > 0.4) { this._path.shift(); this._pathStuck = 0; }
            } else {
                this._pathStuck = 0;
            }

            //advance to next waypoint once close enough
            if (Math.abs(dx) < 0.35) { this._path.shift(); this._pathStuck = 0; }
        }

        /** @param {number} dt */
            tick(dt) {
                if (this.dead) return;

                if (this.contactCooldown > 0) this.contactCooldown -= dt;

                const player = this.engine?.player;
                if (player && this.hbox.collision(player.hbox) && this.contactCooldown <= 0) {
                    this.onPlayerContact(player);
                    this.contactCooldown = 0.6;
                }

                this.stateTime += dt;
                this.ai(dt);

                const fakeEvents = {
                    KeyA: this._moveLeft,
                    KeyD: this._moveRight,
                    KeyW: this._jumpQueued,
                };
                this._moveLeft = this._moveRight = this._jumpQueued = false;

                super.tick(dt, fakeEvents);
            }

        /** Called every frame the enemy overlaps the player.
         *  Override in subclasses for custom contact effects.
         * @param {MPlayer} player
         */
        onPlayerContact(player) {
            //nock the player back and deal 1 heart of damage (33 hp)
            player.xv = (player.x < this.x ? -1 : 1) * 15;
            player.yv = -10;
            player.health = Math.max(0, player.health - 34);
        }

        /** @param {number} amount */
        takeDamage(amount) {
            this.health -= amount;
            if (this.health <= 0) this.die();
        }

        die() {
            if (this.dead) return;
            this.dead = true;
            const world = this.engine?.world;
            if (!world) return;
            for (const z of world.indices) {
                const arr = world.zia[z];
                const idx = arr.indexOf(this);
                if (idx !== -1) { 
                    arr.splice(idx, 1); 
                    break; 
                }
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
            this.epsilon = 0.001; // small value to prevent unwanted collisions
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
            
            //tick every enemy each frame
            this.world.iterate(obj => {
                if (obj instanceof MEnemy) obj.tick(dt);
            });
        }
    }
    return { MDecorative, MSolid, MHazard, MEntity, MPlayer, MEnemy, MEngine };
})();