import React, { useEffect, useState } from 'react';
import './HomePage.css';
import BankLogo from '../images/BankLogo.png'; 
import Image1 from '../images/SlideImage_1.jpg'
import Image2 from '../images/SlideImage_2.jpeg'
import Image3 from '../images/Support.jpg'

function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: Image1,
      heading: 'Welcome to Our Bank: Rytech International – Your Financial Partner for Life',
      description: 'At Rytech International, we pride ourselves on being more than just a financial institution; we are your trusted partner for handling payments around the globe. With the ever-increasing need for seamless and secure international transactions, Rytech International offers a robust platform designed to support individuals and businesses alike in managing their cross-border payments effortlessly.'
    },
    {
      image: Image2,
      heading: 'Security and Compliance',
      description: 'Security is paramount to our operations. With Rytech International, every transaction is guarded by advanced encryption protocols and fraud detection systems. We comply with global regulations and local standards, ensuring that all your payments are processed in line with the legal requirements of both the sending and receiving countries. Our SWIFT system integration ensures that your payments are safely routed through secure financial channels, minimizing the risk of delays or disruptions.'
    },
    {
      image: Image3,
      heading: 'Tailored Customer Support',
      description: 'Our team of experts is dedicated to supporting you throughout the payment process. Whether you need assistance setting up an international payment, understanding exchange rates, or managing payment histories, Rytech International offers round-the-clock support to ensure your experience is smooth and worry-free.'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    document.body.classList.add('homepage');
    return () => {
      document.body.classList.remove('homepage');
    };
  }, []);

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-left">
          <img src={BankLogo} alt="Bank Logo" className="logo" />
          <span className="bank-name">Rytech International</span>
        </div>
        <div className="navbar-right">
          <a href="/register" className="nav-link">Register</a>
          <a href="/login" className="nav-link">Login</a>
        </div>
      </nav>

      <div className="carousel-container">
        {/* Left Arrow */}
        <button className="arrow left-arrow" onClick={prevSlide}>
          &#10094;
        </button>

        <div className="carousel-slide">
          <div
            className="carousel-image"
            style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
          >
            <div className="carousel-content">
              <h2>{slides[currentSlide].heading}</h2>
              <p>{slides[currentSlide].description}</p>
            </div>
          </div>
        </div>

        {/* Right Arrow */}
        <button className="arrow right-arrow" onClick={nextSlide}>
          &#10095;
        </button>
      </div>
    </div>
  );
}

export default HomePage;
