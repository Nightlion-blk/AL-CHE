import React from 'react';

class ElementModel {
  constructor(path) {
    this.path = path;
    this.name = "";
    this.position = [0, 0, 0];
    this.color = { primary: '#ffffff' };
    this.targetedMeshName = ["default"];
    this.price = 0;
    this.scale = [1, 1, 1];
    this.textureMap = new Map();
    this.uniqueId = Date.now() + Math.random().toString(36).substring(2); // Add unique ID
  }

  // Just keep setter methods
  setName(name) { this.name = name; return this; }
  setPosition(position) { this.position = position; return this; }
  setColor(color) { 
    if (typeof color === 'string') {
      this.color = { primary: color };
    } else {
      this.color = color; 
    }
    return this; 
  }
  setTargetedMeshName(meshName) { 
    this.targetedMeshName = Array.isArray(meshName) ? meshName : [meshName]; 
    return this; 
  }
  setPrice(price) { this.price = price; return this; }
  setTextures(textures) { this.textureMap = textures; return this; }
  setScale(scale) { this.scale = scale; return this; }
  setRotation(rotation) { this.rotation = rotation; return this; }
  
  getProperties() {
    return {
      name: this.name,
      path: this.path,
      position: this.position,
      color: this.color,
      targetedMeshName: this.targetedMeshName,
      price: this.price,
      scale: this.scale,
      rotation: this.rotation || [0, 0, 0]  // Add this line
    };
  }
}

export default ElementModel;