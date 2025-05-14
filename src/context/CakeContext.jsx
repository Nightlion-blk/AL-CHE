import { createContext, useContext, useReducer } from "react";
import PropTypes from "prop-types";

const initialState = {
  baseStyle: null,
  cakeType: null,
  cakeColor: "#FFFFFF",
  flavour: "VANILLA",
  elements: [],
  topper: null,
  message: "",
  price: 99,
  history: [],
  currentIndex: -1,
};

const CakeContext = createContext(undefined);

const cakeReducer = (state, action) => {
  switch (action.type) {
    case "SET_BASE_STYLE":
      return addToHistory({ ...state, baseStyle: action.payload });
    case "SET_CAKE_TYPE":
      return addToHistory({ ...state, cakeType: action.payload });
    case "SET_CAKE_COLOR":
      return addToHistory({ ...state, cakeColor: action.payload });
    case "SET_FLAVOUR":
      return addToHistory({ ...state, flavour: action.payload });
    case "ADD_ELEMENT":
      return addToHistory({
        ...state,
        elements: [...state.elements, action.payload],
      });
    case "REMOVE_ELEMENT":
      return addToHistory({
        ...state,
        elements: state.elements.filter((el) => el !== action.payload),
      });
    case "SET_TOPPER":
      return addToHistory({ ...state, topper: action.payload });
    case "SET_MESSAGE":
      return addToHistory({ ...state, message: action.payload });
    case "UNDO":
      if (state.currentIndex > 0) {
        return {
          ...state.history[state.currentIndex - 1],
          history: state.history,
          currentIndex: state.currentIndex - 1,
        };
      }
      return state;
    case "REDO":
      if (state.currentIndex < state.history.length - 1) {
        return {
          ...state.history[state.currentIndex + 1],
          history: state.history,
          currentIndex: state.currentIndex + 1,
        };
      }
      return state;
    case "RESET":
      return { ...initialState, history: [], currentIndex: -1 };
    default:
      return state;
  }
};

const addToHistory = (newState) => {
  const history = newState.history.slice(0, newState.currentIndex + 1);
  return {
    ...newState,
    history: [
      ...history,
      { ...newState, history: undefined, currentIndex: undefined },
    ],
    currentIndex: history.length,
  };
};

export const CakeContextProvider = ({ children }) => {
  const [cakeState, dispatch] = useReducer(cakeReducer, initialState);

  return (
    <CakeContext.Provider value={{ cakeState, dispatch }}>
      {children}
    </CakeContext.Provider>
  );
};

CakeContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useCakeContext = () => {
  const context = useContext(CakeContext);
  if (context === undefined) {
    throw new Error("useCakeContext must be used within a CakeContextProvider");
  }
  return context;
};
