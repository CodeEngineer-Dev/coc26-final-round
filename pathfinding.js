/**
 * Builds a walkability graph from a room bitmap and runs BFS pathfinding
 * Nodes = tile positions where an entity can stand.
 * Edges = walk, fall off ledge, or jump to a reachable node.
 */
class PlatformGraph {
    /**
     * @param {string[]} bitmap
     * @param {Object} tileMap
     */
    constructor(bitmap, tileMap) {
        this.bitmap  = bitmap;
        this.tileMap = tileMap;
        this.nodes   = this._build();
    }

    //help me
    _solid(r, c) { 
        return (this.bitmap[r]?.[c] ?? ' ') in this.tileMap; 
    }
    _open(r, c)  { 
        return !this._solid(r, c); 
    }

    /** Standable = open tile with a solid tile directly below */
    _standable(r, c) { return this._open(r, c) && this._solid(r + 1, c); }

    _build() {
        const rows  = this.bitmap.length;
        const cols  = Math.max(...this.bitmap.map(l => l.length));
        const nodes = new Map();

        //create a node for every tile an entity can stand on
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
                if (this._standable(r, c))
                    nodes.set(`${c},${r}`, { c, r, edges: [] });
        
        //jump stuff
        const JUMP_H = 3;
        const JUMP_W = 3;

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
                        const nr  = r + dr;
                        const nb  = nodes.get(`${nc},${nr}`);
                        if (nb)                         { node.edges.push({ to: nb, move: dir > 0 ? 'right' : 'left', jump: false }); break; }
                        if (this._solid(nr, nc))        break;
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

    /** Snaps (c, r) to the nearest standable node, searching downward up to 3 tiles. */
    _nearestKey(c, r) {
        for (let dr = 0; dr <= 3; dr++) {
            const k = `${c},${r + dr}`;
            if (this.nodes.has(k)) return k;
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
        const startKey = this._nearestKey(Math.round(fx), Math.round(fy));
        const goalKey  = this._nearestKey(Math.round(tx), Math.round(ty));

        if (!startKey || !goalKey)  return null;
        if (startKey === goalKey)   return [];

        const start = this.nodes.get(startKey);
        const goal  = this.nodes.get(goalKey);
        if (!start || !goal) return null;

        const visited = new Map([[startKey, null]]);
        const queue   = [start];

        while (queue.length) {
            const node = queue.shift();
            const nk   = `${node.c},${node.r}`;
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