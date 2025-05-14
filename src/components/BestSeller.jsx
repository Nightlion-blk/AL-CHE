import React, { useContext, useEffect, useState, useRef } from 'react';
import Title from './Title';
import { ShopContext } from '../context/ShopContext';

const BestSeller = () => {
  const [bestSeller, setBestSeller] = useState([]);
  const { product } = useContext(ShopContext);

  // Modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const modalRef = useRef(null);

  useEffect(() => {
    // Mock best seller products
    const bestProduct = [
      { _id: '1', name: 'Mother’s Day Rose Pot Cake', image: 'mothercake.jpg', price: 500, description: 'A delicious cake perfect for any occasion.' },
      { _id: '2', name: 'Cupcake', image: 'cupcake.jpeg', price: 150, description: 'A sweet and delightful cupcake for your cravings.' },
      { _id: '3', name: 'Blueberry Cheese cake', image: 'blueberrycake.jpeg', price: 600, description: 'A rich and creamy blueberry cake.' },
      { _id: '4', name: 'Strawberry Cheesecake', image: 'strawberrycake.jpeg', price: 550, description: 'A fresh and fruity strawberry cake.' },
      { _id: '5', name: 'Strawberry in a Cup', image: 'strawberry.jpeg', price: 200, description: 'Fresh and juicy strawberries for your enjoyment.' },
    ];
    setBestSeller(bestProduct);
  }, []);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setQuantity(1); // Reset quantity when opening the modal
  };

  const handleAddToCart = () => {
    console.log('Added ${quantity} of ${selectedProduct.name} to the cart.');
    setSelectedProduct(null); // Close the modal after adding to cart
  };

  const handleCloseModal = () => {
    setSelectedProduct(null); // Clear the selected product to close the modal
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  return (
    <div className="my-10">
      <div className="text-center text-3xl py-8">
        <Title text1={'BEST'} text2={'SELLERS'} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6 rounded-xl">
        {bestSeller.map((item) => (
          <div key={item._id} onClick={() => handleProductClick(item)} className="cursor-pointer">
            <div className="relative overflow-hidden rounded-xl">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-80 object-cover rounded-xl hover:scale-110 transition ease-in-out"
              />
            </div>
            <h1 className="text-sm font-normal text-gray-800 mt-1">{item.name}</h1>
            <p className="text-sm font-medium text-gray-800">₱{item.price}</p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div
            ref={modalRef}
            className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative"
          >
            {/* Close Button */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-10"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Product Image */}
                <div className="md:w-1/2 flex flex-col items-center">
                  <div className="w-full max-w-[400px] aspect-square overflow-hidden border-2 border-gray-300 mb-4 rounded-lg">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Product Details */}
                <div className="md:w-1/2">
                  <h1 className="text-2xl font-semibold mb-2">{selectedProduct.name}</h1>
                  <div className="text-xl font-medium mb-4">₱{selectedProduct.price}</div>
                  <div className="mb-6">
                    <p className="text-gray-700">{selectedProduct.description}</p>
                  </div>
                  <div className="flex items-center mb-6">
                    <label className="mr-4">Quantity:</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="border border-gray-300 px-3 py-1 w-20 rounded"
                    />
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="bg-black text-white px-8 py-3 text-sm active:bg-gray-700 rounded-lg"
                  >
                    ADD TO CART
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BestSeller;