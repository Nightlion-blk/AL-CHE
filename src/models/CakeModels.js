// Base class for 3D models
export class BaseModel {
  constructor(path) {
    this.path = path;
    this.position = [0, 0, 0];
    this.rotation = [0, 0, 0];
    this.scale = [1, 1, 1];
    this.color = { r: 1, g: 1, b: 1 };
    this.targetedMeshName = [];
    this.textureMap = {};
    this.price = 0;
  }

  getModel() {
    return this.path;
  }

  getProperties() {
    return {
      path: this.path,
      position: this.position, 
      rotation: this.rotation,
      scale: this.scale,
      color: this.color,
      targetedMeshName: this.targetedMeshName,
      textureMap: this.textureMap,
      price: this.price
    };
  }
}

// Factory function to create cake models
export const RenderCake = (name, path, position, color, targetedMeshName, textureMap, price, message) => {
  const model = new BaseModel(path);
  model.name = name || "Cake";
  model.position = position || [0, 0, 0];
  model.color = color || { r: 1, g: 1, b: 1 };
  model.targetedMeshName = targetedMeshName || ["Cake"];
  model.textureMap = textureMap || {};
  model.price = price || 0;
  model.message = message || "";
  
  // Add getter methods to match what your code expects
  model.getModel = function() {
    return this.path;
  };
  
  model.getProperties = function() {
    return {
      name: this.name,
      path: this.path,
      position: this.position,
      color: this.color,
      targetedMeshName: this.targetedMeshName,
      textureMap: this.textureMap,
      price: this.price,
      message: this.message
    };
  };
  
  return model;
};