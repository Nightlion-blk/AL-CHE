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

  const [isVisible, setIsVisible] = useState(false); // State for fade-in animation

  const defaultImageUrl = assets.image1 || "/default-product.jpg";

  useEffect(() => {
    // Trigger fade-in animation when the component is mounted
    setIsVisible(true);
  }, []);

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
    // Check if item has the productId populated with the full product object
    if (item.productId && typeof item.productId === 'object') {
      // Case 1: Product has new Image array structure
      if (item.productId.Image && Array.isArray(item.productId.Image) && item.productId.Image.length > 0) {
        return item.productId.Image[0].url;
      }
      
      // Case 2: Product has direct image property (legacy)
      if (item.productId.image) {
        return item.productId.image;
      }
    }
    
    // Case 3: Cart item has direct image URL (from ProductImage field)
    if (item.ProductImage) {
      return item.ProductImage;
    }
    
    // Case 4: Cart item has image URL (legacy)
    if (item.image) {
      return item.image;
    }
    
    // Default fallback
    return defaultImageUrl;
  };

  const handleCheckout = async () => {
    if (detailedCartItems.length === 0) {
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
    const total = detailedCartItems.reduce((sum, item) => {
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
        ) : detailedCartItems.length === 0 ? (
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
              {detailedCartItems.map((item) => (
                <div key={item.cartItemId} className='py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4'>
                  <div className='flex items-start gap-6'>
                    <img 
                      className='w-16 sm:w-20' 
                      src={getProductImageUrl(item)} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = defaultImageUrl;
                      }}
                    />
                    <div>
                      <p className='text-xs sm:text-lg font-medium'>{item.name}</p>
                      <div className='flex items-center gap-5 mt-2'>
                        <p>{currency}{item.price}</p>
                      </div>
                    </div>
                  </div>
                  <input 
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      handleQuantityChange(item.productId, value);
                    }} 
                    className='border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1' 
                    type="number" 
                    min={1} 
                    value={item.quantity} 
                  />
                  <img 
                    onClick={() => handleDeleteItem(item.cartItemId)} 
                    className='w-4 mr-4 sm:w-5 cursor-pointer' 
                    src={assets.bin_icon} 
                    alt="Remove item" 
                  />
                </div>
              ))}
            </div>

            <div className='flex justify-end my-20'>
              <div className='w-full sm:w-[450px]'>
                <CartTotal />
                <div className='w-full text-end'>
                  <button 
                    onClick={() => navigate(`/checkout/${userName.id}`)} // Adjust the URL as needed
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