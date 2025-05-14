import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';

const CodeVerification = ({ email, onNext, onCancel }) => {
  const { userName, setUserName, otpEmail, setToken } = useContext(ShopContext);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);  
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
const navigate = useNavigate(); 

  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as minutes:seconds
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    // Validate code format - ensuring it's 6 digits
    if (!code.trim() || !/^\d{6}$/.test(code)) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Verifying Email:', email);
      const response = await axios.post('http://localhost:8080/api/users/verify-otp', {
        e_Mail: email, 
        otp: code
      });
      
      if (response.data.success) {
        const userData = { 
          id: response.data.id,
          name: response.data.name,
          role: response.data.role,
          address: response.data.address,
          contacts: response.data.contacts,
          e_Mail: response.data.e_Mail,
      };

      setUserName(userData);

      console.log('User data:', userName);

      localStorage.setItem('user', JSON.stringify(userData));
      
      onNext(response.data); 
      
      if(userData.role === 'admin') {
        setToken(response.data.token);
        localStorage.setItem('Token', response.data.token);
        navigate('/admin'); // Redirect to admin dashboard
      } else {
        setToken(response.data.token);
        localStorage.setItem('Token', response.data.token);
        navigate('/'); // Redirect to user dashboard
      }
      } else {
        setError(response.data.message || 'Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError(
        error.response?.data?.message || 
        'Could not verify code. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowDialog(true);
  };

  const confirmCancel = () => {
    try {
      // Clear all authentication data
      localStorage.removeItem('Token');
      localStorage.removeItem('user');
      
      // Reset context states
      setToken(null);
      setUserName(null);
      
      // Close dialog first
      setShowDialog(false);
      
      // Call the onCancel prop from parent
      if (typeof onCancel === 'function') {
        onCancel();  // This should set needsVerification to false in parent
      }
      
      // Navigation is now handled by the parent component
      console.log('Verification cancelled, returning to login');
    } catch (error) {
      console.error('Error during cancel:', error);
    }
  };

  const closeDialog = () => {
    setShowDialog(false);
 // Redirect to home or another page
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Use the same email source as in handleVerify for consistency
      const response = await axios.post('http://localhost:8080/api/users/resend-otp', {
        e_Mail: email
      });
      
      if (response.data.success) {
        setTimeLeft(300); // Reset timer to 5 minutes
        alert('A new verification code has been sent to your email.');
      } else {
        setError(response.data.message || 'Failed to resend code.');
      }
    } catch (error) {
      setError('Failed to resend code. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Get the email to display - prefer context if available, fallback to prop
  const displayEmail = userName?.email || email;

  return (
    <div className="floating-modal-container">
      <div className="floating-modal-overlay" onClick={onCancel}></div>
      <div className="floating-modal-content">
        <form onSubmit={handleVerify} className="code-verification-form">
          <h2 className="code-title">Verify Code</h2>
          <p className="code-description">
            Enter the 6-digit code we sent to your email
            {displayEmail && <strong> ({displayEmail})</strong>}
          </p>

          {timeLeft > 0 && (
            <div className="code-timer">
              Code expires in: <span className="timer-text">{formatTime(timeLeft)}</span>
            </div>
          )}

          {timeLeft <= 0 && (
            <div className="code-expired">
              Code expired. Please request a new one.
            </div>
          )}

          <input
            type="text"
            className="code-input"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').substring(0, 6))}
            maxLength="6"
            disabled={loading || timeLeft <= 0}
          />

          {error && <div className="code-error">{error}</div>}

          <div className="button-group">
            <button
              type="submit"
              className="verify-button"
              disabled={loading || timeLeft <= 0}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>

          <div className="resend-code">
            {timeLeft <= 0 ? (
              <button
                type="button"
                className="resend-button"
                onClick={handleResendCode}
                disabled={loading}
              >
                Resend Code
              </button>
            ) : (
              <button
                type="button"
                className="resend-button-disabled"
                disabled
              >
                Resend Code {timeLeft > 0 && `(${formatTime(timeLeft)})`}
              </button>
            )}
          </div>
        </form>

        {showDialog && (
          <div className="confirmation-dialog">
            <p>Are you sure you want to cancel and go back?</p>
            <div className="dialog-buttons">
              <button className="confirm-button" onClick={confirmCancel}>
                Confirm
              </button>
              <button className="cancel-dialog-button" onClick={closeDialog}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeVerification;