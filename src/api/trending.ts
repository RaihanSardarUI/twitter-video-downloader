// Trending Video System with Duplicate Detection
import { createHash } from 'crypto';

interface VideoData {
  success: boolean;
  title?: string;
  uploader?: string;
  duration_formatted?: string;
  view_count?: number;
  like_count?: number;
  thumbnail?: string;
  download_url: string;
  filename?: string;
  file_size?: number;
  originalUrl?: string;
  video_url?: string;
}

interface UserInfo {
  ip?: string;
  userAgent?: string;
  country?: string;
}

interface DuplicateResult {
  found: boolean;
  type?: 'EXACT_TWEET_MATCH' | 'CONTENT_HASH_MATCH';
  videoId?: number;
  r2Url?: string;
  downloadCount?: number;
  data?: any;
}

interface StoreResult {
  videoId: number;
  r2Url: string;
  r2ObjectKey: string;
  downloadCount: number;
  fileSize: number;
}

// TrendingVideo interface moved to TrendingSection.tsx where it's used

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  VIDEOS: R2Bucket;
  R2_PUBLIC_URL: string;
}

export class TrendingVideoService {
  private db: D1Database;
  private kv: KVNamespace;
  private r2: R2Bucket;
  private r2PublicUrl: string;

  constructor(env: Env) {
    this.db = env.DB;
    this.kv = env.CACHE;
    this.r2 = env.VIDEOS;
    this.r2PublicUrl = env.R2_PUBLIC_URL;
  }

