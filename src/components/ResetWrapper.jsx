import React, { useState } from 'react';
import ResetPassword from '../components/ResetPassword';
import NewPassword from '../components/NewPassword';
import CodeVerification from '../components/CodeVerification';
import VerifyOTP from '../components/OTPVerification'; 
import '../style/ResetPassword.css';
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom';

const ResetWrapper = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

    // Define the handleOtpValidation function
    const handleOtpValidation = (isValid) => {
      if (isValid) {
        setStep(3); // Navigate to the code verification step
      } else {
        alert('Invalid OTP. Please try again.');
      }
    };
  
  const goToCodeStep = () => setStep(2);
  const goToPasswordStep = () => setStep(4);
  const goBack = () => {
    if (step === 1) return navigate(-1);
    setStep((prev) => prev - 1);
  };

  return (
    <div style={{ marginTop: '5rem'}}>
      <div className="reset-password-page">
      <div className="left-panel">
        <button className="back-button" onClick={goBack}>
          ← Back
        </button>
        <img src={assets.cake} alt="cake" className="hero" /> {/* Properly closed img tag */}
      </div>
      <div className="right-panel">
        {step === 1 && <ResetPassword onNext={goToCodeStep} />}
        {step === 2 && <VerifyOTP onValidateOtp={handleOtpValidation} onCancel={() => setStep(1)} />}
        {step === 3 && (
          <CodeVerification
            onNext={goToPasswordStep}
            onCancel={() => setStep(1)}
          />
        )}
        {step === 4 && <NewPassword />}
      </div>
      </div>
    </div>
  );
};

export default ResetWrapper;