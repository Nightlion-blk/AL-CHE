import { createContext, useContext, useReducer, useState, useEffect } from "react";
import { RenderCake, BaseModel } from '../models/CakeModels';
import ElementModel from "./ElementModel";
import PropTypes from "prop-types";
import axios from "axios";
import { ShopContext } from "./ShopContext"; // Make sure this import is present

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
      // Add this line to restore rotation
      if (elData.properties.rotation) {
        model.setRotation(elData.properties.rotation);
      }
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
    case "SET_CAKE_COLOR": {
      const newState = { ...state, cakeColor: action.payload };
      
      // Update the cake model's color if it exists
      if (newState.cakeModel) {
        // Clone the cake model
        const updatedCakeModel = { ...newState.cakeModel };
        
        // Update the color
        updatedCakeModel.color = action.payload;
        
        // Replace the cake model with updated version
        newState.cakeModel = updatedCakeModel;
      }
      
      return addToHistory(newState);
    }
    case "SET_FLAVOUR": {
  const newState = { ...state, flavour: action.payload };
  
  // If the flavor has a primary color, update the cake color too
  if (action.payload && action.payload.primary) {
    newState.cakeColor = action.payload.primary;
    
    // If we have a cake model, update its color too
    if (newState.cakeModel) {
      const updatedCakeModel = { ...newState.cakeModel };
      
      // Create or update the color object
      if (!updatedCakeModel.color) updatedCakeModel.color = {};
      
      // Update both the model's main color and specific colors
      updatedCakeModel.color = {
        ...updatedCakeModel.color,
        primary: action.payload.primary,
        batter: action.payload.primary
      };
      
      // If there's a secondary color, use it for cream
      if (action.payload.secondary) {
        updatedCakeModel.color.cream = action.payload.secondary;
      }
      
      newState.cakeModel = updatedCakeModel;
    }
  }
  
  return addToHistory(newState);
}
    case "ADD_ELEMENT": {
  // Verify the payload has all required properties
  if (!action.cakeModelProps || typeof action.cakeModelProps !== 'object') {
    console.error("Invalid element payload:", action.cakeModelProps);
    return state; // Return unchanged state instead of crashing
  }
  
  try {
    const newElementProps = action.cakeModelProps;
    
    // Safely create ElementModel with path validation
    const newElementModel = new ElementModel(newElementProps.path || "");
    
    // Add a unique ID to each element
    newElementModel.uniqueId = newElementProps.uniqueId || 
                             (Date.now() + Math.random().toString(36).substring(2));
    
    // Use the proper setter methods with fallbacks for missing properties
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
    
    // Add this rotation check
    if (newElementProps.rotation) {
      newElementModel.setRotation(newElementProps.rotation);
    }
    
    // Store the element data in state and add to history
    return addToHistory({
      ...state,
      elements: [...state.elements, newElementModel],
    });
  } catch (error) {
    console.error("Error creating element:", error);
    return state; // Return unchanged state on error
  }
}
    case "REMOVE_ELEMENT":
  console.log("Reducer: removing element at index", action.index);
  console.log("Before:", state.elements.length, "elements");
  const newElements = [...state.elements];
  newElements.splice(action.index, 1);
  console.log("After:", newElements.length, "elements");
  return addToHistory({
    ...state,
    elements: newElements
  });
  
    case "SET_TOPPER":
      return addToHistory({ ...state, topper: action.payload });
    case "SET_MESSAGE": {
  console.log("Setting message text:", action.payload);
  return {
    ...state,
    message: action.payload,
    // IMPORTANT: Set default rotation here if none exists
    messageRotation: state.messageRotation || [-Math.PI/2, 0, 0]
  };
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
    case "SET_MESSAGE_ROTATION": {
  console.log("Reducer: Setting message rotation to:", action.payload);
  return {
    ...state,
    messageRotation: action.payload
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
    
    // Add this line to handle rotation
    if (element.rotation) model.setRotation(element.rotation);
    
    return model;
  });
  
  return {
    ...state,
    elements: elements
  };
}
    // Add a new reducer case for frosting
case "ADD_FROSTING": {
  return addToHistory({
    ...state,
    frosting: [...(state.frosting || []), action.payload]
  });
}

case "CLEAR_FROSTING": {
  return addToHistory({
    ...state,
    frosting: []
  });
}

case "UPDATE_ELEMENT_POSITION": {
  const elements = [...state.elements];
  if (elements[action.index]) {
    const element = elements[action.index];
    element.setPosition(action.position);
  }
  return addToHistory({
    ...state,
    elements
  });
}

