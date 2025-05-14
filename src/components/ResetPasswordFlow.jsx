import React, { useState, useEffect } from 'react';
import ResetPassword from '../components/ResetPassword';
import VerifyOTP from '../components/OTPVerification';
import NewPassword from '../components/NewPassword'; // You'll need to create this component

const ResetPasswordFlow = () => {
  console.log('ResetPasswordFlow rendering'); // Add this at component top level

  const [step, setStep] = useState('email'); // 'email', 'verify', or 'newPassword'
  const [email, setEmail] = useState('');
  const [resetData, setResetData] = useState(null);

  // Function to handle email submission and move to OTP verification
  const handleEmailSubmit = (emailValue) => {
    console.log('Email submitted:', emailValue); // Debugging line
    setEmail(emailValue);
  };
  
  useEffect(() => {
    if (email) {  // Only proceed if email exists
      console.log("Email updated, now changing to verify step:", email);
      setStep('verify');
    }
  }, [email]); 
  // Function to handle OTP verification and move to new password creation
  const handleOtpValidate = (isValid, data) => {
    if (isValid) {
      setResetData(data);
      setStep('newPassword');
    }
  };

  // Function to handle going back from OTP verification to email
  const handleOtpCancel = () => {
    setStep('email');
  };

  return (
    <div className="reset-password-flow">
      {step === 'email' && (
        <ResetPassword onNext={handleEmailSubmit} />
      )}
      
      {step === 'verify' && (
        <VerifyOTP 
          email={email} 
          onValidateOtp={handleOtpValidate} 
          onCancel={handleOtpCancel}
        />
      )}
      
      {step === 'newPassword' && (
        <NewPassword 
          email={email} 
          resetData={resetData} 
        />
      )}
    </div>
  );
};

export default ResetPasswordFlow;
