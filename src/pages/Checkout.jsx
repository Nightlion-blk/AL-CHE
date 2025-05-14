import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Checkout = () => {
  const { token, currency, userName, detailedCartItems, cartHeader } = useContext(ShopContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [processingCheckout, setProcessingCheckout] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  const { cartId } = useParams();
  const [checkoutId, setCheckoutId] = useState(''); // Add this state for tracking
  
  // Add checkout abandonment tracking
  useEffect(() => {
    // Only run if we have a cartId and are in checkout process
    if (!cartHeader?.cartId || !processingCheckout) return;
    
    // Flag to track if checkout is being abandoned
    let isLeavingCheckout = false;
    
    // Handler for when user attempts to leave page
    const handleBeforeUnload = (e) => {
      // Only mark as abandoned if this is a genuine navigation away
      if (!isLeavingCheckout) {
        isLeavingCheckout = true;
        
        // Use sendBeacon for more reliable delivery during page unload
        if (navigator.sendBeacon) {
          const data = new FormData();
          data.append('checkoutId', checkoutId || localStorage.getItem('last_checkout_reference'));
          data.append('cartId', cartHeader.cartId);
          data.append('reason', 'browser_closed');
          
          navigator.sendBeacon('/api/checkout/mark-abandoning-beacon', data);
        } else {
          // Fallback to regular AJAX
          try {
            // Using fetch with keepalive which works better than axios for page unload
            fetch('http://localhost:8080/api/checkout/mark-abandoning', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                checkoutId: checkoutId || localStorage.getItem('last_checkout_reference'),
                cartId: cartHeader.cartId,
                reason: 'browser_closed'
              }),
              keepalive: true
            });
          } catch (error) {
            console.error('Failed to mark checkout as abandoning:', error);
          }
        }
      }
      
      // Show a confirmation message (browser dependent)
      e.returnValue = 'Are you sure you want to leave? Your checkout progress will be saved.';
      return e.returnValue;
    };
    
    // Handle back/forward navigation
    const handlePopState = () => {
      if (!isLeavingCheckout) {
        isLeavingCheckout = true;
        
        // Notify backend about navigation away
        axios.post('http://localhost:8080/api/checkout/mark-abandoning', { 
          checkoutId: checkoutId || localStorage.getItem('last_checkout_reference'),
          cartId: cartHeader.cartId, 
          reason: 'navigation_away'
        }).catch(err => {
          console.error('Failed to mark checkout as abandoning:', err);
        });
      }
    };
    
    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [processingCheckout, cartHeader, checkoutId]);
  
  const [shippingDetails, setShippingDetails] = useState({
    fullName: '', // Make sure this is 'fullName' not 'name'
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: ''
  });
  
  const [billingDetails, setBillingDetails] = useState({
    fullName: '', // Make sure this is 'fullName' not 'name'
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: ''
  });
  
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('online');
  
  // Pre-fill shipping details with user data if available
  useEffect(() => {
    if (userName) {
      // Pre-fill with user data if available
      setShippingDetails(prev => ({ 
        ...prev,
        fullName: userName.name
          ? `${userName.name}` 
          : '',
        email: userName.e_Mail || '',
        phone: userName.contacts || ''
      }));
    }
  }, [userName]);
  
  // Calculate cart total whenever detailedCartItems changes
  useEffect(() => {
    if (detailedCartItems && detailedCartItems.length > 0) {
      const total = detailedCartItems.reduce(
        (sum, item) => sum + (parseFloat(item.price) * item.quantity), 
        0
      );
      setCartTotal(total);
      setLoading(false); // Set loading to false once we have items
    } else {
      setLoading(false); // Also set loading to false if there are no items
    }
    
    // Log the first item to debug image structure
    if (detailedCartItems && detailedCartItems.length > 0) {
      console.log("First item in cart:", detailedCartItems[0]);
    }
  }, [detailedCartItems]);
  
  // Check for login token
  useEffect(() => {
    if (!token) {
      toast.error("Please login to access checkout");
      navigate('/login');
      return;
    }
  }, [token, navigate]);
  
  useEffect(() => {
    if (sameAsShipping) {
      setBillingDetails(shippingDetails);
    }
  }, [sameAsShipping, shippingDetails]);

  const handleShippingChange = (e) => {
    setShippingDetails({
      ...shippingDetails,
      [e.target.name]: e.target.value
    });
    
    if (sameAsShipping) {
      setBillingDetails({
        ...billingDetails,
        [e.target.name]: e.target.value
      });
    }
  };
  
  const handleBillingChange = (e) => {
    setBillingDetails({
      ...billingDetails,
      [e.target.name]: e.target.value
    });
  };
  
  const handleCheckboxChange = (e) => {
    setSameAsShipping(e.target.checked);
    if (e.target.checked) {
      setBillingDetails(shippingDetails);
    }
  };
  
  // Validate form fields (add this function)
  const validateFields = () => {
    // Check shipping details
    for (const key in shippingDetails) {
      if (!shippingDetails[key]) {
        toast.error(`Please fill in your shipping ${key}`);
        return false;
      }
    }
    
    // Only check billing details if different from shipping
    if (!sameAsShipping) {
      for (const key in billingDetails) {
        if (!billingDetails[key]) {
          toast.error(`Please fill in your billing ${key}`);
          return false;
        }
      }
    }
    
    return true;
  };
  
  // Update your handleSubmit function:

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      toast.error("Please login to proceed");
      navigate('/login?redirect=/checkout');
      return;
    }
    
    // Prevent double submission
    if (processingCheckout) {
      return;
    }
    
    // Validate form fields
    if (!validateFields()) {
      return;
    }
    
    setProcessingCheckout(true);
    const API_URL = 'http://localhost:8080';
    
    try {
      const paymentMethod = selectedPaymentMethod;
      
      if (paymentMethod === 'cod') {
        // COD flow remains unchanged
        const orderResponse = await axios.post(
          `${API_URL}/api/orders/createOrder`,
          {
            userId: userName.id,
            cartId: cartHeader.cartId,
            paymentMethod: 'COD',
            shippingDetails: {
              ...shippingDetails,
              country: 'PH'
            }
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        
        if (orderResponse.data.success) {
          toast.success('Order placed successfully!');
          navigate(`/orders/${orderResponse.data.orderId}`);
        } else {
          toast.error(orderResponse.data.message || "Failed to create order");
        }
      } else {
        try {
          console.log("Creating checkout with cart ID:", cartHeader.cartId);
          
          // Create checkout session directly
          const response = await axios.post(
            `${API_URL}/api/checkout`,
            {
              userId: userName.id,
              cartId: cartHeader.cartId,
              // Include formatted line items with proper amounts
              lineItems: detailedCartItems.map(item => ({
                productId: item._id || item.productId,
                name: item.name || item.productName,
                quantity: item.quantity,
                amount: Math.round(parseFloat(item.price) * 100) // Convert to cents for PayMongo
              })),
              shippingDetails: {
                ...shippingDetails,
                email: shippingDetails.email || userName?.email,
                phone: shippingDetails.phone || userName?.phone,
                country: 'PH'
              },
              billingDetails: sameAsShipping 
                ? { 
                    ...shippingDetails, 
                    email: shippingDetails.email || userName?.email,
                    phone: shippingDetails.phone || userName?.phone,
                    country: 'PH' 
                  } 
                : { 
                    ...billingDetails, 
                    email: billingDetails.email || userName?.email,
                    phone: billingDetails.phone || userName?.phone,
                    country: 'PH' 
                  },
              cancelUrl: `${window.location.origin}/checkout/cancel`,
              failureUrl: `${window.location.origin}/checkout/cancel`
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            }
          );
          
          if (response.data.success) {
            // Store necessary information in localStorage
            localStorage.setItem('last_checkout_cart_id', cartHeader.cartId);
            localStorage.setItem('last_checkout_timestamp', Date.now().toString());
            
            // Store checkout ID for abandonment tracking
            if (response.data.data.checkoutId) {
              setCheckoutId(response.data.data.checkoutId);
              localStorage.setItem('last_checkout_id', response.data.data.checkoutId);
            }
            
            // Store reference number instead of order ID
            if (response.data.data.referenceNumber) {
              localStorage.setItem('last_checkout_reference', response.data.data.referenceNumber);
            }
            
            localStorage.setItem('last_checkout_shipping', JSON.stringify({
              ...shippingDetails,
              country: 'PH'
            }));
            
            // Redirect to PayMongo
            console.log("Redirecting to:", response.data.data.checkoutUrl);
            window.location.href = response.data.data.checkoutUrl;
          } else {
            toast.error(response.data.message || "Failed to create checkout session");
          }
        } catch (error) {
          console.error("Checkout error:", error);
          if (error.response) {
            console.error("Error response:", error.response.data);
          }
          toast.error(error.response?.data?.message || "Error processing checkout");
        }
      }
    } catch (error) {
      console.error("Checkout error:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
      }
      toast.error(error.response?.data?.message || "Error processing checkout");
    } finally {
      setProcessingCheckout(false);
    }
};
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      {detailedCartItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-xl">Your cart is empty</p>
          <button 
            onClick={() => navigate('/shop')}
            className="mt-4 bg-black text-white px-6 py-2"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-gray-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                {detailedCartItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                    {/* Product Image - Fixed to handle multiple image structures */}
                    <div className="w-16 h-16 flex-shrink-0">
                        {item.image ? (
                        <img 
                            src={typeof item.image === 'string' ? item.image : item.image.url} 
                            alt={item.name || 'Product'} 
                            className="w-full h-full object-cover rounded"
                            onError={(e) => {
                              console.log("Failed to load image:", item.image);
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/150";
                            }}
                        />
                        ) : (
                        <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-400">
                            No Image
                        </div>
                        )}
                    </div>
                    
                    {/* Product Details */}
                    <div className="flex-1">
                        <p className="font-medium">{item.name || item.productName || 'Product'}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    
                    {/* Price */}
                    <p className="font-medium">
                        {currency}{(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </p>
                    </div>
                ))}
                </div>
    
              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold">
                  <p>Total</p>
                  <p>{currency}{cartTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Checkout Form */}
          <div className="lg:w-2/3">
            <form onSubmit={handleSubmit}>
              {/* Shipping Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">Full Name</label>
                    <input
                      type="text"
                      name="fullName" 
                      value={shippingDetails.fullName} // Changed from username to fullName
                      onChange={handleShippingChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={shippingDetails.email}
                      onChange={handleShippingChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={shippingDetails.phone}
                      onChange={handleShippingChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={shippingDetails.address}
                      onChange={handleShippingChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={shippingDetails.city}
                      onChange={handleShippingChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1">State/Province</label>
                    <input
                      type="text"
                      name="state"
                      value={shippingDetails.state}
                      onChange={handleShippingChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1">Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={shippingDetails.postalCode}
                      onChange={handleShippingChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Billing Information */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="sameAsShipping"
                    checked={sameAsShipping}
                    onChange={handleCheckboxChange}
                    className="mr-2"
                  />
                  <label htmlFor="sameAsShipping">Billing address same as shipping</label>
                </div>
                
                {!sameAsShipping && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Billing Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Billing form fields */}
                      <div>
                        <label className="block mb-1">Full Name</label>
                        <input
                          type="text"
                          name="fullName"
                          value={billingDetails.fullName}
                          onChange={handleBillingChange}
                          className="w-full border border-gray-300 px-3 py-2 rounded"
                          required
                        />
                      </div>
                      
                      {/* Rest of billing fields */}
                      <div>
                        <label className="block mb-1">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={billingDetails.email}
                          onChange={handleBillingChange}
                          className="w-full border border-gray-300 px-3 py-2 rounded"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block mb-1">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={billingDetails.phone}
                          onChange={handleBillingChange}
                          className="w-full border border-gray-300 px-3 py-2 rounded"
                          required
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block mb-1">Address</label>
                        <input
                          type="text"
                          name="address"
                          value={billingDetails.address}
                          onChange={handleBillingChange}
                          className="w-full border border-gray-300 px-3 py-2 rounded"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block mb-1">City</label>
                        <input
                          type="text"
                          name="city"
                          value={billingDetails.city}
                          onChange={handleBillingChange}
                          className="w-full border border-gray-300 px-3 py-2 rounded"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block mb-1">State/Province</label>
                        <input
                          type="text"
                          name="state"
                          value={billingDetails.state}
                          onChange={handleBillingChange}
                          className="w-full border border-gray-300 px-3 py-2 rounded"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block mb-1">Postal Code</label>
                        <input
                          type="text"
                          name="postalCode"
                          value={billingDetails.postalCode}
                          onChange={handleBillingChange}
                          className="w-full border border-gray-300 px-3 py-2 rounded"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method Selection */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="online-payment"
                      name="payment-method"
                      value="online"
                      checked={selectedPaymentMethod === 'online'}
                      onChange={() => setSelectedPaymentMethod('online')}
                      className="mr-2"
                    />
                    <label htmlFor="online-payment">Online Payment (Card, GCash, GrabPay)</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="cod-payment"
                      name="payment-method"
                      value="cod"
                      checked={selectedPaymentMethod === 'cod'}
                      onChange={() => setSelectedPaymentMethod('cod')}
                      className="mr-2"
                    />
                    <label htmlFor="cod-payment">Cash on Delivery</label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="bg-gray-200 text-gray-800 px-6 py-3 rounded"
                >
                  Back to Cart
                </button>
                
                <button
                  type="submit"
                  disabled={processingCheckout}
                  className="bg-black text-white px-8 py-3 rounded disabled:bg-gray-400"
                >
                  {processingCheckout ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;