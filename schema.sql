-- Video downloads table for trending system
CREATE TABLE IF NOT EXISTS video_downloads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tweet_id TEXT UNIQUE NOT NULL,
  video_url TEXT NOT NULL,
  canonical_url TEXT,
  title TEXT,
  uploader TEXT,
  duration INTEGER,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  content_hash TEXT UNIQUE,
  file_hash TEXT,
  thumbnail_hash TEXT,
  r2_object_key TEXT,
  r2_public_url TEXT,
  file_size INTEGER,
  content_rating TEXT DEFAULT 'adult',
  download_count INTEGER DEFAULT 1,
  first_downloaded DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_downloaded DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast duplicate detection and trending queries
CREATE INDEX IF NOT EXISTS idx_tweet_id ON video_downloads(tweet_id);
CREATE INDEX IF NOT EXISTS idx_content_hash ON video_downloads(content_hash);
CREATE INDEX IF NOT EXISTS idx_file_hash ON video_downloads(file_hash);
CREATE INDEX IF NOT EXISTS idx_download_count ON video_downloads(download_count DESC);
CREATE INDEX IF NOT EXISTS idx_last_downloaded ON video_downloads(last_downloaded DESC);
CREATE INDEX IF NOT EXISTS idx_created_at ON video_downloads(created_at DESC);

-- Trending analytics table for pre-computed trending data
CREATE TABLE IF NOT EXISTS trending_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  period_type TEXT NOT NULL, -- '24h', '7d', '30d'
  period_start DATETIME NOT NULL,
  period_end DATETIME NOT NULL,
  download_count INTEGER DEFAULT 0,
  rank_position INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (video_id) REFERENCES video_downloads(id)
);

-- Index for trending queries
CREATE INDEX IF NOT EXISTS idx_trending_period ON trending_analytics(period_type, period_start, rank_position);

-- Download history for detailed analytics
CREATE TABLE IF NOT EXISTS download_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id INTEGER NOT NULL,
  downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_ip TEXT,
  user_agent TEXT,
  FOREIGN KEY (video_id) REFERENCES video_downloads(id)
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_download_history_video ON download_history(video_id, downloaded_at DESC); 