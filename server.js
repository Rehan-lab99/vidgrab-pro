const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

// Enhanced YouTube Downloader
app.get('/api/video-info', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        
        if (!videoUrl) {
            return res.status(400).json({ error: 'YouTube URL dalen' });
        }
        
        if (!ytdl.validateURL(videoUrl)) {
            return res.status(400).json({ error: 'Valid YouTube URL dalen' });
        }
        
        const info = await ytdl.getInfo(videoUrl);
        
        const videoData = {
            title: info.videoDetails.title,
            duration: formatTime(info.videoDetails.lengthSeconds),
            views: formatViews(info.videoDetails.viewCount),
            thumbnail: info.videoDetails.thumbnails[3]?.url || info.videoDetails.thumbnails[0]?.url,
            author: info.videoDetails.author.name,
            formats: info.formats.filter(f => f.hasVideo && f.hasAudio).map(f => ({
                quality: f.qualityLabel,
                itag: f.itag
            }))
        };
        
        res.json(videoData);
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Video load nahi hua. Dobara try karein.' });
    }
});

// Actual Download - Working
app.get('/api/download', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        const quality = req.query.quality || 'highest';
        
        if (!videoUrl) {
            return res.status(400).json({ error: 'URL required' });
        }
        
        const info = await ytdl.getInfo(videoUrl);
        const title = cleanFilename(info.videoDetails.title);
        
        // Set download headers
        res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.header('Content-Type', 'video/mp4');
        
        // Download stream
        ytdl(videoUrl, {
            quality: quality,
            filter: format => format.container === 'mp4'
        }).pipe(res);
        
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed. Kisi aur video se try karein.' });
    }
});

// Helper functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatViews(views) {
    const num = parseInt(views);
    if (num >= 1000000) return (num/1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num/1000).toFixed(1) + 'K';
    return num;
}

function cleanFilename(name) {
    return name.replace(/[^\w\s]/gi, '').substring(0, 50);
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', time: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`🚀 Professional YouTube Downloader running on port ${PORT}`);
});
