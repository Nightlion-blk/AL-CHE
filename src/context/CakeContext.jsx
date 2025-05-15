// Add useState and useEffect to your imports
import { createContext, useContext, useReducer, useState, useEffect } from "react";
import BaseModel from "./CakeRendererClass";
import ElementModel from "./ElementModel";
import PropTypes from "prop-types";

// Initial state with history tracking
const initialState = {
  cakeModel: null,
  elements: [],
  cakeColor: "#FFFFFF",
  flavour: "",
  message: "",
  // History management
  history: [], // Array of past states
  currentIndex: -1, // Current position in history
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

// Function to handle serializing and rebuilding ElementModel instances
const addToHistory = (state) => {
  // First convert the state to a serializable form
  const serializableState = {
    ...state,
    elements: state.elements.map(element => ({
      type: 'ElementModel',
      properties: element.getProperties(),
      uniqueId: element.uniqueId,
      path: element.path
    }))
  };
  
  // Remove future states if we've gone back in history
  const { history, currentIndex, ...stateToPush } = serializableState;
  const newHistory = state.history.slice(0, state.currentIndex + 1);
  
  // THIS RETURN STATEMENT WAS MISSING
  return {
    ...state,
    history: [...newHistory, JSON.parse(JSON.stringify(stateToPush))],
    currentIndex: newHistory.length,
  };
};

// Rebuild ElementModel instances when restoring from history
const rebuildFromHistory = (historicalState) => {
  if (!historicalState) return initialState;
  
  // Rebuild ElementModel instances
  const elements = historicalState.elements.map(elData => {
    if (elData.type === 'ElementModel') {
      const model = new ElementModel(elData.path);
      model.uniqueId = elData.uniqueId;
      model.setName(elData.properties.name);
      model.setPosition(elData.properties.position);
      model.setColor(elData.properties.color);
      model.setTargetedMeshName(elData.properties.targetedMeshName);
      model.setPrice(elData.properties.price);
      model.setScale(elData.properties.scale);
      return model;
    }
    return elData;
  });
  
  return {
    ...historicalState,
    elements
  };
};

// Updated reducer with history management
const cakeReducer = (state, action) => {
  switch (action.type) {

    case "SET_BASE_STYLE":
      const style = action.cakeModelProps;
      const newState = {
        ...state,
        baseStyle: action.payload,
      };
      newState.cakeModel = RenderCake(
        style.name,
        style.path,
        style.position,
        style.color,
        style.targetedMeshName,
        style.textures,
        style.price,
        state.message
      );
      return addToHistory(newState);
    case "SET_CAKE_TYPE":
      const cake = action.cakeModelProps;
      const newState1 = {
        ...state,
        cakeType: action.payload,
      };
      if (cake && cake.path) {
        console.log("Cake path:", cake.path);
        newState1.cakeModel = RenderCake(
          cake.name,
          cake.path,
          cake.position,
          cake.color,
          cake.targetedMeshName,
          cake.textures,
          cake.price,
          state.message
        );
      }
      return addToHistory(newState1);
    case "SET_CAKE_COLOR":
      return addToHistory({ ...state, cakeColor: action.payload });
    case "SET_FLAVOUR":
      return addToHistory({ ...state, flavour: action.payload });
    case "ADD_ELEMENT": {
      const newElementProps = action.cakeModelProps;
      const newElementModel = new ElementModel(newElementProps.path);
      
      // Add a unique ID to each element
      newElementModel.uniqueId = Date.now() + Math.random().toString(36).substring(2);
      
      // Use the proper setter methods we've already defined in ElementModel
      newElementModel.setName(newElementProps.name || newElementProps.id || "Element");
      newElementModel.setPosition(newElementProps.position || [0, 0, 0]);
      newElementModel.setColor(newElementProps.color || "#FFFFFF");
      newElementModel.setTargetedMeshName(newElementProps.targetedMeshName || "default");
      newElementModel.setPrice(newElementProps.price || 0);
      
      if (newElementProps.textures) {
        newElementModel.setTextures(newElementProps.textures);
      }
      
      if (newElementProps.scale) {
        newElementModel.setScale(newElementProps.scale);
      }
      
      // Store the element data in state and add to history
      return addToHistory({
        ...state,
        elements: [...state.elements, newElementModel],
      });
    }
    case "REMOVE_ELEMENT":
      return addToHistory({
        ...state,
        elements: state.elements.filter((el) => el !== action.payload),
      });
    case "SET_TOPPER":
      return addToHistory({ ...state, topper: action.payload });
    case "SET_MESSAGE": {
  return addToHistory({
    ...state,
    message: action.payload
  });
}

case "SET_CAKE_TOP_POSITION": {
  return addToHistory({
    ...state,
    cakeTopPosition: action.payload
  });
}

case "SET_MESSAGE_FONT": {
  return addToHistory({
    ...state,
    messageFont: action.payload
  });
}

case "SET_MESSAGE_COLOR": {
  return addToHistory({
    ...state,
    messageColor: action.payload
  });
}

case "SET_MESSAGE_POSITION": {
  return addToHistory({
    ...state,
    messagePosition: action.payload
  });
}
case "SET_MESSAGE_SCALE": {
  return {
    ...state,
    messageScale: action.payload,
    history: [...state.history.slice(0, state.currentIndex + 1), state],
    currentIndex: state.currentIndex + 1
  };
}
    case "UNDO": {
      // No history or at the beginning
      if (state.history.length === 0 || state.currentIndex <= 0) {
        return state;
      }
      
      // Move back in history
      const previousIndex = state.currentIndex - 1;
      const previousState = state.history[previousIndex];
      
      return {
        ...rebuildFromHistory(previousState),
        history: state.history,
        currentIndex: previousIndex,
      };
    }
    case "REDO": {
      // No history or at the end
      if (state.history.length === 0 || 
          state.currentIndex >= state.history.length - 1) {
        return state;
      }
      
      // Move forward in history
      const nextIndex = state.currentIndex + 1;
      const nextState = state.history[nextIndex];
      
      // Use rebuildFromHistory to properly reconstruct ElementModel instances
      return {
        ...rebuildFromHistory(nextState),
        history: state.history,
        currentIndex: nextIndex,
      };
    }
    case "RESET": {
      return {
        ...initialState,
        history: [],
        currentIndex: -1
      };
    }
    case "UPDATE_CAKE_PLACEMENT": {
  return {
    ...state,
    cakePlacement: action.payload,  // Store under cakePlacement
    cakeTopPosition: action.payload  // Also store under cakeTopPosition for compatibility
  };
}


    default:
      return state;
  }
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
