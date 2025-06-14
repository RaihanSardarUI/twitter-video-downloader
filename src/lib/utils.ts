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
  // R2 upload related fields
  r2_stored?: boolean;
  r2_key?: string;
  content_hash?: string;
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

// R2 Upload interfaces
export interface R2UploadRequest {
  video_url: string;
  video_data: VideoData;
  content_type: 'adult' | 'general';
}

export interface R2UploadResponse {
  success: boolean;
  r2_key?: string;
  content_hash?: string;
  file_size?: number;
  duplicate?: boolean;
  message?: string;
  error?: string;
}

export interface StoredVideo {
  id: string;
  twitter_url: string;
  title: string;
  thumbnail_url?: string;
  r2_key: string;
  file_size: number;
  quality: string;
  content_hash: string;
  content_type: 'adult' | 'general';
  view_count: number;
  download_count: number;
  trending_score: number;
  created_at: string;
  updated_at: string;
}

export const formatFileSize = (bytes: number): string => {
  if (!bytes) return 'Unknown size';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const getApiBaseUrl = (): string => {
  const apiUrl = import.meta.env.PUBLIC_API_BASE_URL;
  if (!apiUrl) {
    throw new Error('PUBLIC_API_BASE_URL environment variable is not set!');
  }
  return apiUrl;
};

// Generate content hash for deduplication
export const generateContentHash = async (buffer: ArrayBuffer): Promise<string> => {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Generate R2 key for video storage
export const generateR2Key = (contentHash: string, filename: string): string => {
  const extension = filename.split('.').pop() || 'mp4';
  return `videos/${contentHash}/${contentHash}.${extension}`;
}; 