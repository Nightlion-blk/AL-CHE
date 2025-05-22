import React, { useState, useEffect, useRef } from "react";
import DecorationCanvas from "../components/Decorations/DecorationCanvas";
import TabNav from "../components/Decorations/TabNav";
import BaseStyleOptions from "../components/Decorations/Options/BaseStyleOptions";
import BaseOptions from "../components/Decorations/Options/BaseOptions";
import FlavourOptions from "../components/Decorations/Options/FlavourOptions";
import ColorOptions from "../components/Decorations/Options/ColorOptions";
import ElementOptions from "../components/Decorations/Options/ElementOptions";
import TopperOptions from "../components/Decorations/Options/TopperOptions";
import MessageOptions from "../components/Decorations/Options/MessageOptions";
import MyDesignsPanel from "../components/Decorations/Options/MyDesignsPanel";
import FrostingOptions from "../components/Decorations/Options/FrostingOptions";
import { CakeContextProvider, useCakeContext } from "../context/CakeContext";
import { toast } from "react-toastify";

const Decorate = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("BASE-STYLE");
  const decorationCanvasRef = useRef(null);
  const { cakeState } = useCakeContext();
  
  // Add these state variables for frosting controls
  const [frostingActive, setFrostingActive] = useState(false);
  const [frostingColor, setFrostingColor] = useState('#FFFFFF');
  const [frostingSize, setFrostingSize] = useState(0.1);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Add this function to determine which tabs should be enabled
  const updateTabsForLoadedDesign = (design) => {
    // First, activate the BASE-STYLE tab since a cake model was loaded
    setActiveTab("ELEMENTS");
  };

  // Update your handler to update tabs after loading design
  const handleDesignSelect = (designId) => {
    if (decorationCanvasRef.current) {
      // Show loading state
      decorationCanvasRef.current
        .loadDesign(designId)
        .then(() => {
          // Once loading completes, update tabs based on loaded design
          // Automatically switch to ELEMENTS tab for a better user experience
          setActiveTab("ELEMENTS");
        })
        .catch((error) => {
          console.error("Error loading design:", error);
        });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "BASE-STYLE":
        return <BaseStyleOptions />;
      case "BASE":
        return <BaseOptions />;
      case "FLAVOURS":
        return <FlavourOptions />;
      case "COLOR":
        return <ColorOptions />;
      case "ELEMENTS":
        return <ElementOptions />;
      case "FROSTING":
        return <FrostingOptions 
          setFrostingActive={setFrostingActive}
          setFrostingColor={setFrostingColor}
          setFrostingSize={setFrostingSize}
        />;
      case "TOPPER":
        return <TopperOptions />;
      case "MESSAGE":
        return <MessageOptions />;
      case "MY-DESIGNS":
        return (
          <MyDesignsPanel
            setActiveTab={setActiveTab}
            onDesignSelect={(designId) => {
              console.log("Decorate.jsx: Design selected:", designId);

              if (decorationCanvasRef.current) {
                // Show a loading toast
                toast.info("Loading your design...");

                // Log a reference check
                console.log(
                  "decorationCanvasRef exists, loadDesign method:",
                  !!decorationCanvasRef.current.loadDesign
                );

                try {
                  decorationCanvasRef.current
                    .loadDesign(designId)
                    .then(() => {
                      console.log("Design loaded successfully in canvas");
                      toast.success("Design loaded successfully!");
                      setActiveTab("ELEMENTS"); // Switch to elements tab
                    })
                    .catch((error) => {
                      console.error("Error loading design in canvas:", error);
                      toast.error("Failed to load design");
                    });
                } catch (error) {
                  console.error("Exception calling loadDesign:", error);
                  toast.error("Error loading design");
                }
              } else {
                console.error("decorationCanvasRef is not available");
                toast.error("Cannot load design: Canvas not ready");
              }
            }}
          />
        );
      default:
        return <BaseStyleOptions />;
    }
  };
  return (
    <CakeContextProvider>
      <div
        className={`transition-opacity duration-1000 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ marginTop: "5rem" }}
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-pink-600">
            Decorate Your Cake
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Customize your perfect cake with our interactive designer below
          </p>
        </div>

        <div className="mt-10 max-w-5xl mx-auto">
          <div className="bg-gray-100 p-4 rounded-lg shadow-md">
            {/* Pass the frosting props to DecorationCanvas */}
            <DecorationCanvas 
              ref={decorationCanvasRef} 
              frostingActive={frostingActive}
              frostingColor={frostingColor}
              frostingSize={frostingSize}
            />

            <div className="mt-4">
              <TabNav activeTab={activeTab} setActiveTab={setActiveTab} />
              <div className="bg-white p-4 rounded-b-lg border border-t-0 border-gray-200 min-h-[200px]">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CakeContextProvider>
  );
};

export default Decorate;
