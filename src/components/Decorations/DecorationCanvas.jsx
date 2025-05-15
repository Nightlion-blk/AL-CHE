import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF, TransformControls } from '@react-three/drei';
import { useCakeContext } from "../../context/CakeContext";
import * as THREE from 'three';
import { Undo2, Redo2, RotateCcw, Radius } from "lucide-react";
import TextElement from './TextElement';
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
      
      {/* Make this helper mesh LARGER but invisible (no wireframe) */}
      <mesh 
        position={[0, 0, 0]} 
        onClick={(e) => {
          console.log("Helper mesh clicked", index);
          e.stopPropagation();
          onSelect(index, e);
          e.nativeEvent.stopPropagation(); // Stop native event propagation too
          e.nativeEvent.preventDefault(); // Prevent default
        }}
      >
        <boxGeometry args={[2, 2, 2]} />
        <meshBasicMaterial color="pink" opacity={0.0} transparent /> {/* Removed wireframe, made fully transparent */}
      </mesh>
      
      {/* Keep existing selection indicator but without wireframe */}
      {selected && (
        <mesh position={[0, 0.5, 0]} visible={true}>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshBasicMaterial color="pink" opacity={0.3} transparent /> {/* Removed wireframe */}
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
              }
            }
          }
        }
      });
    }
  }, [scene, cakeModel]);
  
  return <primitive object={scene} position={position} />;
};

const DecorationCanvas = () => {
  // Create ref for orbit controls
  const orbitControlsRef = useRef(null);
  const { cakeState, dispatch } = useCakeContext();
  const [selectedElementIndices, setSelectedElementIndices] = useState([]);
  const [isTextSelected, setIsTextSelected] = useState(false);
  const textRef = useRef(null);
  const [transformMode, setTransformMode] = useState('translate');
  const elementRefs = useRef([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [processingClick, setProcessingClick] = useState(false);
  
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
    
  const handleCanvasClick = (e) => {
    console.log("Canvas click event:", e);
    console.log("Object hit:", e.object ? e.object.type || "unknown type" : "no object");
    
    // Add more logging to understand the click event
    console.log("Event target path:", e.path ? [...e.path].map(el => el.type) : "no path");
    console.log("isTextSelected before:", isTextSelected);
    
    // IMPORTANT: Check if clicking on text or invisible mesh
    if (e.object && (
      e.object.userData.isText || 
      (e.object.parent && e.object.parent.userData && e.object.parent.userData.isText)
    )) {
      console.log("Clicked on text, not deselecting");
      return; // Don't deselect if clicking on text
    }
    
    // Only deselect if clicking on empty space
    if (!e.object || e.object.type === "Scene") {
      console.log("Clicked on empty space, deselecting");
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
          </div>
        </div>
      )}
      
      <div className="bg-gray-100 rounded-lg h-[300px] md:h-[400px] flex items-center justify-center relative overflow-hidden">
        <Canvas 
          camera={{ position: [0, 2, 5], fov: 50 }} 
          onClick={handleCanvasClick}
          onCreated={({ gl, camera, scene }) => {
            // Store the scene for later use
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
              scale={cakeState.messageScale || 0.15} // Add this line to pass the scale
              onClick={handleTextClick}
            />
          )}
          {isTextSelected && textRef.current && (
            <>
              {/* Debug sphere to visualize the position */}
              <mesh position={textRef.current.position.clone()}>
                <sphereGeometry args={[0.1]} />
                <meshBasicMaterial color="red" />
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
        </Canvas>
      </div>
    </div>
  );
};

export default DecorationCanvas;
