import React from "react";
import { useCakeContext } from "../../../context/CakeContext";

const FlavourOptions = () => {
  const { cakeState, dispatch } = useCakeContext();

  const flavours = [
    { id: "VANILLA", name: "Vanilla", color: "#F9F5E7" },
    { id: "CHOCOLATE", name: "Chocolate", color: "#7B3F00" },
    { id: "RED_VELVET", name: "Red Velvet", color: "#C23B22" },
    { id: "STRAWBERRY", name: "Strawberry", color: "#FFB6C1" },
    { id: "LEMON", name: "Lemon", color: "#FFF44F" },
  ];

  const handleSelectFlavour = (flavour) => {
    dispatch({ type: "SET_FLAVOUR", payload: flavour });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">2. FLAVOURS</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {flavours.map((flavour) => (
          <div
            key={flavour.id}
            className={`cursor-pointer transition-all duration-200 ${
              cakeState.flavour === flavour.id
                ? "border-2 border-pink-500"
                : "border border-gray-200 hover:border-pink-300"
            } rounded-lg p-4 flex flex-col items-center`}
            onClick={() => handleSelectFlavour(flavour.id)}
          >
            <div
              className="h-12 w-12 rounded-full mb-2"
              style={{ backgroundColor: flavour.color }}
            ></div>
            <span className="font-medium text-sm text-center">
              {flavour.name}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="font-medium text-lg mb-2">Flavor Description</h3>
        <p className="text-gray-600">
          {cakeState.flavour === "VANILLA" &&
            "Classic, sweet vanilla flavor with a light and fluffy texture."}
          {cakeState.flavour === "CHOCOLATE" &&
            "Rich, decadent chocolate flavor made with premium cocoa."}
          {cakeState.flavour === "RED_VELVET" &&
            "Subtle cocoa flavor with a hint of tanginess and a vibrant red color."}
          {cakeState.flavour === "STRAWBERRY" &&
            "Sweet, fruity strawberry flavor with real strawberry pieces."}
          {cakeState.flavour === "LEMON" &&
            "Bright, citrusy lemon flavor with the perfect balance of sweetness and tanginess."}
        </p>
      </div>
    </div>
  );
};

export default FlavourOptions;
