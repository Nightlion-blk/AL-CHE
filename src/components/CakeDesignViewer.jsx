import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const CakeDesignViewer = ({ design, height = '400px' }) => {
  const mountRef = useRef(null);
  
  useEffect(() => {
    if (!design || !design.cakeModel?.path) return;
    
    // THREE.js setup
    const currentMount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 2.5);
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.shadowMap.enabled = true;
    currentMount.appendChild(renderer.domElement);
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.75, 0);
    controls.update();
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
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
      
      // Apply color to cake if specified
      if (design.cakeModel.color?.primary) {
        cakeModel.traverse((child) => {
          if (child.isMesh && design.cakeModel.targetedMeshName?.includes(child.name)) {
            child.material = new THREE.MeshStandardMaterial({ 
              color: new THREE.Color(design.cakeModel.color.primary)
            });
          }
        });
      }
      
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