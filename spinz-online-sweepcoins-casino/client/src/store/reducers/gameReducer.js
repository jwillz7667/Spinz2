const initialState = {
  games: [],
  currentGame: null,
  loading: true,
  error: {}
};

export default function(state = initialState, action) {
  const { type, payload } = action;

  switch(type) {
    case 'GET_GAMES':
      return {
        ...state,
        games: payload,
        loading: false
      };
    case 'GET_GAME':
      return {
        ...state,
        currentGame: payload,
        loading: false
      };
    case 'GAME_ERROR':
      return {
        ...state,
        error: payload,
        loading: false
      };
    default:
      return state;
  }
}
