import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Simulate loading for 1.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-semibold mb-8">Payment Confirmation</h1>
      
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500 mb-4"></div>
          <p className="text-lg">Processing your payment...</p>
        </div>
      )}
      
      {!loading && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-md">
          <div className="flex items-center mb-6">
            <svg className="w-12 h-12 text-green-500 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold">Thank You For Your Purchase!</h2>
          </div>
          
          <div className="mb-6">
            <p className="text-lg mb-2">
              Your order has been placed successfully.
            </p>
            <p>We'll send a confirmation email shortly.</p>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-8">
            <button 
              onClick={() => navigate('/orders')}
              className="bg-pink-600 hover:bg-pink-700 text-white py-2 px-6 rounded-md"
            >
              View My Orders
            </button>
            <button 
              onClick={() => navigate('/shop')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-6 rounded-md"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSuccess;