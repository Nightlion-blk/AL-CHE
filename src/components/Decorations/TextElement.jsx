import React, { useMemo, useRef, useEffect } from 'react';
import { Text3D } from '@react-three/drei';
import { useCakeContext } from "../../context/CakeContext";
import * as THREE from 'three';

const TextElement = ({ 
    message, 
    position,
    color = "#000000", 
    fontStyle = "script", 
    scale = 0.15,
    rotation = [0,0,0] }) => {

    const { cakeState } = useCakeContext();
    const textRef = useRef();

    // Calculate final position based on cake top
    const finalPosition = useMemo(() => {
      if (cakeState.cakeTopPosition) {
        // If position is provided, use it, otherwise place on top of cake
        if (position) return position;
        
        // Get cake top data
        const { topY, centerX, centerZ } = cakeState.cakeTopPosition;
        
        // Add a small offset to prevent Z-fighting (0.05 units above cake)
        return [centerX, topY + 0.05, centerZ];
      }
      
      // Default position if cake data isn't available
      return [0, 2, 0];
    }, [cakeState.cakeTopPosition, position]);

    const fontMap = {
        script: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
        block: "/fonts/Block_Regular.json",
        modern: "/fonts/Modern_Regular.json",
        classic: "/fonts/Classic_Regular.json",
    };
    
    const fontPath = fontMap[fontStyle] || fontMap.script;

    // Center the text on the cake
    useEffect(() => {
      if (textRef.current && message) {
        // Calculate text bounding box to center it
        const textBoundingBox = new THREE.Box3().setFromObject(textRef.current);
        const textWidth = textBoundingBox.max.x - textBoundingBox.min.x;
        
        // Adjust position to center text
        textRef.current.position.x -= textWidth / 2;
      }
    }, [message]);

    return message ? (
    <group position={finalPosition} rotation={rotation} scale={[scale, scale, scale]}>
        <Text3D
            ref={textRef}
            font={fontPath}
            size={0.5}
            height={0.1}
            curveSegments={12}
            bevelEnabled={false}
        >
            {message}
            <meshStandardMaterial 
            color={color}
            metalness={0.1}
            roughness={0.2} />
        </Text3D>
    </group>
    ) : null;
};

export default TextElement;