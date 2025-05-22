import React, { useRef, useMemo, useEffect } from 'react';
import { Text3D } from '@react-three/drei';
import { useCakeContext } from '../../context/CakeContext';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

const TextElement = React.forwardRef(({ 
  message, 
  position,
  color = "#000000", 
  fontStyle = "script", 
  scale,
  onClick
}, ref) => {
  const { cakeState, dispatch } = useCakeContext();
  const groupRef = useRef();
  const textRef = useRef();
  const boxRef = useRef();
  const { scene } = useThree();
  
  // Forward the groupRef to the parent component
  React.useImperativeHandle(ref, () => groupRef.current);

  // Get cake top position
  const finalPosition = useMemo(() => {
    const placementData = cakeState.cakePlacement || cakeState.cakeTopPosition;
    
    // If position is passed directly, use it (for TransformControls)
    if (position) return position;
    
    // Otherwise, use messagePosition from cakeState if available
    if (cakeState.messagePosition && Array.isArray(cakeState.messagePosition) && 
        cakeState.messagePosition.length === 3) {
      console.log("Using messagePosition from cakeState:", cakeState.messagePosition);
      return cakeState.messagePosition;
    }
    
    // Fallback to placement data
    if (placementData && placementData.topY !== undefined) {
      return [
        placementData.centerX || 0, 
        placementData.topY + 0.05,
        placementData.centerZ || 0
      ];
    }
    
    return [0, 2, 0]; // last resort fallback
  }, [cakeState.cakePlacement, cakeState.cakeTopPosition, cakeState.messagePosition, position]);

  // Get the proper rotation - use cakeState.messageRotation if available
  const finalRotation = useMemo(() => {
    // First priority: Use directly passed rotation (for TransformControls)
    if (cakeState.messageRotation && Array.isArray(cakeState.messageRotation) && 
        cakeState.messageRotation.length === 3) {
      return cakeState.messageRotation;
    }
    
    // Default horizontal rotation for text on top of cake
    return [-Math.PI/2, 0, 0];
  }, [cakeState.messageRotation]);

  // Font mapping
  const fontMap = {
    script: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
    block: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
    modern: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
    classic: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
  };
  
  const fontPath = fontMap[fontStyle] || fontMap.script;
  
  // Get the proper scale - use cakeState.messageScale or prop scale or default
  const finalScale = useMemo(() => {
    console.log("Calculating finalScale for text. cakeState.messageScale =", cakeState.messageScale);
    
    // First priority: Use cakeState.messageScale if available
    if (cakeState.messageScale) {
      if (Array.isArray(cakeState.messageScale)) {
        // Handle incomplete scale arrays from database (like [0.58])
        if (cakeState.messageScale.length === 1) {
          const value = cakeState.messageScale[0];
          console.log("Expanding single value messageScale to 3D vector:", value);
          return [value, value, value];
        } 
        else if (cakeState.messageScale.length === 3) {
          console.log("Using full messageScale array from cakeState:", cakeState.messageScale);
          return cakeState.messageScale;
        }
      } 
      else if (typeof cakeState.messageScale === 'number') {
        // Handle if it's just a number
        return [cakeState.messageScale, cakeState.messageScale, cakeState.messageScale];
      }
    }
    
    // Second priority: Use the scale prop if provided
    if (scale !== undefined) {
      // If scale is a number, convert to array
      if (typeof scale === 'number') {
        return [scale, scale, scale];
      }
      // If it's already an array, use it directly
      if (Array.isArray(scale)) {
        return scale;
      }
    }
    
    // Default fallback
    console.log("Using default scale [0.15, 0.15, 0.15] - no scale in cakeState or props");
    return [0.15, 0.15, 0.15];
  }, [cakeState.messageScale, scale]);
  
  // Handle clicks properly and prevent propagation
  const handleClick = (e) => {
    e.stopPropagation();         // Stop event propagation
    console.log("Text clicked directly");
    if (onClick) {
      onClick(e);                // Call the parent's onClick handler
    }
    
    // Prevent event from bubbling up to Canvas
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
      e.nativeEvent.preventDefault();
    }
  };
  
  // Update the invisible box size after the text loads
  useEffect(() => {
    if (textRef.current && boxRef.current) {
      // Get the actual size of the text
      const box = new THREE.Box3().setFromObject(textRef.current);
      const size = box.getSize(new THREE.Vector3());
      
      // Make the invisible box slightly larger than the text
      boxRef.current.scale.set(
        size.x * 1.1, 
        size.y * 1.1, 
        size.z * 1.5
      );
    }
  }, [message, fontStyle]);
  
  useEffect(() => {
    console.log("Text element mounted with scale:", finalScale);
    console.log("Text element position:", finalPosition);
    console.log("Text element rotation:", finalRotation);
    
    if (textRef.current) {
      // Mark this as text for selection
      textRef.current.traverse((object) => {
        if (object.isMesh) {
          object.userData.isText = true;
        }
      });
    }
  }, []);

  // Combined position and rotation tracking
  useEffect(() => {
    if (!groupRef.current) return;
    
    // Only track when we have transform controls active
    const controls = scene.children.find(child => child.isTransformControls);
    if (!controls) return;
    
    // Track both position and rotation changes
    const trackTransforms = () => {
      if (!groupRef.current) return;
      
      // Get and round rotation values
      const rotation = groupRef.current.rotation.toArray();
      const roundedRotation = rotation.map(val => parseFloat(val.toFixed(6)));
      
      // Get and round position values
      const position = groupRef.current.position.toArray();
      const roundedPosition = position.map(val => parseFloat(val.toFixed(6)));
      
      // Log changes for debugging
      console.log("Text rotation changed:", roundedRotation);
      console.log("Text position changed:", roundedPosition);
      
      // Update both in state
      dispatch({
        type: "SET_MESSAGE_ROTATION",
        payload: roundedRotation
      });
      
      dispatch({
        type: "SET_MESSAGE_POSITION",
        payload: roundedPosition
      });
    };
    
    // Add listeners to controls
    controls.addEventListener('objectChange', trackTransforms);
    controls.addEventListener('dragging-changed', event => {
      if (!event.value) {
        // When dragging ends, update transforms one final time
        setTimeout(trackTransforms, 10);
      }
    });
    
    return () => {
      if (controls) {
        controls.removeEventListener('objectChange', trackTransforms);
        controls.removeEventListener('dragging-changed', trackTransforms);
      }
    };
  }, [scene, dispatch]);
  
  // Help save capture rotation AND position when needed
  useEffect(() => {
    // Expose a global method for manual tracking (debugging)
    window.captureTextTransforms = () => {
      if (groupRef.current) {
        // Capture rotation
        const rotation = groupRef.current.rotation.toArray();
        const roundedRotation = rotation.map(val => parseFloat(val.toFixed(6)));
        
        // Capture position
        const position = groupRef.current.position.toArray();
        const roundedPosition = position.map(val => parseFloat(val.toFixed(6)));
        
        console.log("Manual capture - text rotation:", roundedRotation);
        console.log("Manual capture - text position:", roundedPosition);
        
        // Update both in state
        dispatch({
          type: "SET_MESSAGE_ROTATION", 
          payload: roundedRotation
        });
        
        dispatch({
          type: "SET_MESSAGE_POSITION", 
          payload: roundedPosition
        });
        
        return {
          rotation: roundedRotation,
          position: roundedPosition
        };
      }
      return "No text group found";
    };
    
    // For backward compatibility
    window.captureTextRotation = window.captureTextTransforms;
    
    return () => {
      delete window.captureTextTransforms;
      delete window.captureTextRotation;
    };
  }, []);

  // In your return statement, add onUpdate to the group
  return message ? (
    <group 
      ref={groupRef}
      position={finalPosition} 
      rotation={finalRotation}
      onClick={handleClick}
      scale={finalScale}
      userData={{ isTextGroup: true, type: 'message' }}
    >
      {/* Invisible box for selection */}
      <mesh ref={boxRef}>
        <boxGeometry args={[1, 1, 0.2]} />
        <meshBasicMaterial transparent opacity={0.0} />
      </mesh>
      
      {/* The actual text */}
      <Text3D
        ref={textRef}
        font={fontPath}
        size={0.5}
        height={0.1}
        curveSegments={12}
        bevelEnabled={false}
        center
      >
        {message}
        <meshStandardMaterial 
          color={color}
          metalness={0.1}
          roughness={0.2}
        />
      </Text3D>
    </group>
  ) : null;
});

export default TextElement;