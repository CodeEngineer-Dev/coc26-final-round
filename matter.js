const { MDecorative, MSolid, MHazard, MEntity, MPlayer, MEnemy, MEngine, MCheckpoint, MNPC, MBlob } = (() => {
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
            this.room = null;
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

        /** Transport entity to a different room if it enters one
         * 
         * @returns {void}
         */
        transport() {
            this.engine.world.transportEntity(this);
        }

        /** Goes through array, returns first element touching of type
         * 
         * @param {typeof MObject} type
         * @param {MWorld} world
         * @returns {MObject?}
         */
        touching(type, world) {
            return world.iterateRoom(this.room, obj => {
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
            world.iterateRoom(this.room, obj => {
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
            this.transport();
            if (this.touching(MSolid, world)) {
                this.x -= this.xv * dt;
                this.xv = 0;
                this.transport();
            }
            this.yv += gravity * dt;
            this.grounded = false;
            this.y += this.yv * dt;
            this.transport();
            if (this.touching(MSolid, world)) {
                this.grounded = true;
                this.y -= this.yv * dt;
                if (events.KeyW && this.yv > 0) {
                    this.yv = -jump;
                } else {
                    this.yv = 0;
                }
                this.transport();
            }
            if (this.touching(MHazard, world)) {
                this.x = this.sx;
                this.y = this.sy;
                this.health = this.maxHealth;
                this.transport();
            }
        }
    }

    class MBall extends MEntity {
        static bounce = 0.65;

        constructor(player, xv, yv) {
            const w = 1, h = 1;
            super(
                player.x + player.w / 2 - w / 2,
                player.y + player.h / 2 - h / 2,
                w, h, 1, () => gfx.player.spikeBall
            );
            this.xv = xv;
            this.yv = yv;
            this.engine = player.engine;
            this.room = player.room;
            this.angle = 0;
            this._hitCooldowns = new Map();
        }

        render(ctx, camera, t, pixel) {
            const { x, y } = camera.worldToScreen(this.x, this.y);
            const sprite = this.texturer(t, this);
            const sw = sprite.w * pixel;
            const sh = sprite.h * pixel;
            const cx = x + (this.w * camera.tsz) / 2;
            const cy = y + (this.h * camera.tsz) / 2;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(this.angle);
            sprite.draw(ctx, -sw / 2, -sh / 2, pixel);
            ctx.restore();
        }

        tick(dt) {
            const { world, gravity, epsilon } = this.engine;

            this.x += this.xv * dt;
            this.transport();
            const xt = this.touching(MSolid, world);
            if (xt) {
                this.x = this.xv > 0 ? xt.hbox.x1 - this.w - epsilon : xt.hbox.x2 + epsilon;
                this.xv *= -MBall.bounce;
            }

            this.yv += gravity * dt;
            this.y += this.yv * dt;
            this.transport();
            const yt = this.touching(MSolid, world);
            if (yt) {
                this.y = this.yv > 0 ? yt.hbox.y1 - this.h - epsilon : yt.hbox.y2 + epsilon;
                this.yv *= -MBall.bounce;
            }

            //tick down per-enemy hit cooldowns
            for (const [enemy, cd] of this._hitCooldowns) {
                const remaining = cd - dt;
                if (remaining <= 0) this._hitCooldowns.delete(enemy);
                else this._hitCooldowns.set(enemy, remaining);
            }

            //enemy collision bounce and deal damage
            const hitEnemies = this.touchingAll(MEnemy, world);
            for (const enemy of hitEnemies) {
                if (enemy.dead || this._hitCooldowns.has(enemy)) continue;

                //reflect whichever axis has less overlap (same logic as solid)
                const dx = (this.x + this.w / 2) - (enemy.x + enemy.w / 2);
                const dy = (this.y + this.h / 2) - (enemy.y + enemy.h / 2);
                if (Math.abs(dx) >= Math.abs(dy)) {
                    this.xv *= -MBall.bounce;
                } else {
                    this.yv *= -MBall.bounce;
                }

                enemy.takeDamage(30);
                //grace peroid is 300ms
                this._hitCooldowns.set(enemy, 0.3);
            }

            //spin proportional to horizontal speed
            this.angle += this.xv * dt * 3;
            this.transport();
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
            this.prevMouse = false;
            this.dragging = false;
            this.dragInitX = 0;
            this.dragInitY = 0;
            this.dragX = 0;
            this.dragY = 0;
            this.ball = null;

            this.maxDrag = 120;
        }


        _separateFromEnemies() {
            const room = this.room;
            const world = this.engine?.world;
            if (!room || !world) return;

            for (const z of room.indices) {
                for (const obj of room.zia[z]) {
                    if (!(obj instanceof MEnemy) || obj.dead) continue;

                    const overlapX = (this.x + this.w / 2) - (obj.x + obj.w / 2);
                    const overlapY = (this.y + this.h / 2) - (obj.y + obj.h / 2);
                    const minDistX = (this.w + obj.w) / 2;
                    const minDistY = (this.h + obj.h) / 2;
                    const absX = Math.abs(overlapX);
                    const absY = Math.abs(overlapY);

                    if (absX < minDistX && absY < minDistY) {
                        if (minDistX - absX < minDistY - absY) {
                            //horizontal
                            const push = minDistX - absX;
                            const prevX = this.x;
                            this.x += overlapX > 0 ? push : -push;
                            this.updateHitbox();
                            if (this.touching(MSolid, world)) {
                                this.x = prevX;
                                this.updateHitbox();
                                const prevObjX = obj.x;
                                obj.x += overlapX > 0 ? -push : push;
                                obj.updateHitbox();
                                if (obj.touching(MSolid, world)) {
                                    obj.x = prevObjX;
                                    obj.updateHitbox();
                                }
                            }
                        } else {
                            //vertical
                            const push = minDistY - absY;
                            if (overlapY < 0) {
                                this._groundedOnEnemy = true;
                                if (this._standingOnEnemy !== obj) {
                                    this._standingOnEnemy = obj;
                                    this._standingOnEnemyTimer = 0;
                                }
                                this._standingOnEnemyTimer += this.engine.lastDt ?? 0;
                                if (this._standingOnEnemyTimer >= 1.0) {
                                    this._standingOnEnemyTimer = 0;
                                    obj.onPlayerContact(this);
                                }

                                //player on top of enemy
                                this.y -= push;
                                this.yv = Math.min(this.yv, 0);
                                this.grounded = true;
                                this.updateHitbox();

                                //player should be able to jumnp of enemy...
                                const events = this.engine.events ?? {};
                                if (events.KeyW) {
                                    this.yv = -this.engine.jump;
                                    this.grounded = false;  
                                }
                            } else {
                                //player above enemy
                                const prevY = this.y;
                                this.y += push;
                                this.updateHitbox();
                                if (this.touching(MSolid, world)) {
                                    this.y = prevY;
                                    this.updateHitbox();
                                }
                            }
                        }
                    }
                }
            }
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
            if (!this._groundedOnEnemy) {
                this._standingOnEnemy = null;
                this._standingOnEnemyTimer = 0;
            }
            this._groundedOnEnemy = false;

            this._separateFromEnemies();
            this.ball?.tick?.(dt, {}, { friction: 1 });

            //during slowmo keep ball glued to player center so they fall together
            if (this.ball && this.engine.slowMo) {
                this.ball.x = this.x + this.w / 2 - this.ball.w / 2;
                this.ball.y = this.y + this.h / 2 - this.ball.h / 2;
                this.ball.room = this.room;
                this.ball.updateHitbox();
            }

            if (events.Mouse && !this.prevMouse && !this.ball) {
                //start drag
                this.dragging = true;
                this.dragInitX = events.MouseX;
                this.dragInitY = events.MouseY;
                this.dragX = events.MouseX;
                this.dragY = events.MouseY;

            } else if (events.Mouse && this.dragging) {
                //update drag
                this.dragX = events.MouseX;
                this.dragY = events.MouseY;

            } else if (!events.Mouse && this.dragging) {
                //release an' throw ball, exit any existing slowmo
                this.dragging = false;
                this.engine.slowMo = false;
                //discard if one existed during slowmo...
                this.ball = null;
                const tsz = this.engine.renderer.camera.tsz;
                let dx = this.dragX - this.dragInitX;
                let dy = this.dragY - this.dragInitY;
                const maxDrag = 120;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len > maxDrag) { 
                    dx = dx / len * maxDrag; 
                    dy = dy / len * maxDrag; 
                }
                this.ball = new MBall(this,
                    dx / tsz * MPlayer.throwFactor,
                    dy / tsz * MPlayer.throwFactor,
                );

            } else if (events.Mouse && !this.prevMouse && this.ball) {
                //click while ball is out so holding and dragging right away works for quick chaining
                this.x = this.ball.x + this.ball.w / 2 - this.w / 2;
                this.y = this.ball.y + this.ball.h / 2 - this.h / 2;
                this.xv = this.ball.xv;
                this.yv = this.ball.yv;
                this.room = this.ball.room;
                this.transport();
                this.engine.slowMo = true;
                //ball stays alive
                this.dragging = true;
                this.dragInitX = events.MouseX;
                this.dragInitY = events.MouseY;
                this.dragX = events.MouseX;
                this.dragY = events.MouseY;

                //push player out of any wall they landed in
                const world = this.engine.world;
                this.updateHitbox();
                if (this.touching(MSolid, world)) {
                    //try nudging in the direction the ball was travelling
                    const nudges = [
                        [Math.sign(this.xv) * (this.w + this.engine.epsilon), 0],
                        [0, Math.sign(this.yv) * (this.h + this.engine.epsilon)],
                        [-Math.sign(this.xv) * (this.w + this.engine.epsilon), 0],
                        [0, -Math.sign(this.yv) * (this.h + this.engine.epsilon)],
                    ];
                    for (const [nx, ny] of nudges) {
                        this.x += nx;
                        this.y += ny;
                        this.updateHitbox();
                        if (!this.touching(MSolid, world)) break;
                        this.x -= nx;
                        this.y -= ny;
                        this.updateHitbox();
                    }
                }
                this.transport();
            }

            //exit slowmo on keypress or on landing also pretty important
            if (this.engine.slowMo) {
                if (events.KeyA || events.KeyD || events.KeyW || events.KeyS) {
                    this.engine.slowMo = false;
                    this.ball = null;
                }
                if (this.grounded && !this._wasGrounded) {
                    this.engine.slowMo = false;
                    this.ball = null;
                }
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

            this._wasGrounded = this.grounded;
            this.prevMouse = events.Mouse;
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
            if (this.ball?.room == this.room)
                this.ball?.render?.(ctx, camera, t, pixel);
            if (this.dragging) {
                const { x, y } = camera.worldToScreen(
                    this.x + this.w / 2,
                    this.y + this.h / 2
                );
                let dx = this.dragX - this.dragInitX;
                let dy = this.dragY - this.dragInitY;
                const maxDrag = this.maxDrag;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len > maxDrag) {
                    dx = dx / len * maxDrag;
                    dy = dy / len * maxDrag;
                }
                ctx.save();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + dx, y + dy);
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

            /* how close before chasing, how far before giving up.
            Subclasses can override these. Without defaults here enemies
            never aggro because dist <= undefined is always false */
            this.aggroRange = this.aggroRange ?? 12;
            this.deAggroRange = this.deAggroRange ?? 18;

            //patrol state
            this.patrolDir  = 1;
            this.stallTimer = 0;
            this.jumpCooldown = 0;
            this.chaseMode  = false;
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
            const p = this.engine?.player;
            if (!p) return Infinity;
            //so if in a differant room they ignore the player (patrol mode kinda)
            if (p.room !== this.room) return Infinity;
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
            const g = this.room?.graph ?? this.engine?.graph;
            if (!p || !g) return;

            //centering is better
            this._path = g.findPath(
                this.x + this.w / 2,
                this.y + this.h,
                p.x + p.w / 2,
                p.y + p.h
            );
        }

        /**
         * Follows the current path one step at a time.
         * Sets _moveLeft / _moveRight / _jumpQueued so MEntity.tick() handles physics.
         * @param {number} dt
         */
        _followPath(dt) {

            //screw comments

            if (!this._path?.length) return;

            const step = this._path[0];
            const targetX = step.c + 0.5;
            const myX = this.x + this.w / 2;
            const dx = targetX - myX;

            if (Math.abs(dx) > 0.12) {
                if (dx > 0) this._moveRight = true;
                else this._moveLeft  = true;
                this.facing = dx > 0 ? 1 : -1;
            }

            if (step.jump) {
                if (this.grounded) {
                    const wallBlocked = Math.abs(this.xv) < 0.15 && Math.abs(dx) > 0.3;
                    if (Math.abs(dx) < 1.5 || wallBlocked) {
                        this._jumpQueued = true;
                    }
                }
                if (!this.grounded) {
                    this._path.shift();
                    this._pathStuck = 0;
                }
                return;
            }

            if (this.grounded && Math.abs(this.xv) < 0.1 && Math.abs(dx) > 0.4) {
                this._pathStuck += dt;
                if (this._pathStuck > 0.4) { this._path.shift(); this._pathStuck = 0; }
            } else {
                this._pathStuck = 0;
            }

            if (Math.abs(dx) < 0.35) { this._path.shift(); this._pathStuck = 0; }
        }

        _separateFromEnemies() {
            // const room = this.room;
            // const world = this.engine?.world;
            // if (!room || !world) return;

            // for (const z of room.indices) {
            //     for (const obj of room.zia[z]) {
            //         if (obj === this || !(obj instanceof MEnemy) || obj.dead) continue;

            //         const overlapX = (this.x + this.w / 2) - (obj.x + obj.w / 2);
            //         const overlapY = (this.y + this.h / 2) - (obj.y + obj.h / 2);
            //         const minDistX = (this.w + obj.w) / 2;
            //         const minDistY = (this.h + obj.h) / 2;
            //         const absX = Math.abs(overlapX);
            //         const absY = Math.abs(overlapY);

            //         if (absX < minDistX && absY < minDistY) {
            //             const push = (minDistX - absX) / 2;
            //             const prevX = this.x;
            //             this.x += overlapX > 0 ? push : -push;
            //             this.updateHitbox();
            //             if (this.touching(MSolid, world)) {
            //                 this.x = prevX;
            //                 this.updateHitbox();
            //             }const prevObjX = obj.x;
            //             obj.x += overlapX > 0 ? -push : push;
            //             obj.updateHitbox();
            //             if (obj.touching(MSolid, world)) {
            //                 obj.x = prevObjX;
            //                 obj.updateHitbox();
            //             }
            //         }
            //     }
            // }
        }
        

        /** @param {number} dt */
        tick(dt) {
            if (this.dead) return;

            if (this.contactCooldown > 0) this.contactCooldown -= dt;

            this.stateTime += dt;
            this.ai(dt);

            const fakeEvents = {
                KeyA: this._moveLeft,
                KeyD: this._moveRight,
                KeyW: this._jumpQueued,
            };
            this._moveLeft = this._moveRight = this._jumpQueued = false;

            //physics first!
            super.tick(dt, fakeEvents, { hvel: this.moveSpeed ?? 4 });
            this._separateFromEnemies();

            //check for contact
            const player = this.engine?.player;
            if (player && player.room === this.room && this.contactCooldown <= 0) {
                //update both (certainty check)
                this.updateHitbox();
                player.updateHitbox();

                if (this.hbox.collision(player.hbox)) {
                    this.onPlayerContact(player);
                    this.contactCooldown = 0.6;
                }
            }
        }

        /** Called every frame the enemy overlaps the player
         * The idea here is to make sure that the player can jump off enemies but still take damage per touch.
         * @param {MPlayer} player
         */
        onPlayerContact(player) {
            const dy = (player.y + player.h / 2) - (this.y + this.h / 2);
            
            //player standing on enemy
            //if (dy < -0.1 && player.yv >= 0) return;

            const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
            player.xv = Math.sign(dx || 1) * 15;
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
            const room = this.room;
            if (!room) return;
            for (const z of room.indices) {
                const arr = room.zia[z];
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
         * @typedef {{ type: typeof MObject, tileset: {[key: string]: SpriteRef} }} TileData
         * 
         * @constructor
         * @param {MEngine} engine
         */
        constructor(engine) {
            this.roomData = {};
            this.assembly = [];
            this.tileMap = {};
            this.rooms = [];
            this.engine = engine;
        }

        /**
         * @param {{ [key: string]: string[]|{ bitmap: string[], entities: Object } }} roomData
         * @param {string[]} worldAssembly
         * @param {{ [key: string]: TileData }} tileMap
         * @param {{ [key: string]: (x: number, y: number) => MObject }} [globalEntityMap={}]
         *   Fallback entity factories used for any room that doesn't define its own.
         */
        init(roomData, worldAssembly, tileMap, globalEntityMap = {}) {
            this.roomData = roomData;
            this.assembly = worldAssembly;
            this.tileMap= tileMap;

            for (const row in worldAssembly) {
                this.rooms.push([]);
                for (const col in worldAssembly[row]) {
                    this.rooms[row].push({
                        zia: {},
                        indices: [],
                        entities: [],
                        loaded: false,
                        width: 0,
                        height:0,
                        row:parseFloat(row),
                        col:parseFloat(col),
                    });

                    const room = this.rooms[row][col];
                    const key = this.assembly[row][col];

                    //support both plain array rooms {} roomies yk
                    const roomDef = this.roomData[key];
                    const bitmap = Array.isArray(roomDef) ? roomDef : roomDef.bitmap;
                    
                    //per-room entities take priority; fall back to globalEntityMap
                    const entityMap = (!Array.isArray(roomDef) && roomDef.entities)
                        ? roomDef.entities
                        : globalEntityMap;

                    const { width, height } = this.build(room, bitmap, tileMap);
                    room.width = width;
                    room.height = height;
                    
                    if (typeof PlatformGraph !== 'undefined') {
                        room.graph = new PlatformGraph(bitmap, tileMap, this.engine);
                    }

                    this._spawnEntities(room, bitmap, entityMap);

                    room.loaded = true;
                }
            }
        }
        /** Adds an object to a room of the MWorld.
         * 
         * @param {MObject} room
         * @param {MObject} obj 
         * @param {number} [z=0]
         * @returns {void}
         */
        add(room, obj, z=0) {
            if (!room.zia[z]) {
                room.zia[z] = [];
                // find the index at which to put z into indices
                let i = 0;
                while (i < room.indices.length && room.indices[i] < z) i ++;
                room.indices.splice(i, 0, z); // At index i, remove 0 elements, and insert z
            }
            room.zia[z].push(obj);
            obj.engine = this.engine;
            obj.room = room;
        }

        // TODO: ADD JSDOC!!!
        build(room, bitmap, tileMap) {
            let maxCols = 0;

            for (let row = 0; row < bitmap.length; row++) {
                const line = bitmap[row];
                if (line.length > maxCols) maxCols = line.length;

                for (let col = 0; col < line.length; col++) {
                    const ch = line[col];
                    const def = tileMap[ch];
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

                    const x = col;
                    const y = row;

                    //sprite is captured in the closure
                    const obj = new def.type(x, y, 1, 1, () => sprite);
                    this.add(room, obj, 0);
                }
            }

            return {
                width: maxCols,
                height: bitmap.length,
            };
        }

        /**
         * Scans a bitmap for characters in entityMap and spawns the returned objects into room.
         *
         * @param {Object}   room
         * @param {string[]} bitmap
         * @param {{ [key: string]: (x: number, y: number, ch: string) => MObject|null }} entityMap
         */
        _spawnEntities(room, bitmap, entityMap) {
            if (!bitmap || !entityMap) return;
            for (let r = 0; r < bitmap.length; r++) {
                const line = bitmap[r];
                for (let c = 0; c < line.length; c++) {
                    const ch = line[c];
                    const factory = entityMap[ch];
                    if (!factory) continue;
                    const entity = factory(c, r, ch);
                    if (entity) this.add(room, entity, 0);
                }
            }
        }

        addEntity(room, entity) {
            room.entities.push(entity);
            entity.engine = this.engine;
            entity.room = room;
        }

        transportEntity(entity) {

            // if (entity._transportLock) {
            //     entity.updateHitbox();
            //     return;
            // }

            //storing this for later
            const oldRoom = entity.room;

            //new room
            let { row, col, width } = entity.room;
            if (entity.x < 0 && this.rooms[row]?.[col - 1]) {
                entity.room = this.rooms[row][col - 1];
                entity.x += entity.room.width;
            } else if (entity.x > width && this.rooms[row]?.[col + 1]) {
                entity.room = this.rooms[row][col + 1];
                entity.x -= width;
            }
            // yeah ik this looks awkward LOL
            let height;
            ({ row, col, height } = entity.room);
            if (entity.y < 0 && this.rooms[row - 1]?.[col]) {
                entity.room = this.rooms[row - 1]?.[col];
                entity.y += entity.room.height;
            } else if (entity.y > height && this.rooms[row + 1]?.[col]) {
                entity.room = this.rooms[row + 1][col];
                entity.y -= height;
            }
            entity.updateHitbox();
            
            //move enemy between rooms yes
            if (entity.room !== oldRoom) {
                for (const z of oldRoom.indices) {
                    const arr = oldRoom.zia[z];
                    const idx = arr.indexOf(entity);
                    if (idx !== -1) {
                        arr.splice(idx, 1);
                        this.add(entity.room, entity, z);
                        break;
                    }
                }

                if (entity === this.engine?.player && !entity._roomChangedThisFrame) {
                    const dr = entity.room.row - oldRoom.row;
                    const dc = entity.room.col - oldRoom.col;
                    const dir = dc > 0 ? 'right' : dc < 0 ? 'left' : dr > 0 ? 'bottom' : 'top';
                    entity._roomChangedThisFrame = true;
                    this.engine.onRoomChange?.(dir);
                }
            }
        }

        /** Iterates through the rooms with a callback. If the callback
         * returns a value, it breaks and returns that value.
         * 
         * @param {MObject => any} callback 
         * @returns {any}
         */
        iterate(callback) {
            for (const row of this.rooms) {
                for (const room of row) {
                    const retval = this.iterateRoom(room, callback);
                    if (typeof retval !== "undefined") return retval;
                }
            }
        }

        /** Iterates through the z indexed array of a single room with a callback. If the callback
         * returns a value, it breaks and returns that value.
         * 
         * @param {Object} room
         * @param {MObject => any} callback 
         * @returns {any}
         */
        iterateRoom(room, callback) {
            // go through in ASCENDING order
            for (const i of room.indices) {
                for (const obj of room.zia[i]) {
                    const retval = callback(obj);
                    if (typeof retval !== "undefined") return retval;
                }
            }
            for (const entity of room.entities) {
                const retval = callback(entity);
                if (typeof retval !== "undefined") return retval;
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
         * @param {Object} room
         */
        focusPlayerConstrained(player, room) {
            const cx = player.x + player.w / 2;
            const cy = player.y + player.h / 2;

            //zoom in if the room is too small to fill the canvas at baseTsz
            if (!this.lockZoom) {
                const tszX = this.w / room.width;
                const tszY = this.h / room.height;
                this.tsz = Math.max(this.baseTsz, tszX, tszY);
            }

            //visible world area at the (possibly zoomed) tsz
            const vw = this.w / this.tsz;
            const vh = this.h / this.tsz;

            //clamp so the view never shows outside [0, room.width] x [0, room.height]
            const fx = Math.max(vw / 2, Math.min(room.width - vw / 2, cx));
            const fy = Math.max(vh / 2, Math.min(room.height - vh / 2, cy));
            
            this.focus(
                this.lockFocusX ? this.focusX : fx,
                this.lockFocusY ? this.focusY : fy
            );
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
            const room = this.engine.player.room;
            if (room) {
                this.camera.focusPlayerConstrained(this.engine.player, room);
            } else {
                this.camera.focusPlayer(this.engine.player);
            }
            this.pixel = this.camera.tsz / this.res;
            this.engine.world.iterateRoom(room, obj => {
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
                this.engine.world.iterateRoom(this.engine.player.room, obj => {
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
            this.slowMo = false;
            this.slowMoScale = 0.15; // how slow "slow" is lol
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
            // TODO: make this not hacky
            this.world.add(this.world.rooms[0][0], this.player, 1);
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
            //for the slowmo effect with the ball
            if (this.slowMo) dt *= this.slowMoScale;
            this.events = events;
            this.lastDt = dt;
            this.renderer.render(t);
            this.player.tick(dt, events);
            if (this.player.health <= 0) {
                this.player.x = this.player.sx;
                this.player.y = this.player.sy;
                this.player.xv = 0;
                this.player.yv = 0;
                this.player.health = this.player.maxHealth;
                this.player.transport();
            }

            //this.player._transportLock = false;
            this.player._roomChangedThisFrame = false;

            this.world.iterate(obj => {
                if (obj !== this.player && typeof obj.tick === 'function') obj.tick(dt);
            });
        }
    }

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

            const events = this.engine.events ?? {};
            const spaceNow = !!events.Space;
            const spaceJust = spaceNow && !this._prevSpace;
            this._prevSpace = spaceNow;

            //proximity check
            const cx = this.x + 1, cy = this.y + 1.5;
            const px = player.x + player.w / 2, py = player.y + player.h / 2;
            const dist = Math.hypot(px - cx, py - cy);
            this.inRange = dist <= MNPC.TALK_RADIUS;

            //lose dialogue if player walks away
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

            const talking = this.dialogueIndex >= 0 &&this.dialogueIndex < this.dialogue.length;

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
                ctx.strokeStyle = 'rgba(255, 0,0,0.7)';
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


    /**
     * builds a walkability graph from a room bitmap and runs BFS pathfinding
     * Nodes = tile positions where an entity can stand.
     * Edges = walk, fall off ledge, or jump to a reachable node.
     */
    class PlatformGraph {
        /**
         * @param {string[]} bitmap
         * @param {Object} tileMap
         */
        constructor(bitmap, tileMap, engine = null) {
            this.bitmap = bitmap;
            this.tileMap = tileMap;
            const jump = engine?.jump ?? 20;
            const gravity = engine?.gravity ?? 80;
            this.JUMP_H = Math.max(1, Math.ceil((jump * jump) / (2 * gravity)) + 1);
            this.JUMP_W = this.JUMP_H + 3;

            this.nodes = this._build();
        }

        //help me
        _solid(r, c) { 
            return (this.bitmap[r]?.[c] ?? ' ') in this.tileMap; 
        }
        _open(r, c)  { 
            return !this._solid(r, c); 
        }

        /** Standable = open tile with a solid tile directly below */
        _standable(r, c) { 
            return this._open(r, c) && this._solid(r + 1, c); 
        }

        _build() {
            const rows = this.bitmap.length;
            const cols = Math.max(...this.bitmap.map(l => l.length));
            const nodes = new Map();

            //create a node for every tile an entity can stand on
            for (let r = 0; r < rows; r++)
                for (let c = 0; c < cols; c++)
                    if (this._standable(r, c))
                        nodes.set(`${c},${r}`, { c, r, edges: [] });
            
            //jump stuff
            const JUMP_H = this.JUMP_H; 
            const JUMP_W = this.JUMP_W;

            //connect nodes with edges
            for (const [, node] of nodes) {
                const { c, r } = node;

                //walk left / right (same height, head clearance checked)
                for (const dir of [-1, 1]) {
                    const nc = c + dir;
                    const nb = nodes.get(`${nc},${r}`);
                    if (nb && this._open(r, nc) && this._open(r - 1, nc))
                        node.edges.push({ to: nb, move: dir > 0 ? 'right' : 'left', jump: false });
                }

                //fall off edges into air column, land on lower node
                for (const dir of [-1, 1]) {
                    const nc = c + dir;
                    if (this._open(r, nc)) {
                        for (let dr = 1; dr <= 12; dr++) {
                            const nr = r + dr;
                            const nb = nodes.get(`${nc},${nr}`);
                            if (nb) { node.edges.push({ to: nb, move: dir > 0 ? 'right' : 'left', jump: false }); break; }
                            if (this._solid(nr, nc)) break;
                        }
                    }
                }

                //any standable tile within the parabolic jump envelope
                for (let dc = -JUMP_W; dc <= JUMP_W; dc++) {
                    for (let dr = 1; dr <= JUMP_H; dr++) {
                        const nb = nodes.get(`${c + dc},${r - dr}`);
                        if (nb) node.edges.push({ to: nb, move: dc >= 0 ? 'right' : 'left', jump: true });
                    }
                }
            }

            return nodes;
        }

        /** I changed this but don't feel like updating its comment */
        _nearestKey(c, r) {
            //search down first
            for (let dr = 0; dr <= 3; dr++) {
                const k = `${c},${r + dr}`;
                if (this.nodes.has(k)) return k;
            }
            //also search upward in case entity is slightly above a standable tile
            for (let dr = 1; dr <= 3; dr++) {
                const k = `${c},${r - dr}`;
                if (this.nodes.has(k)) return k;
            }
            //try adjacent columns as fallback when rounding puts us in a wall
            for (const dc of [-1, 1]) {
                for (let dr = -2; dr <= 3; dr++) {
                    const k = `${c + dc},${r + dr}`;
                    if (this.nodes.has(k)) return k;
                }
            }
            return null;
        }

        _reconstruct(visited, goalKey) {
            const path = [];
            let key = goalKey;
            while (visited.get(key) !== null) {
                const { from, edge } = visited.get(key);
                path.unshift({ c: edge.to.c, r: edge.to.r, move: edge.move, jump: edge.jump });
                key = from;
            }
            return path;
        }

        /**
         * BFS from world position (fx,fy) → (tx,ty).
         * Returns array of step objects: { c, r, move:'left'|'right', jump:bool }
         * Returns null if no path exists, [] if already at goal.
         */
        findPath(fx, fy, tx, ty) {
            const startKey = this._nearestKey(Math.round(fx), Math.floor(fy));
            const goalKey  = this._nearestKey(Math.round(tx), Math.floor(ty));

            if (!startKey || !goalKey)  return null;
            if (startKey === goalKey)   return [];

            const start = this.nodes.get(startKey);
            const goal = this.nodes.get(goalKey);
            if (!start || !goal) return null;

            const visited = new Map([[startKey, null]]);
            const queue = [start];

            while (queue.length) {
                const node = queue.shift();
                const nk = `${node.c},${node.r}`;
                if (nk === goalKey) return this._reconstruct(visited, goalKey);

                for (const edge of node.edges) {
                    const ek = `${edge.to.c},${edge.to.r}`;
                    if (!visited.has(ek)) {
                        visited.set(ek, { from: nk, edge });
                        queue.push(edge.to);
                    }
                }
            }
            return null;
        }
    }

    class MBlob extends MEnemy {
        constructor(x, y, variant = 'g1') {
            const sprites = gfx.enemies.slimes[variant];
            const big = variant.endsWith('2');
            const w = big ? 0.88 : 0.60;
            const h = big ? 0.77 : 0.55;
             const hp = big ? 90: 30;

            super(x, y, w, h, hp, (t, self) => {
                const fps= self.state === 'jump' ? 10 : 4;
                const frames = sprites[self.state] ?? sprites.idle;
                const frame  = Math.floor(t * fps) % frames.length;
                return frames[frame];
            });

            this.sprites = sprites;
            this.patrolDir = 1;
            this.jumpCooldown = 1 + Math.random() * 1.5;
            this.stallTimer = 0;

            //AI crap
            this.aggroRange= big ? 8 : 6;
            this.deAggroRange = big ? 12 : 9;
            this.chaseMode = false;  
            this.aggroLatch = 0;
            
            //speed can be adjusted
            this.moveSpeed = big ? 4 : 10;
        } 

        ai(dt) {
            const dist = this._playerDist();

            //aggro range junk
            if (!this.chaseMode && dist <= this.aggroRange) {
                this.chaseMode  = true;
                this.aggroLatch = 1.0;
            }
            if (this.chaseMode) {
                this.aggroLatch -= dt;
                if (this.aggroLatch <= 0 && dist > this.deAggroRange) {
                    this.chaseMode = false;
                }
            }

            //movement decision
            if (this.chaseMode) {
                this._runChase(dt);
            } else {
                this._runPatrol(dt);
            }

            //animation state
            this.state = this.grounded ? 'idle' : 'jump';
        }

        _runChase(dt) {
            //use the graph to navigate
            this._updatePath(dt, 0.5);

            if (this._path?.length) {
                this._followPath(dt);
            } else {
                //graph went bleh
                const hDir = this._playerHDir();
                if (hDir ===  1) this._moveRight = true;
                if (hDir === -1) this._moveLeft  = true;
                this.facing = hDir || this.facing;
            }
        }

        /** Patrol: walk back and forth, jump periodically. */
        _runPatrol(dt) {
            if (this.patrolDir === 1) this._moveRight = true;
            else this._moveLeft  = true;
            this.facing = this.patrolDir;

            if (this.grounded && Math.abs(this.xv) < 0.15) {
                this.stallTimer += dt;
                if (this.stallTimer > 0.25) {
                    this.patrolDir  *= -1;
                    this.stallTimer  = 0;
                    this.stateTime   = 0;
                }
            }
            else {
                this.stallTimer = 0;
            }

            this.jumpCooldown -= dt;
            if (this.grounded && this.jumpCooldown <= 0) {
                this._jumpQueued = true;
                this.jumpCooldown = 1.5 + Math.random() * 2;
            }
        }
    }

    return { MDecorative, MSolid, MHazard, MEntity, MPlayer, MEnemy, MEngine, MCheckpoint, MNPC, MBlob };
})();