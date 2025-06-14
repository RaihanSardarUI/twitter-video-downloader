import React, { useState } from 'react';
import { VideoData, getApiBaseUrl, R2UploadRequest, R2UploadResponse } from '@/lib/utils';
import { DownloadForm } from './DownloadForm';
import { StatusMessage } from './StatusMessage';
import { DownloadResults } from './DownloadResults';
import { FeatureCards } from './FeatureCards';

export const TwitterVideoDownloader: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleDownload = async (url: string, adultContent: boolean, nonAdultContent: boolean) => {
    if (!url.trim()) {
      setStatusMessage({ message: 'Please enter a valid tweet URL', type: 'error' });
      return;
    }

    setIsLoading(true);
    setVideoData(null);
    setUploadStatus(null);
    
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
        
        // If adult content is selected, trigger R2 upload
        if (adultContent) {
          setUploadStatus({ message: 'Uploading to secure storage...', type: 'info' });
          await handleR2Upload(url, data, 'adult');
        }
        
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

  const handleR2Upload = async (twitterUrl: string, videoData: VideoData, contentType: 'adult' | 'general') => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const uploadRequest: R2UploadRequest = {
        video_url: twitterUrl,
        video_data: videoData,
        content_type: contentType
      };

      const response = await fetch(`${apiBaseUrl}/video/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uploadRequest)
      });

      const uploadResult: R2UploadResponse = await response.json();

      if (response.ok && uploadResult.success) {
        if (uploadResult.duplicate) {
          setUploadStatus({ 
            message: '✅ Video already exists in secure storage', 
            type: 'info' 
          });
        } else {
          setUploadStatus({ 
            message: '✅ Video uploaded to secure storage successfully', 
            type: 'success' 
          });
        }

        // Update video data with R2 information
        setVideoData(prev => prev ? {
          ...prev,
          r2_stored: true,
          r2_key: uploadResult.r2_key,
          content_hash: uploadResult.content_hash
        } : null);

      } else {
        setUploadStatus({ 
          message: `❌ Upload failed: ${uploadResult.error || 'Unknown error'}`, 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('R2 Upload error:', error);
      setUploadStatus({ 
        message: '❌ Upload failed: Network error', 
        type: 'error' 
      });
    }

    // Auto-hide upload status after 8 seconds
    setTimeout(() => {
      setUploadStatus(null);
    }, 8000);
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
          <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">
            🔒 Adult content is automatically stored in secure cloud storage for future access
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
            <div className="mb-4">
              <StatusMessage message={statusMessage.message} type={statusMessage.type} />
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus && (
            <div className="mb-4">
              <StatusMessage message={uploadStatus.message} type={uploadStatus.type} />
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