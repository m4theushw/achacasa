import { BOUNDS_CHANGE, FILTER_CHANGE } from './actions';

const reducer = (initialState = {}, action) => {
  switch (action.type) {
    case BOUNDS_CHANGE:
      return { ...initialState, bounds: action.payload };
    case FILTER_CHANGE:
      return { ...initialState, filter: action.payload };
    default:
      return initialState;
  }
};

export default reducer;