case "UPDATE_ELEMENT_ROTATION": {
  const elements = [...state.elements];
  if (elements[action.index]) {
    // Use the setRotation method instead of directly modifying the object
    elements[action.index].setRotation(action.rotation);
  }
  return addToHistory({
    ...state,
    elements
  });
}
    default:
      return state;
  }
};

export const CakeContextProvider = ({ children }) => {
  const [cakeState, dispatch] = useReducer(cakeReducer, initialState);
  const [token, setToken] = useState('');
  const [userId, setUserId] = useState('');
  const [currentDesignName, setCurrentDesignName] = useState('My Cake Design');
  const API_URL = import.meta.env.VITE_API_URL;
  
  // Access ShopContext to get userName
  const shopContext = useContext(ShopContext);
  
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

      // Convert ElementModel instances to plain objects with proper serialization
      const elementsToSave = cakeState.elements.map(element => ({
        path: element.path,
        position: element.position,
        rotation: element.rotation || [0, 0, 0],
        rotationType: 'XYZ', // Add this to ensure proper rotation type
        scale: element.scale || [1, 1, 1],
        color: element.color,
        targetedMeshName: element.targetedMeshName,
        uniqueId: element.uniqueId
      }));

      // Log element rotations and positions being saved
      console.log("===== ELEMENT ROTATIONS BEING SAVED =====");
      cakeState.elements.forEach((element, index) => {
        console.log(`Element ${index}: ${element.name || 'unnamed'} (${element.path?.split('/').pop() || 'no-path'})`);
        console.log(`  - Rotation: [${element.rotation?.[0] || 0}, ${element.rotation?.[1] || 0}, ${element.rotation?.[2] || 0}]`);
        console.log(`  - Position: [${element.position?.[0] || 0}, ${element.position?.[1] || 0}, ${element.position?.[2] || 0}]`);
      });

      // Extract and prepare all the properties the backend expects
      const payload = {
        userId, // The userId from context
        name,
        description,
        isPublic,
        previewImage,
        // Add username directly in initial payload with a default
        username: "Anonymous User", // This guarantees a username exists even if all lookups fail
        cakeModel: cakeState.cakeModel,
        cakePlacement: cakeState.cakePlacement,
        elements: elementsToSave, // Use the serialized elements array
        message: cakeState.message,
        messageColor: cakeState.messageColor,
        messageFont: cakeState.messageFont,
        messagePosition: cakeState.messagePosition,
        // IMPORTANT: Always include default rotation if none exists
        messageRotation: (cakeState.messageRotation && Array.isArray(cakeState.messageRotation) && cakeState.messageRotation.length === 3) 
          ? cakeState.messageRotation 
          : [-Math.PI/2, 0, 0],
        messageScale: cakeState.messageScale 
      };

      // Add this debug log to verify
      console.log("Saving messageRotation:", payload.messageRotation);

      // IMPROVED USERNAME HANDLING:
      // 1. First check ShopContext
      if (shopContext && shopContext.userName) {
        // Extract the actual username string, not the whole object
        payload.username = typeof shopContext.userName === 'object' && shopContext.userName.name 
          ? shopContext.userName.name 
          : shopContext.userName;
        console.log("Using userName from ShopContext:", payload.username);
      } 
      // 2. Then check localStorage for user data
      else {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (userData.username) {
          payload.username = userData.username;
          console.log("Using username from localStorage:", userData.username);
        } 
        // 3. If nothing found in localStorage user object, check separate username field
        else {
          const directUsername = localStorage.getItem('username');
          if (directUsername) {
            payload.username = directUsername;
            console.log("Using username from direct localStorage field:", directUsername);
          }
          else {
            // 4. Fallback to a default if we can't find a username anywhere
            payload.username = "Anonymous User";
            console.log("Using default username - no username found in context or storage");
          }
        }
      }
      
      // Update the current design name in context
      setCurrentDesignName(name);
      
      console.log("Sending cake design payload:", { 
        designName: name,
        username: payload.username,
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
      
      console.log("Save cake design response:", response.data);
      
      // Return the response data in a standardized format
      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error("Error saving cake design:", error);
      throw error;
    }
  };

const getUserCakeDesigns = async () => {
  try {
    // Check for authentication
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }

    console.log("Fetching cake designs for user:", userId);
    
    const response = await axios.get(
      `${API_URL}/cake/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        // Add pagination support
        params: {
          limit: 100, // Higher limit to get more designs
          page: 1
        }
      }
    );
    
    console.log("User cake designs response:", response.data);
    
    // Return the full response data to access pagination info if needed
    if (response.data.success) {
      return {
        success: true,
        designs: response.data.data,
        total: response.data.total,
        pages: response.data.pages
      };
    } else {
      throw new Error(response.data.message || "Failed to fetch designs");
    }
  } catch (error) {
    console.error("Error fetching user cake designs:", error);
    throw error;
  }
};

const loadCakeDesign = async (designId) => {
  try {
    console.log("CakeContext: Fetching design with ID:", designId);
    
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }
    
    const response = await axios.get(
      `${API_URL}/userCake/${designId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      }
    );
    
    // Log the full response for debugging
    console.log("CakeContext: Raw API response:", response.data);
    
    // Better response handling based on the updated controller
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to load design");
    }
    
    const designData = response.data.data;
    const isOwner = response.data.isOwner; // New field from the controller
    
    // Set the current design name from the loaded design
    if (designData.name) {
      setCurrentDesignName(designData.name);
      console.log("CakeContext: Loaded design name:", designData.name);
    }
    
    console.log("CakeContext: Processed design data:", designData);
    console.log("CakeContext: User is owner:", isOwner);
    
    // Log element rotations and positions from the database
    console.log("===== ELEMENT ROTATIONS FROM DATABASE =====");
    if (designData.elements && Array.isArray(designData.elements)) {
      designData.elements.forEach((element, index) => {
        console.log(`Element ${index}: ${element.path?.split('/').pop() || 'unknown'}`);
        console.log(`  - Rotation: [${element.rotation?.[0] || 0}, ${element.rotation?.[1] || 0}, ${element.rotation?.[2] || 0}]`);
        console.log(`  - Position: [${element.position?.[0] || 0}, ${element.position?.[1] || 0}, ${element.position?.[2] || 0}]`);
      });
    }
    
    // Return the design data with ownership information
    return {
      ...designData,
      isOwner
    };
  } catch (error) {
    console.error("Error fetching cake design:", error);
    throw error;
  }
};

