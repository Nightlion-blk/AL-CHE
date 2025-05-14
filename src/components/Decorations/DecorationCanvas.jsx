import React, { useRef, useEffect, useState } from "react";
import { Undo2, Redo2, RotateCcw, ShoppingCart } from "lucide-react";
import { useCakeContext } from "../../context/CakeContext";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const DecorationCanvas = () => {
  const canvasRef = useRef(null);
  const { cakeState, dispatch } = useCakeContext();
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    setCanUndo(cakeState.currentIndex > 0);
    setCanRedo(cakeState.currentIndex < cakeState.history.length - 1);
  }, [cakeState.currentIndex, cakeState.history.length]);

  const handleUndo = () => {
    dispatch({ type: "UNDO" });
  };

  const handleRedo = () => {
    dispatch({ type: "REDO" });
  };

  const handleReset = () => {
    dispatch({ type: "RESET" });
  };

  const handleAddToCart = () => {
    // Add to cart functionality - dito mo lalagay logic nun
    console.log("Adding to cart:", cakeState);
  };

  const getCakeStyle = () => {
    return cakeState.baseStyle === "ROUNDED" ? "rounded-full" : "rounded-lg";
  };

  return (
    <div className="relative">
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <button
          className={`p-2 rounded-full bg-white shadow-md ${
            canUndo ? "text-gray-800 hover:bg-gray-100" : "text-gray-400"
          }`}
          disabled={!canUndo}
          onClick={handleUndo}
          aria-label="Undo"
        >
          <Undo2 size={18} />
        </button>
        <button
          className={`p-2 rounded-full bg-white shadow-md ${
            canRedo ? "text-gray-800 hover:bg-gray-100" : "text-gray-400"
          }`}
          disabled={!canRedo}
          onClick={handleRedo}
          aria-label="Redo"
        >
          <Redo2 size={18} />
        </button>
      </div>

      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button
          className="p-2 rounded-full bg-white shadow-md text-gray-800 hover:bg-gray-100"
          onClick={handleReset}
          aria-label="Reset Canvas"
        >
          <RotateCcw size={18} />
        </button>
        <button
          className="p-2 rounded-full bg-pink-600 shadow-md text-white hover:bg-pink-700"
          onClick={handleAddToCart}
          aria-label="Add to Cart"
        >
          <ShoppingCart size={18} />
        </button>
      </div>

       <div
        ref={canvasRef}
        className="bg-gray-100 rounded-lg h-[300px] md:h-[400px] flex items-center justify-center relative overflow-hidden"
      >
        <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 7]} intensity={1} />
          <OrbitControls />
      {cakeState.cakeModel && cakeState.cakeModel.getModel()}
        </Canvas>
        {cakeState.message && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center p-2 font-cursive text-xl pointer-events-none">
            {cakeState.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default DecorationCanvas;
