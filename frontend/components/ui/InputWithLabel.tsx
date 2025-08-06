'use client';

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface InputWithLabelProps {
  label: string;
  value: string;
  hasPlusMinus?: boolean;
  onChange?: (value: string) => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
}

const InputWithLabel: React.FC<InputWithLabelProps> = ({ 
  label, 
  value, 
  hasPlusMinus = false,
  onChange,
  onIncrement,
  onDecrement
}) => {
  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
        {label}
      </span>
      <input 
        type="text" 
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full bg-[#3c3c3c] rounded-md p-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {hasPlusMinus && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
          <button 
            onClick={onIncrement}
            className="p-0.5 hover:bg-gray-600 rounded"
          >
            <ChevronUp className="w-3 h-3 text-gray-500" />
          </button>
          <button 
            onClick={onDecrement}
            className="p-0.5 hover:bg-gray-600 rounded"
          >
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>
        </div>
      )}
    </div>
  );
};

export default InputWithLabel; 