import React from 'react';

const Footer = () => {
  return (
    <div>
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>

        <div>
          {/* Replaced logo with text and heart icon */}
          <div className='flex items-center gap-2 mb-5'>
            <p className='text-2xl font-bold text-gray-800'>AL-CHE PASTRY</p>
            <span className='text-pink-500 text-2xl'>&hearts;</span>
          </div>
          <p className='w-full md:w-2/3 text-gray-600'>
          What began as a humble home-based baking journey has grown into a charming neighborhood shop offering cakes, cupcakes, cookies, and customized creations for all occasions. Every treat is crafted with love, detail, and a deep sense of gratitude for the support of family, friends, and the community. Al-Che Pastry is more than a bakery — it's a dream turned reality, bringing sweetness to every celebration.
          </p>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>COMPANY</p>
          <ul className='flex flex-col gap-1 text-gray-600'>
            <li>Contact #</li>
            <li>Email</li>
            <li>Address</li>
            <li>Privacy policy</li>
          </ul>
        </div>

        <div>
          <p className='text-xl font-medium mb-5'>GET IN TOUCH</p>
          <ul className='flex flex-col gap-1 text-gray-600'>
            <li>0966 408 0148</li>
            <li>Contact@foreveryou.com</li>
            <li>Saint Mary corner St. Campo Junction brgy. Payatas A Quezon City 198 Metro Manila</li>
          </ul>
        </div>

      </div>

      <div>
        <hr />
        <p className='py-5 text-sm text-center'>Copyright 2024@ AlChePastry.com - All Right Reserved.</p>
      </div>

    </div>
  );
};

export default Footer;
