//Particle Systems
const Particle = (function () {
    const Configure = function (config) {
        this.position = config.position || Object;
        this.size = config.size || 10;
        this.color = config.color;
        this.velocity = config.velocity || Object;
        this.life = config.life || 100;
        this.acceleration = config.acceleration || Object;
        this.angle = config.angle || 0;
        this.rotation = config.rotation || 0;
        this.opacity = config.opacity || 1;
        this.clear = config.clear || false;
        this.collide = config.collide || false;
        
        //this.dT = deltaTime;
        this.initialLife = config.life;
        this.drawingMethod = config.drawingMethod || ctx;
    };
    Configure.prototype = {
        update: function(DT){
            this.velocity.x += this.acceleration.x * DT;
            this.velocity.y += this.acceleration.y * DT;
            
            this.position.x += this.velocity.x * DT;
            this.position.y += this.velocity.y * DT;

            this.angle += this.rotation * DT;
            
            if (this.clear !== false) {
                this.opacity = Math.max(0, this.life / this.initialLife);
            } 
            else {
                this.opacity = 1;
            }
            
            this.life -= 60 * DT;
        },
        draw: function () {
            this.drawingMethod.save();
                this.drawingMethod.translate(this.position.x + this.size / 2, this.position.y + this.size / 2);
                this.drawingMethod.rotate(this.angle / 180 * Math.PI);
                this.drawingMethod.fillStyle = this.color;
                this.drawingMethod.globalAlpha = this.opacity;
                this.drawingMethod.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            this.drawingMethod.restore();
        },
        die: function(){
            return this.life < 0;
        },
        run: function(DT){
            this.draw();
            this.update(DT);
        },
    };
    return Configure;
})();

//particle pooling
Particle.prototype.deepCopy = function(config) {
    this.position = {
        x: (config.position && config.position.x) || 0,
        y: (config.position && config.position.y) || 0
    };
    this.size = config.size || 10;
    this.color = config.color || '#fff';
    this.velocity = {
        x: (config.velocity && config.velocity.x) || 0,
        y: (config.velocity && config.velocity.y) || 0
    };
    this.life = (config.life !== undefined ? config.life : 100);
    this.initialLife = this.life;

    this.acceleration = {
        x: (config.acceleration && config.acceleration.x) || 0,
        y: (config.acceleration && config.acceleration.y) || 0
    };
    this.angle = config.angle || 0;
    this.rotation = config.rotation || 0;
    this.opacity = (config.opacity !== undefined ? config.opacity : 1);
    this.clear = !!config.clear;
    this.collide = !!config.collide;
    this._pooledActive = true;
};

class ParticlePool {
    constructor(initialSize = 400) {
        this.pool = [];
        for (let i = 0; i < initialSize; i++) {
            //create a minimal particle instance
            const p = new Particle({
                position: { 
                    x: 0, 
                    y: 0 
                },
                velocity: { 
                    x: 0,
                    y: 0
                },
                size: 1,
                color: '#000',
                life: 0,
                acceleration: { 
                    x: 0, 
                    y: 0
                }
            });
            p._pooledActive = false;
            this.pool.push(p);
        }
    }

    //acquire a particle and initialize it with config
    get(config) {
        const p = this.pool.length ? this.pool.pop() : new Particle({
            position: { 
                x: 0,
                y: 0 
            },
            velocity: {
                x: 0,
                y: 0
            },
            size: 1,
            color: '#000',
            life: 0,
            acceleration: { 
                x: 0,
                y: 0
            }
        });
        p.deepCopy(config);
        return p;
    }

    //release a particle back to the pool
    release(p) {
        //minimal reset to avoid keeping large nested references
        p._pooledActive = false;
        p.life = 0;
        //zero velocities so reused state is clean
        if (p.position) { 
            p.position.x = 0;
            p.position.y = 0;
        }
        if (p.velocity) {
            p.velocity.x = 0;
            p.velocity.y = 0;
        }
        //push back into pool (no capacity limit here)
        this.pool.push(p);
    }
}
const particlePool = new ParticlePool(400);

