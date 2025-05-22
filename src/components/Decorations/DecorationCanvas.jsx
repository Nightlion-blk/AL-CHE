import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF, TransformControls, Sphere } from '@react-three/drei';
import { useCakeContext } from "../../context/CakeContext";
import * as THREE from 'three';
import { Undo2, Redo2, RotateCcw, Radius, Copy, ClipboardPaste } from "lucide-react";
import TextElement from './TextElement';
import SaveButton from './SaveButton';
import CanvasScreenshot from './CanvasScreenshot';
import { toast } from 'react-toastify';
import FrostingDrawer from './FrostingDrawer';

// Create ElementRenderer with forwardRef to properly handle refs
const ElementRenderer = React.forwardRef(({ element, index, selected, onSelect }, ref) => {
  if (!element || !element.path) return null;
  
  // Add a cache busting parameter for duplicates
  const modelPath = element.uniqueId ? 
    `${element.path}?uid=${element.uniqueId}` : 
    element.path;
    
  // Load the model with the modified path
  const { scene } = useGLTF(element.path, true); // Force a new load with true
  
  // Create a deep clone of the scene to avoid shared references
  const clonedScene = useMemo(() => {
    if (!scene) return null;
    
    // Create a proper deep clone to avoid shared materials
    const clone = scene.clone(true); // Deep clone
    
    // Clone all materials to prevent shared material issues
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        // Clone the material
        child.material = child.material.clone();
        
        // If it has a map, clone that too
        if (child.material.map) {
          child.material.map = child.material.map.clone();
        }
      }
    });
    
    return clone;
  }, [scene]);
  
  const groupRef = useRef();
  
  // Connect the forwarded ref to our inner ref
  React.useImperativeHandle(ref, () => groupRef.current);
  
  // Apply position
  const position = element.position || [0, 0, 0];
  
  // Apply scale
  const scale = element.scale || [1, 1, 1];
  
  const [hitboxSize, setHitboxSize] = useState([1, 1, 1]);
  const [hitboxCenter, setHitboxCenter] = useState([0, 0, 0]);

  // Calculate bounding box and set hitbox size
  React.useEffect(() => {
    if (clonedScene) {
      // Create temporary bounding box
      const boundingBox = new THREE.Box3().setFromObject(clonedScene);
      
      // Calculate dimensions
      const width = boundingBox.max.x - boundingBox.min.x;
      const height = boundingBox.max.y - boundingBox.min.y;
      const depth = boundingBox.max.z - boundingBox.min.z;
      
      // Calculate center offset (important for non-centered models)
      const centerX = (boundingBox.max.x + boundingBox.min.x) / 2;
      const centerY = (boundingBox.max.y + boundingBox.min.y) / 2;
      const centerZ = (boundingBox.max.z + boundingBox.min.z) / 2;
      
      // Increase padding for easier selection
      const padding = 2;
      
      // Set the hitbox size
      setHitboxSize([
        width * padding * Math.abs(scale[0]), 
        height * padding * Math.abs(scale[1]), 
        depth * padding * Math.abs(scale[2])
      ]);
      
      // Set hitbox center offset
      setHitboxCenter([centerX, centerY, centerZ]);
    }
  }, [clonedScene, scale]);
  
  // Make all meshes in the scene interactive - THIS IS THE IMPORTANT PART
  React.useLayoutEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          // Check if this is a flower element based on ID
          const isFlower = 
            element.id?.includes('rose') || 
            element.id?.includes('sunflower') || 
            element.id?.includes('orchid') ||
            element.id?.includes('flower');
          
          if (isFlower) {
            // For flowers, use alphaTest instead of disabling transparency
            if (child.material) {
              // Keep transparency but make clickable
              child.material.alphaTest = 0.2;
              child.material.needsUpdate = true;
            }
          } else {
            // For non-flowers, use the original approach
            child.material.transparent = false;
          }
          
          // Common settings for all meshes
          child.layers.enable(0);
          child.raycast = child.raycast || THREE.Mesh.prototype.raycast;
          child.material.depthWrite = true;
          child.material.depthTest = true;
          child.userData.clickable = true;
        }
      });
    }
  }, [scene, element.id]);
  
  // Apply color and textures
  React.useLayoutEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
          const targetNames = Array.isArray(element.targetedMeshName) 
            ? element.targetedMeshName 
            : [element.targetedMeshName];
            
          if (targetNames.includes(child.name) || targetNames.includes("default")) {
            if (element.color && element.color.primary) {
              // If selected, apply a highlight effect to the material
              if (selected) {
                // Store original color if not already stored
                if (!child.userData.originalColor) {
                  child.userData.originalColor = new THREE.Color(element.color.primary);
                }
                // Apply a brighter version of the color
                const highlightColor = new THREE.Color(element.color.primary);
                highlightColor.multiplyScalar(1.3); // Make it brighter
                child.material.color.set(highlightColor);
                child.material.emissive = new THREE.Color(0.2, 0.2, 0.2);
              } else {
                // Restore original color if available, otherwise use the element color
                const color = child.userData.originalColor || new THREE.Color(element.color.primary);
                child.material.color.set(color);
                child.material.emissive = new THREE.Color(0, 0, 0);
              }
            }
            
            // Apply textures if needed
            if (element.textureMap && element.textureMap.has(child.name)) {
              // Texture handling code here
            }
          }
        }
      });
    }
  }, [scene, element, selected]); // Added selected as a dependency
  
  // In the ElementRenderer component
  React.useEffect(() => {
  // Ensure the 3D object matches the stored rotation values when element changes
  if (groupRef.current && element.rotation) {
    groupRef.current.rotation.set(
      element.rotation[0],
      element.rotation[1],
      element.rotation[2]
    );
    console.log(`Element ${element.id} rotation set to:`, element.rotation);
  }
}, [element, element.rotation]);
  
  return (
    <group 
      ref={groupRef} 
      position={position}
      rotation={element.rotation ? [element.rotation[0], element.rotation[1], element.rotation[2]] : [0, 0, 0]}
    >
      {clonedScene && <primitive object={clonedScene} scale={scale} />}
      {/* Dynamic hitbox */}
      <mesh 
          position={hitboxCenter}
          onClick={(e) => {
            console.log(`Hitbox clicked for element ${index} (${element.id})`);
            e.stopPropagation();
            
            // For flowers, ensure the click is properly captured
            const isFlower = 
              element.id?.includes('rose') || 
              element.id?.includes('sunflower') || 
              element.id?.includes('orchid') ||
              element.id?.includes('flower');
              
            if (isFlower) {
              // Ensure click is fully captured
              e.nativeEvent.stopImmediatePropagation();
            }
            
            onSelect(index, e);
            e.nativeEvent.stopPropagation();
            e.nativeEvent.preventDefault();
          }}
          userData={{ isHitbox: true }}
        >
          <boxGeometry args={hitboxSize} /> 
          <meshBasicMaterial 
            transparent={true} 
            opacity={0} 
            depthWrite={false} 
            depthTest={true} 
          />
        </mesh>

        {/* Selection indicator that also scales with the object */}
        {selected && (
          <mesh position={hitboxCenter} visible={true}>
            <boxGeometry args={hitboxSize} />
            <meshBasicMaterial 
              color="pink" 
              opacity={0.2} 
              transparent={true} 
              depthWrite={false} 
            />
          </mesh>
        )}
    </group>
  );
});

