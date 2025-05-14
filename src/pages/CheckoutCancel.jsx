
import React, { useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';

import { toast } from 'react-toastify';

const CheckoutCancel = () => {
  const [searchParams] = useSearchParams();
  const { token } = useContext(ShopContext);
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  
  useEffect(() => {
    if (sessionId && token) {
      expireCheckout();
    }
  }, [sessionId, token]);
  
  const expireCheckout = async () => {
    try {
      await axios.post(
        `http://localhost:8080/api/checkout/${sessionId}/expire`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
    } catch (error) {
      console.error("Error expiring checkout:", error);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Payment Cancelled</h1>
        
        <p className="mb-6">
          Your payment was cancelled and no charges have been made.
        </p>
        
        <p className="text-gray-600 mb-8">
          Your items are still in your cart.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/cart')}
            className="bg-black text-white px-6 py-2 rounded"
          >
            Return to Cart
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancel;
