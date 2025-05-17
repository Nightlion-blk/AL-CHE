import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

// Main component that wraps the 3D canvas
const CakeDesignViewer = ({ design, width = '100%', height = '100%' }) => {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  if (!design) return null;

  const handleError = (error) => {
    console.error('Error in cake viewer:', error);
    setErrorMessage(error.message || 'Failed to load 3D model');
    setHasError(true);
  };

  // If there's an error, show error state instead of 3D canvas
  if (hasError) {
    return (
      <div 
        style={{ width, height }} 
        className="bg-pink-50 rounded-lg flex flex-col items-center justify-center p-4"
      >
        <svg className="w-16 h-16 text-pink-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-pink-700 text-center font-medium">Failed to load 3D model</p>
        <p className="text-pink-600 text-sm mt-2 text-center">{errorMessage}</p>
        <p className="text-pink-600 text-xs mt-4 text-center">
          Path: {design.cakeModel?.path || 'Not specified'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ width, height, background: '#f9f9f9', borderRadius: '0.5rem', overflow: 'hidden' }}>
      <Canvas shadows>
        <Suspense fallback={<LoadingPlaceholder />}>
          <PerspectiveCamera makeDefault position={[0, 5, 10]} fov={50} />
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[5, 10, 5]} 
            castShadow 
            shadow-mapSize-width={1024} 
            shadow-mapSize-height={1024}
          />
          <CakeScene design={design} onError={handleError} />
          <Environment preset="sunset" />
          <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
        </Suspense>
      </Canvas>
    </div>
  );
};

// Loading placeholder while models are loading
const LoadingPlaceholder = () => {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#f0f0f0" />
    </mesh>
  );
};

// Main scene with cake and decorations
const CakeScene = ({ design, onError }) => {
  const { cakeModel, elements = [], message, messagePosition, messageRotation, messageColor, messageFont } = design;
  
  // Parse colors
  const getCakeColor = (colorObj) => {
    if (!colorObj) return new THREE.Color('#ffffff');
    if (typeof colorObj === 'string') return new THREE.Color(colorObj);
    if (colorObj.primary) return new THREE.Color(colorObj.primary);
    return new THREE.Color('#ffffff');
  };

  return (
    <group position={[0, 0, 0]}>
      {/* Cake base model */}
      {cakeModel?.path && (
        <SafeModel 
          path={cakeModel.path} 
          position={cakeModel.position || [0, 0, 0]}
          color={getCakeColor(cakeModel.color)}
          targetedMeshName={cakeModel.targetedMeshName}
          onError={onError}
        />
      )}
      
      {/* Decorative elements */}
      {elements.map((element, index) => (
        <SafeModel 
          key={element.uniqueId || index}
          path={element.path}
          position={element.position || [0, 0, 0]}
          rotation={element.rotation || [0, 0, 0]}
          scale={element.scale || [1, 1, 1]}
          color={getCakeColor(element.color)}
          targetedMeshName={element.targetedMeshName}
          onError={onError}
        />
      ))}
      
      {/* Message text */}
      {message && (
        <SimpleText 
          text={message}
          position={messagePosition || [0, 3, 0]}
          rotation={messageRotation || [0, 0, 0]}
          color={messageColor || '#000000'}
        />
      )}
      
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <shadowMaterial opacity={0.2} />
      </mesh>
    </group>
  );
};

