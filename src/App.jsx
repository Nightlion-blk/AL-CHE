import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Collection from './pages/Collection'
import About from './pages/About'
import Cart from './pages/Cart'
import Product1 from './pages/Product'
import Footer from './components/Footer'
import Login from './pages/Login'
import ResetWrapper from './components/ResetWrapper'
import PlaceOrder from './pages/PlaceOrder'
import Orders from './pages/Orders'

import AdminDashboard from './pages/AdminDashboard'
import SearchBar from './components/SearchBar'
import Checkout from './pages/Checkout'
import CheckoutButton from './components/CheckoutButton'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import ShopContextProvider from './context/ShopContext'
import CheckoutCancel from './pages/CheckoutCancel'
import Homeadmin from './pages/Homeadmin'
import Accounts from './pages/Accounts'
import OrdersAdmin from './pages/OrdersAdmin';
import VerifyOTP from './components/OTPVerification';
import CodeVerification from './components/CodeVerification';
import ResetPasswordFlow from './components/ResetPasswordFlow';
import PaymentSuccess from './pages/PaymentSuccess';
import Page3d from './pages/Page3d';
import OrderDetail from './pages/OrdersDetail';
import Decorate from './pages/Decorate';
import { CakeContextProvider } from './context/CakeContext'
const App = () => {
  return (
    <Router>
      <ShopContextProvider>
        <CakeContextProvider>
        <div className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]'>
          <ToastContainer />
          <Navbar />
          <SearchBar />
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/shop' element={<Collection />} />
            <Route path='/about' element={<About />} />
            <Route path='/decorate' element={<Decorate />} />
            <Route path='/product/:id' element={<Product1 />} />
            <Route path='/cart' element={<Cart />} />
            <Route path='/login' element={<Login />} />
            <Route path='/place-order' element={<PlaceOrder />} />
            <Route path='/orders' element={<Orders />} />
            <Route path='/admin' element={<AdminDashboard />} />
            <Route path="/checkout/:cartId" element={<Checkout />} />
            <Route path="/checkout/cancel" element={<CheckoutCancel />} />
            <Route path="/forgotpassword" element={<ResetWrapper />} />
            <Route path="/orders/:orderId" element={<OrderDetail />} />

            <Route path ="/verifyOtp" element={<VerifyOTP/>}/>
            <Route path="/verify-code" element={<CodeVerification onNext={() => {}} onCancel={() => {}} />} />

            <Route path="/reset-password" element={<ResetPasswordFlow />} />
            <Route path="/homeadmin" element={<Homeadmin />} />

            <Route path="/admin/accounts" element={<Accounts />} />
            <Route path="/admin/orders" element={<OrdersAdmin />} />
            
            <Route path="/payment/success" element={<PaymentSuccess />} />
          </Routes>
          <Footer/>
        </div>
         </CakeContextProvider>
      </ShopContextProvider>
    </Router>
  )
}

export default App
