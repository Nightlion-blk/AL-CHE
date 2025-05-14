import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const NewPassword = ({email, resetData}) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirm) {
      toast.error('Passwords do not match!');
      return;
    } 
    
    setLoading(true);
    
    try {
        console.log('Resetting password for:', email);
      const response = await axios.post('http://localhost:8080/api/users/reset-password', {
        e_Mail: email,
        newPassword: password
      });
      
      if (response.data.success) {
        toast.success('Password successfully reset!');
        setTimeout(() => {
        navigate('/login');
        }, 2000);
      } else {
        toast.error(response.data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error(error.response?.data?.message || 'An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="new-password-container">
      <h2 className="new-password-title">Set New Password</h2>
      <form onSubmit={handleSubmit} className="new-password-form">
        <input
          type="password"
          className="new-password-input"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          className="new-password-input"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button type="submit" className="new-password-button">
          Submit
        </button>
      </form>
    </div>
  );
};

export default NewPassword;