// Safe model loader with error handling
const SafeModel = ({ path, position, rotation, scale, color, targetedMeshName, onError }) => {
  const [model, setModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const groupRef = useRef();

  useEffect(() => {
    if (!path) {
      setIsLoading(false);
      setHasError(true);
      onError && onError(new Error("No model path provided"));
      return;
    }

    // Generate an array of possible paths to try
    const pathsToTry = [];
    
    // Try the original path first
    pathsToTry.push(path);
    
    // Check for common path variations (SEE vs SE)
    if (path.includes('tresD-SE')) {
      pathsToTry.push(path.replace('tresD-SE', 'tresD-SEE'));
    } else if (path.includes('tresD-SEE')) {
      pathsToTry.push(path.replace('tresD-SEE', 'tresD-SE'));
    }
    
    // Try with and without leading slash
    if (path.startsWith('/')) {
      pathsToTry.push(path.substring(1));
    } else if (!path.startsWith('http')) {
      pathsToTry.push('/' + path);
    }
    
    // Try with models prefix
    if (!path.startsWith('/models') && !path.startsWith('models') && !path.startsWith('http')) {
      pathsToTry.push('/models/' + path);
    }

    // Log paths we're going to try (helps with debugging)
    console.log('Attempting to load model with these paths:', pathsToTry);
    
    // Recursive function to try loading from different paths
    const tryLoadingModel = (pathIndex) => {
      if (pathIndex >= pathsToTry.length) {
        console.error('All paths failed, could not load model');
        setHasError(true);
        setIsLoading(false);
        onError && onError(new Error(`Failed to load model after trying ${pathsToTry.length} different paths`));
        return;
      }
      
      const currentPath = pathsToTry[pathIndex];
      console.log(`Trying path ${pathIndex + 1}/${pathsToTry.length}: ${currentPath}`);
      
      const loader = new GLTFLoader();
      loader.load(
        currentPath,
        (gltf) => {
          try {
            console.log(`Successfully loaded model from: ${currentPath}`);
            const modelScene = gltf.scene.clone();
            
            modelScene.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Apply color to targeted mesh if specified
                if (targetedMeshName && child.name === targetedMeshName) {
                  child.material = new THREE.MeshStandardMaterial({ 
                    color: color,
                    roughness: 0.5,
                    metalness: 0.2,
                  });
                }
              }
            });
            
            setModel(modelScene);
            setIsLoading(false);
          } catch (err) {
            console.error(`Error processing model from ${currentPath}:`, err);
            // Try the next path
            tryLoadingModel(pathIndex + 1);
          }
        },
        // Progress callback
        undefined,
        // Error callback
        (error) => {
          console.error(`Failed to load model from ${currentPath}:`, error);
          // Try the next path
          tryLoadingModel(pathIndex + 1);
        }
      );
    };
    
    // Start trying paths
    tryLoadingModel(0);
    
    // Cleanup
    return () => {
      if (model) {
        model.traverse((child) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }
    };
  }, [path, color, targetedMeshName, onError]);

  useEffect(() => {
    if (!groupRef.current || !model) return;
    
    // Clear any existing children
    while (groupRef.current.children.length > 0) {
      groupRef.current.remove(groupRef.current.children[0]);
    }
    
    // Add the new model
    groupRef.current.add(model);
  }, [model]);

  // Show error placeholder if loading failed
  if (hasError) {
    return (
      <mesh position={position || [0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ff6b6b" />
      </mesh>
    );
  }

  // Show loading placeholder while loading
  if (isLoading) {
    return (
      <mesh position={position || [0, 0, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#f0f0f0" wireframe />
      </mesh>
    );
  }

  // Return the container group that will hold the model
  return (
    <group 
      ref={groupRef}
      position={position || [0, 0, 0]} 
      rotation={rotation ? [rotation[0], rotation[1], rotation[2]] : [0, 0, 0]} 
      scale={scale || [1, 1, 1]} 
    />
  );
};

// Simple text implementation using a plane with texture
const SimpleText = ({ text, position, rotation, color }) => {
  const textRef = useRef();

  useEffect(() => {
    if (!textRef.current) return;
    
    // Create canvas for text rendering
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    
    // Set background transparent
    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text
    context.font = '40px Arial';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Create texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create material with the text texture
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    // Apply to the mesh
    if (textRef.current.material) {
      textRef.current.material.dispose();
    }
    textRef.current.material = material;
    
    return () => {
      texture.dispose();
      material.dispose();
      canvas.remove();
    };
  }, [text, color]);

  return (
    <mesh
      ref={textRef}
      position={position}
      rotation={rotation}
    >
      <planeGeometry args={[4, 1]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
    </mesh>
  );
};

export default CakeDesignViewer;