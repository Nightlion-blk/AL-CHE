import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import CakeDesignViewer from './CakeDesignViewer';
import { useCakeContext } from '../context/CakeContext';
import axios from 'axios';

const CakeDesigns = () => {
  // Get functions from context
  const { token, getAllDesigns, getDesignById, deleteCakeDesign } = useCakeContext();
  
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [designLoading, setDesignLoading] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(12);
  
  // Replace isPublic with searchQuery
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  // Fetch cake designs
  const fetchDesigns = async (pageNum = page, query = debouncedSearchQuery) => {
    setLoading(true);
    try {
      // Use getAllDesigns from context
      const result = await getAllDesigns({
        page: pageNum,
        limit: limit,
        sort: '-createdAt',
        search: query || undefined  // Add search query parameter
      });
      
      if (result.success) {
        console.log("Designs data:", result.designs);
        setDesigns(result.designs);
        setTotalPages(result.pages);
        console.log('Designs loaded successfully');
      } else {
       console.log('Failed to load designs');
      }
    } catch (error) {
      console.error('Error fetching cake designs:', error);
      console.log(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Complete the fetchDesignByID function
  const fetchDesignByID = async (designId) => {
    try {
      setDesignLoading(true);
      
      const result = await getDesignById(designId);
      
      if (result.success) {
        console.log("Design details:", result.design);
        setSelectedDesign(result.design);
      } else {
       console.log(result.message || 'Failed to load design details');
      }
    } catch (error) {
      console.error('Error fetching cake design details:', error);
     console.log(error.response?.data?.message || error.message);
    } finally {
      setDesignLoading(false);
    }
  };

  // Handle search input with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear any existing timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // Set a timeout to update the debounced value
    window.searchTimeout = setTimeout(() => {
      setDebouncedSearchQuery(value);
      setPage(1); // Reset to first page when searching
      fetchDesigns(1, value);
    }, 500);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchDesigns(newPage, debouncedSearchQuery);
  };

  useEffect(() => {
    fetchDesigns();
    // Clean up timeout on component unmount
    return () => {
      if (window.searchTimeout) {
        clearTimeout(window.searchTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get color from string or object
  const getColorDisplay = (color) => {
    if (!color) return null;
    
    if (typeof color === 'string') {
      return (
        <div 
          className="h-4 w-4 rounded-full ml-2" 
          style={{ backgroundColor: color }}
        ></div>
      );
    } 
    
    if (color.primary) {
      return (
        <div 
          className="h-4 w-4 rounded-full ml-2" 
          style={{ backgroundColor: color.primary }}
        ></div>
      );
    }
    
    if (color.r !== undefined) {
      return (
        <div 
          className="h-4 w-4 rounded-full ml-2" 
          style={{ 
            backgroundColor: `rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255})` 
          }}
        ></div>
      );
    }
    
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Customer Cake Designs</h2>
        
        <div className="mt-3 sm:mt-0 sm:ml-4 flex flex-col sm:flex-row gap-3">
          {/* Replace dropdown with search input */}
          <div className="relative">
            <input 
              type="text"
              placeholder="Search designs..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="block w-full sm:w-64 rounded-md border-gray-300 pl-10 py-2 pr-3 text-sm focus:border-pink-500 focus:outline-none focus:ring-pink-500"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            {searchQuery && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setSearchQuery('');
                  setDebouncedSearchQuery('');
                  setPage(1);
                  fetchDesigns(1, '');
                }}
              >
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          
          <button 
            onClick={() => fetchDesigns(page, debouncedSearchQuery)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
      
      {/* Show search results count if there's a search */}
      {debouncedSearchQuery && (
        <div className="flex items-center mb-4 text-sm text-gray-500">
          <span>Found {designs.length} results for "{debouncedSearchQuery}"</span>
          <button 
            className="ml-2 text-pink-600 hover:text-pink-800 font-medium"
            onClick={() => {
              setSearchQuery('');
              setDebouncedSearchQuery('');
              setPage(1);
              fetchDesigns(1, '');
            }}
          >
            Clear search
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      ) : designs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {designs.map((design) => (
                <div 
                    key={design._id} 
                    onClick={() => {
                        console.log("Design clicked:", design);
                        fetchDesignByID(design._id);
                    }}
                    className="bg-white rounded-lg shadow overflow-hidden transition duration-150 ease-in-out transform hover:-translate-y-1 hover:shadow-lg cursor-pointer"
                >
                {/* Display the preview image if available */}
                <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                  {design.previewImage ? (
                    <img 
                      src={design.previewImage} 
                      alt={`${design.name} preview`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        console.error("Image failed to load:", design.previewImage);
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.parentNode.classList.add('fallback-active');
                      }}
                    />
                  ) : (
                    <div className="text-center p-4 w-full h-full flex items-center justify-center bg-gray-100 fallback-container">
                      <div className="rounded-lg p-4 w-24 h-24 bg-pink-100 flex items-center justify-center">
                        <svg className="h-12 w-12 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">{design.name}</h3>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    <span>{design.username || 'Customer'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span>{new Date(design.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {/* Visibility badge */}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${design.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {design.isPublic ? 'Public' : 'Private'}
                  </span>
                  
                  {/* Element count badge */}
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {design.elements?.length || 0} elements
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === i + 1 ? 'z-10 bg-pink-50 border-pink-500 text-pink-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${page === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white shadow sm:rounded-lg p-6 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No designs found</h3>
          <p className="mt-1 text-sm text-gray-500">No cake designs available.</p>
        </div>
      )}
      
      {/* Modal dialog for selected design */}
      {selectedDesign && (
        <div className="fixed inset-0 z-10 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setSelectedDesign(null)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                  onClick={() => setSelectedDesign(null)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Add loading state for modal content */}
              {designLoading ? (
                <div className="p-6 flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
                </div>
              ) : (
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                          {selectedDesign.name}
                        </h3>
                        
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedDesign.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {selectedDesign.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left column - Cake visualization or preview image */}
                        <div className="bg-gray-100 rounded-lg h-64 md:h-96 flex items-center justify-center overflow-hidden">
                          {selectedDesign.cakeModel?.path ? (
                            <CakeDesignViewer design={selectedDesign} height="100%" />
                          ) : selectedDesign.previewImage ? (
                            <img 
                              src={selectedDesign.previewImage} 
                              alt={`${selectedDesign.name} preview`}
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                console.error("Preview image failed to load");
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            // Fallback content when neither is available
                            <div className="rounded-lg p-6 bg-pink-100 text-pink-600 flex flex-col items-center justify-center">
                              {/* Your fallback content */}
                            </div>
                          )}
                          
                          {/* Show the 3D viewer as a fallback when preview image fails */}
                          <div className="use-3d-viewer hidden">
                            {selectedDesign.cakeModel?.path && (
                              <CakeDesignViewer design={selectedDesign} height="100%" />
                            )}
                          </div>
                        </div>
                        
                        {/* Right column - Details (unchanged) */}
                        <div className="space-y-6">
                          {/* Customer Information */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Customer Information</h4>
                            <div className="grid grid-cols-1 gap-2">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">User ID:</span>
                                <span className="text-sm text-gray-900">{selectedDesign.userId || 'Unknown'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Username:</span>
                                <span className="text-sm text-gray-900">{selectedDesign.username || 'Unknown'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Created:</span>
                                <span className="text-sm text-gray-900">{new Date(selectedDesign.createdAt).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Last Updated:</span>
                                <span className="text-sm text-gray-900">{new Date(selectedDesign.updatedAt).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Description:</span>
                                <span className="text-sm text-gray-900">{selectedDesign.description || 'No description'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Cake Specifications */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Cake Specifications</h4>
                            <div className="grid grid-cols-1 gap-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500">Model Path:</span>
                                <span className="text-sm text-gray-900 truncate max-w-[200px]">{selectedDesign.cakeModel?.path || 'None'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500">Cake Color:</span>
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-900 mr-2">
                                    {selectedDesign.cakeModel?.color?.primary || 'Default'}
                                  </span>
                                  {selectedDesign.cakeModel?.color?.primary && 
                                    <div 
                                      className="h-4 w-4 rounded-full" 
                                      style={{ backgroundColor: selectedDesign.cakeModel.color.primary }}
                                    ></div>
                                  }
                                </div>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-500">Position:</span>
                                <span className="text-sm text-gray-900">
                                  {selectedDesign.cakeModel?.position ? 
                                    `[${selectedDesign.cakeModel.position.join(', ')}]` : 
                                    'Default'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Message */}
                          {selectedDesign.message && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Cake Message</h4>
                              <div className="p-3 bg-white rounded border border-gray-200">
                                <p className="text-center" style={{ color: selectedDesign.messageColor || 'black' }}>
                                  {selectedDesign.message}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                  <span className="text-xs text-gray-500">Font:</span>
                                  <p className="text-sm">{selectedDesign.messageFont || 'Default'}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-gray-500">Color:</span>
                                  <div className="flex items-center">
                                    <span className="text-sm mr-2">{selectedDesign.messageColor || 'Default'}</span>
                                    {selectedDesign.messageColor && 
                                      <div 
                                        className="h-3 w-3 rounded-full" 
                                        style={{ backgroundColor: selectedDesign.messageColor }}
                                      ></div>
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Decorations */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                              Decorations ({selectedDesign.elements?.length || 0})
                            </h4>
                            {selectedDesign.elements?.length > 0 ? (
                              <ul className="divide-y divide-gray-200 max-h-48 overflow-auto">
                                {selectedDesign.elements.map((element, index) => (
                                  <li key={index} className="py-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-900 font-medium">Element {index+1}</span>
                                      <span className="text-xs text-gray-500">ID: {element.uniqueId?.substring(0, 8) || 'N/A'}</span>
                                    </div>
                                    <div className="mt-1 flex justify-between text-xs text-gray-500">
                                      <span>Path: {element.path?.split('/').pop() || 'Unknown'}</span>
                                      {getColorDisplay(element.color)}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500">No decorations added</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {/* Only show Edit button if user is the owner */}
                {selectedDesign.isOwner && (
                  <button 
                    type="button" 
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      // Navigate to cake designer with this design
                      window.location.href = `/cake-designer?designId=${selectedDesign._id}`;
                    }}
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit Design
                  </button>
                )}
                
                {/* Delete button - only for owners */}
                {selectedDesign.isOwner && (
                  <button 
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-red-50 text-base font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => {
                      // Show confirmation before deleting
                      if (window.confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
                        // Call delete function (you'll need to implement this)
                        handleDeleteDesign(selectedDesign._id);
                      }
                    }}
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                )}
                
                <button 
                  type="button" 
                  className={`mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 sm:mt-0 ${selectedDesign.isOwner ? 'sm:ml-3' : 'sm:ml-0'} sm:w-auto sm:text-sm`}
                  onClick={() => setSelectedDesign(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CakeDesigns;