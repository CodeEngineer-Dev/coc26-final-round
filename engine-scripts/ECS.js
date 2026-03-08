let gameObjects = [];

// Entity

class GameObject {
  static idCounter = 0;

  constructor(...components) {
    gameObjects.push(this);

    this.id = GameObject.idCounter++;
    this.components = new Map();
    this.inSystems = new Set();

    for (let component of components) {
      this.addComponent(component);
    }
  }

  addComponent(componentInstance) {
    let proto = componentInstance.constructor;
    while (proto !== Component) {
      this.components.set(proto, componentInstance);
      proto = Object.getPrototypeOf(proto);
    }
  }
  removeComponent(componentClass) {
    let proto = componentClass;
    while (proto !== Component) {
      this.components.delete(proto);
      proto = Object.getPrototypeOf(proto);
    }
  }
  getComponent(componentClass) {
    return this.components.get(componentClass);
  }
  hasComponent(componentClass) {
    return this.components.has(componentClass);
  }

  isInSystem(systemInstance) {
    return this.inSystems.has(systemInstance);
  }
  addSystem(systemInstance) {
    this.inSystems.add(systemInstance);
  }
  removeSystem(systemInstance) {
    this.inSystems.delete(systemInstance);
  }
}

// Components

class Component {}

class Transform extends Component {
  constructor(x, y, theta) {
    super();
    this.x = x;
    this.y = y;
    this.theta = theta;

    this.prevX = x;
    this.prevY = y;
    this.prevTheta = theta;
  }
}

class Shape extends Component {}

class Rectangle extends Shape {
  constructor(w, h) {
    super();
    this.w = w;
    this.h = h;
  }
}

class Circle extends Shape {
  constructor(r) {
    super();
    this.r = r;
  }
}

class Polygon extends Shape {
  constructor(...vertices) {
    super();
    if (vertices.length < 3)
      throw new Error("Polygon needs at least three vertices");

    this.vertices = vertices;
  }
}

class PhysicsBody extends Component {
  constructor(options = {}) {
    super();
    this.matterBodyReference = null;
    this.options = {};
  }
}

class SensorBody extends PhysicsBody {
  constructor(options = {}) {
    super();
    this.options = options;
    options.isSensor = true;
  }
}

class StaticBody extends PhysicsBody {
  constructor(options = {}) {
    super();
    this.options = options;
    options.isStatic = true;
  }
}

class DynamicBody extends PhysicsBody {
  constructor(options = {}) {
    super();
    this.options = options;
  }
}

class Camera extends Component {
  constructor(options = {}) {
    super();
    this.label = options.label || "main";
    this.scale = options.scale || 20;
    this.viewport = options.viewport || { x: 0, y: 0, w: 1, h: 1 };
  }
}

// Systems

class System {
  constructor(requiredComponentsArray) {
    // Make sure the inputs are components
    for (let component of requiredComponentsArray) {
      if (!(component.prototype instanceof Component))
        throw new Error("Systems require components");
    }

    this.requiredComponentsArray = requiredComponentsArray;
    this.gameObjects = new Set();
  }

  init(gameObject, ...args) {
    this.gameObjects.add(gameObject);
    gameObject.addSystem(this);
    this.onInit(gameObject, ...args);
  }
  delete(gameObject, ...args) {
    this.onDelete(gameObject, ...args);
    this.gameObjects.delete(gameObject);
  }
  run(...args) {
    for (let gameObject of gameObjects) {
      if (!gameObject.isInSystem(this)) {
        let isMissingComponent = false;

        for (let requiredComponentClass of this.requiredComponentsArray) {
          if (!gameObject.hasComponent(requiredComponentClass)) {
            isMissingComponent = true;
            break;
          }
        }

        if (!isMissingComponent) {
          this.init(gameObject, ...args);
        }
      }
    }

    this.onRun(...args);
  }

  onInit(gameObject, ...args) {}
  onRun(...args) {}
  onDelete(gameObject, ...args) {}
}

class PhysicsSystem extends System {
  constructor(options = {}) {
    super([Transform, Shape, PhysicsBody]);
    this.engine = Matter.Engine.create(options);
  }

