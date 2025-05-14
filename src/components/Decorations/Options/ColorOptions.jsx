import React from "react";
import { useCakeContext } from "../../../context/CakeContext";

const ColorOptions = () => {
  const { cakeState, dispatch } = useCakeContext();

  const colors = [
    { id: "white", name: "White", value: "#FFFFFF" },
    { id: "cream", name: "Cream", value: "#FFF8DC" },
    { id: "pink", name: "Pink", value: "#FFB6C1" },
    { id: "blue", name: "Blue", value: "#ADD8E6" },
    { id: "yellow", name: "Yellow", value: "#FFFFE0" },
    { id: "mint", name: "Mint", value: "#98FB98" },
    { id: "lavender", name: "Lavender", value: "#E6E6FA" },
    { id: "custom", name: "Custom", value: "" },
  ];

  const handleSelectColor = (color) => {
    dispatch({ type: "SET_CAKE_COLOR", payload: color });
  };

  const handleCustomColorChange = (e) => {
    dispatch({ type: "SET_CAKE_COLOR", payload: e.target.value });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">3. COLOR</h2>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4 mb-6">
        {colors.slice(0, -1).map((color) => (
          <div
            key={color.id}
            className={`cursor-pointer transition-all duration-200 ${
              cakeState.cakeColor === color.value
                ? "ring-2 ring-pink-500 ring-offset-2"
                : "hover:ring-2 hover:ring-pink-300 hover:ring-offset-1"
            } rounded-full p-1`}
            onClick={() => handleSelectColor(color.value)}
          >
            <div
              className="h-10 w-10 rounded-full border border-gray-200"
              style={{ backgroundColor: color.value }}
              title={color.name}
            ></div>
          </div>
        ))}
        <div className="flex flex-col items-center">
          <label
            htmlFor="custom-color"
            className="cursor-pointer mb-1 text-xs text-center"
          >
            Custom
          </label>
          <input
            type="color"
            id="custom-color"
            value={cakeState.cakeColor}
            onChange={handleCustomColorChange}
            className="h-10 w-10 cursor-pointer rounded-full overflow-hidden"
          />
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-lg mb-2">Current Color</h3>
        <div className="flex items-center">
          <div
            className="h-12 w-12 rounded-lg border border-gray-200 mr-4"
            style={{ backgroundColor: cakeState.cakeColor }}
          ></div>
          <div>
            <span className="font-medium">
              {cakeState.cakeColor.toUpperCase()}
            </span>
            <p className="text-sm text-gray-600">
              This is how your cake's base color will appear
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorOptions;
