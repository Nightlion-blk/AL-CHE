import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Text3D } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Element renderer component - renders a single decorative element
const ElementRenderer = ({ element }) => {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!element || !element.path) return;
    
    const modelLoader = new GLTFLoader();
    
    // Fix path if needed
    const fixPath = (path) => {
      if (!path) return null;
      if (path.startsWith('http') || path.startsWith('blob')) return path;
      return path.startsWith('/') ? path : `/${path}`;
    };
    
    const modelPath = fixPath(element.path);
    
    setLoading(true);
    modelLoader.load(
      modelPath,
      (gltf) => {
        // Create a proper deep clone to avoid shared materials
        const clonedScene = gltf.scene.clone(true);
        
        // Clone all materials to prevent shared material issues
        clonedScene.traverse((child) => {
          if (child.isMesh && child.material) {
            // Clone the material
            child.material = child.material.clone();
            
            // Apply color if available
            if (element.color) {
              let colorValue;
              if (typeof element.color === 'string') {
                colorValue = element.color;
              } else if (element.color.primary) {
                colorValue = element.color.primary;
              } else if (element.color.r !== undefined) {
                colorValue = new THREE.Color(
                  element.color.r, element.color.g, element.color.b
                );
              }
              
              if (colorValue) {
                const targetNames = Array.isArray(element.targetedMeshName) 
                  ? element.targetedMeshName 
                  : [element.targetedMeshName];
                
                if (targetNames.includes(child.name) || targetNames.includes("default") || !targetNames.length) {
                  child.material.color = new THREE.Color(colorValue);
                  child.material.transparent = false;
                  child.material.opacity = 1.0;
                  child.castShadow = true;
                  child.receiveShadow = true;
                }
              }
            }
          }
        });
        
        setModel(clonedScene);
        setLoading(false);
      },
      undefined,
      (error) => {
        console.error(`Error loading element model: ${modelPath}`, error);
        setError(error);
        setLoading(false);
      }
    );
  }, [element]);
  
  if (loading || error || !model) return null;
  
  return (
    <primitive 
      object={model} 
      position={element.position || [0, 0, 0]} 
      scale={element.scale || [1, 1, 1]}
      rotation={element.rotation || [0, 0, 0]}
    />
  );
};

