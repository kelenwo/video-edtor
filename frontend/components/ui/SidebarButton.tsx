'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SidebarButtonProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg transition-colors ${
        active
          ? 'bg-[#3c3c3c] text-white'
          : 'hover:bg-[#3c3c3c] text-gray-400'
      }`}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-xs">{label}</span>
    </button>
  );
};

export default SidebarButton; 