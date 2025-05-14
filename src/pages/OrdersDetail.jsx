import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';

const OrdersDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { currency, token } = React.useContext(ShopContext);
  
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingRefund, setProcessingRefund] = useState(false);

  // Fetch order details
  const fetchOrderData = useCallback(async () => {
    if (!orderId || !token) return;

    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8080/api/orders/SpecificOrders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setOrderData(response.data.order);
      } else {
        setError('Failed to fetch order details');
        toast.error('Order not found');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      setError('An error occurred while fetching order details');
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  // Handle refund request
  const handleRefundRequest = async () => {
    if (!orderData || !token) return;
    
    if (!window.confirm('Are you sure you want to request a refund for this order?')) {
      return;
    }
    
    setProcessingRefund(true);
    try {
      const response = await axios.post(
        `http://localhost:8080/api/orders/${orderId}/refund`,
        { reason: 'Customer requested refund' },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Refund request submitted successfully');
        // Refresh order data to show updated status
        fetchOrderData();
      } else {
        toast.error(response.data.message || 'Failed to submit refund request');
      }
    } catch (error) {
      console.error('Refund error:', error);
      toast.error('Failed to process refund request');
    } finally {
      setProcessingRefund(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle "back to home" navigation
  const goToHome = () => {
    navigate('/');
  };

  // Handle "back to orders" navigation
  const goToOrders = () => {
    navigate('/orders');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error Loading Order</h2>
          <p className="mt-2 text-gray-600">{error || 'Order not found'}</p>
          <button 
            onClick={goToOrders} 
            className="mt-4 bg-black text-white py-2 px-6"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const canRequestRefund = orderData.Status === 'Completed' && 
                           orderData.Payment?.PaymentMethod === 'Online Payment' &&
                           !['Refunded', 'Refund Pending'].includes(orderData.Status);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Title text1="ORDER" text2="DETAILS" />
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        {/* Order Header Information */}
        <div className="flex flex-col md:flex-row justify-between border-b pb-4 mb-6">
          <div>
            <h3 className="font-medium">Order #{orderData.OrderID}</h3>
            <p className="text-gray-600 text-sm">Placed on {formatDate(orderData.OrderDate)}</p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium
              ${orderData.Status === 'Completed' ? 'bg-green-100 text-green-800' : 
                orderData.Status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                orderData.Status === 'Refunded' ? 'bg-gray-100 text-gray-800' :
                orderData.Status === 'Refund Pending' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'}`}>
              {orderData.Status}
            </span>
          </div>
        </div>
        
        {/* Order Items */}
        <div className="mb-8">
          <h4 className="font-medium mb-4">Items Ordered</h4>
          <div className="space-y-4">
            {orderData.OrderDetails && orderData.OrderDetails.map((item, index) => (
              <div key={index} className="flex items-center border-b pb-4">
                <div className="w-16 h-16 mr-4">
                  <img 
                    src={item.ProductImage || '/default-product.jpg'} 
                    alt={item.ProductName} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-product.jpg';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium">{item.ProductName}</h5>
                  <div className="flex justify-between mt-1">
                    <span className="text-sm text-gray-600">Qty: {item.Quantity}</span>
                    <span className="text-sm font-medium">{currency}{item.SubTotal}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Payment & Delivery Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h4 className="font-medium mb-3">Shipping Information</h4>
            {orderData.Delivery && (
              <div className="text-gray-600">
                <p>{orderData.customerName?.Fullname}</p>
                <p>{orderData.Delivery.ShippingAddress?.street}</p>
                <p>
                  {orderData.Delivery.ShippingAddress?.city}, 
                  {orderData.Delivery.ShippingAddress?.state} 
                  {orderData.Delivery.ShippingAddress?.postalCode}
                </p>
                <p>{orderData.Delivery.ShippingAddress?.country}</p>
                
                <div className="mt-3">
                  <p className="text-sm">
                    <span className="font-medium">Status: </span>
                    {orderData.Delivery.ShippingStatus}
                  </p>
                  {orderData.Delivery.EstimatedDeliveryDate && (
                    <p className="text-sm">
                      <span className="font-medium">Est. Delivery: </span>
                      {formatDate(orderData.Delivery.EstimatedDeliveryDate)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Payment Information</h4>
            {orderData.Payment && (
              <div className="text-gray-600">
                <p>
                  <span className="font-medium">Method: </span>
                  {orderData.Payment.PaymentMethod}
                </p>
                <p>
                  <span className="font-medium">Status: </span>
                  {orderData.Payment.PaymentStatus}
                </p>
                {orderData.Payment.PaymentDate && (
                  <p>
                    <span className="font-medium">Date: </span>
                    {formatDate(orderData.Payment.PaymentDate)}
                  </p>
                )}
                {orderData.Payment.PaymentReference && (
                  <p>
                    <span className="font-medium">Reference: </span>
                    {orderData.Payment.PaymentReference}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="border-t pt-6">
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>{currency}{orderData.TotalAmount}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="flex justify-between font-medium text-lg mt-4">
            <span>Total</span>
            <span>{currency}{orderData.TotalAmount}</span>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <button 
            onClick={goToOrders} 
            className="bg-gray-200 text-gray-800 py-2 px-6 mr-2"
          >
            Back to Orders
          </button>
          <button 
            onClick={goToHome} 
            className="bg-black text-white py-2 px-6"
          >
            Continue Shopping
          </button>
        </div>
        
        {canRequestRefund && (
          <button 
            onClick={handleRefundRequest} 
            disabled={processingRefund}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-6 disabled:bg-red-300"
          >
            {processingRefund ? 'Processing...' : 'Request Refund'}
          </button>
        )}
      </div>
    </div>
  );
};

export default OrdersDetail;