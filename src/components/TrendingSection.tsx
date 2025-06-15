import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Eye, Heart, Download, Calendar } from 'lucide-react';
import { getTrendingEndpoint } from '@/lib/utils';

interface TrendingVideo {
  id: number;
  tweet_id: string;
  title: string;
  uploader: string;
  thumbnail_url: string;
  r2_public_url: string;
  download_count: number;
  view_count: number;
  like_count: number;
  duration: number;
  first_downloaded: string;
  last_downloaded: string;
}

interface TrendingData {
  period: string;
  videos: TrendingVideo[];
  generatedAt: string;
}

interface ApiResponse {
  success: boolean;
  period?: string;
  videos?: TrendingVideo[];
  generatedAt?: string;
  message?: string;
}

export const TrendingSection: React.FC = () => {
  const [trendingData, setTrendingData] = useState<TrendingData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrending = async (period: '24h' | '7d' | '30d') => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiUrl = getTrendingEndpoint(period, 20);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as ApiResponse;
      
      if (data.success && data.period && data.videos && data.generatedAt) {
        setTrendingData({
          period: data.period,
          videos: data.videos,
          generatedAt: data.generatedAt
        });
      } else {
        setError(data.message || 'Failed to fetch trending videos');
      }
    } catch (err) {
      setError('Network error while fetching trending videos');
      console.error('Trending fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending(selectedPeriod);
  }, [selectedPeriod]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleVideoDownload = (video: TrendingVideo) => {
    window.open(video.r2_public_url, '_blank');
  };

  const periodLabels = {
    '24h': '24 Hours',
    '7d': '7 Days', 
    '30d': '30 Days'
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Trending Videos</h2>
        </div>
        
        {/* Period Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {Object.entries(periodLabels).map(([period, label]) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period as '24h' | '7d' | '30d')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          <span className="ml-2 text-gray-600">Loading trending videos...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => fetchTrending(selectedPeriod)}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Trending Videos Grid */}
      {trendingData && trendingData.videos.length > 0 && (
        <div className="space-y-4">
          {trendingData.videos.map((video, index) => (
            <div 
              key={video.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>

              {/* Thumbnail */}
              <div className="flex-shrink-0 w-20 h-14 bg-gray-200 rounded-lg overflow-hidden">
                {video.thumbnail_url ? (
                  <img 
                    src={video.thumbnail_url} 
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {video.title || 'Untitled Video'}
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  @{video.uploader || 'Unknown'}
                </p>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatNumber(video.view_count)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {formatNumber(video.like_count)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(video.duration)}
                  </span>
                </div>
              </div>

              {/* Download Stats */}
              <div className="flex-shrink-0 text-center">
                <div className="flex items-center gap-1 text-red-600 font-bold">
                  <Download className="w-4 h-4" />
                  {formatNumber(video.download_count)}
                </div>
                <p className="text-xs text-gray-500">downloads</p>
              </div>

              {/* Download Button */}
              <button
                onClick={() => handleVideoDownload(video)}
                className="flex-shrink-0 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Download
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {trendingData && trendingData.videos.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Trending Videos</h3>
          <p className="text-gray-600">
            No videos have been downloaded in the selected time period.
          </p>
        </div>
      )}

      {/* Generated At */}
      {trendingData && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Updated: {formatDate(trendingData.generatedAt)}
          </p>
        </div>
      )}
    </div>
  );
}; 