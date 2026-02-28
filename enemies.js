class MBlob extends MEnemy {
    constructor(x, y, variant = 'g1') {
        const sprites = gfx.enemies.slimes[variant];
        const big = variant.endsWith('2');
        const w = big ? 0.88 : 0.60;
        const h = big ? 0.77 : 0.55;
        const hp = big ? 60   : 30;

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