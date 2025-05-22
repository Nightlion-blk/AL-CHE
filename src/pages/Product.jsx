import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';
import axios from 'axios';

// Changed props to accept modal properties instead of using URL params
const Product = ({ isOpen, onClose, productId }) => {
  const modalRef = useRef(null);
  const navigate = useNavigate();
  const { product, currency, addToCart, getCartCount, getUserCart, token } = useContext(ShopContext);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // ⚠️ IMPORTANT: All useEffect hooks must be declared here, in the same order every time
  
  // 1. First, your existing click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // 2. Your existing product data fetch effect
  useEffect(() => {
    if (isOpen && productId) {
      fetchProductData();
      setIsVisible(true);
    }
    return () => {
      // Reset state when modal closes
      setQuantity(1);
      setSelectedImageIndex(0);
    };
  }, [isOpen, productId]);
  
  // 3. Add the cart sync effect HERE, not later in the component
useEffect(() => {
  // Only fetch when necessary
  if (isOpen && token && productData) {
    // Add a small random delay to prevent exact simultaneous calls
    const delay = Math.random() * 400;
    
    const fetchTimeout = setTimeout(() => {
      // Use a flag in localStorage to prevent multiple components
      // from calling getUserCart at the same time
      const lastFetchTime = localStorage.getItem('lastCartFetch');
      const now = Date.now();
      
      if (!lastFetchTime || now - parseInt(lastFetchTime) > 2000) {
        // Set the flag before calling
        localStorage.setItem('lastCartFetch', now.toString());
        
        // Now call getUserCart
        getUserCart()
          .then(cartItems => {
            if (Array.isArray(cartItems) && productData) {
              const existingItem = cartItems.find(item => 
                item.productId === productData.id && item.itemType === 'product'
              );
              
              if (existingItem && existingItem.quantity !== quantity) {
                console.log(`Syncing quantity for ${productData.name}`);
                addToCart(productData.id, 'product', quantity, true);
              }
            }
          })
          .catch(err => console.log('Cart sync error:', err.message));
      }
    }, delay);
    
    return () => clearTimeout(fetchTimeout);
  }
}, [isOpen, token, productData, quantity]);
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const fetchProductData = async () => {
    try {
      setLoading(true);
      console.log('Fetching product data for ID:', productId);
      const existingProduct = product.find((p) => p.id === productId);
      if (existingProduct) {
        setProductData(existingProduct);
        setSelectedImageIndex(0);
      } else {
        const response = await axios.get(`http://localhost:8080/api/findProduct/${productId}`);
        if (response.data.success) {
          const formattedProduct = {
            ...response.data.product,
            // Handle both Images array and legacy Image object
            images: response.data.product.Image || [],
            image: response.data.product.Image?.[0]?.url || ''
          };
          setProductData(formattedProduct);
          setSelectedImageIndex(0);
        } else {
         console.log('Product not found');
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      console.log('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  
  const handleAddToCart = async () => {
    try {
      if (!productData) {
        return;
      }

      // Show loading toast
      console.log('Adding to cart...', { autoClose: false, toastId: 'adding-to-cart' });
      
      // Pass quantity directly instead of using a loop
      await addToCart(productData.id, 'product', quantity);
      
      await getUserCart(token);
      // Update cart count
      await getCartCount();
      
      // Update toast to success
      toast.dismiss('adding-to-cart');
     console.log(`${quantity} ${quantity > 1 ? 'items' : 'item'} added to cart`);
      
      setQuantity(1);
      onClose(); // Close modal after adding to cart
    } catch (error) {
      console.error('Error adding to cart:', error);
     console.log('Failed to add product to cart');
    }
  };
  // Get the current main image URL to display
  const getMainImageUrl = () => {
    if (!productData) return '/default-image.jpg';
    
    // If we have images array and it contains the selected index
    if (productData.images && productData.images.length > 0 && productData.images[selectedImageIndex]) {
      return productData.images[selectedImageIndex].url;
    }
    
    // Fallback to the primary image
    return productData.image || '/default-image.jpg';
  };

  // Return null when modal is closed
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4">
      <div 
        ref={modalRef}
        className={`bg-white rounded-lg w-full max-w-[95vw] sm:max-w-4xl max-h-[80vh] mt-16 sm:mt-0 overflow-y-auto relative transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-2 top-2 sm:right-4 sm:top-4 text-gray-500 hover:text-gray-800 z-20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black"></div>
          </div>
        ) : !productData ? (
          <div className="text-center py-16 px-4">
            <h2 className="text-2xl font-bold">Product Not Found</h2>
            <p className="mt-4">The product you're looking for doesn't exist or has been removed.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Product Images Section */}
              <div className="md:w-1/2 flex flex-col items-center">
                {/* Main Image */}
                <div className="w-full max-w-[400px] aspect-square overflow-hidden border-2 border-gray-300 mb-4 rounded-lg">
                  <img
                    src={getMainImageUrl()}
                    alt={productData.name || productData.Name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-image.jpg';
                    }}
                  />
                </div>
                
                {/* Thumbnails Gallery */}
                {productData.images && productData.images.length > 1 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {productData.images.map((image, index) => (
                      <div 
                        key={index} 
                        className={`w-16 h-16 border-2 cursor-pointer ${selectedImageIndex === index ? 'border-pink-500' : 'border-gray-300'}`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <img 
                          src={image.url} 
                          alt={`${productData.name || productData.Name} - View ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="md:w-1/2">
                <div className="pr-8">
                  <h1 className="text-2xl font-semibold mb-2">{productData.name || productData.Name}</h1>
                  <div className="text-xl font-medium mb-4">{currency}{productData.price || productData.Price}</div>
                  <div className="mb-6">
                    <p className="text-gray-700">{productData.description || productData.Description}</p>
                  </div>
                  <div className="flex items-center mb-6">
                    <label className="mr-4">Quantity:</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="border border-gray-300 px-3 py-1 w-20 rounded"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!token) {
                        console.log('Please login to add items to cart');
                      } else {
                        handleAddToCart();
                      }
                    }}
                    className="bg-black text-white px-8 py-3 text-sm active:bg-gray-700 rounded-lg"
                  >
                    ADD TO CART
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Product;
