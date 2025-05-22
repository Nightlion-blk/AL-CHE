import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { useCakeContext } from '../../context/CakeContext';

const FrostingDrawer = ({ active, color = '#FFFFFF', size = 0.1 }) => {
  const { cakeState, dispatch } = useCakeContext();
  const { scene, camera, gl } = useThree();
  const [isDrawing, setIsDrawing] = useState(false);
  const [frosting, setFrosting] = useState([]); // Use state instead of ref for rendering
  const frostingRef = useRef([]); // Keep a ref for event handlers
  const lastPosition = useRef(null);
  const minDistance = size * 0.5; // Minimum distance between frosting balls
  const [debugPoint, setDebugPoint] = useState(null);
  
  // Create our own raycaster instead of using one from useThree
  const raycasterRef = useRef(new THREE.Raycaster());
  
  // Debug function to find all meshes in the scene
  const logAllMeshes = useCallback(() => {
    console.log("Searching for cake meshes...");
    let meshCount = 0;
    const meshNames = [];
    
    scene.traverse((object) => {
      if (object.isMesh) {
        meshCount++;
        meshNames.push(`${object.name} (parent: ${object.parent?.name || 'none'})`);
      }
    });
    
    console.log(`Found ${meshCount} total meshes:`);
    console.log(meshNames);
  }, [scene]);
  
  // Setup raycaster for detecting where to place frosting
  const checkIntersection = useCallback((event) => {
    if (!active || !cakeState.cakeModel) return null;
    
    // Update raycaster with current mouse position
    const rect = gl.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), camera);
    
    // Enhanced mesh detection with broader criteria
    const cakeMeshes = []; // Now declared before use
    
    // Use the same naming conventions as in DecorationCanvas.jsx
    scene.traverse((object) => {
      if (object.isMesh) {
        const name = object.name.toLowerCase();
        const parentName = object.parent?.name?.toLowerCase() || '';
        console.log(`Checking mesh: ${name} (parent: ${parentName})`);
        // Match naming conventions from DecorationCanvas
        if (name.includes('batter') || 
            name.includes('cream') || 
            name.toUpperCase() === 'BATTER' || 
            name.toUpperCase() === 'CREAM' ||
            parentName.includes('cake') ||
            parentName.includes('tier')) {
          cakeMeshes.push(object);
        }
      }
    });
    
    // If no meshes with specific names found, try any mesh in the model
    if (cakeMeshes.length === 0 && cakeState.cakeModel.modelRef) {
      cakeState.cakeModel.modelRef.traverse((object) => {
        if (object.isMesh) {
          cakeMeshes.push(object);
        }
      });
    }
    
    // Last resort: just use ALL meshes
    if (cakeMeshes.length === 0) {
      scene.traverse((object) => {
        if (object.isMesh) {
          cakeMeshes.push(object);
        }
      });
    }
    
    if (cakeMeshes.length === 0) {
      console.log("No cake meshes found for frosting");
      return null;
    }
    
    console.log(`Found ${cakeMeshes.length} potential cake meshes for frosting`);
    
    // Check for intersections with cake meshes
    const intersects = raycasterRef.current.intersectObjects(cakeMeshes, true);
    if (intersects.length > 0) {
      const intersection = intersects[0];
      const position = intersection.point.clone();
      
      // Set debug point to visualize where we're hitting
      setDebugPoint(position.clone());
      
      // Extract and transform normal to world space
      const normal = intersection.face.normal.clone();
      normal.transformDirection(intersection.object.matrixWorld);
      
      // Use angle to determine if we're hitting the top or sides
      const upVector = new THREE.Vector3(0, 1, 0);
      const angle = normal.angleTo(upVector);
      const isSide = angle > Math.PI / 4; // More than 45 degrees from up is considered a side
      
      return {
        position,
        normal,
        isSide
      };
    }
    
    return null;
  }, [active, cakeState.cakeModel, camera, gl, scene]);
  
  // Add a frosting ball at the given position
  const addFrostingBall = useCallback((position, normal) => {
    // Create a slightly random size for natural look
    const randomSize = size * (0.8 + Math.random() * 0.4);
    
    // Add some randomness to position for natural look
    const randomOffset = new THREE.Vector3(
      (Math.random() - 0.5) * size * 0.5,
      (Math.random() - 0.5) * size * 0.5,
      (Math.random() - 0.5) * size * 0.5
    );
    const finalPosition = position.clone().add(randomOffset);
    
    // Push toward normal direction slightly
    finalPosition.add(normal.clone().multiplyScalar(size * 0.3));
    
    // Create new frosting ball
    const newBall = {
      id: `frost-${Date.now()}-${Math.random()}`,
      position: finalPosition,
      size: randomSize,
      color
    };
    
    // Add to our frosting array (both ref and state)
    frostingRef.current = [...frostingRef.current, newBall];
    setFrosting(prev => [...prev, newBall]);
  }, [size, color]);
  
  // Start drawing
  const handlePointerDown = useCallback((event) => {
    if (!active) return;
    
    const intersection = checkIntersection(event);
    if (intersection) {
      setIsDrawing(true);
      lastPosition.current = intersection.position;
      
      // Add the first frosting ball
      addFrostingBall(intersection.position, intersection.normal);
    }
  }, [active, checkIntersection, addFrostingBall]);
  
  // Draw while moving the pointer
  const handlePointerMove = useCallback((event) => {
    if (!active || !isDrawing || !lastPosition.current) return;
    
    const intersection = checkIntersection(event);
    if (intersection) {
      // Only add new frosting if we've moved far enough from the last position
      const distance = lastPosition.current.distanceTo(intersection.position);
      if (distance > minDistance) {
        addFrostingBall(intersection.position, intersection.normal);
        lastPosition.current = intersection.position;
      }
    }
  }, [active, isDrawing, checkIntersection, minDistance, addFrostingBall]);
  
  // Stop drawing
  const handlePointerUp = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPosition.current = null;
      
      // Save the current frosting state to the cake context
      if (frostingRef.current.length > 0) {
        dispatch({
          type: 'ADD_FROSTING',
          payload: {
            type: 'frosting',
            balls: frostingRef.current.map(ball => ({
              position: [ball.position.x, ball.position.y, ball.position.z],
              size: ball.size,
              color: ball.color
            }))
          }
        });
        
        // Clear the current frosting after saving
        frostingRef.current = [];
        setFrosting([]);
      }
    }
  }, [isDrawing, dispatch]);
  
  // Debug mode: inspect meshes when activated
  useEffect(() => {
    if (active) {
      console.log("FrostingDrawer activated, debugging cake model:");
      console.log("Cake model available:", !!cakeState.cakeModel);
      console.log("modelRef available:", !!cakeState.cakeModel?.modelRef);
      
      // Mark meshes for easier detection
      if (cakeState.cakeModel && cakeState.cakeModel.modelRef) {
        cakeState.cakeModel.modelRef.name = "cake-model";
        console.log("Added name 'cake-model' to model for easier detection");
        
        cakeState.cakeModel.modelRef.traverse((object) => {
          if (object.isMesh) {
            if (!object.name.includes('cake-')) {
              object.name = `cake-${object.name || 'mesh'}`;
              console.log(`Renamed mesh to ${object.name}`);
            }
          }
        });
      }
      
      // Log all meshes
      logAllMeshes();
    }
  }, [active, cakeState.cakeModel, logAllMeshes]);
  
  // Set up event listeners
  useEffect(() => {
    if (active) {
      const canvas = gl.domElement;
      
      // Use capture phase to ensure we get events first
      const preventAndHandle = (handler) => (e) => {
        e.stopPropagation();
        handler(e);
      };
      
      const handlePointerDownWithPrevent = preventAndHandle(handlePointerDown);
      const handlePointerMoveWithPrevent = preventAndHandle(handlePointerMove);
      const handlePointerUpWithPrevent = preventAndHandle(handlePointerUp);
      
      console.log("Adding frosting event listeners to canvas");
      canvas.addEventListener('pointerdown', handlePointerDownWithPrevent, true);
      canvas.addEventListener('pointermove', handlePointerMoveWithPrevent, true);
      canvas.addEventListener('pointerup', handlePointerUpWithPrevent, true);
      canvas.addEventListener('pointerleave', handlePointerUpWithPrevent, true);
      
      return () => {
        console.log("Removing frosting event listeners from canvas");
        canvas.removeEventListener('pointerdown', handlePointerDownWithPrevent, true);
        canvas.removeEventListener('pointermove', handlePointerMoveWithPrevent, true);
        canvas.removeEventListener('pointerup', handlePointerUpWithPrevent, true);
        canvas.removeEventListener('pointerleave', handlePointerUpWithPrevent, true);
      };
    }
  }, [active, gl, handlePointerDown, handlePointerMove, handlePointerUp]);
  
  return (
    <group>
      {/* Debug sphere to show hit position */}
      {debugPoint && active && (
        <Sphere args={[0.05]} position={debugPoint}>
          <meshBasicMaterial color="red" />
        </Sphere>
      )}
      
      {/* Current frosting being drawn */}
      {frosting.map((ball) => (
        <Sphere 
          key={ball.id} 
          args={[ball.size, 8, 8]} 
          position={ball.position}
        >
          <meshStandardMaterial 
            color={ball.color} 
            roughness={0.3} 
            metalness={0.1} 
          />
        </Sphere>
      ))}
    </group>
  );
};

export default FrostingDrawer;