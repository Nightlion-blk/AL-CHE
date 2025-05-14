import React from 'react';

const CheckoutButton = ({amount, description, }) => {
    
  const handleCheckout = async () => {

    const response = await fetch('`http://localhost:8080/api/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        amount: 10000, // ₱100.00 (in centavos)
        description: 'Order #123' 
      }),
    });
    const { checkoutSessionId } = await response.json();

    // 2. Redirect to PayMongo Checkout
    window.location.href = `https://paymongo.com/checkout/${checkoutSessionId}`;
  };

  return <button onClick={handleCheckout}>Pay Now</button>;
}

export default CheckoutButton;