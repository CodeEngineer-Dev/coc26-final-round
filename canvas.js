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

function resizeCanvasAndScale() {
    //CSS size
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    
    //DPR 
    dprVal = window.devicePixelRatio || 1;
    
    //set canvas internal pixels and CSS size
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.round(cssW * dprVal);
    canvas.height = Math.round(cssH * dprVal);
    //canvas.position = "absolute";
    
    if(window.opener){
        canvas.style.left = "50%";
        canvas.style.transform = "translate(-25%, 0)";
        //canvas.style.border = "red";
    }
    //compute uniform displayScale relative to 600x600 authoring resolution
    displayScale = Math.min(cssW / BASE_WIDTH, cssH / BASE_HEIGHT);

    //initiate
    width = canvas.width / dprVal;
    height = canvas.height / dprVal;
}
//run
resizeCanvasAndScale();