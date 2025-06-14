import { TrendingVideoService } from './api/trending';

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  VIDEOS: R2Bucket;
}

interface VideoFetchRequest {
  url: string;
  is_adult_content: boolean;
  is_non_adult_content: boolean;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const trendingService = new TrendingVideoService(env);

      // Video fetch endpoint with trending integration
      if (path === '/video/fetch' && request.method === 'POST') {
        const body = await request.json() as VideoFetchRequest;
        const { url: videoUrl, is_adult_content, is_non_adult_content } = body;

        if (!videoUrl) {
          return new Response(JSON.stringify({
            success: false,
            message: 'URL is required'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        try {
          // Call your existing video fetch API
          const videoData = await fetchVideoData(videoUrl, is_adult_content, is_non_adult_content);
          
          if (!videoData.success) {
            return new Response(JSON.stringify(videoData), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Get user info for analytics
          const userInfo = {
            ip: request.headers.get('CF-Connecting-IP') || undefined,
            userAgent: request.headers.get('User-Agent') || undefined,
            country: (request as any).cf?.country
          };

          // Handle trending system integration
          const trendingResult = await trendingService.handleVideoDownload(
            { ...videoData, originalUrl: videoUrl }, 
            is_adult_content, 
            userInfo
          );

          // Merge results
          const response = {
            ...videoData,
            trending: {
              isDuplicate: trendingResult.isDuplicate,
              downloadCount: trendingResult.downloadCount,
              message: trendingResult.message
            }
          };

          // If it's a duplicate adult video, use R2 URL
          if (is_adult_content && trendingResult.isDuplicate) {
            response.download_url = trendingResult.downloadUrl;
            response.filename = `trending_video_${trendingResult.downloadCount}.mp4`;
          } else if (is_adult_content && !trendingResult.isDuplicate) {
            // New adult video stored in R2
            response.download_url = trendingResult.downloadUrl;
            response.filename = `new_trending_video.mp4`;
          }

          return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          console.error('Video fetch error:', error);
          return new Response(JSON.stringify({
            success: false,
            message: 'Failed to fetch video data',
            error: error instanceof Error ? error.message : 'Unknown error'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Get trending videos endpoint
      if (path === '/trending' && request.method === 'GET') {
        const period = url.searchParams.get('period') as '24h' | '7d' | '30d' || '24h';
        const limit = parseInt(url.searchParams.get('limit') || '20') || 20;

        const trending = await trendingService.getTrendingVideos(period, limit);
        
        return new Response(JSON.stringify({
          success: true,
          ...trending
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get video statistics
      if (path === '/stats' && request.method === 'GET') {
        const stats = await getVideoStats(env.DB);
        
        return new Response(JSON.stringify({
          success: true,
          ...stats
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 404 for unknown endpoints
      return new Response(JSON.stringify({
        success: false,
        message: 'Endpoint not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

// Your existing video fetch function (placeholder - replace with actual implementation)
async function fetchVideoData(_url: string, _isAdult: boolean, _isNonAdult: boolean) {
  // This should call your existing Twitter video extraction API
  // For now, returning a mock response
  return {
    success: true,
    title: "Sample Video",
    uploader: "Sample User",
    duration_formatted: "120",
    view_count: 1000,
    like_count: 50,
    thumbnail: "https://example.com/thumb.jpg",
    download_url: "https://example.com/video.mp4",
    filename: "video.mp4",
    file_size: 5000000,
    available_qualities: []
  };
}

// Get overall statistics
async function getVideoStats(db: D1Database) {
  const totalVideos = await db.prepare(`
    SELECT COUNT(*) as count FROM video_downloads
  `).first();

  const totalDownloads = await db.prepare(`
    SELECT SUM(download_count) as total FROM video_downloads
  `).first();

  const last24h = await db.prepare(`
    SELECT COUNT(*) as count FROM video_downloads 
    WHERE last_downloaded >= datetime('now', '-1 day')
  `).first();

  const topUploaders = await db.prepare(`
    SELECT uploader, SUM(download_count) as total_downloads
    FROM video_downloads 
    WHERE uploader IS NOT NULL AND uploader != ''
    GROUP BY uploader 
    ORDER BY total_downloads DESC 
    LIMIT 10
  `).all();

  return {
    totalVideos: (totalVideos?.count as number) || 0,
    totalDownloads: (totalDownloads?.total as number) || 0,
    downloadsLast24h: (last24h?.count as number) || 0,
    topUploaders: topUploaders?.results || []
  };
} 