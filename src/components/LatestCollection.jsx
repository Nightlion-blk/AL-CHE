import React, { useContext, useEffect, useState } from 'react'
import Title from './Title'
import { ShopContext } from '../context/ShopContext';
import ProductItem from './ProductItem';

const LatestCollection = () => {
    const [latestProducts, setLatestProducts] = useState([]);
    const { product } = useContext(ShopContext);
    const [isVisible, setIsVisible] = useState(false); // State for fade-in animation

    useEffect(() => {
        console.log(product);
        if (product.length > 0) {
            setLatestProducts(product.slice(0, 10));
        }

        // Trigger fade-in animation on component mount
        setIsVisible(true);
    }, [product]);

    const handleProductClick = (productId) => {
        navigate(`/product/${productId}`);
    };

    return (
        <div
            className={`mt-[-60px] transition-opacity duration-1000 ${
                isVisible ? 'opacity-100' : 'opacity-0'
            }`} // Added fade-in animation
        >
            <div className='text-center py-4 text-3xl '> {/* Reduced padding from py-8 to py-4 */}
                <Title text1={"LATEST"} text2={"COLLECTIONS"} />
            </div>

            {/* Rendering Products */}
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6 rounded-2xl'>
                {latestProducts.map((item, index) => (
                    <ProductItem
                        key={index}
                        id={item.id}
                        image={item.image}
                        name={item.name}
                        price={item.price}
                        status={item.status || 'Available'} // Pass status to ProductItem
                        onClick={() => handleProductClick(item.id)} // Add onClick handler
                    />
                ))}
            </div>
        </div>
    );
};

export default LatestCollection
