import React, { useState, useEffect } from 'react';
import { useCakeContext } from '../../../context/CakeContext';
import { Eye, Trash2, Clock } from 'lucide-react';

const MyDesignsPanel = () => {
  const { getUserCakeDesigns, loadCakeDesign, deleteCakeDesign, token } = useCakeContext();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        setLoading(true);
        const designsData = await getUserCakeDesigns();
        console.log("API Response:", designsData);

        setDesigns(designsData);
        setError(null);
      } catch (err) {
        setError('Failed to load designs. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchDesigns();
    }
  }, [getUserCakeDesigns, token]);
  
  const handleLoadDesign = async (designId) => {
    try {
      setLoading(true);
      await loadCakeDesign(designId);
      setLoading(false);
    } catch (err) {
      setError('Failed to load design');
      setLoading(false);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-1">
          {designs.map((design) => (
            <div 
              key={design._id} 
              className="border rounded-lg overflow-hidden cursor-pointer hover:border-pink-300 transition-colors"
              onClick={() => handleLoadDesign(design._id)}
            >
              <div className="h-24 bg-gray-100 flex items-center justify-center">
                {/* This would ideally be a thumbnail of the cake */}
                <div className="text-gray-400 text-sm">Cake Preview</div>
              </div>
              
              <div className="p-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{design.name}</h3>
                  <button 
                    onClick={(e) => handleDeleteDesign(e, design._id)}
                    className="text-red-500 hover:text-red-700"
                    aria-label="Delete design"
                  >
                    <Trash2 size={16} />
                  </button>
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
    </div>
  );
};

export default MyDesignsPanel;