const deleteCakeDesign = async (designId) => {
  try {
    console.log("Deleting cake design with ID:", designId);
    
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }
    
    const response = await axios.delete(
      `${API_URL}/delete/${designId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      }
    );
    
    console.log("Delete response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error deleting cake design:", error);
    throw error;
  }
}

const getAllDesigns = async (options = {}) => {
  try {
    console.log("Fetching all public cake designs");
    
    // Build query parameters
    const params = new URLSearchParams();
    
    // Add optional filtering parameters
    if (options.limit) params.append('limit', options.limit);
    if (options.page) params.append('page', options.page);
    if (options.sort) params.append('sort', options.sort);
    if (options.isPublic !== undefined) params.append('isPublic', options.isPublic);
    if (options.username) params.append('username', options.username);
    if (options.search) params.append('search', options.search);
    
    // Convert params to string
    const queryParams = params.toString() ? `?${params.toString()}` : '';
    
    // Make API request - token is optional for public designs
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.get(
      `${API_URL}/getall${queryParams}`,
      { headers }
    );
    
    console.log("All designs response:", response.data);
    
    // Return structured response with pagination info
    if (response.data.success) {
      return {
        success: true,
        designs: response.data.data,
        total: response.data.total || response.data.data.length,
        pages: response.data.pages || 1,
        currentPage: response.data.currentPage || options.page || 1
      };
    } else {
      throw new Error(response.data.message || "Failed to fetch designs");
    }
  } catch (error) {
    console.error("Error fetching all cake designs:", error);
    throw error;
  }
};

const getDesignById = async (designId) => {
  try {
    console.log("Fetching cake design with ID:", designId);
    
    // Include authorization token if available
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.get(
      `${API_URL}/userCake/${designId}`,
      { headers }
    );
    
    if (response.data.success) {
      // Return both the design data and whether user is owner
      return {
        success: true,
        design: {
          ...response.data.data,
          isOwner: response.data.isOwner
        }
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Failed to load design details'
      };
    }
  } catch (error) {
    console.error('Error fetching cake design details:', error);
    throw error;
  }
};

  return (
    <CakeContext.Provider value={{ 
      cakeState, 
      dispatch, 
      saveCakeDesign, 
      getUserCakeDesigns, 
      loadCakeDesign, 
      deleteCakeDesign,
      getAllDesigns, 
      getDesignById, // Add the new function here
      token, 
      userId,
      currentDesignName,
      setCurrentDesignName
    }}>
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

// Update the loadCakeDesign function to include detailed logging of element rotations and positions
const loadCakeDesign = async (designId) => {
  try {
    console.log("CakeContext: Fetching design with ID:", designId);
    
    if (!token) {
      throw new Error("Authentication required. Please log in.");
    }
    
    const response = await axios.get(
      `${API_URL}/userCake/${designId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
      }
    );
    
    // Log the full response for debugging
    console.log("CakeContext: Raw API response:", response.data);
    
    // Better response handling based on the updated controller
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to load design");
    }
    
    const designData = response.data.data;
    const isOwner = response.data.isOwner; // New field from the controller
    
    // Set the current design name from the loaded design
    if (designData.name) {
      setCurrentDesignName(designData.name);
      console.log("CakeContext: Loaded design name:", designData.name);
    }
    
    console.log("CakeContext: Processed design data:", designData);
    console.log("CakeContext: User is owner:", isOwner);
    
    // Log element rotations and positions from the database
    console.log("===== ELEMENT ROTATIONS FROM DATABASE =====");
    if (designData.elements && Array.isArray(designData.elements)) {
      designData.elements.forEach((element, index) => {
        console.log(`Element ${index}: ${element.path?.split('/').pop() || 'unknown'}`);
        console.log(`  - Rotation: [${element.rotation?.[0] || 0}, ${element.rotation?.[1] || 0}, ${element.rotation?.[2] || 0}]`);
        console.log(`  - Position: [${element.position?.[0] || 0}, ${element.position?.[1] || 0}, ${element.position?.[2] || 0}]`);
      });
    }
    
    // Return the design data with ownership information
    return {
      ...designData,
      isOwner
    };
  } catch (error) {
    console.error("Error fetching cake design:", error);
    throw error;
  }
};

