'use client';
import { useState, useEffect } from 'react';

export default function ScrollToTopButton({ 
  showAfter = 500, 
  className = "",
  position = "bottom-6 right-6"
}) {
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > showAfter);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfter]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!showScrollToTop) return null;

  return (
    <button
      onClick={scrollToTop}
      className={`fixed ${position} bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-40 group ${className}`}
      title="Scroll ke atas (berguna saat halaman panjang)"
    >
      <svg
        className="w-6 h-6 transform group-hover:-translate-y-1 transition-transform"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M5 10l7-7m0 0l7 7m-7-7v18" 
        />
      </svg>
    </button>
  );
}
