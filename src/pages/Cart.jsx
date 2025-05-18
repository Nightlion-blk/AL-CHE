import React, { useContext, useState, useEffect } from 'react';
import Title from '../components/Title';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';
import { toast } from 'react-toastify';
import CheckoutButton from '../components/CheckoutButton';
import axios from 'axios';

const Cart = () => {
  const { 
    currency, 
    navigate, 
    updateQuantity, 
    deleteItemsCart,
    loading,
    token,
    userName,
    detailedCartItems,
    cartHeader
  } = useContext(ShopContext);

  const [isVisible, setIsVisible] = useState(false); // State for animation
  
  // Ensure detailedCartItems is always an array
  const cartItems = Array.isArray(detailedCartItems) ? detailedCartItems : [];

  const defaultImageUrl = assets.image1 || "/default-product.jpg";

  useEffect(() => {
    // Fade-in animation when the component is mounted
    setIsVisible(true);
  }, []);

  useEffect(() => {
    // Debug log to see what's happening with detailedCartItems
    console.log("detailedCartItems:", detailedCartItems);
    if (detailedCartItems && !Array.isArray(detailedCartItems)) {
      console.error("detailedCartItems is not an array:", typeof detailedCartItems);
    }
  }, [detailedCartItems]);

  // Add this useEffect to track the source of your cart items:
  useEffect(() => {
    if (Array.isArray(detailedCartItems)) {
      // Filter only cake design items to reduce log noise
      const cakeItems = detailedCartItems.filter(item => item.itemType === 'cake_design');
      if (cakeItems.length > 0) {
        console.log('CAKE DESIGNS IN CART:', cakeItems);
      }
    }
  }, [detailedCartItems]);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity > 0) {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleDeleteItem = (cartItemId) => {
    // Confirm before deleting
    if (window.confirm('Are you sure you want to remove this item?')) {
      deleteItemsCart(cartItemId);
    }
  };
  
  // Function to get the image URL considering the new schema
  const getProductImageUrl = (item) => {
    if (!item) return defaultImageUrl;
    
    // Special handling for custom cake designs
    if (item.itemType === 'cake_design') {
      console.log('Cake item image sources:', {
        previewImage: item.previewImage,
        designSnapshot: item.designSnapshot?.previewImage,
        image: item.image
      });
      
      // Priority chain for cake images
      if (item.previewImage) {
        return item.previewImage;
      }
      
      if (item.designSnapshot && item.designSnapshot.previewImage) {
        return item.designSnapshot.previewImage;
      }
      
      if (item.image && item.image !== 'default-cake-image.jpg') {
        return item.image;
      }
      
      // If we made it here, use placeholder
      // Make sure '/cake-placeholder.png' exists in your public folder
      return "/cake-placeholder.png";
    }
    
    // Regular product image handling (unchanged)
    if (item.productId && typeof item.productId === 'object') {
      if (item.productId.Image && Array.isArray(item.productId.Image) && item.productId.Image.length > 0) {
        return item.productId.Image[0].url;
      }
      
      if (item.productId.image) {
        return item.productId.image;
      }
    }
    
    if (item.ProductImage) {
      return item.ProductImage;
    }
    
    if (item.image) {
      return item.image;
    }
    
    return defaultImageUrl;
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    const userEmail = localStorage.getItem('userEmail') || 'customer@example.com';
    const demoShippingDetails = {
      name: "Customer Name",
      email: userEmail,
      phone: "09123456789",
      address: "123 Demo Street",
      city: "Manila",
      state: "Metro Manila",
      postalCode: "1000",
      country: "PH"
    };

    try {
      if (!cartHeader?.cartId) {
        toast.error("Cart information is missing");
        return;
      }

      const response = await axios.post(
        'http://localhost:8080/api/checkout', 
        { 
          userId: userName.id,
          cartId: cartHeader.cartId,
          shippingDetails: demoShippingDetails,
          billingDetails: demoShippingDetails // Using same details for billing
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Access the checkoutUrl correctly based on your backend response structure
      window.location.href = response.data.data.checkoutUrl;
    } catch (error) {
      console.error('Checkout error:', error.response?.data || error.message);
      toast.error('Payment processing failed. Please try again.');
    }
  };

  const calculateTotalInCentavos = () => {
    if (!Array.isArray(cartItems)) return 0;
    
    const total = cartItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    // Convert to centavos (multiply by 100)
    return Math.round(total * 100);
  };

  return (
    <div
      className={`transition-opacity duration-1000 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className='border-t pt-14'>
        <div className='text-2xl mb-3'>
          <Title text1={'YOUR'} text2={'CART'} />
        </div>

        {loading ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">Loading your cart...</p>
          </div>
        ) : !Array.isArray(cartItems) || cartItems.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">Your cart is empty</p>
            <button 
              onClick={() => navigate('/shop')} 
              className="mt-4 bg-black text-white px-6 py-2"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div>
              {cartItems.map((item) => {
                // Debug logging for item data
                console.log('Cart Item Details:', {
                  id: item.cartItemId,
                  name: item.name,
                  type: item.itemType,
                  price: item.price,
                  quantity: item.quantity,
                  productId: item.productId,
                  cakeDesignId: item.cakeDesignId,
                  previewImage: item.previewImage,
                  designSnapshot: item.designSnapshot,
                  cakeOptions: item.cakeOptions,
                  resolvedImageUrl: getProductImageUrl(item),
                  rawItem: item
                });
                
                return (
                  <div key={item.cartItemId || `item-${Math.random()}`} className='py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4'>
                    <div className='flex items-start gap-6'>
                      <img 
                        className={`w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md ${item.isUnavailable ? 'opacity-50' : ''} ${item.itemType === 'cake_design' ? 'border-2 border-pink-200' : ''}`}
                        src={getProductImageUrl(item)} 
                        alt={item.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = item.itemType === 'cake_design' 
                            ? "/cake-placeholder.png" 
                            : defaultImageUrl;
                        }}
                      />
                      <div>
                        <p className='text-xs sm:text-lg font-medium'>
                          {item.name}
                          {item.isUnavailable && (
                            <span className="ml-2 text-xs text-red-500">
                              (No longer available)
                            </span>
                          )}
                        </p>
                        <div className='flex flex-wrap items-center gap-2 mt-2'>
                          <p>{currency}{item.price}</p>
                          {item.itemType === 'cake_design' && (
                            <span className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">
                              Custom Cake
                            </span>
                          )}
                          
                          {/* Show cake options if available */}
                          {item.itemType === 'cake_design' && item.cakeOptions && (
                            <div className="w-full mt-1 text-xs text-gray-500">
                              {item.cakeOptions.flavor && (
                                <span className="mr-2">Flavor: {item.cakeOptions.flavor}</span>
                              )}
                              {item.cakeOptions.size && (
                                <span className="mr-2">Size: {item.cakeOptions.size}</span>
                              )}
                              {item.cakeOptions.tier && (
                                <span>Tier: {item.cakeOptions.tier}</span>
                              )}
                              {item.cakeOptions.message && (
                                <div className="mt-1">
                                  <span>Message: "{item.cakeOptions.message}"</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <input 
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        // Use cartItemId as fallback if cakeDesignId is missing
                        if (item.itemType === 'cake_design') {
                          // For cake designs, prefer cakeDesignId but fall back to cartItemId if needed
                          const designKey = `cake_${item.cakeDesignId || item.cartItemId}`;
                          handleQuantityChange(designKey, value);
                        } else {
                          // For regular products
                          handleQuantityChange(item.productId, value);
                        }
                      }} 
                      className='border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1' 
                      type="number" 
                      min={1} 
                      value={item.quantity}
                      disabled={item.isUnavailable}
                    />
                    <img 
                      onClick={() => handleDeleteItem(item.cartItemId)} 
                      className='w-4 mr-4 sm:w-5 cursor-pointer' 
                      src={assets.bin_icon} 
                      alt="Remove item" 
                    />
                  </div>
                );
              })}
            </div>

            <div className='flex justify-end my-20'>
              <div className='w-full sm:w-[450px]'>
                <CartTotal />
                <div className='w-full text-end'>
                  <button 
                    onClick={() => navigate(`/checkout/${userName.id}`)}
                    className='bg-black text-white text-sm my-8 px-8 py-3'
                  >
                    PROCEED TO CHECKOUT
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;