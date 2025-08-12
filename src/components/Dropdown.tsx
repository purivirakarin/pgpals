'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'emerald';
  disabled?: boolean;
}

export default function Dropdown({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option",
  className = "",
  icon,
  variant = 'default',
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isEmerald = variant === 'emerald';
  const triggerClasses = isEmerald
    ? "w-full flex items-center justify-between px-4 py-2 text-left bg-emerald-900/30 border border-emerald-400/30 text-emerald-100 rounded-lg shadow-sm hover:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-colors"
    : "w-full flex items-center justify-between px-4 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors";

  const menuClasses = isEmerald
    ? "absolute z-50 w-full mt-1 bg-emerald-900/90 border border-emerald-400/30 rounded-lg shadow-xl max-h-60 overflow-auto backdrop-blur-md"
    : "absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto";

  const optionClasses = (selected: boolean) =>
    selected
      ? (isEmerald
          ? 'bg-emerald-800/80 text-emerald-100 font-medium'
          : 'bg-primary-50 text-primary-700 font-medium')
      : (isEmerald
          ? 'text-emerald-100'
          : 'text-gray-900');

  return (
    <div className={`relative ${className}`} ref={dropdownRef} style={{ zIndex: 50 }}>
      <button
        type="button"
        onClick={() => { if (!disabled) setIsOpen(!isOpen) }}
        disabled={disabled}
        className={`${triggerClasses} ${disabled ? (isEmerald ? 'opacity-50 cursor-not-allowed' : 'opacity-50 cursor-not-allowed') : ''}`}
      >
        <div className="flex items-center">
          {icon && <span className={`mr-2 ${isEmerald ? 'text-emerald-300' : 'text-gray-400'}`}>{icon}</span>}
          <span className={selectedOption ? (isEmerald ? 'text-emerald-100' : 'text-gray-900') : (isEmerald ? 'text-emerald-300/70' : 'text-gray-500')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          className={`w-5 h-5 ${isEmerald ? 'text-emerald-300' : 'text-gray-400'} transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className={menuClasses}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left transition-colors ${
                isEmerald ? 'hover:bg-emerald-800/60' : 'hover:bg-gray-50'
              } ${optionClasses(option.value === value)}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
