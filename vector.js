//my vector library
const vector = (function() {
    /*
        By Arrow (@Arrow.programming):
        https://www.khanacademy.org/profile/Arrow.programming/
        Feel free to use with credit
        
        
        "a" = "A"lways represents the vector that you are modifying
        This library supports x, y, and z as well as their respective transformations
        Avoid using deepCopy in PJS environment as JSON is unsupported
    */
    const func = function(x, y, z) {
        /*
            Create a new vector with given x, y, and optional z coordinates.
        */
        return {
            x: x,
            y: y,
            z: z || 0,
        };
    };
    func.set = function(a, x, y, z) {
        /*
            Set the coordinates of vector a to x, y, and optional z.
        */
        a.x = x;
        a.y = y;
        a.z = z || 0;
    };
    func.add = function(a, b) {
        /*
            Add vector b to vector a and return the resulting vector.
        */
        return {
            x: a.x + b.x,
            y: a.y + b.y,
            z: a.z + b.z,
        };
    };
    func.sub = function(a, b) {
        /*
            Subtract vector b from vector a and return the resulting vector.
        */
        return {
            x: a.x - b.x,
            y: a.y - b.y,
            z: a.z - b.z,
        };
    };
    func.mult = function(a, mult) {
        /*
            Multiply vector a by scalar mult and return the resulting vector.
        */
        return {
            x: a.x * mult,
            y: a.y * mult,
            z: a.z * mult,
        };
    };
    func.div = function(a, div) {
        /*
            Divide vector a by scalar div and return the resulting vector.
        */
        return {
            x: a.x / div,
            y: a.y / div,
            z: a.z / div,
        };
    };
    func.mag = function(a) {
        /*
            Calculate and return the magnitude of vector a.
        */
        return Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
    };
    func.dot = function(a, b) {
        /*
            Calculate and return the dot product of vectors a and b.
        */
        return a.x * b.x + a.y * b.y + a.z * b.z;
    };
    func.cross = function(a, b) {
        /*
            Calculate and return the cross product of vectors a and b.
        */
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x,
        };
    };
    func.norm = function(a) {
        /*
            Normalize vector a and return the resulting unit vector.
        */
        const len = func.mag(a);
        return {
            x: a.x / len,
            y: a.y / len,
            z: a.z / len,
        };
    };
    func.limit = function(a, lim) {
        /*
            Limit the magnitude of vector a to lim and return the resulting vector.
        */
        const len = func.mag(a);
        const multi = len <= lim ? 1 : lim / len;
        return {
            x: a.x * multi,
            y: a.y * multi,
            z: a.z * multi,
        };
    };
    func.angleBetween = function(a, b) {
        /*
            Calculate and return the angle between vectors a and b.
        */
        return Math.acos(func.dot(a, b) / (func.mag(a) * func.mag(b)));
    };
    func.dist = function(a, b) {
        /*
            Calculate and return the distance between vectors a and b.
        */
        return func.mag(func.sub(a, b));
    };
    func.rotateX = function(a, angle) {
        /*
            Rotate vector a around the X-axis by angle and return the resulting vector.
        */
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            x: a.x,
            y: a.y * cos - a.z * sin,
            z: a.y * sin + a.z * cos,
        };
    };
    func.rotateY = function(a, angle) {
        /*
            Rotate vector a around the Y-axis by angle and return the resulting vector.
        */
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            x: a.x * cos + a.z * sin,
            y: a.y,
            z: -a.x * sin + a.z * cos,
        };
    };
    func.rotateZ = function(a, angle) {
        /*
            Rotate vector a around the Z-axis by angle and return the resulting vector.
        */
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return {
            x: a.x * cos - a.y * sin,
            y: a.x * sin + a.y * cos,
            z: a.z,
        };
    };
    func.lerp = function(a, b, amt) {
        /*
            Linearly interpolate between vectors a and b by amt and return the resulting vector.
        */
        return {
            x: a.x + (b.x - a.x) * amt,
            y: a.y + (b.y - a.y) * amt,
            z: a.z + (b.z - a.z) * amt,
        };
    };
    func.copy = function(a) {
        /*
            Create a new vector as a copy of a previous one.
        */
        return {
            x: a.x,
            y: a.y,
            z: a.z,
        };
    };
    func.deepCopy = function(a) {
        /*
            Create a deep copy of vector a and return it.
        */
        return JSON.parse(JSON.stringify(a));
    };
    func.array = function(a) {
        /*
            Convert vector a to an array [x, y, z] and return it.
        */
        return [a.x, a.y, a.z];
    };
    func.equals = function(a, b) {
        /*
            Check if vectors a and b are equal and return the result.
        */
        return a.x === b.x && a.y === b.y && a.z === b.z;
    };
    func.random2D = function() {
        /*
            Create and return a random 2D unit vector.
        */
        const angle = Math.random() * Math.PI * 2;
        return {
            x: Math.cos(angle),
            y: Math.sin(angle),
            z: 0,
        };
    };
    func.random3D = function() {
        /*
            Create and return a random 3D unit vector.
        */
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI * 2;
        return {
            x: Math.cos(angle1) * Math.sin(angle2),
            y: Math.sin(angle1) * Math.sin(angle2),
            z: Math.cos(angle2),
        };
    };
    func.reflect = function(a, normal) {
        /*
            Reflect vector a around the given normal vector and return the resulting vector.
        */
        const d = func.dot(a, normal);
        return {
            x: a.x - 2 * d * normal.x,
            y: a.y - 2 * d * normal.y,
            z: a.z - 2 * d * normal.z,
        };
    };
    func.project = function(a, b) {
        /*
            Project vector a onto vector b and return the resulting vector.
        */
        const dotProduct = func.dot(a, b);
        const magB = func.mag(b);
        const scalar = dotProduct / (magB * magB);
        return {
            x: b.x * scalar,
            y: b.y * scalar,
            z: b.z * scalar,
        };
    };
    func.midpoint = function(a, b) {
        /*
            Calculate and return the midpoint between vectors a and b.
        */
        return {
            x: (a.x + b.x) / 2,
            y: (a.y + b.y) / 2,
            z: (a.z + b.z) / 2,
        };
    };
    func.angleTo = function(a, b) {
        /*
            Calculate and return the angle from vector a to vector b in 2D.
        */
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        return angle;
    };
    func.angleTo3D = function(a, b) {
        /*
            Calculate and return the angles from vector a to vector b in 3D.
        */
        const angleX = Math.atan2(b.z - a.z, b.y - a.y);
        const angleY = Math.atan2(b.z - a.z, b.x - a.x);
        const angleZ = Math.atan2(b.y - a.y, b.x - a.x);
        return {
            x: angleX,
            y: angleY,
            z: angleZ,
        };
    };
    func.isZero = function(a) {
        /*
            Check if vector a is a zero vector and return the result.
        */
        return a.x === 0 && a.y === 0 && a.z === 0;
    };
    func.isUnitVector = function(a) {
        /*
            Check if vector a is a unit vector and return the result.
        */
        return func.mag(a) === 1;
    };
    return func;
})();
