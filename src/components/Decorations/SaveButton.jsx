import React, { useState, useContext, useRef, useEffect } from 'react';
import { useCakeContext } from '../../context/CakeContext';
import { ShopContext } from '../../context/ShopContext';
import { Database, HardDrive, Menu, Check, X, FileText, ShoppingCart } from 'lucide-react';
import Receipt from './Receipt';

// Use canvasImageUrl prop
const SaveButton = ({ onSaveComplete, canvasImageUrl }) => {
  const { cakeState, saveCakeDesign, token } = useCakeContext();
  const { addCustomCakeToCart } = useContext(ShopContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveType, setSaveType] = useState(null);
  const [designName, setDesignName] = useState('My Cake Design');
  const [showNameInput, setShowNameInput] = useState(false);
  const [nameInputAction, setNameInputAction] = useState(null); // 'database' or 'cart'
  const dropdownRef = useRef(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // Add this state variable

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Function to capture screenshot from Three.js scene
  const captureThreeCanvas = () => {
    try {
      console.log("Capturing Three.js canvas");
      
      // First try to use the passed URL
      if (canvasImageUrl) {
        console.log("Using pre-captured canvas image");
        setPreviewImage(canvasImageUrl);
        return canvasImageUrl;
      }
      
      // Try to use the global screenshot function
      if (window.takeCanvasScreenshot) {
        console.log("Triggering fresh screenshot capture");
        const dataURL = window.takeCanvasScreenshot();
        setPreviewImage(dataURL);
        return dataURL;
      }
      
      console.error("No canvas image available");
      return null;
    } catch (error) {
      console.error('Error capturing Three.js canvas:', error);
      return null;
    }
  };

  const handleSave = async (type) => {
    try {
      setIsSaving(true);
      setSaveType(type);
      setSaveStatus('saving');
      setIsOpen(false);

      // Capture the canvas as image
      const snapshotImage = captureThreeCanvas();

      // Create data object with all the cake details
      const cakeData = {
        ...cakeState,
        savedAt: new Date().toISOString(),
        previewImage: snapshotImage, // Add the screenshot
      };

      if (type === 'local') {
        // Save to localStorage
        localStorage.setItem('savedCakeDesign', JSON.stringify(cakeData));
        setSaveStatus('success');
      } else if (type === 'database') {
        // Check for authentication
        if (!token) {
          throw new Error('Please log in to save your design');
        }
        
        // Save to database using context function with screenshot
        // Fixed order of parameters: name, description, isPublic, previewImage
        await saveCakeDesign(
          designName, 
          `Cake design created on ${new Date().toLocaleDateString()}`,
          true, // isPublic parameter
          snapshotImage // previewImage as the 4th parameter
        );
        setSaveStatus('success');
      }

      // Success handling
      if (onSaveComplete) {
        onSaveComplete(cakeData);
      }
      
      // Clear status after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
        setSaveType(null);
      }, 3000);
    } catch (error) {
      console.error(`Error saving cake design to ${type}:`, error);
      setSaveStatus('error');
      
      // Clear error status after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
        setSaveType(null);
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDatabaseSave = () => {
    if (!token) {
      setSaveStatus('error');
      setSaveType('auth');
      setTimeout(() => {
        setSaveStatus(null);
        setSaveType(null);
      }, 3000);
      return;
    }
    
    setNameInputAction('database');
    setShowNameInput(true);
  };

  const handlePrepareAddToCart = () => {
    if (!token) {
      setSaveStatus('error');
      setSaveType('auth');
      setTimeout(() => {
        setSaveStatus(null);
        setSaveType(null);
      }, 3000);
      return;
    }
    
    setNameInputAction('cart');
    setShowNameInput(true);
  };

  const confirmDatabaseSave = () => {
    setShowNameInput(false);
    handleSave('database');
  };

  // Calculate cake price based on design complexity
  const calculateCakePrice = () => {
    let price = 25.00; // Base price
    
    // Add price for decorations
    if (cakeState.elements && cakeState.elements.length) {
      price += cakeState.elements.length * 3.50;
    }
    
    // Add price for message
    if (cakeState.message) {
      price += 5.00;
    }
    
    return price;
  };
  
  // Handle adding to cart
  const handleAddToCart = async () => {
    try {
      setIsSaving(true);
      
      // Force a new screenshot if possible
      if (window.takeCanvasScreenshot) {
        window.takeCanvasScreenshot();
        
        // Small delay to ensure screenshot is processed
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Get the image (either from previous screenshot or new one)
      const snapshotImage = captureThreeCanvas();
      
      // Create temporary design object
      const designToSave = {
        ...cakeState,
        name: designName,
        description: `Cake design created on ${new Date().toLocaleDateString()}`,
        previewImage: snapshotImage,
        savedAt: new Date().toISOString()
      };
      
      // Save design to database
      console.log("Saving design to database...");
      const savedDesign = await saveCakeDesign(
        designName, 
        `Cake design created on ${new Date().toLocaleDateString()}`,
        true, 
        snapshotImage
      );
      
      console.log("Design saved response:", savedDesign);
      
      // Create a proper design object with _id property
      if (savedDesign && savedDesign.data && savedDesign.data._id) {
        // THIS IS THE KEY CHANGE - create a proper object with _id property
        const designObject = { 
          _id: savedDesign.data._id,
          name: designName,
          previewImage: snapshotImage
        };
        
        console.log("Adding design to cart:", designObject);
        
        // Options for the cake
        const cakeOptions = {
          flavor: 'vanilla',
          size: 'medium',
          tier: 'single',
          message: cakeState.message || ''
        };
        
        // Calculate price
        const price = calculateCakePrice();
        console.log("Calculated price:", price);
        
        // Pass the OBJECT, not just the ID
        await addCustomCakeToCart(designObject, cakeOptions, price);
        
        // Set success status
        setSaveStatus('success');
        setSaveType('cart');
        
        // Close dropdowns
        setIsOpen(false);
        setShowNameInput(false);
      } else {
        throw new Error("Failed to save design - invalid response format");
      }
    } catch (error) {
      console.error("Error adding cake to cart:", error);
      setSaveStatus('error');
      setSaveType('cart');
    } finally {
      setIsSaving(false);
      
      // Clear status after delay
      setTimeout(() => {
        setSaveStatus(null);
        setSaveType(null);
      }, 3000);
    }
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSaving}
        className={`flex items-center justify-center p-2 rounded-lg font-medium transition-all ${
          isSaving
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : saveStatus === 'success'
            ? 'bg-green-500 text-white hover:bg-green-600'
            : saveStatus === 'error'
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-white shadow-md text-gray-800 hover:bg-gray-100'
        }`}
      >
        {isSaving ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <>
            {saveStatus === 'success' ? (
              <Check size={20} />
            ) : saveStatus === 'error' ? (
              <X size={20} />
            ) : (
              // Hamburger menu (three lines)
              <div className="flex flex-col justify-center items-center gap-1">
                <div className="w-5 h-0.5 bg-current rounded-full"></div>
                <div className="w-5 h-0.5 bg-current rounded-full"></div>
                <div className="w-5 h-0.5 bg-current rounded-full"></div>
              </div>
            )}
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && !isSaving && (
        <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => handleSave('local')}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-pink-50"
              role="menuitem"
            >
              <HardDrive className="mr-2 h-4 w-4" />
              Save to Local Storage
            </button>
            
            <button
              onClick={handleDatabaseSave}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-pink-50"
              role="menuitem"
            >
              <Database className="mr-2 h-4 w-4" />
              Save to Database
            </button>
            
            <button
              onClick={handlePrepareAddToCart}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-pink-50"
              role="menuitem"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </button>
            
            <button
              onClick={() => setShowReceipt(true)}
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-pink-50"
              role="menuitem"
            >
              <FileText className="mr-2 h-4 w-4" />
              View Receipt
            </button>
          </div>
        </div>
      )}
      
      {/* Design name input popup */}
      {showNameInput && (
        <div className="absolute left-0 mt-2 w-64 p-3 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
          <h3 className="text-sm font-medium mb-2">
            Enter a name for your {nameInputAction === 'cart' ? 'cake design' : 'design'}:
          </h3>
          <input
            type="text"
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            className="w-full p-2 border rounded mb-2 text-sm"
            placeholder="My Cake Design"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNameInput(false)}
              className="px-3 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={nameInputAction === 'cart' ? handleAddToCart : confirmDatabaseSave}
              className="px-3 py-1 text-xs bg-pink-500 text-white rounded hover:bg-pink-600"
            >
              {nameInputAction === 'cart' ? 'Add to Cart' : 'Save'}
            </button>
          </div>
        </div>
      )}
      
      {saveStatus === 'success' && (
        <div className="absolute top-full mt-2 left-0 bg-green-100 text-green-800 text-sm p-2 rounded">
          Design saved successfully to {saveType}!
        </div>
      )}
      
      {saveStatus === 'error' && saveType === 'auth' && (
        <div className="absolute top-full mt-2 left-0 bg-red-100 text-red-800 text-sm p-2 rounded">
          Please log in to save your design.
        </div>
      )}
      
      {saveStatus === 'error' && saveType !== 'auth' && (
        <div className="absolute top-full mt-2 left-0 bg-red-100 text-red-800 text-sm p-2 rounded">
          Failed to save design to {saveType}. Please try again.
        </div>
      )}
      
      {/* Receipt Modal */}
      {showReceipt && (
        <Receipt
          isVisible={showReceipt}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* Preview Image Section */}
      {previewImage && (
        <div className="mt-2 border rounded p-2 bg-white">
          <p className="text-xs text-gray-500 mb-1">Preview:</p>
          <img 
            src={previewImage} 
            alt="Preview" 
            className="w-full h-20 object-contain"
          />
        </div>
      )}

      {/* Canvas Image URL Preview */}
      
    </div>
  );
};

export default SaveButton;