const TextControls = ({ text, transformMode = 'translate', onPositionChange }) => {
  const { scene } = useThree();
  const transformRef = useRef();

  React.useEffect(() => {
    const controls = transformRef.current;
    
    if (!controls || !text) return;
    
    const callback = (event) => {
      // Get orbit controls from scene.userData where we stored it
      const orbitControls = scene.userData?.orbitControls;
      
      if (orbitControls) {
        orbitControls.enabled = !event.value;
      }
      
      // If dragging ended, update the position in state
      if (!event.value && onPositionChange) {
        const newPosition = text.position.toArray();
        onPositionChange(newPosition);
      }
    };
    
    controls.addEventListener('dragging-changed', callback);
    return () => controls.removeEventListener('dragging-changed', callback);
  }, [scene, text, onPositionChange]);
  
  if (!text) return null;
  
  return (
    <TransformControls
      ref={transformRef}
      object={text}
      mode={transformMode}
      size={0.5}
    />
  );
};

// Controls for the selected element
const ElementControls = ({ selectedElement, transformMode, onPositionChange, onRotationChange, selectedElementIndices, dispatch }) => {
  const { scene } = useThree();
  const transformRef = useRef();
  
  // Add tracking for both position and rotation changes
  React.useEffect(() => {
    const controls = transformRef.current;
    
    if (!controls || !selectedElement) return;
    
    // Track changes while dragging/rotating
    const handleObjectChange = (event) => {
      const object = event.target.object;
      
      if (selectedElementIndices && selectedElementIndices.length === 1) {
        if (transformMode === 'rotate') {
          // Get rotation values and ensure they're numbers
          const newRotation = [
            typeof object.rotation.x === 'number' ? object.rotation.x : 0,
            typeof object.rotation.y === 'number' ? object.rotation.y : 0,
            typeof object.rotation.z === 'number' ? object.rotation.z : 0
          ];
          
          console.log("New rotation:", newRotation.map(val => 
            // Add type checking before using toFixed
            typeof val === 'number' ? val.toFixed(2) : String(val)
          ));
          
          // Dispatch with validated numeric values
          dispatch({
            type: "UPDATE_ELEMENT_ROTATION",
            index: selectedElementIndices[0],
            rotation: newRotation
          });
        } 
        else if (transformMode === 'translate') {
          // Same approach for positions
          const newPosition = [
            typeof object.position.x === 'number' ? object.position.x : 0,
            typeof object.position.y === 'number' ? object.position.y : 0, 
            typeof object.position.z === 'number' ? object.position.z : 0
          ];
          
          dispatch({
            type: "UPDATE_ELEMENT_POSITION",
            index: selectedElementIndices[0],
            position: newPosition
          });
        }
      }
    };
    
    // Actually attach the handler to the controls
    controls.addEventListener('objectChange', handleObjectChange);
    
    // Clean up event listener when component unmounts or dependencies change
    return () => {
      if (controls) {
        controls.removeEventListener('objectChange', handleObjectChange);
      }
    };
  }, [selectedElement, transformMode, selectedElementIndices, dispatch]); // Include all dependencies
  
  return (
    <TransformControls
      ref={transformRef}
      object={selectedElement}
      mode={transformMode}
      size={0.75}
    />
  );
};

