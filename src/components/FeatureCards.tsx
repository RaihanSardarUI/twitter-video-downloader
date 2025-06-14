import React from 'react';
import { Download, CheckCircle, Shield } from 'lucide-react';

export const FeatureCards: React.FC = () => {
  const features = [
    {
      icon: Download,
      title: 'Fast Downloads',
      description: 'Get your videos in seconds with our optimized API'
    },
    {
      icon: CheckCircle,
      title: 'MP4 Only',
      description: 'Universal MP4 format with all available resolutions'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is safe and never stored on our servers'
    }
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mt-12 sm:mt-16">
      {features.map((feature, index) => (
        <div key={index} className="text-center">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#1DA1F2]/10 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <feature.icon className="w-6 h-6 sm:w-8 sm:h-8 text-[#1DA1F2]" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}; 