import React from "react";
import { useCakeContext } from "../../../context/CakeContext";

const BaseOptions = () => {
  const { cakeState, dispatch } = useCakeContext();

  const cakeOptions = [
    {
      id: "THREE_TIER",
      name: "THREE TIER CAKE",
      price: 60.0,
      image: "/images/three-tier-cake.png",
    },
    {
      id: "TWO_TIER",
      name: "TWO TIER CAKE",
      price: 40.0,
      image: "/images/two-tier-cake.png",
    },
    {
      id: "ROUND",
      name: "ROUND CAKE",
      price: 30.0,
      image: "/images/round-cake.png",
    },
    {
      id: "SHEET",
      name: "SHEET CAKE",
      price: 35.0,
      image: "/images/sheet-cake.png",
    },
  ];

  const handleSelectCake = (cakeType) => {
    dispatch({ type: "SET_CAKE_TYPE", payload: cakeType });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">1. CAKE</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cakeOptions.map((cake) => (
          <div
            key={cake.id}
            className={`cursor-pointer transition-all duration-200 ${
              cakeState.cakeType === cake.id
                ? "border-2 border-pink-500 bg-pink-50"
                : "border border-gray-200 hover:border-pink-300 hover:bg-pink-50"
            } rounded-lg p-4 flex flex-col items-center`}
            onClick={() => handleSelectCake(cake.id)}
          >
            <div className="h-24 w-24 bg-gray-100 rounded flex items-center justify-center mb-2">
              <div className="w-20 h-20 bg-gray-300 rounded-lg"></div>
            </div>
            <span className="font-medium text-sm text-center">{cake.name}</span>
            <span className="text-gray-600 text-sm">
              ₱ {cake.price.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BaseOptions;
