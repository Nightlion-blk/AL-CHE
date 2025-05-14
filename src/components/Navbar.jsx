import React, { useContext, useState, useEffect } from 'react';

import { assets } from '../assets/assets';

import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { ShopContext } from '../context/ShopContext';

import { toast } from 'react-toastify';

import '../index.css';

const Navbar = () => {
    const location = useLocation();
    const [visible, setVisible] = useState(false);
    const [isNavbarVisible, setIsNavbarVisible] = useState(true); // State to control navbar visibility

    const {
        getCartCount, 
        token, 
        setToken, 
        userName, 
        setUserName,
        setCartItems,
        setDetailedCartItems,
    } = useContext(ShopContext);
    
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (isLoggingOut) {
            navigate('/login');
            setIsLoggingOut(false);
        }
    }, [isLoggingOut, navigate]);

    // Scroll event listener to toggle navbar visibility
    useEffect(() => {
        let lastScrollY = window.scrollY; // Track the last scroll position locally

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setIsNavbarVisible(false); // Hide navbar when scrolling down
            } else {
                setIsNavbarVisible(true); // Show navbar when scrolling up
            }
            lastScrollY = currentScrollY; // Update the last scroll position
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []); // No dependency on lastScrollY

    const handleLogout = () => {
        setToken('');
        setUserName({ id: '', name: '' });
        setCartItems({});
        setDetailedCartItems({});
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('You have been logged out successfully');
        navigate('/login');
        setIsLoggingOut(true);
    };
    if (location.pathname.startsWith('/admin')) {
        return null; // Don't render the navbar on admin pages
    }
    return (
        <div className={`navbar-container text-white w-full transition-transform duration-200 ${isNavbarVisible ? 'translate-y-0' : '-translate-y-full'}`}>
            <div className='flex items-center justify-between py-4 font-medium max-w-screen-xl mx-auto px-0'>
                {/* Logo */}
                <div className='flex items-center gap-4 ml-[-70px]'>
                    <img src={assets.logo1} alt="logo1" className='w-12 h-12' />
                    <div className='prata-regular text-xl sm:py-1 lg:text-2xl leading-relaxed text-[#7d333f] font-extrabold'>
                        AL-CHE PASTRY
                    </div>
                </div>
                
                {/* Main Navigation */}
                <ul className='hidden sm:flex gap-24 text-sm'>
                    <NavLink to="/" className={({isActive}) => 
                        `flex flex-col items-center gap-1 text-[#7d333f] ${isActive ? 'active-nav' : ''}`}>
                        <p>HOME</p>
                        <hr className='w-2/4 border-none h-[1.5px]' />
                    </NavLink>
                    <NavLink to='/shop' className={({isActive}) => 
                        `flex flex-col items-center gap-1 text-[#7d333f] ${isActive ? 'active-nav' : ''}`}>
                        <p>SHOP</p>
                        <hr className='w-2/4 border-none h-[1.5px]' />
                    </NavLink>
                    <NavLink to='/decorate' className={({isActive}) => 
                        `flex flex-col items-center gap-1 text-[#7d333f] ${isActive ? 'active-nav' : ''}`}>
                        <p>DECORATE</p>
                        <hr className='w-2/4 border-none h-[1.5px]' />
                    </NavLink>
                    <NavLink to='/about' className={({isActive}) => 
                        `flex flex-col items-center gap-1 text-[#7d333f] ${isActive ? 'active-nav' : ''}`}>
                        <p>ABOUT US</p>
                        <hr className='w-2/4 border-none h-[1.5px]' />
                    </NavLink>
                </ul>

                {/* Login/Profile and Icons */}
                <div className='flex items-center gap-6'>
                    {/* Conditional rendering based on authentication */}
                    {token ? (
                        <div className='group relative'>
                            <div className='flex flex-col items-center gap-1 text-white cursor-pointer'>
                                <p>{userName?.name ? userName.name : 'Login'}</p>
                                <hr className='w-2/4 border-none h-[1.5px]' />
                            </div>
                            
                            {/* User Dropdown Menu */}
                            <div className='group-hover:block hidden absolute dropdown-menu right-0 pt-4 z-10'>
                                <div className='flex flex-col gap-2 w-36 py-3 px-5 bg-slate-100 text-gray-500 rounded'>
                                    <p onClick={() => navigate('/profile')} className='cursor-pointer hover:text-black'>My Profile</p>
                                    <p onClick={() => navigate('/orders')} className='cursor-pointer hover:text-black'>Orders</p>
                                    <p onClick={handleLogout} className='cursor-pointer hover:text-black'>Logout</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <NavLink to='/login' className={({isActive}) => 
                            `flex flex-col items-center gap-1 text-[#7d333f] ${isActive ? 'active-nav' : ''}`}>
                            <p>LOGIN</p>
                            <hr className='w-2/4 border-none h-[1.5px]' />
                        </NavLink>
                    )}
                    
                    {/* Only show profile icon if logged in */}
                    {token && (
                        <div className='group relative'>
                            <img className='w-5 cursor-pointer' src={assets.profile_icon} alt="Profile" />
                            
                            {/* Dropdown Menu */}
                            <div className='group-hover:block hidden absolute dropdown-menu right-0 pt-4 z-10'>
                                <div className='flex flex-col gap-2 w-36 py-3 px-5 bg-slate-100 text-gray-500 rounded'>
                                    <p onClick={() => navigate('/profile')} className='cursor-pointer hover:text-black'>My Profile</p>
                                    <p onClick={() => navigate('/orders')} className='cursor-pointer hover:text-black'>Orders</p>
                                    <p onClick={handleLogout} className='cursor-pointer hover:text-black'>Logout</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <Link to='/cart' className='relative'>
                        <img className='w-6 min-w-6' src={assets.carticon} alt="Cart" />
                        {getCartCount() > 0 && (
                            <p className='absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]'>{getCartCount()}</p>
                        )}
                    </Link>
                    
                    <img 
                        onClick={() => setVisible(true)} 
                        className='w-5 cursor-pointer sm:hidden' 
                        src={assets.menu_icon} 
                        alt="Menu" 
                    />
                </div>
            </div>

            {/* Sidebar Menu For Small Screens */}
            <div className={`fixed top-0 right-0 bottom-0 overflow-hidden bg-white transition-all z-50 ${visible ? 'w-full' : 'w-0'}`}>
                <div className='flex flex-col text-gray-600'>
                    <div onClick={() => setVisible(false)} className='flex items-center gap-4 p-3 '>
                        <img className='h-4 rotate-180' src={assets.dropdown_icon} alt="Back" />
                        <p>Back</p>
                    </div>
                    <NavLink onClick={() => setVisible(false)} to="/" className='py-2 pl-6 '>HOME</NavLink>
                    <NavLink onClick={() => setVisible(false)} to='/shop' className='py-2 pl-6'>SHOP</NavLink>
                    <NavLink onClick={() => setVisible(false)} to='/decorate' className='py-2 pl-6'>DECORATE</NavLink>
                    <NavLink onClick={() => setVisible(false)} to='/about' className='py-2 pl-6'>ABOUT US</NavLink>
                    
                    {/* Conditional rendering in mobile menu */}
                    {token ? (
                        <>
                            <NavLink onClick={() => setVisible(false)} to='/profile' className='py-2 pl-6'>PROFILE</NavLink>
                            <NavLink onClick={() => setVisible(false)} to='/orders' className='py-2 pl-6'>ORDERS</NavLink>
                            {userName?.role === 'admin' && (
                            <NavLink onClick={() => setVisible(false)} to='/admin' className='py-2 pl-6'>ADMIN</NavLink>
                        )}
                        <div onClick={() => {
                                handleLogout();
                                setVisible(false);
                            }} className='py-2 pl-6 cursor-pointer'>LOGOUT</div>
                        </>
                    ) : (
                        <NavLink onClick={() => setVisible(false)} to='/login' className='py-2 pl-6'>LOGIN</NavLink>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;