// Update the loadCakeDesignIntoState function or similar function that handles setting state from loaded designs
const loadCakeDesignIntoState = (designData) => {
  // Reset the state with design data
  dispatch({ type: "RESET" });
  
  // Set the cake model
  if (designData.cakeModel) {
    dispatch({ type: "SET_CAKE_MODEL", payload: designData.cakeModel });
  }
  
  // Set cake placement
  if (designData.cakePlacement) {
    dispatch({ type: "SET_CAKE_PLACEMENT", payload: designData.cakePlacement });
  }
  
  // Add all elements
  if (designData.elements && Array.isArray(designData.elements)) {
    designData.elements.forEach(element => {
      dispatch({ 
        type: "ADD_ELEMENT", 
        cakeModelProps: element 
      });
    });
  }
  
  // Set message text
  if (designData.message !== undefined) {
    dispatch({ type: "SET_MESSAGE", payload: designData.message });
  }
  
  // Set message properties
  if (designData.messageColor) {
    dispatch({ type: "SET_MESSAGE_COLOR", payload: designData.messageColor });
  }

  if (designData.messageFont) {
    dispatch({ type: "SET_MESSAGE_FONT", payload: designData.messageFont });
  }

  if (designData.messagePosition && Array.isArray(designData.messagePosition)) {
    dispatch({ type: "SET_MESSAGE_POSITION", payload: designData.messagePosition });
  }

  if (designData.messageRotation && Array.isArray(designData.messageRotation)) {
    // If array is empty, provide default rotation
    const rotation = designData.messageRotation.length > 0 ? 
      designData.messageRotation : [-Math.PI/2, 0, 0];
    dispatch({ type: "SET_MESSAGE_ROTATION", payload: rotation });
  }

  // Fix for messageScale - handle single value like [0.58]
  if (designData.messageScale) {
    let finalScale = [0.15, 0.15, 0.15]; // Default if something goes wrong
    
    if (Array.isArray(designData.messageScale)) {
      if (designData.messageScale.length === 1) {
        // Expand single value to 3D vector
        const value = designData.messageScale[0];
        finalScale = [value, value, value];
        console.log("Expanding single value messageScale to:", finalScale);
      } 
      else if (designData.messageScale.length === 3) {
        finalScale = designData.messageScale;
      }
    } 
    else if (typeof designData.messageScale === 'number') {
      // Handle if it's just a number
      finalScale = [designData.messageScale, designData.messageScale, designData.messageScale];
    }
    
    dispatch({ type: "SET_MESSAGE_SCALE", payload: finalScale });
    console.log("Setting message scale from loaded design:", finalScale);
  }
};
