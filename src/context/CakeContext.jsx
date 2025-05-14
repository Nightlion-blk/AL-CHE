// Add useState and useEffect to your imports
import { createContext, useContext, useReducer, useState, useEffect } from "react";
import BaseModel from "./CakeRendererClass";
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

export const RenderCake = (name, path, position, color, targetedMeshName, textures, price, text) => {
  const cakeModel = new BaseModel(path);
  cakeModel.setName(name);
  cakeModel.setPosition(position);
  cakeModel.setColor(color);
  cakeModel.setTargetedMeshName(targetedMeshName);
  cakeModel.setPath(path);
  cakeModel.setPrice(price);
  cakeModel.setTextures(textures);
  if (text) {
    cakeModel.setText(text); // Add text if provided
  }
  cakeModel.getProperties = function() {
    return {
      name: this.name,
      position: this.position,
      color: this.color,
      targetedMeshName: this.targetedMeshName,
      text: this.text,
      price: this.price,
      path: this.path,
      textures: this.textureMap,
    };
  };
  return cakeModel;
};

const CakeContext = createContext(undefined);

const cakeReducer = (state, action) => {
  switch (action.type) {
    case "SET_BASE_STYLE":
      const newState = {
        ...state,
        baseStyle: action.payload,
      };

        newState.cakeModel = RenderCake(
        "Cake",
        "/models/cake.glb",
        [0, 0, 0],
        { primary: newState.cakeColor },
        ["Layer1Mesh", "Layer2Mesh"],
        new Map(),
        newState.price,
        newState.message
      );
      return addToHistory(newState);

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

export const useUsername = () => {
  const [username, setUsername] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Load username from localStorage on initial render
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedUserId = localStorage.getItem('userId');
    
    if (storedUsername && storedUserId) {
      setUsername(storedUsername);
      setUserId(storedUserId);
      setIsLoggedIn(true);
    }
  }, []);
  
  // Login function
  const login = (newUsername, newUserId) => {
    setUsername(newUsername);
    setUserId(newUserId);
    setIsLoggedIn(true);
    
    // Save to localStorage
    localStorage.setItem('username', newUsername);
    localStorage.setItem('userId', newUserId);
  };
  
  // Logout function
  const logout = () => {
    setUsername(null);
    setUserId(null);
    setIsLoggedIn(false);
    
    // Clear from localStorage
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
  };
  
  return {
    username,
    userId,
    isLoggedIn,
    login,
    logout
  };
};
