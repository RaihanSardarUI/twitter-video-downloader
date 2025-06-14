# Cloudflare Deployment Guide - R2 Upload Functionality

## Prerequisites

1. **Cloudflare Account** with Pages, R2, D1, and KV enabled
2. **Wrangler CLI** installed: `npm install -g wrangler`
3. **Git repository** connected to Cloudflare Pages

## Step 1: Create Cloudflare Resources

### 1.1 Create D1 Database

```bash
# Create production database
wrangler d1 create twitter-reels-db

# Create preview database
wrangler d1 create twitter-reels-db-preview
```

**Note the database IDs** returned and update `wrangler.toml`:
- Replace `your-d1-database-id` with production database ID
- Replace `your-preview-d1-database-id` with preview database ID

### 1.2 Create R2 Buckets

```bash
# Create production bucket
wrangler r2 bucket create twitter-videos-storage

# Create preview bucket  
wrangler r2 bucket create twitter-videos-storage-preview
```

### 1.3 Create KV Namespaces

```bash
# Create production KV namespace
wrangler kv:namespace create "CACHE"

# Create preview KV namespace
wrangler kv:namespace create "CACHE" --preview
```

**Note the namespace IDs** and update `wrangler.toml`:
- Replace `your-kv-namespace-id` with production namespace ID
- Replace `your-preview-kv-namespace-id` with preview namespace ID

## Step 2: Initialize Database Schema

```bash
# Apply schema to production database
wrangler d1 execute twitter-reels-db --file=./schema.sql

# Apply schema to preview database
wrangler d1 execute twitter-reels-db-preview --file=./schema.sql
```

## Step 3: Configure R2 CORS (Optional)

If you need direct browser access to R2:

```bash
# Create CORS configuration file
cat > cors.json << EOF
[
  {
    "AllowedOrigins": ["https://your-domain.pages.dev"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
EOF

# Apply CORS to production bucket
wrangler r2 bucket cors put twitter-videos-storage --file=cors.json

# Apply CORS to preview bucket
wrangler r2 bucket cors put twitter-videos-storage-preview --file=cors.json
```

## Step 4: Update Cloudflare Pages Settings

### 4.1 Connect Repository
1. Go to Cloudflare Dashboard → Pages
2. Create new project or select existing
3. Connect your Git repository

### 4.2 Configure Build Settings
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Node.js version**: `18` or higher

### 4.3 Add Environment Variables
In Pages → Settings → Environment Variables:

**Production:**
- `PUBLIC_API_BASE_URL`: `https://your-domain.pages.dev/api`

**Preview:**
- `PUBLIC_API_BASE_URL`: `https://preview-branch.your-domain.pages.dev/api`

### 4.4 Configure Bindings
In Pages → Settings → Functions:

**Production Bindings:**
- D1 Database: `DB` → `twitter-reels-db`
- R2 Bucket: `VIDEOS` → `twitter-videos-storage`
- KV Namespace: `CACHE` → `your-kv-namespace-id`

**Preview Bindings:**
- D1 Database: `DB` → `twitter-reels-db-preview`
- R2 Bucket: `VIDEOS` → `twitter-videos-storage-preview`
- KV Namespace: `CACHE` → `your-preview-kv-namespace-id`

## Step 5: Deploy

### 5.1 Deploy via Git
```bash
git add .
git commit -m "Add R2 upload functionality"
git push origin main
```

### 5.2 Deploy via Wrangler (Alternative)
```bash
# Build the project
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=twitter-video-downloader
```

## Step 6: Test R2 Upload

### 6.1 Test Adult Content Upload
1. Visit your deployed site
2. Enter a Twitter URL
3. Select "Adult Content"
4. Submit the form
5. Check for upload success message

### 6.2 Verify Storage
```bash
# List objects in R2 bucket
wrangler r2 object list twitter-videos-storage

# Check database records
wrangler d1 execute twitter-reels-db --command="SELECT * FROM videos LIMIT 5;"
```

## Step 7: Monitor and Debug

### 7.1 View Logs
```bash
# View function logs
wrangler pages deployment tail --project-name=twitter-video-downloader
```

### 7.2 Common Issues

**"Binding not found" errors:**
- Verify bindings are configured in Pages dashboard
- Check `wrangler.toml` binding names match exactly

**"Database not found" errors:**
- Ensure D1 database is created and schema applied
- Verify database ID in `wrangler.toml`

**"R2 upload failed" errors:**
- Check R2 bucket exists and is accessible
- Verify R2 binding configuration

**"Network error" during upload:**
- Check if video URL is accessible
- Verify content type detection logic

## Step 8: Production Optimizations

### 8.1 Enable Cron Triggers
Cron triggers are automatically configured in `wrangler.toml` for:
- View count updates (every 15 minutes)
- Trending calculations (every hour)  
- Cache refresh (every 6 hours)

### 8.2 Set Up Custom Domain (Optional)
1. Go to Pages → Custom domains
2. Add your domain
3. Update DNS records as instructed
4. Update `PUBLIC_API_BASE_URL` environment variable

### 8.3 Monitor Usage
- **R2 Storage**: Monitor storage usage and costs
- **D1 Database**: Track query performance and limits
- **KV Operations**: Monitor read/write operations

## Architecture Summary

```
User Input (Adult Content) 
    ↓
Twitter Video Fetch API
    ↓
R2 Upload API (/api/video/upload)
    ↓
Content Hash Generation (SHA-256)
    ↓
Deduplication Check (R2 + D1)
    ↓
R2 Storage + D1 Metadata
    ↓
Success Response with R2 Key
```

## Security Notes

- Adult content is automatically stored in R2 for secure access
- Content hashing prevents duplicate storage
- All uploads are server-side processed
- No direct client access to R2 buckets
- Database triggers maintain data consistency

## Cost Optimization

- **Deduplication**: Prevents storing duplicate videos
- **Best Quality Only**: Stores only the highest quality version
- **Metadata in D1**: Reduces R2 metadata costs
- **KV Caching**: Reduces D1 query costs for trending data

Your R2 upload functionality is now ready for production use! 