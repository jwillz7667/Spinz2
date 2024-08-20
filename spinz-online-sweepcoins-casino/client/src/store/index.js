import { createStore, applyMiddleware, combineReducers } from 'redux';
import thunk from 'redux-thunk';
import authReducer from './reducers/authReducer';
import gameReducer from './reducers/gameReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  game: gameReducer,
});

const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;
