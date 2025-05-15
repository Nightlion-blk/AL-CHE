import React, { useEffect, useState } from "react";
import { useCakeContext } from "../../../context/CakeContext";

const MessageOptions = () => {
  const { cakeState, dispatch } = useCakeContext();

  const [message, setMessage] = useState(cakeState.message);
  const [selectedFont, setSelectedFont] = useState("script");
  const [selectedColor, setSelectedColor] = useState("#000000");

  useEffect(() => {
    setMessage(cakeState.message || "");
    setSelectedFont(cakeState.fontStyle || "script");
    setSelectedColor(cakeState.messageColor || "#000000");

  }, [cakeState.message, cakeState.fontStyle, cakeState.messageColor]);
  

  const fontOptions = [
    { id: "script", name: "Script" },
    { id: "block", name: "Block" },
    { id: "modern", name: "Modern" },
    { id: "classic", name: "Classic" },
  ];

  const colorOptions = [
    { id: "black", value: "#000000", name: "Black" },
    { id: "navy", value: "#000080", name: "Navy" },
    { id: "darkGreen", value: "#006400", name: "Dark Green" },
    { id: "darkPurple", value: "#301934", name: "Dark Purple" },
    { id: "burgundy", value: "#800020", name: "Burgundy" },
    { id: "darkBrown", value: "#654321", name: "Dark Brown" },
  ];

  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };

  const handleApplyMessage = () => {
    dispatch({ type: "SET_MESSAGE", payload: message });
    dispatch({ type: "SET_FONT_STYLE", payload: selectedFont });
    dispatch({ type: "SET_MESSAGE_COLOR", payload: selectedColor });
  };

  const handleFontChange = (fontId) => {
    setSelectedFont(fontID);
    if (message) {
    dispatch({ type: "SET_FONT_STYLE", payload: fontID});
  }
  }
  const handleColorChange = (color) => {
    setSelectedColor(color);
    if (message) {
      dispatch({ type: "SET_MESSAGE_COLOR", payload: color });
    }
  };

  const handleClearMessage = () => {
    setMessage("");
    dispatch({ type: "SET_MESSAGE", payload: "" });
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">6. MESSAGE</h2>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <label
          htmlFor="cake-message"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Write a Short Message (up to 150 characters)
        </label>
        <div className="flex">
          <textarea
            id="cake-message"
            value={message}
            onChange={handleMessageChange}
            placeholder="Write your heartfelt message here. Perfect for birthdays, anniversaries, congratulations, or any special occasion. Make it personal and meaningful!"
            className="flex-grow p-2 border border-gray-300 rounded-l-md focus:ring-pink-500 focus:border-pink-500 min-h-[100px]"
            maxLength={150}
          />
          <button
            className="px-4 py-2 bg-pink-600 text-white rounded-r-md hover:bg-pink-700 transition-colors"
            onClick={handleApplyMessage}
          >
            Apply
          </button>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">
            {message.length}/150 characters
          </span>
          <button
            className="text-xs text-pink-600 hover:text-pink-800"
            onClick={() => {
            handleClearMessage
            }}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium text-lg mb-3">Font Style</h3>
          <div className="grid grid-cols-2 gap-3">
            {fontOptions.map((font) => (
              <div
                key={font.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedFont === font.id
                    ? "border-2 border-pink-500 bg-pink-50"
                    : "border border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                } rounded-lg p-3 flex items-center`}
                onClick={() => handleFontChange(font.id)}
              >
                <div className="w-6 h-6 flex items-center justify-center mr-2">
                  {selectedFont === font.id && (
                    <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
                  )}
                </div>
                <span
                  className={`font-medium text-sm ${
                    font.id === "script"
                      ? "font-serif italic"
                      : font.id === "block"
                      ? "font-bold"
                      : font.id === "modern"
                      ? "font-sans"
                      : "font-serif"
                  }`}
                >
                  {font.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-lg mb-3">Message Color</h3>
          <div className="grid grid-cols-3 gap-3">
            {colorOptions.map((color) => (
              <div
                key={color.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedColor === color.value
                    ? "ring-2 ring-pink-500 ring-offset-2"
                    : "hover:ring-1 hover:ring-pink-300 hover:ring-offset-1"
                } rounded-lg p-3 flex flex-col items-center`}
                onClick={() => handleColorChange(color.value)}
              >
                <div
                  className="w-6 h-6 rounded-full mb-1 border border-gray-200"
                  style={{ backgroundColor: color.value }}
                ></div>
                <span className="text-xs text-center">{color.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {message && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-lg mb-2">Preview</h3>
          <div className="p-6 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
            <span
              className={`
                text-xl 
                ${
                  selectedFont === "script"
                    ? "font-serif italic"
                    : selectedFont === "block"
                    ? "font-bold"
                    : selectedFont === "modern"
                    ? "font-sans"
                    : "font-serif"
                }
              `}
              style={{ color: selectedColor }}
            >
              {message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageOptions;