// Cake model renderer component
const CakeRenderer = ({ cakeModel }) => {
  if (!cakeModel || !cakeModel.path) return null;
  
  // 👇 FIX: Add cakeState to the destructured values from context
  const { dispatch, cakeState } = useCakeContext();
  
  // 👇 ADD THIS LINE - create the missing meshRef
  const meshRef = useRef(null);
  
  const { scene } = useGLTF(cakeModel.path);
  const position = cakeModel.position || [0, 0, 0];
  
  // Add this effect to store the scene in the meshRef
  React.useEffect(() => {
    if (scene) {
      meshRef.current = scene;
    }
  }, [scene]);
  
  React.useEffect(() => {
    if (scene) {
      // Create a bounding box
      const boundingBox = new THREE.Box3().setFromObject(scene);
      
      // Calculate cake top position data
      const cakePlacement = {
        topY: boundingBox.max.y,
        centerX: (boundingBox.max.x + boundingBox.min.x) / 2,
        centerZ: (boundingBox.max.z + boundingBox.min.z) / 2,
        radius: Math.min(
          (boundingBox.max.x - boundingBox.min.x) / 2,
          (boundingBox.max.z - boundingBox.min.z) / 2
        ) * 0.8
      };
      
      // Store in context
      dispatch({
        type: "UPDATE_CAKE_PLACEMENT",
        payload: cakePlacement
      });
      
      console.log("Cake top position calculated:", cakePlacement);
    }
  }, [scene, dispatch]);

  React.useLayoutEffect(() => {
  if (scene) {
    scene.traverse((child) => {
      if (child.isMesh) {
        // Check for BATTER mesh - apply primary flavor color
        if (child.name.toUpperCase() === 'BATTER' || 
            child.name.toLowerCase().includes('batter') || 
            (cakeModel.batterMeshes && cakeModel.batterMeshes.includes(child.name))) {
          
          // If we have a flavor with primary color, use it
          if (cakeState.flavour && cakeState.flavour.primary) {
            console.log(`Applying flavor primary color ${cakeState.flavour.primary} to ${child.name}`);
            child.material.color.set(cakeState.flavour.primary);
          } 
          // Fall back to cakeModel color if available
          else if (cakeModel.color && cakeModel.color.batter) {
            child.material.color.set(cakeModel.color.batter);
          }
          // Default fallback color
          else {
            child.material.color.set("#F9F5E7"); // Default vanilla color
          }
          
          // Apply batter textures if available - FIXED
          if (cakeModel.textureMap && cakeModel.textureMap.batter) {
            const texture = cakeModel.textureMap.batter;
            if (texture) {
              const textureLoader = new THREE.TextureLoader();
              const loadedTexture = textureLoader.load(texture);
              loadedTexture.repeat.set(3, 3);
              loadedTexture.wrapS = loadedTexture.wrapT = THREE.RepeatWrapping;
              child.material.map = loadedTexture;
              child.material.needsUpdate = true;
            }
          }
        }
        // Check for CREAM mesh - apply secondary flavor color
        else if (child.name.toUpperCase() === 'CREAM' || 
                child.name.toLowerCase().includes('cream') || 
                (cakeModel.creamMeshes && cakeModel.creamMeshes.includes(child.name))) {
          
          // If we have a flavor with secondary color, use it
          if (cakeState.flavour && cakeState.flavour.secondary) {
            console.log(`Applying flavor secondary color ${cakeState.flavour.secondary} to ${child.name}`);
            child.material.color.set(cakeState.flavour.secondary);
          } 
          // Fall back to cakeModel color if available
          else if (cakeModel.color && cakeModel.color.cream) {
            child.material.color.set(cakeModel.color.cream);
          }
          // Default fallback color
          else {
            child.material.color.set("#E8D7B4"); // Default vanilla cream color
          }
          
          // Apply cream textures if available - FIXED
          if (cakeModel.textureMap && cakeModel.textureMap.cream) {
            const texture = cakeModel.textureMap.cream;
            if (texture) {
              const textureLoader = new THREE.TextureLoader();
              const loadedTexture = textureLoader.load(texture);
              loadedTexture.repeat.set(3, 3);
              loadedTexture.wrapS = loadedTexture.wrapT = THREE.RepeatWrapping;
              child.material.map = loadedTexture;
              child.material.needsUpdate = true;
            }
          }
        }
        // Handle other meshes (original logic)
        else {
          const targetNames = Array.isArray(cakeModel.targetedMeshName) 
            ? cakeModel.targetedMeshName 
            : [cakeModel.targetedMeshName];
            
          if (targetNames.includes(child.name) || targetNames.includes("default")) {
            if (cakeModel.color && cakeModel.color.primary) {
              child.material.color.set(cakeModel.color.primary);
            }
            
            // Apply textures if available - FIXED
            if (cakeModel.textureMap && cakeModel.textureMap[child.name]) {
              const texture = cakeModel.textureMap[child.name];
              if (texture) {
                const textureLoader = new THREE.TextureLoader();
                const loadedTexture = textureLoader.load(texture);
                loadedTexture.repeat.set(3, 3);
                loadedTexture.wrapS = loadedTexture.wrapT = THREE.RepeatWrapping;
                child.material.map = loadedTexture;
                child.material.needsUpdate = true;
              }
            }
          }
        }
      }
    });
  }
}, [scene, cakeModel, cakeState.flavour]); // Added cakeState.flavour as a dependency
  useEffect(() => {
  // Update material colors when cakeModel.color changes
  if (meshRef.current && cakeModel.color) {
    const material = meshRef.current.material;
    
    // Check if material is an array (for multiple materials)
    if (Array.isArray(material)) {
      material.forEach(mat => {
        if (mat.color) {
          mat.color.set(cakeModel.color);
        }
      });
    } else if (material && material.color) {
      material.color.set(cakeModel.color);
    }
  }
}, [cakeModel.color]);

  // Update the return to use the meshRef
  return <primitive ref={meshRef} object={scene} position={position} />;
};

