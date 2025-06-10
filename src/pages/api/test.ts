// This is a mock endpoint for testing purposes
// In production, this will use the actual Twitter API

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { url, adult } = await request.json();
    
    // Basic URL validation
    if (!url || (!url.includes('twitter.com') && !url.includes('x.com'))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid Twitter/X URL provided'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Mock response for testing
    const mockResponse = {
      success: true,
      message: 'Video found successfully',
      videos: [
        {
          url: 'https://example.com/mock-video.mp4',
          quality: '720p',
          size: '15.2 MB'
        },
        {
          url: 'https://example.com/mock-video-hd.mp4',
          quality: '1080p',
          size: '32.8 MB'
        }
      ],
      tweet: {
        id: '123456789',
        text: 'Sample tweet with video',
        author: '@example'
      }
    };

    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid request format'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}; 