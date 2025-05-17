import React from "react";
import PropTypes from "prop-types";
import { useCakeContext } from "../../context/CakeContext";

const TabNav = ({ activeTab, setActiveTab }) => {
  const { cakeState, token } = useCakeContext();
  
  const tabs = [
    "BASE-STYLE",
    "BASE",
    "FLAVOURS",
    "COLOR",
    "ELEMENTS",
    "TOPPER",
    "MESSAGE",
    "MY-DESIGNS",
  ];

  const handleTabClick = (tab) => {
    // Allow BASE-STYLE and MY-DESIGNS to be accessed without a base style
    // Also allow any tab if cakeModel exists
    if (tab === "BASE-STYLE" || tab === "MY-DESIGNS" || cakeState.baseStyle || cakeState.cakeModel) {
      setActiveTab(tab);
    }
  };

  return (
    <div className="flex w-full flex-wrap">
      {tabs.map((tab) => {
        // UPDATED LOGIC HERE: Enable tabs if either baseStyle or cakeModel exists
        const isDisabled = 
          (tab === "MY-DESIGNS" && !token) || 
          (tab !== "BASE-STYLE" && tab !== "MY-DESIGNS" && !cakeState.baseStyle && !cakeState.cakeModel);

        return (
          <button
            key={tab}
            className={`flex-1 px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === tab
                ? "bg-white border-t border-l border-r border-gray-200 text-pink-600"
                : isDisabled
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
            } ${tab === tabs[0] ? "rounded-tl-lg" : ""} ${
              tab === tabs[tabs.length - 1] ? "rounded-tr-lg" : ""
            }`}
            onClick={() => handleTabClick(tab)}
            disabled={isDisabled}
            title={tab === "MY-DESIGNS" && !token ? "Log in to view your designs" : ""}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
};

TabNav.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
};

export default TabNav;
