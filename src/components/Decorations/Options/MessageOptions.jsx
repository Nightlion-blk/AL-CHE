import React, { useEffect, useState } from "react";
import { useCakeContext } from "../../../context/CakeContext";

const MessageOptions = () => {
  const { cakeState, dispatch } = useCakeContext();

  const [message, setMessage] = useState(cakeState.message);
  const [selectedFont, setSelectedFont] = useState("script");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedScale, setSelectedScale] = useState(0.15); // Default scale

  useEffect(() => {
    setMessage(cakeState.message || "");
    setSelectedFont(cakeState.fontStyle || "script");
    setSelectedColor(cakeState.messageColor || "#000000");
    setSelectedScale(cakeState.messageScale || 0.15);
  }, [cakeState.message, cakeState.fontStyle, cakeState.messageColor, cakeState.messageScale]);

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
    // Don't specify position - let TextElement use cake top automatically
    dispatch({ type: "SET_MESSAGE", payload: message });
    dispatch({ type: "SET_MESSAGE_FONT", payload: selectedFont });
    dispatch({ type: "SET_MESSAGE_COLOR", payload: selectedColor });
    dispatch({ type: "SET_MESSAGE_SCALE", payload: selectedScale }); // Fixed this line
    
    // Clear any manually set position to ensure automatic positioning is used
    dispatch({ type: "SET_MESSAGE_POSITION", payload: null });
  };

  const handleFontChange = (fontId) => {
    setSelectedFont(fontId);
    if (message) {
      dispatch({ type: "SET_FONT_STYLE", payload: fontId });
    }
  };

  const handleFontSizeChange = (e) => {
    const size = parseFloat(e.target.value);
    setSelectedScale(size);
    
    // Always dispatch the scale change, regardless of message existence
    dispatch({ type: "SET_MESSAGE_SCALE", payload: size });
    
    // If message exists, we might want to immediately see the change
    if (message && !cakeState.message) {
      // Apply the message with current settings if not already applied
      handleApplyMessage();
    }
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    if (message) {
      dispatch({ type: "SET_MESSAGE_COLOR", payload: color });
    }
  };

  const handleClearMessage = () => {
    setMessage("");
    dispatch({ type: "SET_MESSAGE", payload: "" });
  };

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
            onClick={handleClearMessage}
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

        <div className="mt-4">
  <h3 className="font-medium text-lg mb-3">Font Size</h3>
  <div className="flex items-center space-x-2">
    <span className="text-sm min-w-[40px]">Small</span>
    <input
      type="range"
      min="0.1"
      max="1" // Increase from 1.0 to 2.0 for larger text
      step="0.01" // Use larger step for more precise control
      value={selectedScale}
      onChange={handleFontSizeChange}
      className="w-full accent-pink-500"
    />
    <span className="text-sm min-w-[40px]">Large</span>
  </div>
  <div className="mt-2 flex justify-between items-center">
    <div className="text-xs text-gray-500">
      {(selectedScale * 100).toFixed()}% of default
    </div>
    <div className="flex gap-2">
      <button 
        onClick={() => handleFontSizeChange({ target: { value: Math.max(0.05, selectedScale - 0.05) }})} 
        className="px-2 py-1 bg-gray-200 rounded text-xs"
        disabled={selectedScale <= 0.05}
      >
        -
      </button>
      <button 
        onClick={() => handleFontSizeChange({ target: { value: Math.min(2.0, selectedScale + 0.05) }})} 
        className="px-2 py-1 bg-gray-200 rounded text-xs"
        disabled={selectedScale >= 2.0} // Match the new maximum
      >
        +
      </button>
    </div>
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
