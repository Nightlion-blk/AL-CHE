import React from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function ModelRenderer({ path, position, color, targetedMeshName, textureMap }) {
  const { scene } = useGLTF(path);
  const textureLoader = new THREE.TextureLoader();
  scene.position.set(...position);
  scene.traverse((child) => {
    if (child.isMesh) {
      for (let i = 0; i < targetedMeshName.length; i++) {
        if (child.name === targetedMeshName[i]) {
          child.material.color.set(color.primary); // Apply primary color
          const texture = textureMap.get(child.name);
          if (texture) {
            const loadedTexture = textureLoader.load(texture);
            loadedTexture.repeat.set(3, 3);
            loadedTexture.wrapS = loadedTexture.wrapT = THREE.RepeatWrapping;
            child.material.map = loadedTexture;
          
            if (child.material.normalMap) {
              child.material.normalMap.repeat.set(3, 3);
              child.material.normalMap.wrapS = child.material.normalMap.wrapT = THREE.RepeatWrapping;
            }
            if (child.material.roughnessMap) {
              child.material.roughnessMap.repeat.set(3, 3);
              child.material.roughnessMap.wrapS = child.material.roughnessMap.wrapT = THREE.RepeatWrapping;
            }
            child.material.needsUpdate = true; // Ensure the material updates
          }
        }
      }
    }
  });
  return <primitive object={scene} dispose={null} />;
}
class BaseModel {
  constructor(path) {
    this.path = path;
    this.position = [0, 0, 0]; // Default position
    this.color = { primary: '#ffffff', flavorName: null }; // Default color
    this.name = 'Layer1'; // Default name
    this.targetedMeshName = [];
    this.textureMap = new Map(); // Initialize textureMap as a Map
  }

  setName(name) {
    this.name = name;
  }

  setPosition(position) {
    this.position = position;
  }

  setColor(color) {
    if (color && typeof color === 'object') {
      if (color.colors) {
        // It's a flavor object
        // Store both the color and a reference to the flavor name
        this.color = { 
          primary: color.colors.primary,
          flavorName: color.name  // Keep the flavor name
        };
      } else {
        // It's a direct color object
        this.color = { 
          primary: color.primary,
          flavorName: color.flavorName || null
        };
      }
    } else {
      // It's a simple string color
      this.color = { 
        primary: color || '#ffffff',
        flavorName: null
      };
    }
  }

  setTargetedMeshName(targetedMeshName) {
    this.targetedMeshName = targetedMeshName;
  }

  setPath(path) {
    this.path = path;
  }

  setPrice(price) {
    this.price = price; // Set the price property
  }

  setText(text) {
    this.text = text; // Set the text property
  }
  // Set Texture
  setTexture(meshName, texture) {
    console.log(`Setting texture for ${meshName}:`, texture); // Log the texture being set
    this.textureMap.set(meshName, texture); // Store the texture in the Map
  }
  // Get Texture
  getTexture(meshName) {
    return this.textureMap.get(meshName); // Retrieve the texture from the Map
  }

  getModel() {
    // Return the Model component with the current properties
    return (
      <ModelRenderer
        path={this.path}
        position={this.position}
        color={this.color}
        targetedMeshName={this.targetedMeshName}
        textureMap={this.textureMap} // Pass the textureMap
      />
    );
  }
  
  getProperties() {
    return {
      name: this.name,
      path: this.path,
      color: this.color, // Explicitly include color
      position: this.position,
      targetedMeshName: this.targetedMeshName,
      textureMap: this.textureMap, // Include textureMap
      model: this.getModel(), // Return the model component
      price: this.price, // Include price

    };
  }
}
export default BaseModel;