import type { APIRoute } from 'astro';
import { generateContentHash, generateR2Key } from '../../../lib/utils';
import type { R2UploadRequest, R2UploadResponse } from '../../../lib/utils';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: R2UploadRequest = await request.json();
    const { video_url, video_data, content_type } = body;

    if (!video_url || !video_data || !content_type) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required fields: video_url, video_data, content_type'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Only store adult content to R2
    if (content_type !== 'adult') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only adult content is stored to R2'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the best quality video URL
    const bestVideo = video_data.available_qualities?.find(q => q.quality === 'best') || 
                     video_data.available_qualities?.[0];
    
    if (!bestVideo?.url) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No video URL found'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Download video to get content for hashing
    const videoResponse = await fetch(bestVideo.url);
    if (!videoResponse.ok) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to download video'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const contentHash = await generateContentHash(videoBuffer);
    
    // Generate R2 key
    const filename = bestVideo.filename || video_data.filename || 'video.mp4';
    const r2Key = generateR2Key(contentHash, filename);

    // Check if video already exists in R2 (using Cloudflare binding)
    const r2Bucket = (globalThis as any).VIDEOS; // R2 binding
    
    try {
      const existingObject = await r2Bucket.head(r2Key);
      if (existingObject) {
        // Update download count in database if exists
        const db = (globalThis as any).DB; // D1 binding
        if (db) {
          await db.prepare(`
            UPDATE videos 
            SET download_count = download_count + 1, updated_at = datetime('now')
            WHERE content_hash = ?
          `).bind(contentHash).run();
        }

        return new Response(JSON.stringify({
          success: true,
          r2_key: r2Key,
          content_hash: contentHash,
          file_size: videoBuffer.byteLength,
          duplicate: true,
          message: 'Video already exists in storage'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      // Object doesn't exist, continue with upload
    }

    // Upload to R2
    const uploadResult = await r2Bucket.put(r2Key, videoBuffer, {
      httpMetadata: {
        contentType: 'video/mp4',
        contentDisposition: `attachment; filename="${filename}"`
      },
      customMetadata: {
        'twitter-url': video_data.download_url,
        'title': video_data.title || 'Twitter Video',
        'uploader': video_data.uploader || 'Unknown',
        'content-type': content_type,
        'original-filename': filename,
        'upload-date': new Date().toISOString()
      }
    });

    if (!uploadResult) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to upload to R2'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Store metadata in D1 database
    const db = (globalThis as any).DB; // D1 binding
    if (db) {
      try {
        await db.prepare(`
          INSERT INTO videos (
            id, twitter_url, title, thumbnail_url, r2_key, file_size, 
            quality, content_hash, content_type, view_count, download_count, 
            trending_score, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          crypto.randomUUID(),
          video_data.download_url,
          video_data.title || 'Twitter Video',
          video_data.thumbnail || null,
          r2Key,
          videoBuffer.byteLength,
          bestVideo.quality || 'unknown',
          contentHash,
          content_type,
          0, // initial view_count
          1, // initial download_count
          0  // initial trending_score
        ).run();
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue even if DB fails - video is already uploaded to R2
      }
    }

    const response: R2UploadResponse = {
      success: true,
      r2_key: r2Key,
      content_hash: contentHash,
      file_size: videoBuffer.byteLength,
      duplicate: false,
      message: 'Video uploaded successfully'
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 