import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Download, Clipboard, Loader2, Shield, Users, AlertTriangle } from 'lucide-react';

interface DownloadFormProps {
  onSubmit: (url: string, adultContent: boolean, nonAdultContent: boolean) => void;
  isLoading: boolean;
}

export const DownloadForm: React.FC<DownloadFormProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState('');
  const [contentType, setContentType] = useState<'none' | 'adult' | 'general'>('none');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const adultContent = contentType === 'adult';
    const nonAdultContent = contentType === 'general';
    onSubmit(url, adultContent, nonAdultContent);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <label htmlFor="tweetUrl" className="block text-base sm:text-lg font-semibold text-gray-700 mb-2 sm:mb-3">
          Tweet URL
        </label>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.46 5.924c-.793.352-1.645.59-2.54.698a4.48 4.48 0 001.963-2.475 8.94 8.94 0 01-2.828 1.082A4.48 4.48 0 0016.11 4c-2.48 0-4.49 2.014-4.49 4.495 0 .352.04.695.116 1.022C7.728 9.37 4.1 7.6 1.67 4.905a4.48 4.48 0 00-.607 2.262c0 1.56.794 2.936 2.003 3.744a4.48 4.48 0 01-2.034-.563v.057c0 2.18 1.55 4.002 3.604 4.417a4.48 4.48 0 01-2.027.077c.572 1.785 2.23 3.084 4.195 3.12A8.98 8.98 0 012 19.54a12.68 12.68 0 006.88 2.017c8.26 0 12.78-6.84 12.78-12.77 0-.195-.004-.39-.013-.583A9.14 9.14 0 0024 4.59a8.93 8.93 0 01-2.54.698z"/>
              </svg>
            </span>
            <Input
              type="url"
              id="tweetUrl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://x.com/user/status/123456789"
              className="w-full pl-10 pr-4 sm:pl-12 sm:pr-6 py-3 sm:py-4 text-base sm:text-lg border border-gray-300 rounded-lg focus:border-[#1DA1F2] focus:ring-2 focus:ring-[#1DA1F2]/20 outline-none transition-all duration-200 bg-white"
              required
            />
          </div>
          <Button
            type="button"
            variant="paste"
            onClick={handlePaste}
            className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 font-medium px-4 sm:px-6 py-3 sm:py-4 rounded-lg transition-all duration-200 hover:bg-gray-50 active:bg-gray-100 focus:outline-none"
          >
            <Clipboard className="w-5 h-5" />
            <span>Paste</span>
          </Button>
        </div>
      </div>
      
      {/* Content Type Selection */}
      <div className="mt-4 mb-4">
        <div className="mb-3">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Content Type</h3>
          <p className="text-xs text-gray-600">Select content preference</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Adult Content Option */}
          <div 
            className={`
              relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 group
              ${contentType === 'adult' 
                ? 'border-red-500 bg-red-50 shadow-sm' 
                : 'border-gray-200 bg-white hover:border-red-300'
              }
            `}
            onClick={() => setContentType('adult')}
          >
            <div className="flex items-center space-x-2">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200
                ${contentType === 'adult' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600 group-hover:bg-red-200'}
              `}>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-800 text-sm">Adult Content</h4>
                <p className="text-xs text-gray-600 truncate">Mature content</p>
              </div>
              <div className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200
                ${contentType === 'adult' 
                  ? 'border-red-500 bg-red-500' 
                  : 'border-gray-300 group-hover:border-red-400'
                }
              `}>
                {contentType === 'adult' && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </div>
            </div>
          </div>

          {/* General Content Option */}
          <div 
            className={`
              relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 group
              ${contentType === 'general' 
                ? 'border-green-500 bg-green-50 shadow-sm' 
                : 'border-gray-200 bg-white hover:border-green-300'
              }
            `}
            onClick={() => setContentType('general')}
          >
            <div className="flex items-center space-x-2">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200
                ${contentType === 'general' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600 group-hover:bg-green-200'}
              `}>
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-800 text-sm">General Content</h4>
                <p className="text-xs text-gray-600 truncate">Family-friendly</p>
              </div>
              <div className={`
                w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200
                ${contentType === 'general' 
                  ? 'border-green-500 bg-green-500' 
                  : 'border-gray-300 group-hover:border-green-400'
                }
              `}>
                {contentType === 'general' && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {contentType === 'none' && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center text-amber-800">
              <Shield className="w-3 h-3 mr-2 flex-shrink-0" />
              <span className="text-xs font-medium">Please select a content type</span>
            </div>
          </div>
        )}
      </div>

      <Button
        type="submit"
        variant="twitter"
        size="xl"
        disabled={isLoading || contentType === 'none'}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#1DA1F2] to-[#0C85E8] text-white font-semibold py-4 rounded-lg shadow-md hover:from-[#0C85E8] hover:to-[#1DA1F2] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]/50 text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Download className="w-6 h-6" />
            <span>Download Video</span>
          </>
        )}
      </Button>
    </form>
  );
}; 