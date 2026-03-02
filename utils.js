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