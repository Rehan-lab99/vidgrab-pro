const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Render-specific settings
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Enhanced YouTube Downloader
class YouTubeDownloader {
    async getVideoInfo(videoUrl) {
        try {
            if (!ytdl.validateURL(videoUrl)) {
                throw new Error('Invalid YouTube URL');
            }

            const info = await ytdl.getInfo(videoUrl);
            return {
                title: info.videoDetails.title,
                duration: this.formatDuration(info.videoDetails.lengthSeconds),
                views: this.formatViews(info.videoDetails.viewCount),
                thumbnail: info.videoDetails.thumbnails[3]?.url || info.videoDetails.thumbnails[0]?.url,
                author: info.videoDetails.author.name,
                description: info.videoDetails.description?.substring(0, 150) + '...'
            };
        } catch (error) {
            throw new Error(`Video info failed: ${error.message}`);
        }
    }

    async downloadVideo(videoUrl, quality, res) {
        return new Promise((resolve, reject) => {
            try {
                const videoStream = ytdl(videoUrl, {
                    quality: quality,
                    filter: format => format.container === 'mp4',
                    highWaterMark: 1 << 25
                });

                videoStream.pipe(res);
                
                videoStream.on('end', resolve);
                videoStream.on('error', reject);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    formatViews(views) {
        const num = parseInt(views);
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}

const downloader = new YouTubeDownloader();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Video Info API
app.get('/api/video-info', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        
        if (!videoUrl) {
            return res.status(400).json({ error: 'YouTube URL is required' });
        }

        const videoInfo = await downloader.getVideoInfo(videoUrl);
        res.json(videoInfo);

    } catch (error) {
        console.error('Video info error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Download API
app.get('/api/download', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        const quality = req.query.quality || 'highest';

        if (!videoUrl) {
            return res.status(400).json({ error: 'YouTube URL is required' });
        }

        const videoInfo = await downloader.getVideoInfo(videoUrl);
        const filename = videoInfo.title.replace(/[^\w\s]/gi, '_') + '.mp4';

        res.header('Content-Disposition', `attachment; filename="${filename}"`);
        res.header('Content-Type', 'video/mp4');

        await downloader.downloadVideo(videoUrl, quality, res);

    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed: ' + error.message });
        }
    }
});

// Health check for Render
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'VidGrab Pro',
        environment: isProduction ? 'production' : 'development',
        timestamp: new Date().toISOString()
    });
});

// Render needs this for health checks
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🎯 VidGrab Pro Live on Render!
📍 Port: ${PORT}
🌐 Environment: ${isProduction ? 'Production' : 'Development'}
🚀 Server: http://0.0.0.0:${PORT}
    `.trim());
});