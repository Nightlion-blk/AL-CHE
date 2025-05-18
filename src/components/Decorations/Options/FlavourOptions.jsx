import React from "react";
import { useCakeContext } from "../../../context/CakeContext";

const FlavourOptions = () => {
  const { cakeState, dispatch } = useCakeContext();

  // Renamed from flavour to flavours (plural) to match usage in render
  const flavours = [
    { 
      id: "VANILLA", 
      name: "Vanilla", 
      primary: "#F9F5E7", 
      secondary: "#E8D7B4",
      description: "Light, classic flavor with subtle notes of vanilla bean" 
    },
    { 
      id: "CHOCOLATE", 
      name: "Chocolate", 
      primary: "#7B3F00", 
      secondary: "#C89F65",
      description: "Rich, indulgent chocolate flavor" 
    },
    { 
      id: "RED_VELVET", 
      name: "Red Velvet", 
      primary: "#C23B22", 
      secondary: "#F5E6CC",
      description: "Subtle cocoa flavor with cream cheese frosting" 
    },
    { 
      id: "STRAWBERRY", 
      name: "Strawberry", 
      primary: "#FFB6C1", 
      secondary: "#E57F84",
      description: "Sweet berry flavor with hints of fresh strawberry" 
    },
    { 
      id: "LEMON", 
      name: "Lemon", 
      primary: "#FFF44F", 
      secondary: "#FFFACD",
      description: "Bright, tangy citrus flavor" 
    },
  ];

  // Updated to pass the entire flavor object instead of just the ID
  const handleSelectFlavour = (flavour) => {
    dispatch({ type: "SET_FLAVOUR", payload: flavour });
  };

  // Find the selected flavor
  const selectedFlavour = flavours.find(f => f.id === cakeState.flavour?.id || cakeState.flavour);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">2. FLAVOURS</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {flavours.map((flavour) => (
          <div
            key={flavour.id}
            className={`cursor-pointer transition-all duration-200 ${
              (cakeState.flavour?.id || cakeState.flavour) === flavour.id
                ? "border-2 border-pink-500"
                : "border border-gray-200 hover:border-pink-300"
            } rounded-lg p-4 flex flex-col items-center`}
            onClick={() => handleSelectFlavour(flavour)}
          >
            <div className="flex">
              {/* Display both primary and secondary colors */}
              <div
                className="h-12 w-12 rounded-l-full"
                style={{ backgroundColor: flavour.primary }}
              ></div>
              <div
                className="h-12 w-12 rounded-r-full"
                style={{ backgroundColor: flavour.secondary }}
              ></div>
            </div>
            <span className="font-medium text-sm text-center mt-2">
              {flavour.name}
            </span>
          </div>
        ))}
      </div>

      {selectedFlavour && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-lg mb-2">Flavor: {selectedFlavour.name}</h3>
          <div className="flex items-center mb-2">
            <div
              className="h-8 w-8 rounded-l-full"
              style={{ backgroundColor: selectedFlavour.primary }}
            ></div>
            <div
              className="h-8 w-8 rounded-r-full mr-3"
              style={{ backgroundColor: selectedFlavour.secondary }}
            ></div>
            {/* Use the description from the flavor object */}
            <p className="text-gray-600">
              {selectedFlavour.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlavourOptions;