// Cake model renderer component
const CakeRenderer = ({ cakeModel, flavour }) => {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!cakeModel || !cakeModel.path) return;
    
    const fixPath = (path) => {
      if (!path) return null;
      if (path.startsWith('http') || path.startsWith('blob')) return path;
      return path.startsWith('/') ? path : `/${path}`;
    };
    
    const modelLoader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();
    const cakePath = fixPath(cakeModel.path);
    
    setLoading(true);
    modelLoader.load(
      cakePath,
      (gltf) => {
        const cakeScene = gltf.scene;
        
        // Apply materials and colors
        cakeScene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // BATTER MESH HANDLING
            if (child.name.toUpperCase() === 'BATTER' || 
                child.name.toLowerCase().includes('batter') || 
                (cakeModel.batterMeshes && cakeModel.batterMeshes.includes(child.name))) {
              
              child.material = new THREE.MeshStandardMaterial({
                color: flavour?.primary || cakeModel.color?.batter || cakeModel.color?.primary || 0xF9F5E7,
                roughness: 0.7,
                metalness: 0.1,
                transparent: false,
                opacity: 1.0
              });
              
              // Apply batter textures
              if (cakeModel.textureMap && cakeModel.textureMap.batter) {
                textureLoader.load(fixPath(cakeModel.textureMap.batter), (texture) => {
                  texture.repeat.set(3, 3);
                  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                  child.material.map = texture;
                  child.material.needsUpdate = true;
                });
              }
            }
            // CREAM MESH HANDLING
            else if (child.name.toUpperCase() === 'CREAM' || 
                    child.name.toLowerCase().includes('cream') || 
                    (cakeModel.creamMeshes && cakeModel.creamMeshes.includes(child.name))) {
              
              child.material = new THREE.MeshStandardMaterial({
                color: flavour?.secondary || cakeModel.color?.cream || 0xE8D7B4,
                roughness: 0.6,
                metalness: 0.1,
                transparent: false,
                opacity: 1.0
              });
              
              // Apply cream textures
              if (cakeModel.textureMap && cakeModel.textureMap.cream) {
                textureLoader.load(fixPath(cakeModel.textureMap.cream), (texture) => {
                  texture.repeat.set(3, 3);
                  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                  child.material.map = texture;
                  child.material.needsUpdate = true;
                });
              }
            }
            // OTHER MESHES
            else {
              const targetNames = Array.isArray(cakeModel.targetedMeshName) 
                ? cakeModel.targetedMeshName 
                : [cakeModel.targetedMeshName];
                
              if (targetNames.includes(child.name) || targetNames.includes("default") || !targetNames.length) {
                child.material = new THREE.MeshStandardMaterial({
                  color: cakeModel.color?.primary || 0xFFFFFF,
                  roughness: 0.5,
                  metalness: 0.2,
                  transparent: false,
                  opacity: 1.0
                });
                
                // Apply specific mesh textures
                if (cakeModel.textureMap && cakeModel.textureMap[child.name]) {
                  textureLoader.load(fixPath(cakeModel.textureMap[child.name]), (texture) => {
                    texture.repeat.set(3, 3);
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    child.material.map = texture;
                    child.material.needsUpdate = true;
                  });
                }
              }
            }
          }
        });
        
        setModel(cakeScene);
        setLoading(false);
      },
      undefined,
      (error) => {
        console.error(`Error loading cake model: ${cakePath}`, error);
        setError(error);
        setLoading(false);
      }
    );
  }, [cakeModel, flavour]);

  if (loading || error || !model) return null;
  
  return (
    <primitive 
      object={model} 
      position={cakeModel.position || [0, 0, 0]}
      rotation={cakeModel.rotation || [0, 0, 0]}
      scale={cakeModel.scale || [1, 1, 1]}
    />
  );
};

// Frosting sphere component
const FrostingBall = ({ ball }) => {
  return (
    <mesh
      position={[ball.position[0], ball.position[1], ball.position[2]]}
      castShadow
    >
      <sphereGeometry args={[ball.size || 0.05, 8, 8]} />
      <meshStandardMaterial
        color={ball.color || '#ffffff'}
        roughness={0.3}
        metalness={0.1}
      />
    </mesh>
  );
};

// Text component using Text3D from drei (matches your TextElement.jsx)
const CakeText = ({ message, position, color, font, scale, rotation }) => {
  if (!message) return null;
  
  // Use the same font map as your TextElement.jsx
  const fontMap = {
    script: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
    block: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
    modern: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
    classic: "/fonts/Dancing_Script,Open_Sans,Pacifico,Roboto/Times-New-Roman/Times New Roman/Times New Roman Cyr_Regular.json",
  };
  
  const fontPath = fontMap[font] || fontMap.script;
  
  // Format scale properly
  let finalScale = [0.15, 0.15, 0.15]; // Default scale
  if (scale) {
    if (Array.isArray(scale)) {
      if (scale.length === 1) {
        // Expand single value to 3D vector
        const value = scale[0];
        finalScale = [value, value, value];
      } else if (scale.length === 3) {
        finalScale = scale;
      }
    } else if (typeof scale === 'number') {
      // Handle if it's just a number
      finalScale = [scale, scale, scale];
    }
  }
  
  // Convert rotation if needed
  const finalRotation = rotation || [-Math.PI/2, 0, 0]; // Default rotation for horizontal text on cake top
  
  return (
    <group
      position={position || [0, 1.5, 0]}
      rotation={finalRotation}
      scale={finalScale}
    >
      <Text3D
        font={fontPath}
        size={0.5}
        height={0.1}
        curveSegments={12}
        bevelEnabled={false}
        center
      >
        {message}
        <meshStandardMaterial 
          color={color || "#000000"}
          metalness={0.1}
          roughness={0.2}
        />
      </Text3D>
    </group>
  );
};

