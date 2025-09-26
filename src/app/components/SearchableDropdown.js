'use client';

import { useState, useEffect, useRef } from 'react';

export default function SearchableDropdown({ 
  label,
  value,
  onChange,
  placeholder = "Ketik untuk mencari atau pilih dari daftar",
  options = [],
  onLoadOptions,
  required = false,
  className = "",
  allowCustom = true // Allow user to enter custom values
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Initialize search term with current value
  useEffect(() => {
    if (value) {
      setSearchTerm(value);
    }
  }, [value]);

  // Filter options based on search term
  useEffect(() => {
    if (searchTerm.length > 0) {
      const filtered = options.filter(option => 
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options.slice(0, 10)); // Show first 10 options when no search
    }
  }, [searchTerm, options]);

  // Load options when dropdown opens or search term changes
  useEffect(() => {
    if (isOpen && onLoadOptions && searchTerm.length === 0 && options.length === 0) {
      setLoading(true);
      onLoadOptions().finally(() => setLoading(false));
    }
  }, [isOpen, onLoadOptions, searchTerm, options.length]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        // If user typed something but didn't select, use the typed value (if allowCustom)
        if (allowCustom && searchTerm !== value) {
          onChange(searchTerm);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [allowCustom, searchTerm, value, onChange]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    
    // If allowCustom, update value immediately as user types
    if (allowCustom) {
      onChange(newValue);
    }
  };

  const handleOptionSelect = (option) => {
    setSearchTerm(option.name);
    onChange(option.name, option);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (allowCustom) {
        onChange(searchTerm);
      }
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          required={required}
        />
        
        {/* Dropdown Arrow */}
        <div 
          className="absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-gray-500 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                Memuat...
              </div>
            </div>
          ) : filteredOptions.length > 0 ? (
            <>
              {filteredOptions.map((option, index) => (
                <div
                  key={option.id || index}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleOptionSelect(option)}
                >
                  <div className="font-medium text-gray-900">{option.name}</div>
                  {option.subtitle && (
                    <div className="text-sm text-gray-500">{option.subtitle}</div>
                  )}
                </div>
              ))}
              {allowCustom && searchTerm && !filteredOptions.some(opt => opt.name.toLowerCase() === searchTerm.toLowerCase()) && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    💡 <strong>Tips:</strong> Anda bisa mengetik manual jika tidak menemukan pilihan yang sesuai
                  </div>
                </div>
              )}
            </>
          ) : searchTerm ? (
            <div className="px-3 py-2 text-gray-500 text-center">
              {allowCustom ? (
                <div>
                  <div>Tidak ditemukan hasil untuk "{searchTerm}"</div>
                  <div className="text-xs mt-1 text-blue-600">Tekan Enter untuk menggunakan nilai ini</div>
                </div>
              ) : (
                <div>Tidak ditemukan hasil untuk "{searchTerm}"</div>
              )}
            </div>
          ) : (
            <div className="px-3 py-2 text-gray-500 text-center">
              Ketik untuk mencari...
            </div>
          )}
        </div>
      )}
    </div>
  );
}