import { useThree } from '@react-three/fiber';
import { useEffect, useState } from 'react';

const CanvasScreenshot = ({ onScreenshot }) => {
  const { gl, scene, camera } = useThree();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Wait for the scene to be fully rendered
    const timeout = setTimeout(() => {
      setIsReady(true);
    }, 500);
    
    return () => clearTimeout(timeout);
  }, []);
  
  useEffect(() => {
    if (!isReady) return;
    
    // Function to take a screenshot
    const takeScreenshot = () => {
      console.log("Taking screenshot of Three.js canvas");
      
      // Make sure everything is rendered
      gl.render(scene, camera);
      
      // Get the data URL
      const dataURL = gl.domElement.toDataURL('image/png');
      console.log("Screenshot captured, size:", dataURL.length);
      
      // Call the callback with the screenshot
      onScreenshot(dataURL);
      return dataURL;
    };
    
    // Take an initial screenshot when component is ready
    takeScreenshot();
    
    // Add a global method to take screenshots on demand
    window.takeCanvasScreenshot = takeScreenshot;
    
    return () => {
      delete window.takeCanvasScreenshot;
    };
  }, [gl, scene, camera, onScreenshot, isReady]);
  
  return null;
};

export default CanvasScreenshot;