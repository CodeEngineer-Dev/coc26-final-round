let floor = new GameObject(
  new Transform(0, 0, 0),
  new Rectangle(36, 36),
  new StaticBody({ restitution: 1 }),
);

let playerStateMachine = new StateMachine(
  [
    new State("idle", {
      moveLeft_PRESSED: "walk",
      moveRight_PRESSED: "walk",
      jump_PRESSED: "jump",
    }),
    new State("walk", {
      jump_PRESSED: "jump",
      moveLeft_RELEASED: "idle",
      moveRight_RELEASED: "idle",
    }),
    new State("jump", {
      falling_CUSTOM: "fall",
    }),
    new State("fall", {
      hitGround_CUSTOM: "idle",
    }),
  ],
  "idle",
);

let player = new GameObject(
  new Transform(0, -700, 0),
  new Rectangle(36, 60),
  new DynamicBody({ restitution: 1 }),
  new Camera(),
  new UserInput("moveLeft", "moveRight", "jump"),
  new Signal(),
  new StateHandler(
    playerStateMachine,
    (self, state, data) => {
      console.log(state);
    },
    (self, signal, data) => {
      console.log(signal);
    },
  ),
);

let inputMap = {
  KeyA: "moveLeft",
  KeyW: "jump",
  KeyD: "moveRight",
};

let userInputSystem = new UserInputSystem(inputMap);
let gameLogicSystem = new GameLogicSystem();
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

  userInputSystem.run();

  while (accumulator > fixedTimeStep) {
    physicsSystem.run(fixedTimeStep);
    gameLogicSystem.run();
    accumulator -= fixedTimeStep;
  }

  let lerpFactor = accumulator / fixedTimeStep;
  debugRenderSystem.run(lerpFactor);

  requestAnimationFrame(gameLoop);
}

gameLoop();
