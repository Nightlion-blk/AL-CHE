import React from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function ModelRenderer({ path, position, color, targetedMeshName, textureMap }) {
  const { scene } = useGLTF(path);
  const textureLoader = new THREE.TextureLoader();
  
  // Create a clone of the scene to avoid object extensibility issues
  const clonedScene = scene.clone();
  
  clonedScene.position.set(...position);
  clonedScene.traverse((child) => {
    if (child.isMesh) {
      for (let i = 0; i < targetedMeshName.length; i++) {
        if (child.name === targetedMeshName[i]) {
          child.material.color.set(color.primary);
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
          }
        }
      }
    }
  });
  
  return <primitive object={clonedScene} dispose={null} />;
}

class BaseModel {
  constructor(path) {
    this.path = path;
    this.name = "";
    this.position = [0, 0, 0];
    this.color = { primary: "#FFFFFF" };
    this.targetedMeshName = ["default"];
    this.price = 0;
    this.textureMap = new Map();
    this.text = "";
  }
  
  setName(name) { this.name = name; return this; }
  setPosition(position) { this.position = position; return this; }
  setColor(color) { this.color = color; return this; }
  setTargetedMeshName(meshName) { 
    this.targetedMeshName = Array.isArray(meshName) ? meshName : [meshName]; 
    return this; 
  }
  setPath(path) { this.path = path; return this; }
  setPrice(price) { this.price = price; return this; }
  setTextures(textures) { this.textureMap = textures; return this; }
  setText(text) { this.text = text; return this; }
  
  // Use a function that returns a component instead of a scene directly
  getModel() {
    if (!this.path) return null;
    
    // This creates a fresh component instance each time
    const ModelComponent = () => (
      <ModelRenderer
        path={this.path}
        position={this.position}
        color={this.color}
        targetedMeshName={this.targetedMeshName}
        textureMap={this.textureMap}
      />
    );
    
    return <ModelComponent />;
  }
}

export default BaseModel;