//configurate particle systems
const ParticleSystem = (function () {
    const Configure = function (config) {
        this.add = config.add || function() {};
        //particles that clear when a level loads
        this.particles = [];
        
        //paricles that don't clear
        this.foreverParticles = [];
        
    };
    Configure.prototype = {
        addParticle: function(){
            this.add();
        },
        col: function(){
            
        },
        
        /**
            Old object cretion method, new one has object pooling implemented
        
        **/
        
        // run: function(){
        //     //scrap object if particles not being added
        //     if(!this.add){
        //         this.addParticle();
        //     }
        //     for (let i = this.particles.length-1; i >= 0; i--) {
        //         this.particles[i].run();
        //         if (this.particles[i].die()) {
        //             this.particles.splice(i, 1);
        //         }
        //     }
        //     for (let i = this.foreverParticles.length-1; i >= 0; i--) {
        //         this.foreverParticles[i].run();
                
        //         if (this.foreverParticles[i].collide){
        //             //
        //         }
        //         if (this.foreverParticles[i].die()) {
        //             this.foreverParticles.splice(i, 1);
        //         }
        //     }
            
        // },
        run: function(DT){
            //scrap object if particles not being added
            if(!this.add){
                this.addParticle();
            }
        
            // update normal particles (swap-pop removal)
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.run(DT);
                if (p.die()) {
                    // release to pool
                    particlePool.release(p);
                    // remove in O(1) by replacing with last element
                    const last = this.particles.pop();
                    if (i < this.particles.length) {
                        this.particles[i] = last;
                    }
                }
            }
        
            // update foreverParticles (same pattern)
            for (let i = this.foreverParticles.length - 1; i >= 0; i--) {
                const p = this.foreverParticles[i];
                p.run(DT);
        
                if (p.collide) {
                    //
                }
                if (p.die()) {
                    particlePool.release(p);
                    const last = this.foreverParticles.pop();
                    if (i < this.foreverParticles.length) {
                        this.foreverParticles[i] = last;
                    }
                }
            }
        },
    };
    return Configure;
})();
const poisonParticles = new ParticleSystem({
    add: function(x, y, w, h){
        if((Math.random(2)*2-1) > 0.95){
            //this.particles.push(particlePool.get({
                this.particles.push(particlePool.get({ 
                    position: { 
                        x: random(x, x + w), 
                        y: y 
                    },
                    velocity: { 
                        x: normRandom(-1.5, 1.5) * 60, 
                        y: normRandom(-1, -1.5) * 60 
                    }, 
                    size: 1.5, 
                    color: col.bl.poison, 
                    opacity: 1, 
                    life: 20, // keep in frames 
                    acceleration: { 
                        x: 0, 
                        y: 3.98 * 60 
                    }, angle: 
                    random(0, 360), 
                    rotation: normRandom(4, 7) * -normRandom(1, 2) * 60,
                    clear: true, 
                }));
            //}));
        }
    },
}),
      poisonStream = new ParticleSystem({
        add: function(x, y, xVel, lifeTime){
            this.particles.push(particlePool.get({
                position: {
                    x: x,
                    y: y
                },
                velocity: {
                    x: xVel * 60 * 1.5,
                    y: normRandom(-10, 30)
                },
                size: random(1, 4),
                color: col.bl.poison,
                opacity: 1,
                life: lifeTime,
                acceleration: {
                    x: 0,
                    y: 2.08 * 60,
                },
                angle: 60,
                rotation: normRandom(4, 7) * -normRandom(1, 2) * 60,
                clear: false,
            }));
        },
      }),
      backdropParticles = new ParticleSystem({
        add: function(x, y){
            if(curMap === CAVERNS){
                // if((Math.random(2)*2-1) > 0.30){
                //     this.foreverParticles.push(particlePool.get({
                //         position: {
                //             x: width + 5,
                //             y: random(0, height)
                //         },
                //         velocity: {
                //             x: -0.5,
                //             y: random(-0.5, -1)
                //         },
                //         size: random(1, 5),
                //         color: col.backdropParticles,
                //         opacity: 1,
                //         life: 150,
                //         acceleration: {
                //             x: -0.05,
                //             y: 0.0,
                //         },
                //         angle: 60,
                //         rotation: random(4, 7) * -random(1, 2),
                //         clear: false,
                        
                //     }));
                //     }
            }
            if(curMap === MAPNAME){
                if((Math.random(2)*2-1) > 0.10){
                    this.foreverParticles.push(particlePool.get({
                        position: {
                            x: random(0, width + 250),
                            y: 0 - 10
                        },
                        velocity: {
                            x: -0.7 * 60,
                            y: normRandom(1.0, 3.5) * 60
                        },
                        size: random(1, 5),
                        color: col.backdropParticles,
                        opacity: 1,
                        life: 550,
                        acceleration: {
                            x: -0.1 * 60,
                            y: 0.8,
                        },
                        angle: normRandom(-90, 90),
                        rotation: normRandom(-10, 10) * 60,
                        collide: true,
                        clear: false,
                        
                    }));
                }
            }
            
        },
      }),
      foreGroundParticles = new ParticleSystem({
        add: function(x, y){
            // if(curMap === CAVERNS){
            //     if((Math.random(2)*2-1) > 0.30){
            //         this.foreverParticles.push(particlePool.get({
            //             position: {
            //                 x: width + 5,
            //                 y: random(0, height)
            //             },
            //             velocity: {
            //                 x: -0.5,
            //                 y: random(-0.5, -1)
            //             },
            //             size: random(1, 5),
            //             color: col.backdropParticles,
            //             opacity: 1,
            //             life: 150,
            //             acceleration: {
            //                 x: -0.05,
            //                 y: 0.0,
            //             },
            //             angle: 60,
            //             rotation: random(4, 7) * -random(1, 2),
            //             clear: false,
                        
            //         }));
            //         }
            // }
            if(curMap === MAPNAME){
                if((Math.random(2)*2-1) > 0.20){
                    this.foreverParticles.push(particlePool.get({
                        position: {
                            x: random(0, 200 + 100),
                            y: 0 - 10
                        },
                        velocity: {
                            x: -0.7 * 60,
                            y: normRandom(1.0, 3.5) * 60
                        },
                        size: random(1, 3),
                        color: col.backdropParticles,
                        opacity: 1,
                        life: 550,
                        acceleration: {
                            x: -0.1 * 60,
                            y: 0.8,
                        },
                        angle: normRandom(-90, 90),
                        rotation: normRandom(-10, 10) * 60,
                        collide: true,
                        clear: false,
                        
                    }));
                }
            }
            
        },
      }),
      snowMovementParticles = new ParticleSystem({
        // add: function(x, y, w, h, xVel, dir, topOfBlock, maxVel, walkTime){
        //     //change direction to a boolean
        //     //console.log('dir', dir);
        //     if(dir === -1){
        //         dir = false;
        //     }
        //     else if(dir === 1){
        //         dir = true;
        //     }
        //     //console.log('dir', dir);
            
        //     //console.log('xVel', topOfBlock)
            
        //     //make sure the player has been walking for a while
        //     //console.info(maxVel - 0.01)
            
            
            
            
        //         //percentage is 99% probability a frame
        //     if((Math.random(2)*2-1) > 0.01){
        //         this.particles.push(particlePool.get({
        //             position: {
        //                 x: x + (!dir ? w : 0),
        //                 y: y + h
        //             },
        //             velocity: {
        //                 x: (-xVel)/100,
        //                 y: -Math.abs(xVel),
        //             },
        //             size: 2,
        //             color: col.bl.top,
        //             opacity: 1,
        //             life: 40,
        //             acceleration: {
        //                 x: (random(-xVel / 2, -xVel * 2))/10000,
        //                 y: 0.08,
        //             },
        //             angle: 60,
        //             rotation: random(4, 7) * -random(1, 2),
        //             clear: true,
        //         }));
        //     }
            
        // },
      }),
      flameParticles = new ParticleSystem({
        add: function(x, y, w, h){
            //percentage is 90% probability a frame
            if((Math.random(2)*2-1) > 0.10){
                this.particles.push(particlePool.get({
                    position: {
                        x: random(x + 2, x + 6),
                        y: y - h/2 + 7
                    },
                    velocity: {
                        x: 0,
                        y: normRandom(-1, -1.1) * 30
                    },
                    size: 2,
                    color: col.bl.lamp.flame,
                    opacity: 1,
                    life: 40,
                    acceleration: {
                        x: 10 * normRandom(-10, 10),
                        y: 21.08,
                    },
                    angle: normRandom(10, 30),
                    rotation: normRandom(50, 60) * 60,
                    clear: true,
                }));
            }
        },
    });

//make particle systems eaesier to access for debugging
const particleSystems = [
    poisonParticles, 
    poisonStream, 
    backdropParticles,
    foreGroundParticles,
    snowMovementParticles,
    flameParticles
];
