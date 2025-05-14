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

    const getUserCart = async (token) => {
        console.log("Token changed:", token);
        if (!userName || !userName.id) {
            console.log("Cannot fetch cart: No user ID available");
            return;
        }
        
        console.log("Fetching cart for user:", userName.id);
        
        try {
            setLoading(true);
            
            const response = await axios.get(
                `http://localhost:8080/api/getCart/${userName.id}`, 
                {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.success) {
                const { items, cartId, status } = response.data;
                console.log("Cart items:", items);
                setCartHeader({
                    cartId: cartId || response.data.cartId,
                    status: status || 'active'
                });
                
                // Rest of your existing code
                const newCartItems = {};
                const detailedItems = [];
                
                if (Array.isArray(items)) {
                    items.forEach(item => {
                        newCartItems[item.productId._id] = item.quantity;

                        // Get image correctly from the Image array
                        let imageUrl = null;
                        if (item.productId.Image && Array.isArray(item.productId.Image) && item.productId.Image.length > 0) {
                            imageUrl = item.productId.Image[0].url;
                        } else if (item.productId.image) {
                            // Fallback to legacy image field if available
                            imageUrl = item.productId.image;
                        }

                        detailedItems.push({
                            cartItemId: item._id,
                            productId: item.productId._id,
                            name: item.productId.Name,
                            price: item.productId.Price,
                            quantity: item.quantity,
                            image: imageUrl,
                            description: item.productId.Description
                        });
                    });
                    
                    setCartItems(newCartItems);
                    setDetailedCartItems(detailedItems);
                    console.log("Cart loaded successfully");
                }
            }
        } catch (error) {
            console.error("Error fetching cart:", error);
            // Don't show error toast for 404 (no cart yet) or if server is down
            if (error.response?.status !== 404) {
                console.log("Error fetching cart:", userName.id);   
            }
        } finally {
            setLoading(false);
        }
    };

    // Add to cart function
    const addToCart = async (productId) => {
        if (!userName || !userName.id) {
            navigate('/login');
            return;
        }
        
        try {
            // Find the product
            const productToAdd = product.find(p => p.id === productId);
            
            if (!productToAdd) {
                return;
            }
            
            // Determine new quantity
            const currentQuantity = cartItems[productId] || 0;
            const newQuantity = currentQuantity + 1;
            
            // Update backend
            const response = await axios.post(
                'http://localhost:8080/api/addToCart',
                {
                    userId: userName.id,
                    productId: productId,
                    quantity: newQuantity,
                    price: productToAdd.price
                },
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
            }
        } catch (error) {
            console.error("Error adding to cart:", error);
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
                delete updatedCartItems[itemToDelete.productId];
                setCartItems(updatedCartItems);
                
                // Also update detailed items array
                setDetailedCartItems(detailedCartItems.filter(item => item.cartItemId !== itemId));
                
                console.log("Item deleted successfully");
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
            
            if (response.data) {
                console.log("Orders fetched successfully:", response.data);
    setOrders(response.data.orders || []);
            } else {
                console.error("Failed to load orders");
                setOrders([]);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
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