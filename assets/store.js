class Store {
  constructor(reducer, initialState = {}) {
    this.listeners = {};
    this.state = initialState;
    this.reducer = reducer;
  }

  dispatch = action => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${action.type}:`, action.payload);
    }

    this.state = this.reducer(this.state, action);

    if (action.type in this.listeners) {
      this.listeners[action.type].forEach(listener => {
        listener(action);
      });
    }
  };

  on = (action, listener) => {
    if (!(action in this.listeners)) {
      this.listeners[action] = [];
    }
    this.listeners[action].push(listener);
  };
}

export default Store;
