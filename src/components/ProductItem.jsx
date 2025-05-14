import React, { useContext, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import { toast } from 'react-toastify';
import Product1 from '../pages/Product'; // Import the Product1 modal component

const ProductItem = ({ id, image, images, name, price, status = 'Available' }) => {
  const { currency } = useContext(ShopContext);
  // Add state to control the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Check if product is available
  const isAvailable = status === 'Available';
  
  // Handle click on unavailable products
  const handleProductClick = (e) => {
    if (!isAvailable) {
      toast.info(`${name} is currently not available.`);
    } else {
      // Open the modal for available products
      setIsModalOpen(true);
    }
  };
  
  return (
    <>
      {/* Changed from Link to div with onClick handler */}
      <div 
        onClick={handleProductClick}
        className={`text-gray-900 ${!isAvailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className='relative overflow-hidden'>
          <img 
            className={`product-image hover:scale-110 transition ease-in-out rounded-xl ${!isAvailable ? 'opacity-70' : ''}`} 
            src={image} 
            alt={name} 
          />
          
          {/* Overlay for unavailable products */}
          {!isAvailable && (
            <div className="unavailable-overlay absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
              <span className="status-updating">Not Available</span>
            </div>
          )}
        </div>
        
        <p className='pt-3 pb-1 text-sm text-gray-900'>{name}</p>
        <p className='text-sm font-medium text-gray-900'>
          {currency}{price}
          {!isAvailable && <span className="ml-2 text-orange-500 text-xs">(Currently Unavailable)</span>}
        </p>
      </div>

      {/* Add the Product1 modal */}
      <Product1
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={id}
      />
    </>
  );
}

export default ProductItem