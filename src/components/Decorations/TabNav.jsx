import React from "react";
import PropTypes from "prop-types";
import { useCakeContext } from "../../context/CakeContext";

const TabNav = ({ activeTab, setActiveTab }) => {
  const { cakeState } = useCakeContext();
  const tabs = [
    "BASE-STYLE",
    "BASE",
    "FLAVOURS",
    "COLOR",
    "ELEMENTS",
    "TOPPER",
    "MESSAGE",
  ];

  const handleTabClick = (tab) => {
    if (tab === "BASE-STYLE" || cakeState.baseStyle) {
      setActiveTab(tab);
    }
  };

  return (
    <div className="flex w-full">
      {tabs.map((tab) => {
        const isDisabled = tab !== "BASE-STYLE" && !cakeState.baseStyle;

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
