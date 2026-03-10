class State {
  constructor(
    name,
    eventToState,
    onEnter = () => {},
    onExit = () => {},
    onUpdate = () => {},
  ) {
    this.name = name;
    this.signal = () => {};
    this.eventsToStates = new Map(Object.entries(eventToState));
    this.onEnter = onEnter;
    this.onExit = onExit;
    this.onUpdate = onUpdate;
  }

  enter() {
    this.onEnter(this.signal);
  }
  update() {
    this.onUpdate(this.signal);
  }
  exit() {
    this.onExit(this.signal);
  }

  handleEvent(event, data = {}) {
    if (this.eventsToStates.has(event)) {
      return this.eventsToStates.get(event);
    }
    return null;
  }
}

class IdleState extends State {
  constructor() {
    super();
    this.name = "idle";
  }

  handleEvent(event) {
    if (event == "moveLeft_PRESSED" || event == "moveRight_PRESSED") {
      return "walk";
    } else if (event == "jump_PRESSED") {
      return "jump";
    }
    return null;
  }
}

class WalkState extends State {
  constructor() {
    super();
    this.name = "walk";
  }

  handleEvent(event) {
    if (event == "jump_PRESSED") {
      return "jump";
    }
    if (event == "moveLeft_RELEASED" || "moveRight_RELEASED") {
      return "idle";
    }
    return null;
  }
}

class JumpState extends State {
  constructor() {
    super();
    this.name = "jump";
  }

  handleEvent(event) {
    if (event == "jump_RELEASED" || event == "yVelocityZero_PHYSICS") {
      return "fall";
    }
    return null;
  }
}

class FallState extends State {
  constructor() {
    super();
    this.name = "fall";
  }
  enter() {
    // send signal to cancel y velocity
  }
  handleEvent(event) {
    if (event == "groundCollide") {
      return "idle";
    }
  }
}

class StateMachine {
  constructor(allStates, startingStateName) {
    this.states = new Map();

    for (let stateInstance of allStates) {
      this.states.set(stateInstance.name, stateInstance);
    }

    this.currentState = this.states.get(startingStateName);

    this.stateCallback = () => {};

    this.events = [];
  }

  setSignalCallback(signalCallback) {
    for (let stateInstance of this.states) {
      stateInstance.signal = signalCallback;
    }
  }

  setStateCallback(stateCallback) {
    this.stateCallback = stateCallback;
  }

  sendEvent(event) {
    this.events.push(event);
  }

  handleEvents() {
    let newStateName = this.currentState.handleEvent(this.events.shift());
    if (newStateName) {
      this.currentState.exit();
      this.currentState = this.states.get(newStateName);
      this.currentState.enter();
    }
  }

  update() {
    this.currentState.update();
  }

  run() {
    this.update();
    this.handleEvents();
  }

  getCurrentStateName() {
    return this.currentState.name;
  }
}
