import apiConfig from '../config/api.json';

export interface VideoData {
  success: boolean;
  title?: string;
  uploader?: string;
  duration_formatted?: string;
  view_count?: number;
  like_count?: number;
  thumbnail?: string;
  quality?: string;
  format?: string;
  file_size?: number;
  mp4_formats_found?: number;
  total_formats_found?: number;
  content_rating?: string;
  download_url: string;
  filename?: string;
  expires_at: number;
  available_qualities?: QualityOption[];
  message?: string;
}

export interface QualityOption {
  quality?: string;
  resolution?: string;
  format?: string;
  ext?: string;
  url: string;
  filename?: string;
  filesize?: number;
  file_size?: number;
  bitrate?: number;
  fps?: number;
  vbr?: number;
  abr?: number;
}

export const formatFileSize = (bytes: number): string => {
  if (!bytes) return 'Unknown size';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const getApiBaseUrl = (): string => {
  return apiConfig.apiBaseUrl;
};

export const getApiEndpoint = (endpoint: keyof typeof apiConfig.endpoints): string => {
  return `${apiConfig.apiBaseUrl}${apiConfig.endpoints[endpoint]}`;
};

export const getTrendingEndpoint = (period: string = '24h', limit: number = 20): string => {
  return `${apiConfig.apiBaseUrl}/trending?period=${period}&limit=${limit}`;
};

export const getFallbackApiEndpoints = (endpoint: keyof typeof apiConfig.endpoints): string[] => {
  return apiConfig.fallbackApiUrls.map(url => `${url}${apiConfig.endpoints[endpoint]}`);
};

export const getApiConfig = () => {
  return {
    timeout: apiConfig.timeout,
    retryAttempts: apiConfig.retryAttempts
  };
}; 