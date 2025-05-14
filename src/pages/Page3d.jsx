import React, { useRef, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';

const Page3d = () => {
  const iframeRef = useRef(null);
  const { userName } = useContext(ShopContext);
  
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      // Wait for iframe to load
      iframe.onload = () => {
        iframe.contentWindow.postMessage({
          type: 'USER_DATA',
          data: userName
        }, 'http://localhost:3000');
      };
    }
  }, [userName]);

  return (
    <div className="mt-8 mb-8">
      <h1 className="text-3xl font-bold text-center mb-6">Cake Decorator</h1>
      <div className="w-full h-[80vh] rounded-lg border border-gray-200 overflow-hidden">
        <iframe 
          ref={iframeRef}
          src="http://localhost:3000/"
          title="Cake Decorator" 
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
};

export default Page3d;