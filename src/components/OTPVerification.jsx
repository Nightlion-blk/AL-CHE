import React, { useState } from 'react';
import axios from 'axios';

const VerifyOTP = ({ email, onValidateOtp, onCancel }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!otp.trim() || !/^\d+$/.test(otp)) {
      setError('⚠ Please enter a valid OTP.');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      console.log('Verifying Email:', email);
      const response = await axios.post('http://localhost:8080/api/users/verify-otp', {

        e_Mail: email,
        otp: otp
      });
      
      if (response.data.success) {
        // Call the parent function with the response data
        onValidateOtp(true, response.data);
      } else {
        setError(`⚠ ${response.data.message || 'Verification failed. Please try again.'}`);
        onValidateOtp(false);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to verify OTP. Please try again.';
      setError(`⚠ ${errorMessage}`);
      onValidateOtp(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowDialog(true);
  };

  const confirmCancel = () => {
    setShowDialog(false);
    onCancel();
  };

  const closeDialog = () => {
    setShowDialog(false);
  };

  // Add ability to resend OTP if needed
  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    
    try {

      const response = await axios.post('http://localhost:8080/api/users/resend-otp', {
        e_Mail: email
      });
      
      if (response.data.success) {
        alert('A new OTP has been sent to your email');
      } else {
        setError(`⚠ ${response.data.message || 'Failed to resend OTP.'}`);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to resend OTP.';
      setError(`⚠ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-container">
      <h2 className="otp-title">Enter OTP</h2>
      <p className="otp-description">
        We've sent a six-digit code to <strong>{email}</strong>. Please enter it below to verify your identity.
      </p>
      
      <form onSubmit={handleSubmit} className="otp-form">
        <input
          type="text"
          className="otp-input"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
          placeholder="Enter OTP"
          maxLength="6"
          required
          disabled={loading}
        />
        
        {error && <p className="otp-error">{error}</p>}
        
        <div className="otp-button-group">
          <button 
            type="submit" 
            className="otp-verify-button"
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
          
          <button 
            type="button" 
            className="otp-cancel-button" 
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
        
        <div className="otp-resend">
          <button
            type="button"
            className="otp-resend-button"
            onClick={handleResendOTP}
            disabled={loading}
          >
            Resend OTP
          </button>
        </div>
      </form>

      {showDialog && (
        <div className="otp-confirmation-dialog">
          <p>Are you sure you want to cancel and go back?</p>
          <div className="otp-dialog-buttons">
            <button className="otp-confirm-button" onClick={confirmCancel}>
              Confirm
            </button>
            <button className="otp-cancel-dialog-button" onClick={closeDialog}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyOTP;