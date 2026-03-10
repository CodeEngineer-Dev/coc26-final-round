let floor = new GameObject(
  new Transform(0, 0, 0),
  new Rectangle(36, 36),
  new StaticBody({ restitution: 1 }),
);

let player = new GameObject(
  new Transform(0, -700, 0),
  new Rectangle(36, 60),
  new DynamicBody({ restitution: 1 }),
  new Camera(),
  new UserInput("KeyW", "KeyS", "KeyA", "KeyD"),
);

//let camera = new GameObject(new Transform(0, 0, 0), new Camera());

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

  let deltaTime = Math.min(currentTime - prevTime, 250);

  prevTime = currentTime;
  accumulator += deltaTime;

  while (accumulator > fixedTimeStep) {
    physicsSystem.run(fixedTimeStep);
    accumulator -= fixedTimeStep;
  }

  let lerpFactor = accumulator / fixedTimeStep;
  debugRenderSystem.run(lerpFactor);

  requestAnimationFrame(gameLoop);
}

gameLoop();
