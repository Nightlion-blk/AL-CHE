import React, { useContext, useEffect, useState } from 'react'
import Title from '../components/Title'
import ProductItem from '../components/ProductItem'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom';

const Collection = () => {
  const { product, search, showSearch } = useContext(ShopContext);
  const { updateSearch, setShowSearchResults } = useContext(ShopContext);
  const navigate = useNavigate();

  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [sortType, setSortType] = useState('relevent');
  const [isVisible, setIsVisible] = useState(false); // State for fade-in animation
  const [localSearch, setLocalSearch] = useState('');

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

  const handleSearch = (e) => {
    const searchValue = e.target.value;
    setLocalSearch(searchValue);
    
    // Use the context functions if available, otherwise just use local state
    if (typeof updateSearch === 'function') {
      updateSearch(searchValue);
    } else if (window.debug) {
      console.warn('updateSearch is not available in ShopContext');
    }
    
    if (typeof setShowSearchResults === 'function') {
      setShowSearchResults(searchValue.length > 0);
    } else if (window.debug) {
      console.warn('setShowSearchResults is not available in ShopContext');
    }
    
    // Apply filter directly since we can't rely on context changes
    setTimeout(() => applyFilter(), 0);
  };

  const applyFilter = () => {
    let productsCopy = product.filter(item => item.status !== 'Deleted').slice();

    // Use localSearch if context search isn't working
    const searchTerm = (showSearch && search) ? search.toLowerCase() : localSearch.toLowerCase();
    
    if (searchTerm) {
      productsCopy = productsCopy.filter(item => 
        (item.name && item.name.toLowerCase().includes(searchTerm)) || 
        (item.description && item.description.toLowerCase().includes(searchTerm)) ||
        (item.category && item.category.toLowerCase().includes(searchTerm))
      );
    }

    if (category.length > 0) {
      productsCopy = productsCopy.filter(item => category.includes(item.category));
    }

    setFilterProducts(productsCopy);
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

          {/* Add search box here */}
          <div className={`mt-4 ${showFilter ? '' : 'hidden'} sm:block`}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={localSearch}
                onChange={handleSearch}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition-colors"
              />
              <div className="absolute top-0 right-0 flex items-center h-full px-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {localSearch && (
                <button
                  onClick={() => {
                    setLocalSearch('');
                    // Clear context search if needed
                    if (typeof updateSearch === 'function') {
                      updateSearch('');
                    }
                    setShowSearch(false);
                  }}
                  className="absolute top-0 right-10 flex items-center h-full px-2 text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

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
                  value={'Cake'}  
                  onChange={toggleCategory}
                  type='checkbox'
                  checked={category.includes('Cake')}
                />{' '}
                Cakes{' '}
              </p>
              <p className='flex gap-2'>
                <input
                  className='w-3'
                  value={'Cookie'} 
                  onChange={toggleCategory}
                  type='checkbox'
                  checked={category.includes('Cookie')}
                />{' '}
                Cookies{' '}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className='flex-1'>
          <div className='flex justify-between items-center text-base sm:text-2xl mb-4'>
            <div className="flex items-center gap-3">
              <Title text1={'ALL'} text2={'COLLECTIONS'} />
              
              {/* Quick Search Button - visible on all screen sizes */}
              <button 
                onClick={() => {
                  setShowFilter(true);
                  // Focus on search input after a small delay to allow rendering
                  setTimeout(() => {
                    document.querySelector('input[placeholder="Search products..."]')?.focus();
                  }, 100);
                }}
                className="ml-2 p-2 bg-pink-100 hover:bg-pink-200 text-pink-800 rounded-full transition-colors"
                title="Quick Search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

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
          
          {/* Show search results count when searching */}
          {showSearch && search && (
            <div className="mb-4 text-sm">
              <span className="font-medium">Search results for "{search}":</span> 
              <span className="ml-1">{filterProducts.length} products found</span>
            </div>
          )}

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