  // Extract tweet ID from various Twitter URL formats
  extractTweetId(url: string): string | null {
    const patterns = [
      /twitter\.com\/\w+\/status\/(\d+)/,
      /x\.com\/\w+\/status\/(\d+)/,
      /mobile\.twitter\.com\/\w+\/status\/(\d+)/,
      /t\.co\/\w+.*status\/(\d+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  // Create content hash for duplicate detection
  createContentHash(title?: string, uploader?: string, duration?: string): string {
    const content = `${title?.toLowerCase().trim() || ''}_${uploader || ''}_${duration || 0}`;
    return createHash('md5').update(content).digest('hex');
  }

  // Check for duplicate videos
  async checkForDuplicate(videoData: VideoData): Promise<DuplicateResult> {
    const tweetId = this.extractTweetId(videoData.originalUrl || videoData.video_url || '');
    const contentHash = this.createContentHash(videoData.title, videoData.uploader, videoData.duration_formatted);

    // Check by tweet ID first (most reliable)
    if (tweetId) {
      const tweetResult = await this.db.prepare(`
        SELECT id, r2_object_key, r2_public_url, download_count, title, uploader
        FROM video_downloads 
        WHERE tweet_id = ?
      `).bind(tweetId).first();

      if (tweetResult) {
        return {
          found: true,
          type: 'EXACT_TWEET_MATCH',
          videoId: tweetResult.id as number,
          r2Url: tweetResult.r2_public_url as string,
          downloadCount: tweetResult.download_count as number,
          data: tweetResult
        };
      }
    }

    // Check by content hash
    const contentResult = await this.db.prepare(`
      SELECT id, r2_object_key, r2_public_url, download_count, title, uploader
      FROM video_downloads 
      WHERE content_hash = ?
    `).bind(contentHash).first();

    if (contentResult) {
      return {
        found: true,
        type: 'CONTENT_HASH_MATCH',
        videoId: contentResult.id as number,
        r2Url: contentResult.r2_public_url as string,
        downloadCount: contentResult.download_count as number,
        data: contentResult
      };
    }

    return { found: false };
  }

  // Update download statistics for duplicate
  async updateDownloadStats(videoId: number, userInfo: UserInfo = {}): Promise<number> {
    const now = new Date().toISOString();
    
    // Update main video record
    await this.db.prepare(`
      UPDATE video_downloads 
      SET 
        download_count = download_count + 1,
        last_downloaded = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(now, now, videoId).run();

    // Add to download history
    await this.db.prepare(`
      INSERT INTO download_history (video_id, downloaded_at, user_ip, user_agent)
      VALUES (?, ?, ?, ?)
    `).bind(videoId, now, userInfo.ip || null, userInfo.userAgent || null).run();

    // Get updated count
    const result = await this.db.prepare(`
      SELECT download_count FROM video_downloads WHERE id = ?
    `).bind(videoId).first();

    return (result?.download_count as number) || 0;
  }

  // Upload video to R2 and save metadata
  async storeNewVideo(videoData: VideoData, userInfo: UserInfo = {}): Promise<StoreResult> {
    const tweetId = this.extractTweetId(videoData.originalUrl || videoData.video_url || '');
    const contentHash = this.createContentHash(videoData.title, videoData.uploader, videoData.duration_formatted);
    
    try {
      // Download video from original URL
      const videoResponse = await fetch(videoData.download_url);
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.status}`);
      }

      const videoBuffer = await videoResponse.arrayBuffer();
      const fileHash = createHash('md5').update(new Uint8Array(videoBuffer)).digest('hex');
      
      // Generate R2 object key
      const timestamp = Date.now();
      const extension = videoData.filename?.split('.').pop() || 'mp4';
      const r2ObjectKey = `videos/${tweetId || contentHash}/${timestamp}.${extension}`;
      
      // Upload to R2
      await this.r2.put(r2ObjectKey, videoBuffer, {
        httpMetadata: {
          contentType: videoData.filename?.includes('.mp4') ? 'video/mp4' : 'video/mp4',
          cacheControl: 'public, max-age=31536000', // 1 year cache
        },
        customMetadata: {
          originalUrl: videoData.originalUrl || videoData.video_url || '',
          title: videoData.title || '',
          uploader: videoData.uploader || '',
          tweetId: tweetId || '',
          uploadedAt: new Date().toISOString()
        }
      });

      // Generate public URL using environment variable
      const r2PublicUrl = `${this.r2PublicUrl}/${r2ObjectKey}`;
      
      // Save to database
      const now = new Date().toISOString();
      const insertResult = await this.db.prepare(`
        INSERT INTO video_downloads (
          tweet_id, video_url, canonical_url, title, uploader, duration,
          view_count, like_count, thumbnail_url, content_hash, file_hash,
          r2_object_key, r2_public_url, file_size, content_rating,
          download_count, first_downloaded, last_downloaded, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        tweetId,
        videoData.originalUrl || videoData.video_url,
        videoData.originalUrl || videoData.video_url,
        videoData.title || '',
        videoData.uploader || '',
        parseInt(videoData.duration_formatted || '0') || 0,
        videoData.view_count || 0,
        videoData.like_count || 0,
        videoData.thumbnail || '',
        contentHash,
        fileHash,
        r2ObjectKey,
        r2PublicUrl,
        videoBuffer.byteLength,
        'adult',
        1,
        now,
        now,
        now,
        now
      ).run();

      // Add to download history
      await this.db.prepare(`
        INSERT INTO download_history (video_id, downloaded_at, user_ip, user_agent)
        VALUES (?, ?, ?, ?)
      `).bind(insertResult.meta.last_row_id, now, userInfo.ip || null, userInfo.userAgent || null).run();

      return {
        videoId: insertResult.meta.last_row_id as number,
        r2Url: r2PublicUrl,
        r2ObjectKey: r2ObjectKey,
        downloadCount: 1,
        fileSize: videoBuffer.byteLength
      };

    } catch (error) {
      console.error('Error storing video:', error);
      throw new Error(`Failed to store video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Main function to handle video download with duplicate detection
  async handleVideoDownload(videoData: VideoData, isAdultContent: boolean, userInfo: UserInfo = {}) {
    if (!isAdultContent) {
      // Non-adult content: just return original download URL
      return {
        isDuplicate: false,
        downloadUrl: videoData.download_url,
        message: "Video download ready (not stored in trending collection)"
      };
    }

    try {
      // Check for duplicates FIRST
      const duplicate = await this.checkForDuplicate(videoData);
      
      if (duplicate.found && duplicate.videoId && duplicate.r2Url) {
        // Update stats and return existing R2 URL
        const newDownloadCount = await this.updateDownloadStats(duplicate.videoId, userInfo);
        
        return {
          isDuplicate: true,
          duplicateType: duplicate.type,
          downloadUrl: duplicate.r2Url,
          downloadCount: newDownloadCount,
          videoData: duplicate.data,
          message: `Video already in trending collection! Downloaded ${newDownloadCount} times.`
        };
      }

      // New video: Store in R2 and database
      const storeResult = await this.storeNewVideo(videoData, userInfo);
      
      return {
        isDuplicate: false,
        downloadUrl: storeResult.r2Url,
        downloadCount: 1,
        videoId: storeResult.videoId,
        fileSize: storeResult.fileSize,
        message: "Video added to trending collection!"
      };

    } catch (error) {
      console.error('Error in handleVideoDownload:', error);
      // Fallback to original URL if storage fails
      return {
        isDuplicate: false,
        downloadUrl: videoData.download_url,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: "Storage failed, using original download URL"
      };
    }
  }

  // Get trending videos
  async getTrendingVideos(period: '24h' | '7d' | '30d' = '24h', limit: number = 20) {
    const cacheKey = `trending_${period}_${limit}`;
    
    // Try cache first
    const cached = await this.kv.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    let timeFilter = '';
    switch (period) {
      case '24h':
        timeFilter = "AND last_downloaded >= datetime('now', '-1 day')";
        break;
      case '7d':
        timeFilter = "AND last_downloaded >= datetime('now', '-7 days')";
        break;
      case '30d':
        timeFilter = "AND last_downloaded >= datetime('now', '-30 days')";
        break;
    }

    const trending = await this.db.prepare(`
      SELECT 
        id, tweet_id, title, uploader, thumbnail_url, r2_public_url,
        download_count, view_count, like_count, duration,
        first_downloaded, last_downloaded
      FROM video_downloads 
      WHERE content_rating = 'adult' ${timeFilter}
      ORDER BY download_count DESC, last_downloaded DESC
      LIMIT ?
    `).bind(limit).all();

    const result = {
      period,
      videos: trending.results || [],
      generatedAt: new Date().toISOString()
    };

    // Cache for 10 minutes
    await this.kv.put(cacheKey, JSON.stringify(result), { expirationTtl: 600 });
    
    return result;
  }
} 