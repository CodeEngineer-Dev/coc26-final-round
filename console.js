//the log constructor
class Log {
    /*
        Created by Arrow
        https://www.khanacademy.org/profile/kaid_5229809678324099512179597/projects
    */
    constructor(elementId) {
        this.consoleElement = document.getElementById(elementId);

        //fallback
        if (!this.consoleElement) {
            const fallback = document.createElement('div');
            fallback.id = elementId;
            fallback.style.border = '1px solid black';
            fallback.style.padding = '10px';
            fallback.style.margin = '10px';
            fallback.style.fontFamily = 'monospace';
            fallback.style.whiteSpace = 'pre-wrap';
            document.body.appendChild(fallback);
            this.consoleElement = fallback;
        }

        this.logs = new Map();
        this.warnings = new Map();
        this.errors = new Map();
        this.infos = new Map();

        this.baseMessage = "Console:";
        
        //store graphs
        this.graphs = new Map();
        this._graphAutoFrame = null;
        
        //intially render an empty console
        this.render();
    }

    //stringify values helper
    _stringify(v) {
        try {
            if (typeof v === 'object' && v !== null) return JSON.stringify(v, null, 2);
            return String(v);
        } catch (err) {
            return String(v);
        }
    }
    
    //log, warning, error, info. Not really the best implementation/copy of the real deal, but I am going for practicallity over functionality
    log(key, value) {
        if (arguments.length < 2){
            return;  
        } 
        this.logs.set(key, this._stringify(value));
        this.render();
    }
    warn(key, value) {
        this.warnings.set(key, this._stringify(value));
        this.render();
    }
    error(key, value) {
        this.errors.set(key, this._stringify(value));
        this.render();
    }
    info(key, value) {
        this.infos.set(key, this._stringify(value));
        this.render();
    }
    
    //render everything to the DOM
    render() {
        let outputHTML = `${this.baseMessage}\n`;

        this.infos.forEach((value, key) => {
            outputHTML += `<span class="info">INFO: ${key}</span>\n`;
        });
        this.errors.forEach((value, key) => {
            outputHTML += `<span class="error">ERROR: ${key}</span>\n`;
        });
        this.warnings.forEach((value, key) => {
            outputHTML += `<span class="warn">WARNING: ${key}</span>\n`;
        });
        this.logs.forEach((value, key) => {
            outputHTML += `${key}: ${value}\n`;
        });



    
        //preserve graph canvases and re-append after text content to avoid removing them
        const preserved = [];
        this.graphs.forEach(g => {
            if (g.canvas && g.canvas.parentNode === this.consoleElement){
                preserved.push(g.canvas);
            }
        });

        this.consoleElement.innerHTML = `<pre>${outputHTML}</pre>`;

        for (const c of preserved){ 
            this.consoleElement.appendChild(c);
        }
    }

    clear() {
        this.info("Console cleared");
        this.logs.clear();
        this.warnings.clear();
        this.errors.clear();
        this.infos.clear();
        this.render();
    }

    //yay graphs!
    createGraph(key, getter, opts = {}) {
        /**
         * key: string id
         * getter: function() numeric value
         * options: 
           { 
            width, height, color, background, buffer, min, max, showValue, strokeWidth, fill
           }
         * 
         */
        if (!key){ 
            throw new Error('createGraph requires a key');
        }
        if (!getter){ 
            throw new Error('createGraph requires a getter function or numeric value');
        }

        const options = Object.assign({
            width: 220,
            height: 48,
            color: '#9ad0ff',
            background: 'rgba(0,0,0,0)',
            buffer: 220,
            min: null,
            left: 0,
            max: null,
            top: 10,
            showValue: true,
            strokeWidth: 2,
            fill: true
        }, opts);
        
        //if an existing graph has this same key, remove it
        if (this.graphs.has(key)){ 
            this.removeGraph(key);
        }

        const canvas = document.createElement('canvas');
        canvas.width = options.width;
        canvas.height = options.height;
        canvas.style.display = 'block';
        canvas.style.margin = `${options.top}px ${options.left}px`;
        canvas.style.background = options.background || 'transparent';
        canvas.style.borderRadius = '4px';
        canvas.title = key;

        const ctx = canvas.getContext('2d');

        const graph = {
            canvas,
            ctx,
            getter,
            opts: options,
            history: []
        };
        
        //append canvas to console
        this.consoleElement.appendChild(canvas);
        this.graphs.set(key, graph);

        if (!this._graphAutoFrame){ 
            this._startGraphAutoUpdate();
        }

        return canvas;
    }

    removeGraph(key) {
        const entry = this.graphs.get(key);
        if (!entry) { 
            return;
        }
        try { 
            if (entry.canvas && entry.canvas.parentNode){ 
                entry.canvas.parentNode.removeChild(entry.canvas); 
            }
        
            
        } catch {}
        
        this.graphs.delete(key);
        
        //if no graphs why graph?
        if (this.graphs.size === 0){ 
            this._stopGraphAutoUpdate();
        }
    }

