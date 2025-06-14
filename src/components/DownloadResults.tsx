import React from 'react';
import { VideoData, QualityOption, formatFileSize } from '@/lib/utils';
import { Button } from './ui/button';
import { Download, ExternalLink, AlertTriangle } from 'lucide-react';

interface DownloadResultsProps {
  data: VideoData;
}

export const DownloadResults: React.FC<DownloadResultsProps> = ({ data }) => {
  
  // Filter for MP4 formats only - exclude m3u8 and other streaming formats
  const mp4Qualities = data.available_qualities ? 
    data.available_qualities.filter((quality: QualityOption) => {
      const format = (quality.format || quality.ext || '').toLowerCase();
      const url = (quality.url || '').toLowerCase();
      
      // Exclude m3u8 streaming formats first
      if (format.includes('m3u8') || url.includes('.m3u8') || url.includes('m3u8')) {
        return false;
      }
      
      // Include MP4 formats or assume MP4 if format is empty/unknown but URL looks like MP4
      return format === 'mp4' || 
             format.includes('mp4') || 
             format === '' || 
             !format ||
             url.includes('.mp4');
    }) : [];

  const renderQualitiesSection = () => {
    if (mp4Qualities.length > 0) {
      return (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">
            🎬 MP4 Options ({mp4Qualities.length})
          </h4>
          <div className="grid gap-2 sm:gap-3">
                        {mp4Qualities.map((quality: QualityOption, index: number) => {
              const fileSize = quality.filesize || quality.file_size;
              const hasValidSize = fileSize && fileSize > 0;
              
              return (
                <div key={index} className={`border ${index === 0 ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'} rounded-lg p-2`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {index === 0 && <div className="text-green-600 font-bold text-xs">🏆</div>}
                      <div className="font-semibold text-gray-800 text-sm truncate">{quality.quality || quality.resolution || 'Unknown'}</div>
                      <div className="text-xs text-blue-600 font-medium">MP4</div>
                      {hasValidSize && (
                        <div className="text-xs text-gray-500 hidden sm:block">{formatFileSize(fileSize)}</div>
                      )}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button asChild size="sm" className="flex-1 sm:flex-none text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded transition-colors touch-manipulation">
                        <a href={quality.url} download={quality.filename || data.filename}>
                          📥 Download
                        </a>
                      </Button>
                      <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded transition-colors touch-manipulation">
                        <a href={quality.url} target="_blank" rel="noopener noreferrer">
                          🔗 Open
                        </a>
                      </Button>
                    </div>
                    {hasValidSize && (
                      <div className="text-xs text-gray-500 sm:hidden text-center">{formatFileSize(fileSize)}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    } else if (data.available_qualities && data.available_qualities.length > 0) {
      return (
        <div className="mt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center text-yellow-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <div>
                <p className="font-medium">No MP4 formats found</p>
                <p className="text-sm">Only other video formats are available for this tweet.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
        🎬 MP4 Qualities Ready!
      </h2>
      
      <div className="border border-gray-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
        <div className="flex items-start space-x-2 sm:space-x-3 mb-2 sm:mb-3">
          {data.thumbnail && (
            <img 
              src={data.thumbnail} 
              alt="Video thumbnail" 
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-md object-cover flex-shrink-0" 
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-1 break-words line-clamp-2">
              {data.title ? (data.title.length > 60 ? data.title.substring(0, 60) + '...' : data.title) : 'No title'}
            </h3>
            <div className="flex flex-wrap gap-1 sm:gap-2 text-xs text-gray-500">
              {data.uploader && <span>👤 {data.uploader.length > 15 ? data.uploader.substring(0, 15) + '...' : data.uploader}</span>}
              {data.duration_formatted !== 'Unknown' && <span>⏱️ {data.duration_formatted}</span>}
              {data.view_count && <span>👁️ {data.view_count.toLocaleString()}</span>}
            </div>
          </div>
        </div>
        
        {/* Format Analysis Stats */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-2 mb-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="truncate"><span className="font-medium">🏆</span> <span className="text-green-600 font-semibold">{data.quality}</span></div>
            <div className="truncate"><span className="font-medium">📁</span> {data.format}</div>
            {data.file_size && data.file_size > 0 && (
              <div className="truncate"><span className="font-medium">📊</span> {formatFileSize(data.file_size)}</div>
            )}
            <div className="truncate"><span className="font-medium">🎬</span> <span className="text-purple-600 font-semibold">{data.mp4_formats_found || 0} MP4s</span></div>
          </div>
        </div>
        
        {/* Quick Download Best Quality */}
        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <Button asChild variant="success" className="flex-1 inline-flex items-center justify-center bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 text-sm touch-manipulation">
            <a href={data.download_url} download={data.filename}>
              <Download className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">🏆 Download Best ({data.quality})</span>
            </a>
          </Button>
          <Button asChild variant="secondary" className="sm:w-auto inline-flex items-center justify-center bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 text-sm touch-manipulation">
            <a href={data.download_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>🔗 Open</span>
            </a>
          </Button>
        </div>
        
        {renderQualitiesSection()}
        
        <div className="mt-2 text-xs text-gray-500 border-t pt-2 text-center sm:text-left">
          ⚠️ Links expire: {new Date(data.expires_at * 1000).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}; 