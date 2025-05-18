import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF, TransformControls } from '@react-three/drei';
import { useCakeContext } from "../../context/CakeContext";
import * as THREE from 'three';
import { Undo2, Redo2, RotateCcw, Radius, Copy, ClipboardPaste } from "lucide-react";
import TextElement from './TextElement';
import SaveButton from './SaveButton';
import CanvasScreenshot from './CanvasScreenshot';

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
          // These settings are crucial for click detection
          child.material.transparent = false; // Ensure material isn't transparent
          child.layers.enable(0);  // Enable default layer
          child.raycast = child.raycast || THREE.Mesh.prototype.raycast; // Ensure raycast method exists
          child.material.depthWrite = true; // Enable depth writing
          child.material.depthTest = true; // Enable depth testing
          child.userData.clickable = true; // Mark as clickable
        }
      });
    }
  }, [scene]);
  
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
  
  return (
    <group 
      ref={groupRef} 
      position={position}
    >
      {clonedScene && <primitive object={clonedScene} scale={scale} />}
      
      {/* Dynamic hitbox */}
      <mesh 
          position={hitboxCenter} // Use the calculated center instead of [0, 0, 0]
          onClick={(e) => {
            console.log("Hitbox clicked for element", index);
            e.stopPropagation();
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
const ElementControls = ({ selectedElement, transformMode, onPositionChange }) => {
  const { scene } = useThree();
  const transformRef = useRef();
  
  // Disable orbit controls while transform controls are being used
  React.useEffect(() => {
    const controls = transformRef.current;
    
    if (!controls || !selectedElement) return;
    
    const callback = (event) => {
      const orbitControls = scene.userData.orbitControls;
      if (orbitControls) {
        orbitControls.enabled = !event.value;
      }
      
      // If dragging ended, update the position in state
      if (!event.value && onPositionChange && selectedElement) {
        const newPosition = selectedElement.position.toArray();
        onPositionChange(newPosition);
      }
    };
    
    controls.addEventListener('dragging-changed', callback);
    return () => controls.removeEventListener('dragging-changed', callback);
  }, [scene, selectedElement, onPositionChange]);
  
  if (!selectedElement) return null;
  
  return (
    <TransformControls
      ref={transformRef}
      object={selectedElement}
      mode={transformMode}
    />
  );
};

// Cake model renderer component
const CakeRenderer = ({ cakeModel }) => {
  if (!cakeModel || !cakeModel.path) return null;
  const { dispatch } = useCakeContext();
  const { scene } = useGLTF(cakeModel.path);
  const position = cakeModel.position || [0, 0, 0];
  
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
        // Handle cream layer
        if (child.name.includes("cream") || (cakeModel.creamMeshes && cakeModel.creamMeshes.includes(child.name))) {
          if (cakeModel.color && cakeModel.color.cream) {
            child.material.color.set(cakeModel.color.cream);
          }
          
          // Apply cream textures
          if (cakeModel.textureMap && cakeModel.textureMap.has("cream")) {
            const texture = cakeModel.textureMap.get("cream");
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
        // Handle batter
        else if (child.name.includes("batter") || (cakeModel.batterMeshes && cakeModel.batterMeshes.includes(child.name))) {
          if (cakeModel.color && cakeModel.color.batter) {
            child.material.color.set(cakeModel.color.batter);
          }
          
          // Apply batter textures
          if (cakeModel.textureMap && cakeModel.textureMap.has("batter")) {
            const texture = cakeModel.textureMap.get("batter");
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
            
            // Apply textures if available
            if (cakeModel.textureMap && cakeModel.textureMap.has(child.name)) {
              const texture = cakeModel.textureMap.get(child.name);
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
}, [scene, cakeModel]);
  
  return <primitive object={scene} position={position} />;
};

const DecorationCanvas = React.forwardRef((props, ref) => {
  // Create ref for orbit controls
  const orbitControlsRef = useRef(null);
  const decorationCanvasRef = useRef(null);
  const { cakeState, dispatch,  loadCakeDesign} = useCakeContext();
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

 React.useImperativeHandle(ref, () => ({
    loadDesign: handleLoadDesign
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

  const handleCopyElement = () => {
    if (selectedElementIndices.length === 1) {
      const elementToCopy = cakeState.elements[selectedElementIndices[0]];
      const elementCopy = JSON.parse(JSON.stringify(elementToCopy)); // Deep clone
      
      // Store the copied element
      setCopiedElement(elementCopy);
      console.log("Element copied:", elementCopy);
    }
  };

  const handlePasteElement = () => {
    if (!copiedElement) return;
    
    // Create a new element based on the copied one
    const newElement = {
      ...copiedElement,
      uniqueId: Date.now().toString(), // Ensure unique ID
      position: [
        copiedElement.position[0] + 0.5 + (pasteOffset * 0.25),
        copiedElement.position[1] + 0.5 + (pasteOffset * 0.25),
        copiedElement.position[2]
      ]
    };
    
    // Increment offset for future pastes
    setPasteOffset(pasteOffset + 1);
    
    // Add the new element to the cake state
    dispatch({
      type: "ADD_ELEMENT",
      payload: newElement
    });
    
    // Select the newly added element
    setTimeout(() => {
      setSelectedElementIndices([cakeState.elements.length]);
    }, 10);
  };

  const handleLoadDesign = async (designId) => {
  console.log("DecorationCanvas: handleLoadDesign called with ID:", designId);
  try {
    setLoadingDesign(true);
    
    // Call the context function to load the design
    const design = await loadCakeDesign(designId);
    console.log("DecorationCanvas: Design loaded:", design);
    
    // Reset selections
    setSelectedElementIndices([]);
    setIsTextSelected(false);
    
    // Reset camera position (optional)
    if (orbitControlsRef.current) {
      orbitControlsRef.current.reset();
    }
    
    // Show success message
    toast.success("Design loaded successfully");
    
    // Return the design so the parent component can update tabs
    return design;
  } catch (error) {
    console.error("DecorationCanvas: Error loading design:", error);
    toast.error("Failed to load design");
    throw error;
  } finally {
    setLoadingDesign(false);
  }
};
  
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
          className="p-2 rounded-full bg-white shadow-md text-gray-800 hover:bg-gray-100"
          onClick={handleCopyElement}
          aria-label="Copy"
        >
          <Copy size={18} />
        </button>
        <button
          className="p-2 rounded-full bg-white shadow-md text-gray-800 hover:bg-gray-100"
          onClick={handlePasteElement}
          aria-label="Paste"
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
            />
          )}
          {cakeState.message && (
            <TextElement
              ref={textRef}
              message={cakeState.message}
              color={cakeState.messageColor || "#000000"}
              fontStyle={cakeState.messageFont || "script"}
              onClick={handleTextClick} // Add click handler to select text
            />
          )}
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