  onInit(gameObject) {
    let physicsComponent = gameObject.getComponent(PhysicsBody);
    let transformComponent = gameObject.getComponent(Transform);
    let shapeComponent = gameObject.getComponent(Shape);

    if (!physicsComponent.matterBodyReference) {
      let physicsBody;

      if (shapeComponent instanceof Rectangle) {
        physicsBody = Matter.Bodies.rectangle(
          transformComponent.x,
          transformComponent.y,
          shapeComponent.w,
          shapeComponent.h,
          physicsComponent.options,
        );
      } else if (shapeComponent instanceof Circle) {
        physicsBody = Matter.Bodies.circle(
          transformComponent.x,
          transformComponent.y,
          shapeComponent.r,
          physicsComponent.options,
        );
      } else if (shapeComponent instanceof Polygon) {
        physicsBody = Matter.Bodies.fromVertices(
          transformComponent.x,
          transformComponent.y,
          shapeComponent.vertices,
          physicsComponent.options,
        );
      } else {
        throw new Error(
          "inputted shapeComponent is not a known subclass of a Shape",
        );
      }

      // Set some other properties
      Matter.Body.set(physicsBody, "label", gameObject.id);
      Matter.Body.set(physicsBody, "angle", transformComponent.theta);

      // Add it to the world
      Matter.Composite.add(this.engine.world, physicsBody);

      // Set the component reference
      physicsComponent.matterBodyReference = physicsBody;
    }
  }
  onDelete(gameObject) {
    let physicsComponent = gameObject.getComponent(PhysicsBody);

    Matter.Composite.remove(
      this.engine.world,
      physicsComponent.matterBodyReference,
    );
  }
  onRun(...args) {
    for (let gameObject of this.gameObjects) {
      let transformComponent = gameObject.getComponent(Transform);

      transformComponent.prevX = transformComponent.x;
      transformComponent.prevY = transformComponent.y;
      transformComponent.prevTheta = transformComponent.theta;
    }

    let deltaTime = args[0] || (1 / 120) * 1000;
    Matter.Engine.update(this.engine, deltaTime);

    for (let gameObject of this.gameObjects) {
      let transformComponent = gameObject.getComponent(Transform);
      let physicsComponent = gameObject.getComponent(PhysicsBody);

      transformComponent.x = physicsComponent.matterBodyReference.position.x;
      transformComponent.y = physicsComponent.matterBodyReference.position.y;
      transformComponent.theta = physicsComponent.matterBodyReference.angle;
    }
  }
}

class DebugRenderSystem extends System {
  constructor(canvasId = "debugRender") {
    super([Transform, Shape]);
    this.canvas = document.getElementById(canvasId);

    if (!this.canvas) {
      document.body.insertAdjacentHTML(
        "beforeend",
        '<canvas id="debugRender" style="border: 1px solid black" ></canvas>',
      );
      this.canvas = document.getElementById("debugRender");
    }

    this.ctx = this.canvas.getContext("2d");
  }

  worldToScreen(x, y) {
    return {
      x: (x - this.focusX) * this.tsz + this.w / 2,
      y: (y - this.focusY) * this.tsz + this.h / 2,
    };
  }

  screenToWorld(x, y) {
    return {
      x: (x - this.w / 2) / this.tsz + this.focusX,
      y: (y - this.w / 2) / this.tsz + this.focusY,
    };
  }

  onRun(...args) {
    let cameraTransform =
      gameObjects
        .find(
          (gameObject) =>
            gameObject.hasComponent(Camera) &&
            gameObject.getComponent(Camera).label == "main",
        )
        .getComponent(Camera) || new Transform(0, 0, 0);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();

    this.ctx.translate(0, 0);

    //this.ctx.translate(cameraTransform.x, cameraTransform.y);

    for (let gameObject of this.gameObjects) {
      let lerpFactor = args[0];

      let transformComponent = gameObject.getComponent(Transform);
      let shapeComponent = gameObject.getComponent(Shape);

      let x = lerp(transformComponent.prevX, transformComponent.x, lerpFactor);
      let y = lerp(transformComponent.prevY, transformComponent.y, lerpFactor);

      this.ctx.strokeStyle = "red";

      if (shapeComponent instanceof Rectangle) {
        this.ctx.strokeRect(
          x - shapeComponent.w / 2,
          y - shapeComponent.h / 2,
          shapeComponent.w,
          shapeComponent.h,
        );
      } else if (shapeComponent instanceof Circle) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, shapeComponent.r, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.stroke();
      } else if (shapeComponent instanceof Polygon) {
        this.ctx.translate(x, y);
        this.ctx.beginPath();

        this.ctx.moveTo(
          shapeComponent.vertices[0].x,
          shapeComponent.vertices[0].y,
        );

        for (let vertice of shapeComponent.vertices) {
          this.ctx.lineTo(vertice.x, vertice.y);
        }

        this.ctx.closePath();
        this.ctx.stroke();
      }
    }

    this.ctx.restore();
  }
}

/*

GameObjects are the nodes.

Components include:
- Transform DONE
- Shapes DONE
- Physics bodies IN PROGRESS
- Camera
- Sprite
- AnimatedSprite
- Audio
- SignalProcessor
- StateMachine

Next step: Camera components. Signals system. Sprite rendering

Useful matter js body configuration properties:

collisionFilter
friction
mass
restitution

*/

let player = new GameObject(
  new Transform(0, -200, 0),
  new Circle(1),
  new DynamicBody(),
);

let floor = new GameObject(
  new Transform(600, 600, 0),
  new Circle(10),
  new StaticBody(),
);

let camera = new GameObject(new Transform(0, 0, 0), new Camera());

let physicsSystem = new PhysicsSystem();
let debugRenderSystem = new DebugRenderSystem("game");

let accumulator = 0;
let fixedTimeStep = (1 / 60) * 1000;
let prevTime = performance.now();

/*

Game loop order is always:

- Input
- Physics
- Game Logic
- Removal of dead entities
- Rendering

*/

function gameLoop() {
  let currentTime = performance.now();

  accumulator += currentTime - prevTime;

  while (accumulator > fixedTimeStep) {
    physicsSystem.run(fixedTimeStep);
    accumulator -= fixedTimeStep;
  }

  let lerpFactor = accumulator / fixedTimeStep;
  debugRenderSystem.run(lerpFactor);

  prevTime = currentTime;

  requestAnimationFrame(gameLoop);
}

gameLoop();
