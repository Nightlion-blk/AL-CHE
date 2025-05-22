import React from "react";
import { useCakeContext } from "../../../context/CakeContext";

const ElementOptions = () => {
  const { cakeState, dispatch } = useCakeContext();

  const categories = [
    { id: "sprinkles", name: "Sprinkles" },
    { id: "candles" , name: "Candles" },
    { id: "flowers", name: "Flowers" },
    { id: "fruits", name: "Fruits" },
    { id: "candies", name: "Candies" },
  ];

  const [activeCategory, setActiveCategory] = React.useState("sprinkles");

  const elements = {
    sprinkles: [
      { 
        id: "rainbow-sprinkles", 
        name: "Rainbow Sprinkles", 
        price: 2.0,
        rotation: [0, 0, 0]  // Default flat rotation
      },
      { 
        id: "chocolate-sprinkles", 
        name: "Chocolate Sprinkles", 
        price: 2.0,
        rotation: [0, 0, 0]
      },
      { 
        id: "sugar-pearls", 
        name: "Sugar Pearls", 
        price: 3.0,
        rotation: [0, 0, 0]
      },
      { 
        id: "confetti", 
        name: "Confetti", 
        price: 2.5,
        rotation: [0, 0, 0]
      },
    ],
    
    flowers: [
      { 
        id: "rose", 
        name: "Rose", 
        path: "tresD-SE/CAKE-B-3layer/PuttingObjects/Flowers/Rose.glb", 
        position: [0, 1, 0],
        scale: [0.5, 0.5, 0.5],
        rotation: [0, 0, 0],  // Default upright position
        price: 20.0 
      },
      { 
        id: "sunflower", 
        name: "SunFlower", 
        path: "tresD-SE/CAKE-B-3layer/PuttingObjects/Flowers/Sunflower.glb", 
        position: [0, 1, 0],
        scale: [0.5, 0.5, 0.5],
        rotation: [0, 0, 0],  // Default upright position
        price: 20.0 
      },
      { 
        id: "orchid", 
        name: "Orchid", 
        path: "tresD-SE/CAKE-B-3layer/PuttingObjects/Flowers/Orchid.glb", 
        position: [0, 1, 0],
        scale: [0.5, 0.5, 0.5],
        rotation: [0, 0, 0],  // Default upright position
        price: 5.0 
      },
    ],

    fruits: [
      { 
        id: "strawberry-slices", 
        name: "Strawberry Slices", 
        path: "tresD-SE/CAKE-B-3layer/PuttingObjects/HalfStrawberry.glb", 
        position: [0, 1, 0],
        scale: [0.5, 0.5, 0.5],
        rotation: [-Math.PI/2, 0, 0],  // Flat on the cake
        price: 3.0 
      },
      { 
        id: "blueberry", 
        name: "Blueberry", 
        path: "tresD-SE/CAKE-B-3layer/PuttingObjects/BlueBerry.glb", 
        position: [0, 1, 0],
        scale: [1, 1, 1], // Changed from 0.5 to 0.1 to match Blender scale
        rotation: [0, 0, 0],  // Default position
        price: 3.0 
      },
      { 
        id: "kiwi-slices", 
        name: "Kiwi Slices", 
        price: 3.5,
        rotation: [-Math.PI/2, 0, 0]  // Flat on the cake
      },
      { 
        id: "raspberry", 
        name: "Raspberry", 
        price: 4.0,
        rotation: [0, 0, 0]
      },
    ],
    
    candles: [
      { 
        id: "Candle_0", 
        name: "Candle 0", 
        path: "tresD-SE/CAKE-B-3layer/PuttingObjects/Candles/candle_0.glb", 
        position: [0, 1, 0],
        scale: [0.5, 0.5, 0.5],
        rotation: [0, 0, 0],  // Standing upright
        price: 3.0 
      },
      { 
        id: "Candle_1", 
        name: "Candle_1", 
        path: "tresD-SE/CAKE-B-3layer/PuttingObjects/Candles/candle_1.glb", 
        position: [0, 1, 0],
        scale: [0.5, 0.5, 0.5],
        rotation: [0, 0, 0],  // Standing upright
        price: 3.0 
      },
      { 
        id: "Candle_2", 
        name: "Candle 2", 
        path: "tresD-SE/CAKE-B-3layer/PuttingObjects/Candles/candle_2.glb", 
        position: [0, 1, 0],
        scale: [0.5, 0.5, 0.5],
        rotation: [0, 0, 0],  // Standing upright
        price: 3.0 
      },
      { 
        id: "Candle_3", 
        name: "Candle 3", 
        path: "tresD-SE/CAKE-B-3layer/PuttingObjects/Candles/candle_3.glb", 
        position: [0, 1, 0],
        scale: [0.5, 0.5, 0.5],
        rotation: [0, 0, 0],  // Standing upright
        price: 3.0 
      },
      { 
        id: "Candle_4", 
        name: "Candle 4", 
        path: "tresD-SE/CAKE-B-3layer/PuttingObjects/Candles/candle_4.glb", 
        position: [0, 1, 0],
        scale: [0.5, 0.5, 0.5],
        rotation: [0, 0, 0],  // Standing upright
        price: 3.0 
      },
      { 
        id: "Candle_5", 
        name: "Candle 5", 
        path: "tresD-SE/CAKE-B-3layer/PuttingObjects/Candles/candle_5.glb", 
        position: [0, 1, 0],
        scale: [0.5, 0.5, 0.5],
        rotation: [0, 0, 0],  // Standing upright
        price: 3.0 
      },
      { 
        id: "Candle_6", 
        name: "Candle 6", 
        path: "tresD-SE/CAKE-B-3layer/PuttingObjects/Candles/candle_6.glb", 
        position: [0, 1, 0],
        scale: [0.5, 0.5, 0.5],
        rotation: [0, 0, 0],  // Standing upright
        price: 3.0 
      },
      { 
        id: "Candle_7", 
        name: "Candle 7", 
        path: "tresD-SE/CAKE-B-3layer/PuttingObjects/Candles/candle_7.glb", 
        position: [0, 1, 0],
        scale: [0.5, 0.5, 0.5],
        rotation: [0, 0, 0],  // Standing upright
        price: 3.0 
      },
      { 
        id: "Candle_8", 
        name: "Candle 8", 
        path: "tresD-SE/CAKE-B-3layer/PuttingObjects/Candles/candle_8.glb", 
        position: [0, 1, 0],
        scale: [0.5, 0.5, 0.5],
        rotation: [0, 0, 0],  // Standing upright
        price: 3.0 
      },
      { 
        id: "Candle_9", 
        name: "Candle 9", 
        path: "tresD-SE/CAKE-B-3layer/PuttingObjects/Candles/candle_9.glb", 
        position: [0, 1, 0],
        scale: [0.5, 0.5, 0.5],
        rotation: [0, 0, 0],  // Standing upright
        price: 3.0 
      }
    ],
    candies: [
      { 
        id: "chocolate-chips", 
        name: "Chocolate Chips", 
        price: 2.5,
        rotation: [-Math.PI/2, 0, 0]  // Flat on the cake
      },
      { 
        id: "mini-marshmallows", 
        name: "Mini Marshmallows", 
        price: 2.5,
        rotation: [0, 0, 0]
      },
      { 
        id: "candy-buttons", 
        name: "Candy Buttons", 
        price: 3.0,
        rotation: [-Math.PI/2, 0, 0]  // Flat on the cake
      },
      { 
        id: "jelly-beans", 
        name: "Jelly Beans", 
        price: 3.0,
        rotation: [0, 0, 0]
      },
    ],
  };

  const handleAddElement = (element) => {
    // Create the appropriate cakeModelProps object for the ADD_ELEMENT action
    const cakeModelProps = {
      id: element.id,
      name: element.name,
      price: element.price,
      path: element.path || null,
      position: element.position || [0, 10, 0],
      color: element.color || "#FFFFFF",
      scale: element.scale || [1, 1, 1],
      rotation: element.rotation || [0, 0, 0], // Add this line
      targetedMeshName: element.targetedMeshName || element.id
    };

    dispatch({ 
      type: "ADD_ELEMENT", 
      cakeModelProps: cakeModelProps 
    });
  };

  const handleRemoveElement = (element) => {
    // Find the element in cakeState.elements
    const elementToRemove = cakeState.elements.find(
      (el) => el.name === element.name || el.id === element.id
    );
    
    if (elementToRemove) {
      dispatch({ type: "REMOVE_ELEMENT", payload: elementToRemove });
    }
  };

  const isElementSelected = (elementId) => {
    return cakeState.elements.some(
      (element) => element.id === elementId || element.name === elementId
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">4. ELEMENTS</h2>

      <div className="flex flex-wrap border-b border-gray-200 mb-4">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeCategory === category.id
                ? "border-b-2 border-pink-500 text-pink-600"
                : "text-gray-600 hover:text-pink-500"
            }`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {elements[activeCategory].map((element) => (
          <div
            key={element.id}
            className={`cursor-pointer transition-all duration-200 ${
              isElementSelected(element.id)
                ? "border-2 border-pink-500 bg-pink-50"
                : "border border-gray-200 hover:border-pink-300 hover:bg-pink-50"
            } rounded-lg p-4 flex flex-col items-center`}
            onClick={() =>
              isElementSelected(element.id)
                ? handleRemoveElement(element)
                : handleAddElement(element)
            }
          >
            <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
              {element.path ? (
                <span className="text-xs text-green-500">3D Model</span>
              ) : (
                <div className="w-12 h-12 bg-gray-300 rounded"></div>
              )}
            </div>
            <span className="font-medium text-sm text-center">
              {element.name}
            </span>
            <span className="text-gray-600 text-sm">
              ₱ {element.price.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {cakeState.elements.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-lg mb-2">Selected Elements</h3>
          <div className="flex flex-wrap gap-2">
            {cakeState.elements.map((element, index) => (
              <div
                key={`selected-${index}`}
                className="bg-white px-3 py-1 rounded-full text-sm flex items-center"
              >
                <span>{element.name}</span>
                <button
                  className="ml-2 text-gray-400 hover:text-pink-600"
                  onClick={() => handleRemoveElement(element)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ElementOptions;
