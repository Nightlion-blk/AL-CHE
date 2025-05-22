import React, { useState, useEffect } from "react";
import { useCakeContext } from "../../../context/CakeContext";

const FrostingOptions = ({ setFrostingActive, setFrostingColor, setFrostingSize }) => {
  const { dispatch } = useCakeContext();
  const [isActive, setIsActive] = useState(false);
  const [color, setColor] = useState("#FFFFFF");
  const [size, setSize] = useState(0.1);
  
  const colorOptions = [
    { id: "white", value: "#FFFFFF", name: "White" },
    { id: "pink", value: "#FFC0CB", name: "Pink" },
    { id: "lightBlue", value: "#ADD8E6", name: "Light Blue" },
    { id: "yellow", value: "#FFFFE0", name: "Yellow" },
    { id: "lavender", value: "#E6E6FA", name: "Lavender" },
    { id: "mint", value: "#98FB98", name: "Mint" },
  ];
  
  const handleToggleFrosting = () => {
    const newState = !isActive;
    setIsActive(newState);
    setFrostingActive(newState);
  };
  
  const handleColorChange = (newColor) => {
    setColor(newColor);
    setFrostingColor(newColor);
  };
  
  const handleSizeChange = (e) => {
    const newSize = parseFloat(e.target.value);
    setSize(newSize);
    setFrostingSize(newSize);
  };
  
  const handleClearFrosting = () => {
    dispatch({ type: "CLEAR_FROSTING" });
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">FROSTING TOOL</h2>
      
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <label className="font-medium">Enable Frosting Tool</label>
          <button
            onClick={handleToggleFrosting}
            className={`px-4 py-2 rounded-full transition-colors ${
              isActive 
                ? "bg-pink-600 text-white" 
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {isActive ? "Drawing Active" : "Activate Drawing"}
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frosting Size
          </label>
          <div className="flex items-center space-x-2">
            <span className="text-sm">Small</span>
            <input
              type="range"
              min="0.05"
              max="0.3"
              step="0.01"
              value={size}
              onChange={handleSizeChange}
              className="w-full accent-pink-500"
            />
            <span className="text-sm">Large</span>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frosting Color
          </label>
          <div className="grid grid-cols-3 gap-3">
            {colorOptions.map((colorOption) => (
              <div
                key={colorOption.id}
                className={`cursor-pointer transition-all duration-200 ${
                  color === colorOption.value
                    ? "ring-2 ring-pink-500 ring-offset-2"
                    : "hover:ring-1 hover:ring-pink-300 hover:ring-offset-1"
                } rounded-lg p-3 flex flex-col items-center`}
                onClick={() => handleColorChange(colorOption.value)}
              >
                <div
                  className="w-6 h-6 rounded-full mb-1 border border-gray-200"
                  style={{ backgroundColor: colorOption.value }}
                ></div>
                <span className="text-xs text-center">{colorOption.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={handleClearFrosting}
            className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Clear All Frosting
          </button>
        </div>
      </div>
      
      <div className="bg-pink-50 rounded-lg border border-pink-200 p-4">
        <h3 className="font-medium text-pink-800 mb-2">How to Use:</h3>
        <p className="text-sm text-pink-700">
          1. Click "Activate Drawing" to enable the frosting tool<br/>
          2. Click and drag on the cake to draw frosting<br/>
          3. Release to stop drawing<br/>
          4. Adjust size and color as needed
        </p>
      </div>
    </div>
  );
};

export default FrostingOptions;