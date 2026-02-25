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
const mWorld  = mEngine.world;

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