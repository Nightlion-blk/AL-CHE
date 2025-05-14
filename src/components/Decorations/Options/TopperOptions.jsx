import React from "react";
import { useCakeContext } from "../../../context/CakeContext";

const TopperOptions = () => {
  const { cakeState, dispatch } = useCakeContext();

  const toppers = [
    { id: "birthday", name: "Birthday", price: 5.0 },
    { id: "wedding", name: "Wedding", price: 8.0 },
    { id: "anniversary", name: "Anniversary", price: 6.0 },
    { id: "congratulations", name: "Congratulations", price: 5.0 },
    { id: "baby-shower", name: "Baby Shower", price: 6.0 },
    { id: "custom", name: "Custom", price: 10.0 },
  ];

  const handleSelectTopper = (topperId) => {
    dispatch({ type: "SET_TOPPER", payload: topperId });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">5. TOPPER</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {toppers.map((topper) => (
          <div
            key={topper.id}
            className={`cursor-pointer transition-all duration-200 ${
              cakeState.topper === topper.id
                ? "border-2 border-pink-500 bg-pink-50"
                : "border border-gray-200 hover:border-pink-300 hover:bg-pink-50"
            } rounded-lg p-4 flex flex-col items-center`}
            onClick={() => handleSelectTopper(topper.id)}
          >
            <div className="h-24 w-24 bg-gray-100 rounded flex items-center justify-center mb-2">
              <div className="w-16 h-16 bg-gray-300 rounded"></div>
            </div>
            <span className="font-medium text-sm text-center">
              {topper.name}
            </span>
            <span className="text-gray-600 text-sm">
              ₱ {topper.price.toFixed(2)}
            </span>
          </div>
        ))}

        <div
          className={`cursor-pointer transition-all duration-200 ${
            cakeState.topper === null
              ? "border-2 border-pink-500 bg-pink-50"
              : "border border-gray-200 hover:border-pink-300 hover:bg-pink-50"
          } rounded-lg p-4 flex flex-col items-center`}
          onClick={() => handleSelectTopper(null)}
        >
          <div className="h-24 w-24 bg-gray-100 rounded flex items-center justify-center mb-2">
            <span className="text-gray-500">None</span>
          </div>
          <span className="font-medium text-sm text-center">No Topper</span>
          <span className="text-gray-600 text-sm">₱ 0.00</span>
        </div>
      </div>

      {cakeState.topper === "custom" && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-lg mb-2">Custom Topper Details</h3>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={3}
            placeholder="Describe your custom topper requirements"
          ></textarea>
          <p className="text-sm text-gray-600 mt-2">
            Our team will contact you to discuss your custom topper request.
          </p>
        </div>
      )}
    </div>
  );
};

export default TopperOptions;
