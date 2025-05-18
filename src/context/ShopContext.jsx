import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
export const ShopContext = createContext(null);
export const ShopContextProvider = ({ children }) => {
    const navigate = useNavigate();
    const [product, setProduct] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cartItems, setCartItems] = useState({});
    const [detailedCartItems, setDetailedCartItems] = useState([]);
    const [cartHeader, setCartHeader] = useState(null);
    const [userName, setUserName] = useState({ id: '', name: '', role: '', address: '', contacts: '', e_Mail: '' });
    const [token, setToken] = useState('');
    const [currency, setCurrency] = useState('₱');
    const [orders, setOrders] = useState([]);
    const [orderLoading, setOrderLoading] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const delivery_fee = 38;

    useEffect(() => {
        const storedToken = localStorage.getItem('Token');
        const storedUser = JSON.parse(localStorage.getItem('user'));
        
        if (!token) {
            setToken(storedToken);
            setUserName(storedUser);
            getAllProducts();
        }
    }, []);

    // Handle token expiration
    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                const currentTime = Date.now() / 1000; // Current time in seconds
                
                if (decoded.exp && decoded.exp < currentTime) {
                    // Token is already expired
                    console.log('Token has expired');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setToken('');
                    setUserName({ id: '', name: '' });
                    setCartItems({});
                    navigate('/login');
                } else if (decoded.exp) {
                    // Token is valid, set timer for auto-logout
                    const timeUntilExpiry = (decoded.exp - currentTime) * 1000; // Convert to milliseconds
                    const warningTime = Math.min(timeUntilExpiry - 60000, timeUntilExpiry * 0.1); // 1 minute before expiry or 10%
                    
                    console.log(`Token valid for ${Math.round(timeUntilExpiry/1000/60)} more minutes`);
                    
                    // Set timer for warning
                    const warningTimer = setTimeout(() => {
                    }, warningTime);
                    
                    // Set timer for logout
                    const logoutTimer = setTimeout(() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setToken('');
                        setUserName({ id: '', name: '' });
                        setCartItems({});
                        navigate('/login');
                    }, timeUntilExpiry);
                    
                    // Clean up timers on unmount
                    return () => {
                        clearTimeout(warningTimer);
                        clearTimeout(logoutTimer);
                    };
                }
            } catch (error) {
                // Invalid token format
                console.error('Error decoding token:', error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setToken('');
                setUserName({ id: '', name: '' });
                navigate('/login');
            }
        }
    }, [token, navigate]);

    const getAllProducts = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8080/api/allProducts');
            if (response.data.success) {
                // First, map all products with status information
                const allProducts = response.data.products.map(product => ({
                    id: product._id,
                    name: product.Name,
                    price: product.Price,
                    category: product.Category,
                    stock: product.StockQuantity,
                    // Handle both Images array and legacy Image object
                    images: product.Images || (product.Image ? [product.Image] : []),
                    // Keep the first image as the main display image for backwards compatibility
                    image: product.Images?.[0]?.url || product.Image?.url,
                    description: product.Description,
                    status: product.Status || 'Available', // Include status
                    isAvailable: product.Status === 'Available' || !product.Status // Flag for availability
                }));
                
                // Filter out products with 'Deleted' status
                const visibleProducts = allProducts.filter(product => product.status !== 'Deleted');
                
                console.log("Products fetched successfully:", visibleProducts);
                setProduct(visibleProducts);
                console.log("Products loaded successfully");
            } else {
                console.error("Failed to load products");
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch cart when token changes
    useEffect(() => {

        if (token && userName && userName.id) {
            console.log("Token and userName are set, fetching cart...");
            getUserCart(token); // Remove token parameter here
        }
    }, [token, userName]);

    // Set user from localStorage if available
    // Fetch cart data from backend

    // Update the getUserCart function to handle invalid products

    const getUserCart = async (userToken) => {
        if (!userName || !userName.id) {
            console.warn("No user ID available, skipping cart fetch");
            setLoading(false);
            return;
        }
        
        try {
            setLoading(true);
            console.log(`Attempting to fetch cart for user ID: ${userName.id}`);
            
            // Try the primary endpoint
            try {
                const response = await axios.get(
                    `http://localhost:8080/api/getCart/${userName.id}`,
                    {
                        headers: { 
                            'Authorization': `Bearer ${userToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                // Process response directly instead of calling processCartResponse
                if (response.data.success) {
                    console.log("Cart data from server:", response.data);
                    
                    // Set the cart header
                    if (response.data.cartHeader) {
                        setCartHeader(response.data.cartHeader);
                    }
                    
                    // Process cart items
                    const items = response.data.cartItems || [];
                    
                    // Prepare local cart state
                    const cartObject = {};
                    const detailedItems = [];
                    
                    // Process each cart item
                    items.forEach(item => {
                        // Process both regular products and custom cakes
                        if (item.itemType === 'product' && item.productId) {
                            // Regular product processing (unchanged)
                            cartObject[item.productId] = item.quantity;
                            
                            detailedItems.push({
                                cartItemId: item._id,
                                productId: item.productId,
                                name: item.name || 'Product',
                                price: item.price,
                                quantity: item.quantity,
                                image: item.image || 'default-product.jpg',
                                ProductImage: item.ProductImage,
                                description: item.description || '',
                                itemType: 'product',
                                isUnavailable: item.isUnavailable
                            });
                        } 
                        // Custom cake handling
                        else if (item.itemType === 'cake_design') {
                            // Fix: assign cartItemId as cakeDesignId if not provided
                            const designId = item.cakeDesignId || item._id;
                            
                            // Use cake_ prefix for the key
                            cartObject[`cake_${designId}`] = item.quantity;
                            
                            // Create detailed item with fixed fields
                            detailedItems.push({
                                cartItemId: item._id,
                                // Fix: Ensure cakeDesignId is set properly
                                cakeDesignId: designId,
                                name: item.name || 'Custom Cake Design',
                                price: item.price || 25, // Ensure there's always a price
                                quantity: item.quantity,
                                // Fix: Use any available image source
                                previewImage: item.previewImage || item.designSnapshot?.previewImage,
                                image: item.image || item.previewImage || item.designSnapshot?.previewImage || 'default-cake-image.jpg',
                                description: item.description || 'Custom cake design',
                                cakeOptions: item.cakeOptions || { size: 'medium', flavor: 'vanilla' },
                                itemType: 'cake_design',
                                isUnavailable: item.isUnavailable
                            });
                        }
                    });
                    
                    // Update state
                    setCartItems(cartObject);
                    setDetailedCartItems(detailedItems);
                    
                } else {
                    console.error("Error in cart response:", response.data.message);
                    toast.error("Could not load your cart");
                }
            } catch (primaryError) {
                console.warn("Primary endpoint failed, trying fallback endpoint...", primaryError);
                
                // Fallback to alternative endpoint format
                const fallbackResponse = await axios.get(
                    `http://localhost:8080/api/userCart/${userName.id}`, // Try alternative endpoint
                    {
                        headers: { 
                            'Authorization': `Bearer ${userToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                // Process fallback response directly - duplicate the processing code
                if (fallbackResponse.data.success) {
                    console.log("Cart data from server (fallback):", fallbackResponse.data);
                    
                    // Set the cart header
                    if (fallbackResponse.data.cartHeader) {
                        setCartHeader(fallbackResponse.data.cartHeader);
                    }
                    
                    // Process cart items
                    const items = fallbackResponse.data.cartItems || [];
                    
                    // Prepare local cart state
                    const cartObject = {};
                    const detailedItems = [];
                    
                    // Process each cart item
                    items.forEach(item => {
                        // Process both regular products and custom cakes
                        if (item.itemType === 'product' && item.productId) {
                            // Regular product processing (unchanged)
                            cartObject[item.productId] = item.quantity;
                            
                            detailedItems.push({
                                cartItemId: item._id,
                                productId: item.productId,
                                name: item.name || 'Product',
                                price: item.price,
                                quantity: item.quantity,
                                image: item.image || 'default-product.jpg',
                                ProductImage: item.ProductImage,
                                description: item.description || '',
                                itemType: 'product',
                                isUnavailable: item.isUnavailable
                            });
                        } 
                        // Custom cake handling
                        else if (item.itemType === 'cake_design') {
                            // Fix: assign cartItemId as cakeDesignId if not provided
                            const designId = item.cakeDesignId || item._id;
                            
                            // Use cake_ prefix for the key
                            cartObject[`cake_${designId}`] = item.quantity;
                            
                            // Create detailed item with fixed fields
                            detailedItems.push({
                                cartItemId: item._id,
                                // Fix: Ensure cakeDesignId is set properly
                                cakeDesignId: designId,
                                name: item.name || 'Custom Cake Design',
                                price: item.price || 25, // Ensure there's always a price
                                quantity: item.quantity,
                                // Fix: Use any available image source
                                previewImage: item.previewImage || item.designSnapshot?.previewImage,
                                image: item.image || item.previewImage || item.designSnapshot?.previewImage || 'default-cake-image.jpg',
                                description: item.description || 'Custom cake design',
                                cakeOptions: item.cakeOptions || { size: 'medium', flavor: 'vanilla' },
                                itemType: 'cake_design',
                                isUnavailable: item.isUnavailable
                            });
                        }
                    });
                    
                    // Update state
                    setCartItems(cartObject);
                    setDetailedCartItems(detailedItems);
                    
                } else {
                    console.error("Error in fallback cart response:", fallbackResponse.data.message);
                    toast.error("Could not load your cart");
                }
            }
        } catch (error) {
            console.error("All cart fetch attempts failed:", error);
            
            if (error.response) {
                console.log(`Server response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
                
                if (error.response.status === 404) {
                    toast.error("Cart service unavailable. Please try again later.");
                } else if (error.response.status === 401) {
                    toast.error("Session expired. Please log in again.");
                }
            } else if (error.request) {
                console.error("No response received from server");
                toast.error("Cannot connect to server. Please check your connection.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Add to cart function
    const addToCart = async (productId, itemType, cakeDesignId, cakeOptions, price, previewImage) => {
        if (!userName || !userName.id) {
            navigate('/login');
            return;
        }
        
        try {
            let productToAdd;
            let newCartKey;
            let requestData;
            
            if (itemType === 'product') {
                // Product handling - unchanged
                productToAdd = product.find(p => p.id === productId);
                
                if (!productToAdd) {
                    return;
                }
                
                const currentQuantity = cartItems[productId] || 0;
                const newQuantity = currentQuantity + 1;
                newCartKey = productId;
                
                // Request data for product
                requestData = {
                    userId: userName.id,
                    productId: productId,
                    quantity: newQuantity,
                    price: productToAdd.price,
                    itemType: 'product'
                };
            } else if (itemType === 'cake_design') {
                
                if (!cakeDesignId) {
                    console.error("Cake design ID is required");
                    return;
                }
                
                // New quantity for cake design
                const uniqueKey = `cake_${cakeDesignId}`;
                const currentQuantity = cartItems[uniqueKey] || 0;
                const newQuantity = currentQuantity + 1;
                newCartKey = uniqueKey;
                
                // Request data for cake design - fixed price and added previewImage
                requestData = {
                    userId: userName.id,
                    cakeDesignId: cakeDesignId,
                    quantity: newQuantity,
                    price: price, // Use the price passed in parameter
                    itemType: 'cake_design',
                    cakeOptions: cakeOptions,
                    previewImage: previewImage // Add the preview image
                };
            } else {
                console.error("Invalid item type:", itemType);
                return;
            }
            
            const response = await axios.post(
                'http://localhost:8080/api/addToCart',
                requestData,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.success) {
                // Log the actual response data for debugging
                console.log("Add to cart response:", response.data);
                
                // Option 1: Just update local state and wait for getUserCart
                const updatedItems = {...cartItems};
                updatedItems[newCartKey] = requestData.quantity;
                setCartItems(updatedItems);
                
                // Add the new item to detailedCartItems directly for immediate UI update
                if (itemType === 'product' && productToAdd) {
                    // Product UI update - unchanged
                    const existingItem = detailedCartItems.find(
                        item => item.productId === productId && item.itemType === 'product'
                    );
                    
                    if (existingItem) {
                        // Update quantity of existing item
                        setDetailedCartItems(detailedCartItems.map(item => 
                            (item.productId === productId && item.itemType === 'product')
                                ? {...item, quantity: requestData.quantity}
                                : item
                        ));
                    } else {
                        // Add new item to detailed items
                        setDetailedCartItems([
                            ...detailedCartItems,
                            {
                                cartItemId: response.data.cartItem._id,
                                productId: productId,
                                name: productToAdd.name,
                                price: productToAdd.price,
                                quantity: requestData.quantity,
                                image: productToAdd.image,
                                description: productToAdd.description,
                                itemType: 'product'
                            }
                        ]);
                    }
                } 
                // NEW BLOCK: Similar immediate UI update for cake designs
                else if (itemType === 'cake_design') {
                    const existingItem = detailedCartItems.find(
                        item => item.cakeDesignId === cakeDesignId && item.itemType === 'cake_design'
                    );
                    
                    if (existingItem) {
                        // Update quantity of existing cake design
                        setDetailedCartItems(detailedCartItems.map(item => 
                            (item.cakeDesignId === cakeDesignId && item.itemType === 'cake_design')
                                ? {...item, quantity: requestData.quantity}
                                : item
                        ));
                    } else {
                        // Add new cake design to detailed items
                        const designName = cakeOptions?.name || "Custom Cake Design";
                        setDetailedCartItems([
                            ...detailedCartItems,
                            {
                                cartItemId: response.data.cartItem._id,
                                cakeDesignId: cakeDesignId, // Store the actual ID here
                                name: `Custom Cake: ${designName}`,
                                price: price,
                                quantity: requestData.quantity,
                                previewImage: previewImage, // Store preview image
                                image: previewImage || 'default-cake-image.jpg', // For backwards compatibility
                                description: 'Custom cake design',
                                cakeOptions: cakeOptions || {},
                                itemType: 'cake_design'
                            }
                        ]);
                    }
                }
                
                // Then refresh from server after a small delay
                /*
                setTimeout(() => {
                    getUserCart(token);
                }, 300);
                */
                
                // Success message
                toast.success(itemType === 'product' 
                    ? 'Product added to cart' 
                    : 'Custom cake added to cart'
                );
            }
        } catch (error) {
            console.error("Error adding to cart:", error);
            toast.error("Failed to add item to cart");
        }
    };
    // Delete item from cart

    const deleteItemsCart = async (itemId) => {
        try {
            if (!userName || !userName.id) {
                return;
            }
            
            console.log("Deleting cart item ID:", itemId, "for user:", userName.id);
            
            // Find the item to delete in detailedCartItems
            const itemToDelete = detailedCartItems.find(item => item.cartItemId === itemId);
            
            if (!itemToDelete) {
                // Refresh from server to ensure consistency
                getUserCart(token);
                return;
            }
            
            // Make the DELETE request
            const response = await axios.delete(
                `http://localhost:8080/api/deleteFromCart/${userName.id}/${itemId}`,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}` 
                    }
                }
            );
            
            // Check if operation was successful before updating local state
            if (response.data && response.data.success) {
                // Create a copy of cart items AFTER confirmation from server
                const updatedCartItems = {...cartItems};
                
                // Handle both product and cake design items
                if (itemToDelete.itemType === 'product' && itemToDelete.productId) {
                    delete updatedCartItems[itemToDelete.productId];
                } else if (itemToDelete.itemType === 'cake_design' && itemToDelete.cakeDesignId) {
                    delete updatedCartItems[`cake_${itemToDelete.cakeDesignId}`];
                }
                
                setCartItems(updatedCartItems);
                
                // Also update detailed items array
                setDetailedCartItems(detailedCartItems.filter(item => item.cartItemId !== itemId));
                
                console.log("Item deleted successfully");
                toast.success("Item removed from cart");
            } else {
                // Handle unsuccessful deletion
                // Refresh cart to ensure consistency
                getUserCart(token);
            }
        } catch (error) {
            console.error("Server sync failed:", error);
            
            // Refresh the cart to resync with the server
            getUserCart(token);
        }
    };

    // Helper function to add a custom cake design to cart
    const addCustomCakeToCart = async (cakeDesign, options, price) => {
        if (!userName || !userName.id) {
            navigate('/login');
            return;
        }
        
        if (!cakeDesign || !cakeDesign._id) {
            toast.error("Invalid cake design");
            return;
        }
        
        try {
            // Add custom cake to cart
            await addToCart(
                null, // No product ID for cake designs
                'cake_design', 
                cakeDesign._id, 
                options, 
                price,
                cakeDesign.previewImage // Add the preview image directly
            );
            
            toast.success("Custom cake added to cart!");
            // Optionally navigate to cart
            navigate('/cart');
        } catch (error) {
            console.error("Error adding custom cake to cart:", error);
            toast.error("Failed to add custom cake to cart");
        }
    };

     const clearCart = async () => {
        try {
          setCartItems({});
          setCartCount(0);
          setCartHeader(null);
          
          // If you're storing cart in local storage, clear it
          localStorage.removeItem('cartItems');
          localStorage.removeItem('cartCount');
          localStorage.removeItem('cartHeader');
          
          console.log('Cart cleared successfully');
        } catch (error) {
          console.error('Error clearing cart:', error);
        }
      };
      
    // Update item quantity
    const updateQuantity = async (productId, newQuantity) => {
        try {
            if (!userName || !userName.id) {
                navigate('/login');
                return;
            }
            
            if (newQuantity === 0) {
                // Find cart item ID for this product
                const itemToDelete = detailedCartItems.find(item => item.productId === productId);
                if (itemToDelete) {
                    deleteItemsCart(itemToDelete.cartItemId);
                }
                return;
            }
            
            // Find cart item ID for this product
            const cartItem = detailedCartItems.find(item => item.productId === productId);
            
            if (!cartItem) {
                return;
            }
            
            const response = await axios.put(
                `http://localhost:8080/api/updateCartItem/${userName.id}/${cartItem.cartItemId}`,
                { quantity: newQuantity },
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' 
                    }
                }
            );
            
            if (response.data.success) {
                // Update local state
                const updatedItems = {...cartItems};
                updatedItems[productId] = newQuantity;
                setCartItems(updatedItems);
                
                // Update detailed items
                setDetailedCartItems(
                    detailedCartItems.map(item => 
                        item.productId === productId 
                            ? {...item, quantity: newQuantity} 
                            : item
                    )
                );
            }
        } catch (error) {
            console.error("Error updating quantity:", error);
        }
    };

    // Get cart total amount
    const getCartAmount = () => {
        let totalAmount = 0;
        
        detailedCartItems.forEach(item => {
            // Each item already contains price and quantity
            const price = parseFloat(item.price);
            totalAmount += price * item.quantity;
        });
        
        console.log("Cart total amount:", totalAmount);
        return totalAmount;
    };

    // Get cart item count
    const getCartCount = () => {
        let count = 0;
        for (const id in detailedCartItems) {
            count += detailedCartItems[id].quantity;
        }
        console.log("Cart count:", count);
        return count;
    };

    const getOrderById = async (orderId) => {
        if (!token || !userName.id) {
            navigate('/login');
            return;
        }
        
        try {
            setOrderLoading(true);
            
            const response = await axios.get(
                `http://localhost:8080/api/orders/${orderId}`,
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data) {
                console.log("Order details fetched:", response.data);
                setCurrentOrder(response.data);
                return response.data;
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error fetching order details:", error);
          
            return null;
        } finally {
            setOrderLoading(false);
        }
    };

   const fetchUserOrders = async () => {
  if (!token || !userName || !userName.id) {
    console.log("Cannot fetch orders: No authenticated user");
    toast.error("Please log in to view your orders");
    navigate('/login');
    return;
  }
  
  try {
    setOrderLoading(true);
    
    const response = await axios.get(
      `http://localhost:8080/api/orders/myorders/${userName.id}`,
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.success) {
      console.log("Orders fetched successfully:", response.data);
      
      // Set orders state with the formatted orders array
      setOrders(response.data.orders || []);
      
      // Track orders with custom cakes separately if needed
      const customCakeOrders = response.data.orders.filter(order => order.hasCustomCakes);
      if (customCakeOrders.length > 0) {
        console.log(`You have ${customCakeOrders.length} orders with custom cakes`);
        // You could set these in a separate state if needed:
        // setCustomCakeOrders(customCakeOrders);
      }
    } else {
      console.error("Failed to load orders:", response.data?.message || "Unknown error");
      toast.error("Could not load your orders");
      setOrders([]);
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    
    // More detailed error handling
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      if (status === 401 || status === 403) {
        toast.error("Your session has expired. Please log in again.");
        // Optionally logout user here
      } else {
        toast.error(`Error: ${error.response.data?.message || "Failed to load orders"}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      toast.error("Server not responding. Please try again later.");
    } else {
      // Something happened in setting up the request
      toast.error("Error loading orders");
    }
    
    setOrders([]);
  } finally {
    setOrderLoading(false);
  }
};

    useEffect(() => {
        if (token && userName && userName.id) {
            console.log("Token and userName are set, fetching orders...");
            fetchUserOrders();
        }
    }, [token, userName]);
    
    // Context value
    const contextValue = {
        product,
        setProduct,
        cartItems,
        setCartItems,
        userName,
        setUserName,
        token,
        setToken,
        currency,
        loading,
        detailedCartItems,
        setDetailedCartItems,
        navigate,
        addToCart,
  
        addCustomCakeToCart,

        updateQuantity,
        deleteItemsCart,
        getCartAmount,
        getCartCount,
        getUserCart,
        delivery_fee,
        cartHeader,
        clearCart,
        orders,
        orderLoading,
        currentOrder,
        fetchUserOrders,
        getOrderById,
    };

    return (

        <ShopContext.Provider value={contextValue}>
            {children}
        </ShopContext.Provider>

    );
};
export default ShopContextProvider;