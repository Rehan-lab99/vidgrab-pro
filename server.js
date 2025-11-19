const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

// Real download statistics (no fake numbers)
let stats = {
    downloads: 0,
    lastDownload: null
};

// Real video download
app.get('/api/download', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        const quality = req.query.quality || 'highest';

        if (!videoUrl) {
            return res.status(400).json({ error: 'YouTube URL required' });
        }

        if (!ytdl.validateURL(videoUrl)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '_');

        // Update real stats
        stats.downloads++;
        stats.lastDownload = new Date().toISOString();

        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');

        ytdl(videoUrl, {
            quality: quality,
            filter: format => format.container === 'mp4'
        }).pipe(res);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed. Try another video.' });
    }
});

// Get video info
app.get('/api/info', async (req, res) => {
    try {
        const videoUrl = req.query.url;

        if (!videoUrl) {
            return res.status(400).json({ error: 'URL required' });
        }

        const info = await ytdl.getInfo(videoUrl);
        
        const videoInfo = {
            title: info.videoDetails.title,
            duration: formatTime(info.videoDetails.lengthSeconds),
            thumbnail: info.videoDetails.thumbnails[3]?.url || info.videoDetails.thumbnails[0]?.url,
            author: info.videoDetails.author.name,
            qualities: getAvailableQualities(info.formats)
        };

        res.json(videoInfo);

    } catch (error) {
        res.status(500).json({ error: 'Failed to get video info' });
    }
});

// Get available qualities
function getAvailableQualities(formats) {
    const qualities = new Set();
    
    formats.forEach(format => {
        if (format.qualityLabel && format.hasVideo && format.hasAudio) {
            qualities.add(format.qualityLabel);
        }
    });

    return Array.from(qualities).sort((a, b) => {
        return parseInt(b) - parseInt(a);
    });
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/stats', (req, res) => {
    res.json(stats);
});

app.listen(PORT, () => {
    console.log(`YouTube Downloader running on port ${PORT}`);
});
