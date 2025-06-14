import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

interface StatusMessageProps {
  message: string;
  type: 'success' | 'error' | 'info';
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ message, type }) => {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'error':
        return AlertCircle;
      case 'info':
        return Info;
      default:
        return Info;
    }
  };

  const Icon = getIcon();

  return (
    <div className={`border-2 ${getStyles()} rounded-xl p-4`}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <p className="font-medium">{message}</p>
      </div>
    </div>
  );
}; 