const DecorationCanvas = React.forwardRef(({ frostingActive, frostingColor, frostingSize }, ref) => {
  // Create ref for orbit controls
  const orbitControlsRef = useRef(null);
  const decorationCanvasRef = useRef(null);
  const { cakeState, dispatch, loadCakeDesign } = useCakeContext();
   const [loadingDesign, setLoadingDesign] = useState(false);
  const [selectedElementIndices, setSelectedElementIndices] = useState([]);
  const [isTextSelected, setIsTextSelected] = useState(false);
  const textRef = useRef(null);
  const [transformMode, setTransformMode] = useState('translate');
  const elementRefs = useRef([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [processingClick, setProcessingClick] = useState(false);
  const [copiedElement, setCopiedElement] = useState(null);
  const [pasteOffset, setPasteOffset] = useState(0); // To offset pasted elements
  const [canvasImageUrl, setCanvasImageUrl] = useState(null);
  
  // Replace your existing states with these enhanced ones
const [copiedElements, setCopiedElements] = useState([]);
const [clipboardType, setClipboardType] = useState(null); // 'elements', 'text', or null
const [clipboardTimestamp, setClipboardTimestamp] = useState(null);
  
  const canUndo = cakeState.currentIndex > 0;
  const canRedo = cakeState.currentIndex < cakeState.history.length - 1;
  
  const handleUndo = () => {
    dispatch({ type: "UNDO" });
  };
  
  const handleRedo = () => {
    dispatch({ type: "REDO" });
  };
  
  const handleReset = () => {
    dispatch({ type: "RESET" });
  };
  
  const handleSaveComplete = (savedData) => {
    console.log('Design saved:', savedData);
    // Optional: Add notification or feedback logic here
  };
  useEffect(() => {
  // Force cleanup of any cached Three.js objects whenever elements change
  return () => {
    useGLTF.clear(); // Clear the model cache
  };
}, [cakeState.elements]);
  // Create refs when elements change
  useEffect(() => {
    // Create new refs array when elements length changes
    elementRefs.current = Array(cakeState.elements.length).fill().map((_, i) => 
      elementRefs.current[i] || React.createRef()
    );
  }, [cakeState.elements.length]);
  
  // Update selected object when selection changes
  useEffect(() => {
    if (selectedElementIndices.length === 1 && 
        elementRefs.current[selectedElementIndices[0]] && 
        elementRefs.current[selectedElementIndices[0]].current) {
      setSelectedObject(elementRefs.current[selectedElementIndices[0]].current);
    } else {
      setSelectedObject(null);
    }
  }, [selectedElementIndices, cakeState.elements]);
  
  useEffect(() => {
  console.log("Cake state updated:", cakeState);
}, [cakeState]);

 // Add the handleLoadDesign function
const handleLoadDesign = async (designId) => {
  if (!designId) {
    console.error("No design ID provided for loading");
    return;
  }
  
  try {
    setLoadingDesign(true);
    console.log("Loading design with ID:", designId);
    
    // Call the loadCakeDesign function from your context
    await loadCakeDesign(designId);
    
    // Deselect any elements after loading a design
    setSelectedElementIndices([]);
    setIsTextSelected(false);
    
    console.log("Design loaded successfully");
  } catch (error) {
    console.error("Error loading design:", error);
    // You might want to add an error toast here
    if (toast) {
     console.log("Failed to load design. Please try again.");
    }
  } finally {
    setLoadingDesign(false);
  }
};

  React.useImperativeHandle(ref, () => ({
    loadDesign: async (designId) => {
    try {
      console.log("DecorationCanvas: Starting to load design:", designId);
      setLoadingDesign(true);
      
      // Fetch design data
      const designData = await loadCakeDesign(designId);
      console.log("DecorationCanvas: Design data received:", designData);
      
      // First, reset the current state to avoid conflicts
      dispatch({ type: "RESET" });
      
      // Apply flavour first if it exists
      if (designData.flavour) {
        console.log("DecorationCanvas: Setting flavour data:", designData.flavour);
        dispatch({
          type: "SET_FLAVOUR",
          payload: designData.flavour
        });
      }
      
      // Apply cake model
      if (designData.cakeModel) {
        console.log("DecorationCanvas: Applying cake model:", designData.cakeModel);
        
        // Make a deep copy to avoid reference issues
        const modelCopy = JSON.parse(JSON.stringify(designData.cakeModel));
        
        // Make sure color has proper format
        if (!modelCopy.color) modelCopy.color = {};
        if (typeof modelCopy.color === 'string') {
          modelCopy.color = {
            primary: modelCopy.color,
            batter: modelCopy.color
          };
        }
        
        // Apply the cake model
        dispatch({ 
          type: "SET_CAKE_MODEL", 
          payload: modelCopy 
        });
      }
      
      // Apply elements if they exist
      if (Array.isArray(designData.elements)) {
        console.log("DecorationCanvas: Applying elements:", designData.elements);
        
        // Map elements to ensure they have required properties
        const mappedElements = designData.elements.map(element => {
          if (!element.path) {
            console.warn("Element missing path:", element);
            return null;
          }
          return element;
        }).filter(Boolean); // Remove null elements
        
        dispatch({ type: "SET_ELEMENTS", payload: mappedElements });
      }
      
      // Apply message if it exists
      if (designData.message !== undefined) {
        console.log("DecorationCanvas: Applying message:", designData.message);
        dispatch({ type: "SET_MESSAGE", payload: designData.message });
      }
      
      // Apply message color if it exists
      if (designData.messageColor) {
        dispatch({ type: "SET_MESSAGE_COLOR", payload: designData.messageColor });
      }
      
      // Apply message position if it exists
      if (designData.messagePosition) {
        dispatch({ type: "SET_MESSAGE_POSITION", payload: designData.messagePosition });
      }

      if (designData.messageScale) {
  let finalScale = [0.15, 0.15, 0.15]; // Default scale
  
  if (Array.isArray(designData.messageScale)) {
    if (designData.messageScale.length === 1) {
      // Expand single value to 3D vector
      const value = designData.messageScale[0];
      finalScale = [value, value, value];
      console.log("DecorationCanvas: Expanding single value messageScale to:", finalScale);
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
  console.log("DecorationCanvas: Setting message scale from loaded design:", finalScale);
}
      
      console.log("DecorationCanvas: Design loaded successfully");
      console.log("Design loaded successfully");
      return designData;
    } catch (error) {
      console.error("Error loading design in DecorationCanvas:", error);
     console.log("Failed to load design: " + (error.message || "Unknown error"));
      throw error;
    } finally {
      setLoadingDesign(false);
    }
  }
}));

  const handlePositionChange = (newPosition) => {
    if (selectedElementIndices.length === 1) {
      dispatch({
        type: "UPDATE_ELEMENT_POSITION",
        index: selectedElementIndices[0],
        position: newPosition
      });
    }
  };
  
  const handleRotationChange = (newRotation) => {
  if (selectedElementIndices.length === 1) {
    console.log("Updating rotation to:", newRotation); // Add this debug line
    dispatch({
      type: "UPDATE_ELEMENT_ROTATION",
      index: selectedElementIndices[0],
      rotation: newRotation
    });
  }
};

  const isSelected = (index) => selectedElementIndices.includes(index);
  
  const handleElementSelect = (index, e) => {
    if (e.shiftKey) {
      // Multi-select mode
      if (isSelected(index)) {
        setSelectedElementIndices(selectedElementIndices.filter(i => i !== index));
      } else {
        setSelectedElementIndices([...selectedElementIndices, index]);
      }
    } else {
      // Single select mode
      setSelectedElementIndices([index]);
    }
  };
   
  const handleResetRotation = () => {
    if (selectedElementIndices.length === 1) {
      // Reset the rotation of the selected object
      if (selectedObject) {
        selectedObject.rotation.set(0, 0, 0);
        
        // Also update the state through dispatch
        dispatch({
          type: "UPDATE_ELEMENT_ROTATION",
          index: selectedElementIndices[0],
          rotation: [0, 0, 0]
        });
      }
    } else if (isTextSelected && textRef.current) {
      // Reset text rotation if text is selected
      textRef.current.rotation.set(0, 0, 0);
      
      dispatch({
        type: "SET_MESSAGE_ROTATION",
        payload: [0, 0, 0]
      });
    }
  };

  const handleCanvasClick = (e) => {
    // If we hit something
    if (e.intersections && e.intersections.length > 0) {
      const hitObject = e.intersections[0].object;
      
      console.log("Hit object:", hitObject);
      
      // Check if we hit a hitbox
      if (hitObject.userData && hitObject.userData.isHitbox) {
        // Click is already handled by the hitbox's own onClick handler
        console.log("Hitbox already handling this click");
        return;
      }
      
      // Check if clicking on text element
      if (hitObject.userData.isText || 
          (hitObject.parent && hitObject.parent.userData && hitObject.parent.userData.isText)) {
        console.log("Clicked on text");
        return; // Text click is handled by its own handler
      }
      
      // If we hit something else (cake model, etc.), deselect everything
      setIsTextSelected(false);
      setSelectedElementIndices([]);
    } else {
      // Clicked on empty space
      console.log("Empty space clicked, deselecting all");
      setIsTextSelected(false);
      setSelectedElementIndices([]);
    }
  };

  const handleTextClick = (e) => {
    console.log("Text clicked in DecorationCanvas");
    e.stopPropagation();
    setIsTextSelected(true);
    setSelectedElementIndices([]); // Deselect other elements
    console.log("Group ref when clicked:", e.object); // Log the clicked object
  };

  useEffect(() => {
    console.log("Text ref updated:", textRef.current);
    console.log("isTextSelected:", isTextSelected);
  }, [textRef.current, isTextSelected]);

  // Update your handleCopyElement function to better capture scale

const handleCopyElement = () => {
  // Handle copying elements
  if (selectedElementIndices.length > 0) {
    try {
      const elementsToCopy = selectedElementIndices.map(index => {
        // Get the element from state
        const element = cakeState.elements[index];
        
        // Skip invalid elements
        if (!element) {
          console.warn("Attempted to copy undefined element at index", index);
          return null;
        }
        
        // For 3D objects, get the current transform from the ref
        let currentTransform = {};
        
        if (elementRefs.current[index] && elementRefs.current[index].current) {
          const ref = elementRefs.current[index].current;
          
          // Get live transform values from the Three.js object
          currentTransform = {
            position: ref.position.toArray(),
            rotation: ref.rotation.toArray(),
            scale: ref.scale.toArray()
          };
          
          console.log(`Copying element ${element.name || element.id} with scale:`, currentTransform.scale);
        } else {
          console.warn(`Element ref not available for index ${index}, using stored values`);
        }
        
        // Create a complete copy with all transform properties
        const elementCopy = {
          // Basic properties
          id: element.id,
          name: element.name,
          price: element.price,
          path: element.path || "",
          uniqueId: `copy_${Date.now()}_${index}`,
          
          // Transform properties - prioritize live values
          position: currentTransform.position || element.position || [0, 0, 0],
          rotation: currentTransform.rotation || element.rotation || [0, 0, 0],
          scale: currentTransform.scale || element.scale || [1, 1, 1],
          
          // Other properties to preserve
          targetedMeshName: element.targetedMeshName || element.id,
          color: element.color || "#FFFFFF"
        };
        
        return elementCopy;
      }).filter(Boolean); // Remove any null elements
      
      // Store the copied elements
      setCopiedElements(elementsToCopy);
      setClipboardType('elements');
      setClipboardTimestamp(Date.now());
      
      // Visual feedback
      console.log(
        `${elementsToCopy.length > 1 
          ? `${elementsToCopy.length} elements` 
          : 'Element'} copied with transformations`
      );
      
      console.log("Elements copied:", elementsToCopy);
    } catch (error) {
      console.error("Error during copy operation:", error);
     console.log("Failed to copy elements");
    }
    return;
  }
  
  // Handle copying text if selected
  if (isTextSelected && textRef.current && cakeState.message) {
    const textToCopy = {
      message: cakeState.message,
      color: cakeState.messageColor || "#000000",
      font: cakeState.messageFont || "script",
      position: textRef.current.position ? [...textRef.current.position.toArray()] : [0, 1, 0],
      rotation: textRef.current.rotation ? [...textRef.current.rotation.toArray()] : [0, 0, 0]
    };
    
    setCopiedElements([textToCopy]);
    setClipboardType('text');
    setClipboardTimestamp(Date.now());
    
    // Visual feedback
    console.log("Text copied");
    console.log("Text copied:", textToCopy);
    
    return;
  }
  
  // Nothing selected
  console.log("Select an element or text to copy");
};

// Update your handlePasteElement function to preserve scale exactly

const handlePasteElement = () => {
  if (!clipboardType || copiedElements.length === 0) {
    console.log("Nothing to paste");
    return;
  }
  
  // Handle pasting elements
  if (clipboardType === 'elements') {
    // Calculate paste position offset
    const baseOffset = 0.1
    const newElementIndices = [];
    
    // Track the current element count to calculate new indices
    const currentElementCount = cakeState.elements.length;
    
    copiedElements.forEach((element, i) => {
      // Always use the EXACT same scale as the copied element
      // Don't do any validation that might reset to default
      console.log("Scala: ", element.scale  )
    const exactScale = [
  element.scale[0] - 0.5,
  element.scale[1] - 0.5, 
  element.scale[2] - 0.5
];
      
      // Create a new element with unique ID and offset position
      const newElement = {
        ...element,
        uniqueId: `paste_${Date.now()}_${i}`, // Ensure unique ID
        
        // Offset the position, but keep exact rotation and scale
        position: [
          element.position[0] + baseOffset,
          element.position[1],
          element.position[2] + baseOffset
        ],
        // Use the EXACT scale from the copied element
        scale: exactScale,
        // Ensure rotation is properly preserved
        rotation: element.rotation ? [...element.rotation] : [0, 0, 0]
      };
      
      console.log(`Pasting element with exact scale:`, exactScale);
      console.log(`Pasting element with rotation:`, newElement.rotation);
      
      // Dispatch with cakeModelProps structure
      dispatch({
        type: "ADD_ELEMENT",
        cakeModelProps: newElement
      });
      
      // Track the index of the new element
      newElementIndices.push(currentElementCount + i);
    });
    
    // Select the newly added elements after a delay
    setTimeout(() => {
      setSelectedElementIndices(newElementIndices);
    }, 150);
    
    // Visual feedback
   console.log(
      `${copiedElements.length > 1 
        ? `${copiedElements.length} elements` 
        : 'Element'} pasted with exact size and rotation`
    );
    
    return;
  }
  
  // Handle pasting text
  if (clipboardType === 'text' && copiedElements[0]) {
    const textData = copiedElements[0];
    
    // Update the text properties in cake state
    dispatch({ type: "SET_MESSAGE", payload: textData.message });
    dispatch({ type: "SET_MESSAGE_COLOR", payload: textData.color });
    dispatch({ type: "SET_MESSAGE_FONT", payload: textData.font });
    
    // Position with a slight offset
    const offsetPosition = [
      textData.position[0] + 0.3,
      textData.position[1], 
      textData.position[2] + 0.3
    ];
    
    dispatch({ type: "SET_MESSAGE_POSITION", payload: offsetPosition });
    
    if (textData.rotation) {
      dispatch({ type: "SET_MESSAGE_ROTATION", payload: textData.rotation });
    }
    
    // Select the text after a short delay
    setTimeout(() => {
      setIsTextSelected(true);
      setSelectedElementIndices([]);
    }, 50);
    
    // Visual feedback
    console.log("Text pasted");
  }
};
  
  // Add this component and then include it in your JSX

// Copy/Paste status indicator
const ClipboardIndicator = () => {
  if (!clipboardType) return null;
  
  return (
    <div className="absolute top-2 right-2 z-10 bg-white px-3 py-1 rounded-full shadow-md text-sm">
      <div className="flex items-center">
        <span className="mr-1">
          {clipboardType === 'elements' 
           ? `${copiedElements.length} element${copiedElements.length > 1 ? 's' : ''} copied` 
           : 'Text copied'}
        </span>
        <span className="text-xs opacity-50">Press Ctrl+V to paste</span>
      </div>
    </div>
  );
};

// Add this to your return JSX, near the top
<ClipboardIndicator />

  // Add this near the top of your component, with your other refs
const rendererRef = useRef(null);

// Improved CanvasScreenshot component
const CanvasScreenshot = ({ onScreenshot }) => {
  const { gl, scene, camera } = useThree();
  
  useEffect(() => {
    // Function to take a screenshot with debug logging
    const takeScreenshot = () => {
      console.log("Taking screenshot with:", {
        hasGL: !!gl,
        hasScene: !!scene,
        hasCamera: !!camera
      });
      
      // Ensure we render the current scene state
      gl.render(scene, camera);
      
      // Get the screenshot as data URL
      const dataURL = gl.domElement.toDataURL('image/png');
      console.log("Screenshot captured, data size:", dataURL.length);
      
      // Pass to parent via callback
      onScreenshot(dataURL);
      
      return dataURL;
    };
    
    // Take an initial screenshot when component mounts
    setTimeout(takeScreenshot, 500);
    
    // Add the function to window object for external access
    window.takeCanvasScreenshot = takeScreenshot;
    
    return () => {
      delete window.takeCanvasScreenshot;
    };
  }, [gl, scene, camera, onScreenshot]);
  
  return null;
};

  // Keyboard shortcuts for copy-paste and delete
// Keyboard shortcuts for copy-paste and delete

// First define the delete function with useCallback
const handleDeleteSelected = useCallback(() => {
  // Delete selected elements
  if   (selectedElementIndices.length > 0) {
    // Sort indices in descending order to prevent index shifting issues
    const sortedIndices = [...selectedElementIndices].sort((a, b) => b - a);
    
    console.log("Deleting elements at indices:", sortedIndices);
    
    // Delete each selected element
    sortedIndices.forEach(index => {
      dispatch({ 
        type: "REMOVE_ELEMENT", 
        index 
      });
    });
    
    // Clear selection after deletion
    setSelectedElementIndices([]);
    
    // Show feedback
    console.log(`Deleted ${selectedElementIndices.length > 1 ? `${selectedElementIndices.length} elements` : 'element'}`);
  } 
  // Delete text if selected
  else if (isTextSelected) {
    dispatch({ type: "SET_MESSAGE", payload: "" });
    setIsTextSelected(false);
    console.log("Text deleted");
  }
  // Nothing selected
  else {
    console.log("Select an element or text to delete");
  }
}, [selectedElementIndices, isTextSelected, dispatch]);

useEffect(() => {
  const handleKeyDown = (e) => {
    // Skip if we're in a text field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    const isCopy = (e.key === 'c' || e.key === 'C') && (e.ctrlKey || e.metaKey);
    const isPaste = (e.key === 'v' || e.key === 'V') && (e.ctrlKey || e.metaKey);
    const isCut = (e.key === 'x' || e.key === 'X') && (e.ctrlKey || e.metaKey);
    const isDelete = e.key === 'Delete' || e.key === 'Backspace';
    
    console.log("Key event:", e.key, "Selected indices:", selectedElementIndices);
    
    if (isCopy) {
      e.preventDefault();
      handleCopyElement();
    } 
    else if (isPaste) {
      e.preventDefault();
      handlePasteElement();
    }
    else if (isCut) {
      e.preventDefault();
      handleCopyElement();
      handleDeleteSelected();
    }
    else if (isDelete) {
      e.preventDefault();
      console.log("Delete key pressed, selected indices:", selectedElementIndices);
      handleDeleteSelected();
    }
  };  
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedElementIndices, isTextSelected, copiedElements, clipboardType, handleDeleteSelected]);


  return (
    <div className="relative">
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <button
          className={`p-2 rounded-full bg-white shadow-md ${
            canUndo ? "text-gray-800 hover:bg-gray-100" : "text-gray-400"
          }`}
          disabled={!canUndo}
          onClick={handleUndo}
          aria-label="Undo"
        >
          <Undo2 size={18} />
        </button>
        <button
          className={`p-2 rounded-full bg-white shadow-md ${
            canRedo ? "text-gray-800 hover:bg-gray-100" : "text-gray-400"
          }`}
          disabled={!canRedo}
          onClick={handleRedo}
          aria-label="Redo"
        >
          <Redo2 size={18} />
        </button>
        <button
          className="p-2 rounded-full bg-white shadow-md text-gray-800 hover:bg-gray-100"
          onClick={handleReset}
          aria-label="Reset"
        >
          <RotateCcw size={18} />
        </button>
        <button
          className={`p-2 rounded-full bg-white shadow-md ${
            selectedElementIndices.length > 0 || isTextSelected 
              ? "text-gray-800 hover:bg-gray-100" 
              : "text-gray-400"
          }`}
          disabled={selectedElementIndices.length === 0 && !isTextSelected}
          onClick={handleCopyElement}
          title="Copy (Ctrl+C)"
        >
          <Copy size={18} />
        </button>
        <button
          className={`p-2 rounded-full bg-white shadow-md ${
            clipboardType ? "text-gray-800 hover:bg-gray-100" : "text-gray-400"
          }`}
          disabled={!clipboardType}
          onClick={handlePasteElement}
          title="Paste (Ctrl+V)"
        >
          <ClipboardPaste size={18} />
        </button>
      </div>
      
      {/* Transform mode controls */}
      {selectedElementIndices.length === 1 && (
        <div className="absolute top-12 right-2 z-10 bg-white p-2 rounded-lg shadow-md">
          <div className="flex space-x-2">
            <button 
              onClick={() => setTransformMode('translate')}
              className={`p-1 ${transformMode === 'translate' ? 'bg-pink-200' : 'bg-gray-100'} rounded`}
              title="Move"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 9l4-4 4 4M9 5v14M19 15l-4 4-4-4M15 19V5"></path>
              </svg>
            </button>
            <button 
              onClick={() => setTransformMode('rotate')}
              className={`p-1 ${transformMode === 'rotate' ? 'bg-pink-200' : 'bg-gray-100'} rounded`}
              title="Rotate"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
            </button>
            <button 
              onClick={() => setTransformMode('scale')}
              className={`p-1 ${transformMode === 'scale' ? 'bg-pink-200' : 'bg-gray-100'} rounded`}
              title="Scale"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 3L9 15"></path>
                <path d="M12 3H3v18h18v-9"></path>
                <path d="M16 3h5v5"></path>
              </svg>
            </button>
            <button 
              onClick={() => setSelectedElementIndices([])}
              className="p-1 bg-red-100 rounded ml-2"
              title="Deselect"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18"></path>
                <path d="M6 6l12 12"></path>
              </svg>
            </button>
            <button 
  onClick={handleResetRotation}
  className="p-1 bg-blue-100 rounded ml-2"
  title="Reset Rotation"
>
  <Radius size={18} /> {/* You're already importing this icon */}
</button>
          </div>
        </div>
      )}
      
      {/* Text controls UI - only show when text is selected */}
      {isTextSelected && (
        <div className="absolute top-12 right-2 z-10 bg-white p-2 rounded-lg shadow-md">
          <div className="flex space-x-2">
            <button 
              onClick={() => setTransformMode('translate')}
              className={`p-1 ${transformMode === 'translate' ? 'bg-pink-200' : 'bg-gray-100'} rounded`}
              title="Move Text"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 9l4-4 4 4M9 5v14M19 15l-4 4-4-4M15 19V5"></path>
              </svg>
            </button>
            <button 
              onClick={() => setIsTextSelected(false)}
              className="p-1 bg-red-100 rounded ml-2"
              title="Deselect Text"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18"></path>
                <path d="M6 6l12 12"></path>
              </svg>
            </button>

             <button 
              onClick={handleCopyElement}
              className="p-1 bg-indigo-100 rounded ml-2"
              title="Copy Element"
            >
              <Copy size={18} />
            </button>

            {copiedElement && (
        <button 
          onClick={handlePasteElement}
          className="p-1 bg-green-100 rounded"
          title="Paste Element"
        >
          <ClipboardPaste size={18} />
        </button>
      )}
          </div>
        </div>
      )}
      
      <div className="bg-gray-100 rounded-lg h-[300px] md:h-[400px] flex items-center justify-center relative overflow-hidden">
  {loadingDesign && (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
    </div>
  )}
        <Canvas 
          camera={{ position: [0, 2, 5], fov: 50 }} 
          onClick={handleCanvasClick}
          onCreated={({ gl, camera, scene }) => {
            // Store references for later use
            rendererRef.current = gl;
            scene.userData.orbitControls = orbitControlsRef.current;
          }}
          raycaster={{ 
            params: { 
              Points: { threshold: 0.5 },
              Line: { threshold: 0.5 },
              Mesh: { threshold: 0.01 } // Lower threshold for better clicking
            } 
          }}
        >
          <Environment preset="sunset" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 7]} intensity={1} />
          <OrbitControls 
            ref={orbitControlsRef}
            minPolarAngle={Math.PI / 6} 
            maxPolarAngle={Math.PI - Math.PI / 6} 
            makeDefault
          />
          
          {/* Render cake model */}
          {cakeState.cakeModel && (
            <CakeRenderer cakeModel={cakeState.cakeModel} />
          )}
          
          {/* Render elements */}
          {cakeState.elements.map((element, index) => (
            <ElementRenderer 
              key={`element-${index}`}
              element={element}
              index={index}
              ref={elementRefs.current[index]}
              selected={isSelected(index)}
              onSelect={(idx, e) => handleElementSelect(idx, e)}
            />
          ))}
          
          {/* Add transform controls for selected element */}
          {selectedObject && (
            <ElementControls 
              selectedElement={selectedObject}
              transformMode={transformMode}
              onPositionChange={handlePositionChange}
              onRotationChange={handleRotationChange} // Pass the new handler
              selectedElementIndices={selectedElementIndices} // Pass the selected indices
              dispatch={dispatch} // Pass the dispatch function
            />
          )}
          {cakeState.message && (
            <TextElement
              ref={textRef}
              message={cakeState.message}
              color={cakeState.messageColor || "#000000"}
              fontStyle={cakeState.messageFont || "script"}
              scale={cakeState.messageScale || 0.15} // Add this line to pass the scale
              onClick={handleTextClick}
            />
          )}
            <FrostingDrawer 
              active={frostingActive}
              color={frostingColor}
              size={frostingSize}
            />
         {cakeState.frosting && cakeState.frosting.map((frostingGroup, groupIndex) => (
  <group key={`frostingGroup-${groupIndex}`}>
    {frostingGroup.balls.map((ball, ballIndex) => (
      <Sphere
        key={`saved-frosting-${groupIndex}-${ballIndex}`}
        args={[ball.size, 8, 8]}
        position={[ball.position[0], ball.position[1], ball.position[2]]}
      >
        <meshStandardMaterial
          color={ball.color}
          roughness={0.3}
          metalness={0.1}
        />
      </Sphere>
    ))}
  </group>
))}

          {isTextSelected && textRef.current && (
            <>
              {/* Debug sphere to visualize the position */}
              <mesh position={textRef.current.position.clone()} transparency = {true}>
                <sphereGeometry args={[0.1]} />
                <meshBasicMaterial transparent={true} opacity={0.5}/>
              </mesh>
              
              {/* Log the text ref */}
              {console.log("Using text ref for controls:", textRef.current)}
              
              <TextControls
                text={textRef.current}
                transformMode={transformMode} 
                onPositionChange={(newPosition) => {
                  console.log("Position changed:", newPosition);
                  dispatch({ type: "SET_MESSAGE_POSITION", payload: newPosition });
                }}
              />
            </>
          )}
          <CanvasScreenshot onScreenshot={(dataURL) => {
    console.log("Screenshot taken, length:", dataURL.length);
    setCanvasImageUrl(dataURL);
  }} />
        </Canvas>
      </div>
      
      {/* Add the save button below the canvas */}
      <div className="mt-4 flex justify-end">
        <SaveButton 
          onSaveComplete={handleSaveComplete}
          canvasImageUrl={canvasImageUrl}
        />
      </div>
    </div>
  );
});

export default DecorationCanvas;
