import { BOUNDS_CHANGE } from './actions';

const reducer = (initialState = {}, action) => {
  switch (action.type) {
    case BOUNDS_CHANGE:
      return { ...initialState, bounds: action.payload };
    default:
      return initialState;
  }
};

export default reducer;
