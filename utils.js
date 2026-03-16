//The sign of a num
function sign(x) {
    return (abs(x) / x) || 0;
}

//returns the random value of a min and max number
function random(min, max) {  
    return Math.random() * (max - min + 1) + min;
}

//Calculates a number between two numbers at a specific increment
function lerp(num1, num2, amt) {
	return num1 + (num2 - num1) * amt;
}

// Calculates amount from lerp based on two endpoints and a value
function antilerp(num1, num2, val) {
    return (val - num1) / (num2 - num1);
}

//Re-maps a number from one range to another.
function map(num, start1, stop1, start2, stop2) {
	return start2 + (num - start1) / (stop1 - start1) * (stop2 - start2);
}

//Constrains a value to not exceed a maximum and minimum value
function constrain(num, min, max) {
	return Math.max(Math.min(num, max), min);
}

//Calculates the distance between two points
function dist(x1, y1, x2, y2) {
	return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

//Finds a midpoint
function midpoint(Ax, Bx, Ay, By){
    var mx = (Ax + Bx)/2;
    var my = (Ay + By)/2;
    
    return [mx, my];
}

//Maps a point to a line where percentage is line length
function mapToLine(x1, y1, x2, y2, percentage) {
    return {
        x : x1 * (1.0 - percentage) + x2 * percentage, 
        y : y1 * (1.0 - percentage) + y2 * percentage
    };
}

/** Creates a global getter */
function globalGetter(name, f) {
    Object.defineProperty(globalThis, name, { get () { return f(); }});
}

/** Aiming animation */
function aim(ctx, cx, cy, xdir, ydir, pixel, sep, radius, t) {
    const magdir = Math.sqrt(xdir * xdir + ydir * ydir);
    const c = xdir / magdir, s = ydir / magdir;
    const o = Math.ceil(magdir / pixel) * pixel;
    for (let x = cx - o; x < cx + o; x += pixel) {
        for (let y = cy - o; y < cy + o; y += pixel) {
            let val = 0;
            for (let a = t % sep; a < magdir; a += sep) {
                const ratio = a / magdir;
                const bx = cx + a * c, by = cy + a * s;
                const dx = x - bx, dy = y - by;
                const gauss = Math.exp(-(dx * dx + dy * dy) / (radius * radius));
                // 4 is because (1 - ratio) * ratio has a max val of 0.25
                val += 4 * gauss * (1 - ratio) * ratio;
            }
            ctx.fillStyle = `rgba(255, 255, 255, ${val})`;
            ctx.fillRect(x, y, pixel, pixel);
        }
    }
}