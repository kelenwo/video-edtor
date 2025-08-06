'use client'

import React, { ReactNode } from 'react';

interface CreateNewCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}

export const CreateNewCard = ({
  title,
  description,
  icon,
  onClick
}: CreateNewCardProps) => {
  return (
    <div 
      className="bg-white rounded-md border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer flex items-start" 
      onClick={onClick}
    >
      <div className="p-3 bg-gray-100 rounded-md mr-3">{icon}</div>
      <div>
        <h3 className="font-medium text-gray-800">{title}</h3>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  );
};