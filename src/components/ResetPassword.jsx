import React, { useState } from 'react';
import '../style/ResetPassword.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const ResetPassword = ({ onNext, onBack }) => {
  console.log("ResetPassword received onNext prop:", typeof onNext);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Email entered:', email); // Debugging line
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:8080/api/users/resend-otp', { e_Mail: email });
      if (response.data.success) {
        onNext(email);
      } else {
        toast.error(response.data.message || 'Failed to send reset code. Please try again.');
      }
    } catch (error) {
      console.error('Error sending reset code:', error);
      toast.error('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">

      <h2 className="reset-title">Reset Password</h2>
      <p className="description">Enter your email. We'll send you a verification code.</p>
      
      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          className="email-input" 
          placeholder="Enter your email" 
          value={email}
          onChange={handleEmailChange}
          required
        />
        
        <button 
          type="submit" 
          className="reset-btn"
          disabled={loading}
          
        >
          {loading ? 'Sending...' : 'Continue'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;