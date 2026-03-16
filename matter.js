const {
    MDecorative,
    MSolid,
    MHazard,
    MLava,
    MEntity,
    MPlayer,
    MEnemy,
    MEngine,
    MCheckpoint,
    MTeleportEntryPoint,
    MTeleportSpawnPoint,
    MGauntletDoor,
    MNPC,
    MBlob,
    MPoundFloor,
    MBreakWall,
    MMinitaur,
    MMimic,
    MPowerPillar,
    MFlyer,
    MSwarmer,
    MPothead,
    MHatPoint,
    MHatShop,
    MBackground,
    MPacman,
} = (() => {
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

        get w() {
            return this.x2 - this.x1;
        }

        get h() {
            return this.y2 - this.y1;
        }

        /** Checks for collision with alternate MBox
         *
         * @param {MBox} that
         * @returns {boolean}
         */
        collision(that) {
            return (
                this.x1 <= that.x2 &&
                that.x1 <= this.x2 &&
                this.y1 <= that.y2 &&
                that.y1 <= this.y2
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
            const { x, y } = camera.worldToScreen(this.x, this.y);
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
            this.hbox = new MBox(x, y, x + w, y + h);
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
            const offsetX = (this.w * camera.tsz - sprite.w * pixel) / 2 - 2;
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

    class MLava extends MHazard {
        static ANIM_FPS = 9;
        constructor(x, y, isTop) {
            super(x, y, 1, 1, (t, self) => {
                if (!self.isTop) {
                    let frames = gfx.props.environment.poison;
                    return frames[Math.floor(t * MLava.ANIM_FPS) % frames.length];
                } else if (self.isTop) {
                    let frames = gfx.props.environment.poisonTop;
                    return frames[Math.floor(t * MLava.ANIM_FPS) % frames.length];
                }
            })
            this.isTop = isTop;
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
            this.sroom = null;
            this.w = w;
            this.h = h;
            this.xv = 0;
            this.yv = 0;
            this.contactCooldown = 0;
            this.maxHealth = maxHealth;
            this.health = this.maxHealth;
            this.coyote = 0;
            this.coyoteLimit = 0.2;
            this.defrictioned = false;
            this._wasDefrictioned = false;
        }

        /** Update hitbox
         *
         * @returns {void}
         */
        updateHitbox() {
            this.hbox.setWH(this.x, this.y, this.w, this.h);
            this.dbox.setWH(this.x, this.y, this.w, this.h);
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
            return world.iterateRoom(this.room, (obj) => {
                if (obj instanceof type && obj?.hbox?.collision?.(this.hbox))
                    return obj;
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
            world.iterateRoom(this.room, (obj) => {
                if (obj instanceof type && obj?.hbox?.collision?.(this.hbox))
                    out.push(obj);
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
        tick(dt, events, attributes = {}) {
            const hvel = attributes.hvel ?? this.engine.hvel;
            const jump = attributes.jump ?? this.engine.jump;
            let friction = attributes.friction ?? this.engine.friction;
            if (this.defrictioned) {
                friction = 1 - (1 - friction) * 0.00001;
            }
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
                this.defrictioned = false;
                this.transport();
            }
            this.yv += gravity * dt;
            this.grounded = false;
            this.y += this.yv * dt;
            this.transport();
            if (this.touching(MSolid, world)) {
                this.y -= this.yv * dt;
                this.defrictioned = false;
                if (this.yv > 0) {
                    this.grounded = true;
                    this.coyote = 0;
                }
                this.yv = 0;
                this.transport();
            } else {
                this.coyote += dt;
            }

            if (this.coyote <= this.coyoteLimit && events.KeyW) {
                this.coyote = Infinity;
                this.yv = -jump;
            }
            if (this.touching(MHazard, world)) {
                this.onDeath?.();
                this.x = this.sx;
                this.y = this.sy;
                this.room = this.sroom;
                this.health = this.maxHealth;
                this.transport();
            }
            this._wasDefrictioned = this.defrictioned;
        }

        remove() {
            const idx = this.room?.entities.indexOf(this);
            if (idx != null && idx !== -1) this.room.entities.splice(idx, 1);
        }
    }

    class MBall extends MEntity {
        static bounce = 0.65;

        constructor(owner, xv, yv) {
            const w = 1,
                h = 1;
            super(
                owner.x + owner.w / 2 - w / 2,
                owner.y + owner.h / 2 - h / 2,
                w,
                h,
                1,
                () => gfx.player.spikeBall,
            );
            this.hboxSmall = 0.2; // thing that says how much to shrink the ball's hbox by
            this.xv = xv;
            this.yv = yv;
            this.owner = owner;
            this.engine = owner.engine;
            this.room = owner.room;
            this.angle = 0;
            this.onGround = false;
            this._hitCooldowns = new Map();
        }

        /** Update hitbox
         *
         * @returns {void}
         */
        updateHitbox() {
            this.hbox.setWH(
                this.x + this.hboxSmall,
                this.y + this.hboxSmall,
                this.w - 2 * this.hboxSmall,
                this.h - 2 * this.hboxSmall
            );
            this.dbox.setWH(this.x, this.y, this.w, this.h);
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
                if (
                    xt instanceof MBreakWall &&
                    !xt._breaking &&
                    !this._hitCooldowns.has(xt)
                ) {
                    if (xt.onBallHit(this)) {
                        //correct side so da ball punches through, an the wall starts crumbling
                        this._hitCooldowns.set(
                            xt,
                            MBreakWall.BREAK_DURATION + 0.1,
                        );
                    } else {
                        //wrong side.
                        this.x =
                            this.xv > 0
                                ? xt.hbox.x1 - this.w + this.hboxSmall - epsilon
                                : xt.hbox.x2 - this.hboxSmall + epsilon;
                        this.xv *= -MBall.bounce;
                    }
                } else if (!(xt instanceof MBreakWall && xt._breaking)) {
                    this.x =
                        this.xv > 0
                            ? xt.hbox.x1 - this.w + this.hboxSmall - epsilon
                            : xt.hbox.x2 - this.hboxSmall + epsilon;
                    this.xv *= -MBall.bounce;
                }
            }

            this.onGround = false;
            this.yv += gravity * dt;
            this.y += this.yv * dt;
            this.transport();
            const yt = this.touching(MSolid, world);
            if (yt) {
                const falling = this.yv > 0;
                this.y = falling
                    ? yt.hbox.y1 - this.h + this.hboxSmall - epsilon
                    : yt.hbox.y2 - this.hboxSmall + epsilon;
                this.yv *= -MBall.bounce;
                if (falling) {
                    this.onGround = true;
                    if (Math.abs(this.yv) < 0.8) this.yv = 0;
                }
            }

            //tick down per-enemy hit cooldowns
            for (const [enemy, cd] of this._hitCooldowns) {
                const remaining = cd - dt;
                if (remaining <= 0) this._hitCooldowns.delete(enemy);
                else this._hitCooldowns.set(enemy, remaining);
            }

            //enemy collision bounce and deal damage
            let hitEnemies = this.touchingAll(MEnemy, world);
            if (this.hbox.collision(this.engine.player)) {
                hitEnemies.push(this.engine.player);
            }
            hitEnemies = hitEnemies.filter((e) => e != this.owner);
            for (const enemy of hitEnemies) {
                if (enemy.dead || this._hitCooldowns.has(enemy)) continue;

                //reflect whichever axis has less overlap (same logic as solid)
                const dx = this.x + this.w / 2 - (enemy.x + enemy.w / 2);
                const dy = this.y + this.h / 2 - (enemy.y + enemy.h / 2);
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
        static throwFactor = 14;
        static maxDrag = 180;
        static minDrag = 28;

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
            this.state = "idle";
            this.facing = 1;
            this.groundPounding = false;
            this.groundPoundTime = 0;
            this.impactTime = null;
            this.dragging = false;
            this.carrying = false;
            this.dragInitX = 0;
            this.dragInitY = 0;
            this.dragX = 0;
            this.dragY = 0;
            this.ball = null; //new MBall(this, 0, 0);
            this.carrying = true;

            this.maxDrag = 180;
            this.powers = {
                ball: false,
                groundedTeleport: false,
                groundPound: false,
                fullTeleport: false,
                wallJump: false,
            };

            // tmp for dev
            this.powers = {
                ball: true,
                groundedTeleport: true,
                groundPound: true,
                fullTeleport: true,
                wallJump: true,
            };
            this._hitFlash = 0;

            this.wallSliding = false;
            this.wallDir = 0;

            this._wallJumpCooldown = 0;
            this.gpExt = 2; // ground pound extension
        }

        takeDamage(amount) {
            this.health = Math.max(0, this.health - amount);
            this._hitFlash = 0.18;
        }

        _separateFromEnemies() {
            const room = this.room;
            const world = this.engine?.world;
            if (!room || !world) return;

            for (const z of room.indices) {
                for (const obj of room.zia[z]) {
                    if (!(obj instanceof MEnemy) || obj.dead) continue;

                    const overlapX = this.x + this.w / 2 - (obj.x + obj.w / 2);
                    const overlapY = this.y + this.h / 2 - (obj.y + obj.h / 2);
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
                                this._standingOnEnemyTimer +=
                                    this.engine.lastDt ?? 0;
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

        onDeath() {
            const dr = this.sroom.row - this.room.row;
            const dc = this.sroom.col - this.room.col;
            if (Math.abs(dr) + Math.abs(dc) >= 1) {
                const dir =
                    dc > 0 && dc > Math.abs(dr)
                        ? "right"
                        : dc < 0 && -dc > Math.abs(dr)
                            ? "left"
                            : dr > 0 && dr >= Math.abs(dc)
                            ? "bottom"
                            : "top";
                this._roomChangedThisFrame = true;
                this.engine.onRoomChange?.(dir);
            }
            if (this.ball) this.carrying = true;
            this.groundPounding = false;
        }

        /** Tick the game forward
         *
         * @param {number} dt
         * @param {Object} events
         * @param {Object} eventsPrev
         * @returns {void}
         */
        tick(dt, events, eventsPrev) {
            //const canGroundPound = !this.grounded && !this.groundPounding && (this.airTime ?? 0) > 0.1;
            const canGroundPound =
                this.powers.groundPound &&
                !this.grounded &&
                !this.groundPounding &&
                (this.airTime ?? 0) > 0.1;
            const keySJustPressed = events.KeyS && !eventsPrev.KeyS;

            if (canGroundPound && keySJustPressed) {
                this.groundPounding = true;
                this.groundPoundTime = 0;
                this.impactTime = null;
                this.yv = this.engine.jump * this.engine.groundPoundMult;
            }

            if (this.groundPounding) this.groundPoundTime += dt;
            if (this.impactTime !== null) this.impactTime += dt;

            if (this._hitFlash > 0) this._hitFlash -= dt;
            if (!this._groundedOnEnemy) {
                this._standingOnEnemy = null;
                this._standingOnEnemyTimer = 0;
            }
            this._groundedOnEnemy = false;

            //wall slide and jump
            if (this._wallJumpCooldown > 0) this._wallJumpCooldown -= dt;

            this.wallSliding = false;
            if (!this.grounded && this.yv > 0 && this._wallJumpCooldown <= 0) {
                const probe = 0.15;
                if (events.KeyD) {
                    this.x += probe; this.updateHitbox();
                    if (this.touching(MSolid, this.engine.world)) { this.wallSliding = true; this.wallDir = 1; }
                    this.x -= probe; this.updateHitbox();
                }
                if (!this.wallSliding && events.KeyA) {
                    this.x -= probe; this.updateHitbox();
                    if (this.touching(MSolid, this.engine.world)) { this.wallSliding = true; this.wallDir = -1; }
                    this.x += probe; this.updateHitbox();
                }
            }
            if (this.wallSliding) {
                if (this.yv > 3) this.yv = 3;
                this.facing = -this.wallDir;
            }
            //wall jump
            if (this.wallSliding && this.powers.wallJump && events.KeyW && !eventsPrev.KeyW) {
                this.yv = -this.engine.jump;
                this.xv = -this.wallDir * this.engine.hvel * 0.8;
                this.wallSliding = false;
                this._wallJumpCooldown = 0.35;
            }

            //then colide
            this._separateFromEnemies();

            //enemies hit when the player carrying basically a convulated way of accomplishing that
            if (!this.carrying) this.ball?.tick?.(dt, {}, { friction: 1 });

            //if (events.Mouse && !this.prevMouse && !this.ball) {
            if (
                events.Mouse &&
                !eventsPrev.Mouse &&
                (!this.ball || this.carrying) &&
                this.powers.ball
            ) {
                this.dragging = true;
                this.dragInitX = events.MouseX;
                this.dragInitY = events.MouseY;
                this.dragX = events.MouseX;
                this.dragY = events.MouseY;
                //reuse existing if recalled
                if (!this.ball) this.ball = new MBall(this, 0, 0);
                this.carrying = true;
            } else if (events.Mouse && this.dragging) {
                //update drag
                this.dragX = events.MouseX;
                this.dragY = events.MouseY;
            } else if (!events.Mouse && this.dragging) {
                this.dragging = false;
                this.engine.slowMo = false;
                const tsz = this.engine.renderer.camera.tsz;
                let dx = this.dragX - this.dragInitX;
                let dy = this.dragY - this.dragInitY;
                const len = Math.sqrt(dx * dx + dy * dy);
                this.carrying = false;
                if (len < this.constructor.minDrag) {
                    //don't destroy it :sob
                    this.carrying = true;
                } else {
                    //real throw
                    if (len > this.constructor.maxDrag) {
                        dx = (dx / len) * this.constructor.maxDrag;
                        dy = (dy / len) * this.constructor.maxDrag;
                    }
                    this.ball = new MBall(
                        this,
                        (dx / tsz) * MPlayer.throwFactor,
                        (dy / tsz) * MPlayer.throwFactor,
                    );
                }
            } else if (
                events.Mouse &&
                !eventsPrev.Mouse &&
                this.ball &&
                !this.carrying
            ) {
                const canTeleport =
                    this.powers.fullTeleport ||
                    (this.powers.groundedTeleport && this.ball.onGround);
                if (canTeleport) {
                    //click while ball is out so holding and dragging right away works for quick chaining
                    const epsilon = this.engine.epsilon;
                    this.x = this.ball.x + this.ball.w / 2 - this.w / 2;
                    this.y = this.ball.y + this.ball.h / 2 - this.h / 2;
                    this.xv = this.ball.xv;
                    this.yv = this.ball.yv;
                    if (this.ball.room != this.room) {
                        const dr = this.ball.room.row - this.room.row;
                        const dc = this.ball.room.col - this.room.col;
                        this.room = this.ball.room;
                        const dir =
                            dc > 0 && dc > Math.abs(dr)
                                ? "right"
                                : dc < 0 && -dc > Math.abs(dr)
                                    ? "left"
                                    : dr > 0 && dr >= Math.abs(dc)
                                    ? "bottom"
                                    : "top";
                        this._roomChangedThisFrame = true;
                        this.engine.onRoomChange?.(dir);
                    }
                    this.transport();
                    this.engine.slowMo = true;
                    this.carrying = true;
                    //ball stays alive
                    this.dragging = true;
                    this.dragInitX = events.MouseX;
                    this.dragInitY = events.MouseY;
                    this.dragX = events.MouseX;
                    this.dragY = events.MouseY;

                    //push player out of any wall they landed in
                    const world = this.engine.world;
                    this.updateHitbox();
                    const t = this.touchingAll(MSolid, world);
                    if (t) {
                        const colls = [];
                        for (const b of t) {
                            // block to left of player
                            if (b.hbox.x1 < this.hbox.x1 && this.hbox.x1 < b.hbox.x2) {
                                colls.push(["left", b, b.hbox.x2 - this.hbox.x1]);
                            }
                            // block to right of player
                            if (b.hbox.x1 < this.hbox.x2 && this.hbox.x2 < b.hbox.x2) {
                                colls.push(["right", b, this.hbox.x2 - b.hbox.x1]);
                            }
                            // block below player
                            if (b.hbox.y1 < this.hbox.y1 && this.hbox.y1 < b.hbox.y2) {
                                colls.push(["down", b, b.hbox.y2 - this.hbox.y1]);
                            }
                            // block above player
                            if (b.hbox.y1 < this.hbox.y2 && this.hbox.y2 < b.hbox.y2) {
                                colls.push(["up", b, this.hbox.y2 - b.hbox.y1]);
                            }
                        }
                        colls.sort((a, b) => a[2] - b[2]);
                        for (const coll of colls) {
                            const [side, b, pdepth] = coll;
                            if (this.hbox.collision(b.hbox)) {
                                switch (side) {
                                    case "left": this.x = b.hbox.x2 + epsilon; break;
                                    case "right": this.x = b.hbox.x1 - this.w - epsilon; break;
                                    case "down": this.y = b.hbox.y2 + epsilon; break;
                                    case "up": this.y = b.hbox.y1 - this.h - epsilon; break;
                                }
                                this.updateHitbox();
                            }
                        }
                    }
                    this.transport();
                }
            }

            //exit slowmo on keypress or on landing also pretty important
            if (this.engine.slowMo) {
                if (events.KeyA || events.KeyD || events.KeyW || events.KeyS) {
                    this.engine.slowMo = false;
                }
                if (this.grounded && !this._wasGrounded) {
                    this.engine.slowMo = false;
                }
            }

            //remove ball on any keypress while it's in free flight
            // if (this.ball && !this.carrying && !this.engine.slowMo && !this.dragging) {
            //     if (events.KeyA || events.KeyD || events.KeyW || events.KeyS) {
            //         this.ball = null;
            //     }
            // }

            if (
                this.ball &&
                !this.carrying &&
                !this.engine.slowMo &&
                !this.dragging
            ) {
                if (events.KeyE) {
                    this.carrying = true;
                }
            }

            if (events.KeyA) this.facing = -1;
            if (events.KeyD) this.facing = 1;

            if (this.groundPounding && this.grounded) {
                this.groundPounding = false;
                this.impactTime = 0;
                this.engine.onGroundPound?.();
                // enemy collision deal damage by groundpound
                const extendedBox = MBox.fromWH(
                    this.x - this.gpExt,
                    this.y,
                    this.w + 2 * this.gpExt,
                    this.h + this.gpExt
                );
                let hitEnemies = [];
                this.engine.world.iterateRoom(this.room, (obj) => {
                    if (obj instanceof MEnemy && obj?.hbox?.collision?.(extendedBox))
                        hitEnemies.push(obj);
                });
                for (const enemy of hitEnemies) {
                    if (enemy.dead) continue;
                    let dx;
                    if (this.x > enemy.hbox.x1 && this.x < enemy.hbox.x2) {
                        dx = 0;
                    } else if (this.x <= enemy.hbox.x1) {
                        dx = enemy.hbox.x1 - this.x;
                    } else if (this.x >= enemy.hbox.x2) {
                        dx = this.x - enemy.hbox.x2;
                    }
                    const gauss = Math.exp(-dx * dx);
                    enemy.takeDamage(this.groundPoundTime * 300 * gauss);
                    // knockback the enemies
                    enemy.yv -= 20 * gauss;
                    enemy.xv -= 50 * dx * gauss;
                    enemy.defrictioned = true;
                }
            }

            const impactDuration = 0.4;
            if (this.impactTime !== null && this.impactTime > impactDuration) {
                this.impactTime = null;
            }

            if (this.groundPounding) {
                this.state = "groundpound";
            } else if (this.impactTime !== null) {
                this.state = "groundpoundimpact";
            } else if (this.wallSliding) {
                this.airTime = (this.airTime ?? 0) + dt;
                this.state =  "wallslide";
            } else if (this.dragging && !this.carrying && !this.ball) {
                this.state = "throw";
            } else if (!this.grounded) {
                this.airTime = (this.airTime ?? 0) + dt;
                this.state = this.yv < 0 ? "jump" : "fall";
            } else {
                this.airTime = 0;
                this.state = Math.abs(this.xv) > 0.5 ? "run" : "idle";
            }

            const physEvents = this.groundPounding
                ? { ...events, KeyW: false, KeyA: false, KeyD: false }
                : events;

            //start physics
            super.tick(dt, physEvents);

            if (this.ball && this.carrying) {
                this.ball.xv = 0;
                this.ball.yv = 0;
                //this.ball.x = this.x + this.w / 2 - this.ball.w / 2 + 0.05;
                this.ball.x = this.x + this.w / 2 - this.ball.w / 2;
                this.ball.y = this.y - 0.55;
                this.ball.room = this.room;
                this.ball.updateHitbox();
            }

            this._wasGrounded = this.grounded;
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
            //so the hat can bob essentially
            const _spr = this.texturer(t, this);
            const _offsetY = (this.h * camera.tsz - _spr.h * pixel) / 2;
            this._hatY = camera.worldToScreen(this.x, this.y).y + _offsetY;
    
            super.render(ctx, camera, t, pixel);
    
            this.engine?.onRenderHat?.(ctx, this, pixel, camera);
    
            if (this.ball?.room == this.room)
                this.ball?.render?.(ctx, camera, t, pixel);
            if (this.dragging) {
                const ballCx = this.ball
                    ? this.ball.x + this.ball.w / 2
                    : this.x + this.w / 2;
                const ballCy = this.ball
                    ? this.ball.y + this.ball.h / 2
                    : this.y + this.h / 2;
                const { x, y } = camera.worldToScreen(ballCx, ballCy);
                let dx = this.dragX - this.dragInitX;
                let dy = this.dragY - this.dragInitY;
                const maxDrag = this.maxDrag;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len > maxDrag) {
                    dx = (dx / len) * maxDrag;
                    dy = (dy / len) * maxDrag;
                }
                aim(ctx, x, y, dx, dy, pixel, 20, 5, t * 100);
            }
        }
    }

    /** base class for all enemies extend this with `extends MEnemy`.
     *  AI subclasses signal movement via _moveLeft / _moveRight / _jumpQueued
     *  flags set inside ai(dt), which are consumed each physics tick.
     */
    class MEnemy extends MEntity {
        static deathAnimationTime = 1;

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
            this.state = "idle";
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
            this.patrolDir = 1;
            this.stallTimer = 0;
            this.jumpCooldown = 0;
            this.chaseMode = false;

            // death
            this._deathTimer = 0;
            this._hitFlash = 0;
        }

        /** Override in subclasses to implement AI behaviour.
         *  Set this._moveLeft / _moveRight / _jumpQueued as needed.
         * @param {number} dt
         */
        ai(dt) {
            const dist = this._playerDist();

            if (!this.chaseMode && dist <= this.aggroRange)
                this.chaseMode = true;
            if (this.chaseMode && dist > this.deAggroRange)
                this.chaseMode = false;

            if (this.chaseMode) {
                this._updatePath(dt, 0.5);

                if (this._path?.length) {
                    this._followPath(dt);
                } else {
                    // const hDir = this._playerHDir();
                    // if (hDir ===  1) this._moveRight = true;
                    // if (hDir === -1) this._moveLeft = true;
                    // this.facing = hDir || this.facing;
                    const hDir = this._playerHDir();
                    if (hDir === 1) this._moveRight = true;
                    if (hDir === -1) this._moveLeft = true;
                    const newFacing1 = hDir || this.facing;
                    if (newFacing1 !== this.facing) {
                        this.facing = newFacing1;
                        this._facingLock = 0.2;
                    } else this.facing = newFacing1;
                }
            } else {
                if (this.patrolDir === 1) this._moveRight = true;
                else this._moveLeft = true;
                if (this.patrolDir !== this.facing) {
                    this.facing = this.patrolDir;
                    this._facingLock = 0.2;
                }

                if (this.grounded && Math.abs(this.xv) < 0.15) {
                    this.stallTimer += dt;
                    if (this.stallTimer > 0.25) {
                        this.patrolDir *= -1;
                        //cooldown before it can stall-flip again
                        this.stallTimer = -0.4;
                    }
                } else {
                    this.stallTimer = 0;
                }

                this.jumpCooldown -= dt;
                if (this.grounded && this.jumpCooldown <= 0) {
                    this._jumpQueued = true;
                    this.jumpCooldown = 1.5 + Math.random() * 2;
                }
            }

            this.state = this.grounded ? "idle" : "jump";
        }

        /** Returns signed horizontal distance to player (positive = player is right). */
        _playerDX() {
            const p = this.engine?.player;
            if (!p) return 0;
            return p.x + p.w / 2 - (this.x + this.w / 2);
        }

        /** Returns signed vertical distance to player (positive = player is below). */
        _playerDY() {
            const p = this.engine?.player;
            if (!p) return 0;
            return p.y + p.h / 2 - (this.y + this.h / 2);
        }

        /** Returns Euclidean distance to player. */
        _playerDist() {
            const p = this.engine?.player;
            if (!p) return Infinity;
            //so if in a differant room they ignore the player (patrol mode kinda)
            if (p.room !== this.room) return Infinity;
            const dx = this._playerDX(),
                dy = this._playerDY();
            return Math.sqrt(dx * dx + dy * dy);
        }

        /** Returns true if player is within `range` world units. */
        _playerInRange(range) {
            return this._playerDist() <= range;
        }

        /** Returns -1 / 0 / 1: which horizontal direction the player is in. */
        _playerHDir() {
            const dx = this._playerDX();
            return dx === 0 ? 0 : dx > 0 ? 1 : -1;
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
                p.y + p.h,
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

            // if (Math.abs(dx) > 0.12) {
            //     if (dx > 0) this._moveRight = true;
            //     else this._moveLeft  = true;
            //     this.facing = dx > 0 ? 1 : -1;
            // }

            //new concept
            if (Math.abs(dx) > 0.12) {
                if (dx > 0) this._moveRight = true;
                else this._moveLeft = true;
                //only commit facing for real movement
                if (Math.abs(dx) > 0.5) {
                    //this.facing = dx > 0 ? 1 : -1;
                    //another new concept
                    const newFacing = dx > 0 ? 1 : -1;
                    if (newFacing !== this.facing) {
                        this.facing = newFacing;
                        this._facingLock = 0.2;
                    }
                }
            }

            if (step.jump) {
                if (this.grounded) {
                    const wallBlocked =
                        Math.abs(this.xv) < 0.15 && Math.abs(dx) > 0.3;
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

            if (
                this.grounded &&
                Math.abs(this.xv) < 0.1 &&
                Math.abs(dx) > 0.4
            ) {
                this._pathStuck += dt;
                if (this._pathStuck > 0.4) {
                    this._path.shift();
                    this._pathStuck = 0;
                }
            } else {
                this._pathStuck = 0;
            }

            if (Math.abs(dx) < 0.35) {
                this._path.shift();
                this._pathStuck = 0;
            }
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
            if (this.dead) {
                this._deathTimer += dt;
                super.tick(dt, {}, { hvel: this.moveSpeed ?? 4 });
                if (this._deathTimer > this.constructor.deathAnimationTime) {
                    this.remove();
                }
                return;
            }

            if (this.contactCooldown > 0) this.contactCooldown -= dt;
            if (this._hitFlash > 0) this._hitFlash -= dt;

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
            if (
                player &&
                player.room === this.room &&
                this.contactCooldown <= 0
            ) {
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
            if (!player.groundPounding) {
                const dy = player.y + player.h / 2 - (this.y + this.h / 2);

                //player standing on enemy
                //if (dy < -0.1 && player.yv >= 0) return;

                const dx = player.x + player.w / 2 - (this.x + this.w / 2);
                player.xv = Math.sign(dx || 1) * 15;
                player.yv = -10;
                player.takeDamage(20);
            }
        }

        /** @param {number} amount */
        takeDamage(amount) {
            this._hitFlash = 0.12;
            this.health -= amount;
            if (this.health <= 0) this.die();
        }

        die() {
            if (this.dead) return;
            this.dead = true;
            this._deathTimer = 0;
        }

        deathAlpha(ctx) {
            ctx.globalAlpha =
                1 -
                this._deathTimer /
                    (this.constructor.deathAnimationTime ??
                        MEnemy.deathAnimationTime);
        }

        render(ctx, camera, t, pixel) {
            ctx.save();
            this.deathAlpha(ctx);
            super.render(ctx, camera, t, pixel);
            ctx.restore();
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
            this.tileMap = tileMap;

            for (const row in worldAssembly) {
                this.rooms.push([]);
                for (const col in worldAssembly[row]) {
                    if (this.assembly[row][col] in roomData) {
                        this.rooms[row].push({
                            zia: {},
                            indices: [],
                            entities: [],
                            loaded: false,
                            width: 0,
                            height: 0,
                            row: parseFloat(row),
                            col: parseFloat(col),
                        });

                        const room = this.rooms[row][col];
                        const key = this.assembly[row][col];

                        //support both plain array rooms {} roomies yk
                        const roomDef = this.roomData[key];
                        const bitmap = Array.isArray(roomDef)
                            ? roomDef
                            : roomDef.bitmap;

                        //per-room entities take priority; fall back to globalEntityMap
                        const entityMap =
                            !Array.isArray(roomDef) && roomDef.entities
                                ? roomDef.entities
                                : globalEntityMap;

                        const { width, height } = this.build(room, bitmap, tileMap);
                        room.width = width;
                        room.height = height;

                        if (typeof PlatformGraph !== "undefined") {
                            room.graph = new PlatformGraph(
                                bitmap,
                                tileMap,
                                this.engine,
                            );
                        }

                        this._spawnEntities(room, bitmap, entityMap);

                        room.loaded = true;
                    } else {
                        this.rooms[row].push(null);
                    }
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
        add(room, obj, z = 0) {
            if (!room.zia[z]) {
                room.zia[z] = [];
                // find the index at which to put z into indices
                let i = 0;
                while (i < room.indices.length && room.indices[i] < z) i++;
                room.indices.splice(i, 0, z); // At index i, remove 0 elements, and insert z
            }
            room.zia[z].push(obj);
            obj.engine = this.engine;
            obj.room = room;
        }

        // TODO: ADD JSDOC!!!
        build(room, bitmap, tileMap) {
            //storage for future ref (maybe for an LOS)
            room.bitmap = bitmap;

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
                        if (c < 0 || c >= (bitmap[r]?.length ?? 0))
                            return false;
                        return bitmap[r][c] === ch;
                    };

                    const N = solid(row - 1, col);
                    const E = solid(row, col + 1);
                    const S = solid(row + 1, col);
                    const W = solid(row, col - 1);

                    const NE = N && E && solidDiag(row - 1, col + 1);
                    const SE = S && E && solidDiag(row + 1, col + 1);
                    const SW = S && W && solidDiag(row + 1, col - 1);
                    const NW = N && W && solidDiag(row - 1, col - 1);
                    const key8 =
                        (N ? "y" : "n") +
                        (NE ? "y" : "n") +
                        (E ? "y" : "n") +
                        (SE ? "y" : "n") +
                        (S ? "y" : "n") +
                        (SW ? "y" : "n") +
                        (W ? "y" : "n") +
                        (NW ? "y" : "n");

                    //cardinals only, for tilesets that don't have diagonal variants
                    const key4 = key8[0] + key8[2] + key8[4] + key8[6];
                    const sprite =
                        def.tileset[key8] ??
                        def.tileset[key4] ??
                        def.tileset["nnnn"];
                    if (!sprite) {
                        //remove later
                        console.error(
                            `WorldBuilder: missing sprite key "${key}" for '${ch}' at (${col},${row})`,
                        );
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
                    if (entity) this.addEntity(room, entity);
                }
            }
        }

        addEntity(room, entity) {
            room.entities.push(entity);
            entity.engine = this.engine;
            if (!entity.room) {
                entity.room = room;
                entity.sroom = room;
            }
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
                const arr = oldRoom.entities;
                const idx = arr.indexOf(entity);
                if (idx !== -1) {
                    arr.splice(idx, 1);
                    this.addEntity(entity.room, entity);
                }

                if (
                    entity === this.engine?.player &&
                    !entity._roomChangedThisFrame
                ) {
                    const dr = entity.room.row - oldRoom.row;
                    const dc = entity.room.col - oldRoom.col;
                    const dir =
                        dc > 0 && dc > Math.abs(dr)
                            ? "right"
                            : dc < 0 && -dc > Math.abs(dr)
                                ? "left"
                                : dr > 0 && dr >= Math.abs(dc)
                                ? "bottom"
                                : "top";
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
            if (room) {
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
            const { canvas, tileSize, resolution } = config;
            this.res = resolution ?? 9;
            this.canvas = canvas;
            this.tsz = tileSize ?? 20;
            this.baseTsz = this.tsz;
            this.viewBox = new MBox(0, 0, 0, 0);
            this.focus(0, 0);
        }

        /** Gets canvas width and height. */
        get w() {
            return this.canvas.effectiveWidth ?? this.canvas.width;
        }
        get h() {
            return this.canvas.effectiveHeight ?? this.canvas.height;
        }

        /** Focus the camera at a particular (world) point.
         *
         * @param {number} x
         * @param {number} y
         * @returns {void}
         */
        // focus(x, y) {
        //     this.focusX = x;
        //     this.focusY = y;
        //     this.viewBox.setWH(
        //         this.focusX - this.w / this.tsz / 2,
        //         this.focusY - this.h / this.tsz / 2,
        //         this.w / this.tsz, this.h / this.tsz
        //     );
        // }

        focus(x, y) {
            this.focusX = x;
            this.focusY = y;
            //snap to pixel grid
            const snappedFX = Math.floor(x * this.tsz) / this.tsz;
            const snappedFY = Math.floor(y * this.tsz) / this.tsz;
            this.viewBox.setWH(
                snappedFX - this.w / this.tsz / 2,
                snappedFY - this.h / this.tsz / 2,
                this.w / this.tsz,
                this.h / this.tsz,
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
                // this.tsz = Math.ceil(Math.max(this.baseTsz, tszX, tszY));
                // //const raw = Math.max(this.baseTsz, tszX, tszY);
                // //this.tsz = Math.ceil(raw / this.res) * this.res;
                const raw = Math.max(this.baseTsz, tszX, tszY);
                this.tsz = Math.ceil(raw / this.res) * this.res;
            }

            //visible world area at the (possibly zoomed) tsz
            const vw = this.w / this.tsz;
            const vh = this.h / this.tsz;

            //clamp so the view never shows outside [0, room.width] x [0, room.height]
            const fx = Math.max(vw / 2, Math.min(room.width - vw / 2, cx));
            const fy = Math.max(vh / 2, Math.min(room.height - vh / 2, cy));

            this.focus(
                this.lockFocusX ? this.focusX : fx,
                this.lockFocusY ? this.focusY : fy,
            );
        }

        /** Returns true if the object is currently in view.
         *
         * @param {*} obj
         * @returns {boolean}
         */
        inView(obj) {
            // MMimic is a special case, cz it can throw spike balls that are outside its view box
            // and i was too lazy to do stuff the proper way
            // so here we go lol
            return (
                obj instanceof MMimic ||
                (obj?.dbox?.collision?.(this.viewBox) ?? false)
            );
        }

        /** Takes world coordinates, returns screen coordinates.
         *
         * @param {number} x
         * @param {number} y
         * @returns {{ x: number, y: number }}
         */
        // worldToScreen(x, y) {
        //     return {
        //         x: (x - this.focusX) * this.tsz + this.w / 2,
        //         y: (y - this.focusY) * this.tsz + this.h / 2,
        //     };
        // }

        // worldToScreen(x, y) {
        //     return {
        //         x: Math.round((x - this.focusX) * this.tsz + this.w / 2),
        //         y: Math.round((y - this.focusY) * this.tsz + this.h / 2),
        //     };
        // }
        // worldToScreen(x, y) {
        //     return {
        //         x: Math.floor((x - this.focusX) * this.tsz + this.w / 2),
        //         y: Math.floor((y - this.focusY) * this.tsz + this.h / 2),
        //     };
        // }
        // worldToScreen(x, y) {
        //     const px = this.tsz / this.res;
        //     return {
        //         x: Math.round(((x - this.focusX) * this.tsz + this.w / 2) / px) * px,
        //         y: Math.round(((y - this.focusY) * this.tsz + this.h / 2) / px) * px,
        //     };
        // }
        worldToScreen(x, y) {
            return {
                x:
                    Math.floor(x * this.tsz) -
                    Math.floor(this.focusX * this.tsz) +
                    Math.floor(this.w / 2),
                y:
                    Math.floor(y * this.tsz) -
                    Math.floor(this.focusY * this.tsz) +
                    Math.floor(this.h / 2),
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
        constructor(engine, canvas, tileSize = 36, resolution = 9) {
            this.engine = engine;
            this.canvas = canvas;
            this.ctx = canvas.getContext("2d");
            this.tsz = tileSize;
            this.res = resolution;
            this.pixel = tileSize / resolution;
            this.basePixel = tileSize / resolution;
            this.camera = new MCamera({
                canvas: this.canvas,
                tileSize: this.tsz,
                resolution: this.res,
            });
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
            this.engine.world.iterateRoom(room, (obj) => {
                if (obj instanceof MPlayer) return; // skip player — fixes clip in snapshot
                if (this.camera.inView(obj))
                    obj.render(this.ctx, this.camera, t, this.pixel);
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
                this.engine.world.iterateRoom(
                    this.engine.player.room,
                    (obj) => {
                        const hbox = obj.hbox ?? obj.dbox;
                        if (!hbox) return;
                        const topLeft = this.camera.worldToScreen(
                            hbox.x1,
                            hbox.y1,
                        );
                        const botRight = this.camera.worldToScreen(
                            hbox.x2,
                            hbox.y2,
                        );
                        this.ctx.save();
                        this.ctx.strokeStyle = "red";
                        this.ctx.lineWidth = 1;
                        this.ctx.strokeRect(
                            topLeft.x,
                            topLeft.y,
                            botRight.x - topLeft.x,
                            botRight.y - topLeft.y,
                        );
                        this.ctx.restore();
                    },
                );
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
        constructor(config = {}) {
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
        static create(options = {}) {
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
            this.world.addEntity(this.world.rooms[0][0], this.player);
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
            this.eventsPrev = eventsPrev;
            this.lastDt = dt;
            //for transistions
            if (!this.renderer._skipRender) this.renderer.render(t);

            //this.renderer.render(t);
            this.player.tick(dt, events, eventsPrev);
            if (this.player.health <= 0) {
                this.player.onDeath?.();
                this.player.x = this.player.sx;
                this.player.y = this.player.sy;
                this.player.room = this.player.sroom;
                this.player.xv = 0;
                this.player.yv = 0;
                this.player.health = this.player.maxHealth;
                this.player.transport();
            }

            //this.player._transportLock = false;
            this.player._roomChangedThisFrame = false;

            this.world.iterate((obj) => {
                if (obj !== this.player && typeof obj.tick === "function")
                    obj.tick(dt);
            });
        }
    }

    class MCheckpoint extends MDecorative {
        static ACTIVATE_RADIUS = 3;
        static LIGHT_UP_DURATION = 0.7;
        static ANIM_FPS = 6;

        constructor(x, y) {
            super(x, y, 2, 4, (t, self) => {
                if (self.state === "lighting") {
                    const frames = gfx.props.misc.totemLightUp;
                    const frame = Math.min(
                        frames.length - 1,
                        Math.floor(
                            (self.stateTime / MCheckpoint.LIGHT_UP_DURATION) *
                                frames.length,
                        ),
                    );
                    return frames[frame];
                }
                if (self.state === "on") {
                    const frames = gfx.props.misc.totemOn;
                    return frames[
                        Math.floor(t * MCheckpoint.ANIM_FPS) % frames.length
                    ];
                }
                return gfx.props.misc.totemOff[0];
            });
            this.state = "off";
            this.stateTime = 0;
        }

        tick(dt) {
            this.stateTime += dt;
            const player = this.engine?.player;
            if (!player) return;

            const dx = player.x + player.w / 2 - (this.x + 1);
            const dy = player.y + player.h / 2 - (this.y + 2);
            if (
                Math.sqrt(dx * dx + dy * dy) <= MCheckpoint.ACTIVATE_RADIUS &&
                player.room == this.room
            ) {
                if (this.state === "off") {
                    this._activate(player);
                }
                player.health += 200 * dt;
                player.health = Math.min(player.health, player.maxHealth);
            }

            if (
                this.state === "lighting" &&
                this.stateTime >= MCheckpoint.LIGHT_UP_DURATION
            ) {
                this.state = "on";
                this.stateTime = 0;
            }
        }

        _activate(player) {
            //turn off every other checkpoint in the world
            this.engine.world.iterate((obj) => {
                if (obj instanceof MCheckpoint && obj !== this) {
                    obj.state = "off";
                    obj.stateTime = 0;
                }
            });

            this.state = "lighting";
            this.stateTime = 0;

            //reposition the player's respawn point to the base of this totem
            player.sx = this.x + 1 - player.w / 2;
            player.sy = this.y + 4 - player.h - this.engine.epsilon;
            player.sroom = this.room;
        }
    }

    class MTeleportEntryPoint extends MDecorative {
        static OPEN_BUBBLE_RADIUS = 4; /*
        static ANIM_FPS = 3;
        static DEBUG_RADIUS = false;*/

        constructor(x, y, to) {
            super(x, y, 1, 1, (t, self) => gfx.props.environment.tongue[1]);

            this.to = to;
            this.inRange = false;

            //html junk ask arrow
            const overlay = document.getElementById("overlay");

            this._prompt = document.createElement("div");
            this._prompt.className = "npc-prompt";
            this._prompt.textContent = "SPACE to enter";
            this._prompt.style.display = "none";
            overlay.appendChild(this._prompt);
        }

        tick(dt) {
            const player = this.engine?.player;
            if (!player) return;

            const { events, eventsPrev } = this.engine;
            const spaceNow = !!events.Space;
            const spaceJust = spaceNow && !eventsPrev.Space;

            //proximity check
            const cx = this.x + 1,
                cy = this.y + 1.5;
            const px = player.x + player.w / 2,
                py = player.y + player.h / 2;
            const dist = Math.hypot(px - cx, py - cy);
            this.inRange =
                dist <= MNPC.TALK_RADIUS && this.room === player.room;

            //advance n' open n' close on space
            if (this.inRange && spaceJust) {
                const p = this.engine.player;
                const assembly = this.engine.world.assembly;
                // find room in assembly
                let room;
                for (const row in assembly) {
                    for (const col in assembly[row]) {
                        if (assembly[row][col] == this.to) {
                            room = this.engine.world.rooms[row][col];
                            break;
                        }
                    }
                }
                if (!room) throw "cannot find room";
                p.room = room;
                // find spawn point in room
                for (const e of room.entities) {
                    if (e instanceof MTeleportEntryPoint) {
                        p.x = e.x;
                        p.y = e.y;
                        break;
                    }
                }
            }

            this._syncHTML();
        }

        _syncHTML() {
            if (!this.engine?.renderer) return;
            const camera = this.engine.renderer.camera;

            //pos element above the thing's head
            const { x: sx, y: sy } = camera.worldToScreen(
                this.x + 1,
                this.y - 0.3,
            );

            //proximity prompt stuffs
            if (this.inRange) {
                this._prompt.style.left = `${sx}px`;
                this._prompt.style.top = `${sy - 4}px`;
                this._prompt.style.display = "block";
            } else {
                this._prompt.style.display = "none";
            }
        }

        render(ctx, camera, t, pixel) {
            super.render(ctx, camera, t, pixel);

            //for debug stuffs
            // if (MNPC.DEBUG_RADIUS) {
            //     const { x, y } = camera.worldToScreen(this.x + 1, this.y + 1.5);
            //     ctx.save();
            //     ctx.strokeStyle = 'rgba(255, 0,0,0.7)';
            //     ctx.lineWidth = 2;
            //     //I will forever use this (found out about it last month)
            //     ctx.setLineDash([4, 4]);
            //     ctx.beginPath();
            //     ctx.arc(x, y, MNPC.TALK_RADIUS * camera.tsz, 0, Math.PI * 2);
            //     ctx.stroke();
            //     ctx.restore();
            // }
        }

        //call this when room is bye bye so we don't get 10 missed calls from the DOM
        destroy() {
            this._prompt?.remove();
        }
    }

    class MTeleportSpawnPoint extends MDecorative {
        constructor(x, y) {
            super(x, y, 1, 1, (t, self) => gfx.empty);
        }
    }

    class MGauntletDoor extends MSolid {
        static ANIM_FPS = 15;
        static ANIM_DURATION = 1;

        constructor(x, y, roomSide) {
            super(x, y, 1, 3, (t, self) => {
                const closingFrames = gfx.props.misc.gauntletDoorOpen;
                const openingFrames = gfx.props.misc.gauntletDoorClose;

                if (self._state === "open") {
                    return openingFrames[openingFrames.length - 1];
                }
                if (self._state === "opening") {
                    const fi = Math.min(
                        openingFrames.length - 1,
                        Math.floor(self._stateTimer * MGauntletDoor.ANIM_FPS),
                    );
                    return openingFrames[fi];
                }
                if (self._state === "closing") {
                    const fi = Math.min(
                        closingFrames.length - 1,
                        Math.floor(self._stateTimer * MGauntletDoor.ANIM_FPS),
                    );
                    return closingFrames[fi];
                }
                return closingFrames[closingFrames.length - 1];
            });

            this._state = "open";
            this._roomSide = roomSide;
            this.completed = false;
            this._stateTimer = 0;
            this._gauntletStarted = false;

            //start with no hitbox (door is open)
            this._updateSolidity();
        }

        /** Disable hitbox while open/opening; restore it while closing/closed. */
        _updateSolidity() {
            if (this._state === "open" || this._state === "opening") {
                //no collision
                this.hbox.set(-99999, -99999, -99998, -99998);
            } else {
                this.hbox.setWH(this.x, this.y, this.w, this.h);
            }
            this.dbox.setWH(this.x, this.y, this.w, this.h);
        }

        /**
         * Returns true when every MEnemy in the room is dead (or removed).
         * A small start-delay is enforced by the caller so lazily-spawned
         * enemies (MSwarmerUnit etc.) have time to appear.
         */
        _checkAllEnemiesDefeated() {
            const room = this.room;
            if (!room) return false;

            for (const entity of room.entities) {
                if (entity instanceof MEnemy && !entity.dead) return false;
            }
            for (const z of room.indices) {
                for (const obj of room.zia[z]) {
                    if (obj instanceof MEnemy && !obj.dead) return false;
                }
            }
            return true;
        }

        //tick tock
        tick(dt) {
            const player = this.engine?.player;
            if (!player) return;

            //completed gauntlets stay open forever
            if (this.completed) {
                this._state = "open";
                this._updateSolidity();
                return;
            }

            if (this.room !== player.room) {
                if (this._state !== "open") {
                    this._state = "open";
                    this._stateTimer = 0;
                    this._gauntletStarted = false;
                    this._updateSolidity();
                }
                return;
            }

            //only run logic when the player is actually in this room.
            if (this.room !== player.room) return;

            switch (this._state) {

                case "open": {
                    //detect the player crossing the threshold inward.
                    const crossed =
                        (this._roomSide === "right" && player.x + player.w < this.x) ||
                        (this._roomSide === "left"  && player.x > this.x + this.w);

                    if (crossed) {
                        this._state = "closing";
                        this._stateTimer = 0;
                    }
                    break;
                }

                case "closing": {
                    this._stateTimer += dt;
                    if (this._stateTimer >= MGauntletDoor.ANIM_DURATION) {
                        this._state = "closed";
                        this._stateTimer = 0;
                        this._gauntletStarted = true;
                    }
                    break;
                }

                case "closed": {
                    this._stateTimer += dt;
                    //grace peroid
                    if (
                        this._gauntletStarted &&
                        this._stateTimer > 0.2 &&
                        this._checkAllEnemiesDefeated()
                    ) {
                        this._state = "opening";
                        this._stateTimer = 0;
                    }
                    break;
                }

                case "opening": {
                    this._stateTimer += dt;
                    if (this._stateTimer >= MGauntletDoor.ANIM_DURATION) {
                        this._state = "open";
                        this._stateTimer = 0;
                        this.completed = true;
                    }
                    break;
                }
            }

            this._updateSolidity();
        }

        //render
        render(ctx, camera, t, pixel) {
            //nothing to draw once the gauntlet is cleared
            //if (this._state === "open" && this.completed) return;
            super.render(ctx, camera, t, pixel);
        }
    }

    class MNPC extends MDecorative {
        static TALK_RADIUS = 4;
        static ANIM_FPS = 3;
        static DEBUG_RADIUS = false;

        constructor(x, y, dialogue = [], spriteKey = "pakala") {
            super(x, y, 2, 3, (t, self) => {
                const frames = gfx.props.npcs[self.spriteKey];
                if (!frames) return gfx.props.npcs.pakala[0];

                //handle both animated arr and static
                if (Array.isArray(frames)) {
                    return frames[
                        Math.floor(t * MNPC.ANIM_FPS) % frames.length
                    ];
                }
                return frames;
            });

            this.spriteKey = spriteKey;
            this.dialogue = dialogue;
            this.dialogueIndex = -1;
            this.inRange = false;

            //html junk ask arrow
            const overlay = document.getElementById("overlay");

            this._bubble = document.createElement("div");
            this._bubble.className = "npc-bubble";
            this._bubble.style.display = "none";
            overlay.appendChild(this._bubble);

            this._prompt = document.createElement("div");
            this._prompt.className = "npc-prompt";
            this._prompt.textContent = "SPACE to talk";
            this._prompt.style.display = "none";
            overlay.appendChild(this._prompt);
        }

        tick(dt) {
            const player = this.engine?.player;
            if (!player) return;

            const { events, eventsPrev } = this.engine;
            const spaceNow = !!events.Space;
            const spaceJust = spaceNow && !eventsPrev.Space;

            //proximity check
            const cx = this.x + 1,
                cy = this.y + 1.5;
            const px = player.x + player.w / 2,
                py = player.y + player.h / 2;
            const dist = Math.hypot(px - cx, py - cy);
            this.inRange =
                dist <= MNPC.TALK_RADIUS && this.room === player.room;

            //lose dialogue if player walks away
            if (!this.inRange) {
                this.dialogueIndex = -1;
            }

            //advance n' open n' close on space
            if (this.inRange && spaceJust) {
                if (this.dialogueIndex === -1) {
                    this.dialogueIndex = 0;
                } else {
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
            const { x: sx, y: sy } = camera.worldToScreen(
                this.x + 1,
                this.y - 0.3,
            );

            const talking =
                this.dialogueIndex >= 0 &&
                this.dialogueIndex < this.dialogue.length;

            //yap bubble, I HATE modifying CSS with JS
            if (talking) {
                const line = this.dialogue[this.dialogueIndex];
                const progress = `${this.dialogueIndex + 1} / ${this.dialogue.length}`;
                this._bubble.innerHTML =
                    `${line.replace(/\n/g, "<br>")}` +
                    `<span class="npc-progress">${progress} &nbsp;[SPACE]</span>`;
                this._bubble.style.left = `${sx}px`;
                this._bubble.style.top = `${sy}px`;
                this._bubble.style.display = "block";
            } else {
                this._bubble.style.display = "none";
            }

            //proximity prompt stuffs
            if (this.inRange && !talking && this.dialogue.length > 0) {
                this._prompt.style.left = `${sx}px`;
                this._prompt.style.top = `${sy - 4}px`;
                this._prompt.style.display = "block";
            } else {
                this._prompt.style.display = "none";
            }
        }

        render(ctx, camera, t, pixel) {
            super.render(ctx, camera, t, pixel);

            //for debug stuffs
            // if (MNPC.DEBUG_RADIUS) {
            //     const { x, y } = camera.worldToScreen(this.x + 1, this.y + 1.5);
            //     ctx.save();
            //     ctx.strokeStyle = 'rgba(255, 0,0,0.7)';
            //     ctx.lineWidth = 2;
            //     //I will forever use this (found out about it last month)
            //     ctx.setLineDash([4, 4]);
            //     ctx.beginPath();
            //     ctx.arc(x, y, MNPC.TALK_RADIUS * camera.tsz, 0, Math.PI * 2);
            //     ctx.stroke();
            //     ctx.restore();
            // }
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
            this.JUMP_H = Math.max(
                1,
                Math.ceil((jump * jump) / (2 * gravity)) + 1,
            );
            this.JUMP_W = this.JUMP_H + 3;

            this.nodes = this._build();
        }

        //help me
        _solid(r, c) {
            return (this.bitmap[r]?.[c] ?? " ") in this.tileMap;
        }
        _open(r, c) {
            return !this._solid(r, c);
        }

        /** Standable = open tile with a solid tile directly below */
        _standable(r, c) {
            return this._open(r, c) && this._solid(r + 1, c);
        }

        _build() {
            const rows = this.bitmap.length;
            const cols = Math.max(...this.bitmap.map((l) => l.length));
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
                        node.edges.push({
                            to: nb,
                            move: dir > 0 ? "right" : "left",
                            jump: false,
                        });
                }

                //fall off edges into air column, land on lower node
                for (const dir of [-1, 1]) {
                    const nc = c + dir;
                    if (this._open(r, nc)) {
                        for (let dr = 1; dr <= 12; dr++) {
                            const nr = r + dr;
                            const nb = nodes.get(`${nc},${nr}`);
                            if (nb) {
                                node.edges.push({
                                    to: nb,
                                    move: dir > 0 ? "right" : "left",
                                    jump: false,
                                });
                                break;
                            }
                            if (this._solid(nr, nc)) break;
                        }
                    }
                }

                //any standable tile within the parabolic jump envelope
                for (let dc = -JUMP_W; dc <= JUMP_W; dc++) {
                    for (let dr = 1; dr <= JUMP_H; dr++) {
                        const nb = nodes.get(`${c + dc},${r - dr}`);
                        if (nb)
                            node.edges.push({
                                to: nb,
                                move: dc >= 0 ? "right" : "left",
                                jump: true,
                            });
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
                path.unshift({
                    c: edge.to.c,
                    r: edge.to.r,
                    move: edge.move,
                    jump: edge.jump,
                });
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
            const goalKey = this._nearestKey(Math.round(tx), Math.floor(ty));

            if (!startKey || !goalKey) return null;
            if (startKey === goalKey) return [];

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
        constructor(x, y, variant = "g1") {
            const sprites = gfx.enemies.slimes[variant];
            const big = variant.endsWith("2");
            const w = big ? 0.88 : 0.6;
            const h = big ? 0.77 : 0.55;
            const hp = big ? 90 : 30;

            super(x, y, w, h, hp, (t, self) => {
                if (self._hitFlash > 0) return sprites.hurt;
                const fps = self.state === "jump" ? 10 : 4;
                const frames = sprites[self.state] ?? sprites.idle;
                const frame = Math.floor(t * fps) % frames.length;
                return frames[frame];
            });

            this.sprites = sprites;
            this.patrolDir = 1;
            this.jumpCooldown = 1 + Math.random() * 1.5;
            this.stallTimer = 0;

            //AI crap
            this.aggroRange = big ? 8 : 6;
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
                this.chaseMode = true;
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
            this.state = this.grounded ? "idle" : "jump";
        }

        _runChase(dt) {
            //use the graph to navigate
            this._updatePath(dt, 0.5);

            if (this._path?.length) {
                this._followPath(dt);
            } else {
                //graph went bleh
                const hDir = this._playerHDir();
                if (hDir === 1) this._moveRight = true;
                if (hDir === -1) this._moveLeft = true;
                this.facing = hDir || this.facing;
            }
        }

        /** Patrol: walk back and forth, jump periodically. */
        _runPatrol(dt) {
            if (this.patrolDir === 1) this._moveRight = true;
            else this._moveLeft = true;
            this.facing = this.patrolDir;

            if (this.grounded && Math.abs(this.xv) < 0.15) {
                this.stallTimer += dt;
                if (this.stallTimer > 0.25) {
                    this.patrolDir *= -1;
                    this.stallTimer = 0;
                    this.stateTime = 0;
                }
            } else {
                this.stallTimer = 0;
            }

            this.jumpCooldown -= dt;
            if (this.grounded && this.jumpCooldown <= 0) {
                this._jumpQueued = true;
                this.jumpCooldown = 1.5 + Math.random() * 2;
            }
        }
    }

    class MPoundFloor extends MSolid {
        static BREAK_DURATION = 0.4;
        static ANIM_FPS = 16;

        constructor(x, y, type) {
            super(x, y, 3, 1, (t, self) => {
                if (!self._breaking) {
                    if (self.type == "grassy") {
                        return gfx.props.misc.grassyBreakFloor;
                    } else if (self.type == "brick") {
                        return gfx.props.misc.brickBreakFloor;
                    } else if (self.type == "mushroom") {
                        return gfx.props.misc.mushroomBreakFloor;
                    }
                } else {
                    const frames = gfx.props.misc.breakFloorHit;
                    const fi = Math.floor(t * MPoundFloor.ANIM_FPS) % frames.length;
                    return frames[fi];
                }
            });

            this._breaking = false;
            this._breakTimer = 0;
            this.type = type;
            this.tempBox = MBox.fromWH(0, 0, 0, 0)
        }

        onGroundPound() {
            if (this._breaking == false) {
                this._breaking = true;
                this._breakTimer = 0;
            }
            return true;
        }

        tick(dt) {
            
            if (!this._breaking) {
                let player = this.engine?.player;

                this.tempBox.setWH(player.x, player.y, player.w, player.h + 0.5);

                if (player && player.room == this.room && player.state == "groundpound" && this.hbox.collision(this.tempBox)) {
                    this.onGroundPound();
                }
            } else {
                this._breakTimer += dt;
                if (this._breakTimer >= MPoundFloor.BREAK_DURATION) {
                    const room = this.room;
                    if (!room) return;
                    const i = room.entities.indexOf(this);
                    if (i !== -1) room.entities.splice(i, 1);
                }
            }
        }
    }

    class MBreakWall extends MSolid {
        static BREAK_DURATION = 0.4;

        /**
         * @param {number} x
         * @param {number} y
         * @param {'brickBreakWall'|'grassyBreakWall'|'mushroomBreakWall'} variant
         * @param {'left'|'right'} breakSide  - which face the ball must strike
         */
        constructor(x, y, variant = "brickBreakWall", breakSide = "right") {
            super(x, y, 2, 3, (t, self) => {
                if (self._breaking) {
                    const frames = gfx.props.misc.breakWallHit;
                    const fi = Math.min(
                        frames.length - 1,
                        Math.floor(
                            (self._breakTimer / MBreakWall.BREAK_DURATION) *
                                frames.length,
                        ),
                    );
                    return frames[fi];
                }
                return gfx.props.misc[variant];
            });
            this.variant = variant;
            this.breakSide = breakSide;
            this._breaking = false;
            this._breakTimer = 0;
        }

        /** Called by MBall. Returns true when the wall actually breaks.
         * @param {MBall} ball
         * @returns {boolean}
         */
        onBallHit(ball) {
            if (this._breaking) return false;

            const ballCx = ball.x + ball.w / 2;
            const wallCx = this.x + this.w / 2;
            const fromRight = ballCx >= wallCx && ball.xv <= 0;
            const fromLeft = ballCx <= wallCx && ball.xv >= 0;

            const valid =
                (this.breakSide === "right" && fromRight) ||
                (this.breakSide === "left" && fromLeft);
            if (!valid) return false;

            this._breaking = true;
            this._breakTimer = 0;
            return true;
        }

        render(ctx, camera, t, pixel) {
            if (!camera.inView(this)) return;
            const { x, y } = camera.worldToScreen(this.x, this.y);
            this.texturer(t, this).draw(ctx, x, y, pixel);
        }

        tick(dt) {
            if (!this._breaking) return;
            this._breakTimer += dt;
            if (this._breakTimer >= MBreakWall.BREAK_DURATION) {
                const room = this.room;
                if (!room) return;
                const i = room.entities.indexOf(this);
                if (i !== -1) room.entities.splice(i, 1);
            }
        }
    }

    /** MSpear: thrown spear projectile. Sticks into surfaces, then despawns. */
    class MSpear extends MEntity {
        static STUCK_DURATION = 3.0;
        static DAMAGE = 25;
        static GRAVITY = 18;

        constructor(owner, xv, yv) {
            //hittttbooooxxxxxx
            const w = 1.2,
                h = 0.25;
            super(
                owner.x + (owner.facing === 1 ? owner.w : -w),
                owner.y + owner.h * 0.2,
                w,
                h,
                1,
                () => gfx.enemies.minitaur.spear,
            );

            this.engine = owner.engine;
            this.room = owner.room;
            this.sroom = owner.room;
            this.xv = xv;
            this.yv = yv;
            this.owner = owner;
            this.stuck = false;
            this.stuckTimer = 0;
            this.angle = Math.atan2(yv, xv);
            this.dead = false;
            this._ownerNotified = false;
        }

        render(ctx, camera, t, pixel) {
            if (this.dead || !camera.inView(this)) return;
            const sprite = gfx.enemies.minitaur.spear;
            const sw = sprite.w * pixel;
            const sh = sprite.h * pixel;
            //rotate around the hitbox center
            const { x, y } = camera.worldToScreen(
                this.x + this.w / 2,
                this.y + this.h / 2,
            );
            ctx.save();
            ctx.translate(x, y);

            //apply rot
            ctx.rotate(this.angle + Math.PI / 2);
            sprite.draw(ctx, -sw / 2, -sh / 2, pixel);
            ctx.restore();
        }

        _updateTipHitbox() {
            const tipSize = 0.2;
            const tipX =
                this.x +
                this.w / 2 +
                Math.cos(this.angle) * (this.w / 2) -
                tipSize / 2;
            const tipY =
                this.y +
                this.h / 2 +
                Math.sin(this.angle) * (this.w / 2) -
                tipSize / 2;
            this.hbox.setWH(tipX, tipY, tipSize, tipSize);
        }

        tick(dt) {
            if (this.dead) return;
            const { world, epsilon } = this.engine;

            if (this.stuck) {
                this.stuckTimer += dt;
                if (this.stuckTimer >= MSpear.STUCK_DURATION) {
                    this.owner?.onSpearDone?.();
                    this.remove();
                }
                return;
            }

            //count down then vanish
            if (this.stuck) {
                this.stuckTimer += dt;
                if (this.stuckTimer >= MSpear.STUCK_DURATION) this.remove();
                return;
            }

            //gravity an angle
            this.yv += MSpear.GRAVITY * dt;
            this.angle = Math.atan2(this.yv, this.xv);

            //x movement
            this.x += this.xv * dt;
            this.transport();
            if (this.touching(MSolid, world)) {
                //push
                this.x -= this.xv * dt;
                this.transport();
                this._stick();
                return;
            }

            //y?
            this.y += this.yv * dt;
            this.transport();
            const yt = this.touching(MSolid, world);
            if (yt) {
                this.y =
                    this.yv > 0
                        ? yt.hbox.y1 - this.h - epsilon
                        : yt.hbox.y2 + epsilon;
                this.transport();
                this._stick();
                return;
            }

            //player hit
            const player = this.engine?.player;
            if (player && player.room === this.room) {
                //this.updateHitbox();
                this._updateTipHitbox();
                player.updateHitbox();
                if (this.hbox.collision(player.hbox)) {
                    const dx = player.x + player.w / 2 - (this.x + this.w / 2);
                    player.xv = Math.sign(dx || Math.sign(this.xv)) * 12;
                    player.yv = -8;
                    player.takeDamage(MSpear.DAMAGE);
                    this._notifyOwner();
                    this.remove();
                    return;
                }
            }

            //this.updateHitbox();
            this._updateTipHitbox();
        }

        _stick() {
            this.stuck = true;
            this.stuckTimer = 0;
            this.xv = 0;
            this.yv = 0;
            this.owner?.onSpearStuck?.(this);
            this._updateTipHitbox();
        }

        //minotaur (that is hard to spell honeyghost) is never notified twice
        _notifyOwner() {
            if (this._ownerNotified) return;
            this._ownerNotified = true;
            this.owner?.onSpearDone?.();
        }
    }

    /** MMinitaur: spear-throwing enemy. Patrols, aggros on sight, winds up and throws <3 */
    class MMinitaur extends MEnemy {
        static THROW_RANGE = 14;
        static THROW_WINDUP = 0.55;
        static THROW_COOLDOWN = 2.8;
        static THROW_SPEED = 18;
        static ANIM_FPS = {
            idle: 4,
            run: 8,
            jump: 6,
            fall: 6,
        };

        constructor(x, y) {
            super(x, y, 1.0, 1.4, 60, (t, self) => {
                if (self._hitFlash > 0) return gfx.enemies.minitaur.hurt;
                const frames =
                    gfx.enemies.minitaur[self.state] ??
                    gfx.enemies.minitaur.idle;
                //single SpriteRef
                if (!Array.isArray(frames)) return frames;
                const fps = MMinitaur.ANIM_FPS[self.state] ?? 4;
                return frames[Math.floor(t * fps) % frames.length];
            });

            this.moveSpeed = 5;
            this.aggroRange = 16;
            this.deAggroRange = 22;

            //throw machinery
            this._throwing = false;
            this._windupTimer = 0;
            this._spearActive = false;
            this._throwCooldown = 0;

            this._spear = null;
            this._retrieving = false;
        }

        /** Called by MSpear once it has either stuck or hit the player. */
        onSpearDone() {
            this._spearActive = false;
            this._throwCooldown = MMinitaur.THROW_COOLDOWN;
        }

        _launchSpear() {
            const player = this.engine?.player;
            if (!player) return;

            const dx = player.x + player.w / 2 - (this.x + this.w / 2);
            const dy = player.y + player.h / 2 - (this.y + this.h / 2);
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const spd = MMinitaur.THROW_SPEED;

            const spear = new MSpear(
                this,
                (dx / len) * spd,
                (dy / len) * spd * 0.75,
            );
            this._spear = spear;
            this._spearActive = true;
            this.engine.world.addEntity(this.room, spear);
        }

        onSpearStuck(spear) {
            this._spear = spear;
            this._retrieving = true;
        }

        onSpearDone() {
            this._spearActive = false;
            this._retrieving = false;
            this._spear = null;
            this._throwCooldown = MMinitaur.THROW_COOLDOWN;
        }

        _hasLOS() {
            const player = this.engine?.player;
            if (!player || player.room !== this.room) return false;

            const bitmap = this.room?.bitmap;
            const tileMap = this.engine?.world?.tileMap;
            if (!bitmap || !tileMap) return false;

            //ray from minitaur center to player center
            let x = Math.round(this.x + this.w / 2);
            let y = Math.round(this.y + this.h / 2);
            const x1 = Math.round(player.x + player.w / 2);
            const y1 = Math.round(player.y + player.h / 2);

            const dx = Math.abs(x1 - x),
                sx = x < x1 ? 1 : -1;
            const dy = -Math.abs(y1 - y),
                sy = y < y1 ? 1 : -1;
            let err = dx + dy;

            while (true) {
                if (x === x1 && y === y1) return true;
                const ch = bitmap[y]?.[x] ?? " ";
                const def = tileMap[ch];
                //blocked by any solid tile
                if (def && def.type === MSolid) return false;
                const e2 = 2 * err;
                if (e2 >= dy) {
                    err += dy;
                    x += sx;
                }
                if (e2 <= dx) {
                    err += dx;
                    y += sy;
                }
            }
        }

        ai(dt) {
            if (this.dead) return;

            //lock facing briefly after any direction change to kill the flicker
            if (this._facingLock > 0) {
                this._facingLock -= dt;
                this._moveLeft = this._moveRight = false;
                this.state = "idle";
                return;
            }

            if (this._retrieving && this._spear) {
                const dx =
                    this._spear.x + this._spear.w / 2 - (this.x + this.w / 2);
                if (Math.abs(dx) < 0.8) {
                    this._spear.remove();
                    this.onSpearDone();
                } else {
                    if (dx > 0) this._moveRight = true;
                    else this._moveLeft = true;
                    this.facing = dx > 0 ? 1 : -1;
                    this.state = Math.abs(this.xv) > 0.5 ? "run" : "idle";
                }
                return;
            }

            this._throwCooldown = Math.max(0, this._throwCooldown - dt);

            const dist = this._playerDist();
            const los = this._hasLOS(); // NEW

            // only aggro if player is in range AND visible
            if (!this.chaseMode && dist <= this.aggroRange && los)
                this.chaseMode = true;
            // drop aggro if out of range OR lost sight for a moment
            if (this.chaseMode && (dist > this.deAggroRange || !los))
                this.chaseMode = false;

            //windup stand still, face player, then release
            if (this._throwing) {
                this._windupTimer += dt;
                this.facing = this._playerHDir() || this.facing;
                this.state = "idle";
                if (this._windupTimer >= MMinitaur.THROW_WINDUP) {
                    this._throwing = false;
                    this._windupTimer = 0;
                    this._launchSpear();
                }
                //no move while doing this^^^^^^
                return;
            }

            //dicied to start a throw
            if (
                this.chaseMode &&
                !this._spearActive &&
                this._throwCooldown <= 0 &&
                this.grounded &&
                dist <= MMinitaur.THROW_RANGE
            ) {
                this._throwing = true;
                this._windupTimer = 0;
                return;
            }

            //AI movement
            if (this.chaseMode) {
                this._updatePath(dt, 0.5);
                if (this._path?.length) {
                    this._followPath(dt);
                } else {
                    const hDir = this._playerHDir();
                    if (hDir === 1) this._moveRight = true;
                    if (hDir === -1) this._moveLeft = true;
                    //this.facing = hDir || this.facing;
                    if (hDir && hDir !== this.facing) {
                        this.facing = hDir;
                        this._facingLock = 0.2;
                    }
                }
            } else {
                //patrol
                if (this.patrolDir === 1) this._moveRight = true;
                else this._moveLeft = true;
                this.facing = this.patrolDir;

                if (this.grounded && Math.abs(this.xv) < 0.15) {
                    this.stallTimer += dt;
                    if (this.stallTimer > 0.25) {
                        this.patrolDir *= -1;
                        this.stallTimer = -0.4;
                        this._facingLock = 0.3;
                    }
                } else {
                    this.stallTimer = 0;
                }
            }

            //anim state
            this.state = !this.grounded
                ? this.yv < 0
                    ? "jump"
                    : "fall"
                : Math.abs(this.xv) > 0.5
                  ? "run"
                  : "idle";
        }

        render(ctx, camera, t, pixel) {
            ctx.save();
            this.deathAlpha(ctx);
            const { x, y } = camera.worldToScreen(this.x, this.y);
            const sprite = this.texturer(t, this);
            const offsetX = (this.w * camera.tsz - sprite.w * pixel) / 2;
            const offsetY =
                this.h * camera.tsz - sprite.h * pixel + pixel * 1.3;
            sprite.draw(ctx, x + offsetX, y + offsetY, pixel, this.facing ?? 1);
            ctx.restore();

            // hovering spear
            if (!this._spearActive && !this._throwing && !this._retrieving) {
                const spearSprite = gfx.enemies.minitaur.spear;
                const { x: sx, y: sy } = camera.worldToScreen(
                    this.x + this.w / 2 + this.facing * 0.9,
                    this.y + this.h * 0.4,
                );
                const sw = spearSprite.w * pixel;
                const sh = spearSprite.h * pixel;
                const bob = Math.sin(t * 3) * 2;
                ctx.save();
                ctx.translate(sx, sy + bob);
                ctx.rotate(0);
                spearSprite.draw(ctx, -sw / 2, -sh / 2, pixel);
                ctx.restore();
            }
        }
    }

    /** MMimic: enemy mimicking player, can throw spike balls à la MPlayer. */
    class MMimic extends MEnemy {
        static meleeRange = 5;
        static aggroRange = 14;
        static aimTime = 0.5;
        static maxDrag = MPlayer.maxDrag;
        static minDrag = MPlayer.minDrag;

        constructor(x, y) {
            const sprites = gfx.enemies.mimic;

            super(x, y, 0.97, 1.4, 300, (t, self) => {
                if (self._hitFlash > 0) return gfx.enemies.mimic.hurt;
                const state = self.state ?? "idle";
                const carryMap = {
                    idle: "carryidle",
                    run: "carryrun",
                    jump: "carryjump",
                    fall: "carryfall",
                };
                const holding =
                    self.ball &&
                    (self.engine.slowMo || self.dragging || self.carrying);
                const spriteState =
                    holding && carryMap[state] ? carryMap[state] : state;
                const frames = sprites[spriteState] ?? sprites.idle;
                const fps = ANIM_FPS[state] ?? 6;
                const count = Object.keys(frames).length;
                let frame;

                //if you prefer chaining if else statements you need help
                switch (state) {
                    case "jump":
                    case "fall": {
                        frame = Math.min(
                            count - 1,
                            Math.floor((self.airTime ?? 0) * fps),
                        );
                        break;
                    }
                    case "groundpound": {
                        frame = 0;
                        break;
                    }
                    case "groundpoundimpact": {
                        //play impact frames forward once then hold last
                        frame = Math.min(
                            count - 1,
                            Math.floor((self.impactTime ?? 0) * fps),
                        );
                        break;
                    }
                    case "throw": {
                        const dx = self.dragX - self.dragInitX;
                        const dy = self.dragY - self.dragInitY;
                        const len = Math.sqrt(dx * dx + dy * dy);
                        frame = Math.floor(
                            Math.min(len / self.maxDrag, 1) * (count - 1),
                        );
                        break;
                    }
                    default: {
                        frame = Math.floor(t * fps) % count;
                    }
                }

                //just in case yk?
                frame = Math.max(0, Math.min(count - 1, frame));
                return frames[frame];
            });

            this.sprites = sprites; /*
            this.patrolDir = 1;
            this.jumpCooldown = 1 + Math.random() * 1.5;
            this.stallTimer = 0;

            //AI crap
            this.aggroRange = big ? 8 : 6;
            this.deAggroRange = big ? 12 : 9;
            this.chaseMode = false;  
            this.aggroLatch = 0;*/

            //speed can be adjusted
            this.moveSpeed = 8;

            this.ball = null;
            this._ballTimer = 0;
            this.thrown = false;
            this.throwxv = 0;
            this.throwyv = 0;
            this.throwing = false;
            this._throwTimer = 0;
            this._throwDuration = 0;
            this.tpBall = false;

            this._prevPlayerHealth = null;
        }

        ai(dt) {
            const dist = this._playerDist();
            if (dist <= this.constructor.meleeRange && !this.throwing) {
                this._runChase(dt);
            } else if (dist <= this.constructor.aggroRange || this.throwing) {
                this._ballChase(dt);
            } else if (!this.throwing) {
                this._runPatrol(dt);
            }
        }

        _runChase(dt) {
            this._ballTimer = 0;
            this.moveSpeed = (this.engine.hvel * 4) / 5;

            //use the graph to navigate
            this._updatePath(dt, 0.5);

            if (this._path?.length) {
                this._followPath(dt);
            } else {
                //graph went bleh
                const hDir = this._playerHDir();
                if (hDir === 1) this._moveRight = true;
                if (hDir === -1) this._moveLeft = true;
                this.facing = hDir || this.facing;
            }
        }

        _ballChase(dt) {
            if (!this.throwing) {
                this.carrying = true;
                this._ballTimer += dt;
                if (this._ballTimer >= this.constructor.aimTime) {
                    // this uses a parabolic simulator and minimizing using calculus
                    // to aim for the player
                    // really complicated algebra and calculus was put into figuring this out
                    // this was a pain in th— -xyzyyxx
                    // also this was checked by chatgpt
                    // x(t) = xv * t + x0
                    // y(t) = 1/2 g t^2 + yv * t + y0
                    // constraint:
                    // exists t such that simultaneously:
                    // px = xv * t + x0
                    // py = 1/2 g t^2 + yv * t + y0
                    // => t = (px - x0) / xv
                    // => py = 1/2 g ((px - x0) / xv)^2 + yv * ((px - x0) / xv) + y0
                    // simplifications: px - x0 = Δx, py - y0 = Δy
                    // => Δy = 1/2 g Δx^2 / xv^2 + yv * Δx / xv
                    // minimize xv^2 + yv^2 along that curve
                    // find yv first, then plug it in, and minimize along xv
                    // => (Δy - 1/2 g Δx^2 / xv^2) xv / Δx = yv
                    // => (Δy xv - 1/2 g Δx^2 / xv) / Δx = yv
                    // => xv^2 + yv^2 = xv^2 + (Δy xv - 1/2 g Δx^2 / xv)^2 / Δx^2
                    // = xv^2 + (Δy^2 xv^2 - 2 Δy xv (1/2 g Δx^2 / xv) + 1/4 g^2 Δx^4 / xv^2) / Δx^2
                    // = xv^2 + (Δy^2 xv^2 - Δy g Δx^2 + 1/4 g^2 Δx^4 / xv^2) / Δx^2
                    // = xv^2 + xv^2 Δy^2 / Δx^2 - Δy g + 1/4 g^2 Δx^2 / xv^2
                    // minimize xv^2 + xv^2 Δy^2 / Δx^2 - Δy g + 1/4 g^2 Δx^2 / xv^2
                    // => d(xv^2 + xv^2 Δy^2 / Δx^2 - Δy g + 1/4 g^2 Δx^2 / xv^2)/dxv = 0
                    // => 2xv + 2xv Δy^2 / Δx^2 - 0 - 1/2 g^2 Δx^2 / xv^3 = 0
                    // => 2xv + 2xv Δy^2 / Δx^2 = 1/2 g^2 Δx^2 / xv^3
                    // => 2xv^4 + 2xv^4 Δy^2 / Δx^2 = 1/2 g^2 Δx^2
                    // => xv^4 (1 + Δy^2 / Δx^2) = 1/4 g^2 Δx^2
                    // => xv^4 = 1/4 g^2 Δx^2 / (1 + Δy^2 / Δx^2)
                    // => xv^4 = 1/4 g^2 Δx^4 / (Δx^2 + Δy^2)
                    // => xv = Δx (1/4 g^2 / (Δx^2 + Δy^2))^(1/4)

                    //Arrow commenting here @Judges
                    // shampooed noodles and bacon -xyzyyxx

                    const p = this.engine.player;
                    const g = this.engine.gravity;
                    const delx = p.x - this.x;
                    const dely = p.y - this.y;
                    let xv =
                        delx *
                        Math.pow(
                            ((1 / 4) * g * g) / (delx * delx + dely * dely),
                            1 / 4,
                        );
                    let yv =
                        (dely * xv - ((1 / 2) * g * delx * delx) / xv) / delx;
                    const maxDrag = this.constructor.maxDrag;
                    if (xv * xv + yv * yv > maxDrag * maxDrag) {
                        const factor = maxDrag / Math.sqrt(xv * xv + yv * yv);
                        xv *= factor;
                        yv *= factor;
                    }
                    if (Math.sign(xv / delx) == -1) {
                        xv *= -1;
                        yv *= -1;
                    }
                    this.throwxv = xv;
                    this.throwyv = yv;
                    this.thrown = true;
                    this.carrying = false;
                    this._ballTimer = 0;
                    this._throwDuration = delx / xv;
                }
            } else if (this.throwing) {
                this._throwTimer += dt;
                if (this._throwTimer >= this._throwDuration) {
                    this.tpBall = true;
                    this._throwTimer = 0;
                    this.throwing = false;
                }
            }
        }

        /** Patrol: walk back and forth, jump periodically. */
        _runPatrol(dt) {
            this._ballTimer = 0;
            if (this.patrolDir === 1) this._moveRight = true;
            else this._moveLeft = true;
            this.facing = this.patrolDir;

            if (this.grounded && Math.abs(this.xv) < 0.15) {
                this.stallTimer += dt;
                if (this.stallTimer > 0.25) {
                    this.patrolDir *= -1;
                    this.stallTimer = 0;
                    this.stateTime = 0;
                }
            } else {
                this.stallTimer = 0;
            }

            this.jumpCooldown -= dt;
            if (this.grounded && this.jumpCooldown <= 0) {
                this._jumpQueued = true;
                this.jumpCooldown = 1.5 + Math.random() * 2;
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
            ctx.save();
            this.deathAlpha(ctx);
            super.render(ctx, camera, t, pixel);
            if (this.ball?.room == this.room)
                this.ball?.render?.(ctx, camera, t, pixel);
            ctx.restore();
        }

        /** Tick the game forward
         *
         * @param {number} dt
         * @returns {void}
         */
        tick(dt) {
            super.tick(dt);

            let player = this.engine?.player;
            if (player) {
                if (
                    this._prevPlayerHealth !== null &&
                    this._prevPlayerHealth < player.maxHealth &&
                    player.health >= player.maxHealth
                ) {
                    this.health = this.maxHealth;
                    this.state = "idle";
                }
                this._prevPlayerHealth = player.health;
            }

            if (this.carrying && !this.ball) {
                this.ball = new MBall(this, 0, 0);
            }
            if (this.thrown) {
                //real throw
                //this.carrying = false;
                //this.ball = null;
                this.ball = new MBall(this, this.throwxv, this.throwyv);
                this.thrown = false;
                this.throwing = true;
            } else if (this.tpBall && this.ball) {
                //click while ball is out so holding and dragging right away works for quick chaining
                this.x = this.ball.x + this.ball.w / 2 - this.w / 2;
                this.y = this.ball.y + this.ball.h / 2 - this.h / 2;
                this.xv = this.ball.xv;
                this.yv = this.ball.yv;
                this.room = this.ball.room;
                this.tpBall = false;
                this.throwing = false;
                this.ball = null;
                this.transport();

                //push mimic out of any wall they landed in
                const world = this.engine.world;
                const t = this.touchingAll(MSolid, world);
                const epsilon = this.engine.epsilon;
                if (t) {
                    const colls = [];
                    for (const b of t) {
                        // block to left of player
                        if (b.hbox.x1 < this.hbox.x1 && this.hbox.x1 < b.hbox.x2) {
                            colls.push(["left", b, b.hbox.x2 - this.hbox.x1]);
                        }
                        // block to right of player
                        if (b.hbox.x1 < this.hbox.x2 && this.hbox.x2 < b.hbox.x2) {
                            colls.push(["right", b, this.hbox.x2 - b.hbox.x1]);
                        }
                        // block below player
                        if (b.hbox.y1 < this.hbox.y1 && this.hbox.y1 < b.hbox.y2) {
                            colls.push(["down", b, b.hbox.y2 - this.hbox.y1]);
                        }
                        // block above player
                        if (b.hbox.y1 < this.hbox.y2 && this.hbox.y2 < b.hbox.y2) {
                            colls.push(["up", b, this.hbox.y2 - b.hbox.y1]);
                        }
                    }
                    colls.sort((a, b) => a[2] - b[2]);
                    for (const coll of colls) {
                        const [side, b, pdepth] = coll;
                        if (this.hbox.collision(b.hbox)) {
                            switch (side) {
                                case "left": this.x = b.hbox.x2 + epsilon; break;
                                case "right": this.x = b.hbox.x1 - this.w - epsilon; break;
                                case "down": this.y = b.hbox.y2 + epsilon; break;
                                case "up": this.y = b.hbox.y1 - this.h - epsilon; break;
                            }
                            this.updateHitbox();
                        }
                    }
                }
                this.transport();
            }
            this.ball?.tick?.(dt); /*
            //exit slowmo on keypress or on landing also pretty important
            if (this.engine.slowMo) {
                if (events.KeyA || events.KeyD || events.KeyW || events.KeyS) {
                    this.engine.slowMo = false;
                    this.carrying = true;
                }
                if (this.grounded && !this._wasGrounded) {
                    this.engine.slowMo = false;
                    this.ball = null;
                    this.carrying = false;
                }
            }
            /*
            //recall ball to player on any keypress while it's in free flight
            if (this.ball && !this.carrying && !this.engine.slowMo && !this.dragging) {
                if (events.KeyA || events.KeyD || events.KeyW || events.KeyS) {
                    this.carrying = true;
                }
            }*/

            if (this.ball && this.carrying) {
                this.ball.xv = 0;
                this.ball.yv = 0;
                //this.ball.x = this.x + this.w / 2 - this.ball.w / 2 + 0.05;
                //this is what happens when you just copy my code xyzyyxx
                //this.ball.x = this.x + this.w / 2 - this.ball.w / 2 + this.facing * 0.000000003;
                this.ball.x = this.x + this.w / 2 - this.ball.w / 2;
                this.ball.y = this.y - 0.55;
                this.ball.room = this.room;
                this.ball.updateHitbox();
            }
            /*
            if (events.KeyA) this.facing = -1;
            if (events.KeyD) this.facing = 1;*/
        }
    }

    /**
     * MPowerPillar: collectible fire pillar that grants a player ability.
     * powerType: 'ball' | 'groundedTeleport' | 'groundPound' | 'fullTeleport'
     */
    class MPowerPillar extends MDecorative {
        static COLLECT_RADIUS = 2.5;
        static BOB_SPEED = 2.5;
        static BOB_AMP = 3;
        static ANIM_FPS = 8;

        static CONFIGS = {
            ball: {
                symKey: null,
                glowColor: "rgba(214, 205, 191, 0.35)",
            },
            groundedTeleport: {
                symKey: "pwrSym_groundedTeleport",
                glowColor: "rgba(165,212,202, 0.35)",
            },
            groundPound: {
                symKey: "pwrSym_groundPound",
                glowColor: "rgba(168,0,0,0.35)",
            },
            fullTeleport: {
                symKey: "pwrSym_fullTeleport",
                glowColor: "rgba(165, 212, 202, 0.55)",
            },
            wallJump: {
                symKey: "pwrSym_wallJump",
                glowColor: "rgba(200, 150, 50, 0.4)",
            },
        };

        constructor(x, y, powerType) {
            super(x, y, 2, 3, (t, self) => {
                if (self.collected) return gfx.props.misc.pwrtwroff;
                const frames = gfx.props.misc.pwrtwron;
                return frames[
                    Math.floor(t * MPowerPillar.ANIM_FPS) % frames.length
                ];
            });
            this.powerType = powerType;
            this.collected = false;
        }

        tick(dt) {
            if (this.collected) return;
            const player = this.engine?.player;
            if (!player || player.room !== this.room) return;

            const dx = player.x + player.w / 2 - (this.x + 1);
            const dy = player.y + player.h / 2 - (this.y + 1.5);
            if (Math.sqrt(dx * dx + dy * dy) <= MPowerPillar.COLLECT_RADIUS) {
                this._collect(player);
            }
        }

        _collect(player) {
            if (this.collected) return;
            this.collected = true;
            player.powers[this.powerType] = true;

            const cam = this.engine?.renderer?.camera;
            if (cam && this.engine) {
                const { x: sx, y: sy } = cam.worldToScreen(
                    this.x + 1,
                    this.y - 1,
                );
                (this.engine._collectAnims ??= []).push({
                    type: this.powerType,
                    progress: 0,
                    duration: 0.75,
                    startX: sx,
                    startY: sy,
                });
                (this.engine._hudFlash ??= {})[this.powerType] = 0.6;
            }
        }

        render(ctx, camera, t, pixel) {
            super.render(ctx, camera, t, pixel);
            if (this.collected) return;

            const cfg = MPowerPillar.CONFIGS[this.powerType];
            const symSprite = cfg?.symKey
                ? gfx.props.misc[cfg.symKey]
                : gfx.player.spikeBall;
            if (!symSprite) return;

            const bob =
                Math.sin(t * MPowerPillar.BOB_SPEED) * MPowerPillar.BOB_AMP;
            const { x: sx, y: sy } = camera.worldToScreen(
                this.x + 1,
                this.y - 1,
            );
            const sw = symSprite.w * pixel;
            const sh = symSprite.h * pixel;

            //humhumhum bug
            if (cfg?.glowColor) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(sx, sy + bob, sw * 1.1, 0, Math.PI * 2);
                ctx.fillStyle = cfg.glowColor;
                ctx.fill();
                ctx.restore();
            }

            symSprite.draw(ctx, sx - sw / 2, sy + bob - sh / 2, pixel);
        }
    }

    class MSwarmerUnit extends MEnemy {
        constructor(x, y, controller) {
            super(x, y, 0.45, 0.45, 15, (t, self) => {
                if (self._hitFlash > 0) return gfx.enemies.wingShroom.hit;
                if (self.dead) {
                    const frames = gfx.enemies.wingShroom.die;
                    return frames[
                        Math.min(
                            Math.floor(self.stateTime * 8),
                            frames.length - 1,
                        )
                    ];
                }
                const frames = gfx.enemies.wingShroom.idle;
                return frames[Math.floor(t * 14) % frames.length];
            });
            this.controller = controller;
            this._homeX = x;
            this._homeY = y;
            this.moveSpeed = 11;
            this.aggroRange = 18;
            this.deAggroRange = 26;
        }

        die() {
            if (this.dead) return;
            super.die();
            this.stateTime = 0;
        }

        ai(dt) {}

        tick(dt) {
            if (this.dead) {
                this.stateTime += dt;
                super.tick(dt, {}, { hvel: this.moveSpeed ?? 4 });
                if (this._deathTimer > this.constructor.deathAnimationTime) {
                    this.remove();
                }
                return;
            }
            if (this.contactCooldown > 0) this.contactCooldown -= dt;
            if (this._hitFlash > 0) this._hitFlash -= dt;
            this.stateTime += dt;

            const player = this.engine?.player;
            const ctrl = this.controller;

            let targetX = this._homeX;
            let targetY = this._homeY;
            if (ctrl?.aggroed && player) {
                targetX = player.x + player.w / 2;
                targetY = player.y + player.h / 2;
            }

            //slight separation from siblings
            if (ctrl?.units) {
                for (const unit of ctrl.units) {
                    if (unit === this || unit.dead) continue;
                    const sdx = this.x + this.w / 2 - (unit.x + unit.w / 2);
                    const sdy = this.y + this.h / 2 - (unit.y + unit.h / 2);
                    const sd = Math.sqrt(sdx * sdx + sdy * sdy) || 1;
                    if (sd < 1.4) {
                        this.xv += (sdx / sd) * 18 * dt;
                        this.yv += (sdy / sd) * 18 * dt;
                    }
                }
            }

            const dx = targetX - (this.x + this.w / 2);
            const dy = targetY - (this.y + this.h / 2);
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            this.xv += (dx / len) * 30 * dt;
            this.yv += (dy / len) * 30 * dt;

            this.xv *= Math.pow(0.001, dt);
            this.yv *= Math.pow(0.001, dt);
            const spd = Math.sqrt(this.xv * this.xv + this.yv * this.yv);
            if (spd > this.moveSpeed) {
                this.xv = (this.xv / spd) * this.moveSpeed;
                this.yv = (this.yv / spd) * this.moveSpeed;
            }

            this.x += this.xv * dt;
            this.transport();
            this.updateHitbox();
            if (this.touching(MSolid, this.engine.world)) {
                this.x -= this.xv * dt;
                this.xv *= -0.5;
                this.transport();
                this.updateHitbox();
            }

            this.y += this.yv * dt;
            this.transport();
            this.updateHitbox();
            if (this.touching(MSolid, this.engine.world)) {
                this.y -= this.yv * dt;
                this.yv *= -0.5;
                this.transport();
                this.updateHitbox();
            }

            this.facing = this.xv >= 0 ? 1 : -1;

            if (
                player &&
                player.room === this.room &&
                this.contactCooldown <= 0
            ) {
                this.updateHitbox();
                player.updateHitbox();
                if (this.hbox.collision(player.hbox)) {
                    this.onPlayerContact(player);
                    this.contactCooldown = 0.6;
                }
            }
        }

        onPlayerContact(player) {
            if (!player.groundPounding) {
                const dx = player.x + player.w / 2 - (this.x + this.w / 2);
                player.xv = Math.sign(dx || 1) * 5;
                player.yv = -3;
                player.takeDamage(8);
            }
        }
    }

    class MSwarmer {
        constructor(x, y, count = 4) {
            this.x = x;
            this.y = y;
            this.count = count;
            this.units = [];
            this.aggroed = false;
            this._spawned = false;
            this.aggroRange = 18;
            this.deAggroRange = 28;
            this.engine = null;
            this.room = null;
            //dummy dbox so world iteration doesn't explode
            this.dbox = { collision: () => false };
        }

        tick(dt) {
            //lazy-spawn on first tick once engine an' room are live
            if (!this._spawned) {
                this._spawned = true;
                for (let i = 0; i < this.count; i++) {
                    const angle = (i / this.count) * Math.PI * 2;
                    const unit = new MSwarmerUnit(
                        this.x + Math.cos(angle) * 0.8,
                        this.y + Math.sin(angle) * 0.8,
                        this,
                    );
                    this.units.push(unit);
                    this.engine.world.addEntity(this.room, unit);
                }
            }

            const player = this.engine?.player;
            if (!player || player.room !== this.room) {
                this.aggroed = false;
                return;
            }

            const dx = player.x + player.w / 2 - this.x;
            const dy = player.y + player.h / 2 - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (!this.aggroed && dist <= this.aggroRange) this.aggroed = true;
            if (this.aggroed && dist > this.deAggroRange) {
                const anyClose = this.units.some(
                    (u) => !u.dead && u._playerDist() <= this.deAggroRange,
                );
                if (!anyClose) this.aggroed = false;
            }
        }

        //stub so world.iterate doesn't crash on render checks
        render() {}
    }

    class MFlyer extends MEnemy {
        constructor(x, y) {
            super(x, y, 0.9, 0.9, 15, (t, self) => {
                if (self._hitFlash > 0) return gfx.enemies.wingShroom.hit;
                if (self.dead) {
                    const frames = gfx.enemies.wingShroom.die;
                    return frames[
                        Math.min(
                            Math.floor(self.stateTime * 8),
                            frames.length - 1,
                        )
                    ];
                }
                const frames = gfx.enemies.wingShroom.idle;
                return frames[Math.floor(t * 6) % frames.length];
            });
            this.moveSpeed = 7;
            this.aggroRange = 15;
            this.deAggroRange = 22;
            this._homeX = x + 0.5;
            this._homeY = y + 0.5;
        }

        die() {
            if (this.dead) return;
            super.die();
            //restart so die animation plays from frame 0
            this.stateTime = 0; 
        }

        ai(dt) {}

        tick(dt) {
            if (this.dead) {
                this.stateTime += dt;
                this._deathTimer += dt;
                super.tick(dt, {}, { hvel: 0 });
                const dieDuration = gfx.enemies.wingShroom.die.length / 8;
                if (this.stateTime >= dieDuration) this.remove();
                return;
            }
            if (this.contactCooldown > 0) this.contactCooldown -= dt;
            if (this._hitFlash > 0) this._hitFlash -= dt;
            this.stateTime += dt;

            const player = this.engine?.player;
            const dist = this._playerDist();

            const targetX =
                dist <= this.aggroRange ? player.x + player.w / 2 : this._homeX;
            const targetY =
                dist <= this.aggroRange ? player.y + player.h / 2 : this._homeY;

            const dx = targetX - (this.x + this.w / 2);
            const dy = targetY - (this.y + this.h / 2);
            const len = Math.sqrt(dx * dx + dy * dy) || 1;

            this.xv += (dx / len) * 20 * dt;
            this.yv += (dy / len) * 20 * dt;

            this.xv *= Math.pow(0.001, dt);
            this.yv *= Math.pow(0.001, dt);
            const spd = Math.sqrt(this.xv * this.xv + this.yv * this.yv);
            if (spd > this.moveSpeed) {
                this.xv = (this.xv / spd) * this.moveSpeed;
                this.yv = (this.yv / spd) * this.moveSpeed;
            }

            this.x += this.xv * dt;
            this.transport();
            this.updateHitbox();
            if (this.touching(MSolid, this.engine.world)) {
                this.x -= this.xv * dt;
                this.xv *= -0.5;
                this.transport();
                this.updateHitbox();
            }

            this.y += this.yv * dt;
            this.transport();
            this.updateHitbox();
            if (this.touching(MSolid, this.engine.world)) {
                this.y -= this.yv * dt;
                this.yv *= -0.5;
                this.transport();
                this.updateHitbox();
            }

            this.facing = this.xv >= 0 ? 1 : -1;

            if (
                player &&
                player.room === this.room &&
                this.contactCooldown <= 0
            ) {
                this.updateHitbox();
                player.updateHitbox();
                if (this.hbox.collision(player.hbox)) {
                    this.onPlayerContact(player);
                    this.contactCooldown = 0.8;
                }
            }
        }

        onPlayerContact(player) {
            if (!player.groundPounding) {
                const dx = player.x + player.w / 2 - (this.x + this.w / 2);
                player.xv = Math.sign(dx || 1) * 8;
                player.yv = -5;
                player.takeDamage(12);
            }
        }
    }

    class MPothead extends MEnemy {
        static ATTACK_RANGE = 3.5;
        static ATTACK_WINDUP = 0.13;
        static ATTACK_COOLDOWN = 2.2;
        static HIT_FLASH_DURATION = 0.25;
        static ANIM_FPS = {
            idle: 3,
            run: 6,
            attack: 8,
        };

        constructor(x, y) {
            super(x, y, 0.9, 1.3, 120, (t, self) => {
                if (self._hitFlash > 0) return gfx.enemies.pothead.hit;

                const state = self.state ?? "idle";
                const frames =
                    gfx.enemies.pothead[state] ?? gfx.enemies.pothead.idle;

                if (!Array.isArray(frames)) return frames;

                const fps = MPothead.ANIM_FPS[state] ?? 4;

                if (state === "attack") {
                    //clamp to last frame don't loop the attack animation
                    const fi = Math.min(
                        frames.length - 1,
                        Math.floor(self._attackTimer * fps),
                    );
                    return frames[fi];
                }
                return frames[Math.floor(t * fps) % frames.length];
            });

            this.moveSpeed = 5;
            this.aggroRange = 10;
            this.deAggroRange = 16;

            this._attackCooldown = 0;
            this._attacking = false;
            this._attackTimer = 0;
            this._hitFlash = 0;
            this._damageLanded = false;
        }

        takeDamage(amount) {
            this._hitFlash = MPothead.HIT_FLASH_DURATION;
            super.takeDamage(amount);
        }

        ai(dt) {
            if (this._hitFlash > 0) this._hitFlash -= dt;
            if (this._attackCooldown > 0) this._attackCooldown -= dt;

            const dist = this._playerDist();

            if (!this.chaseMode && dist <= this.aggroRange)
                this.chaseMode = true;
            if (this.chaseMode && dist > this.deAggroRange)
                this.chaseMode = false;

            //attack in progress
            if (this._attacking) {
                this._attackTimer += dt;
                this.facing = this._playerHDir() || this.facing;
                this.state = "attack";

                //fire damage at the lunge-up frame
                if (
                    !this._damageLanded &&
                    this._attackTimer >= MPothead.ATTACK_WINDUP
                ) {
                    this._damageLanded = true;
                    const player = this.engine?.player;
                    if (player && this.hbox.collision(player.hbox)) {
                        this.onPlayerContact(player);
                    }
                }

                //3 frames at 8fps = 0.375s total
                const totalDuration =
                    gfx.enemies.pothead.attack.length /
                    MPothead.ANIM_FPS.attack;
                if (this._attackTimer >= totalDuration) {
                    this._attacking = false;
                    this._attackTimer = 0;
                    this._damageLanded = false;
                    this._attackCooldown = MPothead.ATTACK_COOLDOWN;
                }
                return;
            }

            //start attack
            if (
                this.chaseMode &&
                this._attackCooldown <= 0 &&
                dist <= MPothead.ATTACK_RANGE
            ) {
                this._attacking = true;
                this._attackTimer = 0;
                this._damageLanded = false;
                this.state = "attack";
                return;
            }

            //chase
            if (this.chaseMode) {
                this._updatePath(dt, 0.5);
                if (this._path?.length) {
                    this._followPath(dt);
                } else {
                    const hDir = this._playerHDir();
                    if (hDir === 1) this._moveRight = true;
                    if (hDir === -1) this._moveLeft = true;
                    if (hDir && hDir !== this.facing) {
                        this.facing = hDir;
                        this._facingLock = 0.2;
                    }
                }
            } else {
                //patrol
                if (this.patrolDir === 1) this._moveRight = true;
                else this._moveLeft = true;
                this.facing = this.patrolDir;

                if (this.grounded && Math.abs(this.xv) < 0.15) {
                    this.stallTimer += dt;
                    if (this.stallTimer > 0.25) {
                        this.patrolDir *= -1;
                        this.stallTimer = -0.4;
                    }
                } else {
                    this.stallTimer = 0;
                }

                this.jumpCooldown -= dt;
                if (this.grounded && this.jumpCooldown <= 0) {
                    this._jumpQueued = true;
                    this.jumpCooldown = 1.5 + Math.random() * 2;
                }
            }

            //jump sprite is nonexestant
            this.state = !this.grounded
                ? "idle"
                : Math.abs(this.xv) > 0.5
                  ? "run"
                  : "idle";
        }

        onPlayerContact(player) {
            if (!player.groundPounding) {
                //the pothead lunges upward so player gets popped into the air
                const dx = player.x + player.w / 2 - (this.x + this.w / 2);
                player.xv = Math.sign(dx || 1) * 5;
                player.yv = -14;
                player.takeDamage(20);
            }
        }
    }

    class MHatPoint extends MDecorative {
        static COLLECT_RADIUS = 1.2;
        static BOB_SPEED = 3;
        static BOB_AMP = 2;
        static ANIM_FPS = 6;

        constructor(x, y) {
            super(x, y, 0.6, 0.6, (t, self) => {
                const frames = gfx.props.misc.hatPoint;
                return frames[Math.floor(t * MHatPoint.ANIM_FPS) % frames.length];
            });
            this.collected = false;
            this.collectedTime = 0;
        }

        tick(dt) {
            if (this.collected) { this.collectedTime += dt; return; }
            const player = this.engine?.player;
            if (!player || player.room !== this.room) return;

            const dx = player.x + player.w / 2 - (this.x + 0.3);
            const dy = player.y + player.h / 2 - (this.y + 0.3);
            if (Math.sqrt(dx * dx + dy * dy) <= MHatPoint.COLLECT_RADIUS) {
                this.collected = true;
                this.engine.hatPoints = (this.engine.hatPoints ?? 0) + 1;
            }
        }

        render(ctx, camera, t, pixel) {
            const collT = this.collectedTime;
            const bob = Math.sin(t * MHatPoint.BOB_SPEED) * MHatPoint.BOB_AMP;
            let { x, y } = camera.worldToScreen(this.x, this.y);
            const sprite = this.texturer(t, this);
            sprite.draw(ctx, x, y + bob - collT * 2000, pixel);
            if (this.collected) {
                ctx.strokeStyle = `rgba(62, 105, 58, ${1 - collT * 4})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x, y, collT * 400, 0, 2 * Math.PI);
                ctx.stroke();
            }
        }
    }

    class MHatShop extends MDecorative {
        static TALK_RADIUS = 4;
        static ANIM_FPS = 3;

        static HATS = [
            { 
                key: 'topHat', 
                name: 'Top Hat', 
                cost: 3 
            },
            { 
                key: 'bunnyEars', 
                name: 'Bunny Ears',
                cost: 5 
            },
            { 
                key: 'unicornHorn', 
                name: 'Unicorn Horn',  
                cost: 8 
            },
        ];

        constructor(x, y) {
            super(x, y, 2, 3, () => gfx.props.misc.hatStand);

            this.inRange = false;
            this._open   = false;
            this._lastStateKey = null;

            const overlay = document.getElementById('overlay');

            this._shopEl = document.createElement('div');
            this._shopEl.className = 'hat-shop';
            this._shopEl.style.display = 'none';
            overlay.appendChild(this._shopEl);

            //I don't feel like explaining this :):):):)
            this._shopEl.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-action]');
                if (!btn || btn.disabled) return;
                e.stopPropagation();

                const action = btn.dataset.action;
                const key = btn.dataset.key  ?? null;
                const cost = parseInt(btn.dataset.cost ?? '0', 10);

                const player = this.engine?.player;
                if (!player) return;

                if (!player._ownedHats) player._ownedHats = [];

                if (action === 'buy') {
                    const pts = this.engine.hatPoints ?? 0;
                    if (pts < cost) return;
                    this.engine.hatPoints = pts - cost;
                    if (!player._ownedHats.includes(key)) player._ownedHats.push(key);
                    player.equippedHat = key;
                } else if (action === 'equip') {
                    player.equippedHat = (player.equippedHat === key) ? null : key;
                } else if (action === 'unequip') {
                    player.equippedHat = null;
                }

                //(I can explain this tho) force an immediate HTML rebuild on next sync 
                this._lastStateKey = null;
                this._syncHTML();
            });

            this._prompt = document.createElement('div');
            this._prompt.className = 'npc-prompt';
            this._prompt.textContent = 'SPACE to browse hats';
            this._prompt.style.display = 'none';
            overlay.appendChild(this._prompt);
        }

        tick(dt) {
            const player = this.engine?.player;
            if (!player) return;

            if (!player._ownedHats) player._ownedHats  = [];
            if (!('equippedHat' in player))  player.equippedHat = null;

            const { events, eventsPrev } = this.engine;
            const spaceJust = !!events.Space && !eventsPrev.Space;

            const cx = this.x + 1, cy = this.y + 1.5;
            const px = player.x + player.w / 2, py = player.y + player.h / 2;
            const dist = Math.hypot(px - cx, py - cy);
            this.inRange = dist <= MHatShop.TALK_RADIUS && this.room === player.room;

            if (!this.inRange) this._open = false;
            if (this.inRange && spaceJust) this._open = !this._open;

            this._syncHTML();
        }

        _syncHTML() {
            if (!this.engine?.renderer) return;
            const camera = this.engine.renderer.camera;
            const player = this.engine.player;
            const { x: sx, y: sy } = camera.worldToScreen(this.x + 1, this.y - 0.3);

            if (this._open) {
                this._prompt.style.display = 'none';

                //always keep the box positioned under the camera
                this._shopEl.style.left = `${sx}px`;
                this._shopEl.style.top = `${sy}px`;
                this._shopEl.style.display = 'block';

                //only rebuild innerHTML when something meaningful changed
                const pts = this.engine.hatPoints ?? 0;
                const equipped = player.equippedHat ?? '';
                const ownedStr = (player._ownedHats ?? []).slice().sort().join(',');
                const stateKey = `${pts}|${equipped}|${ownedStr}`;

                if (this._lastStateKey !== stateKey) {
                    this._lastStateKey = stateKey;
                    const owned = player._ownedHats ?? [];

                    const rows = MHatShop.HATS.map(hat => {
                        const isOwned = owned.includes(hat.key);
                        const isEquipped = player.equippedHat === hat.key;
                        const canAfford  = pts >= hat.cost;

                        const btn = isOwned
                            ? `<button class="hat-btn ${isEquipped ? 'hat-btn-equipped' : ''}"
                                    data-action="equip" data-key="${hat.key}">
                                ${isEquipped ? 'Equipped' : 'Equip'}
                            </button>`
                            : `<button class="hat-btn" ${canAfford ? '' : 'disabled'}
                                    data-action="buy" data-key="${hat.key}" data-cost="${hat.cost}">
                                Buy — ${hat.cost}
                            </button>`;

                        return `<div class="hat-row ${isEquipped ? 'hat-row-equipped' : ''}">
                            <span class="hat-name">${hat.name}</span>${btn}
                        </div>`;
                    }).join('');

                    const unequipRow = player.equippedHat
                        ? `<div class="hat-row">
                            <span class="hat-name"><i>none</i></span>
                            <button class="hat-btn" data-action="unequip">Unequip</button>
                        </div>`
                        : '';

                    this._shopEl.innerHTML = `
                        <div class="hat-shop-title">Hat Shop</div>d d
                        <div class="hat-shop-pts"> <b>${pts}</b> hat point${pts !== 1 ? 's' : ''}</div>
                        <div class="hat-shop-list">${rows}${unequipRow}</div>
                        <div class="hat-shop-hint">[SPACE] to close</div>
                    `;
                }

            } else {
                this._lastStateKey = null;
                this._shopEl.style.display = 'none';
                if (this.inRange) {
                    this._prompt.style.left = `${sx}px`;
                    this._prompt.style.top = `${sy - 4}px`;
                    this._prompt.style.display = 'block';
                } else {
                    this._prompt.style.display = 'none';
                }
            }
        }

        destroy() {
            this._shopEl?.remove();
            this._prompt?.remove();
        }
    }

    class MBackground {
        constructor(spriteKey) {
            this.spriteKey = spriteKey;
            this._sprite = null;
        }

        _getSprite() {
            if (!this._sprite) {
                this._sprite = gfx.props.backdrops[this.spriteKey];
            }
            return this._sprite;
        }

        render(ctx, camera, room) {
            const sprite = this._getSprite();
            if (!sprite) return;

            const { x, y } = camera.worldToScreen(0, 0);
            const scaleX = (room.width * camera.tsz) / sprite[0].length;
            const scaleY = (room.height * camera.tsz) / sprite.length;

            ctx.save();
            ctx.imageSmoothingEnabled = false;
            ctx.translate(x, y);
            ctx.scale(scaleX, scaleY);
            sprite.draw?.(ctx, 0, 0, 1);
            ctx.restore();
        }
    }

    /**
     * MPacman
     */
    class MPacman extends MEnemy {

        //tune any of this if you want
        static deathAnimationTime = 3.0;
        static BOUNCE = 0.68;
        static AIR_ACCEL = 12;
        static MAX_SPEED = 10;
        static DIVE_SPEED = 34;
        static PREDICT_TIME = 2.2;
        static PREDICT_THRESH = 4.0;
        static CHOMP_PAUSE = 0.12;
        static LICK_DURATION = 2.8;
        static DIVE_COOLDOWN = 2.0;
        static JUMP_MULT = 1.35;
        static JUMP_CD_MIN = 0.6;
        static JUMP_CD_MAX = 1.3;
        static CHARGE_CD_MIN= 2.5;
        static CHARGE_CD_MAX = 4.5;
        static CHARGE_AIR_DELAY = 0.35;

        //construct it
        constructor(x, y, name) {
            const W = 8, H = 8;

            super(x, y, W, H, 600, (t, self) => {
                if (self._hitFlash > 0) return gfx.enemies.bosses.landlord.idle[0];

                switch (self._pstate) {
                    //sluuurrrrrpppppppppp
                    case 'licking': {
                        const frames = gfx.enemies.bosses.landlord.lick;
                        const fi = Math.min(
                            frames.length - 1,
                            Math.floor(
                                (self._lickTimer / MPacman.LICK_DURATION) * frames.length,
                            ),
                        );
                        return frames[fi];
                    }
                    case 'chomping':
                    case 'diving': {
                        const frames = gfx.enemies.bosses.landlord.nomnom;
                        return frames[Math.floor(t * 12) % frames.length];
                    }
                    default: {
                        const frames = gfx.enemies.bosses.landlord.idle;
                        return frames[Math.floor(t * 2) % frames.length];
                    }
                }
            });

            //im rolling rn
            this._pstate = 'rolling';

            this._angle = 0;
            this._lickTimer = 0;
            this._chompTimer = 0;
            this._diveCooldown = 0;
            this._jumpCooldown = 0.4 + Math.random() * 0.4;
            this._chargeCooldown = MPacman.CHARGE_CD_MIN + Math.random() * (MPacman.CHARGE_CD_MAX - MPacman.CHARGE_CD_MIN);
            this._chargingDive = false;
            this._chargeAirTimer = 0;
            this._wasGrounded= false;
            this.contactCooldown = 0;

            
            this._origRenderPlayer = null;
            this._prevPlayerHealth = null;

            this.xv = (Math.random() < 0.5 ? 1 : -1) * 5;
            this.yv = -4;

            this.name = name;
        }

        //supress parent ai
        ai(_dt) {}

        //tick tock
        tick(dt) {
            const player  = this.engine?.player;
            const renderer = this.engine?.renderer;
            if (this._origRenderPlayer && renderer) {
                renderer.renderPlayer = this._origRenderPlayer;
                this._origRenderPlayer = null;
            }

            if (this.dead) {
                this._deathTimer += dt;
                if (this._deathTimer > MPacman.deathAnimationTime) this.remove();
                return;
            }

            if (this._hitFlash > 0) this._hitFlash -= dt;
            if (this._diveCooldown > 0) this._diveCooldown -= dt;
            if (this.contactCooldown > 0) this.contactCooldown -= dt;
            if (player && (this._pstate === 'chomping' || this._pstate === 'licking')) {
                if (player.room !== this.room) player.room = this.room;
            }
            if (player?.room !== this.room) return;
            if (
                this._prevPlayerHealth !== null &&
                this._prevPlayerHealth < player.maxHealth &&
                player.health >= player.maxHealth
            ) {
                this.health = this.maxHealth;
                this._hitFlash = 0;
                if (this._pstate === 'chomping' || this._pstate === 'licking') {
                    this._pstate = 'rolling';
                    this._diveCooldown = MPacman.DIVE_COOLDOWN;
                    this._chargingDive = false;
                    this._jumpCooldown = 0.5;
                }
            }
            this._prevPlayerHealth = player.health;

            const world = this.engine.world;

            switch (this._pstate) {
                case 'rolling':  this._tickRolling(dt, player, world);  break;
                case 'diving':   this._tickDiving(dt, player, world);   break;
                case 'chomping': this._tickChomping(dt, player, world); break;
                case 'licking':  this._tickLicking(dt, player, world);  break;
            }

            this._angle += (this.xv / (this.w * 0.5)) * dt;
            if (this.xv >  0.5) this.facing =  1;
            else if (this.xv < -0.5) this.facing = -1;
        }

        //rolling rn
        _tickRolling(dt, player, world) {
            const g = this.engine.gravity;

            if (this.grounded) {
                this._chargingDive= false;
                this._chargeAirTimer = 0;
                this._chargeCooldown -= dt;
                this._jumpCooldown -= dt;

                if (this._chargeCooldown <= 0) {
                    this._doChargeJump(player);
                } else if (this._jumpCooldown <= 0) {
                    this._doJump(player);
                }
            }

            if (this._diveCooldown <= 0 && !this._chargingDive && this._checkDive(player)) {
                this._launchDive(player);
                return;
            }

            if (this._chargingDive && !this.grounded) {
                this._chargeAirTimer += dt;
                if (this._chargeAirTimer >= MPacman.CHARGE_AIR_DELAY && this._diveCooldown <= 0) {
                    this._chargingDive = false;
                    this._launchDive(player);
                    return;
                }
            }

            if (!this.grounded) {
                const dx = player.x + player.w / 2 - (this.x + this.w / 2);
                this.xv += Math.sign(dx) * MPacman.AIR_ACCEL * dt;
                this.xv = Math.max(-MPacman.MAX_SPEED, Math.min(MPacman.MAX_SPEED, this.xv));
            }

            //horizontal and wall bounce.
            this.x += this.xv * dt;
            this.transport();
            this.updateHitbox();
            if (this.touching(MSolid, world)) {
                this.x -= this.xv * dt;
                this.xv *= -MPacman.BOUNCE;
                if (Math.abs(this.yv) < 4) {
                    this.yv = -(this.engine.jump * MPacman.JUMP_MULT * (0.6 + Math.random() * 0.4));
                    this.grounded = false;
                }
                this.transport();
                this.updateHitbox();
            }

            //vertical and floor/ceiling bounce.
            this._wasGrounded = this.grounded;
            this.grounded = false;

            this.yv += g * dt;
            this.y += this.yv * dt;
            this.transport();
            this.updateHitbox();

            if (this.touching(MSolid, world)) {
                this.y -= this.yv * dt;
                if (this.yv > 0) {
                    this.grounded = true;
                    if (!this._wasGrounded) this._onLand();
                    this.yv = Math.abs(this.yv) < 2 ? 0 : -this.yv * MPacman.BOUNCE;
                } else {
                    this.yv *= -MPacman.BOUNCE;
                }
                this.transport();
                this.updateHitbox();
            }

            this._separateFromPlayer(player, world);
            this._checkPlayerContact(player);
        }

        //dive
        _tickDiving(dt, player, world) {
            this.yv += this.engine.gravity * 0.1 * dt;

            this.x += this.xv * dt;
            this.transport();
            this.updateHitbox();
            if (this.touching(MSolid, world)) {
                this.x -= this.xv * dt;
                this.xv *= -MPacman.BOUNCE;
                this._endDive();
                this.transport();
                this.updateHitbox();
                return;
            }

            this._wasGrounded = this.grounded;
            this.grounded = false;

            this.y += this.yv * dt;
            this.transport();
            this.updateHitbox();
            if (this.touching(MSolid, world)) {
                this.y -= this.yv * dt;
                if (this.yv > 0) {
                    this.grounded = true;
                    if (!this._wasGrounded) this._onLand();
                }
                this.yv *= -MPacman.BOUNCE;
                this._endDive();
                this.transport();
                this.updateHitbox();
                return;
            }

            player.updateHitbox();
            this.updateHitbox();
            if (this.hbox.collision(player.hbox)) {
                this._startChomp(player);
            }
        }

        //nom nom chomp chomp
        _tickChomping(dt, player, world) {
            this._chompTimer += dt;
            this.xv = 0;
            //boss still falls under gravityit shouldn't hang in mid-air.
            this._applyGravityAndFloor(dt, world);
            //pin player to boss centre after gravity has moved us.
            this._placePlayerInMouth(player);

            if (this._chompTimer >= MPacman.CHOMP_PAUSE) {
                this._pstate    = 'licking';
                this._lickTimer = 0;
            }
        }

        ///sluuuuuurrrrrrrrpppppppp
        _tickLicking(dt, player, world) {
            this._lickTimer += dt;
            this.xv = 0;
            this._applyGravityAndFloor(dt, world);
            this._placePlayerInMouth(player);

            if (this._lickTimer >= MPacman.LICK_DURATION) {
                this._pstate         = 'rolling';
                this._diveCooldown   = MPacman.DIVE_COOLDOWN;
                this._chargeCooldown = 1.0;
                this._jumpCooldown   = 0.3;
                player.health = 0;
            }
        }
        /**
         * Vertical-only physics used during eating so the boss falls and lands
         * normally without any horizontal sliding.
         */
        _applyGravityAndFloor(dt, world) {
            this._wasGrounded = this.grounded;
            this.grounded = false;

            this.yv += this.engine.gravity * dt;
            this.y  += this.yv * dt;
            this.transport();
            this.updateHitbox();

            if (this.touching(MSolid, world)) {
                this.y -= this.yv * dt;
                if (this.yv > 0) {
                    this.grounded = true;
                    if (!this._wasGrounded) this._onLand();
                    this.yv = 0;
                } else {
                    this.yv *= -MPacman.BOUNCE;
                }
                this.transport();
                this.updateHitbox();
            }
        }
        /**
         * Locks the player to the boss's centre.
         * Also keeps player.room === this.room so renderScene iterates the correct
         * room and boss.render() always runs (which is what installs the no-op).
         */
        _placePlayerInMouth(player) {
            player.xv = 0;
            player.yv = 0;
            player.x  = this.x + this.w / 2 - player.w / 2;
            player.y  = this.y + this.h / 2 - player.h / 2;
            if (player.room !== this.room) player.room = this.room;
            player.updateHitbox();
            player.health = 1;
        }

        _doJump(player) {
            const dx      = player.x + player.w / 2 - (this.x + this.w / 2);
            const targetX = Math.sign(dx) * MPacman.MAX_SPEED;
            this.xv = this.xv * 0.4 + targetX * 0.6;
            this.yv = -(this.engine.jump * MPacman.JUMP_MULT);
            this.grounded = false;
            this._jumpCooldown = MPacman.JUMP_CD_MIN +Math.random() * (MPacman.JUMP_CD_MAX - MPacman.JUMP_CD_MIN);
        }

        _doChargeJump(player) {
            const dx = player.x + player.w / 2 - (this.x + this.w / 2);
            this.xv = Math.sign(dx) * MPacman.MAX_SPEED * 1.1;
            this.yv = -(this.engine.jump * MPacman.JUMP_MULT * 1.15);
            this.grounded = false;
            this._chargingDive = true;
            this._chargeAirTimer = 0;
            this._jumpCooldown = MPacman.JUMP_CD_MIN +Math.random() * (MPacman.JUMP_CD_MAX - MPacman.JUMP_CD_MIN);
            this._chargeCooldown = MPacman.CHARGE_CD_MIN +Math.random() * (MPacman.CHARGE_CD_MAX - MPacman.CHARGE_CD_MIN);
        }

        _onLand() {
            this.engine.onGroundPound?.();
            this.engine.onGroundPound?.();
            this.engine.onGroundPound?.();
        }

        _checkDive(player) {
            if (Math.abs(this.xv) < 2) return false;
            const myX = this.x + this.w / 2, myY = this.y + this.h / 2;
            const px  = player.x + player.w / 2, py = player.y + player.h / 2;
            const dx  = px - myX;
            if (Math.sign(this.xv) !== Math.sign(dx)) return false;
            const t = dx / this.xv;
            if (t < 0.15 || t > MPacman.PREDICT_TIME) return false;
            const predY = myY + this.yv * t + 0.5 * this.engine.gravity * t * t;
            return Math.abs(predY - py) <= MPacman.PREDICT_THRESH;
        }

        _launchDive(player) {
            this._pstate = 'diving';
            const myX = this.x + this.w / 2, myY = this.y + this.h / 2;
            const px  = player.x + player.w / 2, py = player.y + player.h / 2;
            const len = Math.hypot(px - myX, py - myY) || 1;
            this.xv = ((px - myX) / len) * MPacman.DIVE_SPEED;
            this.yv = ((py - myY) / len) * MPacman.DIVE_SPEED;
        }

        _endDive() {
            this._pstate = 'rolling';
            this._diveCooldown = MPacman.DIVE_COOLDOWN;
            this._chargingDive = false;
            this._chargeAirTimer = 0;
        }

        _startChomp(player) {
            this._pstate = 'chomping';
            this._chompTimer = 0;
            player.health = 1;
            player._hitFlash = 0.9;
            this._onLand();
        }

        _separateFromPlayer(player, world) {
            if (!player || player.room !== this.room || player.dead) return;

            const overlapX = (player.x + player.w / 2) - (this.x + this.w / 2);
            const overlapY = (player.y + player.h / 2) - (this.y + this.h / 2);
            const minDistX = (player.w + this.w) / 2;
            const minDistY = (player.h + this.h) / 2;
            const absX = Math.abs(overlapX);
            const absY = Math.abs(overlapY);

            if (absX >= minDistX || absY >= minDistY) return;

            if (minDistX - absX < minDistY - absY) {
                const push  = minDistX - absX;
                const prevX = player.x;
                player.x   += overlapX > 0 ? push : -push;
                player.updateHitbox();
                if (player.touching(MSolid, world)) {
                    player.x = prevX;
                    player.updateHitbox();
                    this.x  -= overlapX > 0 ? push : -push;
                    this.xv *= -0.5;
                    this.updateHitbox();
                }
            } else {
                const push = minDistY - absY;
                if (overlapY < 0) {
                    const prevY = player.y;
                    player.y -= push;
                    player.yv = Math.min(player.yv, 0);
                    player.grounded = true;
                    player.updateHitbox();
                    if (player.touching(MSolid, world)) {
                        player.y = prevY;
                        player.updateHitbox();
                    }
                } else {
                    const prevY = player.y;
                    player.y += push;
                    player.updateHitbox();
                    if (player.touching(MSolid, world)) {
                        player.y = prevY;
                        player.updateHitbox();
                    }
                }
            }
        }

        _checkPlayerContact(player) {
            if (!player || player.room !== this.room || this.contactCooldown > 0 || player.groundPounding) return;
            player.updateHitbox();
            this.updateHitbox();
            if (!this.hbox.collision(player.hbox)) return;

            const dx = player.x + player.w / 2 - (this.x + this.w / 2);
            player.xv = Math.sign(dx || 1) * 22;
            player.yv = -16;
            player.takeDamage(20);
            this.contactCooldown = 0.7;
        }

        //dammage and death
        takeDamage(amount) {
            if (this.dead || this._pstate == 'chomping' || this._pstate == 'licking') return;
            this._hitFlash = 0.15;
            this.health   -= amount;
            if (this.health <= 0) this.die();
        }

        
        render(ctx, camera, t, pixel) {
            if (!camera.inView(this)) return;

            const { x: sx, y: sy } = camera.worldToScreen(this.x, this.y);
            const bw = this.w * camera.tsz;
            const bh = this.h * camera.tsz;
            const cx = sx + bw / 2;
            const cy = sy + bh / 2;
            const radius = bw / 2;

            ctx.save();
            this.deathAlpha(ctx);

            if (this._hitFlash > 0) {
                ctx.globalAlpha *= 0.3 + Math.abs(Math.sin(this._hitFlash * 35)) * 0.7;
            }

            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.clip();

            const sprite = this.texturer(t, this);
            const sw = sprite.w * pixel;
            const sh = sprite.h * pixel;

            ctx.translate(cx, cy);
            if (this._pstate === 'rolling') ctx.rotate(this._angle);
            sprite.draw(ctx, -sw / 2, -sh / 2, pixel, this.facing ?? 1);
            if (this._pstate === 'chomping' || this._pstate === 'licking') {
                const player = this.engine?.player;
                if (player) {
                    const pSprite = player.texturer(t, player);
                    const psw = pSprite.w * pixel;
                    const psh = pSprite.h * pixel;
                    pSprite.draw(ctx, -psw / 2, -psh / 2 + pixel * 2, pixel, player.facing ?? 1);
                    const renderer = this.engine.renderer;
                    if (renderer && !this._origRenderPlayer) {
                        this._origRenderPlayer = renderer.renderPlayer.bind(renderer);
                    }
                    if (renderer) renderer.renderPlayer = () => {};
                }
            }

            ctx.restore();
        }
    }

    return {
        MDecorative,
        MSolid,
        MHazard,
        MLava,
        MEntity,
        MPlayer,
        MEnemy,
        MEngine,
        MCheckpoint,
        MTeleportEntryPoint,
        MTeleportSpawnPoint,
        MGauntletDoor,
        MNPC,
        MBlob,
        MPoundFloor,
        MBreakWall,
        MMinitaur,
        MMimic,
        MPowerPillar,
        MFlyer,
        MSwarmer,
        MPothead,
        MHatPoint,
        MHatShop,
        MBackground,
        MPacman
    };
})();
