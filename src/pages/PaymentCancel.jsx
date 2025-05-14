import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkoutId = searchParams.get('checkout_id');
    
    if (!checkoutId) {
      toast.error("Invalid payment information");
      navigate('/cart');
      return;
    }
    
    const handlePaymentCancel = async () => {
      try {
        // Call backend to reset cart status
        await axios.get(`http://localhost:8080/api/payment/cancel?checkout_id=${checkoutId}`);
        toast.info("Payment was cancelled");
      } catch (error) {
        console.error("Error handling cancelled payment:", error);
      } finally {
        setLoading(false);
      }
    };
    
    handlePaymentCancel();
  }, [searchParams, navigate]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <div className="max-w-md mx-auto bg-gray-50 p-8 rounded-lg shadow-md">
        <div className="text-yellow-500 text-5xl mb-4">
          ⓘ
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Payment Cancelled</h1>
        <p className="mb-6">Your payment was cancelled. Your cart has been preserved.</p>
        
        <div className="space-y-4">
          <button 
            onClick={() => navigate('/checkout')}
            className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800"
          >
            Return to Checkout
          </button>
          
          <button 
            onClick={() => navigate('/cart')}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
          >
            Review Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;