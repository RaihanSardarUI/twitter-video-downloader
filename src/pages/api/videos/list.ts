import type { APIRoute } from 'astro';
import type { StoredVideo } from '../../../lib/utils';

export const GET: APIRoute = async ({ url }) => {
  try {
    const searchParams = new URL(url).searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const contentType = searchParams.get('content_type') || 'all';

    // Get D1 database binding
    const db = (globalThis as any).DB;
    if (!db) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build query based on content type filter
    let query = `
      SELECT 
        id, twitter_url, title, thumbnail_url, r2_key, file_size, 
        quality, content_hash, content_type, view_count, download_count, 
        trending_score, created_at, updated_at
      FROM videos
    `;
    
    const params: any[] = [];
    
    if (contentType !== 'all') {
      query += ' WHERE content_type = ?';
      params.push(contentType);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Execute query
    const result = await db.prepare(query).bind(...params).all();
    
    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database query failed'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM videos';
    const countParams: any[] = [];
    
    if (contentType !== 'all') {
      countQuery += ' WHERE content_type = ?';
      countParams.push(contentType);
    }
    
    const countResult = await db.prepare(countQuery).bind(...countParams).first();
    const total = countResult?.total || 0;

    const videos: StoredVideo[] = result.results.map((row: any) => ({
      id: row.id,
      twitter_url: row.twitter_url,
      title: row.title,
      thumbnail_url: row.thumbnail_url,
      r2_key: row.r2_key,
      file_size: row.file_size,
      quality: row.quality,
      content_hash: row.content_hash,
      content_type: row.content_type,
      view_count: row.view_count,
      download_count: row.download_count,
      trending_score: row.trending_score,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    return new Response(JSON.stringify({
      success: true,
      videos,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('List videos error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 