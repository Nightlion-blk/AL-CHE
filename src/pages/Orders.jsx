import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import { FaCircleNotch } from 'react-icons/fa';
import { MdCake } from 'react-icons/md';

const Orders = () => {
    const { orders, orderLoading, fetchUserOrders, currency } = useContext(ShopContext);
    const navigate = useNavigate();
    
    // Fetch orders on component mount
    useEffect(() => {
        fetchUserOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    // Log order data for debugging
    useEffect(() => {
        console.log("Orders data:", orders);
    }, [orders]);
    
    if (orderLoading) {
        return (
            <div className='border-t pt-32 flex justify-center'>
                <FaCircleNotch className="animate-spin text-4xl text-gray-500" />
            </div>
        );
    }
    
    // Safety check for orders
    if (!orders || typeof orders !== 'object') {
        return (
            <div className='border-t pt-16'>
                <div className='text-2xl'>
                    <Title text1={'MY'} text2={'ORDERS'} />
                </div>
                <div className='py-10 text-center text-gray-500'>
                    <p>No orders data available.</p>
                </div>
            </div>
        );
    }
    
    // Extract the actual orders array if your API returns an object structure
    const orderArray = Array.isArray(orders) ? orders : orders.orders || [];
    
    return (
        <div className='border-t pt-16'>
            <div className='text-2xl'>
                <Title text1={'MY'} text2={'ORDERS'} />
            </div>
            
            {orderArray.length === 0 ? (
                <div className='py-10 text-center text-gray-500'>
                    <p>You haven't placed any orders yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {orderArray.map((order) => (
                        <div key={order._id} 
                             className='p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow
                                       flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                            <div className='flex items-start gap-6'>
                                {/* Use the previewImage from the API if available, otherwise fall back to first item */}
                                <img 
                                    className='w-24 h-24 object-cover rounded-md' 
                                    src={order.previewImage || 
                                        ((order.items && order.items.length > 0) ? order.items[0].image : '/placeholder-image.png')} 
                                    alt="Order preview" 
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className='text-lg font-medium'>Order #{order.orderNumber}</p>
                                        
                                        {/* Badge for custom cakes */}
                                        {order.hasCustomCakes && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                                <MdCake className="mr-1" />
                                                {order.customCakeCount > 1 ? `${order.customCakeCount} Cakes` : 'Custom Cake'}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className='flex items-center gap-3 mt-2'>
                                        <p className='text-lg font-semibold'>{currency}{order.totalAmount}</p>
                                        <p className="text-sm text-gray-600">Items: {order.items.length}</p>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-x-4 mt-2 text-sm">
                                        <p>
                                            <span className="text-gray-500">Date:</span>{' '}
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </p>
                                        
                                        <p>
                                            <span className="text-gray-500">Payment:</span>{' '}
                                            {order.payment?.method || "Unknown"}
                                        </p>
                                        
                                        <p>
                                            <span className="text-gray-500">Payment Status:</span>{' '}
                                            <span className={`${
                                                order.payment?.status === 'Paid' ? 'text-green-600' : 
                                                order.payment?.status === 'Pending' ? 'text-yellow-600' : 
                                                order.payment?.status === 'Failed' ? 'text-red-600' : 
                                                'text-gray-600'
                                            }`}>
                                                {order.payment?.status || "Unknown"}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className='flex items-center justify-between gap-4 md:flex-col md:items-end'>
                                <div className='flex items-center gap-2'>
                                    <div 
                                        className={`w-3 h-3 rounded-full ${
                                            order.status === 'Delivered' ? 'bg-green-500' : 
                                            order.status === 'Shipped' ? 'bg-blue-500' : 
                                            order.status === 'Canceled' ? 'bg-red-500' : 
                                            order.status === 'Pending' ? 'bg-gray-500' :
                                            'bg-yellow-500'
                                        }`}
                                    ></div>
                                    <p className='font-medium'>{order.status}</p>
                                </div>
                                
                                <button 
                                    className='border border-pink-500 text-pink-500 hover:bg-pink-50 px-4 py-2 
                                              text-sm font-medium rounded transition-colors'
                                    onClick={() => navigate(`/orders/${order._id}`)}
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Orders;
