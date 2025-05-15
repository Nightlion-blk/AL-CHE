import React, { useRef, useMemo } from 'react';
import { Text3D } from '@react-three/drei';
import { useCakeContext } from '../../context/CakeContext';
import * as THREE from 'three';

const TextElement = ({ 
  message, 
  position,
  color = "#000000", 
  fontStyle = "script", 
  scale = 0.15
}) => {
  const { cakeState } = useCakeContext();
  const textRef = useRef();
  
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

  // Hardcoded rotation for horizontal text on top of cake
  // [-Math.PI/2, 0, 0] rotates text to lie flat on XZ plane
  const horizontalRotation = [-Math.PI/2, 0, 0];

  const fontMap = {
    script: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
    block: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
    modern: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
    classic: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
  };
  
  const fontPath = fontMap[fontStyle] || fontMap.script;

  return message ? (
    <group position={finalPosition} rotation={horizontalRotation}>
      <Text3D
        ref={textRef}
        font={fontPath}
        size={0.5}
        height={0.1}
        curveSegments={12}
        bevelEnabled={false}
        scale={[scale, scale, scale]}
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
};

export default TextElement;