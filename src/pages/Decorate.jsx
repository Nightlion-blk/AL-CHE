import React, { useState, useEffect } from "react";
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
import { CakeContextProvider } from "../context/CakeContext";

const Decorate = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("BASE-STYLE");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "MY-DESIGNS":
      return <MyDesignsPanel />;
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
      case "TOPPER":
        return <TopperOptions />;
      case "MESSAGE":
        return <MessageOptions />;
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
            <DecorationCanvas />

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
