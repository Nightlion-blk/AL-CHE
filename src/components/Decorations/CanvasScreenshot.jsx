import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

const CanvasScreenshot = ({ onScreenshot }) => {
  const { gl, scene, camera } = useThree();
  
  useEffect(() => {
    // Function to take a screenshot on demand
    const takeScreenshot = () => {
      console.log("Taking screenshot for thumbnail...");
      
      // Make sure everything is rendered
      gl.render(scene, camera);
      
      // Get the data URL
      const dataURL = gl.domElement.toDataURL('image/png');
      console.log("Screenshot captured for thumbnail, size:", dataURL.length);
      
      // Call the callback with the screenshot
      onScreenshot(dataURL);
      return dataURL;
    };
    
    // Only expose the method globally, don't take screenshot immediately
    window.takeCanvasScreenshot = takeScreenshot;
    
    return () => {
      delete window.takeCanvasScreenshot;
    };
  }, [gl, scene, camera, onScreenshot]);
  
  return null;
};

export default CanvasScreenshot;