'use client';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function AdminModal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  maxWidth = 'max-w-md',
  showCloseButton = true,
  position // New prop: { top, left }
}) {
  const modalRef = useRef(null);
  const [modalStyle, setModalStyle] = useState({});

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      let style = {};
      if (position && position.top != null && position.left != null) {
        // Position modal near the click, with adjustments to stay in viewport
        const { innerWidth, innerHeight } = window;
        const { offsetWidth, offsetHeight } = modalRef.current;
        
        let top = position.top + 10; // Add a small offset
        let left = position.left + 10;

        if (left + offsetWidth > innerWidth - 20) {
          left = innerWidth - offsetWidth - 20;
        }
        if (top + offsetHeight > innerHeight - 20) {
          top = innerHeight - offsetHeight - 20;
        }
        if (top < 10) top = 10;
        if (left < 10) left = 10;
        
        style = {
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
        };
      } else {
        // Default: center the modal
        style = {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
      }
      setModalStyle(style);
    }
  }, [isOpen, position]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm"
      style={{ zIndex: 99998 }}
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        style={{ ...modalStyle, zIndex: 99999 }}
        className={`relative w-full bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
            {title && <h3 className="text-xl font-semibold text-gray-800">{title}</h3>}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            )}
          </div>
        )}
        
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
}
