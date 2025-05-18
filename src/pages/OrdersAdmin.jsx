import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { NavLink } from 'react-router-dom';
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';
import Select from 'react-select';

const OrdersAdmin = () => {
  const { token, currency } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const rowsPerPage = 5;
  
  // Filters
  const [searchInput, setSearchInput] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');
  const [viewedOrder, setViewedOrder] = useState(null);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [hasCustomCakes, setHasCustomCakes] = useState(false);
  const [minAmount, setMinAmount] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');

  // Status options with color coding
  const statusOptions = [
    { value: 'all', label: 'All Orders', color: '#6b7280' },
    { value: 'pending', label: 'Pending', color: '#ec4899' },
    { value: 'shipped', label: 'Shipped', color: '#3b82f6' },
    { value: 'canceled', label: 'Canceled', color: '#ef4444' },
    { value: 'Completed', label: 'Completed', color: '#10b981' },
  ];

  // Payment method options
  const paymentMethodOptions = [
    { value: '', label: 'All Payment Methods', color: '#6b7280' },
    { value: 'credit_card', label: 'Credit Card', color: '#3b82f6' },
    { value: 'paypal', label: 'PayPal', color: '#4f46e5' },
    { value: 'bank_transfer', label: 'Bank Transfer', color: '#10b981' },
  ];

  // Payment status options
  const paymentStatusOptions = [
    { value: '', label: 'All Payment Statuses', color: '#6b7280' },
    { value: 'paid', label: 'Paid', color: '#10b981' },
    { value: 'pending', label: 'Pending', color: '#ec4899' },
    { value: 'failed', label: 'Failed', color: '#ef4444' },
    { value: 'refunded', label: 'Refunded', color: '#f59e0b' },
  ];

  // Custom styles for the dropdown
  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      color: state.data.color,
      backgroundColor: state.isSelected ? `${state.data.color}20` : 'white',
      '&:hover': {
        backgroundColor: `${state.data.color}10`
      }
    }),
    singleValue: (provided, state) => ({
      ...provided,
      color: state.data.color,
      fontWeight: 'bold'
    }),
    control: (provided) => ({
      ...provided,
      borderColor: '#e2e8f0',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#cbd5e0'
      }
    })
  };

  // Fetch orders from the API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', rowsPerPage);
      
      if (orderFilter !== 'all') {
        const statusMap = {
          'pending': 'Pending',
          'shipped': 'Shipped',
          'completed': 'Completed',
          'canceled': 'Canceled',
        };
        params.append('status', statusMap[orderFilter] || orderFilter);
      }
      
      // Add the new filter parameters
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      if (hasCustomCakes) params.append('hasCustomCakes', 'true');
      if (minAmount) params.append('minAmount', minAmount);
      if (paymentMethodFilter) params.append('paymentMethod', paymentMethodFilter);
      if (paymentStatusFilter) params.append('paymentStatus', paymentStatusFilter);
      
      const response = await axios.get(`http://localhost:8080/api/orders/all?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.success) {
        console.log('Orders response:', response.data);
        setOrders(response.data.orders || []);
        setTotalPages(response.data.pagination.totalPages || 1);
        setTotalOrders(response.data.pagination.totalOrders || 0);
        
        console.log('Orders fetched successfully:', response.data.pagination.totalOrders);
      } else {
        setOrders([]);
        setTotalPages(1);
        setTotalOrders(0);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle status change
  const handleStatusChange = async (orderId, newStatus, checkoutId) => {
    try {
      // The backend expects orderStatus as the new status for the order
      await axios.post(`http://localhost:8080/api/orders/updatePayment`, 
        { 
          orderId: orderId, 
          checkoutId, 
          orderStatus: newStatus // Use newStatus as orderStatus
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update local state to reflect the change
      setOrders(prev => 
        prev.map(order => 
          order.orderNumber === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status: ' + (err.response?.data?.message || err.message));
    }
  };
  // Load orders when component mounts or filters/pagination change
  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [
    token, 
    currentPage, 
    orderFilter, 
    hasCustomCakes,
    minAmount,
    paymentMethodFilter,
    paymentStatusFilter,
    dateRange.start,
    dateRange.end
  ]);

  // Handle search - client-side filtering
  const filteredOrders = searchInput 
    ? orders.filter(order => 
        order.orderNumber.toLowerCase().includes(searchInput.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchInput.toLowerCase())
      )
    : orders;
    
  // Get status color classes
  const getStatusClasses = (status) => {
    switch(status.toLowerCase()) {
      case 'pending': return 'bg-pink-100 text-pink-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto flex justify-center py-12">
        <div className="w-12 h-12 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-5">Error: {error}</div>
        <button 
          onClick={fetchOrders} 
          className="bg-pink-600 text-white px-5 py-2 rounded-md hover:bg-pink-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto p-4 md:p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">ORDERS MANAGEMENT</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="border rounded-md px-4 py-2 flex-grow"
          />
          
          {/* Replace the standard select with React-Select */}
          <Select
            options={statusOptions}
            value={statusOptions.find(option => option.value === orderFilter)}
            onChange={(selectedOption) => setOrderFilter(selectedOption.value)}
            styles={customStyles}
            className="sm:w-60"
            classNamePrefix="filter-select"
          />
        </div>
        {filteredOrders.length === 0 ? (
          <div className="text-center py-10 text-gray-500 italic">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3 px-4 text-left border-b">Order ID</th>
                  <th className="py-3 px-4 text-left border-b">Details</th>
                  <th className="py-3 px-4 text-left border-b">Date</th>
                  <th className="py-3 px-4 text-left border-b">Customer</th>
                  <th className="py-3 px-4 text-left border-b">Payment</th>
                  <th className="py-3 px-4 text-left border-b">Total</th>
                  <th className="py-3 px-4 text-left border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      #{order.orderNumber}
                      {order.hasCustomCakes && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                          Custom
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setViewedOrder(order)}
                        className="text-pink-600 font-bold underline cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                    <td className="py-3 px-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{order.customer?.name || "Unknown"}</td>
                    <td className="py-3 px-4">{order.payment?.method || "N/A"}</td>
                    <td className="py-3 px-4">{currency}{order.totalAmount}</td>
                    <td className="py-3 px-4">
                    <select
                        className={`px-2 py-1 rounded-full text-sm ${getStatusClasses(order.status)}`}
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.orderNumber, e.target.value, order.checkoutId)}
                      >
                        {['Pending', 'Shipped', 'Canceled', 'Completed'].map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-center mt-8 gap-2">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(prev => prev - 1)}
            className={`px-3 py-1 rounded border ${
              currentPage === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            ←
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded border ${
                i + 1 === currentPage 
                  ? 'bg-pink-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {i + 1}
            </button>
          ))}
          
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => setCurrentPage(prev => prev + 1)}
            className={`px-3 py-1 rounded border ${
              currentPage === totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            →
          </button>
        </div>
        
        {/* Order detail modal */}
        {viewedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-xl font-bold">Order Details: #{viewedOrder.orderNumber}</h3>
                <button 
                  onClick={() => setViewedOrder(null)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                <div>
                  <p className="mb-1"><strong>Customer:</strong> {viewedOrder.customer?.name}</p>
                  <p className="mb-1"><strong>Email:</strong> {viewedOrder.customer?.email}</p>
                </div>
                <div>
                  <p className="mb-1"><strong>Date:</strong> {new Date(viewedOrder.createdAt).toLocaleString()}</p>
                  <p className="mb-1">
                    <strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-sm ${getStatusClasses(viewedOrder.status)}`}>
                      {viewedOrder.status}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="mb-1"><strong>Payment:</strong> {viewedOrder.payment?.method}</p>
                  <p className="mb-1"><strong>Payment Status:</strong> {viewedOrder.payment?.status}</p>
                </div>
              </div>
              <div className="px-4 py-2">
                <h4 className="font-bold mb-2">Order Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-2 px-3 text-left border-y">Product</th>
                        <th className="py-2 px-3 text-center border-y">Qty</th>
                        <th className="py-2 px-3 text-right border-y">Price</th>
                        <th className="py-2 px-3 text-right border-y">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewedOrder.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-3 px-3">
                            <div className="flex items-center">
                              {item.image && (
                                <img
                                  src={item.image}
                                  className="w-14 h-14 object-cover rounded-lg mr-3"
                                  alt={item.name}
                                />
                              )}
                              <div>
                                <strong className="block">{item.name}</strong>
                                <span className="text-sm text-gray-500">
                                  {item.itemType === 'cake_design' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                      Custom Cake
                                    </span>
                                  ) : (
                                    item.productId
                                  )}
                                </span>
                                {item.description && (
                                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">{item.quantity}</td>
                          <td className="py-3 px-3 text-right">{currency}{item.price}</td>
                          <td className="py-3 px-3 text-right">{currency}{item.subTotal}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-bold">
                        <td colSpan="3" className="py-3 px-3 text-right">Total:</td>
                        <td className="py-3 px-3 text-right">{currency}{viewedOrder.totalAmount}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-b-lg">
                <h4 className="font-bold mb-2">Shipping Address</h4>
                <p className="mb-1">
                  {viewedOrder.delivery?.address?.street}<br/>
                  {viewedOrder.delivery?.address?.city}, {viewedOrder.delivery?.address?.state} {viewedOrder.delivery?.address?.postalCode}<br/>
                  {viewedOrder.delivery?.address?.country}
                </p>
                <p className="mt-3">
                  <strong>Expected Delivery:</strong> {viewedOrder.delivery?.estimatedDelivery ? 
                    new Date(viewedOrder.delivery.estimatedDelivery).toLocaleDateString() : 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersAdmin;
