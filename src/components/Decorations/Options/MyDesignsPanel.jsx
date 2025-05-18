import React, { useState, useEffect } from 'react';
import { useCakeContext } from '../../../context/CakeContext';
import { Eye, Trash2, Clock, Receipt } from 'lucide-react'; // Add Receipt icon
import { toast } from 'react-toastify';
import ReceiptComponent from '../Receipt'; // Import the Receipt component

// Update props to receive setActiveTab
const MyDesignsPanel = ({ setActiveTab, onDesignSelect }) => {
  const { getUserCakeDesigns, loadCakeDesign, deleteCakeDesign, token } = useCakeContext();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedDesignForReceipt, setSelectedDesignForReceipt] = useState(null);
  
  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        setLoading(true);
        const response = await getUserCakeDesigns();
        console.log("API Response:", response);

        // Make sure we handle different response formats
        let designsArray = [];
        
        if (Array.isArray(response)) {
          designsArray = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          // This is the format we're getting from the API: {success: true, count: 3, data: Array(3)}
          designsArray = response.data;
          console.log("Found designs in response.data:", designsArray.length);
        } else if (response && Array.isArray(response.designs)) {
          designsArray = response.designs;
        } else {
          console.warn("Could not find designs array in response:", response);
        }
        
        // Log the first design to check if it has previewImage
        if (designsArray.length > 0) {
          console.log("First design preview available:", !!designsArray[0].previewImage);
        }
        
        setDesigns(designsArray); // Always set an array
        setError(null);
      } catch (err) {
        setError('Failed to load designs. Please try again.');
        console.error(err);
        setDesigns([]); // Ensure designs is reset to an empty array
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchDesigns();
    } else {
      setDesigns([]); // Reset designs if not logged in
    }
  }, [getUserCakeDesigns, token]);
  
 const handleLoadDesign = async (designId) => {
  try {
    console.log("MyDesignsPanel: Loading design with ID:", designId);
    
    // Call the parent handler instead of loadCakeDesign directly
    if (onDesignSelect) {
      onDesignSelect(designId);
    } else {
      // Try direct loading if parent handler isn't available
      console.warn("MyDesignsPanel: onDesignSelect not provided, trying direct loading");
      setLoading(true);
      await loadCakeDesign(designId);
      setLoading(false);
    }
  } catch (err) {
    console.error("Error loading design:", err);
    setError('Failed to load design');
  }
};
  
  const handleDeleteDesign = async (e, designId) => {
    e.stopPropagation(); // Prevent triggering the parent click
    
    if (window.confirm('Are you sure you want to delete this design?')) {
      try {
        await deleteCakeDesign(designId);
        setDesigns(designs.filter(design => design._id !== designId));
      } catch (err) {
        setError('Failed to delete design');
      }
    }
  };
  
  const handleShowReceipt = (e, design) => {
    e.stopPropagation(); // Prevent triggering the parent click handler
    setSelectedDesignForReceipt(design);
    setShowReceipt(true);
  };
  
  if (!token) {
    return (
      <div className="bg-white p-6 rounded-b-lg shadow-md text-center">
        <p className="text-gray-600 mb-4">Please log in to view your saved designs.</p>
        <a href="/login" className="bg-pink-500 text-white px-4 py-2 rounded">
          Log In
        </a>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-b-lg shadow-md flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-b-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">My Saved Designs</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {designs.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <p className="text-gray-500">You haven't saved any designs yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Create a design and click "Save" to see it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto p-1">
          {designs.map((design) => (
            <div 
              key={design._id} 
              className="border rounded-lg overflow-hidden cursor-pointer hover:border-pink-300 transition-all hover:shadow-md"
              onClick={() => {
                console.log("Design clicked:", design._id);
                handleLoadDesign(design._id);
              }}
            >
              <div className="h-32 bg-gray-100 flex items-center justify-center overflow-hidden">
                {design.previewImage ? (
                  <img 
                    src={design.previewImage} 
                    alt={`${design.name} preview`}
                    className="h-full w-full object-contain" 
                    onError={(e) => {
                      console.error("Image failed to load");
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f3f4f6'/%3E%3Ctext x='50' y='50' font-family='Arial' font-size='12' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                ) : (
                  <div className="text-gray-400 text-sm">No Preview Available</div>
                )}
              </div>
              
              <div className="p-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{design.name}</h3>
                  <div className="flex space-x-2">
                    {/* Receipt button */}
                    <button 
                      onClick={(e) => handleShowReceipt(e, design)}
                      className="text-blue-500 hover:text-blue-700"
                      aria-label="View receipt"
                    >
                      <Receipt size={16} />
                    </button>
                    {/* Existing delete button */}
                    <button 
                      onClick={(e) => handleDeleteDesign(e, design._id)}
                      className="text-red-500 hover:text-red-700"
                      aria-label="Delete design"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-500 text-xs truncate mt-1">
                  {design.description || "No description"}
                </p>
                
                <div className="flex items-center text-gray-400 text-xs mt-2">
                  <Clock size={12} className="mr-1" />
                  {new Date(design.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Receipt modal */}
      {showReceipt && selectedDesignForReceipt && (
        <ReceiptComponent 
          isVisible={showReceipt}
          onClose={() => setShowReceipt(false)}
          design={selectedDesignForReceipt}
        />
      )}
    </div>
  );
};

export default MyDesignsPanel;