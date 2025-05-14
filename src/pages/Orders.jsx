import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import { FaCircleNotch } from 'react-icons/fa';

const Orders = () => {
    const { orders, orderLoading, fetchUserOrders, currency } = useContext(ShopContext);
    const navigate = useNavigate();
    
    // Add this useEffect to check what 'orders' contains
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
                <div>
                    {orderArray.map((order) => (
                        <div key={order._id} className='py-4 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4 orders-page-container'>
                            <div className='flex items-start gap-6 text-sm'>
                                <img 
                                    className='w-16 sm:w-20 object-cover' 
                                    src={(order.items && order.items.length > 0) ? order.items[0].image : '/placeholder-image.png'} 
                                    alt="Order preview" 
                                />
                                <div>
                                    <p className='sm:text-base font-medium'>Order #{order.orderNumber}</p>
                                    <div className='flex items-center gap-3 mt-2 text-base text-gray-700'>
                                        <p className='text-lg'>{currency}{order.totalAmount}</p>
                                        <p>Items: {order.items.length}</p>
                                    </div>
                                    <p className='mt-2'>
                                        Date: <span className='text-gray-400'>
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className='md:w-1/2 flex justify-between'>
                                <div className='flex items-center gap-2'>
                                    <div 
                                        className={`min-w-2 h-2 rounded-full ${
                                            order.status === 'Delivered' ? 'bg-green-500' : 
                                            order.status === 'Shipped' ? 'bg-blue-500' : 
                                            order.status === 'Canceled' ? 'bg-red-500' : 
                                            order.status === 'Pending' ? 'bg-gray-500' :
                                            order.status === 'Processing' ? 'bg-orange-500' :
                                            order.status === 'Refunded' ? 'bg-purple-500' :
                                            order.status === 'Baking' ? 'bg-pink-500' :
                                            'bg-yellow-500'
                                        }`}
                                    ></div>
                                    <p className='text-sm md:text-base'>{order.status}</p>
                                </div>
                                <button 
                                    className='border px-4 py-2 text-sm font-medium rounded-sm'
                                    onClick={() => navigate(`/orders/${order.OrderID || order._id}`)}
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
