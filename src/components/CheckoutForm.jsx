import React, { useEffect } from 'react';
import axios from 'axios';

const CheckoutForm = ({ checkoutId, cartId }) => {
  useEffect(() => {
    // Flag to track if checkout is being abandoned
    let isLeavingCheckout = false;
    
    // Handler for when user attempts to leave page
    const handleBeforeUnload = (e) => {
      // Only mark as abandoned if this is a genuine navigation away
      if (!isLeavingCheckout) {
        isLeavingCheckout = true;
        
        // Notify backend about potential abandonment
        const markAsAbandoned = async () => {
          try {
            await axios.post('/api/checkout/mark-abandoning', { 
              checkoutId,
              cartId,
              reason: 'browser_closed'
            });
          } catch (error) {
            console.error('Failed to mark checkout as abandoning:', error);
          }
        };
        
        // Use sendBeacon for more reliable delivery during page unload
        if (navigator.sendBeacon) {
          const data = new FormData();
          data.append('checkoutId', checkoutId);
          data.append('cartId', cartId);
          data.append('reason', 'browser_closed');
          
          navigator.sendBeacon('/api/checkout/mark-abandoning-beacon', data);
        } else {
          // Fallback to regular AJAX
          markAsAbandoned();
        }
      }
      
      // Show a confirmation message (browser dependent)
      e.returnValue = 'Are you sure you want to leave? Your checkout progress will be saved.';
      return e.returnValue;
    };
    
    // Handle back/forward navigation
    const handlePopState = () => {
      if (!isLeavingCheckout) {
        isLeavingCheckout = true;
        
        // Notify backend about navigation away
        axios.post('/api/checkout/mark-abandoning', { 
          checkoutId,
          cartId, 
          reason: 'navigation_away'
        }).catch(err => {
          console.error('Failed to mark checkout as abandoning:', err);
        });
      }
    };
    
    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [checkoutId, cartId]);
  
};

export default CheckoutForm;