class Component {}

class Transform extends Component {
  constructor(x, y, theta) {
    super();
    this.x = x;
    this.y = y;
    this.theta = theta;
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

/*
Useful matter body configuration properties:

collisionFilter
friction
mass
restitution

*/

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

class System {
  constructor(requiredComponentsArray) {
    // Make sure the inputs are components
    for (let component of requiredComponentsArray) {
      if (!(component.prototype instanceof Component))
        throw new Error("Systems require components");
    }

    this.requiredComponentsArray = requiredComponentsArray;
  }
  applyTo(gameObject) {}
  remove(gameObject) {}
  update() {}

  apply() {
    for (let gameObject of gameObjects) {
      if (gameObject.isRemoved) {
        this.remove(gameObject);
        continue;
      }

      let isMissingComponent = false;

      for (let requiredComponentClass of this.requiredComponentsArray) {
        let component = gameObject.findComponent(requiredComponentClass);

        if (component) {
          continue;
        } else {
          isMissingComponent = true;
          break;
        }
      }

      if (isMissingComponent) {
        continue;
      } else {
        this.applyTo(gameObject);
      }
    }

    this.update();
  }
}

class PhysicsSystem extends System {
  constructor(options = {}) {
    super([Transform, Shape, PhysicsBody]);
    this.engine = Matter.Engine.create(options);
  }

  applyTo(gameObject) {
    let physicsComponent = gameObject.findComponent(PhysicsBody);
    let transformComponent = gameObject.findComponent(Transform);
    let shapeComponent = gameObject.findComponent(Shape);

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
  remove(gameObject) {
    let physicsComponent = gameObject.findComponent(PhysicsBody);

    Matter.Composite.remove(
      this.engine.world,
      physicsComponent.matterBodyReference,
    );
  }
  update() {
    Matter.Engine.update(this.engine);

    for (let gameObject of gameObjects) {
      if (gameObject.isRemoved) {
        continue;
      }

      let transformComponent = gameObject.findComponent(Transform);
      let physicsComponent = gameObject.findComponent(PhysicsBody);

      transformComponent.x = physicsComponent.matterBodyReference.position.x;
      transformComponent.y = physicsComponent.matterBodyReference.position.y;
      transformComponent.theta = physicsComponent.matterBodyReference.angle;
    }
  }
}

class Sprite {}

class AnimatedSprite {}

let gameObjects = [];
let idCounter = 0;

class GameObject {
  constructor(...components) {
    gameObjects.push(this);

    this.id = idCounter++;
    this.components = components;
    this.isRemoved = false;
  }

  addComponent(componentInstance) {
    this.components.push(componentInstance);
  }
  removeComponent(componentClass) {
    // Find the instance of the component
    let index = this.components.findIndex(
      (componentInstance) => componentInstance instanceof componentClass,
    );

    // Swap and pop
    this.components[index] = this.components[this.components.length - 1];
    this.components.pop();
  }
  findComponent(componentClass) {
    return this.components.find(
      (component) => component instanceof componentClass,
    );
  }

  removeSelf() {
    this.isRemoved = true;
  }
}

/*

GameObjects are the nodes.

Components include:
- Transform
- Shape
- Sensor
- Static Physics Body
- Dynamic Physics Body
- Sprite
- AnimatedSprite
- Signal
- StateMachine

*/

let player = new GameObject(
  new Transform(0, 0, 0),
  new Circle(1),
  new DynamicBody(),
);

let physicsSystem = new PhysicsSystem();

physicsSystem.apply();
physicsSystem.apply();
physicsSystem.apply();
console.log("hello");
console.log(gameObjects);
