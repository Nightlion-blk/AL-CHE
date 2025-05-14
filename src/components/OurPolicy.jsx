import React from 'react'
import { assets } from '../assets/assets'
import '../index.css'

const OurPolicy = () => {
  return (
    <div className='flex flex-col sm:flex-row justify-around gap-12 sm:gap-2 text-center py-20 text-xs sm:text-sm md:text-base text-gray-700'>

      <div className='flex flex-col items-center'>
        <img className='w-12 m-auto mb-5' src={assets.service1} alt="" />
        <p className='font-semibold'>Secured Payments</p>
        <p className='text-gray-800'>We offer secured and authentic payment transactions</p>
      </div>
      <div className='flex flex-col items-center'>
        <img className='w-12 m-auto mb-5' src={assets.service2} alt="" />
        <p className='font-semibold'>Best Customer Support</p>
        <p className='text-gray-800'>We provide an active customer support </p>
      </div>
      <div className='flex flex-col items-center'>
        <img className='w-12 m-auto mb-5 service3-img' src={assets.service3} alt="" />
        <p className='font-semibold'>Fast and Efficient Delivery</p>
        <p className='text-gray-800'>We provide high quality of service in delivery</p>
      </div>

    </div>
  )
}

export default OurPolicy
