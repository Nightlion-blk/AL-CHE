import React, { useState, useEffect } from 'react';
import { assets } from '../assets/assets';
import '../index.css';

const Hero = () => {
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0); // State for slideshow
    const [isVisible, setIsVisible] = useState(false); // State for fade-in animation

    const slides = [
        {
            type: 'content', // First slide: current content
            content: (
                <div className="flex flex-col sm:flex-row items-center justify-between hero-gradient-bg">
                    {/* Hero Left Side */}
                    <div className="w-full sm:w-1/2 flex items-start sm:items-center justify-center sm:justify-start py-10 sm:py-0 px-4 sm:px-8">
                        <div className="text-[#2a2929] text-left sm:text-center">
                            <div className="flex items-center justify-start sm:justify-center gap-2">
                                <p className="w-8 md:w-11 h-[2px] bg-[#7d333f]"></p>
                                <p className="font-medium text-sm md:text-base text-[#7d333f]">OUR BESTSELLERS</p>
                                <p className="w-8 md:w-11 h-[2px] bg-[#7d333f]"></p>
                            </div>

                            <h1 className="prata-regular text-3xl sm:text-4xl lg:text-5xl leading-relaxed text-[#7d333f]">
                                CAKES FOR ALL OCCASIONS
                            </h1>

                            <div className="flex items-center justify-start sm:justify-center gap-2">
                                <p className="font-semibold text-sm md:text-base text-[#7d333f]">SHOP NOW</p>
                                <p className="w-8 md:w-11 h-[2px] bg-[#7d333f]"></p>
                            </div>
                        </div>
                    </div>

                    {/* Hero Right Side */}
                    <div className="w-full sm:w-1/2">
                        <img
                            className="w-full h-auto max-h-[400px] sm:max-h-[500px] object-contain mx-auto"
                            src={assets.herocake2}
                            alt="Hero Cake"
                        />
                    </div>
                </div>
            ),
        },
        {
            type: 'image', // Second slide: additional image 1
            content: (
                <img
                    className="w-full h-auto max-h-[400px] sm:max-h-[600px] object-fill mx-auto"
                    src={assets.cakejonah1}
                    alt="Cake Hero 1"
                />
            ),
        },
        {
            type: 'image', // Third slide: additional image 2
            content: (
                <img
                    className="w-full h-auto max-h-[400px] sm:max-h-[600px] object-fill mx-auto"
                    src={assets.cakejonah}
                    alt="Cake Hero 2"
                />
            ),
        },
    ];

    useEffect(() => {
        // Trigger fade-in animation on component mount
        setIsVisible(true);

        // Automatically switch slides every 5 seconds
        const interval = setInterval(() => {
            setCurrentSlideIndex((prevIndex) => (prevIndex + 1) % slides.length);
        }, 5000); // 5000ms = 5 seconds

        return () => clearInterval(interval); // Cleanup interval on component unmount
    }, [slides.length]);

    const handlePrev = () => {
        setCurrentSlideIndex((prevIndex) =>
            prevIndex === 0 ? slides.length - 1 : prevIndex - 1
        );
    };

    const handleNext = () => {
        setCurrentSlideIndex((prevIndex) =>
            (prevIndex + 1) % slides.length
        );
    };

    return (
        <div
            className={`flex items-center justify-center w-screen h-screen overflow-hidden transition-opacity duration-1000 ${
                isVisible ? 'opacity-100' : 'opacity-0'
            }`}
        >
            {/* Render the current slide */}
            <div className="absolute inset-0 w-screen h-full flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center">
                    {slides[currentSlideIndex].content}
                </div>
            </div>

            {/* Navigation Buttons */}
            <button
                onClick={handlePrev}
                className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full z-10"
            >
                &#8249; {/* Left arrow */}
            </button>
            <button
                onClick={handleNext}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full z-10"
            >
                &#8250; {/* Right arrow */}
            </button>

            </div>
    );
};

export default Hero;
