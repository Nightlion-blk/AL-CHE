import { createContext, useContext, useReducer, useState, useEffect } from "react";
import { RenderCake, BaseModel } from '../models/CakeModels';
import ElementModel from "./ElementModel";
import PropTypes from "prop-types";
import axios from "axios";
import { ShopContext } from "./ShopContext"; // Import ShopContext

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
    case "SET_CAKE_MODEL":
    return {
    ...state,
    cakeModel: action.payload
    };
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

case "SET_LOADING": {
  return {
    ...state,
    isLoading: action.payload
  };
}
    case "SET_ELEMENTS": {
  if (!Array.isArray(action.payload)) {
    console.warn("SET_ELEMENTS received non-array payload:", action.payload);
    return {
      ...state,
      elements: []
    };
  }
  
  // Convert plain objects to ElementModel instances
  const elements = action.payload.map(element => {
    if (element instanceof ElementModel) {
      return element;
    }
    
    const model = new ElementModel(element.path || "");
    model.uniqueId = element.uniqueId || Date.now() + Math.random().toString(36).substring(2);
    
    // Set properties if they exist
    if (element.name) model.setName(element.name);
    if (element.position) model.setPosition(element.position);
    if (element.color) model.setColor(element.color);
    if (element.targetedMeshName) model.setTargetedMeshName(element.targetedMeshName);
    if (element.price !== undefined) model.setPrice(element.price);
    if (element.scale) model.setScale(element.scale);
    
    return model;
  });
  
  return {
    ...state,
    elements: elements
  };
}
    default:
      return state;
  }
};

export const CakeContextProvider = ({ children }) => {
  const [cakeState, dispatch] = useReducer(cakeReducer, initialState);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
const API_URL = import.meta.env.VITE_API_URL
  
  // Load token and user data from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('Token');
    const storedUser = JSON.parse(localStorage.getItem('user'));
    
    if (storedToken) {
      setToken(storedToken);
    }
    
    if (storedUser && storedUser.id) {
      setUserId(storedUser.id);
    }
  }, []);

const saveCakeDesign = async (name, description = "", isPublic = false, previewImage = null) => {
  try {
    console.log("Saving cake design:", name);
    
    // Check for authentication
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }

    // Extract only the properties the backend expects
    const payload = {
      userId, // The userId from context
      name,
      description,
      isPublic,
      previewImage, // Add the preview image parameter
      
      // Cake properties needed by backend
      cakeModel: cakeState.cakeModel,
      cakePlacement: cakeState.cakePlacement,
      elements: cakeState.elements,
      message: cakeState.message,
      messageColor: cakeState.messageColor,
      messageFont: cakeState.messageFont,
      messagePosition: cakeState.messagePosition,
      messageRotation: cakeState.messageRotation || [0, 0, 0]
    };

    // Get username from localStorage if possible
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.username) {
      payload.username = userData.username;
    }
    
    console.log("Sending cake design payload:", { 
      designName: name,
      hasPreviewImage: !!previewImage,
      userId 
    });
    
    const response = await axios.post(
      `${API_URL}/createCake`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      }
    );
    
    // Return the response data
    return response.data;
  } catch (error) {
    console.error("Error saving cake design:", error);
    throw error;
  }
}

const getUserCakeDesigns = async () => {
  try {
    // Check for authentication
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }

    const response = await axios.get(
      `${API_URL}/cake/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      }
    );
    console.log("User cake designs response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching user cake designs:", error);
    throw error;
  }
}

const loadCakeDesign = async (designId) => {
  try {
    console.log("CakeContext: Loading design with ID:", designId);
    
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }
    
    // Set loading state
    dispatch({ type: "SET_LOADING", payload: true });
    
    // Updated URL to use the correct endpoint (adjust path if needed)
    const response = await axios.get(
      `${API_URL}/userCake/${designId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      }
    );
    
    // The controller returns { success: true, data: design }
    const responseData = response.data;
    console.log("CakeContext: Raw API response:", responseData);
    
    // Check if we have valid data
    if (!responseData.success || !responseData.data) {
      throw new Error("Invalid design data received");
    }
    
    // Extract the design data from response.data.data
    const design = responseData.data;
    console.log("CakeContext: Design data:", design);
    
    // Update cake model
    if (design.cakeModel && design.cakeModel.path) {
      console.log("CakeContext: Setting cake model:", design.cakeModel);
      
      // Create a proper model instance instead of using the raw API data
        const cakeModelInstance = RenderCake(
        design.cakeModel.name || "Loaded Cake",
        design.cakeModel.path,
        design.cakeModel.position || [0, 0, 0],
        design.cakeModel.color || { r: 1, g: 1, b: 1 },
        design.cakeModel.targetedMeshName || ["Cake"],
        design.cakeModel.textureMap || {},
        design.cakeModel.price || 0,
        design.message || ""
      );
      
      // Dispatch with the proper instance
      dispatch({ type: "SET_CAKE_MODEL", payload: cakeModelInstance });
    } else {
      console.warn("CakeContext: Design has no valid cakeModel");
    }
    
    // The rest of your existing code...
    // Update cake placement
    if (design.cakePlacement) {
      dispatch({ type: "UPDATE_CAKE_PLACEMENT", payload: design.cakePlacement });
    }
    
    // Update elements
    if (Array.isArray(design.elements)) {
      console.log("CakeContext: Setting elements:", design.elements);
      dispatch({ type: "SET_ELEMENTS", payload: design.elements });
    } else {
      dispatch({ type: "SET_ELEMENTS", payload: [] });
    }
    
    // Update message properties
    if (design.message !== undefined) {
      dispatch({ type: "UPDATE_MESSAGE", payload: design.message });
    }
    
    if (design.messagePosition && design.messagePosition.length === 3) {
      dispatch({ type: "SET_MESSAGE_POSITION", payload: design.messagePosition });
    }
    
    if (design.messageRotation && design.messageRotation.length === 3) {
      dispatch({ type: "SET_MESSAGE_ROTATION", payload: design.messageRotation });
    }
    
    // Reset loading state
    dispatch({ type: "SET_LOADING", payload: false });
    
    return design;
  } catch (error) {
    console.error("Error loading cake design:", error);
    dispatch({ type: "SET_LOADING", payload: false });
    throw error;
  }
};
  return (
    <CakeContext.Provider value={{ cakeState, dispatch, saveCakeDesign, getUserCakeDesigns, loadCakeDesign, token, userId }}>
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
