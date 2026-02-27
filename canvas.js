//collect and delete animation frames that have already occured 
for(var i = window.requestAnimationFrame(function() {}); i > 0; i--) {
    window.cancelAnimationFrame(i);
}

//load HTML canvas
const canvas = document.getElementById("game");
const ctx = canvas.getContext('2d'); 

//width and height are changeable
let width = canvas.width;
let height = canvas.height;

const BASE_WIDTH = 600;
const BASE_HEIGHT = 600;

//world to CSS pixel scale
let displayScale = 1; 

//device pixel ratio
let dprVal = window.devicePixelRatio || 1;

/**
 * resizes the canvas to match the window dimensions and scales it based on the device pixel ratio (DPR).
 * adjusts the internal coordinate system to maintain sharpness on high-DPI displays and
 * updates the global display scale based on a predefined base resolution (BASE_WIDTH, BASE_HEIGHT)
 *
 * @function
 * @returns {void}
 */
function resizeCanvasAndScale() {
    /* 
        @Judges - This function is used to scale the canvas up to a specified dimension.
        Making it based on the height of the page only allows me to set it at a perfecct 1:1 aspect ratio.
        The reason this is so fast is because it scales it up with window.devicePixelRation
        and uses the built in canvas functions for transformations (setTransform) 
    */
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    dprVal = window.devicePixelRatio || 1;

    //calculate the size that maintains aspect ratio
    const aspectRatio = BASE_WIDTH / BASE_HEIGHT;
    let canvasDisplayWidth, canvasDisplayHeight;
    
    if (cssW / cssH > aspectRatio) {
        canvasDisplayHeight = cssH;
        canvasDisplayWidth = cssH * aspectRatio;
    } 
    else {
        //window is taller than canvas aspect ratio
        canvasDisplayWidth = cssW;
        canvasDisplayHeight = cssW / aspectRatio;
    }

    //update wrapper size and position
    const wrapper = document.getElementById('game-wrapper');
    if (wrapper) {
        wrapper.style.width = canvasDisplayWidth + 'px';
        wrapper.style.height = canvasDisplayHeight + 'px';
    }

    canvas.style.width = canvasDisplayWidth + "px";
    canvas.style.height = canvasDisplayHeight + "px";
    canvas.width = Math.round(canvasDisplayWidth * dprVal);
    canvas.height = Math.round(canvasDisplayHeight * dprVal);
    // tracking variables
    canvas.effectiveWidth = canvasDisplayWidth;
    canvas.effectiveHeight = canvasDisplayHeight;

    window.console.log(canvas.style.height, canvas.height);

    //update display scale
    width = canvas.width;
    height = canvas.height;

    ctx.scale(dprVal, dprVal);
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.oImageSmoothingEnabled = false;
    
    window.scene = "game";
}
window.addEventListener("resize", resizeCanvasAndScale);
resizeCanvasAndScale();