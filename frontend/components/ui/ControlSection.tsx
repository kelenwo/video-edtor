'use client';

import React from 'react';

interface ControlSectionProps {
  title: string;
  children: React.ReactNode;
}

const ControlSection: React.FC<ControlSectionProps> = ({ title, children }) => {
  return (
    <div>
      <h3 className="text-sm text-gray-400 mb-2">{title}</h3>
      {children}
    </div>
  );
};

export default ControlSection; 