 import React, { useState, useEffect } from 'react';
  import Title from '../components/Title';
  import { assets } from '../assets/assets';

  const About = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      // Trigger fade-in animation when the component is mounted
      setIsVisible(true);
    }, []);

    return (
      <div
        className={`transition-opacity duration-1000 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="my-10 flex flex-col md:flex-row gap-16">
          {/* Left Section: Image */}
          <div className="w-full md:w-[450px] h-auto object-cover" style={{ marginTop: '2rem' }}> 
            <img
              className="w-full h-auto object-cover -mt-6" // Adjust image slightly upward
              src={assets.about}
              alt=""
            />
          </div>

          {/* Right Section: Text Content */}
          <div className="flex flex-col justify-start gap-6 md:w-2/4 text-black">
            <div className="text-2xl" style={{ marginTop: '2rem' }} >
              <Title text1={'ABOUT'} text2={'US'} />
            </div>
            <p className="text-lg font-medium text-gray-700">
              Al-Che Pastry — From home-baked dreams to your neighborhood shop.
            </p>
            <p>Welcome to Al-Che Pastry Shop</p>
            <p>
              I’m Rherilyn Nicor, the proud owner of Al-Che Pastry. What started as a small home-based baking journey turned into a dream come true. After 3 years and 8 months of hard work, patience, and a whole lot of heart, our shop officially opened its doors on September 8, 2024.
            </p>
            <p>
              From baking in our home kitchen to having our very own store here in Campo Junction, Payatas A, Quezon City, this journey has been nothing short of amazing. At Al-Che, we offer cakes, cupcakes, cookies, and customized cakes for every kind of occasion — made with love and attention to detail.
            </p>
            <b className="text-gray-800">Our Mission</b>
            <p>
              At Al-Che Pastry, our mission is to craft delicious, lovingly made baked goods that bring joy to every celebration and everyday moment. We are committed to quality, creativity, and heartfelt service — delivering not just pastries, but a piece of our story with every bite. From our family to yours, we aim to make each occasion sweeter and more memorable.
            </p>
          </div>
        </div>

        <div className="text-xl py-4">
          <Title text1={'WHY'} text2={'CHOOSE US'} />
        </div>

        <div className="flex flex-col md:flex-row text-sm mb-20">
          <div className="border border-gray-800 px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
            <b>Quality Assurance:</b>
            <p className="text-gray-900">
              We meticulously select and vet each product to ensure it meets our stringent quality standards.
            </p>
          </div>
          <div className="border border-gray-800 px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
            <b>Convenience: </b>
            <p className="text-gray-900">
              With our user-friendly interface and hassle-free ordering process, shopping has never been easier.
            </p>
          </div>
          <div className="border border-gray-800 px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
            <b>Exceptional Customer Service:</b>
            <p className="text-gray-900">
              Our team of dedicated professionals is here to assist you the way, ensuring your satisfaction is our top priority.
            </p>
          </div>
        </div>
      </div>
    );
  };

  export default About;