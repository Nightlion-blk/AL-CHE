import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

const CakeDesignViewer = ({ design, height = '400px' }) => {
  const mountRef = useRef(null);
  
  useEffect(() => {
    if (!design || !design.cakeModel?.path) return;
    
    // THREE.js setup
    const currentMount = mountRef.current;
    const scene = new THREE.Scene();
    
    // Instead of simple background color, create a sunset environment
    const createSunsetEnvironment = () => {
      // Create sunset gradient background
      const topColor = new THREE.Color(0xff9e63);  // Warm orange
      const bottomColor = new THREE.Color(0xbc1a6e); // Deep purple-pink
      
      const canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      
      const context = canvas.getContext('2d');
      const gradient = context.createLinearGradient(0, 0, 0, 2);
      gradient.addColorStop(0, topColor.getStyle());
      gradient.addColorStop(1, bottomColor.getStyle());
      
      context.fillStyle = gradient;
      context.fillRect(0, 0, 2, 2);
      
      const texture = new THREE.CanvasTexture(canvas);
      scene.background = texture;
      
      // Add sunset lighting
      const sunLight = new THREE.DirectionalLight(0xffe0bd, 1.5);
      sunLight.position.set(-5, 3, -5);
      sunLight.castShadow = true;
      scene.add(sunLight);
      
      // Add warm ambient light
      const ambientLight = new THREE.AmbientLight(0xffccaa, 0.4);
      scene.add(ambientLight);
      
      // Add subtle rim light (blue-ish from opposite side)
      const rimLight = new THREE.DirectionalLight(0xaaccff, 0.5);
      rimLight.position.set(5, 2, 5);
      scene.add(rimLight);
      
      // Add ground reflection
      const groundReflection = new THREE.HemisphereLight(
        0xffe0bd, // sky color (warm)
        0xff9e63,  // ground color (orange)
        0.4
      );
      scene.add(groundReflection);
      
      // Optional: Add some fog for atmosphere
      scene.fog = new THREE.FogExp2(0xff9e63, 0.05);
    };
    
    createSunsetEnvironment();
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 2.5);
    
    // Renderer with improved settings for sunset
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    currentMount.appendChild(renderer.domElement);
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.75, 0);
    controls.update();
    
    // Load cake base model
    const loader = new GLTFLoader();
    
    // Use relative path instead of absolute URL
    const cakePath = design.cakeModel.path.startsWith('/') 
      ? design.cakeModel.path.substring(1) // Remove leading slash if present 
      : design.cakeModel.path;
    
    console.log('Loading cake model from:', cakePath);
    
    // Load the cake model
    loader.load(cakePath, (gltf) => {
      const cakeModel = gltf.scene;
      
      // Apply material adjustments for sunset environment
      cakeModel.traverse((child) => {
        if (child.isMesh) {
          // If color is specified use it, otherwise enhance existing materials
          if (design.cakeModel.color?.primary && design.cakeModel.targetedMeshName?.includes(child.name)) {
            child.material = new THREE.MeshStandardMaterial({ 
              color: new THREE.Color(design.cakeModel.color.primary),
              roughness: 0.7,
              metalness: 0.1
            });
          } else if (child.material) {
            // Enhance existing materials
            child.material.roughness = 0.7;
            child.material.metalness = 0.1;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        }
      });
      
      // Set cake position
      if (design.cakeModel.position && design.cakeModel.position.length === 3) {
        cakeModel.position.set(
          design.cakeModel.position[0],
          design.cakeModel.position[1],
          design.cakeModel.position[2]
        );
      }
      
      scene.add(cakeModel);
      
      // Load decorative elements
      if (design.elements && design.elements.length > 0) {
        design.elements.forEach(element => {
          if (!element.path) return;
          
          // Update element path construction
          const elementPath = element.path.startsWith('/') 
            ? element.path.substring(1) // Remove leading slash if present
            : element.path;
          
          console.log('Loading element from:', elementPath);
          
          loader.load(elementPath, (gltf) => {
            const elementModel = gltf.scene;
            
            // Apply color
            if (element.color?.primary) {
              elementModel.traverse((child) => {
                if (child.isMesh && (!element.targetedMeshName?.length || 
                    element.targetedMeshName.includes(child.name))) {
                  child.material = new THREE.MeshStandardMaterial({ 
                    color: new THREE.Color(element.color.primary)
                  });
                }
              });
            }
            
            // Apply position
            if (element.position && element.position.length === 3) {
              elementModel.position.set(
                element.position[0], 
                element.position[1], 
                element.position[2]
              );
            }
            
            // Apply scale
            if (element.scale && element.scale.length === 3) {
              elementModel.scale.set(
                element.scale[0],
                element.scale[1],
                element.scale[2]
              );
            }
            
            // Apply rotation
            if (element.rotation && element.rotation.length === 3) {
              elementModel.rotation.set(
                THREE.MathUtils.degToRad(element.rotation[0]),
                THREE.MathUtils.degToRad(element.rotation[1]),
                THREE.MathUtils.degToRad(element.rotation[2])
              );
            }
            
            scene.add(elementModel);
          });
        });
      }
      
      // Handle cake message if present
      if (design.message) {
        // Message implementation would go here
        // This could use a TextGeometry or HTML overlay
      }
    });
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    
    // Handle resize
    const handleResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      currentMount.removeChild(renderer.domElement);
      scene.clear();
      renderer.dispose();
    };
  }, [design]);
  
  return <div ref={mountRef} style={{ width: '100%', height, borderRadius: '0.5rem' }} />;
};

export default CakeDesignViewer;