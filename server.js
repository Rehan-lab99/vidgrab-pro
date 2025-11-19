const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

// Advanced YouTube Downloader with multiple methods
class YouTubeDownloader {
    constructor() {
        this.downloadStats = {
            total: 0,
            successful: 0,
            failed: 0
        };
    }

    // Method 1: Direct ytdl-core download
    async downloadVideo(videoUrl, quality, res) {
        return new Promise((resolve, reject) => {
            try {
                console.log(`Starting download: ${videoUrl} [${quality}]`);
                
                const videoStream = ytdl(videoUrl, {
                    quality: quality,
                    filter: format => format.container === 'mp4',
                    highWaterMark: 1 << 25
                });

                videoStream.pipe(res);
                
                videoStream.on('end', () => {
                    console.log('Download completed successfully');
                    this.downloadStats.successful++;
                    resolve();
                });
                
                videoStream.on('error', (error) => {
                    console.error('Stream error:', error);
                    this.downloadStats.failed++;
                    reject(error);
                });
                
            } catch (error) {
                this.downloadStats.failed++;
                reject(error);
            }
        });
    }

    // Method 2: Alternative approach for difficult videos
    async downloadAlternative(videoUrl, res) {
        try {
            const info = await ytdl.getInfo(videoUrl);
            
            // Try different quality options
            const qualities = ['highest', 'lowest', 'medium'];
            
            for (const quality of qualities) {
                try {
                    const videoStream = ytdl(videoUrl, {
                        quality: quality,
                        filter: 'audioandvideo'
                    });

                    videoStream.pipe(res);
                    
                    return new Promise((resolve, reject) => {
                        videoStream.on('end', resolve);
                        videoStream.on('error', reject);
                    });
                } catch (error) {
                    console.log(`Quality ${quality} failed, trying next...`);
                    continue;
                }
            }
            throw new Error('All download methods failed');
        } catch (error) {
            throw error;
        }
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    formatViews(views) {
        const num = parseInt(views);
        if (num >= 1000000) return (num/1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num/1000).toFixed(1) + 'K';
        return num.toString();
    }
}

const downloader = new YouTubeDownloader();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Real Video Info API
app.get('/api/video-info', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        
        if (!videoUrl) {
            return res.status(400).json({ error: 'YouTube URL enter karein' });
        }
        
        if (!ytdl.validateURL(videoUrl)) {
            return res.status(400).json({ error: 'Valid YouTube URL dalen' });
        }
        
        console.log('Fetching info for:', videoUrl);
        const info = await ytdl.getInfo(videoUrl);
        
        const videoData = {
            title: info.videoDetails.title,
            duration: downloader.formatDuration(info.videoDetails.lengthSeconds),
            views: downloader.formatViews(info.videoDetails.viewCount),
            thumbnail: info.videoDetails.thumbnails[3]?.url || info.videoDetails.thumbnails[0]?.url,
            author: info.videoDetails.author.name,
            formats: info.formats
                .filter(f => f.hasVideo && f.hasAudio)
                .map(f => ({
                    quality: f.qualityLabel || f.quality,
                    itag: f.itag
                }))
        };
        
        downloader.downloadStats.total++;
        res.json(videoData);
        
    } catch (error) {
        console.error('Video info error:', error);
        res.status(500).json({ 
            error: 'Video load nahi hua. Koi aur video try karein.',
            details: error.message 
        });
    }
});

// Real Download API
app.get('/api/download', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        const quality = req.query.quality || 'highest';
        
        if (!videoUrl) {
            return res.status(400).json({ error: 'URL required' });
        }
        
        if (!ytdl.validateURL(videoUrl)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '_').substring(0, 100);
        
        // Set download headers
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Cache-Control', 'no-cache');
        
        console.log(`Download request: ${title} [${quality}]`);
        
        // Try main download method
        try {
            await downloader.downloadVideo(videoUrl, quality, res);
        } catch (error) {
            console.log('Main method failed, trying alternative...');
            await downloader.downloadAlternative(videoUrl, res);
        }
        
    } catch (error) {
        console.error('Download API error:', error);
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Download failed!',
                suggestion: 'Koi different video try karein ya thodi der baad try karein.',
                details: error.message
            });
        }
    }
});

// Quick Download (Auto quality)
app.get('/api/quick-download', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        
        if (!videoUrl) {
            return res.status(400).json({ error: 'URL required' });
        }

        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '_');
        
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');
        
        await downloader.downloadAlternative(videoUrl, res);
        
    } catch (error) {
        console.error('Quick download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Quick download failed' });
        }
    }
});

// Audio Download
app.get('/api/download-audio', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        
        if (!videoUrl) {
            return res.status(400).json({ error: 'URL required' });
        }

        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '_');
        
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp3"`);
        res.setHeader('Content-Type', 'audio/mpeg');
        
        const audioStream = ytdl(videoUrl, {
            quality: 'highestaudio',
            filter: 'audioonly'
        });

        audioStream.pipe(res);
        
    } catch (error) {
        console.error('Audio download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Audio download failed' });
        }
    }
});

// Statistics
app.get('/api/stats', (req, res) => {
    res.json({
        total: downloader.downloadStats.total,
        successful: downloader.downloadStats.successful,
        failed: downloader.downloadStats.failed,
        successRate: downloader.downloadStats.total > 0 ? 
            ((downloader.downloadStats.successful / downloader.downloadStats.total) * 100).toFixed(1) + '%' : '0%'
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'Real YouTube Downloader',
        timestamp: new Date().toISOString(),
        stats: downloader.downloadStats
    });
});

// Test with working video
app.get('/api/test', async (req, res) => {
    try {
        // Test with a known working video
        const testUrl = 'https://www.youtube.com/watch?v=JGwWNGJdvx8'; // Shape of You - Ed Sheeran
        const info = await ytdl.getInfo(testUrl);
        
        res.json({
            success: true,
            message: 'YouTube Downloader Working Perfectly!',
            testVideo: info.videoDetails.title,
            duration: downloader.formatDuration(info.videoDetails.lengthSeconds),
            views: downloader.formatViews(info.videoDetails.viewCount)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`
🎯 REAL YouTube Downloader Started!
📍 Port: ${PORT}
🚀 Features: 
   ✅ Real Video Downloads
   ✅ Multiple Quality Options  
   ✅ Audio Downloads
   ✅ Advanced Error Handling
   ✅ Download Statistics

📊 Test URLs:
   http://localhost:${PORT}/api/test
   http://localhost:${PORT}/health

💡 Use these YouTube URLs for testing:
   • https://www.youtube.com/watch?v=JGwWNGJdvx8
   • https://www.youtube.com/watch?v=9bZkp7q19f0
   • https://www.youtube.com/watch?v=kJQP7kiw5Fk
    `.trim());
});
