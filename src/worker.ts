import { TrendingVideoService } from './api/trending';

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  VIDEOS: R2Bucket;
  R2_PUBLIC_URL: string;
}

interface VideoFetchRequest {
  url: string;
  is_adult_content: boolean;
  is_non_adult_content: boolean;
}

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
  available_qualities?: any[];
  message?: string;
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
          const videoData = await fetchVideoData(videoUrl, is_adult_content, is_non_adult_content) as VideoData;
          
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
          console.log('Processing adult content:', is_adult_content);
          console.log('Video data received:', { title: videoData.title, url: videoData.download_url });
          
          const trendingResult = await trendingService.handleVideoDownload(
            { ...videoData, originalUrl: videoUrl }, 
            is_adult_content, 
            userInfo
          );

          console.log('Trending result:', trendingResult);

          // Merge results
          const response = {
            ...videoData,
            trending: {
              isDuplicate: trendingResult.isDuplicate,
              downloadCount: trendingResult.downloadCount,
              message: trendingResult.message
            }
          };

          // If it's adult content, use R2 URL regardless of duplicate status
          if (is_adult_content && trendingResult.downloadUrl) {
            response.download_url = trendingResult.downloadUrl;
            response.filename = trendingResult.isDuplicate 
              ? `trending_video_${trendingResult.downloadCount}.mp4`
              : `new_trending_video.mp4`;
            console.log('Using R2 URL for adult content:', response.download_url);
          } else if (is_adult_content) {
            console.error('Adult content selected but no R2 URL returned:', trendingResult);
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

// Fetch video data from your existing Twitter API
async function fetchVideoData(url: string, isAdult: boolean, isNonAdult: boolean) {
  try {
    // Use your existing API endpoint 
    const apiUrl = 'https://apitest.rdownload.org/twitter/video-fetch';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        is_adult_content: isAdult,
        is_non_adult_content: isNonAdult
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching video data:', error);
    throw error;
  }
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