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
    for (let [, stateInstance] of this.states) {
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
