'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface IconButtonProps {
  icon: LucideIcon;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ 
  icon: Icon, 
  active = false, 
  onClick,
  className = ''
}) => {
  return (
    <button 
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors ${
        active 
          ? 'bg-blue-600 text-white' 
          : 'hover:bg-gray-600'
      } ${className}`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
};

export default IconButton; 