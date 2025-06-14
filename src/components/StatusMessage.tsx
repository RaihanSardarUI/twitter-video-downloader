import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface StatusMessageProps {
  message: string;
  type: 'success' | 'error';
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ message, type }) => {
  const bgColor = type === 'success' 
    ? 'bg-green-50 border-green-200 text-green-800' 
    : 'bg-red-50 border-red-200 text-red-800';

  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`border-2 ${bgColor} rounded-xl p-4`}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
}; 