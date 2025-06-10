# Twitter Video Downloader

A beautiful, modern Twitter video downloader built with Astro and Tailwind CSS. This application allows users to easily download videos from Twitter/X posts by simply pasting the tweet URL.

## Features

- 🚀 **Fast Downloads**: Optimized API integration for quick video retrieval
- 🎥 **High Quality**: Download videos in their original quality
- 🔒 **Secure & Private**: No data stored on servers
- 📱 **Responsive Design**: Works perfectly on desktop and mobile
- ✨ **Modern UI**: Beautiful, intuitive interface with smooth animations

## API Integration

This application integrates with the Twitter Video Downloader API hosted at:
- **API Base URL**: `https://twitter-api.rhnsardar4.workers.dev/`
- **Main Endpoint**: `POST /video/fetch`

### API Endpoints Used

- `POST /video/fetch` - Fetch video from Twitter URL
- `GET /auth/status` - Check authentication status
- `GET /cache/stats` - Get cache statistics

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository or navigate to your project directory
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:4321`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

1. Open the application in your browser
2. Paste a Twitter/X URL into the input field
   - Example: `https://x.com/user/status/123456789`
3. Optionally check "Allow adult content" if needed
4. Click "Download Video"
5. Wait for the API to process the request
6. Download the video(s) when they appear

## Project Structure

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── pages/
│   │   ├── index.astro       # Main application page
│   │   └── api/
│   │       └── test.js       # Mock API endpoint for testing
│   └── ...
├── astro.config.mjs          # Astro configuration
├── tailwind.config.mjs       # Tailwind CSS configuration
├── package.json
└── README.md
```

## Technical Details

- **Framework**: Astro
- **Styling**: Tailwind CSS
- **API**: Twitter Video Downloader API
- **Build**: Static site generation

## API Response Format

The API returns responses in the following format:

```json
{
  "success": true,
  "message": "Video found successfully",
  "videos": [
    {
      "url": "https://example.com/video.mp4",
      "quality": "720p",
      "size": "15.2 MB"
    }
  ],
  "tweet": {
    "id": "123456789",
    "text": "Tweet text",
    "author": "@username"
  }
}
```

## Development Notes

- The application includes a mock API endpoint (`/api/test`) for testing purposes
- In production, it uses the live Twitter Video Downloader API
- The UI is fully responsive and includes loading states and error handling
- CORS considerations are handled by the external API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and personal use. Please respect Twitter's terms of service and copyright policies when downloading content.

## Support

If you encounter any issues with the API, please refer to the API documentation or contact the API provider at `https://twitter-api.rhnsardar4.workers.dev/`
