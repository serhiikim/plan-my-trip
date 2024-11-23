// src/store/store.js
import { createContext, useContext, useReducer } from 'react';
import { auth } from '../services/auth';

const initialState = {
  user: auth.getUser(),
  travelPlan: null,
  chatHistory: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_TRAVEL_PLAN':
      return { ...state, travelPlan: action.payload };
    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatHistory: [...state.chatHistory, action.payload],
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const StoreContext = createContext(null);
const StoreDispatchContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <StoreContext.Provider value={state}>
      <StoreDispatchContext.Provider value={dispatch}>
        {children}
      </StoreDispatchContext.Provider>
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}

export function useDispatch() {
  return useContext(StoreDispatchContext);
}