    updateGraphs() {
        if (!this.graphs || this.graphs.size === 0){ 
            return;
        }
        
        for (const [key, g] of this.graphs) {
            let value;
            try {
                value = (typeof g.getter === 'function') ? g.getter() : g.getter;
                //not entirely sure how fast it is to be assigning Number() and isFinite. I might change this into a more agressive approach later
                value = Number(value);
                if (!isFinite(value)) {
                    value = 0;
                }
            } 
            catch (e) {
                value = 0;
            }

            const hist = g.history;
            const buffer = Math.max(4, Math.floor(g.opts.buffer));
            hist.push(value);
            if (hist.length > buffer){
                hist.shift();
            }
            
            
            const minOpt = g.opts.min;
            const maxOpt = g.opts.max;
            
            //one liner if statements are really handy, and more clear than if() then. if(){then} is the most readable though and I despise the if() then one line statement approach
            
            //autoscaling
            let minV = (typeof minOpt === 'number') ? minOpt : Math.min(...hist, 0);
            let maxV = (typeof maxOpt === 'number') ? maxOpt : Math.max(...hist, 1);
            
            if (maxV - minV < 1e-6){ 
                maxV = minV + 1;
            }

            const ctx = g.ctx;
            const w = g.canvas.width;
            const h = g.canvas.height;
            ctx.clearRect(0, 0, w, h);
            
            //background for nasty canvases
            if (g.opts.background) {
                ctx.fillStyle = g.opts.background;
                ctx.fillRect(0, 0, w, h);
            }
            
            //draw the lines
            const len = hist.length;
            const step = (w - 4) / Math.max(buffer - 1, 1);
            
            //begin a new path
            ctx.beginPath();
            for (let i = 0; i < len; i++) {
                const v = hist[i];
                const t = (v - minV) / (maxV - minV);
                const y = h - 4 - t * (h - 8);
                const x = 2 + (i - (buffer - len)) * step;
                if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            
            //take the intergal haha
            if (g.opts.fill && len > 0) {
                ctx.lineTo(2 + (len - 1 - (buffer - len)) * step, h - 2);
                ctx.lineTo(2 + (0 - (buffer - len)) * step, h - 2);
                ctx.closePath();
                ctx.fillStyle = Log._hexToRGBA(g.opts.color, 0.12);
                ctx.fill();
                
                //redraw the stroke path
                ctx.beginPath();
                for (let i = 0; i < len; i++) {
                    const v = hist[i];
                    const t = (v - minV) / (maxV - minV);
                    const y = h - 4 - t * (h - 8);
                    const x = 2 + (i - (buffer - len)) * step;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
            }

            ctx.strokeStyle = g.opts.color;
            ctx.lineWidth = g.opts.strokeWidth;
            ctx.stroke();

            if (g.opts.showValue && len > 0) {
                const last = hist[hist.length - 1];
                ctx.font = '12px monospace';
                ctx.fillStyle = g.opts.color;
                ctx.textBaseline = 'top';
                ctx.fillText(`${key}: ${Number(last).toFixed(0)}`, 4, 2);
            }
        }
    }
    
    //rAF driven updating system. Trying to avoid crashing the main loop from all our graphiness
    _startGraphAutoUpdate() {
        if (this._graphAutoFrame) return;
        const tick = () => {
            if (!this.graphs || this.graphs.size === 0) {
                this._graphAutoFrame = null;
                return;
            }
            try { this.updateGraphs(); } catch (e) { /* swallow */ }
            this._graphAutoFrame = requestAnimationFrame(tick);
        };
        this._graphAutoFrame = requestAnimationFrame(tick);
    }
    
    //what does this do?
    _stopGraphAutoUpdate() {
        if (this._graphAutoFrame) {
            cancelAnimationFrame(this._graphAutoFrame);
            this._graphAutoFrame = null;
        }
    }
    
    //I hate this function as much as you do
    static _hexToRGBA(hex, alpha = 1) {
        /* 
             Color conversion. Fetched from stackoverflow with love
        */
        if (!hex) return `rgba(255,255,255,${alpha})`;
        if (hex.indexOf('rgb') === 0) {
            if (hex.indexOf('rgba') === 0) return hex.replace(/rgba\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/, `rgba($1,$2,$3,${alpha})`);
            return hex.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
        }
        let c = hex.replace('#', '');
        if (c.length === 3) c = c.split('').map(ch => ch + ch).join('');
        const num = parseInt(c, 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

//create a new console!
const consoleElement = document.getElementById('console');
if (!consoleElement) {
    document.body.insertAdjacentHTML('beforeend', '<div id="console" style="border: 1px solid black; padding: 10px; margin: 10px; font-family: monospace; white-space: pre-wrap;"></div>');
}

//magic!
const console = new Log('console');