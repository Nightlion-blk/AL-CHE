import React, { useContext, useEffect, useState } from 'react'
import Title from '../components/Title'
import ProductItem from '../components/ProductItem'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom';

const Collection = () => {
  const { product, search, showSearch } = useContext(ShopContext);
  const navigate = useNavigate();

  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [sortType, setSortType] = useState('relevent');
  const [isVisible, setIsVisible] = useState(false); // State for fade-in animation

  useEffect(() => {
    // Trigger fade-in animation when the component is mounted
    setIsVisible(true);
  }, []);

  const toggleCategory = (e) => {
    if (category.includes(e.target.value)) {
      setCategory(prev => prev.filter(a => a !== e.target.value))
    } else {
      setCategory(prev => [...prev, e.target.value])
    }
  }

  useEffect(() => {
    if (filterProducts.length === 0) {
      // Filter out products with Deleted status
      const visibleProducts = product.filter(item => item.status !== 'Deleted');
      setFilterProducts(visibleProducts);
    }
  }, [product]);

  const applyFilter = () => {
    // Start with all products except those with 'Deleted' status
    let productsCopy = product.filter(item => item.status !== 'Deleted').slice();

    if (showSearch && search) {
      productsCopy = productsCopy.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
    }

    if (category.length > 0) {
      productsCopy = productsCopy.filter(item => category.includes(item.category));
    }

    setFilterProducts(productsCopy)
  }

  const sortProduct = async () => {
    let fpCopy = filterProducts.slice();

    switch (sortType) {
      case 'low-high':
        setFilterProducts(fpCopy.sort((a, b) => (a.price - b.price)));
        break;

      case 'high-low':
        setFilterProducts(fpCopy.sort((a, b) => (b.price - a.price)));
        break;

      default:
        applyFilter();
        break;
    }
  }

  useEffect(() => {
    applyFilter()
  }, [category, search, showSearch])

  useEffect(() => {
    sortProduct();
  }, [sortType])

  const handleProductClick = (productId) => {
    setIsVisible(false); // Trigger fade-out animation
    setTimeout(() => {
      navigate(`/product/${productId}`); // Navigate after fade-out
    }, 500); // Match the CSS transition duration (500ms)
  };

  return (
    <div
      className={`transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ marginTop: '2rem' }}
    >
      {/*Horizontal Line*/}
      <hr className='page-divider' />
      <div className='flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t'>
        {/* Filter Options */}
        <div className='min-w-60'>
          <p
            onClick={() => setShowFilter(!showFilter)}
            className='my-2 text-xl flex items-center cursor-pointer gap-2'
          >
            FILTERS
            <img
              className={`h-3 sm:hidden ${showFilter ? ' rotate-90' : ''}`}
              src={assets.dropdown_icon}
              alt=""
            />
          </p>

          {/* Category Filter */}
          <div
            className={`border border-gray-300 pl-5 py-3 mt-6 ${
              showFilter ? '' : 'hidden'
            } sm:block`}
          >
            <p className='mb-3 text-sm font-medium'>CATEGORIES</p>
            <div className='flex flex-col gap-2 text-sm font-light text-gray-700'>
              <p className='flex gap-2'>
                <input
                  className='w-3'
                  value={'Shortcrust Pastries'}
                  onChange={toggleCategory}
                  type='checkbox'
                />{' '}
                Cakes{' '}
              </p>
              <p className='flex gap-2'>
                <input
                  className='w-3'
                  value={'Cakes'}
                  onChange={toggleCategory}
                  type='checkbox'
                />{' '}
                Cookies{' '}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className='flex-1'>
          <div className='flex justify-between text-base sm:text-2xl mb-4'>
            <Title text1={'ALL'} text2={'COLLECTIONS'} />

            {/* Product Sort */}
            <select
              onChange={(e) => setSortType(e.target.value)}
              className='border-2 border-gray-300 text-sm px-2'
              name=''
              id=''
            >
              <option value='relavent'>Sort by: Relevant</option>
              <option value='low-high'>Sort by: Low to High</option>
              <option value='high-low'>Sort by: High to Low</option>
            </select>
          </div>

          {/* Map Products */}
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6 rounded-lg'>
            {filterProducts.map((item, index) => (
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
      </div>
    </div>
  );
};

export default Collection;