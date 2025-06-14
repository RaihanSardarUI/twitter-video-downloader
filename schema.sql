-- Twitter Video Storage Database Schema
-- For Cloudflare D1

-- Videos table - stores all uploaded video metadata
CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    twitter_url TEXT NOT NULL,
    title TEXT NOT NULL,
    thumbnail_url TEXT,
    r2_key TEXT NOT NULL UNIQUE,
    file_size INTEGER NOT NULL,
    quality TEXT NOT NULL,
    content_hash TEXT NOT NULL UNIQUE,
    content_type TEXT NOT NULL CHECK (content_type IN ('adult', 'general')),
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    trending_score REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table - anonymous user session tracking
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    preferences TEXT, -- JSON string
    view_history TEXT, -- JSON array of video IDs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Video analytics table - time-based metrics
CREATE TABLE IF NOT EXISTS video_analytics (
    video_id TEXT PRIMARY KEY,
    views_24h INTEGER DEFAULT 0,
    views_7d INTEGER DEFAULT 0,
    views_30d INTEGER DEFAULT 0,
    downloads_24h INTEGER DEFAULT 0,
    downloads_7d INTEGER DEFAULT 0,
    downloads_30d INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

-- Trending cache table - pre-computed trending lists
CREATE TABLE IF NOT EXISTS trending_cache (
    period TEXT PRIMARY KEY CHECK (period IN ('24h', '7d', '30d')),
    video_ids TEXT NOT NULL, -- JSON array of video IDs
    min_score REAL DEFAULT 0.0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_content_hash ON videos(content_hash);
CREATE INDEX IF NOT EXISTS idx_videos_content_type ON videos(content_type);
CREATE INDEX IF NOT EXISTS idx_videos_trending_score ON videos(trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_video_analytics_video_id ON video_analytics(video_id);

-- Triggers to automatically update timestamps
CREATE TRIGGER IF NOT EXISTS update_videos_timestamp 
    AFTER UPDATE ON videos
    BEGIN
        UPDATE videos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_sessions_timestamp 
    AFTER UPDATE ON sessions
    BEGIN
        UPDATE sessions SET last_active = CURRENT_TIMESTAMP WHERE session_id = NEW.session_id;
    END;

-- Trigger to create analytics record when video is inserted
CREATE TRIGGER IF NOT EXISTS create_video_analytics 
    AFTER INSERT ON videos
    BEGIN
        INSERT INTO video_analytics (video_id) VALUES (NEW.id);
    END; 