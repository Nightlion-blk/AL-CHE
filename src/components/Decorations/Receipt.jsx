import React, { useState, useEffect, useRef } from "react";
import { ShoppingCart } from "lucide-react";
import { toast } from "react-toastify";
import { useCakeContext } from "../../context/CakeContext";

const Receipt = ({ 
  isVisible, 
  onClose, 
  design,
  designName, 
  captureThreeCanvas, 
  token, 
  addCustomCakeToCart,
  saveCakeDesign,
  onAddToCartSuccess
}) => {
    const {cakeState} = useCakeContext();
    const designData = design || cakeState;
    const printRef = useRef();
    const [orderConfirmed, setOrderConfirmed] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };
    
    const handlePrint = () => {
        const printContent = printRef.current.innerHTML;
        const originalContent = document.body.innerHTML;
        
        document.body.innerHTML = `
            <div style="padding: 20px;">
                <h1 style="text-align: center; color: #ec4899;">Forever Cakes</h1>
                ${printContent}
            </div>
        `;
        
        window.print();
        document.body.innerHTML = originalContent;
    };
    
    // New function to handle order confirmation
    const handleConfirmOrder = () => {
        // Show confirmation state first
        setOrderConfirmed(true);
        
        // Redirect to checkout after a brief delay to show the confirmation
        setTimeout(() => {
            // Close the receipt modal
            onClose();
            
            // Redirect to checkout page
            window.location.href = '/checkout';
            
            // Reset confirmation state for next time
            setOrderConfirmed(false);
        }, 1500); // Shorter delay before redirect
    };
    
    // Calculate totals
    const calculateSubtotal = () => {
        let subtotal = designData.basePrice || 25.00; // Base cake price
        
        // Add prices for elements/decorations
        if (designData.elements && designData.elements.length) {
            designData.elements.forEach(element => {
                subtotal += element.price || 3.50; // Default price if not specified
            });
        }
        
        // Add price for message if present
        if (designData.message) {
            subtotal += 5.00;
        }
        
        return subtotal;
    };
    
    // Calculate cake price based on design complexity
    const calculateCakePrice = () => {
        let price = 25.00; // Base price
        
        // Add price for decorations
        if (cakeState?.elements && cakeState.elements.length) {
            price += cakeState.elements.length * 3.50;
        }
        
        // Add price for message
        if (cakeState?.message) {
            price += 5.00;
        }
        
        return price;
    };
    
    // Handle adding to cart
    const handleAddToCart = async () => {
        if (!token) {
            toast.error("Please log in to add items to cart");
            return;
        }
        
        try {
            setIsAddingToCart(true);
            
            // Get the image
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
                // Create a proper object with _id property
                const designObject = { 
                    _id: savedDesign.data._id,
                    name: designName,
                    previewImage: snapshotImage
                };
                
                // Options for the cake
                const cakeOptions = {
                    flavor: 'vanilla',
                    size: 'medium',
                    tier: 'single',
                    message: cakeState.message || ''
                };
                
                // Calculate price
                const price = calculateCakePrice();
                
                // Add to cart
                await addCustomCakeToCart(designObject, cakeOptions, price);
                
                // Show success message
                toast.success("Custom cake added to cart!");
                
                // Call success callback
                if (onAddToCartSuccess) {
                  onAddToCartSuccess();
                }
                
                // Close receipt modal
                onClose();
            } else {
                throw new Error("Failed to save design - invalid response format");
            }
        } catch (error) {
            console.error("Error adding cake to cart:", error);
            toast.error("Failed to add cake to cart");
        } finally {
            setIsAddingToCart(false);
        }
    };

    const subtotal = calculateSubtotal();
    const taxRate = 0.08; // 8% tax
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    
    // Generate order ID
    const orderId = `FC-${Date.now().toString().slice(-6)}`;
    
    if (!isVisible) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Order Receipt</h2>
                        <div className="flex space-x-2">
                            {orderConfirmed ? (
                                <div className="px-4 py-2 bg-green-500 text-white rounded flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Order Confirmed!
                                </div>
                            ) : (
                                <>
                                    {/* Add to Cart Button */}
                                    <button 
                                        onClick={handleAddToCart}
                                        disabled={isAddingToCart}
                                        className={`px-4 py-2 rounded transition flex items-center ${
                                            isAddingToCart 
                                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                                            : 'bg-pink-500 text-white hover:bg-pink-600'
                                        }`}
                                    >
                                        {isAddingToCart ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingCart className="w-4 h-4 mr-1" />
                                                Add to Cart
                                            </>
                                        )}
                                    </button>
                                    
                                    <button 
                                        onClick={handleConfirmOrder}
                                        className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition"
                                    >
                                        Confirm Order
                                    </button>
                                </>
                            )}
                            <button 
                                onClick={handlePrint}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                            >
                                Print
                            </button>
                            <button 
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                    
                    <div ref={printRef} className="overflow-hidden">
                        <div className="mb-6 pb-6 border-b border-gray-200">
                            <div className="flex justify-between flex-wrap">
                                <div>
                                    <p className="text-sm text-gray-600">Order ID:</p>
                                    <p className="font-medium">{orderId}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Date:</p>
                                    <p className="font-medium">{new Date().toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Customer:</p>
                                    <p className="font-medium">{designData.customerName || "Guest Customer"}</p>
                                </div>
                            </div>
                        </div>
                        
                        <table className="w-full mb-6">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="py-2 text-left text-sm font-semibold text-gray-600">Item</th>
                                    <th className="py-2 text-left text-sm font-semibold text-gray-600">Details</th>
                                    <th className="py-2 text-right text-sm font-semibold text-gray-600">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Base cake */}
                                <tr className="border-b border-gray-100">
                                    <td className="py-3 text-sm">
                                        <div className="font-medium">Custom Cake</div>
                                    </td>
                                    <td className="py-3 text-sm">
                                        <div>
                                            {designData.cakeModel?.path?.split('/').pop() || "Standard Cake"}
                                            {designData.cakeModel?.color?.primary && 
                                                <span className="ml-2 inline-flex items-center">
                                                    <span className="h-3 w-3 rounded-full mr-1" style={{backgroundColor: designData.cakeModel.color.primary}}></span>
                                                    {designData.cakeModel.color.primary}
                                                </span>
                                            }
                                        </div>
                                    </td>
                                    <td className="py-3 text-sm text-right">{formatCurrency(designData.basePrice || 25.00)}</td>
                                </tr>
                                
                                {/* Message if any */}
                                {designData.message && (
                                    <tr className="border-b border-gray-100">
                                        <td className="py-3 text-sm">
                                            <div className="font-medium">Custom Message</div>
                                        </td>
                                        <td className="py-3 text-sm">
                                            <div className="italic">"{designData.message}"</div>
                                            {designData.messageColor && 
                                                <div className="text-xs text-gray-500 flex items-center mt-1">
                                                    Color: 
                                                    <span className="h-3 w-3 rounded-full mx-1" style={{backgroundColor: designData.messageColor}}></span>
                                                    {designData.messageColor}
                                                </div>
                                            }
                                        </td>
                                        <td className="py-3 text-sm text-right">{formatCurrency(5.00)}</td>
                                    </tr>
                                )}
                                
                                {/* Elements/Decorations */}
                                {designData.elements && designData.elements.map((element, index) => (
                                    <tr key={element.uniqueId || index} className="border-b border-gray-100">
                                        <td className="py-3 text-sm">
                                            <div className="font-medium">Decoration {index + 1}</div>
                                        </td>
                                        <td className="py-3 text-sm">
                                            <div>
                                                {element.path?.split('/').pop() || "Custom Element"}
                                                {element.color?.primary && 
                                                    <span className="ml-2 inline-flex items-center">
                                                        <span className="h-3 w-3 rounded-full mr-1" style={{backgroundColor: element.color.primary}}></span>
                                                    </span>
                                                }
                                            </div>
                                        </td>
                                        <td className="py-3 text-sm text-right">{formatCurrency(element.price || 3.50)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Totals */}
                        <div className="border-t border-gray-200 pt-4">
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600">Tax (8%)</span>
                                <span className="font-medium">{formatCurrency(tax)}</span>
                            </div>
                            <div className="flex justify-between py-3 text-lg font-bold border-t border-gray-200 mt-2">
                                <span>Total</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>
                        
                        <div className="mt-8 text-center text-sm text-gray-500">
                            <p>Thank you for your order!</p>
                            <p className="mt-1">Forever Cakes • 123 Cake Street • Somewhere, SW 12345</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Receipt;