class Store {
  constructor(reducer) {
    this.listeners = [];
    this.state = {};
    this.reducer = reducer;
  }

  dispatch = action => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${action.type}:`, action.payload);
    }

    this.state = this.reducer(this.state, action);

    this.listeners.forEach(listener => {
      listener(action);
    });
  };

  subscribe = listener => {
    this.listeners.push(listener);
  };
}

export default Store;