// Main CakeDesignViewer component
const CakeDesignViewer = ({ design, height = '400px' }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!design) {
      setError("No design data provided");
      return;
    }
    
    if (!design.cakeModel?.path) {
      setError("Design missing cake model path");
      return;
    }
    
    setIsLoading(false);
  }, [design]);
  
  if (!design) {
    return (
      <div style={{ height, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div>No design data provided</div>
      </div>
    );
  }
  
  return (
    <div style={{ position: 'relative', width: '100%', height }}>
      <Canvas
        shadows
        camera={{ position: [0, 2, 5], fov: 50 }}
        style={{ borderRadius: '0.5rem' }}
      >
        {/* Studio-quality lighting */}
        <color attach="background" args={[0xf5f5f5]} />
        <Environment preset="sunset" />
        <ambientLight intensity={0.8} color={0xffffee} />
        <directionalLight 
          position={[5, 10, 5]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize-width={2048} 
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-bias={-0.0005}
        />
        <directionalLight position={[-5, 3, -5]} intensity={0.7} color={0xffffee} />
        <directionalLight position={[5, 2, -3]} intensity={0.5} color={0xaaccff} />
        <pointLight position={[0, -3, 0]} intensity={0.5} color={0xffffee} />
        
        {/* Ground plane for shadows */}
        <mesh 
          rotation={[-Math.PI / 2, 0, 0]} 
          position={[0, -0.1, 0]} 
          receiveShadow
        >
          <circleGeometry args={[6, 32]} />
          <meshStandardMaterial 
            color={0xeeeeee}
            roughness={0.8}
            metalness={0.2}
            transparent={true}
            opacity={0.6}
          />
        </mesh>
        
        {/* Controls */}
        <OrbitControls 
          minPolarAngle={Math.PI / 6} 
          maxPolarAngle={Math.PI - Math.PI / 6} 
          enableDamping
          dampingFactor={0.1}
          rotateSpeed={0.7}
          target={[0, 0.75, 0]}
        />
        
        {/* Cake model */}
        <CakeRenderer cakeModel={design.cakeModel} flavour={design.flavour} />
        
        {/* Decorative elements */}
        {design.elements?.map((element, index) => (
          <ElementRenderer key={`element-${index}`} element={element} />
        ))}
        
        {/* Frosting */}
        {design.frosting?.map((frostingGroup, groupIndex) => (
          <group key={`frosting-group-${groupIndex}`}>
            {frostingGroup.balls?.map((ball, ballIndex) => (
              <FrostingBall 
                key={`frosting-ball-${groupIndex}-${ballIndex}`}
                ball={ball} 
              />
            ))}
          </group>
        ))}
        
        {/* 3D Text */}
        {design.message && (
          <CakeText
            message={design.message}
            position={design.messagePosition || [0, 1.5, 0]}
            color={design.messageColor || "#000000"}
            font={design.messageFont || "script"}
            scale={design.messageScale}
            rotation={design.messageRotation}
          />
        )}
      </Canvas>
      
      {/* Loading indicator */}
      {isLoading && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '30px',
            height: '30px',
            border: '4px solid rgba(244, 114, 182, 0.3)',
            borderTop: '4px solid #f472b6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{
            color: '#f472b6',
            fontWeight: 'bold'
          }}>
            Loading cake design...
          </div>
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          color: '#f43f5e',
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '15px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          maxWidth: '80%',
          textAlign: 'center'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Error Loading Design</div>
          <div>{error}</div>
        </div>
      )}
    </div>
  );
};

export default CakeDesignViewer;