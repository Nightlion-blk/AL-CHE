import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import heroCake from '../assets/heroCake.png'; // Adjust the path as necessary
import { assets } from '../assets/assets';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import ResetPasswordFlow from '../components/ResetPasswordFlow'; // Import ResetPassword component
import CodeVerification from '../components/CodeVerification';

const Login = () => {
    const { token, setToken, setUserName, userName } = useContext(ShopContext);
    const [currentState, setCurrentState] = useState('Login');
    const [errorMessage, setErrorMessage] = useState('');
    // State for log in form
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    // State for sign up form
    const [signUpName, setSignUpName] = useState('');
    const [signUpUsername, setSignUpUsername] = useState('');
    const [signUpEmail, setSignUpEmail] = useState('');
    const [signUpPassword, setSignUpPassword] = useState('');
    const [signUpAddress, setSignUpAddress] = useState('');
    const [signUpcontacts, setSignUpContacts] = useState('');
    // State for fade-in animation
    const [isVisible, setIsVisible] = useState(false); // State for fade-in animation
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false); // State for modal visibility
    const [showPrivacyConsentModal, setShowPrivacyConsentModal] = useState(false); // State for privacy consent modal
    const [isCheckboxChecked, setIsCheckboxChecked] = useState(false); // State to track checkbox
    const [checkboxError, setCheckboxError] = useState(''); // State for error message

    // Add states for email verification
    const [needsVerification, setNeedsVerification] = useState(false);
    const [userDataForVerification, setUserDataForVerification] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        // Trigger fade-in animation when the component is mounted
        setIsVisible(true);
    }, []);

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        try {
            if (currentState === 'Login') {
                if (!loginEmail || !loginPassword) {
                    setErrorMessage('Please fill in all fields.');
                    return;
                }
                const response = await axios.post('http://localhost:8080/api/users/login', {
                    e_Mail: loginEmail,  // Changed from email to e_Mail
                    password: loginPassword,
                });

                if (response.data.success) {
                    const receivedToken = response.data.token;
                    // Store user data with consistent structure
                    const userData = { 
                        id: response.data.id,
                        name: response.data.name,
                        role: response.data.role,
                        address: response.data.address,
                        contacts: response.data.contacts,
                        e_Mail: response.data.e_Mail,
                    };

                    // Check if email verification is needed
                    if (response.data.requiresVerification) {
                        // Store user data for later use after verification
                        setUserDataForVerification({
                            userData: userData,
                            token: receivedToken,
                            email: loginEmail 
                        });
                        setNeedsVerification(true);
                    } else {
                        // Complete login normally
                        completeLogin(userData, receivedToken);
                    }
                } else {
                    setErrorMessage(response.data.message || 'Invalid email or password');
                }
            } else {
                if (!signUpName || !signUpEmail || !signUpPassword || !signUpUsername) {
                    setErrorMessage('Please fill in all fields.');
                    return;
                }

                const response = await axios.post('http://localhost:8080/api/users/register', {
                    fullName: signUpName,
                    username: signUpUsername,
                    e_Mail: signUpEmail,
                    password: signUpPassword,
                    address: signUpAddress,
                    contacts: signUpcontacts,
                });

                if (response.status === 200) {
                    alert('Sign Up Successful');
                    setSignUpName('');
                    setSignUpUsername('');
                    setSignUpEmail('');
                    setSignUpPassword('');
                    setSignUpAddress('');
                    setSignUpContacts('');
                    setCurrentState('Login');
                } else {
                    setErrorMessage(response.data.message || 'Sign Up failed');
                }
            }
        } catch (error) {
            setErrorMessage('An error occurred. Please try again.');
            console.error('Error:', error.response?.data || error.message);
        }
    };

    // Function to complete the login process after verification if needed
    const completeLogin = (userData, receivedToken) => {
        setToken(receivedToken);
        setUserName(userData);
        
        localStorage.setItem('Token', receivedToken);
        localStorage.setItem('user', JSON.stringify(userData));

        alert('Login Successful');
        setErrorMessage('');
        setLoginEmail('');
        setLoginPassword('');

        const role = userData.role;
        console.log('User Role:', role);
        
        if (role === 'admin') {
            navigate('/admin');
        } else {
            navigate('/');
        }
    };

    // Handle successful verification
    const handleVerificationSuccess = (verificationData) => {
        if (userDataForVerification) {
            completeLogin(
                userDataForVerification.userData,
                userDataForVerification.token,
                userDataForVerification.email
            );
        }
    };

    // Handle verification cancellation
    const handleVerificationCancel = () => {
        setNeedsVerification(false);
        setUserDataForVerification(null);
        // Optionally navigate back to login form state
        setCurrentState('Login');
      };

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode (token);
                const currentTime = Date.now() / 1000; // Current time in seconds
                if (decoded.exp && decoded.exp > currentTime) {
                    const remainingTime = (decoded.exp * 1000) - Date.now(); // Time in 
                    console.log('Token is valid. Remaining time:', remainingTime);
                    navigate('/'); // Redirect to home page
                    const timer = setTimeout(() => {
                        console.log('Token has expired');
                        localStorage.removeItem('Token'); // Clear token
                        setToken(null); // Clear token in context
                        navigate('/Login'); // Redirect to login
                    }, remainingTime);
    
                    return () => clearTimeout(timer); // Cleanup on unmount
                } else {
                    console.log('Token has expired');
                    localStorage.removeItem('Token'); // Clear invalid token
                    setToken(null); // Clear token in context
                    navigate('/Login'); // Redirect to login
                }
            } catch (error) {
                console.error('Invalid token:', error);
                localStorage.removeItem('Token'); // Clear invalid token
                setToken(null); // Clear token in context
                navigate('/Login'); // Redirect to login
            }
        }
    }, [token, navigate, setToken]);

    const handleAcceptPrivacyConsent = () => {
        if (!isCheckboxChecked) {
            setCheckboxError('You must agree to the terms before proceeding.');
            return;
        }
        setCheckboxError(''); // Clear error if checkbox is checked
        setShowPrivacyConsentModal(false); // Close the modal
        setCurrentState('Sign Up'); // Proceed to the sign-up form
    };

    const handleCancelPrivacyConsent = () => {
        setShowPrivacyConsentModal(false); // Close the modal
        setCurrentState('Login'); // Return to the login form
    };

    // If verification is needed, render the CodeVerification component
    if (needsVerification) {
        console.log('Email' + userDataForVerification.email)
        return (
            <CodeVerification 
                email={userDataForVerification.email}
                onNext={handleVerificationSuccess}
                onCancel={handleVerificationCancel}
            />
        );
    }
    return (
        <div
            className={`transition-opacity duration-1000 ${
                isVisible ? 'opacity-100' : 'opacity-0'
            }`}
        >
            {/* Horizontal Line */}
            <hr className="page-divider" />
            <div className="split-layout flex flex-col md:flex-row items-center justify-center min-h-screen bg-[#fff4f4]">
                {/* Left Section for Image */}
                <div className="left-section w-full md:w-1/2 flex justify-center items-center pt-24 md:pt-0 pb-8 md:py-0">
                    <img
                        src={assets.herocake2}
                        alt="heroCake"
                        className="w-2/3 max-w-xs md:max-w-md h-auto object-contain mx-auto"
                    />
                </div>

                {/* Right Section for Form */}
                <div className="right-section w-full md:w-1/2 flex justify-center items-start md:items-center px-4 md:px-0 mt-[-6rem] md:mt-0">
                    <form onSubmit={onSubmitHandler} className="form-container">
                        <div className="inline-flex items-center gap-2 mb-2 mt-10">
                            <p className="prata-regular text-3xl">{currentState}</p>
                            <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
                        </div>

                        {/* Sign Up Form */}
                        {currentState === 'Sign Up' && (
                            <>
                                <input
                                    className="w-full px-3 py-2 border border-gray-800"
                                    type="text"
                                    placeholder="Full Name"
                                    value={signUpName}
                                    onChange={(e) => setSignUpName(e.target.value)}
                                    name='signup-fullname'
                                    autoComplete='new-password'
                                    required
                                />
                                <input
                                    className="w-full px-3 py-2 border border-gray-800"
                                    type="text"
                                    placeholder="Username"
                                    value={signUpUsername}
                                    onChange={(e) => setSignUpUsername(e.target.value)}
                                    name='signup-username'
                                    autoComplete='new-password'
                                    required
                                />
                                <input
                                    className="w-full px-3 py-2 border border-gray-800"
                                    type="text"
                                    placeholder="Address"
                                    value={signUpAddress}
                                    onChange={(e) => setSignUpAddress(e.target.value)}
                                    name='signup-address'
                                    autoComplete='new-password'
                                    required
                                />
                                <input
                                    className="w-full px-3 py-2 border border-gray-800"
                                    type="email"
                                    placeholder="Enter your Email"
                                    value={signUpEmail}
                                    onChange={(e) => setSignUpEmail(e.target.value)}
                                    name='signup-email'
                                    autoComplete='new-password'
                                    required
                                />
                                  <input
                                    className="w-full px-3 py-2 border border-gray-800"
                                    type="tel"
                                    placeholder="Phone Number"
                                    value={signUpcontacts}
                                    onChange={(e) => setSignUpContacts(e.target.value)}
                                    name='signup-phone'
                                    autoComplete='new-password'
                                    required
                                />
                                <input
                                    className="w-full px-3 py-2 border border-gray-800"
                                    type="password"
                                    placeholder="Enter your Password"
                                    value={signUpPassword}
                                    onChange={(e) => setSignUpPassword(e.target.value)}
                                    name='signup-password'
                                    autoComplete='new-password'
                                    required
                                />
                            </>
                        )}

                        {/* Login Form */}
                        {currentState === 'Login' && (
                            <>
                                <input
                                    className="w-full px-3 py-2 border border-gray-800"
                                    type="email"
                                    placeholder="Enter your Email"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    required
                                />
                                <input
                                    className="w-full px-3 py-2 border border-gray-800"
                                    type="password"
                                    placeholder="Enter your Password"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    required
                                />
                            </>
                        )}

                        {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

                        <div className="w-full flex justify-between text-sm mt-[-8px]">
                            <p
                                onClick={() => setShowForgotPasswordModal(true)} // Open modal
                                className="cursor-pointer text-blue-500"
                            >
                                Forgot Password?
                            </p>
                            {currentState === 'Login' ? (
                                <p
                                    onClick={() => setShowPrivacyConsentModal(true)} // Open privacy consent modal
                                    className="cursor-pointer"
                                >
                                    Create account
                                </p>
                            ) : (
                                <p onClick={() => setCurrentState('Login')} className="cursor-pointer">
                                    Login here
                                </p>
                            )}
                        </div>

                        <button type="submit" className="bg-black text-white font-light px-8 py-2 mt-4">
                            {currentState === 'Login' ? 'Sign in' : 'Sign up'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-4 rounded shadow-lg w-full max-w-[95vw] sm:w-96 relative">
                        <button
                            onClick={() => {
                                setShowForgotPasswordModal(false); // Close the modal
                                setCurrentState('Login'); // Return to the login form
                            }}
                            className="absolute top-4 left-4 text-black font-medium flex items-center"
                        >
                            ← Back
                        </button>
                        <ResetPasswordFlow
                            onNext={(email) => console.log('Proceeding with email:', email)} // Handle next step
                        />
                    </div>
                </div>
            )}

            {/* Privacy Consent Modal */}
            {showPrivacyConsentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50">
                    <div className="bg-white p-6 rounded shadow-lg w-full max-w-[95vw] sm:w-[80rem] sm:max-w-[70%] mt-20 sm:mt-24 relative max-h-[80vh] overflow-y-auto">
                        <h2 className="text-lg font-bold mb-4">Data Privacy Consent Form</h2>
                        <p className="text-sm text-gray-700 mb-4">
                            In compliance with the Data Privacy Act of 2012 (R.A. 10173), we are committed to protecting your personal data and ensuring transparency in how we handle your information.
                        </p>
                        <p className="text-sm text-gray-700 mb-4">
                            By signing up and providing your personal data through this platform, you acknowledge that we may collect the following personal information:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-700 mb-4">
                            <li>Full Name</li>
                            <li>Email Address</li>
                            <li>Contact Number</li>
                            <li>Address</li>
                        </ul>
                        <p className="text-sm text-gray-700 mb-4">
                            Your personal data will be used solely for purposes such as account creation and management, communication regarding services and support, internal analytics, and compliance with legal obligations. We guarantee that your data will not be shared with third parties without your explicit consent, unless required by law.
                        </p>
                        <p className="text-sm text-gray-700 mb-4">
                            We ensure the protection of your data by implementing appropriate organizational, physical, and technical security measures. These safeguard your information against unauthorized access, use, or disclosure.
                        </p>
                        <p className="text-sm text-gray-700 mb-4">
                            Your personal data will be retained only for as long as necessary to fulfill the purposes for which it was collected, or as required by applicable laws and regulations.
                        </p>
                        <p className="text-sm text-gray-700 mb-4">
                            Under the Data Privacy Act, you have the right to be informed, object to processing, access, correct, and delete your personal data. You also have the right to withdraw your consent at any time and file a complaint with the National Privacy Commission (NPC) if you believe your rights have been violated.
                        </p>
                        <p className="text-sm text-gray-700 mb-4">
                            ✅ By checking the box below, you confirm that you have read, understood, and consented to the collection and processing of your personal data as outlined in this form.
                        </p>
                        <div className="flex items-center mb-4">
                            <input
                                type="checkbox"
                                id="privacyConsent"
                                className="mr-2"
                                required
                                checked={isCheckboxChecked}
                                onChange={(e) => setIsCheckboxChecked(e.target.checked)}
                            />
                            <label htmlFor="privacyConsent" className="text-sm text-gray-700">
                                I agree to the collection and use of my personal data in accordance with this Data Privacy Consent Form.
                            </label>
                        </div>
                        {checkboxError && <p className="text-red-500 text-sm">{checkboxError}</p>}
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={handleCancelPrivacyConsent}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAcceptPrivacyConsent}
                                className="bg-blue-500 text-white px-4 py-2 rounded"
                            >
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
