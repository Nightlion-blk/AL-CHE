import React, { useRef, useMemo, useEffect } from 'react';
import { Text3D } from '@react-three/drei';
import { useCakeContext } from '../../context/CakeContext';
import * as THREE from 'three';

const TextElement = React.forwardRef(({ 
  message, 
  position,
  color = "#000000", 
  fontStyle = "script", 
  scale = 0.15, // Default in case it's not provided
  onClick
}, ref) => {
  const { cakeState } = useCakeContext();
  const groupRef = useRef();
  const textRef = useRef();
  const boxRef = useRef();
  
  // Forward the groupRef to the parent component
  React.useImperativeHandle(ref, () => groupRef.current);

  // Get cake top position
  const finalPosition = useMemo(() => {
    const placementData = cakeState.cakePlacement || cakeState.cakeTopPosition;
    
    if (position) return position;
    
    if (placementData && placementData.topY !== undefined) {
      return [
        placementData.centerX || 0, 
        placementData.topY + 0.05,
        placementData.centerZ || 0
      ];
    }
    
    return [0, 2, 0]; // fallback
  }, [cakeState.cakePlacement, cakeState.cakeTopPosition, position]);

  // Horizontal rotation for text on top of cake
  const horizontalRotation = [-Math.PI/2, 0, 0];

  // Font mapping
  const fontMap = {
    script: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
    block: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
    modern: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
    classic: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
  };
  
  const fontPath = fontMap[fontStyle] || fontMap.script;
  
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
      
      console.log("Text size updated:", size);
    }
  }, [message, fontStyle, scale]);
  
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

  return message ? (
    <group 
      ref={groupRef}
      position={finalPosition} 
      rotation={horizontalRotation}
      onClick={handleClick}
    >
      {/* Invisible box for selection */}
      <mesh>
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
        scale={[scale, scale, scale]} // Use the scale prop here
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