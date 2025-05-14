import React, { useEffect, useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const { token } = useContext(ShopContext);
  const sessionId = searchParams.get('session_id');
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (!sessionId) {
      navigate('/');
      return;
    }
    
    verifyPayment();
  }, [sessionId, token]);
  
  const verifyPayment = async () => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `http://localhost:8080/api/checkout/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setOrderDetails(response.data.data);
      } else {
        toast.error("Could not verify payment");
        navigate('/');
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      toast.error("Error verifying payment");
      navigate('/');
    } finally {
      setLoading(false);
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
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <div className="mb-6">
          <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Thank You for Your Order!</h1>
        
        <p className="mb-6">
          Your payment has been successfully processed.
        </p>
        
        <p className="text-gray-600 mb-8">
          Order Reference: {orderDetails?.attributes?.reference_number || 'N/A'}
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate('/orders')}
            className="bg-black text-white px-6 py-2 rounded"
          >
            View My Orders
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

export default CheckoutSuccess;