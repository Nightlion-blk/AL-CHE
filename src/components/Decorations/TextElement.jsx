import React, { useRef, useMemo } from 'react';
import { Text3D } from '@react-three/drei';
import { useCakeContext } from '../../context/CakeContext';
import * as THREE from 'three';

const TextElement = ({ 
  message, 
  position,
  color = "#000000", 
  fontStyle = "script", 
  scale = 0.15,
  rotation = [0, 0, 0]
}) => {
  const { cakeState } = useCakeContext();
  const textRef = useRef();
  
  // Calculate final position - prioritize cake top position
  const finalPosition = useMemo(() => {
    // Get cake placement data from context
    const placementData = cakeState.cakePlacement || cakeState.cakeTopPosition;
    
    // If explicit position is provided and we have no cake data, use provided position
    if (position && !placementData) return position;
    
    // If we have cake data, use that to position on the cake top
    if (placementData && placementData.topY !== undefined) {
      return [
        placementData.centerX || 0, 
        placementData.topY + 0.05,  // Add small offset to prevent z-fighting
        placementData.centerZ || 0
      ];
    }
    
    // Fallback position if no cake data is available
    return position || [0, 2, 0];
  }, [cakeState.cakePlacement, cakeState.cakeTopPosition, position]);

  const fontMap = {
    script: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
    block: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
    modern: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
    classic: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
  };
  
  const fontPath = fontMap[fontStyle] || fontMap.script;

  return message ? (
    <group position={finalPosition} rotation={rotation}>
      <Text3D
        ref={textRef}
        font={fontPath}
        size={0.5}
        height={0.1}
        curveSegments={12}
        bevelEnabled={false}
        scale={[scale, scale, scale]}
        center // Center the text horizontally
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
};

export default TextElement;