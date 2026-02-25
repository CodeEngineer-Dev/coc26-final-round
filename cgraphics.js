//Color helper methods to prevent frustration
function fill(n) {
	Fill = true;
	ctx.fillStyle = n;
}
function stroke(str) {
	Stroke = true;
	ctx.strokeStyle = str;
}
function noStroke() {
	Stroke = false;
}
function noFill() {
	Fill = false;
}
function strokeWeight(s) {
	ctx.lineWidth = s;
}
function strokeCap(cap) {
	ctx.lineCap = cap;
}


//Helper functions to determine if a shape will have fill or stroke based on the current global setting
function beginShape() {
	ctx.beginPath();
}
function endShape() {
	if (Fill) {
		ctx.fill();
	}
	if (Stroke) {
		ctx.stroke();
	}
}

//shortcuts
function vertex(x, y) {
	ctx.lineTo(x, y);
}
function curveVertex(cx, cy, x, y) {
	ctx.quadraticCurveTo(cx, cy, x, y);
}
//a quadratic
function quad(x1, y1, x2, y2, x3, y3, x4, y4) {
	beginShape();
	vertex(x1, y1);
	vertex(x2, y2);
	vertex(x3, y3);
	vertex(x4, y4);
	vertex(x1, y1); 
	endShape();
}
function triangle(x1, y1, x2, y2, x3, y3) {
	beginShape();
	vertex(x1, y1);
	vertex(x2, y2);
	vertex(x3, y3);
	vertex(x1, y1);
	endShape();
}
function bezierVertex(cx1, cy1, cx2, cy2, x, y) {
	ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, y);
}
function bezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
	ctx.beginPath();
	    ctx.moveTo(x1, y1);
	    bezierVertex(cx1, cy1, cx2, cy2, x2, y2);
    ctx.stroke();
}
function line(x1, y1, x2, y2) {
	beginShape();
	vertex(x1, y1);
	vertex(x2, y2);
	endShape();
}
function point(x, y, s) {
    if(s === undefined){
        ctx.fillRect(x, y, 2, 2);
    }
	ctx.fillRect(x, y, s, s);
}

//a rectangle with 4 individual rounding options
const rect = (x, y, w, h, r1 = 0, r2, r3, r4) => {
    //minimum
    const maxR = Math.min(w, h) / 2;
    
    //constrain values; allows negative for scalloped corners
    const limit = (val) => Math.max(-maxR, Math.min(val, maxR));
    
    //default extra radii to r1 if they are undefined
    const radii = [r1, r2 ?? r1, r3 ?? r1, r4 ?? r1].map(limit);
    const [tr1, tr2, tr3, tr4] = radii;
    
    beginShape();
        ctx.moveTo(x, y + tr1);
        curveVertex(x, y, x + tr1, y);

        vertex(x + w - tr2, y);
        curveVertex(x + w, y, x + w, y + tr2);
        
        vertex(x + w, y + h - tr3);
        curveVertex(x + w, y + h, x + w - tr3, y + h);
        
        vertex(x + r4, y + h);
        curveVertex(x, y + h, x, y + h - tr4);
        
        vertex(x, y + tr1);
    endShape();
};

//circles and arcs
function arcTo(x, y, r, start, stop) {
	ctx.arc(x, y, r / 2, start / 180 * Math.PI, stop / 180 * Math.PI);
}
function arc(x, y, w, h, start, stop) {
	ctx.save();
	ctx.translate(x, y);
	ctx.scale(1, h / w);
	beginShape();
	arcTo(0, 0, w, start, stop);
	endShape();
	ctx.restore();
}
function ellipse(x, y, w, h) {
	w = Math.abs(w);
	h = Math.abs(h);
	arc(x, y, w, h, 0, 360);
}

//Change cursor!
function cursor(name) {
	document.body.style.cursor = name;
}