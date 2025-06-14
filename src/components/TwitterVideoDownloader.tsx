import React, { useState } from 'react';
import { VideoData, getApiBaseUrl } from '@/lib/utils';
import { DownloadForm } from './DownloadForm';
import { StatusMessage } from './StatusMessage';
import { DownloadResults } from './DownloadResults';
import { FeatureCards } from './FeatureCards';

export const TwitterVideoDownloader: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [videoData, setVideoData] = useState<VideoData | null>(null);

  const handleDownload = async (url: string, adultContent: boolean, nonAdultContent: boolean) => {
    if (!url.trim()) {
      setStatusMessage({ message: 'Please enter a valid tweet URL', type: 'error' });
      return;
    }

    setIsLoading(true);
    setVideoData(null);
    
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/video/fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          is_adult_content: adultContent,
          is_non_adult_content: nonAdultContent
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVideoData(data);
        setStatusMessage({ message: 'Video found successfully!', type: 'success' });
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setStatusMessage(null);
        }, 5000);
      } else {
        setStatusMessage({ 
          message: data.message || 'Failed to fetch video. Please check the URL and try again.', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setStatusMessage({ message: 'Network error. Please try again later.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-800 mb-3 sm:mb-4 leading-tight">
            <span className="text-[#1DA1F2]">Twitter</span> Video Downloader
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-2 leading-relaxed">
            Download videos from Twitter/X in <span className="font-semibold text-blue-600">MP4 format only</span>. Get the best quality automatically or choose from <span className="font-semibold text-green-600">all available MP4 resolutions</span>!
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Download Form */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 md:p-12 mb-6 sm:mb-8">
            <DownloadForm onSubmit={handleDownload} isLoading={isLoading} />
          </div>

          {/* Status Messages */}
          {statusMessage && (
            <div className="mb-8">
              <StatusMessage message={statusMessage.message} type={statusMessage.type} />
            </div>
          )}

          {/* Download Results */}
          {videoData && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 md:p-12">
              <DownloadResults data={videoData} />
            </div>
          )}

          {/* Features Section */}
          <FeatureCards />
        </div>
      </div>
    </div>
  );
}; 